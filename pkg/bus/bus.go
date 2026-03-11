package bus

import (
	"context"
	"sync"
	"sync/atomic"
	"time"

	"github.com/sirupsen/logrus"
)

// Subscriber 内部订阅者包装类
type subscriber[T any] struct {
	name string
	ch   chan T

	// 统计数据 (热路径使用 atomic 更新)
	enqueued uint64 // 成功推入通道的消息总数
	dropped  uint64 // 因阻塞而丢弃的消息总数

	// 速率计算状态 (由 Monitor 协程更新)
	consumeRate  uint64 // 当前消费速率 (条/秒)
	lastConsumed uint64 // 上一秒的总消费量
}

// EventBus 带有可观测性的极简事件总线
type EventBus[T any] struct {
	mu   sync.RWMutex
	subs map[chan T]*subscriber[T]

	// 全局统计数据
	totalPublished uint64 // 发布的总消息数
	pubRate        uint64 // 当前发布速率 (条/秒)
	lastPubTotal   uint64 // 上一秒的发布总量
}

// NewEventBus 创建总线，并启动后台监控协程
func NewEventBus[T any](ctx context.Context) *EventBus[T] {
	bus := &EventBus[T]{
		subs: make(map[chan T]*subscriber[T]),
	}

	// 启动后台统计监控协程，每秒计算一次速率
	go bus.monitor(ctx)

	return bus
}

// Publish 发布事件 (热路径：保持极速，只加原子计数)
func (b *EventBus[T]) Publish(event T) {
	atomic.AddUint64(&b.totalPublished, 1)

	b.mu.RLock()
	defer b.mu.RUnlock()

	for _, sub := range b.subs {
		select {
		case sub.ch <- event:
			atomic.AddUint64(&sub.enqueued, 1)
		default:
			atomic.AddUint64(&sub.dropped, 1) // 记录被丢弃的消息
		}
	}
}

// Subscribe 订阅事件，增加 name 入参
func (b *EventBus[T]) Subscribe(name string, bufferSize int) (<-chan T, func()) {
	ch := make(chan T, bufferSize)
	sub := &subscriber[T]{
		name: name,
		ch:   ch,
	}

	b.mu.Lock()
	b.subs[ch] = sub
	b.mu.Unlock()

	unsubscribe := func() {
		b.mu.Lock()
		if _, exists := b.subs[ch]; exists {
			delete(b.subs, ch)
			close(ch)
		}
		b.mu.Unlock()
	}

	return ch, unsubscribe
}

// ---------------- 可观测性部分 ----------------

// BusStats 总线观测指标视图
type BusStats struct {
	PublishRate    uint64
	TotalPublished uint64
	Consumers      []ConsumerStats
}

// ConsumerStats 消费者观测指标视图
type ConsumerStats struct {
	Name        string
	Backlog     int    // 当前积压数量
	ConsumeRate uint64 // 消费速率 (条/秒)
	Dropped     uint64 // 丢弃总数
}

// GetStats 获取当前时刻的总线运行指标
func (b *EventBus[T]) GetStats() BusStats {
	b.mu.RLock()
	defer b.mu.RUnlock()

	stats := BusStats{
		PublishRate:    atomic.LoadUint64(&b.pubRate),
		TotalPublished: atomic.LoadUint64(&b.totalPublished),
		Consumers:      make([]ConsumerStats, 0, len(b.subs)),
	}

	for _, sub := range b.subs {
		stats.Consumers = append(stats.Consumers, ConsumerStats{
			Name:        sub.name,
			Backlog:     len(sub.ch), // len() 在 channel 上是并发安全的
			ConsumeRate: atomic.LoadUint64(&sub.consumeRate),
			Dropped:     atomic.LoadUint64(&sub.dropped),
		})
	}

	return stats
}

// monitor 后台每秒计算一次速率
func (b *EventBus[T]) monitor(ctx context.Context) {
	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			// 1. 计算全局发布速率
			currentPub := atomic.LoadUint64(&b.totalPublished)
			atomic.StoreUint64(&b.pubRate, currentPub-b.lastPubTotal)
			b.lastPubTotal = currentPub

			// 2. 计算每个消费者的消费速率
			b.mu.RLock()
			for _, sub := range b.subs {
				enqueued := atomic.LoadUint64(&sub.enqueued)
				currentBacklog := uint64(len(sub.ch))

				// 核心推导：成功入队的数 - 当前还在队里的数 = 已经被消费者拿走的数
				totalConsumed := enqueued - currentBacklog

				// 当前消费量减去上一秒的消费量，即为这一秒的消费速率
				rate := totalConsumed - sub.lastConsumed
				atomic.StoreUint64(&sub.consumeRate, rate)

				sub.lastConsumed = totalConsumed
			}
			b.mu.RUnlock()
		}
	}
}

func (b *EventBus[T]) NewConsumer(name string, bufferSize int, handler func(ctx context.Context, event T) error) *Consumer[T] {
	// 复用底层的 Subscribe 获取 channel 和注销函数
	ch, unsub := b.Subscribe(name, bufferSize)

	return &Consumer[T]{
		Name:    name,
		handler: handler,
		ch:      ch,
		unsub:   unsub,
	}
}

type Consumer[T any] struct {
	Name    string
	handler func(ctx context.Context, event T) error
	ch      <-chan T
	unsub   func()
}

// Start 启动后台消费协程
func (c *Consumer[T]) Start(ctx context.Context) {
	go func() {
		// 1. 保证协程退出时（例如 Context 被取消），自动解绑，防止内存泄漏
		defer c.unsub()

		for {
			select {
			case <-ctx.Done():
				// 监听到 Context 取消，优雅退出协程
				return
			case event, ok := <-c.ch:
				if !ok {
					// Channel 被关闭时安全退出
					return
				}

				// 2. 将业务执行逻辑封装在一个匿名函数中，专门用于捕获单次消费的 Panic
				func() {
					defer func() {
						if r := recover(); r != nil {
							// 在实际生产中，这里应该接入你的日志系统 (如 zap, logrus)
							// 并最好打印出 stack trace (debug.Stack()) 以便排查问题
							logrus.Panicf("[Consumer][%s] Panic :%v", c.Name, r)
						}
					}()

					// 执行用户传入的业务逻辑
					if err := c.handler(ctx, event); err != nil {
						logrus.Errorf("[Consumer][%s] Error :%v", c.Name, err)
					}
				}()
			}
		}
	}()
}

// Stop 提供手动停止消费的方法
func (c *Consumer[T]) Stop() {
	c.unsub()
}

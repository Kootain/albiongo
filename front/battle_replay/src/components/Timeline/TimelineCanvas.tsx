import React, { useCallback, useEffect, useRef } from 'react';
import { useBattleStore } from '../../store/useBattleStore';
import { useTimelineStore } from '../../store/useTimelineStore';
import type { BattleEvent } from '../../types';
import { EVENT_TYPE_COLORS } from '../../types';

// ─── 渲染常量 ─────────────────────────────────────────────────────────────────
const HEADER_HEIGHT = 44;   // 时间轴头部高度（px）
const DOT_RADIUS = 4;
const DOT_GAP = 3;
const DOT_STEP = DOT_RADIUS * 2 + DOT_GAP;   // 每个事件点占用的纵向空间
const BUCKET_WIDTH_PX = DOT_RADIUS * 2 + 2;  // 横向 bucket 宽度（px）
const SCROLLBAR_WIDTH = 8;

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

/** 二分查找左边界（第一个 ts >= target 的索引） */
function bisectLeft(events: BattleEvent[], target: number): number {
  let lo = 0, hi = events.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (events[mid].ts < target) lo = mid + 1; else hi = mid;
  }
  return lo;
}

/** 二分查找右边界（第一个 ts > target 的索引） */
function bisectRight(events: BattleEvent[], target: number): number {
  let lo = 0, hi = events.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (events[mid].ts <= target) lo = mid + 1; else hi = mid;
  }
  return lo;
}

/** 格式化时间轴刻度标签（UTC HH:MM:SS） */
function formatTickLabel(ts: number): string {
  const d = new Date(ts);
  const h = String(d.getUTCHours()).padStart(2, '0');
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  const s = String(d.getUTCSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// ─── 组件 ─────────────────────────────────────────────────────────────────────

interface RenderedDot {
  event: BattleEvent;
  screenX: number;
  logicalY: number;  // 未减 scrollY 的绝对纵坐标
}

export const TimelineCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedDotsRef = useRef<RenderedDot[]>([]);
  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartTsRef = useRef(0);

  const filteredEvents = useBattleStore(s => s.filteredEvents);
  const showAllEvents = useBattleStore(s => s.showAllEvents);
  const session = useBattleStore(s => s.session);
  const isLive  = useBattleStore(s => s.isLive);

  const displayEvents = showAllEvents ? (session?.events ?? []) : filteredEvents;

  const viewport = useTimelineStore(s => s.viewport);
  const totalLogicalHeight = useTimelineStore(s => s.totalLogicalHeight);
  const selectEvent = useTimelineStore(s => s.selectEvent);
  const zoom = useTimelineStore(s => s.zoom);
  const pan = useTimelineStore(s => s.pan);
  const scrollBy = useTimelineStore(s => s.scrollBy);
  const setTotalLogicalHeight = useTimelineStore(s => s.setTotalLogicalHeight);

  // ─── 渲染主逻辑 ─────────────────────────────────────────────────────────────

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const { startTs, endTs, scrollY } = viewport;
    const timeRange = endTs - startTs;
    if (timeRange <= 0) return;

    // 清空
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, W, H);

    const contentW = W - SCROLLBAR_WIDTH;

    // ── 绘制时间轴头部 ────────────────────────────────────────────────────────
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, contentW, HEADER_HEIGHT);
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, HEADER_HEIGHT);
    ctx.lineTo(contentW, HEADER_HEIGHT);
    ctx.stroke();

    // 刻度线
    const tickCount = Math.floor(contentW / 80);
    const tickIntervalMs = Math.ceil(timeRange / tickCount / 1000) * 1000;

    ctx.fillStyle = '#71717a';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';

    const firstTick = Math.ceil(startTs / tickIntervalMs) * tickIntervalMs;
    for (let ts = firstTick; ts <= endTs; ts += tickIntervalMs) {
      const x = ((ts - startTs) / timeRange) * contentW;
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, HEADER_HEIGHT);
      ctx.lineTo(x, H);
      ctx.stroke();

      ctx.strokeStyle = '#52525b';
      ctx.beginPath();
      ctx.moveTo(x, HEADER_HEIGHT - 8);
      ctx.lineTo(x, HEADER_HEIGHT);
      ctx.stroke();

      ctx.fillStyle = '#71717a';
      ctx.fillText(formatTickLabel(ts), x, HEADER_HEIGHT - 12);
    }

    // ── 找出当前视口内的事件 ─────────────────────────────────────────────────
    const lo = bisectLeft(displayEvents, startTs);
    const hi = bisectRight(displayEvents, endTs);
    const visibleEvents = displayEvents.slice(lo, hi);

    // ── 按 X bucket 分组，计算堆叠位置 ───────────────────────────────────────
    const bucketMap = new Map<number, BattleEvent[]>();
    for (const ev of visibleEvents) {
      const x = ((ev.ts - startTs) / timeRange) * contentW;
      const bucketIdx = Math.floor(x / BUCKET_WIDTH_PX);
      if (!bucketMap.has(bucketIdx)) bucketMap.set(bucketIdx, []);
      bucketMap.get(bucketIdx)!.push(ev);
    }

    const dots: RenderedDot[] = [];
    let maxLogicalY = HEADER_HEIGHT;

    for (const [bucketIdx, bucketEvents] of bucketMap) {
      const bucketCenterX = (bucketIdx + 0.5) * BUCKET_WIDTH_PX;

      bucketEvents.forEach((ev, stackIdx) => {
        const logicalY = HEADER_HEIGHT + DOT_GAP + stackIdx * DOT_STEP + DOT_RADIUS;
        if (logicalY + DOT_RADIUS > maxLogicalY) maxLogicalY = logicalY + DOT_RADIUS;

        const screenY = logicalY - scrollY;
        // 纵向裁剪
        if (screenY + DOT_RADIUS < HEADER_HEIGHT || screenY - DOT_RADIUS > H) return;

        dots.push({ event: ev, screenX: bucketCenterX, logicalY });

        ctx.beginPath();
        ctx.arc(bucketCenterX, screenY, DOT_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = EVENT_TYPE_COLORS[ev.type];
        ctx.fill();
      });
    }

    renderedDotsRef.current = dots;

    // ── 更新总高度 ────────────────────────────────────────────────────────────
    const newTotalHeight = maxLogicalY + DOT_GAP + 20;
    if (Math.abs(newTotalHeight - totalLogicalHeight) > 20) {
      setTotalLogicalHeight(newTotalHeight);
    }

    // ── 绘制自定义滚动条 ──────────────────────────────────────────────────────
    const scrollableH = H - HEADER_HEIGHT;
    if (totalLogicalHeight > scrollableH) {
      const thumbH = Math.max(30, (scrollableH / totalLogicalHeight) * scrollableH);
      const thumbY = HEADER_HEIGHT + (scrollY / (totalLogicalHeight - scrollableH)) * (scrollableH - thumbH);

      ctx.fillStyle = '#27272a';
      ctx.fillRect(contentW, HEADER_HEIGHT, SCROLLBAR_WIDTH, scrollableH);

      ctx.fillStyle = '#52525b';
      ctx.beginPath();
      ctx.roundRect(contentW + 1, thumbY, SCROLLBAR_WIDTH - 2, thumbH, 3);
      ctx.fill();
    }
  }, [displayEvents, session, viewport, totalLogicalHeight, setTotalLogicalHeight]);

  // ─── 响应视口和数据变化 ──────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // 同步 canvas 尺寸
    const { width, height } = container.getBoundingClientRect();
    if (canvas.width !== Math.floor(width) || canvas.height !== Math.floor(height)) {
      canvas.width = Math.floor(width);
      canvas.height = Math.floor(height);
    }

    draw();
  });

  // ─── Canvas 尺寸同步（ResizeObserver） ────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(container);
    return () => ro.disconnect();
  }, [draw]);

  // ─── 鼠标事件：缩放（原生监听，passive:false 才能 preventDefault） ────────
  const handleWheelNative = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    if (e.ctrlKey || e.metaKey) {
      // Ctrl+滚轮：横向缩放
      const { startTs, endTs } = viewport;
      const timeRange = endTs - startTs;
      const anchorTs = startTs + (mouseX / canvas.width) * timeRange;
      const factor = e.deltaY < 0 ? 1.3 : 1 / 1.3;
      zoom(factor, anchorTs);
    } else {
      // 普通滚轮：纵向滚动
      scrollBy(e.deltaY);
    }
  }, [viewport, zoom, scrollBy]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheelNative);
  }, [handleWheelNative]);

  // ─── 鼠标事件：拖拽平移 ────────────────────────────────────────────────────
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    dragStartXRef.current = e.clientX;
    dragStartTsRef.current = viewport.startTs;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [viewport]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dx = e.clientX - dragStartXRef.current;
    if (Math.abs(dx) > 4) hasDraggedRef.current = true;
    const timeRange = viewport.endTs - viewport.startTs;
    const deltaTs = -(dx / canvas.width) * timeRange;
    const newStart = dragStartTsRef.current + deltaTs;
    useTimelineStore.getState().setViewport({
      startTs: newStart,
      endTs: newStart + timeRange,
    });
  }, [viewport]);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // ─── 点击事件：命中检测 ────────────────────────────────────────────────────
  const handleClick = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // 拖拽结束后不触发 click
    if (hasDraggedRef.current) { hasDraggedRef.current = false; return; }
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (my < HEADER_HEIGHT) return;
    const { scrollY } = viewport;
    let closest: BattleEvent | null = null;
    let minDist = DOT_RADIUS * 2.5;  // 命中半径（略大于点半径，提升可点击性）

    for (const dot of renderedDotsRef.current) {
      const screenY = dot.logicalY - scrollY;
      const dist = Math.sqrt((mx - dot.screenX) ** 2 + (my - screenY) ** 2);
      if (dist < minDist) {
        minDist = dist;
        closest = dot.event;
      }
    }

    selectEvent(closest);
  }, [viewport, selectEvent]);

  // ─── 空状态 ────────────────────────────────────────────────────────────────
  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm select-none">
        请在顶部选择 JSONL 日志文件
      </div>
    );
  }

  if (isLive && session.totalEvents === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm select-none">
        等待战斗事件…
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"

        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
      />
    </div>
  );
};

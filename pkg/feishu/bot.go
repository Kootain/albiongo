package feishu

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"albiongo/pkg/rule"

	lark "github.com/larksuite/oapi-sdk-go/v3"
	larkcore "github.com/larksuite/oapi-sdk-go/v3/core"
	"github.com/larksuite/oapi-sdk-go/v3/event/dispatcher"
	larkim "github.com/larksuite/oapi-sdk-go/v3/service/im/v1"
	larkws "github.com/larksuite/oapi-sdk-go/v3/ws"
	"github.com/sirupsen/logrus"
)

type Bot struct {
	client      *lark.Client
	wsClient    *larkws.Client
	ruleManager *rule.RuleManager
}

func NewBot(appID, appSecret string, rm *rule.RuleManager) *Bot {
	client := lark.NewClient(appID, appSecret, lark.WithLogLevel(larkcore.LogLevelError))

	bot := &Bot{
		client:      client,
		ruleManager: rm,
	}

	// Register event handler for WebSocket
	eventHandler := dispatcher.NewEventDispatcher("", "").
		OnP2MessageReceiveV1(bot.handleMessageReceive).
		OnP2MessageReadV1(func(ctx context.Context, event *larkim.P2MessageReadV1) error {
			// Ignore message read events to prevent "not found handler" errors
			return nil
		})

	// Create WebSocket Client
	wsClient := larkws.NewClient(appID, appSecret,
		larkws.WithEventHandler(eventHandler),
		larkws.WithLogLevel(larkcore.LogLevelError),
	)
	bot.wsClient = wsClient

	return bot
}

func (b *Bot) Start(ctx context.Context) error {
	logrus.Info("Starting Feishu WebSocket Client...")
	return b.wsClient.Start(ctx)
}

func (b *Bot) SendMessage(openID string, content string) error {
	// Construct the request body
	msgContent := map[string]interface{}{
		"text": content,
	}
	contentJson, _ := json.Marshal(msgContent)

	req := larkim.NewCreateMessageReqBuilder().
		ReceiveIdType(larkim.ReceiveIdTypeOpenId).
		Body(larkim.NewCreateMessageReqBodyBuilder().
			ReceiveId(openID).
			MsgType(larkim.MsgTypeText).
			Content(string(contentJson)).
			Build()).
		Build()

	resp, err := b.client.Im.Message.Create(context.Background(), req)
	if err != nil {
		return err
	}

	if !resp.Success() {
		return fmt.Errorf("feishu api error: code=%d, msg=%s, reqId=%s", resp.Code, resp.Msg, resp.RequestId())
	}

	return nil
}

type MsgContent struct {
	Text string `json:"text"`
}

func (b *Bot) handleMessageReceive(ctx context.Context, event *larkim.P2MessageReceiveV1) error {
	// Parse the message content
	var content MsgContent
	if err := json.Unmarshal([]byte(*event.Event.Message.Content), &content); err != nil {
		logrus.Errorf("Failed to parse message content: %v", err)
		return nil
	}

	text := strings.TrimSpace(content.Text)
	senderID := *event.Event.Sender.SenderId.OpenId
	// chatID := *event.Event.Message.ChatId

	// Only handle text messages
	if *event.Event.Message.MessageType != "text" {
		return nil
	}

	// Ignore messages from other bots or system if necessary
	// But usually P2MessageReceiveV1 contains user messages.

	response := b.processCommand(senderID, text)
	if response != "" {
		go func() {
			if err := b.SendMessage(senderID, response); err != nil {
				logrus.Errorf("Failed to send reply to %s: %v", senderID, err)
			}
		}()
	}

	return nil
}

func (b *Bot) processCommand(userID string, text string) string {
	text = strings.TrimSpace(text)
	parts := strings.Fields(text)
	if len(parts) == 0 {
		return ""
	}

	cmd := strings.ToLower(parts[0])

	switch cmd {
	case "help":
		return "指令列表：\n" +
			"list - 查看当前规则\n" +
			"add <规则> - 添加规则 (例如: add (A|B)&C)\n" +
			"del <序号> - 删除规则\n" +
			"help - 显示此帮助"

	case "list":
		rules := b.ruleManager.GetRules(userID)
		if len(rules) == 0 {
			return "当前没有配置任何规则。"
		}
		var sb strings.Builder
		sb.WriteString("当前规则列表：\n")
		for i, r := range rules {
			sb.WriteString(fmt.Sprintf("%d. %s\n", i+1, r))
		}
		return sb.String()

	case "add":
		if len(parts) < 2 {
			return "请输入规则内容。示例: add (A|B)&C"
		}
		// Get everything after the command
		ruleStr := strings.TrimSpace(text[len(parts[0]):])

		if err := b.ruleManager.AddRule(userID, ruleStr); err != nil {
			return fmt.Sprintf("❌ 添加失败: %v", err)
		}
		return fmt.Sprintf("✅ 规则添加成功：\n%s", ruleStr)

	case "del":
		if len(parts) < 2 {
			return "请输入要删除的规则序号。示例: del 1"
		}
		index, err := strconv.Atoi(parts[1])
		if err != nil {
			return "序号必须是数字。"
		}
		if err := b.ruleManager.DeleteRule(userID, index); err != nil {
			return fmt.Sprintf("❌ 删除失败: %v", err)
		}
		return fmt.Sprintf("🗑️ 规则 %d 已删除。", index)

	default:
		return "未知指令。输入 help 查看帮助。"
	}
}

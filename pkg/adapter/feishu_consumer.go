package adapter

import (
	"context"
	"fmt"

	"albiongo/pkg/feishu"
	"albiongo/pkg/protocol"
	"albiongo/pkg/protocol/types"
	"albiongo/pkg/rule"

	"github.com/sirupsen/logrus"
)

type FeishuConsumer struct {
	bot *feishu.Bot
	rm  *rule.RuleManager
}

func NewFeishuConsumer(bot *feishu.Bot, rm *rule.RuleManager) *FeishuConsumer {
	return &FeishuConsumer{
		bot: bot,
		rm:  rm,
	}
}

func (c *FeishuConsumer) Consume(ctx context.Context, event protocol.Command) error {
	msgEvent, ok := event.(*types.EventChatMessage)
	if !ok {
		return nil
	}

	// Match against rules
	matchedUserIDs := c.rm.Match(msgEvent.Message)

	if len(matchedUserIDs) > 0 {
		logrus.Infof("Message matched rules for %d users: %s", len(matchedUserIDs), msgEvent.Message)

		// Format the notification message
		// <at user_id="ou_xxx"></at> is needed for @mention in group chat,
		// but for private message, just text is fine.
		// Requirement says: "bot @ user, and forward message".
		// In private chat, just sending the message is effectively notifying them.
		content := fmt.Sprintf("%s\n玩家: %s", msgEvent.Message, msgEvent.Username)

		for _, userID := range matchedUserIDs {
			if err := c.bot.SendMessage(userID, content); err != nil {
				logrus.Errorf("Failed to send feishu message to %s: %v", userID, err)
			}
		}
	}
	return nil
}

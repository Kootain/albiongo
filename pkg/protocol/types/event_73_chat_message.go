package types

import (
	"albiongo/pkg/protocol"
)

type EventChatMessage struct {
	*EventBase
	Channel  int    `mapstructure:"0"`
	Username string `mapstructure:"1"`
	Message  string `mapstructure:"2"`
}

func init() {
	RegisterEvent[*EventChatMessage](protocol.EvChatMessage, func() *EventChatMessage {
		return &EventChatMessage{
			EventBase: NewEventBase(protocol.EvChatMessage),
		}
	})
}

package types

import (
	"albiongo/pkg/game"
	"albiongo/pkg/protocol"
)

type EventTimeSync struct {
	*EventBase
	Timestamp  game.Timestamp `mapstructure:"0"`
	Timestamp2 game.Timestamp `mapstructure:"1"`
}

func init() {
	RegisterEvent[*EventTimeSync](protocol.EvTimeSync, func() *EventTimeSync {
		return &EventTimeSync{
			EventBase: NewEventBase(protocol.EvTimeSync),
		}
	})
}

package types

import "albiongo/pkg/protocol"

type EventCastStart struct {
	*EventBase
	ObjectID int `mapstructure:"0"`
	SpellID  int `mapstructure:"5"`
}

func init() {
	RegisterEvent[*EventCastStart](protocol.EvCastStart, func() *EventCastStart {
		return &EventCastStart{
			EventBase: NewEventBase(protocol.EvCastStart),
		}
	})
}

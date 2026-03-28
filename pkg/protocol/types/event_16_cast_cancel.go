package types

import "albiongo/pkg/protocol"

type EventCastCancel struct {
	*EventBase
	ObjectID     int    `mapstructure:"0"`
	IsInterupted bool   `mapstructure:"1"`
	SeqID        int64  `mapstructure:"2"`
	Unknown3     int    `mapstructure:"3"`
	Unknown9     int    `mapstructure:"9"`
	Name         string `player_name:"ObjectID"`
}

func init() {
	RegisterEvent[*EventCastCancel](protocol.EvCastCancel, func() *EventCastCancel {
		return &EventCastCancel{
			EventBase: NewEventBase(protocol.EvCastCancel),
		}
	})
}

package types

import "albiongo/pkg/protocol"

type EventLeave struct {
	*EventBase
	ObjectID int `mapstructure:"0"`
}

func init() {
	RegisterEvent[*EventLeave](protocol.EvLeave, func() *EventLeave {
		return &EventLeave{
			EventBase: NewEventBase(protocol.EvLeave),
		}
	})
}

package types

import "albiongo/pkg/protocol"

type EventCastHit struct {
	*EventBase
	ObjectID1  int `mapstructure:"0"`
	ObjectID2  int `mapstructure:"1"`
	SpellIndex int `mapstructure:"2"`
	Unknown1   int `mapstructure:"3"`
	Unknown2   int `mapstructure:"4"`
}

func init() {
	RegisterEvent[*EventCastHit](protocol.EvCastHit, func() *EventCastHit {
		return &EventCastHit{
			EventBase: NewEventBase(protocol.EvCastHit),
		}
	})
}

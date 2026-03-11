package types

import "albiongo/pkg/protocol"

type EventActiveSpellEffectsUpdate struct {
	*EventBase
	ObjectID int   `mapstructure:"0"`
	Unknown1 []int `mapstructure:"1"`
	Unknown2 []int `mapstructure:"2"`
	Unknown3 []int `mapstructure:"3"`
	Unknown4 []int `mapstructure:"4"`
	Unknown5 []int `mapstructure:"5"`

	Unknown6 []int `mapstructure:"7"`

	Unknown7 []int `mapstructure:"9"`
	Unknown8 []int `mapstructure:"10"`
}

func init() {
	RegisterEvent[*EventActiveSpellEffectsUpdate](protocol.EvActiveSpellEffectsUpdate, func() *EventActiveSpellEffectsUpdate {
		return &EventActiveSpellEffectsUpdate{
			EventBase: NewEventBase(protocol.EvActiveSpellEffectsUpdate),
		}
	})
}

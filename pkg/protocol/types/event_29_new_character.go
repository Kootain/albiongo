package types

import (
	"albiongo/pkg/protocol"
)

type EventNewCharacter struct {
	*EventBase
	ObjectID     int    `mapstructure:"0"`
	Name         string `mapstructure:"1"`
	GuildName    string `mapstructure:"8"`
	EquipmentIDs []int  `mapstructure:"40"`
	SpellIDs     []int  `mapstructure:"43"`
	AllianceName string `mapstructure:"51"`
}

func init() {
	RegisterEvent[*EventNewCharacter](protocol.EvNewCharacter, func() *EventNewCharacter {
		return &EventNewCharacter{
			EventBase: NewEventBase(protocol.EvNewCharacter),
		}
	})
}

package types

import (
	"albiongo/pkg/protocol"
)

type EventCharacterEquipmentChanged struct {
	*EventBase
	ObjectID     int    `mapstructure:"0" json:"ObjectID"`
	EquipmentIDs []int  `mapstructure:"2"`
	SpellIDs     []int  `mapstructure:"7"`
	Name         string `json:"Name" player_name:"ObjectID"`
}

func init() {
	RegisterEvent[*EventCharacterEquipmentChanged](protocol.EvCharacterEquipmentChanged, func() *EventCharacterEquipmentChanged {
		return &EventCharacterEquipmentChanged{
			EventBase: NewEventBase(protocol.EvCharacterEquipmentChanged),
		}
	})
}

package types

import (
	"albiongo/pkg/game"
	"albiongo/pkg/protocol"
)

type EventCharacterEquipmentChanged struct {
	*EventBase
	game.IPlayerObjectID `mapstructure:"0" json:"ObjectID"`
	EquipmentIDs         []int `mapstructure:"2"`
	SpellIDs             []int `mapstructure:"7"`
	game.IPlayerName     `json:"Name"`
}

func init() {
	RegisterEvent[*EventCharacterEquipmentChanged](protocol.EvCharacterEquipmentChanged, func() *EventCharacterEquipmentChanged {
		return &EventCharacterEquipmentChanged{
			EventBase: NewEventBase(protocol.EvCharacterEquipmentChanged),
		}
	})
}

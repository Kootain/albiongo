package types

import (
	"albiongo/pkg/protocol"
)

type EventNewEquipmentItem struct {
	*EventBase
	ObjectID int   `mapstructure:"0"`
	ItemID   int   `mapstructure:"1"`
	Count    int   `mapstructure:"2"`
	Value    int   `mapstructure:"4"`
	Quality  int   `mapstructure:"6"`
	SpellIDs []int `mapstructure:"8"`
}

func init() {
	RegisterEvent[*EventNewEquipmentItem](protocol.EvNewEquipmentItem, func() *EventNewEquipmentItem {
		return &EventNewEquipmentItem{
			EventBase: NewEventBase(protocol.EvNewEquipmentItem),
		}
	})
}

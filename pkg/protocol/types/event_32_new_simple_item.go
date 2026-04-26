package types

import (
	"albiongo/pkg/protocol"
)

type EventNewSimpleItem struct {
	*EventBase
	ObjectID int `mapstructure:"0"`
	ItemID   int `mapstructure:"1"`
	Count    int `mapstructure:"2"`
	Value    int `mapstructure:"4"`
}

func init() {
	RegisterEvent[*EventNewSimpleItem](protocol.EvNewSimpleItem, func() *EventNewSimpleItem {
		return &EventNewSimpleItem{
			EventBase: NewEventBase(protocol.EvNewSimpleItem),
		}
	})
}

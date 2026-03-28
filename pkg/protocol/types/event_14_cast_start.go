package types

import (
	"albiongo/pkg/game"
	"albiongo/pkg/protocol"
)

type EventCastStart struct {
	*EventBase
	ObjectID       int           `mapstructure:"0"`
	StartTimestamp int64         `mapstructure:"1"`
	Pos            game.Position `mapstructure:"2"`
	UnknownValue   interface{}   `mapstructure:"3"`
	EndTimestamp   int64         `mapstructure:"4"`
	SpellID        int           `mapstructure:"5"`
	UnknownInt6    int           `mapstructure:"6"`
	UnknownInt7    interface{}   `mapstructure:"7"`
	SeqID          int64         `mapstructure:"8"`
	UnknownInt9    int           `mapstructure:"9"`

	Name string `player_name:"ObjectID"`
}

func init() {
	RegisterEvent[*EventCastStart](protocol.EvCastStart, func() *EventCastStart {
		return &EventCastStart{
			EventBase: NewEventBase(protocol.EvCastStart),
		}
	})
}

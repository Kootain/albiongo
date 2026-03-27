package types

import (
	"albiongo/pkg/protocol"
)

type EventChannelingEnded struct {
	*EventBase
	ObjectID int `mapstructure:"0"`
	Unknown1 int `mapstructure:"1"`
	Unknown2 int `mapstructure:"2"`
	Unknown3 int `mapstructure:"3"`

	Name string `player_name:"ObjectID"`
}

func init() {
	RegisterEvent[*EventChannelingEnded](protocol.EvChannelingEnded, func() *EventChannelingEnded {
		return &EventChannelingEnded{EventBase: NewEventBase(protocol.EvChannelingEnded)}
	})
}

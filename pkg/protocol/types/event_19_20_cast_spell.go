package types

import (
	"albiongo/pkg/game"
	"albiongo/pkg/protocol"
)

type EventCastSpell struct {
	*EventBase
	CasterObjectID int            `mapstructure:"0" json:"CasterObjectID"`
	TargetObjectID int            `mapstructure:"1"`
	Pos            game.Position  `mapstructure:"2"`
	SpellIndex     int            `mapstructure:"3"`
	Timestamp1     game.Timestamp `mapstructure:"4"`
	Timestamp2     game.Timestamp `mapstructure:"5"`
	UnknownInt     int            `mapstructure:"6"` // 0/1
	CasterName     string         `json:"CasterName" player_name:"CasterObjectID"`
	TargetName     string         `json:"TargetName" player_name:"TargetObjectID"`
}

type EventCastSpells struct {
	*EventBase
}

func init() {
	RegisterEvent(protocol.EvCastSpell, func() *EventCastSpell {
		return &EventCastSpell{
			EventBase: NewEventBase(protocol.EvCastSpell),
		}
	})
	// RegisterEvent(protocol.EvCastSpells, func() *EventCastSpells {
	// return &EventCastSpells{
	// EventBase: NewEventBase(protocol.EvCastSpells),
	// }
	// })
}

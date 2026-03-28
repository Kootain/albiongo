package types

import (
	"albiongo/pkg/game"
	"albiongo/pkg/protocol"
)

type EventUpdateSpellEffectArea struct {
	*EventBase
	EventID        int           `mapstructure:"0"`
	Pos            game.Position `mapstructure:"1"`
	Direction      float64       `mapstructure:"2"`
	SpellID        int           `mapstructure:"3"`
	StartTimestamp int           `mapstructure:"4"`
	EndTimestamp   int           `mapstructure:"5"`

	CasterName string `player_name:"CasterObjectID"`
}

func init() {
	RegisterEvent[*EventUpdateSpellEffectArea](protocol.EvUpdateSpellEffectArea, func() *EventUpdateSpellEffectArea {
		return &EventUpdateSpellEffectArea{EventBase: NewEventBase(protocol.EvUpdateSpellEffectArea)}
	})
}

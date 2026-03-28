package types

import (
	"albiongo/pkg/game"
	"albiongo/pkg/protocol"
)

// EvNewSpellEffectArea (Code 113) — 技能效果区域生成（持续性 AoE）
type EventNewSpellEffectArea struct {
	*EventBase
	EventID        int           `mapstructure:"0"`
	CasterObjectID int           `mapstructure:"1"`
	Pos            game.Position `mapstructure:"2"`
	Direction      float64       `mapstructure:"3"`
	SpellID        int           `mapstructure:"4"`
	UnknownInt     int           `mapstructure:"5"`
	StartTimestamp int           `mapstructure:"6"`
	EndTimestamp   int           `mapstructure:"7"`
	UnknownInt8    int           `mapstructure:"8"`
	UnknownInt9    int           `mapstructure:"9"`
	UnknownBool    bool          `mapstructure:"10"`

	CasterName string `player_name:"CasterObjectID"`
}

func init() {
	RegisterEvent[*EventNewSpellEffectArea](protocol.EvNewSpellEffectArea, func() *EventNewSpellEffectArea {
		return &EventNewSpellEffectArea{EventBase: NewEventBase(protocol.EvNewSpellEffectArea)}
	})
}

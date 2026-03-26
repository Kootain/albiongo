package types

import "albiongo/pkg/protocol"

// EvNewSpellEffectArea (Code 113) — 技能效果区域生成（持续性 AoE）
type EventNewSpellEffectArea struct {
	*EventBase
	SpellID        int `mapstructure:"4" json:"SpellID"`
	CasterObjectID int `mapstructure:"6" json:"CasterObjectID"`

	CasterName string `player_name:"CasterObjectID"`
}

func init() {
	RegisterEvent[*EventNewSpellEffectArea](protocol.EvNewSpellEffectArea, func() *EventNewSpellEffectArea {
		return &EventNewSpellEffectArea{EventBase: NewEventBase(protocol.EvNewSpellEffectArea)}
	})
}

package types

import "albiongo/pkg/protocol"

// EvCastHits (Code 22) — 批量命中（一次 AoE/链式技能同时命中多目标）
type EventCastHits struct {
	*EventBase
	CasterObjectID  int   `mapstructure:"0" json:"CasterObjectID"`
	TargetObjectIDs []int `mapstructure:"1" json:"TargetObjectIDs"`
	SpellIndices    []int `mapstructure:"2" json:"SpellIndices"`

	CasterName string `player_name:"CasterObjectID"`
}

func init() {
	RegisterEvent[*EventCastHits](protocol.EvCastHits, func() *EventCastHits {
		return &EventCastHits{EventBase: NewEventBase(protocol.EvCastHits)}
	})
}

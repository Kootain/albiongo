package types

import "albiongo/pkg/protocol"

// EvAttack (Code 13) — 基础普通攻击
type EventAttack struct {
	*EventBase
	AttackerObjectID int `mapstructure:"0" json:"AttackerObjectID"`
	TargetObjectID   int `mapstructure:"2" json:"TargetObjectID"`
	AttackType       int `mapstructure:"3" json:"AttackType"` // 攻击类型
	Result           int `mapstructure:"6" json:"Result"`     // 0=命中，1=格挡/闪避

	AttackerName string `player_name:"AttackerObjectID"`
	TargetName   string `player_name:"TargetObjectID"`
}

func init() {
	RegisterEvent[*EventAttack](protocol.EvAttack, func() *EventAttack {
		return &EventAttack{EventBase: NewEventBase(protocol.EvAttack)}
	})
}

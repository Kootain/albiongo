package types

import "albiongo/pkg/protocol"

// EvHealthUpdates (Code 7) — 批量血量更新，通常一次 AoE 伤害触发多条
type EventHealthUpdates struct {
	*EventBase
	ObjectID     int       `mapstructure:"0" json:"ObjectID"`     // 受影响对象 ID
	HealthDeltas []float32 `mapstructure:"2" json:"HealthDeltas"` // 血量变化量
	Healths      []float32 `mapstructure:"3" json:"Healths"`      // 变化后的血量
	CauserIDs    []int     `mapstructure:"6" json:"CauserIDs"`    // 各次伤害来源 ID
	SpellIDs     []int     `mapstructure:"7" json:"SpellIDs"`     // 对应技能 ID（-1=普攻）
	Name         string    `player_name:"ObjectID"`
}

func init() {
	RegisterEvent[*EventHealthUpdates](protocol.EvHealthUpdates, func() *EventHealthUpdates {
		return &EventHealthUpdates{EventBase: NewEventBase(protocol.EvHealthUpdates)}
	})
}

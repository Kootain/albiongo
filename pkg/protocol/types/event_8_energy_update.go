package types

import "albiongo/pkg/protocol"

// EvEnergyUpdate (Code 8) — 单次能量（蓝量）变化
type EventEnergyUpdate struct {
	*EventBase
	ObjectID    int     `mapstructure:"0" json:"ObjectID"`
	EnergyDelta float32 `mapstructure:"2" json:"EnergyDelta"` // 变化量（负=消耗）
	Energy      float32 `mapstructure:"3" json:"Energy"`      // 变化后能量值
	CauserID    int     `mapstructure:"5" json:"CauserID"`
	SpellID     int     `mapstructure:"6" json:"SpellID"`
	Name        string  `player_name:"ObjectID"`
	CauserName  string  `player_name:"CauserID"`
}

func init() {
	RegisterEvent[*EventEnergyUpdate](protocol.EvEnergyUpdate, func() *EventEnergyUpdate {
		return &EventEnergyUpdate{EventBase: NewEventBase(protocol.EvEnergyUpdate)}
	})
}

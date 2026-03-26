package types

import "albiongo/pkg/protocol"

type EventHealthUpdate struct {
	*EventBase
	ObjectID    int64   `mapstructure:"0"` // 主体玩家ID
	HealthDelta float32 `mapstructure:"2"` // 变化的血量
	Health      float32 `mapstructure:"3"` // 变化后的血量值
	CauserID    int64   `mapstructure:"6"` // 造成变化的玩家ID
	SpellID     int32   `mapstructure:"7"` // 造成变化的技能ID
	Name        string  `player_name:"ObjectID"`
	CauserName  string  `player_name:"CauserID"`
}

func init() {
	RegisterEvent[*EventHealthUpdate](protocol.EvHealthUpdate, func() *EventHealthUpdate {
		return &EventHealthUpdate{
			EventBase: NewEventBase(protocol.EvHealthUpdate),
		}
	})
}

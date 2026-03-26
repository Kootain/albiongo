package types

import "albiongo/pkg/protocol"

// EvMounted (Code 209) — 玩家骑乘完成，开始骑行状态
type EventMounted struct {
	*EventBase
	ObjectID    int     `mapstructure:"0" json:"ObjectID"`
	MountItemID int     `mapstructure:"2" json:"MountItemID"` // 坐骑道具 ID
	MoveSpeed   float32 `mapstructure:"5" json:"MoveSpeed"`   // 移动速度

	Name string `player_name:"ObjectID"`
}

func init() {
	RegisterEvent[*EventMounted](protocol.EvMounted, func() *EventMounted {
		return &EventMounted{EventBase: NewEventBase(protocol.EvMounted)}
	})
}

package types

import "albiongo/pkg/protocol"

// EvMountStart (Code 210) — 玩家开始骑乘动作（施法中，尚未骑上）
type EventMountStart struct {
	*EventBase
	ObjectID    int `mapstructure:"0" json:"ObjectID"`
	MountItemID int `mapstructure:"2" json:"MountItemID"`

	Name string `player_name:"ObjectID"`
}

func init() {
	RegisterEvent[*EventMountStart](protocol.EvMountStart, func() *EventMountStart {
		return &EventMountStart{EventBase: NewEventBase(protocol.EvMountStart)}
	})
}

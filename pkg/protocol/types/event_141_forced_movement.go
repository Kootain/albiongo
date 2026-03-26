package types

import "albiongo/pkg/protocol"

// EvForcedMovement (Code 141) — 强制位移（击退、击飞、拉拽等 CC 效果），ZvZ 核心事件
type EventForcedMovement struct {
	*EventBase
	TargetObjectID int `mapstructure:"0" json:"TargetObjectID"`
	SpellID        int `mapstructure:"7" json:"SpellID"`
	SourceObjectID int `mapstructure:"9" json:"SourceObjectID"`

	TargetName string `player_name:"TargetObjectID"`
	SourceName string `player_name:"SourceObjectID"`
}

func init() {
	RegisterEvent[*EventForcedMovement](protocol.EvForcedMovement, func() *EventForcedMovement {
		return &EventForcedMovement{EventBase: NewEventBase(protocol.EvForcedMovement)}
	})
}

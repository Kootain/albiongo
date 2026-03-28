package types

import "albiongo/pkg/protocol"

// EvCastFinished (Code 18) — 施法完成（法术正式释放）
type EventCastFinished struct {
	*EventBase
	CasterObjectID int         `mapstructure:"0"`
	UnknownValue   interface{} `mapstructure:"1"`
	SpellID        int         `mapstructure:"2"`
	Unknown1       int         `mapstructure:"3"`
	SeqID          int64       `mapstructure:"4"`
	Timestamp      int64       `mapstructure:"5"` // 639102499435151100Data
	Unknown6       int         `mapstructure:"6"` // 1

	CasterName string `player_name:"CasterObjectID"`
}

func init() {
	RegisterEvent[*EventCastFinished](protocol.EvCastFinished, func() *EventCastFinished {
		return &EventCastFinished{EventBase: NewEventBase(protocol.EvCastFinished)}
	})
}

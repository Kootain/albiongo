package types

import "albiongo/pkg/protocol"

// EvCastFinished (Code 18) — 施法完成（法术正式释放）
type EventCastFinished struct {
	*EventBase
	CasterObjectID int `mapstructure:"0" json:"CasterObjectID"`
	SpellID        int `mapstructure:"2" json:"SpellID"`
	Unknown1       int `mapstructure:"3" json:"Unknown1"`
	Unknown2       int `mapstructure:"4" json:"Unknown2"`

	CasterName string `player_name:"CasterObjectID"`
}

func init() {
	RegisterEvent[*EventCastFinished](protocol.EvCastFinished, func() *EventCastFinished {
		return &EventCastFinished{EventBase: NewEventBase(protocol.EvCastFinished)}
	})
}

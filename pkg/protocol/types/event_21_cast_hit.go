package types

import "albiongo/pkg/protocol"

type EventCastHit struct {
	*EventBase
	HitObjectID    int    `mapstructure:"0"`
	CasterObjectID int    `mapstructure:"1"`
	SpellIndex     int    `mapstructure:"2"`
	Unknown1       int    `mapstructure:"3"`
	Unknown2       int    `mapstructure:"4"`
	HitName        string `player_name:"HitObjectID"`
	CasterName     string `player_name:"CasterObjectID"`
}

func init() {
	RegisterEvent[*EventCastHit](protocol.EvCastHit, func() *EventCastHit {
		return &EventCastHit{
			EventBase: NewEventBase(protocol.EvCastHit),
		}
	})
}

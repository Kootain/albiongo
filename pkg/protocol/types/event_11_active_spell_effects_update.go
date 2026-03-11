package types

import "albiongo/pkg/protocol"

type EventActiveSpellEffectsUpdate struct {
	*EventBase
	ObjectID   int   `mapstructure:"0"`
	SpellIDs   []int `mapstructure:"1"`
	Unknown2   []int `mapstructure:"2"` // [100,100,100,100,281,281] 100是地图buff 281是玩家buff?
	Unknown3   []int `mapstructure:"3"` // [100,100,100,100,208,208]
	Timestamps []int `mapstructure:"4"` // [639088352806680800,639084077104260500,639048298494893000,639084006990798600,639088363690923600,639088363690923600] 63908837217 8629400 解析后 3995 14:46:57  UTC时间
	Stack      []int `mapstructure:"5"`

	Unknown6   []int `mapstructure:"7"`
	DurationMs []int `mapstructure:"8"`

	Unknown9  []int `mapstructure:"9"`
	CauserIDs []int `mapstructure:"10"` // [0,0,464,464]
}

func init() {
	RegisterEvent[*EventActiveSpellEffectsUpdate](protocol.EvActiveSpellEffectsUpdate, func() *EventActiveSpellEffectsUpdate {
		return &EventActiveSpellEffectsUpdate{
			EventBase: NewEventBase(protocol.EvActiveSpellEffectsUpdate),
		}
	})
}

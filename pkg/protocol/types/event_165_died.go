package types

import "albiongo/pkg/protocol"

type EventDied struct {
	*EventBase
	VictimID        int64   `mapstructure:"1" json:"VictimID"`
	VictimName      string  `mapstructure:"2" json:"VictimName"`
	VictimGuild     string  `mapstructure:"3" json:"VictimGuild"`
	VictimMaxHealth float32 `mapstructure:"7" json:"VictimMaxHealth"`
	KillerID        int64   `mapstructure:"9" json:"KillerID"`
	KillerName      string  `mapstructure:"10" json:"KillerName"`
	KillerGuild     string  `mapstructure:"11" json:"KillerGuild"`
	KillerHealth    float32 `mapstructure:"15" json:"KillerHealth"` // 击杀时凶手剩余血量
}

func init() {
	RegisterEvent[*EventDied](protocol.EvDied, func() *EventDied {
		return &EventDied{
			EventBase: NewEventBase(protocol.EvDied),
		}
	})
}

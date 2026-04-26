package types

import (
	"albiongo/pkg/protocol"
)

type EventCharacterStats struct {
	*EventBase
	Unknown0         int           `mapstructure:"0"`
	PlayerName       string        `mapstructure:"1"`
	GuildName        string        `mapstructure:"2"`
	Unknown3         int           `mapstructure:"3"`
	AllianceName     string        `mapstructure:"4"`
	Bio              string        `mapstructure:"5"`
	Fame             int64         `mapstructure:"7"`
	Unknown8         float32       `mapstructure:"8"`
	Unknown9         map[int]int64 `mapstructure:"9"`
	KillCount        int           `mapstructure:"10"`
	PVPFame          int64         `mapstructure:"11"`
	Unknown12        int           `mapstructure:"12"`
	PVEFame          int64         `mapstructure:"13"`
	GatheringFame    int64         `mapstructure:"14"`
	GuildBuildSilver int64         `mapstructure:"15"`
	CraftingFame     int64         `mapstructure:"16"`
}

func init() {
	RegisterEvent[*EventCharacterStats](protocol.EvCharacterStats, func() *EventCharacterStats {
		return &EventCharacterStats{
			EventBase: NewEventBase(protocol.EvCharacterStats),
		}
	})
}

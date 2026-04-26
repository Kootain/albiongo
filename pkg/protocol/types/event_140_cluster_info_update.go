package types

import (
	"albiongo/pkg/game"
	"albiongo/pkg/protocol"
)

type EventClusterInfoUpdate struct {
	*EventBase
	ClusterID           string           `mapstructure:"0"`
	OutpostGuildID      game.CharacterID `mapstructure:"1"`
	OutpostGuildName    string           `mapstructure:"2"`
	OutpostAllianceName string           `mapstructure:"3"`
	UnknownUint8        []uint8          `mapstructure:"4"`
	OccupyOwners        []string         `mapstructure:"5"`
	OccupyAlliances     []string         `mapstructure:"6"`

	OccupyGuildRelatedIDs []int `mapstructure:"10"`

	OccupyAttackTimes  []int64 `mapsturcture:"12"`
	Unknown13          []int64 `mapsturcture:"13"` // 领地有，哨塔0
	Unknown14          []int64 `mapsturcture:"14"` // 领地有，哨塔0
	Unknown15          []int64 `mapsturcture:"15"` // 领地有，哨塔0
	OccupyStoredEnergy []int64 `mapsturcture:"16"` // 存储能量
	DefensePointLeft   []int64 `mapsturcture:"17"` // 未花费防御点
	DefensePointTotal  []int64 `mapsturcture:"18"` // 总防御点

	ResourceTypes                  []int   `mapstructure:"52"`
	ResourcePosistions             []int   `mapstructure:"53"`
	ResourceOutposeUnlockTimestamp []int64 `mapstructure:"54"` // 哨塔箱子
	ResourceUnlockTimestamp        []int64 `mapstructure:"55"`
}

func init() {
	RegisterEvent[*EventClusterInfoUpdate](protocol.EvClusterInfoUpdate, func() *EventClusterInfoUpdate {
		return &EventClusterInfoUpdate{EventBase: NewEventBase(protocol.EvClusterInfoUpdate)}
	})
}

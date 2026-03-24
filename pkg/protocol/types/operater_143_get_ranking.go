package types

import (
	"albiongo/pkg/protocol"
)

type ResponseGetRankings struct {
	*OperationBase
	RankingPage int64    `mapstructure:"5"`
	RankingType int      `mapstructure:"6"` // 3087/10000 avalon pvp本周/上周  7779 avalon pve
	PlayerNames []string `mapstructure:"11"`
	GuildNames  []string `mapstructure:"17"`
}

func init() {
	RegisterResponse(protocol.OpGetRankings, func() *ResponseGetRankings {
		return &ResponseGetRankings{
			OperationBase: NewOperationBase(protocol.ProtocolTypeResponse, protocol.OpGetRankings),
		}
	})
}

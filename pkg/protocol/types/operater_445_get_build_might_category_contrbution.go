package types

import (
	"albiongo/pkg/game"
	"albiongo/pkg/protocol"
)

type ResponseGetGuildMightCategoryContribution struct {
	*OperationBase
	GuildID       game.CharacterID `mapstructure:"0"`
	ChallengeType string           `mapstructure:"1"`
	Unknown2      int64            `mapstructure:"2"`
	Unknown3      int64            `mapstructure:"3"`
	Unknown4      int              `mapstructure:"4"`
	Offset        int64            `mapstructure:"5"`
	Usernames     []string         `mapstructure:"6"`
	Mights        []int64          `mapstructure:"7"`
	Unknown255    int64            `mapstructure:"255"`
}

func init() {
	RegisterResponse(protocol.OpGetGuildMightCategoryContribution, func() *ResponseGetGuildMightCategoryContribution {
		return &ResponseGetGuildMightCategoryContribution{
			OperationBase: NewOperationBase(protocol.ProtocolTypeResponse, protocol.OpGetPvpChallengeData),
		}
	})
}

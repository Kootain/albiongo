package types

import (
	"albiongo/pkg/game"
	"albiongo/pkg/protocol"
)

type EventAttachItemContainer struct {
	*EventBase
	ObjectID              int              `mapstructure:"0"`
	ContainerGuid         game.CharacterID `mapstructure:"1"`
	PrivateContainerGuild game.CharacterID `mapstructure:"2"`
	Slots                 []int            `mapstructure:"3"`
}

func init() {
	RegisterEvent[*EventAttachItemContainer](protocol.EvAttachItemContainer, func() *EventAttachItemContainer {
		return &EventAttachItemContainer{
			EventBase: NewEventBase(protocol.EvAttachItemContainer),
		}
	})
}

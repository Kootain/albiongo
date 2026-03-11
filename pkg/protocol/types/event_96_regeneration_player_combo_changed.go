package types

import "albiongo/pkg/protocol"

type EventRegenerationPlayerComboChanged struct {
	*EventBase
	ObjectID int `mapstructure:"0"`
}

// map[0:436 1:13507955 2:2531 3:2531 5:63.28279 6:639087078165816848 7:366 8:366 10:5.0299506 11:639087078165816848 13:1064 15:10.64 16:639087078165816848 252:96]

func init() {
	RegisterEvent[*EventRegenerationPlayerComboChanged](protocol.EvRegenerationPlayerComboChanged, func() *EventRegenerationPlayerComboChanged {
		return &EventRegenerationPlayerComboChanged{
			EventBase: NewEventBase(protocol.EvRegenerationPlayerComboChanged),
		}
	})
}

package consumer

import (
	"albiongo/pkg/api"
	"albiongo/pkg/protocol"
	"context"
)

func APIConsumer(broadcaster api.IBroadcaster) func(context.Context, protocol.Command) error {
	return func(ctx context.Context, event protocol.Command) error {
		switch event := event.(type) {
		case protocol.Event:
			if event.GetCode() == 3 {
				return nil
			}
		}
		broadcaster.Broadcast(event)
		return nil
	}
}

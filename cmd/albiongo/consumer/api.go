package consumer

import (
	"albiongo/pkg/api"
	"albiongo/pkg/protocol"
	"context"
)

func APIConsumer(broadcaster api.IBroadcaster) func(context.Context, protocol.Command) error {
	return func(ctx context.Context, event protocol.Command) error {
		broadcaster.Broadcast(event)
		return nil
	}
}

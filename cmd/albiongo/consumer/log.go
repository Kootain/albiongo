package consumer

import (
	"albiongo/pkg/protocol"
	"albiongo/pkg/protocol/types"
	"context"
	"fmt"
	"strings"

	"github.com/sirupsen/logrus"
)

func ConsoleLog(ctx context.Context, event protocol.Command) error {
	switch event := event.(type) {
	case protocol.Event:
		prefix := fmt.Sprintf("[Event][%s](%d)", event.GetCode().String()[2:], event.GetCode())
		switch event := event.(type) {
		case *types.DefaultEventTypes:
			logrus.Debugf("%s %v", prefix, event.Data)
		default:
			logrus.Debugf("%s %#v", prefix, event)
		}
	case protocol.Operation:
		prefix := fmt.Sprintf("[%s][%s](%d)", strings.Replace(event.GetType().String(), "ProtocolType", "", 1), event.GetCode().String()[2:], event.GetCode())
		switch event := event.(type) {
		case *types.OptaionDefault:
			logrus.Debugf("%s %v", prefix, event.Data)
		default:
			logrus.Debugf("%s %#v", prefix, event)
		}
	}
	return nil
}

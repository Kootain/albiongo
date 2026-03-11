package types

import (
	"albiongo/pkg/protocol"
	"fmt"
)

var EventTypes = map[protocol.EventType]func() protocol.Event{}
var RequestTypes = map[protocol.OperationType]func() protocol.Operation{}
var ResponseTypes = map[protocol.OperationType]func() protocol.Operation{}

func GetEventTypes(code protocol.EventType) protocol.Event {
	if h, ok := EventTypes[code]; ok {
		return h()
	} else {
		return nil
	}
}

func GetRequestTypes(code protocol.OperationType) protocol.Operation {
	if h, ok := RequestTypes[code]; ok {
		return h()
	} else {
		return nil
	}
}

func GetResponseTypes(code protocol.OperationType) protocol.Operation {
	if h, ok := ResponseTypes[code]; ok {
		return h()
	} else {
		return nil
	}
}

func RegisterEvent[T protocol.Event](code protocol.EventType, factory func() T) error {
	if _, ok := EventTypes[code]; ok {
		return fmt.Errorf("Event %d already register", code)
	}
	EventTypes[code] = func() protocol.Event {
		tmp := factory()
		tmp.SetCode(code)
		tmp.SetType(protocol.ProtocolTypeEvent)
		return tmp
	}
	return nil
}

func RegisterRequest[T protocol.Operation](code protocol.OperationType, factory func() T) error {
	if _, ok := RequestTypes[code]; ok {
		return fmt.Errorf("Request %d already register", code)
	}
	RequestTypes[code] = func() protocol.Operation {
		return factory()
	}
	return nil
}

func RegisterResponse[T protocol.Operation](code protocol.OperationType, factory func() T) error {
	if _, ok := ResponseTypes[code]; ok {
		return fmt.Errorf("Response %d already register", code)
	}
	ResponseTypes[code] = func() protocol.Operation {
		return factory()
	}
	return nil
}

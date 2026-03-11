package types

import (
	"albiongo/pkg/game"
	"albiongo/pkg/protocol"
	"fmt"
)

type EventBase struct {
	Type protocol.ProtocolType
	Code protocol.EventType
}

func (EventBase) GetType() protocol.ProtocolType {
	return protocol.ProtocolTypeEvent
}

func (e *EventBase) SetType(operationType protocol.ProtocolType) {
	e.Type = operationType
}

func (e EventBase) GetCode() protocol.EventType {
	return e.Code
}

func (e *EventBase) SetCode(code protocol.EventType) {
	e.Code = code
}

func (e EventBase) String() string {
	return fmt.Sprintf("[Event][%s](%d)", e.Code.String()[2:], e.Code)
}

func (e EventBase) Init(game.IGame) error {
	return nil
}

func NewEventBase(eventType protocol.EventType) *EventBase {
	return &EventBase{
		Code: eventType,
	}
}

type DefaultEventTypes struct {
	*EventBase
	Data map[uint8]interface{}
}

func (t *DefaultEventTypes) Init(game.IGame) error {
	return nil
}

func (t DefaultEventTypes) String() string {
	return fmt.Sprintf("%s\t%v", t.EventBase.String(), t.Data)
}

func NewDefaultEventType(code protocol.EventType, params map[uint8]interface{}) *DefaultEventTypes {
	return &DefaultEventTypes{
		EventBase: NewEventBase(code),
		Data:      params,
	}
}

type OperationBase struct {
	Type protocol.ProtocolType
	Code protocol.OperationType
}

func (base OperationBase) GetType() protocol.ProtocolType {
	return base.Type
}

func (base *OperationBase) SetType(operationType protocol.ProtocolType) {
	base.Type = operationType
}

func (base OperationBase) GetCode() protocol.OperationType {
	return base.Code
}

func (base *OperationBase) SetCode(code protocol.OperationType) {
	base.Code = code
}

func (base OperationBase) Init(game.IGame) error {
	return nil
}

func (base OperationBase) String() string {
	etype := "Request"
	if base.Type == protocol.ProtocolTypeResponse {
		etype = "Response"
	}
	return fmt.Sprintf("[%s][%s](%d)", etype, base.Code.String()[2:], base.Code)
}

type OptaionDefault struct {
	*OperationBase
	Data map[uint8]interface{}
}

func (base OptaionDefault) String() string {
	return fmt.Sprintf("%s\t%v", base.OperationBase.String(), base.Data)
}

func NewOperationBase(operationType protocol.ProtocolType, operationCode protocol.OperationType) *OperationBase {
	return &OperationBase{
		Type: operationType,
		Code: operationCode,
	}
}

func NewOperationDefault(operationType protocol.ProtocolType, operationCode protocol.OperationType, params map[uint8]interface{}) *OptaionDefault {
	return &OptaionDefault{
		OperationBase: NewOperationBase(operationType, operationCode),
		Data:          params,
	}
}

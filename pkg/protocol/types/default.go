package types

import (
	"albiongo/pkg/protocol"
	"fmt"
)

type EventBase struct {
	Type      protocol.ProtocolType
	Code      protocol.EventType
	Timestamp int64
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

func (e *EventBase) SetTimestamp(ts int64) {
	e.Timestamp = ts
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
	Type      protocol.ProtocolType
	Code      protocol.OperationType
	Timestamp int64
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

func (base *OperationBase) SetTimestamp(ts int64) {
	base.Timestamp = ts
}

func (base OperationBase) String() string {
	etype := "Request"
	if base.Type == protocol.ProtocolTypeResponse {
		etype = "Response"
	}
	return fmt.Sprintf("[%s][%s](%d)", etype, base.Code.String()[2:], base.Code)
}

type DefaultOperation struct {
	*OperationBase
	Data map[uint8]interface{}
}

func (base DefaultOperation) String() string {
	return fmt.Sprintf("%s\t%v", base.OperationBase.String(), base.Data)
}

func NewOperationBase(operationType protocol.ProtocolType, operationCode protocol.OperationType) *OperationBase {
	return &OperationBase{
		Type: operationType,
		Code: operationCode,
	}
}

func NewOperationDefault(operationType protocol.ProtocolType, operationCode protocol.OperationType, params map[uint8]interface{}) *DefaultOperation {
	return &DefaultOperation{
		OperationBase: NewOperationBase(operationType, operationCode),
		Data:          params,
	}
}

package protocol

//go:generate stringer -type=ProtocolType
type ProtocolType int

const (
	ProtocolTypeEvent ProtocolType = iota
	ProtocolTypeRequest
	ProtocolTypeResponse
)

type Command interface {
	GetType() ProtocolType
	SetType(ProtocolType)
}

type Operation interface {
	Command
	GetCode() OperationType
	SetCode(OperationType)
}

type Event interface {
	Command
	GetCode() EventType
	SetCode(EventType)
}

type Decoder interface {
	DecodeEvent(code int, params map[byte]interface{}) (Event, error)
	DecodeRequest(code int, params map[byte]interface{}) (Operation, error)
	DecodeResponse(code int, params map[byte]interface{}) (Operation, error)
}

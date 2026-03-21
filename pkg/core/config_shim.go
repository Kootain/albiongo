package core

import "albiongo/pkg/protocol"

type configGlobal struct {
	RecordPath                string
	IgnoreOperationCodes      []int
	DebugIgnoreDecodingErrors bool
	DebugOperations           map[int]bool
	DebugEvents               map[int]bool
	DebugOperationsString     string
	DebugEventsString         string
	ListenDevices             string
}

var ConfigGlobal = configGlobal{
	RecordPath:                "",
	IgnoreOperationCodes:      []int{int(protocol.OpGetCharacterStats)},
	DebugIgnoreDecodingErrors: false,
	DebugOperations:           make(map[int]bool),
	DebugEvents:               make(map[int]bool),
	DebugOperationsString:     "",
	DebugEventsString:         "",
	ListenDevices:             "",
}

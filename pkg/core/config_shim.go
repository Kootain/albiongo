package core

type configGlobal struct {
	RecordPath                string
	DebugIgnoreDecodingErrors bool
	DebugOperations           map[int]bool
	DebugEvents               map[int]bool
	DebugOperationsString     string
	DebugEventsString         string
	ListenDevices             string
}

var ConfigGlobal = configGlobal{
	RecordPath:                "",
	DebugIgnoreDecodingErrors: false,
	DebugOperations:           make(map[int]bool),
	DebugEvents:               make(map[int]bool),
	DebugOperationsString:     "",
	DebugEventsString:         "",
	ListenDevices:             "",
}

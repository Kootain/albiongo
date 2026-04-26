package photon

type EventData struct {
	Code       byte
	Parameters map[byte]interface{}
}

type OperationRequest struct {
	OperationCode byte
	Parameters    map[byte]interface{}
}

type OperationResponse struct {
	OperationCode byte
	ReturnCode    int16
	DebugMessage  string
	Parameters    map[byte]interface{}
}

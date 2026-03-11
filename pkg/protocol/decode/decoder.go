package decode

import (
	"encoding/hex"
	"reflect"
	"strconv"

	log "github.com/sirupsen/logrus"

	"albiongo/pkg/game"
	"albiongo/pkg/protocol"
	"albiongo/pkg/protocol/types"

	"github.com/mitchellh/mapstructure"
)

type Decoder struct{}

func NewDecoder() protocol.Decoder {
	return &Decoder{}
}

func (d *Decoder) DecodeEvent(code int, params map[byte]interface{}) (etype protocol.Event, err error) {
	ecode := protocol.EventType(code)
	if etype = types.GetEventTypes(ecode); etype == nil {
		return types.NewDefaultEventType(ecode, params), nil
	}
	if err = DecodeParams(params, &etype); err != nil {
		return nil, err
	}
	return etype, nil
}

func (d *Decoder) DecodeRequest(code int, params map[byte]interface{}) (etype protocol.Operation, err error) {
	ecode := protocol.OperationType(code)
	if etype = types.GetRequestTypes(ecode); etype == nil {
		return types.NewOperationDefault(protocol.ProtocolTypeRequest, ecode, params), nil
	}
	if err = DecodeParams(params, etype); err != nil {
		return nil, err
	}
	return etype, nil
}

func (d *Decoder) DecodeResponse(code int, params map[byte]interface{}) (etype protocol.Operation, err error) {
	ecode := protocol.OperationType(code)
	if etype = types.GetResponseTypes(ecode); etype == nil {
		return types.NewOperationDefault(protocol.ProtocolTypeResponse, ecode, params), nil
	}
	if err = DecodeParams(params, etype); err != nil {
		return nil, err
	}
	return etype, nil
}

// DecodeParams decodes the raw params map into the target struct using mapstructure.
// It handles key conversion (byte to string) and custom type decoding (CharacterID).
func DecodeParams(params map[byte]interface{}, result interface{}) error {
	convertGameObjects := func(from reflect.Type, to reflect.Type, v interface{}) (interface{}, error) {
		if from == reflect.TypeOf([]int8{}) && to == reflect.TypeOf(game.CharacterID("")) {
			log.Debug("Parsing character ID from mixed-endian UUID")
			return decodeCharacterID(v.([]int8)), nil
		}
		return v, nil
	}

	config := mapstructure.DecoderConfig{
		DecodeHook: convertGameObjects,
		Result:     result,
	}

	decoder, err := mapstructure.NewDecoder(&config)
	if err != nil {
		return err
	}

	// Convert map[byte]interface{} to map[string]interface{}
	// mapstructure requires string keys
	stringMap := make(map[string]interface{})
	for k, v := range params {
		stringMap[strconv.Itoa(int(k))] = v
	}

	return decoder.Decode(stringMap)
}

func decodeCharacterID(array []int8) game.CharacterID {
	/* So this is a UUID, which is stored in a 'mixed-endian' format.
	The first three components are stored in little-endian, the rest in big-endian.
	See https://en.wikipedia.org/wiki/Universally_unique_identifier#Encoding.
	By default, our int array is read as big-endian, so we need to swap the first
	three components of the UUID
	*/
	b := make([]byte, len(array))

	// First, convert to byte
	for k, v := range array {
		b[k] = byte(v)
	}

	// swap first component
	b[0], b[1], b[2], b[3] = b[3], b[2], b[1], b[0]

	// swap second component
	b[4], b[5] = b[5], b[4]

	// swap third component
	b[6], b[7] = b[7], b[6]

	// format it UUID-style
	var buf [36]byte
	hex.Encode(buf[:], b[:4])
	buf[8] = '-'
	hex.Encode(buf[9:13], b[4:6])
	buf[13] = '-'
	hex.Encode(buf[14:18], b[6:8])
	buf[18] = '-'
	hex.Encode(buf[19:23], b[8:10])
	buf[23] = '-'
	hex.Encode(buf[24:], b[10:])

	return game.CharacterID(buf[:])
}

# Fix WebSocket Disconnect Spec

## Why
The WebSocket connection between the frontend (`test_client.html`) and the backend (`pkg/api/server.go`) keeps dropping randomly with the error `use of closed network connection`. This occurs because the backend broadcasts events containing unsupported data types for JSON serialization, such as `map[interface{}]interface{}`, originating from the Photon protocol deserializer. When `c.conn.WriteJSON(message)` encounters these types, it fails, causing the `writePump` goroutine to terminate and close the WebSocket connection unexpectedly.

## What Changes
- Add a `sanitizeForJSON` and `flattenStruct` utility function in `pkg/api/server.go` to recursively convert unmarshalable types (like `map[interface{}]interface{}`) into JSON-compatible `map[string]interface{}`.
- Update the `writePump` method in `pkg/api/server.go` to serialize messages using the sanitizer before writing them to the WebSocket.
- Handle JSON marshaling errors gracefully by logging them and skipping the message, rather than returning and closing the connection.

## Impact
- Affected code: `pkg/api/server.go`
- Resolves the frequent websocket disconnects in `test_client.html` while preserving all event data correctly formatted.

## MODIFIED Requirements
### Requirement: WebSocket Broadcast Stability
The system SHALL ensure that malformed or unserializable event payloads do not terminate the client WebSocket connection.
- **WHEN** the backend attempts to broadcast an event with unsupported types (like `map[interface{}]interface{}`).
- **THEN** the system should automatically sanitize the payload into string-keyed maps, serialize to JSON, and successfully send it to the client without dropping the connection.

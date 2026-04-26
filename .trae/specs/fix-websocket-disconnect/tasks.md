# Tasks

- [x] Task 1: Add JSON sanitizer functions in `pkg/api/server.go`
  - Implement `sanitizeForJSON(v interface{}) interface{}` to handle Maps, Slices, Structs recursively.
  - Implement `flattenStruct(val reflect.Value, m map[string]interface{})` to flatten embedded structs (like `EventBase`).
  - Add required `reflect` package import.

- [x] Task 2: Update `writePump` to use safe JSON serialization
  - Replace `err := c.conn.WriteJSON(message)` with a manual marshaling process:
    ```go
    sanitized := sanitizeForJSON(message)
    b, err := json.Marshal(sanitized)
    if err != nil {
        logrus.Errorf("Websocket write error (JSON marshal failed): %v", err)
        continue
    }
    if err := c.conn.WriteMessage(websocket.TextMessage, b); err != nil {
        return
    }
    ```
  - Ensure the connection is not closed on serialization failure.
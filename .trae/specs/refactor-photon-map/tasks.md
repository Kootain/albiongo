# 任务列表 (Tasks)

- [x] 任务 1：在 `pkg/protocol/photon/deseriallizer.go` 中引入支持 `MarshalJSON` 的 `PhotonMap`
  - 定义 `type PhotonMap map[interface{}]interface{}`。
  - 实现 `func (m PhotonMap) MarshalJSON() ([]byte, error)` 方法，安全地将键转换为字符串并调用 `json.Marshal` 序列化。
  - 导入 `encoding/json` 包。

- [x] 任务 2：更新 Photon 反序列化器
  - 修改 `deserializeDictionary` 和 `deserializeHashtable` 函数，初始化并返回 `PhotonMap` 类型。
  - 更新 `isComparable` 检查逻辑，使其能够识别 `PhotonMap`（同时保留或替换原有的 `map[interface{}]interface{}` 判断）。

- [x] 任务 3：还原 `pkg/api/server.go` 的临时变通方案
  - 删除 `sanitizeForJSON` 和 `flattenStruct` 方法。
  - 将 `writePump` 还原为干净的 JSON 序列化逻辑：
    ```go
    if err := c.conn.WriteJSON(message); err != nil {
        logrus.Errorf("Websocket write error: %v", err)
        continue // 出现错误时继续循环，保持长连接不断开！
    }
    ```
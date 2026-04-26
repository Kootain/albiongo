# 重构 PhotonMap JSON 序列化规范

## 为什么 (Why)
此前为了修复 WebSocket 长连接断开的问题，我们在 `pkg/api/server.go` 中引入了手动的 JSON 数据清洗函数（`sanitizeForJSON`）。这是一种临时且有性能损耗的变通方案（Workaround），它在每次广播事件前都需要全量遍历和反射处理。问题的根本原因在于 `deseriallizer.go` 返回了原生的 `map[interface{}]interface{}`（代表 Photon 字典），而 Go 的标准 `encoding/json` 无法直接序列化非字符串键的 Map。

## 改动内容 (What Changes)
- **重构 `deseriallizer.go`**：定义自定义类型别名 `type PhotonMap map[interface{}]interface{}`，并为其实现 `json.Marshaler` 接口（`MarshalJSON` 方法）。这使得该类型在进行 JSON 序列化时，能原生且自动地将非字符串键转换为字符串键。
- 修改 `deserializeDictionary` 和 `deserializeHashtable` 函数，使其返回 `PhotonMap` 而不是原生的 `map[interface{}]interface{}`。
- 更新 `isComparable` 检查逻辑，使其能够正确识别 `PhotonMap`。
- **还原 `server.go`**：移除临时添加的 `sanitizeForJSON` 和 `flattenStruct` 函数。将 `writePump` 恢复为干净的原生 JSON 序列化方式，仅保留“出错时打印日志并继续（`continue`）”的安全机制以防连接断开。

## 影响 (Impact)
- 影响的代码：`pkg/protocol/photon/deseriallizer.go`，`pkg/api/server.go`。
- 这是一个根本性、零依赖且优雅的解决方案。它既保持了 API 层的整洁，又确保了 Photon 动态协议负载能够完全兼容 JSON 序列化。

## 移除的需求 (REMOVED Requirements)
### 需求：在边缘层进行 JSON 数据清洗
**原因**：这只是一种变通方案；通过为引起序列化失败的底层类型实现 `json.Marshaler` 接口来原生处理 JSON 转换，才是符合 Go 语言惯例的最佳实践。
**迁移方案**：还原 `server.go`，将 JSON 序列化的安全性保障直接下沉到 `PhotonMap` 类型内部。
# 飞书 Bot 消息过滤与分发模块开发计划 (Revised)

## 1. 模块划分
根据需求，将功能划分为核心规则层、飞书适配层和业务集成层，确保职责单一和高内聚。

### 1.1 核心规则层 (`pkg/rule`)
负责规则的解析、求值和持久化存储。此模块不依赖任何飞书或游戏业务逻辑，可被前端 API 或其他模块复用。
- **Parser**: 实现布尔表达式解析（支持 `&`, `|`, `()`）。
- **Manager**: 管理所有用户的规则集合，提供增删改查接口，并负责并发安全的 JSON 文件读写。
- **Engine**: 提供 `Match(content string) []UserID` 接口，输入消息内容，返回所有匹配的用户 ID 列表。

### 1.2 飞书适配层 (`pkg/feishu`)
仅负责与飞书开放平台的交互。
- **Bot**: 封装飞书 SDK，提供 `SendMessage(openID, content)` 接口。
- **Dispatcher**: 处理飞书 Webhook 回调（接收用户消息），解析用户指令并调用 `pkg/rule` 进行配置，最后反馈操作结果。

### 1.3 业务集成层 (`pkg/adapter/feishu_consumer.go` 或 `cmd/albiongo/consumer`)
负责监听游戏事件并驱动流程。
- **Listener**: 订阅 `GameStatsBus` 中的 `EventChatMessage`。
- **Flow**: 收到消息 -> 调用 `rule.Engine` 匹配 -> 获取目标用户 -> 调用 `feishu.Bot` 发送通知。

## 2. 交互设计 (飞书 Bot)
用户通过与 Bot 的私聊窗口进行规则配置。

### 2.1 指令集
| 指令格式 | 说明 | 示例 |
| :--- | :--- | :--- |
| `list` | 查看当前所有规则及序号 | `list` |
| `add <规则>` | 添加一条新规则 | `add (8.3|8.4) & 牛` |
| `del <序号>` | 删除指定序号的规则 | `del 1` |
| `help` | 显示帮助菜单 | `help` |

### 2.2 交互示例
**场景 1：添加规则**
> **用户**: `add (抓鸡|Gank) & 队伍`
> **Bot**: ✅ 规则添加成功！
> 当前规则：
> 1. `(抓鸡|Gank) & 队伍`

**场景 2：查看规则**
> **用户**: `list`
> **Bot**: 📋 当前配置规则：
> 1. `(抓鸡|Gank) & 队伍`
> 2. `8.3`

**场景 3：删除规则**
> **用户**: `del 1`
> **Bot**: 🗑️ 规则 `(抓鸡|Gank) & 队伍` 已删除。

**场景 4：错误处理**
> **用户**: `add (A|B`
> **Bot**: ❌ 规则解析失败：缺少右括号 `)`。请检查语法。

## 3. 数据结构 (`data/rules.json`)
```json
{
  "users": {
    "ou_123456": [
      "(A|B)&C",
      "D"
    ],
    "ou_654321": [
      "E&F"
    ]
  }
}
```

## 4. 实施步骤

### Phase 1: 规则引擎 (`pkg/rule`)
- [ ] **AST 定义**: 定义 `Node` 接口及 `AndNode`, `OrNode`, `TermNode`。
- [ ] **Lexer & Parser**: 实现字符串到 AST 的解析逻辑。
- [ ] **Evaluator**: 实现 `Eval(node, content)` 逻辑。
- [ ] **Store**: 实现 JSON 文件的加载与保存，封装 `RuleManager`。
    - `Add(userID, ruleStr)`: 解析并保存。
    - `Delete(userID, index)`: 删除并保存。
    - `Match(content)`: 遍历所有用户规则，返回匹配的用户列表。

### Phase 2: 飞书适配器 (`pkg/feishu`)
- [ ] **Client**: 初始化飞书 `lark.Client`。
- [ ] **Command Handler**: 
    - 接收文本消息事件。
    - 解析 `add/del/list/help` 指令。
    - 调用 `RuleManager` 接口。
    - 回复处理结果。
- [ ] **Sender**: 实现消息发送封装。

### Phase 3: 集成与启动
- [ ] **Consumer**: 在 `consumer` 包中实现 `FeishuNotifier`，订阅 `GameStatsBus`。
- [ ] **Main**:
    - 初始化 `RuleManager` (加载 `data/rules.json`)。
    - 初始化 `FeishuClient`。
    - 启动 `FeishuNotifier` 协程。
    - 在 `APIServer` 中注册飞书 Webhook 路由 `/webhook/feishu`。

## 5. 测试计划
- **单元测试**: 覆盖 `pkg/rule` 的解析器，测试各种嵌套括号和逻辑组合。
- **集成测试**: 本地模拟 `ChatMessage` 事件，验证规则匹配后是否触发飞书发送逻辑（Mock 飞书 Client）。

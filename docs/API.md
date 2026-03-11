### AlbionGo API 文档

#### 1. 玩家查询接口 (`/players`)

**路径**: `/players`
**方法**: `GET`
**描述**: 根据条件查询玩家信息，返回玩家列表及其装备、技能信息。

**请求参数 (Query Parameters)**:

| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `name` | string | 否 | 玩家名称 (模糊匹配或精确匹配，视实现而定) |
| `guild` | string | 否 | 公会名称 |
| `alliance` | string | 否 | 联盟名称 |

**响应结构 (JSON)**:

返回一个 `Player` 对象数组：

```json
[
  {
    "Name": "string",         // 玩家名称
    "GuildName": "string",    // 公会名称
    "AllianceName": "string", // 联盟名称
    "Equipments": [           // 装备 ID 列表 (int 数组)
      123, 456, ...
    ],
    "Spells": [               // 技能 ID 列表 (int 数组)
      10, 11, 12, ...
    ]
  }
]
```

**Equipments 索引映射参考**:
通常对应以下槽位 (具体顺序视游戏协议而定，常见参考)：
- 0: MainHand (主手)
- 1: OffHand (副手)
- 2: Head (头)
- 3: Chest (胸)
- 4: Shoes (鞋)
- 5: Bag (包)
- 6: Cape (披风)
- 7: Mount (坐骑)
- 8: Potion (药水)
- 9: Food (食物)

**Spells 索引映射参考**:
- 0, 1, 2: 主手技能 (Q, W, E)
- 3: 胸甲技能 (R)
- 4: 头盔技能 (D)
- 5: 鞋子技能 (F)
- 12: 药水
- 13: 食物

---

#### 2. 实时事件流接口 (`/events`)

**路径**: `/events`
**协议**: `WebSocket`
**描述**: 建立长连接，实时接收游戏内发生的事件、请求和响应数据。

**消息格式 (JSON)**:

服务端推送的消息通常包含以下字段（具体字段取决于消息类型）：

```json
{
  "Type": int,        // 协议类型 (0=Event, 1=Request, 2=Response)
  "Code": int,        // 操作码/事件码 (例如 90 代表更换装备)
  "": ... // 其他时间参数
}
```

**协议类型 (Type)**:
- `0`: **Event** (服务端推送的事件，如玩家移动、更换装备)
- `1`: **Request** (客户端发送的请求)
- `2`: **Response** (服务端对请求的响应)


**前端处理示例**:
```javascript
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // 判断是否为更换装备事件
    if (data.Type === 0 && data.Code === 90) {
        // 触发刷新逻辑
    }
};

**常见事件示例**
- 玩家更换装备/技能 Type: 0 Code: 90 Name: moneyandhoney EquipmentIDs: [8409,0,3546,4027,5411,2836,2457,2971,0,0] SpellIDs: [2757,2768,2805,3763,3870,3922,-1,-1,-1,-1,-1,-1,4259,-1]
- 新玩家现 Type: 0 Code: 29 Name: moneyandhoney GuildName: Laughing Boulevard EquipmentIDs: [0,0,0,0,0,0,2779,3015,0,811] SpellIDs: [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,4253,4124] AllianceName: NIC
```

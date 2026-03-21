# 飞书 (Lark) Go SDK 使用文档

> 本文档基于飞书官方服务端 Go SDK (`github.com/larksuite/oapi-sdk-go/v3`) 总结，旨在为后续应用开发提供快速查阅的参考。
> Github 仓库：[larksuite/oapi-sdk-go](https://github.com/larksuite/oapi-sdk-go)

## 1. 简介与安装

飞书服务端 SDK 旨在让开发者便捷地调用飞书开放 API、处理订阅的消息事件、处理服务端推送的卡片行为等。它内置封装了应用访问凭证（access token）的获取与自动刷新、数据加解密、请求验签等复杂逻辑。

**安装最新版 V3 SDK：**

```bash
go get -u github.com/larksuite/oapi-sdk-go/v3
```

## 2. API Client 初始化

在调用 API 前，需要先创建一个全局的 API Client。

### 2.1 快速创建（自建应用）

```go
import "github.com/larksuite/oapi-sdk-go/v3"

// 使用 AppID 和 AppSecret 创建默认 Client
var client = lark.NewClient("your_appID", "your_appSecret")
```

### 2.2 商店应用

如果是商店应用（ISV 开发者），需要在初始化时指定 `AppType`：

```go
var client = lark.NewClient("appID", "appSecret", lark.WithMarketplaceApp())
```

### 2.3 高级配置项

在创建 Client 时，可以通过传递可变参数进行高级配置：

```go
import (
    "time"
    "net/http"
    "github.com/larksuite/oapi-sdk-go/v3"
    "github.com/larksuite/oapi-sdk-go/v3/core"
)

var client = lark.NewClient("appID", "appSecret",
    lark.WithLogLevel(larkcore.LogLevelDebug), // 设置日志级别 (Debug/Info/Warn/Error)
    lark.WithReqTimeout(3*time.Second),        // 设置请求超时时间
    lark.WithEnableTokenCache(true),           // 开启 Token 自动缓存（默认开启）
    lark.WithHttpClient(http.DefaultClient),   // 替换默认的 HTTP Client
    lark.WithLogReqAtDebug(true),              // Debug 模式下打印 HTTP 请求/响应信息
)
```

## 3. 调用 API 服务

使用方式采用层级结构：`Client.业务域.资源.方法名称`，例如：`client.Im.Message.Create`。

### 3.1 结构化调用（推荐）

以发送即时消息为例：

```go
import (
    "context"
    "fmt"
    
    "github.com/larksuite/oapi-sdk-go/v3"
    "github.com/larksuite/oapi-sdk-go/v3/core"
    "github.com/larksuite/oapi-sdk-go/v3/service/im/v1"
)

func SendMessage(client *lark.Client) {
    // 1. 构建请求体 (链式调用)
    req := larkim.NewCreateMessageReqBuilder().
        ReceiveIdType(larkim.ReceiveIdTypeOpenId).
        Body(larkim.NewCreateMessageReqBodyBuilder().
            ReceiveId("ou_xxxx").
            MsgType(larkim.MsgTypeText).
            Content(`{"text":"hello world"}`).
            Build()).
        Build()
        
    // 2. 发起请求
    resp, err := client.Im.Message.Create(context.Background(), req)
    
    // 3. 网络及 SDK 层面错误处理
    if err != nil {
        fmt.Printf("API Call Failed: %v\n", err)
        return
    }
    
    // 4. 服务端业务错误处理
    if !resp.Success() {
        fmt.Printf("Error Code: %d, Msg: %s, RequestId: %s\n", resp.Code, resp.Msg, resp.RequestId())
        return
    }
    
    // 5. 成功响应数据处理
    fmt.Println(larkcore.Prettify(resp.Data))
}
```

### 3.2 动态设置请求选项 (Request Options)

每次发起调用时，可以设置**单次请求级别**的参数，比如指定以用户的身份（UserAccessToken）发起调用：

```go
resp, err := client.Im.Message.Create(context.Background(), req,
    larkcore.WithUserAccessToken("u-xxxxx"),                  // 以用户身份调用
    larkcore.WithHeaders(map[string][]string{"K1": {"V1"}}),  // 设置自定义 Header
)
```

### 3.3 原生 API 调用

对于某些还未结构化支持的老版接口，可以使用原生模式 (`client.Do`)：

```go
resp, err := client.Do(context.Background(),
    &larkcore.ApiReq{
        HttpMethod:  http.MethodGet,
        ApiPath:     "https://open.feishu.cn/open-apis/contact/v3/users/:user_id",
        QueryParams: larkcore.QueryParams{"user_id_type": []string{"open_id"}},
        PathParams:  larkcore.PathParams{"user_id": "ou_xxx"},
        Body:        nil,
    },
)
```

## 4. 事件订阅与 Webhook 处理

当开发者在飞书开放平台配置了事件订阅或回调（Webhook），可以使用 SDK 快速搭建处理服务。

### 4.1 注册事件分发器 (Event Dispatcher)

```go
import (
    "context"
    "fmt"
    
    "github.com/larksuite/oapi-sdk-go/v3/core"
    "github.com/larksuite/oapi-sdk-go/v3/event/dispatcher"
    "github.com/larksuite/oapi-sdk-go/v3/service/im/v1"
)

// 创建事件处理器，需传入后台获取的 VerificationToken 和 EncryptKey
handler := dispatcher.NewEventDispatcher("your_VerificationToken", "your_EncryptKey").
    OnP2MessageReceiveV1(func(ctx context.Context, event *larkim.P2MessageReceiveV1) error {
        // 处理接收到消息的事件
        fmt.Println("收到消息:", larkcore.Prettify(event))
        return nil
    }).
    OnP2UserCreatedV3(func(ctx context.Context, event *larkcontact.P2UserCreatedV3) error {
        // 处理员工创建事件
        return nil
    })
```

### 4.2 启动 HTTP Webhook Server

**使用原生的 `http` 启动：**

```go
import (
    "net/http"
    "github.com/larksuite/oapi-sdk-go/v3/core/httpserverext"
)

func main() {
    // 绑定路由并启动服务
    http.HandleFunc("/webhook/event", httpserverext.NewEventHandlerFunc(handler))
    http.ListenAndServe(":8080", nil)
}
```

**使用 Gin 框架集成：**
*(需引入 `"github.com/larksuite/oapi-sdk-go/v3/core/ext/gin"`, 依赖根据官方文档可能会有细微变动)*

```go
// 假设已初始化 gin engine r 和 上文的 handler
r.POST("/webhook/event", sdkginext.NewEventHandlerFunc(handler))
```

## 5. 消息卡片交互回调

类似事件订阅，消息卡片的交互事件（如点击卡片按钮）也可以通过分发器处理：

```go
import "github.com/larksuite/oapi-sdk-go/v3/card"

// 创建卡片回调处理器
cardHandler := card.NewCardActionHandler("your_VerificationToken", "your_EncryptKey", 
    func(ctx context.Context, cardAction *card.CardAction) (interface{}, error) {
        // 处理卡片回调逻辑，可返回更新后的卡片 JSON 或者自定义交互提示
        fmt.Println(larkcore.Prettify(cardAction))
        return nil, nil
    })

// 绑定 HTTP 路由
http.HandleFunc("/webhook/card", httpserverext.NewCardActionHandlerFunc(cardHandler))
```

## 常见问题与排错

1. **Token 过期或未生效**：SDK 默认开启了 `TenantAccessToken` 的自动获取与缓存（`EnableTokenCache=true`），绝大部分场景不需要手动维护 Token。
2. **调试请求**：开发阶段遇到奇怪的错误，请开启 `lark.WithLogReqAtDebug(true)` 和 `lark.WithLogLevel(larkcore.LogLevelDebug)`，这样可以直接在控制台看到完整的 HTTP Request & Response 帮助排查问题。
3. **域名问题**：国内使用默认的 `https://open.feishu.cn` 即可，若使用海外版 Lark，需要额外指定域名配置 `lark.WithOpenBaseUrl("https://open.larksuite.com")`。

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

AlbionGo 是《艾尔比恩Online》的实时网络分析工具。捕获游戏 UDP 数据包，解码私有协议，将事件流推送到 React 看板和飞书机器人。

## 常用命令

### 后端（Go）

```bash
go run ./cmd/albiongo/main.go    # 启动主程序
go run ./cmd/data_gen/main.go    # 数据生成工具
go build ./...                    # 编译所有包
go test ./...                     # 运行所有测试
go test ./pkg/bus/...             # 运行指定包的测试
```

飞书集成需要 `.env` 文件（参考 `.env.example`），包含 `FEISHU_APP_ID` 和 `FEISHU_APP_SECRET`。

### 前端：`front/zvz`

```bash
npm install
npm run dev      # 启动开发服务器（自定义 Express+tsx server.ts）
npm run build    # Vite 生产构建
npm run lint     # TypeScript 类型检查（tsc --noEmit）
npm run clean    # 删除 dist/
```

### 前端：`front/albion_battle_reports`

```bash
npm install
npm run dev      # Vite 开发服务器，端口 3000
npm run build    # Vite 生产构建
npm run lint     # TypeScript 类型检查（tsc --noEmit）
npm run clean    # 删除 dist/
```

## 架构

### 数据流

```
Albion UDP 数据包
  → pkg/core（pcap 监听，跨平台实现）
  → pkg/protocol/decode（原始字节 → 类型化 Command）
  → pkg/bus（泛型 EventBus[T]，带缓冲 channel）
  → cmd/albiongo/consumer/ 中的消费者：
      ├── GameStatsConsumer  → 内存中的玩家状态
      ├── APIConsumer        → WebSocket 广播
      ├── FileLogConsumer    → JSONL 事件日志（data/*.jsonl）
      ├── ConsoleLogConsumer → 标准输出
      └── FeishuConsumer     → 飞书机器人通知
  → pkg/api（Gin HTTP+WebSocket，端口 :8081）
  → React 前端（WebSocket 实时更新）
```

### 核心包说明

- **`pkg/bus`** — 泛型 `EventBus[T]`，每个消费者独立带缓冲 channel（容量 1000），原子计数统计（入队/丢弃/消费速率）。
- **`pkg/protocol`** — 协议常量在 `codes.go`（stringer 自动生成，约 2.9 万行）；类型定义在 `types/`；解码器在 `decode/`。
- **`pkg/core`** — `AlbionProcessWatcher`，平台专属网卡过滤（`net_interface_filter_darwin/linux/windows.go`）。
- **`pkg/game`** — 领域模型：`Player`（状态+装备）、`Item`、`Spell`、`Localizer`（游戏 ID → 可读名称，依赖 `data/`）。
- **`pkg/api`** — Gin 路由（含 CORS）；gorilla/websocket Hub，带 ping/pong 心跳；同时托管前端静态资源。
- **`pkg/rule`** — JSON 规则引擎，用于飞书通知过滤（`data/feishu_rules.json`）。
- **`pkg/record`** — `EventRecorder`，带缓冲的 JSONL 持久化，5 秒定时刷盘。

### 前端架构

**`front/zvz`** — ZvZ（大规模 PvP）战斗分析：
- 实时时间轴（`vis-timeline`）与战斗回放
- Monaco 编辑器用于应用内规则配置
- Zustand 状态管理
- i18next 中英文本地化
- 使用自定义 Express 服务器（`server.ts`）配合 Vite

**`front/albion_battle_reports`** — 统计看板：
- 战斗统计、玩家表现、武器分析（Recharts）
- 纯 Vite，无自定义服务器

### 数据文件（`data/`）

Go 后端 `Localizer` 在运行时读取的游戏参考数据：
- `indexedItems.json`、`items.json`、`spells.json` — 游戏实体数据库
- `localization.xml` — 游戏字符串 ID → 显示名称
- `weapon_types.json` — 武器类型分类
- `feishu_rules.json` — 通知过滤规则
- `albion_log_*.jsonl` — 持久化事件日志

## 前端 UI 设计规范

规范来源：`.trae/rules/UI/ux-design.md`，前端开发须严格遵守：

- **主题**：暗黑现代工具风（底层 `bg-zinc-950`，卡片 `bg-zinc-900`，悬浮 `bg-zinc-800`）
- **强调色**：仅用 Indigo（主色 `indigo-500`，危险 `red-400`，成功 `green-400`）
- **字体**：UI 文本用 `font-sans`（`text-sm`），所有 ID、时间戳、数字强制用 `font-mono`
- **卡片**：`bg-zinc-900 border border-zinc-800 rounded-xl p-4`
- **模态框**：`bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl`，遮罩 `bg-black/60 backdrop-blur-sm`
- **输入框**：`bg-zinc-950 border border-zinc-800 ... focus:border-indigo-500`
- **过渡动画**：所有交互元素必须包含 `transition-colors duration-200`
- **图标**：仅用 `lucide-react`，统一 1.5px/2px 描边粗细
- **布局**：全屏应用布局（`h-screen w-full overflow-hidden flex`），各面板独立滚动

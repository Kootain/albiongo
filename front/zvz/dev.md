# 项目开发文档

## 1. 项目概述
本项目是一个专为 **Albion Online ZvZ (Zerg vs Zerg)** 大规模团战设计的实时监控面板。它通过捕获并分析游戏数据包（由后端转发），实时可视化战场信息，包括友方/敌方玩家状态、装备变更以及关键技能的释放，辅助指挥官（Caller）进行战术决策。

## 2. 技术栈
- **核心框架**: React 19 + Vite 6
- **编程语言**: TypeScript
- **样式方案**: TailwindCSS 4
- **状态管理**: Zustand
- **图标库**: Lucide React
- **动画库**: Motion (Framer Motion)
- **国际化**: i18next
- **后端 (Dev/Mock)**: Node.js + Express + WebSocket (ws)

## 3. 项目结构
```
src/
├── components/       # UI 组件
│   ├── PlayerInfo/   # 玩家列表展示与详情模态框
│   └── SkillMonitor/ # 技能监控网格与配置编辑器
├── events/           # 游戏事件定义与分发中心
├── filters/          # 技能/事件过滤逻辑
├── hooks/            # 自定义 React Hooks (核心: useWebSocket)
├── store/            # Zustand 状态仓库
├── utils/            # 工具类 (DataManager 用于加载静态元数据)
├── App.tsx           # 应用入口组件
└── server.ts         # 开发服务器 (集成 Mock 数据生成)
```

## 4. 核心架构设计

### 4.1 事件驱动架构 (Event-Driven)
应用采用 **观察者模式 (Observer Pattern)** 处理来自 WebSocket 的高频游戏事件流。
- **EventRegistry (`src/events/EventRegistry.ts`)**: 单例模式的事件注册表，负责管理所有事件处理器。
- **数据流向**: 
  1. WebSocket 接收原始 JSON 消息。
  2. `useWebSocket` 解析消息并调用 `EventRegistry.dispatch(data)`。
  3. 注册的 Handler (如 `CastSpellEvent`, `NewCharacterEvent`) 执行业务逻辑。
  4. 更新对应的 Zustand Store，触发 UI 渲染。

### 4.2 状态管理 (Zustand)
项目使用 Zustand 进行分层状态管理：
- **usePlayerStore**: 管理当前视野内的玩家数据（内存态，高频更新）。
- **useMonitorStore**: 管理监控面板的布局、颜色块配置及过滤策略（持久化至 `localStorage`）。
- **useEventStore**: 管理瞬时事件状态（如技能触发时的视觉反馈）。

### 4.3 技能监控系统 (Skill Monitor)
`SkillMonitor` 组件是核心功能区，由多个可配置的 `ColorBlock` 组成。
- **过滤策略 (Filter Strategy)**: 每个色块绑定一套规则（例如：当 "Guild A" 的玩家使用 "Arcane Staff" 的 "E技能" 时）。
- **实时匹配**: `evaluateBlockFilterStrategies` 函数会对每个 `CastSpellEvent` 进行策略匹配。
- **视觉反馈**: 匹配成功后，对应的色块会执行预设的动画（闪烁、高亮等）。

## 5. 后端与 Mock 服务
`server.ts` 在开发环境中扮演双重角色：
1. **Vite 开发服务器**: 提供前端页面服务。
2. **Mock WebSocket 服务**: 模拟游戏数据流（定时发送随机的施法事件、玩家进出事件），允许在不运行游戏客户端的情况下开发 UI。

## 6. 数据管理
- **静态数据**: 应用启动时通过 `DataManager` 加载 `items.json` (装备数据) 和 `spells.json` (技能数据)，用于 ID 到名称/图标的映射。
- **动态数据**: 玩家位置、血量、装备等信息仅在内存中维护，随 WebSocket 连接生命周期更新。

## 7. 开发指南
1. **安装依赖**: `npm install`
2. **启动开发环境**: `npm run dev` (同时启动前端和 Mock Server)
3. **构建生产版本**: `npm run build`

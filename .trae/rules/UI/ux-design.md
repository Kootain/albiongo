# UI/UX 设计系统规范：Modern Dark Professional Utility

## 1. 设计理念 (Design Philosophy)

- **风格定位**：暗黑现代工具 (Dark Modern Utility)、精密仪表盘 (Dashboard)。
- **核心感受**：专业、克制、精密、现代。界面应像高级开发者工具或科学仪器，强调**功能至上**与**高信息密度**。
- **视觉重心**：主要通过细微的边框 (`border`) 和背景色阶 (`bg-step`) 区分层级。

## 2. 技术栈与工程化 (Tech Stack)

- **CSS 框架**：**Tailwind CSS** (唯一基础样式方案)。
- **图标库**：`lucide-react` (保持 1.5px 或 2px 的一致线条粗细)。
- **工具库**：建议使用 `clsx` + `tailwind-merge` 管理动态类名。

## 3. 配色系统 (Color System - Zinc & Indigo)

全面采用 **Zinc** 色板作为冷调基石，**Indigo** 作为唯一的交互强调色。

### 3.1 背景与层级 (Backgrounds)

| 层级                | Tailwind Class   | 用途                    |
| :---------------- | :--------------- | :-------------------- |
| **底层 (Base)**     | `bg-zinc-950`    | 全局页面背景，App-like 布局底色。 |
| **主容器 (Surface)** | `bg-zinc-900`    | 卡片、侧边栏、顶栏背景。          |
| **次级/悬浮 (Hover)** | `bg-zinc-800`    | 悬浮状态、次级输入框背景。         |
| **内部模块**          | `bg-zinc-900/50` | 嵌套在卡片内部的组件区。          |

### 3.2 边框与阴影 (Borders & Shadows)

- **常规边框**：`border-zinc-800` 或 `border-zinc-700/50` (1px 细边框替代阴影)。
- **激活边框**：`border-indigo-500`。
- **阴影策略**：**遵循要求 A**。常规组件不使用阴影，但**模态框/浮层**必须使用 `shadow-2xl` 以产生深度脱离感。

### 3.3 语义强调色 (Semantic Accents)

- **Primary (主色)**：`indigo-500` (文字 `text-indigo-400`，背景 `bg-indigo-500/10`)。
- **Danger (危险)**：`red-400` (文字 `text-red-400`，背景 `bg-red-400/10`)。
- **Success (成功)**：`green-400`。

***

## 4. 排版规范 (Typography System)

为了兼顾高信息密度与专业感，采用**双字体策略**。

- **UI 文本**：`font-sans` (如 Inter, SF Pro)，默认字号 `text-sm` (14px)。
- **数据/数字**：\*\*强制使用 `font-mono**` (如 JetBrains Mono)。所有 ID、时间戳、金额、坐标必须等宽对齐。
- **微型标签 (Micro-labels)**：`text-xs uppercase tracking-wider text-zinc-500 font-semibold`。
- **截断处理**：长文本强制使用 `truncate` 并配合原生 `title` 属性。

***

## 5. 组件开发标准 (Component Guidelines)

### 5.1 卡片与容器 (Cards)

- **圆角 (遵循要求 A)**：外层大容器使用 **`rounded-xl`** **(12px)** 或 **`rounded-2xl`** **(16px)**，内部元素使用 `rounded-md`。
- **标准公式**：

```html
<div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">...</div>

```

### 5.2 模态框与遮罩 (Modals & Overlays)

- **遮罩层**：`bg-black/60 backdrop-blur-sm`。
- **弹窗本体**：增加深色阴影以脱离底层，公式：`bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl`。

### 5.3 表单控件 (Inputs & Buttons)

- **输入框**：`bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors`。
- **主按钮 (Primary)**：`bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2 transition-colors`。
- **幽灵按钮 (Ghost)**：`bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-lg px-4 py-2 transition-colors`。

***

## 6. 布局与交互 (Layout & Interaction)

### 6.1 布局逻辑 (App-like Structure)

- **视图高度**：采用 `h-screen w-full overflow-hidden flex` 的全屏应用布局。
- **独立滚动**：主内容区与侧边栏各自独立滚动 `overflow-y-auto`。
- **对齐**：严格使用 Flexbox 保持垂直居中 `flex items-center gap-2`。

### 6.2 交互细节

- **过渡**：所有颜色、背景、边框变化必须包含 `transition-colors duration-200`。
- **高信噪比**：默认隐藏卡片内的次要操作（如编辑/删除图标），仅在 `group-hover` 时显示。
- **自定义滚动条**：重写 Webkit 滚动条，使其呈现暗色细线风格，不干扰视觉。


# Lark Docs Excalidraw Add-on

一个集成了 [Excalidraw](https://excalidraw.com/) 绘图功能的飞书文档插件，提供强大的白板绘图能力。

## ✨ 特性

- 🎨 **完整的绘图功能** - 集成 Excalidraw 的所有绘图工具
- 💾 **自动保存** - 1秒防抖自动保存到飞书文档存储
- 📁 **文件导入导出** - 支持 .excalidraw 文件的导入和导出
- 👁️ **智能模式切换** - 自动适配飞书文档的编辑/只读模式
- 🖥️ **全屏支持** - 一键切换全屏编辑模式
- ⌨️ **快捷键** - Cmd/Ctrl+S 立即保存
- 📱 **响应式设计** - 自适应不同尺寸的容器

## 🚀 快速开始

### 安装依赖
```bash
pnpm install
```

### 启动开发服务器
```bash
pnpm run start;
```

开发服务器启动后，在浏览器中打开提供的 URL 进行本地开发和调试。

### 构建生产版本
```bash
pnpm run build
```

### 上传到飞书平台
```bash
pnpm run upload
```

## 📁 项目结构

```
lark-doc-excalidraw/
├── README.md                   # 项目说明文档
├── CLAUDE.md                   # AI 开发指南（详细架构文档）
├── app.json                    # 飞书插件配置
├── package.json                # 项目依赖配置
├── tsconfig.json              # TypeScript 配置
├── webpack.config.js          # Webpack 构建配置
└── src/                       # 源代码目录
    ├── App.tsx                # 主应用组件 (72 行)
    ├── index.css              # 全局样式
    ├── types.ts               # TypeScript 类型定义
    ├── global.d.ts            # 全局类型声明
    ├── components/            # UI 组件
    │   ├── LoadingView/       # 加载状态组件
    │   ├── EmptyStateView/    # 空状态组件
    │   ├── TopToolbar/        # 顶部工具栏组件
    │   └── ExcalidrawCanvas/  # Excalidraw 画布组件
    └── hooks/                 # 自定义 React Hooks
        ├── useExcalidrawData.ts   # 数据管理
        ├── useDocsMode.ts         # 文档模式管理
        ├── useExcalidrawAPI.ts    # Excalidraw API 管理
        └── useAppLifecycle.ts     # 应用生命周期
```

## 🏗️ 技术架构

### 技术栈
- **框架**: React 18 + TypeScript
- **绘图引擎**: Excalidraw
- **构建工具**: Webpack 5 + ESBuild
- **样式**: CSS Modules
- **API**: Lark Block Docs Add-on API

### 架构设计

项目采用模块化架构，将业务逻辑拆分为独立的自定义 Hooks：

- **useExcalidrawData** - 数据层，处理加载/保存/导入/导出
- **useDocsMode** - 模式层，管理编辑/查看模式
- **useExcalidrawAPI** - API层，管理 Excalidraw 实例
- **useAppLifecycle** - 生命周期，处理初始化和快捷键

UI 组件完全独立，每个组件都有自己的样式文件（CSS Modules）。

## 📖 使用指南

### 编辑模式
在飞书文档的编辑模式下，插件提供完整的绘图功能：
- 使用工具栏绘制图形、添加文字、插入图片
- 点击"切换全屏"进入全屏编辑
- 点击"导出文件"下载 .excalidraw 文件
- 点击"查看模式"切换为只读模式
- 所有更改自动保存（1秒防抖）

### 查看模式
在飞书文档的阅读模式下，或手动切换到查看模式：
- 仅显示绘图内容，隐藏所有编辑工具
- 支持缩放和平移查看
- 点击"编辑模式"切换回编辑状态

### 文件操作
- **导入**: 点击"上传 Excalidraw 文件"，选择 .excalidraw 文件
- **导出**: 点击"导出文件"，保存为 .excalidraw 格式
- **创建**: 点击"创建新绘图"开始空白画布

## 🛠️ 开发指南

详细的开发文档请参考 [CLAUDE.md](./CLAUDE.md)，包含：
- 完整的架构说明
- 各模块的职责和 API
- 代码组织原则
- 开发任务指南
- 测试清单

### 常见开发任务

#### 修改保存逻辑
编辑 `src/hooks/useExcalidrawData.ts`

#### 添加工具栏按钮
编辑 `src/components/TopToolbar/TopToolbar.tsx`

#### 修改样式
编辑对应组件的 `.module.css` 文件

#### 添加键盘快捷键
编辑 `src/hooks/useAppLifecycle.ts`

## 🧪 测试

### 功能测试清单
- [ ] 在编辑模式下可以绘图
- [ ] 在只读模式下无法编辑
- [ ] 上传 .excalidraw 文件成功加载
- [ ] 导出文件并重新导入数据一致
- [ ] Cmd/Ctrl+S 触发保存
- [ ] 全屏模式正常切换
- [ ] 编辑/查看模式切换正常
- [ ] 等待1秒后自动保存
- [ ] 刷新页面后数据保持

## 📝 注意事项

1. **数据存储**: 绘图数据保存在飞书文档的 Block Record 存储中
2. **防抖保存**: 修改后1秒自动保存，避免频繁 API 调用
3. **模式强制**: 当飞书文档为只读时，强制为查看模式
4. **快捷键**: Cmd/Ctrl+S 会触发立即保存（跳过防抖）

## 📄 许可证

MIT

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

No mass was harmed during the vibe coding of this app 🎵
Crafted by Kairui × Claude Code

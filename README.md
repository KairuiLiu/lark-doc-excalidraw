# <img src="/static/favicon.svg" alt="Excalidraw Logo" style="width:24px; height:24px;"/>Lark Docs Excalidraw Add-on

一个集成了 [Excalidraw](https://excalidraw.com/) 绘图功能的飞书文档插件, 让你可以在飞书文档中直接创建和编辑 Excalidraw 图形.

<div style="text-align:center;">
<img src="/static/doodlez.png" alt="Screenshot" style="width:100%; max-width:800px; border:1px solid #eee; box-shadow:0 2px 8px rgba(0,0,0,0.1); margin-top:16px;"/>
</div>

> **关于上架**: 为全员上架飞书文档插件需要你找到你上级的上级审批, 并出具安全评估报告, 甚至 "视情况加签至CEO-2". (是的, Chrome 插件商店 = Google 审核, App Store = Apple 审核, 飞书插件 = 你老板审核. 简直就是降本增效的典范).  
> 因此, 这个插件注定只能在 GitHub 上流浪. 不过好在代码是开源的, 你想部署就部署, 想改就改, 不需要请任何老板审批 😉

## ✨ 特性

- 🎨 **完整的绘图功能** - 集成 Excalidraw 的所有绘图工具
- 💾 **自动保存** - 编辑内容自动保存到飞书文档
- 📁 **文件导入** - 支持 .excalidraw 文件的导入
- 🖥️ **全屏支持** - 一键切换全屏模式
- 👁️ **阅读模式** - 自动跟随飞书文档的编辑 / 只读模式
- 🌍 **双语支持** - 自动跟随飞书文档语言 (支持中文&英文)
- 🌓 **深色模式** - 自动跟随飞书文档深色模式
- 👥 **简陋但诚实的协同编辑** - 采用时间戳的覆盖式更新, *没有 CRDT，没有 OT, 就是纯纯的时间戳覆盖*. 议多人编辑前互相吆喝一声, 不然就看谁手快了

## 🚀 部署指南

### 环境配置

1. 前往 [飞书开放平台](https://open.larkoffice.cn/) 创建一个新的应用
2. 在应用管理中选择 - 添加应用能力 - 云文档小组件
3. 配置应用权限 (这一步不需要审批, 放心)
    1. 查看新版文档 `docx:document:readonly`
    2. 编辑新版文档 `docx:document:write_only`
4. 获取应用的 `appID` 和插件的 `BlockTypeID` 填写到 `app.json` 中
5. 新建一个飞书文档, 将地址填入 `app.json` 的 `url` 字段中

### 开发

```bash
# 启动开发
pnpm start

# 提取 i18n 字段
pnpm extract

# 编译 i18n 文件
pnpm compile

# 构建生产包
pnpm build

# 上传到开发者平台
pnpm upload
```

## 📖 使用指南

### 创建新画板
1. 在飞书文档中插入此插件
2. 点击"创建新绘图"开始绘制
3. 或上传已有的 .excalidraw 文件

### 编辑绘图
- 使用工具栏绘制图形, 添加文字, 插入图片
- 编辑顶部标题栏设置画板名称
- 点击 "切换全屏" 进入全屏编辑
- 点击模式按钮在编辑 / 查看模式间切换
- 所有更改自动保存

## 🛠️ 开发者

详细的开发文档请参考 [CLAUDE.md](./CLAUDE.md)，包含：
- 完整的架构设计
- 数据流和状态管理
- 并发控制和同步策略
- 开发指南和最佳实践

---

No mass was harmed during the vibe coding of this app 🎵  
Crafted by Kairui × Claude Code

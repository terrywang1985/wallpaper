# GameShot Wallpaper Manager

一个跨平台的游戏截图壁纸管理工具，支持 Windows 和 macOS。

![GameShot Wallpaper Manager](./docs/preview.png)

## ✨ 功能特性

- 🎮 **游戏预设支持**：内置常见游戏的截图目录提示（原神、星穹铁道、艾尔登法环、Steam 等）
- 📁 **手动目录选择**：安全地选择任意目录浏览图片
- 🖼️ **图片浏览**：瀑布流缩略图展示，支持大图预览
- 🎨 **一键设壁纸**：跨平台壁纸设置（Windows/macOS/Linux）
- 📂 **目录监听**：实时检测新增截图
- ⭐ **收藏功能**：收藏喜欢的图片
- 🌙 **深色主题**：护眼的暗色界面

## 🛠️ 技术栈

- **Electron** - 跨平台桌面应用框架
- **Vite** - 快速的前端构建工具
- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 实用优先的 CSS 框架
- **Chokidar** - 文件监听
- **Sharp** - 高性能图片处理（缩略图生成）

## 📦 安装

### 开发环境

```bash
# 克隆项目
git clone https://github.com/yourusername/gameshot-wallpaper-manager.git
cd gameshot-wallpaper-manager

# 安装依赖
npm install

# 启动开发模式
npm run electron:dev
```

### 生产构建

```bash
# 构建 Windows 版本
npm run build:win

# 构建 macOS 版本
npm run build:mac

# 构建所有平台
npm run build
```

构建产物将输出到 `release/` 目录。

## 🖥️ 平台支持

| 平台 | 架构 | 格式 |
|------|------|------|
| Windows | x64, ia32 | .exe (NSIS 安装器) |
| macOS | x64, arm64 | .dmg |
| Linux | x64 | .AppImage |

## 📖 使用说明

### 1. 选择游戏

从左侧游戏列表中选择你要浏览截图的游戏。每个游戏都会提示其截图的常见保存位置。

### 2. 选择截图目录

点击"选择截图目录"按钮，使用系统文件选择器手动选择目录。

> ⚠️ **隐私说明**：本应用不会自动扫描或探测您的硬盘。所有目录访问都需要用户手动授权。

### 3. 浏览图片

- 单击图片：在右侧预览面板查看详情
- 双击图片：打开大图预览
- 点击"设为壁纸"：将图片设置为桌面背景

### 4. 目录监听（可选）

开启目录监听后，当有新截图保存到目录时，应用会自动刷新并通知你。

## 🔧 开发

### 项目结构

```
/project-root
  /src
    /main          # Electron 主进程
      /services    # 核心服务（图片扫描、壁纸设置、目录监听等）
      index.ts     # 主进程入口
    /preload       # 预加载脚本（IPC 桥接）
    /renderer      # React 渲染进程
      /components  # UI 组件
      /styles      # 样式文件
      App.tsx      # 主应用组件
      main.tsx     # 渲染进程入口
    /shared        # 共享类型和常量
  package.json
  vite.config.ts
  electron-builder.yml
```

### IPC 通道

| 通道 | 描述 |
|------|------|
| `ipc/chooseDirectory` | 打开目录选择对话框 |
| `ipc/scanImages` | 扫描目录中的图片 |
| `ipc/setWallpaper` | 设置桌面壁纸 |
| `ipc/watchDirectory` | 开始监听目录变化 |
| `ipc/stopWatchDirectory` | 停止监听目录 |
| `ipc/getThumbnail` | 获取图片缩略图 |
| `ipc/getFavorites` | 获取收藏列表 |
| `ipc/addFavorite` | 添加收藏 |
| `ipc/removeFavorite` | 移除收藏 |
| `ipc/getSettings` | 获取应用设置 |
| `ipc/saveSettings` | 保存应用设置 |

### 壁纸设置实现

- **Windows**: 使用 PowerShell 调用 Win32 API `SystemParametersInfo`
- **macOS**: 使用 AppleScript 通过 `osascript` 命令设置
- **Linux**: 支持 GNOME (`gsettings`) 和 KDE (`qdbus`)

## 🚀 待实现功能

- [ ] 图片裁剪工具（支持 16:9、21:9、竖屏比例）
- [ ] AI 自动标签（接口预留）
- [ ] 壁纸定时轮换（每 N 分钟自动换一张）
- [ ] 收藏夹分组管理
- [ ] 图片搜索和过滤
- [ ] 多显示器支持

## 📝 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

Made with ❤️ for gamers who love their screenshots.

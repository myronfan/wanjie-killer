# 完结杀手 (Project Unfinished)

> **自演化虚拟小镇**——星露谷物语风格的 2D 世界,网文角色作为 Agent 在其中生活、互动、创作。
> 通过 Build AI(LLM + 图像生成 + 代码生成)自主演化,无需人类干预即可无限发展。

🌐 [开发计划](./开发计划.md) · [参考项目分析](./docs/analysis/reference-projects-analysis.md) · [实施路线](./docs/analysis/implementation-roadmap.md) · [GitHub 仓库](https://github.com/myronfan/wanjie-killer)

---

## 📊 当前进度

### Phase 1: 前端 V0.1 ✅ 80%

- ✅ React + Vite + PixiJS + TypeScript 前端（1258 行代码）
- ✅ 星露谷风格 2D 虚拟小镇（程序化绘制）
- ✅ 4 方向 × 6 帧动画（175ms 帧间隔，从星露谷反编译提取）
- ✅ WASD 角色控制 + Shift 跑步 + 撞墙检测
- ✅ 摄像机跟随 + 时间系统（4 套色调叠加）
- ✅ TypeScript 编译通过 + Vite 生产构建成功
- ⏳ GitHub Pages Web 部署（明天做）
- ⏳ Electron 桌面打包（暂缓，服务器下载二进制卡住）

### 最近更新：2026-07-17

前端 V0.1 完成。详细进度见 [开发计划 § 进度日志](./开发计划.md#附录进度日志)。

---

## 🎮 试玩方式（部署后）

部署完成后，访问：

> 👉 **`https://myronfan.github.io/wanjie-killer/`**

**操作**：

- **WASD / 方向键**：移动角色
- **Shift**：跑步（2 倍速度）
- **E**：互动（暂未实现）
- **空格**：暂停（暂未实现）

---

## 🛠️ 技术栈

| 维度 | 技术 |
|------|------|
| 前端 | React + TypeScript + Vite + PixiJS |
| 后端 | Spring Boot + Java（V6.4.1 已完成，V_final 升级中） |
| LLM | MiniMax（M2.7 / M2.7-highspeed） |
| 渲染 | pixi.js（WebGL 加速 2D 渲染） |
| 资源 | OpenGameArt CC0 资源（暂用程序化绘制） |
| 部署 | GitHub Pages（Web 版）+ Electron（桌面版，暂缓） |

---

## 📁 项目结构

```
完结杀手/
├── 开发计划.md                       # ⭐ 主开发计划（1032 行）
├── README.md                          # 本文件
├── .gitignore
├── docs/
│   ├── analysis/
│   │   ├── reference-projects-analysis.md   # 参考项目分析（796 行）
│   │   └── implementation-roadmap.md        # 实施路线（383 行）
│   └── references/
│       ├── AI-Town/                # 参考:RemyFinn/AI-Town
│       └── StardewValleyDecompiled/   # 参考:星露谷反编译
└── frontend/                        # ⭐ 前端代码
    ├── src/                         # 源代码（1258 行）
    │   ├── core/                    # 核心系统（8 个模块）
    │   ├── components/              # Pixi 组件
    │   ├── hooks/                   # React hooks
    │   ├── styles/                  # Tailwind 样式
    │   ├── App.tsx                  # 主应用
    │   └── main.tsx                 # React 入口
    ├── electron/                    # Electron 配置（待启用）
    ├── public/                      # 静态资源
    ├── assets/                      # 像素资源
    ├── index.html                   # HTML 入口
    ├── package.json                 # npm 配置
    ├── vite.config.ts               # Vite 配置
    ├── tsconfig.json                # TS 配置
    ├── tailwind.config.js           # Tailwind 配置
    └── Makefile                     # 懒人命令集
```

---

## 📚 参考项目

| 项目 | 协议 | 用途 |
|------|------|------|
| [a16z-infra/ai-town](https://github.com/a16z-infra/ai-town) | MIT | Agent 架构 + PixiJS 渲染参考 |
| [RemyFinn/AI-Town](https://github.com/RemyFinn/AI-Town) | None | NPC 配置思路 |
| [Dannode36/StardewValleyDecompiled](https://github.com/Dannode36/StardewValleyDecompiled) | None | 星露谷动画原理 |

---

## 🎨 像素资源来源

所有像素资源来自 OpenGameArt（CC0 协议）：

- [16x16 Game Assets by George Bailey](https://opengameart.org/content/16x16-game-assets)
- [16x16 RPG Tileset by hilau](https://opengameart.org/content/16x16-rpg-tileset)
- [Tiny RPG Forest by ansimuz](https://opengameart.org/content/tiny-rpg-forest)
- [Pixel Art GUI by Mounir Tohami](https://mounirtohami.itch.io/pixel-art-gui-elements)

> ⚠️ **当前版本使用程序化绘制**（保证先跑通流程），后续将替换为真实 OpenGameArt 资源。

---

## 🎓 学术参考

- [Generative Agents: Interactive Simulacra of Human Behavior](https://arxiv.org/abs/2304.03442)

---

## 📜 许可

本项目代码 MIT 协议。参考项目代码遵循各自原协议。

# 完结杀手 (Project Unfinished)

> **自演化虚拟小镇**——星露谷物语风格的 2D 世界,网文角色作为 Agent 在其中生活、互动、创作。
> 通过 Build AI(LLM + 图像生成 + 代码生成)自主演化,无需人类干预即可无限发展。

🌐 [开发计划](./开发计划.md) · [参考项目分析](./docs/analysis/reference-projects-analysis.md) · [实施路线](./docs/analysis/implementation-roadmap.md)

## 项目特色

- **星露谷风格 2D 世界**：参考 *Stardew Valley* 视觉风格
- **网文角色 Agent**：每个角色由 LLM 驱动,有记忆、能反思、能自主决策
- **Build AI**：NPC 能自主创造新道具、新建筑、新规则
- **MiniMax 驱动**：使用 MiniMax 的 OpenAI 兼容 API

## 技术栈

| 维度 | 技术 |
|------|------|
| 前端 | React + TypeScript + Vite + PixiJS + Electron |
| 后端 | Spring Boot + Java |
| LLM | MiniMax(M2.7 / M2.7-highspeed) |
| 向量存储 | pgvector / 内存实现 |
| 渲染 | pixi-react(pixi.js 的 React 封装) |
| 资源 | OpenGameArt CC0 资源 |

## 项目结构

```
完结杀手/
├── 开发计划.md                 # ⭐ 主开发计划
├── README.md                   # 本文件
├── docs/
│   ├── analysis/
│   │   ├── reference-projects-analysis.md  # 参考项目深度分析
│   │   └── implementation-roadmap.md       # 实施路线
│   └── references/
│       ├── AI-Town/             # 参考:RemyFinn/AI-Town(Python Agent)
│       └── StardewValleyDecompiled/  # 参考:星露谷反编译(动画原理)
├── frontend/                   # 前端代码(待创建)
│   ├── src/
│   │   ├── components/         # React + PixiJS 组件
│   │   ├── hooks/              # React hooks
│   │   ├── editor/             # 地图/精灵编辑器
│   │   └── data/               # sprite/动画数据
│   └── electron/               # Electron 配置
└── backend/                    # 后端代码(待创建)
    ├── src/main/java/com/wanjie/
    │   ├── agent/              # Agent 系统
    │   ├── build/              # Build AI
    │   ├── storyline/          # 剧本系统
    │   ├── rules/              # 规则引擎
    │   └── llm/                # MiniMax 客户端
    └── src/main/resources/npcs/  # NPC 人设 YAML
```

## 参考项目

本项目借鉴了以下开源项目：

| 项目 | 协议 | 用途 |
|------|------|------|
| [a16z-infra/ai-town](https://github.com/a16z-infra/ai-town) | MIT | Agent 架构 + PixiJS 渲染 |
| [RemyFinn/AI-Town](https://github.com/RemyFinn/AI-Town) | None | NPC 配置思路 |
| [Dannode36/StardewValleyDecompiled](https://github.com/Dannode36/StardewValleyDecompiled) | None | 星露谷动画原理 |

## 资源来源

所有像素资源来自 OpenGameArt(CC0 协议):
- [16x16 Game Assets by George Bailey](https://opengameart.org/content/16x16-game-assets)
- [16x16 RPG Tileset by hilau](https://opengameart.org/content/16x16-rpg-tileset)
- [Tiny RPG Forest by ansimuz](https://opengameart.org/content/tiny-rpg-forest)
- [Pixel Art GUI by Mounir Tohami](https://mounirtohami.itch.io/pixel-art-gui-elements)

## 学术参考

- [Generative Agents: Interactive Simulacra of Human Behavior](https://arxiv.org/abs/2304.03442)

## 快速开始

待 Phase 1 完成后添加。

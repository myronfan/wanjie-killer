# 实施路线详细文档

> 本文档为开发计划的**配套实施手册**。每个阶段提供:
> - 详细任务分解
> - 验收标准
> - 风险与应对
> - 工时估算

---

## Phase 1：前端视觉升级（4 周）

### 目标
完成 PixiJS 渲染框架 + 星露谷风格资源集成，交付一个能跑、有角色能走动的桌面应用。

### Week 1：集成 PixiJS + Electron 基础框架

**任务清单**：
- [ ] 安装 Vite + React + TypeScript + pixi-react
- [ ] 安装 Electron + electron-builder
- [ ] 配置 Vite Electron 集成（vite-plugin-electron）
- [ ] 创建基础 App.tsx + Game.tsx 框架
- [ ] 实现 PixiGame.tsx 渲染一个空白 PixiJS canvas
- [ ] 写 Makefile 自动化命令：
  - `make dev`：启动开发模式
  - `make build`：打包 EXE
  - `make clean`：清理

**验收标准**：
- ✅ `npm run dev` 能启动开发服务器
- ✅ `npm run build` 能打包出 EXE
- ✅ EXE 双击能弹出窗口,显示一个蓝色背景

**风险**：
- Electron + Vite 集成可能有兼容性问题 → 用 electron-vite 模板
- PixiJS 在 Electron 里的渲染性能 → 用 WebGL 后端

**工时**：5 天

### Week 2：瓦片地图系统

**任务清单**：
- [ ] 下载 OpenGameArt 16x16 资源包
  - https://opengameart.org/content/16x16-game-assets
  - https://opengameart.org/content/16x16-rpg-tileset
- [ ] 实现 PixiStaticMap.tsx（静态地图渲染）
- [ ] 实现瓦片数据加载（从 .ts 文件）
- [ ] 实现 PixiViewport.tsx（视口/相机）
- [ ] 实现摄像机跟随玩家
- [ ] 实现撞墙检测

**验收标准**：
- ✅ 屏幕显示完整的草地地图
- ✅ 鼠标拖拽可以滚动地图
- ✅ 摄像机跟随玩家移动

**风险**：
- 资源文件太大导致加载慢 → 用 pixi 的纹理图集
- 摄像机抖动 → 用 lerp 平滑过渡

**工时**：5 天

### Week 3：角色 sprite 与动画

**任务清单**：
- [ ] 实现 sprite sheet 切片工具（借鉴 a16z data/spritesheets/）
- [ ] 实现 AnimatedSprite 组件（4 方向 × 6 帧,175ms 间隔）
- [ ] 实现 Player.tsx（玩家角色）
- [ ] 实现 WASD 控制
- [ ] 实现 Character.tsx（NPC 角色基类）
- [ ] 实现 1-2 个 NPC 静态显示

**验收标准**：
- ✅ 角色能 4 方向走动
- ✅ 走路动画流畅（175ms 帧间隔）
- ✅ 站立时静止

**风险**：
- sprite 切片数据格式 → 参考 a16z 数据结构
- 动画卡顿 → 用 pixi-ticker 而非 setTimeout

**工时**：5 天

### Week 4：UI 与第一个 EXE

**任务清单**：
- [ ] 实现 Messages.tsx（对话气泡）
- [ ] 实现基础按钮（来自 Pixel Art GUI 资源）
- [ ] 实现玩家信息 HUD（坐标、方向）
- [ ] 调色板系统（暖色、亮色、暗色切换）
- [ ] 完整测试 + Bug 修复
- [ ] 打包第一个 EXE 并测试

**验收标准**：
- ✅ EXE 双击能弹出窗口
- ✅ 显示地图 + 角色 + UI
- ✅ 走动 + 撞墙 + 对话气泡工作正常
- ✅ 60 fps 流畅运行

**风险**：
- EXE 打包后资源丢失 → 用相对路径
- EXE 体积过大 → 用 asar 压缩

**工时**：5 天

### Phase 1 交付物

- ✅ 可运行的桌面 EXE（v1.0）
- ✅ 完整地图 + 可走动角色
- ✅ 星露谷味儿 ≥ 60%（自评）
- ✅ 代码覆盖率 ≥ 50%

---

## Phase 2：Agent Engine + 记忆系统（4 周）

### 目标
实现完整的 Agent 系统：NPC 能自主决策、对话、记忆。

### Week 5：Agent Engine 主循环

**任务清单**：
- [ ] 设计 Agent Loop 数据流（参考 a16z 设计）
- [ ] 实现 AgentEngine.java（主类）
- [ ] 实现 AgentLoop.java（tick 逻辑）
- [ ] 实现 NPCConfigLoader.java（YAML 加载）
- [ ] 写 3-5 个示例 NPC YAML（林动、萧炎、林貂...）
- [ ] 实现 NPC 调度系统（基于游戏内时间）

**验收标准**：
- ✅ NPC 按 schedule 自主移动
- ✅ 每 10 分钟（游戏内时间）触发一次行为检查
- ✅ NPC 行为日志清晰

**风险**：
- Spring Boot 调度冲突 → 用 @Scheduled 注解
- 状态管理混乱 → 用单一 WorldState 对象

**工时**：5 天

### Week 6：MiniMax API + 对话系统

**任务清单**：
- [ ] 实现 MiniMaxClient.java（OpenAI 兼容）
- [ ] 实现 ConversationManager.java
- [ ] 实现对话 prompt 工程（参考 a16z 模板）
- [ ] 实现 startConversation / continueConversation
- [ ] 实现 NPC 主动搭话逻辑
- [ ] 前端实现对话气泡显示

**验收标准**：
- ✅ NPC 能主动和玩家对话
- ✅ NPC 能回复玩家问题
- ✅ 对话风格符合 NPC 人设

**风险**：
- LLM 调用慢 → 异步处理 + typing indicator
- LLM 成本高 → 缓存 + 简化 prompt

**工时**：5 天

### Week 7：记忆系统

**任务清单**：
- [ ] 实现 VectorStore.java（向量存储）
- [ ] 实现 MemorySystem.java（参考 a16z 设计）
- [ ] 实现 EmbeddingService.java（MiniMax embedding）
- [ ] 实现 rememberConversation（对话后总结）
- [ ] 实现 retrieveMemories（向量检索）
- [ ] 实现记忆衰减机制

**验收标准**：
- ✅ NPC 能记住过去对话
- ✅ NPC 能检索相关记忆
- ✅ 问 NPC 过去的事能正确回答

**风险**：
- 向量数据库选择 → 用 pgvector 或内存实现
- embedding 成本 → 缓存 + 批量处理

**工时**：5 天

### Week 8：反思机制 + 互动

**任务清单**：
- [ ] 实现 reflectOnMemories（定期反思）
- [ ] 实现 RelationshipManager.java（好感度）
- [ ] NPC 之间互动（NPC 找 NPC 聊天）
- [ ] 实现 useHistoricalValue hook（前端平滑插值）
- [ ] 性能测试 + 优化

**验收标准**：
- ✅ NPC 之间会自发对话
- ✅ NPC 关系会随互动变化
- ✅ 长时间运行（1 小时）无崩溃
- ✅ 角色移动平滑无卡顿

**风险**：
- LLM 调用风暴 → 决策频率分级
- 状态膨胀 → 定期清理过期记忆

**工时**：5 天

### Phase 2 交付物

- ✅ 完整 Agent 系统
- ✅ 5+ NPC 自主生活
- ✅ 记忆 + 反思 + 好感度
- ✅ 视觉 + 性能达到星露谷味儿 ≥ 70%

---

## Phase 3：Build AI 升级（6 周）

### 目标
实现 LLM 生成道具/建筑/规则,世界可自演化。

### Week 9-10：Build AI 核心

**任务清单**：
- [ ] 实现 BuildAI.java（主类）
- [ ] 需求分析 prompt 设计
- [ ] 类型分类 prompt 设计
- [ ] 配方设计 prompt 设计（JSON 输出）
- [ ] 实现 BuildArtifact 数据结构
- [ ] LLM 输出解析 + 校验

**验收标准**：
- ✅ NPC 能"提议"做新东西
- ✅ LLM 输出符合 JSON Schema
- ✅ 至少 8/10 次 build 成功

**风险**：
- LLM 输出不稳定 → 多重校验 + 失败重试
- 解析错误 → 用结构化输出（tool use）

**工时**：10 天

### Week 11-12：图像生成

**任务清单**：
- [ ] 调研 MiniMax 图像 API
- [ ] 实现 ImageGenerator.java
- [ ] prompt 设计（像素风、尺寸、视角）
- [ ] 图像后处理（降采样到 16x16、调色板约束）
- [ ] 集成 sprite 切片系统
- [ ] 测试图像质量

**验收标准**：
- ✅ NPC 能生成像素 sprite
- ✅ 生成的图符合星露谷风格
- ✅ sprite 能正确加载到游戏

**风险**：
- 图像生成慢（30 秒+）→ 异步 + 占位 sprite
- 图像质量不稳定 → 多生成 + 人工审核

**工时**：10 天

### Week 13-14：代码生成 + sandbox

**任务清单**：
- [ ] 设计代码生成 prompt（行为代码、交互逻辑）
- [ ] 实现 CodeGenerator.java
- [ ] 实现 Sandbox.java（三层防御）
- [ ] 实现 RuleProposal（AI 提议规则）
- [ ] 集成测试

**验收标准**：
- ✅ NPC 能生成可执行代码
- ✅ sandbox 拦截所有危险调用
- ✅ 至少 80% 生成的代码运行成功

**风险**：
- 代码 bug 破坏世界 → sandbox + 人类审核模式
- LLM 生成代码不优雅 → 限制代码复杂度

**工时**：10 天

### Phase 3 交付物

- ✅ 完整 Build AI 系统
- ✅ NPC 能创造新道具、新建筑、新规则
- ✅ 世界可自演化

---

## Phase 4：剧本系统 + 自动模式（4 周）

### Week 15-16：剧本引擎

**任务清单**：
- [ ] 实现 StorylineEngine.java
- [ ] 设计 Chapter 数据结构
- [ ] 设计 EventTrigger 系统
- [ ] 实现主线剧情（林动找回父亲）
- [ ] 实现软引导（不强制 NPC 行为）

**验收标准**：
- ✅ 剧本能按章节推进
- ✅ AI 偏离剧本时降级到可选支线
- ✅ 主要剧情节点能完成

### Week 17：规则提案

**任务清单**：
- [ ] 实现 RuleEngine 扩展
- [ ] 实现 AI 提议规则机制
- [ ] 实现投票/审核流程
- [ ] 测试规则提案

### Week 18：完全自动模式 + 集成测试

**任务清单**：
- [ ] 实现 AutoPlayerToggle（玩家切换只看模式）
- [ ] 集成所有功能
- [ ] 性能优化（连续运行 7 天无崩溃）
- [ ] 完整测试用例
- [ ] 用户文档 + 部署文档

### Phase 4 交付物

- ✅ 完整 V_final
- ✅ 剧本 + Build AI + Agent + 自动模式全集成
- ✅ 稳定性测试通过（7 天无崩溃）

---

## 总体时间表

```
Week  | Phase                          | 交付
------+--------------------------------+-------
1-4   | Phase 1: 前端视觉升级           | v1.0 EXE
5-8   | Phase 2: Agent + 记忆           | v1.5 EXE
9-14  | Phase 3: Build AI              | v2.0 EXE
15-18 | Phase 4: 剧本 + 自动模式        | v2.5 EXE (V_final)
```

## 成功指标（最终验收）

| 指标 | 目标 | 测量方法 |
|------|------|---------|
| 功能完成度 | 100% | 所有 Phase 任务完成 |
| 视觉美观度 | ≥ 80% | 盲测:与星露谷对比 |
| Build 成功率 | ≥ 80% | 10 次 build 测试 |
| LLM 成本 | ≤ 5 元/天 | 日志统计 |
| 稳定性 | 7 天无崩溃 | 压力测试 |
| 演化指标 | 日均 ≥ 3 新事件 | 自动统计 |
| 性能 | 60 fps | PixiJS 性能监控 |

---

## 风险预案

### 风险 1：LLM 成本失控

**应对**：
- 决策分级（村长 30s, 村民 5min）
- 批量决策（同区域 NPC 共享调用）
- 决策缓存（相似情境缓存 1 小时）
- 简单 NPC 用本地模型

### 风险 2：Build AI 生成失败率高

**应对**：
- 多重校验（JSON Schema + 业务规则）
- 失败重试（最多 3 次）
- 降级方案（用预设模板）

### 风险 3：世界状态爆炸

**应对**：
- 定期清理过期记忆
- 限制 NPC 数量（≤ 50）
- 限制建筑数量（≤ 100）

### 风险 4：视觉风格跑偏

**应对**：
- 调色板硬约束（所有颜色必须从 256 色里选）
- 像素规格硬约束（所有 sprite 必须是 16 倍数）
- 视觉走查 checklist

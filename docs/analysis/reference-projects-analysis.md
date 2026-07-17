# 参考项目深度分析

> 本文档详细分析三个核心参考项目的**架构、亮点、可复用部分、风险点**。
> 用于指导"完结杀手"项目的实现。

---

## 一、a16z-infra/ai-town ⭐⭐⭐⭐⭐

### 项目概况

| 指标 | 数值 |
|------|------|
| Stars | **10,174** |
| Forks | 1,130 |
| License | **MIT**(最宽松) |
| 组织 | a16z(管理 350 亿美元资产的顶级 VC) |
| 最近更新 | 2026-06(持续维护) |
| 描述 | "A MIT-licensed, deployable starter kit for building and customizing your own version of AI town - a virtual town where AI characters live, chat and socialize." |

### 技术栈

```
前端：
  - React + TypeScript + Vite
  - pixi-react(PixiJS 的 React 封装)
  - Tailwind CSS

后端：
  - Convex(响应式数据库 + Serverless)
  - TypeScript

LLM：
  - 默认 llama3(本地 Ollama)
  - 可配置:OpenAI / Together.ai / 任何 OpenAI 兼容 API
  - **可无缝替换为 MiniMax**

美术资源(全部 CC0/MIT)：
  - 16x16 Game Assets by George Bailey
  - 16x16 RPG Tileset by hilau
  - Tiny RPG Forest by ansimuz
  - Pixel Art GUI by Mounir Tohami
```

### 项目结构

```
ai-town/
├── ARCHITECTURE.md         # 详细架构文档(18.7KB)
├── README.md
├── convex/                  # 后端(Server-side game logic)
│   ├── aiTown/             # 游戏核心逻辑
│   │   ├── agent.ts        # Agent 主循环
│   │   ├── agentDescription.ts
│   │   ├── agentInputs.ts
│   │   ├── agentOperations.ts
│   │   ├── conversation.ts
│   │   ├── conversationMembership.ts
│   │   ├── game.ts
│   │   ├── ids.ts
│   │   ├── inputHandler.ts
│   │   ├── inputs.ts
│   │   ├── insertInput.ts
│   │   ├── location.ts
│   │   ├── main.ts
│   │   ├── movement.ts
│   │   ├── player.ts
│   │   ├── playerDescription.ts
│   │   ├── schema.ts
│   │   ├── world.ts
│   │   └── worldMap.ts
│   ├── agent/              # Agent 异步逻辑
│   │   ├── conversation.ts # 对话 prompt 工程
│   │   ├── embeddingsCache.ts
│   │   ├── memory.ts       # ⭐ 记忆系统
│   │   └── schema.ts
│   ├── engine/             # 游戏引擎
│   ├── constants.ts
│   ├── crons.ts
│   ├── http.ts
│   ├── init.ts
│   ├── messages.ts
│   ├── music.ts
│   ├── schema.ts
│   ├── testing.ts
│   ├── util/
│   └── world.ts
├── src/                     # 前端
│   ├── App.tsx
│   ├── components/
│   │   ├── Character.tsx
│   │   ├── ConvexClientProvider.tsx
│   │   ├── DebugPath.tsx
│   │   ├── DebugTimeManager.tsx
│   │   ├── FreezeButton.tsx
│   │   ├── Game.tsx
│   │   ├── MessageInput.tsx
│   │   ├── Messages.tsx
│   │   ├── PixiGame.tsx          # ⭐ pixi-react 渲染
│   │   ├── PixiStaticMap.tsx     # ⭐ 静态地图
│   │   ├── PixiViewport.tsx      # ⭐ 视口/相机
│   │   ├── Player.tsx
│   │   ├── PlayerDetails.tsx
│   │   ├── PositionIndicator.tsx
│   │   └── buttons/
│   ├── editor/                   # ⭐ 地图/精灵编辑器
│   │   ├── maps/
│   │   ├── spritefile.js        # sprite 切片工具
│   │   ├── mapfile.js           # 地图序列化
│   │   ├── le.js                # 地图编辑器主逻辑
│   │   ├── se.js                # sprite 编辑器
│   │   └── *.json               # 编辑数据
│   ├── hooks/
│   └── index.css
├── data/                    # 数据
│   ├── spritesheets/        # sprite 切片定义(.ts)
│   │   ├── player.ts
│   │   ├── f1.ts ~ f8.ts    # 不同角色
│   │   ├── p1.ts ~ p3.ts
│   │   └── types.ts
│   ├── animations/          # 动画 JSON
│   │   ├── campfire.json
│   │   ├── gentlesparkle.json
│   │   ├── gentlesplash.json
│   │   ├── gentlewaterfall.json
│   │   └── windmill.json
│   ├── characters.ts
│   ├── convertMap.js
│   └── gentle.js
├── assets/                  # UI 资源
└── public/                  # 静态资源
```

### 架构亮点详解

#### 1. 分层架构

```
┌─────────────────────────────────────────┐
│  convex/aiTown/                          │  服务端游戏逻辑
│  - 定义 AI Town 的状态                   │
│  - 状态如何随时间演化                    │
│  - 如何响应用户输入                      │
│  - 人类和 Agent 都通过 input 提交        │
└─────────────────────────────────────────┘
                ↕
┌─────────────────────────────────────────┐
│  src/                                    │  客户端 UI
│  - pixi-react 渲染游戏状态               │
│  - useQuery 加载数据                     │
└─────────────────────────────────────────┘
                ↕
┌─────────────────────────────────────────┐
│  convex/engine/                          │  游戏引擎(通用)
│  - 与 AI Town 特定逻辑分离               │
│  - 保存/加载游戏状态                     │
│  - 协调输入到引擎                        │
└─────────────────────────────────────────┘
                ↕
┌─────────────────────────────────────────┐
│  convex/agent/                           │  Agent 异步逻辑
│  - Agent 是游戏循环的一部分              │
│  - 可启动异步函数做长任务(LLM 调用)      │
│  - 函数可保存状态或提交 input             │
└─────────────────────────────────────────┘
```

**这种分层让修改 Agent 行为但保持游戏机制、或添加新游戏元素都很容易**。

#### 2. 核心数据模型

```typescript
// Worlds: 一个地图,有多个 player 互动
// Players: 核心角色,有人类可读的名字和描述
// Conversations: 由 player 创建,在某时刻结束
// ConversationMemberships: 表明 player 是 conversation 成员
//   状态:invited / walkingOver / participating
//   每个 conversation 恰好 2 个成员
```

#### 3. Inputs 系统

```typescript
// AI Town 通过处理 input 修改数据模型
// Input 由 player 和 agent 提交,由游戏引擎处理

// 主要 input 类型:
- join        // 加入游戏
- leave       // 离开游戏
- moveTo      // 移动到某位置
- startConversation     // 开始对话
- acceptInvite          // 接受邀请
- rejectInvite          // 拒绝邀请
- leaveConversation     // 离开对话
- startTyping           // 开始打字(typing indicator)
- finishSendingMessage  // 结束发送消息
```

#### 4. 游戏循环(tick-based)

```typescript
class Game {
  // 每秒 60 tick(高频率,平滑动画)
  // 每秒 1 step(低频率,保存状态)
  
  async tick(now) {
    // 60 fps 平滑模拟
    this.playerPathfinding();
    this.playerPosition();
    this.conversationTick();
    this.agentTick();
  }
  
  async step() {
    // 1. 加载游戏状态
    const state = await loadWorld();
    // 2. 处理所有 pending input
    for (const input of pendingInputs) await this.handleInput(input);
    // 3. 跑 60 次 tick
    for (let i = 0; i < 60; i++) await this.tick(now + i * 16.67);
    // 4. 保存状态(diff)
    await saveWorld(state);
  }
}
```

#### 5. 历史插值(解决卡顿关键!)

```typescript
// 问题:服务器每秒更新一次,客户端按 60 fps 渲染
// 方案:在 step 内记录每 tick 的位置到 history buffer

// HistoricalObject
class HistoricalObject {
  // 只能有 numeric 字段
  // 必须声明哪些字段要 track
  // 自动跟踪每个 tick 的值
}

// 客户端 useHistoricalValue hook
function useHistoricalValue(buffer) {
  const [now, setNow] = useState(performance.now());
  
  useEffect(() => {
    let raf: number;
    const tick = (t: number) => {
      setNow(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  
  return interpolate(buffer, now);
}
```

#### 6. Agent Loop(核心创新)

```typescript
class Agent {
  async tick() {
    // 1. 读取游戏状态
    const state = await this.readState();
    
    // 2. 决定做什么
    if (this.shouldStartConversation(state)) {
      // 3. 启动异步操作(LLM 调用)
      await this.startOperation({
        type: 'startConversation',
        target: state.nearbyPlayer,
        callback: async (ctx) => {
          // 4. 加载对方记忆
          const memories = await memory.retrieve(this.id, target.name);
          
          // 5. 调 LLM 生成对话
          const message = await llm.generate(buildPrompt({
            personality: this.personality,
            memories,
            otherPlayer: target
          }));
          
          // 6. 通过 input 提交(不要直接写状态!)
          await ctx.submitInput('startConversation', { message });
        }
      });
    }
  }
}
```

#### 7. 记忆系统(⭐ 最值得借鉴)

```typescript
// 短期记忆:当前对话上下文(类似 LLM context)
// 长期记忆:对话结束后 LLM 总结 + embedding
// 反思:定期生成高层次经验

class MemorySystem {
  // 对话结束后调用
  async rememberConversation(playerId, conversationId) {
    const messages = await loadMessages(conversationId);
    
    // 1. LLM 总结对话
    const summary = await llm.generate(`
      You are ${player.name}, and you just finished a conversation 
      with ${otherPlayer.name}. Summarize from your perspective, 
      using first-person pronouns. Add if you liked or disliked.
      
      ${formatMessages(messages)}
      
      Summary:
    `);
    
    // 2. 计算 embedding
    const embedding = await fetchEmbedding(summary);
    
    // 3. 存入向量数据库
    await vectorDB.insert({
      playerId,
      description: `Conversation with ${otherPlayer.name}: ${summary}`,
      importance: await calculateImportance(summary),
      embedding,
      createdAt: Date.now()
    });
    
    // 4. 触发反思
    await this.reflect(playerId);
  }
  
  // 检索相关记忆
  async retrieveMemories(playerId, query, topK = 3) {
    const queryEmbedding = await fetchEmbedding(query);
    const memories = await vectorDB.search(queryEmbedding, topK * 10);
    
    // 排序:相关性 + 时效性 + 重要性
    return memories
      .map(m => ({
        memory: m,
        score: relevance(m) * 0.5 + 
               recency(m) * 0.3 + 
               importance(m) * 0.2
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
  
  // 反思
  async reflect(playerId) {
    const recentMemories = await vectorDB.getRecent(playerId, 100);
    
    // 生成 3 个高层次问题
    const questions = await llm.generate(`
      What are the 3 most salient high-level questions 
      we can answer about the recent conversations of ${player.name}?
      
      ${formatMemories(recentMemories)}
    `);
    
    for (const question of questions) {
      const related = await this.retrieveMemories(playerId, question);
      const insight = await llm.generate(`
        Based on these memories: ${formatMemories(related)}
        Answer: ${question}
      `);
      await vectorDB.insert({
        playerId,
        description: insight,
        type: 'reflection',
        importance: 8
      });
    }
  }
}
```

#### 8. 设计目标与限制

**目标**：
- 尽量像普通 Convex app,使用常规 client hooks
- 模拟采用 tick 模型(常见、直观)
- Agent 行为与游戏引擎解耦

**限制**：
- 所有数据每步加载到内存,游戏状态应 < 几十 KB
- 所有 input 通过数据库(高频输入场景不适合)
- 输入延迟 ~1.5s(step 250ms 可减少但增加开销)
- 游戏引擎单线程

### 对完结杀手项目的价值

| 模块 | 借鉴方式 |
|------|---------|
| Agent Loop 架构 | 参考设计,在 Spring Boot 重写 |
| 记忆系统(LLM 总结+embedding) | 参考设计,在 Spring Boot 重写 |
| 对话 prompt 工程 | 直接参考 prompt 模板 |
| 游戏引擎 tick 设计 | 参考架构 |
| PixiGame / PixiViewport | ✅ 直接借鉴前端代码 |
| useHistoricalValue hook | ✅ 直接借鉴 |
| sprite sheet 切片方式 | ✅ 直接借鉴 |
| 地图编辑器设计 | ✅ 直接借鉴 |
| OpenGameArt 资源 | ✅ 直接下载使用 |

---

## 二、RemyFinn/AI-Town ⭐⭐

### 项目概况

| 指标 | 数值 |
|------|------|
| Stars | 2(社区小) |
| License | **None**(⚠️ 商业使用前确认) |
| 最近更新 | 2026-06 |
| 描述 | "AI-Town 是一个基于 Phaser + FastAPI + Agents 的 AI 小镇模拟项目,支持具备记忆与好感度系统的多 NPC 智能对话与行为交互。" |

### 技术栈

```
前端:
  - Phaser(2D 游戏框架)⭐ 比 PixiJS 更游戏化
  - TypeScript + Vite
  - 客户端 / src/phaser/

后端:
  - FastAPI(Python)
  - HelloAgents 框架
  - 记忆 + 好感度系统
```

### 项目结构

```
AI-Town/
├── README.md
├── SETUP_GUIDE.md
├── MEMORY_SYSTEM_GUIDE.md         # ⭐ 记忆系统思路
├── AFFINITY_SYSTEM_GUIDE.md       # ⭐ 好感度系统
├── DIALOGUE_LOG_GUIDE.md          # 对话日志
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── backend/                       # Python FastAPI
│   ├── main.py
│   ├── agents.py                  # ⭐ NPC Agent 系统
│   ├── models.py
│   ├── relationship_manager.py    # ⭐ 好感度管理
│   ├── state_manager.py
│   ├── batch_generator.py
│   ├── config.py
│   ├── logger.py
│   ├── view_logs.py
│   └── requirements.txt
├── src/                           # 前端
│   ├── main.ts
│   ├── styles.css
│   ├── game/                      # 游戏资源
│   ├── phaser/                    # Phaser 实现
│   └── ui/
├── docs/
│   └── phaser-migration.md
└── deploy/
```

### 借鉴的亮点

#### 1. NPC 配置(清晰的人设)

```python
# backend/agents.py
NPC_ROLES = {
    "张三": {
        "title": "Python工程师",
        "location": "工位区",
        "activity": "写代码",
        "personality": "技术宅,喜欢讨论算法和框架",
        "expertise": "多智能体系统、HelloAgents框架、Python开发、代码优化",
        "style": "简洁专业,喜欢用技术术语,偶尔吐槽bug",
        "hobbies": "看技术博客、刷LeetCode、研究新框架"
    },
}

def create_system_prompt(name, role):
    return f"""你是{role['title']}{name}。

【角色设定】
- 职位: {role['title']}
- 性格: {role['personality']}
- 专长: {role['expertise']}
- 说话风格: {role['style']}
- 爱好: {role['hobbies']}
- 当前位置: {role['location']}
- 当前活动: {role['activity']}

【行为准则】
1. 保持角色一致性,用第一人称"我"回答
2. 回复简洁自然,控制在30-50字以内
3. 可以适当提及你的工作内容和兴趣爱好
4. 对玩家友好,但保持专业和真实感
5. 如果问题超出专长,可以推荐其他同事
6. 偶尔展现一些个性化的小习惯或口头禅
"""
```

**对我们的价值**：
- ✅ NPC YAML 配置的格式可以借鉴
- ✅ system prompt 模板可以参考
- ✅ "30-50 字"等具体限制值得参考

#### 2. 好感度系统(独立模块)

```python
# backend/relationship_manager.py
class RelationshipManager:
    """管理 NPC 之间的好感度和关系"""
    
    def __init__(self):
        self.relationships = {}  # {(npc1, npc2): affinity}
    
    def get_affinity(self, npc1, npc2) -> int:
        return self.relationships.get((npc1, npc2), 0)
    
    def update_affinity(self, npc1, npc2, delta, reason):
        # 根据对话内容调整好感度
        old = self.get_affinity(npc1, npc2)
        new = max(-100, min(100, old + delta))
        self.relationships[(npc1, npc2)] = new
        log_affinity_change(npc1, npc2, old, new, reason)
```

**对我们的价值**：
- ✅ "好感度"维度可以加入我们的 NPC 系统
- ✅ 简单的 int (-100 ~ 100) 范围适合做

#### 3. 文档组织

```
- SETUP_GUIDE.md          安装配置指南
- MEMORY_SYSTEM_GUIDE.md   记忆系统设计文档
- AFFINITY_SYSTEM_GUIDE.md 好感度系统设计文档
- DIALOGUE_LOG_GUIDE.md    对话日志设计文档
```

**对我们的价值**：
- ✅ 每个子系统配一个独立 GUIDE.md
- ✅ 这是良好的文档组织习惯

### 风险与限制

| 风险 | 说明 |
|------|------|
| License: None | 不能直接复制代码,只能参考设计 |
| Stars: 2 | 社区小,可能有未发现的 bug |
| FastAPI(Python) | 与我们的 Spring Boot(Java) 技术栈不同 |
| Phaser | 与我们计划的 PixiJS 不同,但可借鉴思路 |

---

## 三、Dannode36/StardewValleyDecompiled ⭐⭐⭐

### 项目概况

| 指标 | 数值 |
|------|------|
| Stars | 70 |
| License | None(⚠️ 反编译,仅作原理参考) |
| 语言 | C#(.NET 6) |
| 描述 | "Stardew Valley 1.6 decompiled to .NET 6" |

### 项目结构

```
StardewValleyDecompiled/
├── README.md
├── Stardew Valley/
├── Stardew Valley Decompiled.sln
└── StardewValley.GameData/
```

### 提取的原理

#### 1. 动画系统(4 方向 × 6 帧)

```csharp
// StardewValley/AnimatedSprite.cs(15KB)
public class AnimatedSprite {
  public float timer;              // 计时器
  public float interval = 175f;    // 帧间隔(175ms ≈ 5.7 FPS)
  public int currentFrame;         // 当前帧索引
  public int framesPerAnimation;   // 每动画帧数(默认 4)
  public Rectangle sourceRect;     // 切片矩形(sprite sheet)
  public bool loop;                // 是否循环
  
  // 核心更新
  public void Animate(GameTime time, ...) {
    timer += time.ElapsedGameTime.TotalMilliseconds;
    if (timer > interval) {
      currentFrame++;
      timer = 0f;
      if (currentFrame >= framesPerAnimation * 2 && loop)
        currentFrame = framesPerAnimation;
    }
    UpdateSourceRect();
  }
}
```

**关键参数**：
- 帧间隔：**175ms**(~5.7 FPS)
- 默认 framesPerAnimation：**4**
- 循环:回到 framesPerAnimation 索引(中点)

#### 2. 方向系统

```csharp
// 4 方向编码:
// 0 = 上(up)
// 1 = 右(right)
// 2 = 下(down)
// 3 = 左(left)

public int getDirection() {
  if (moveUp) return 0;
  if (moveRight) return 1;
  if (moveDown) return 2;
  if (moveLeft) return 3;
  return facingDirection;  // 默认保持
}
```

#### 3. NPC 调度系统

```csharp
// StardewValley/NPC.cs(220KB) + Character.cs(36KB)
public class NPC : Character {
  // 调度数据结构
  public Dictionary<int, SchedulePathDescription> schedule;
  // key = 游戏内时间(如 600=6:00 AM, 1200=12:00 PM)
  // value = 路径描述(目标位置 + 行为)
  
  // 每 10 分钟调用一次
  public virtual void performTenMinuteUpdate(int timeOfDay, GameLocation l) {
    if (Game1.random.NextDouble() < 0.1)
      showTextAboveHead(ambientDialogue[random]);  // 10% 闲聊
    
    // 检查是否有人在 4 格内
    foreach (var c in l.characters) {
      if (Vector2.Distance(c.Position, this.Position) < 4 * 64)
        sayHi(c);  // 打招呼
    }
  }
  
  // 主更新循环
  public override void update(GameTime time, GameLocation location) {
    checkSchedule(Game1.timeOfDay);   // 调度检查
    UpdateFarmExploration(time, location);
    
    if (returningToEndPoint) returnToEndPoint();
    else if (temporaryController != null)
      temporaryController.update(time);
    else base.update(time, location);
  }
}
```

#### 4. 移动系统

```csharp
// Character.cs
public class Character {
  public Vector2 position;
  public float speed = 2f;          // 移动速度(像素/帧)
  public int facingDirection;       // 当前朝向
  
  public void Move() {
    switch (facingDirection) {
      case 0: position.Y -= speed; break;  // 上
      case 1: position.X += speed; break;  // 右
      case 2: position.Y += speed; break;  // 下
      case 3: position.X -= speed; break;  // 左
    }
  }
}
```

#### 5. 对话系统

```csharp
// NPC 头顶对话气泡
public void showTextAboveHead(string text) {
  // 在 NPC 头顶绘制文字气泡
  // 自动 3 秒后消失
}

// 玩家交互对话
public bool checkAction(Character who, GameLocation l) {
  if (Vector2.Distance(who.Position, this.Position) < 64) {
    // 弹出对话 UI
    Game1.activeClickableMenu = new DialogueBox(this);
    return true;
  }
  return false;
}
```

### 对完结杀手项目的价值

| 提取内容 | 应用方式 |
|---------|---------|
| 帧间隔 175ms | ✅ 直接用到我们的动画系统 |
| 4 方向编码(0=上 1=右 2=下 3=左) | ✅ 直接用 |
| 调度数据结构(Dictionary<int, SchedulePathDescription>) | ✅ 参考设计 |
| 10 分钟调度检查 | ✅ 参考频率 |
| 4 格 = 打招呼距离 | ✅ 可参数化 |
| speed = 2 像素/帧 | ✅ 参考值 |
| 头顶对话气泡 | ✅ 直接做 |

---

## 四、跨项目对比表

| 维度 | a16z/ai-town | RemyFinn/AI-Town | StardewValley 反编译 |
|------|--------------|-------------------|----------------------|
| Stars | 10,174 | 2 | 70 |
| License | MIT | None | None |
| 后端语言 | TypeScript | Python | C# |
| 前端框架 | PixiJS + React | Phaser + TypeScript | (游戏本体) |
| 数据库 | Convex | (内存/文件) | (游戏本体) |
| 记忆系统 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | N/A |
| 对话系统 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| 视觉美感 | ⭐⭐⭐(简陋) | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Agent 决策 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | N/A |
| 可玩性 | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 复用安全性 | ✅ MIT | ⚠️ 仅参考 | ⚠️ 仅原理 |

### 综合价值评分

| 用途 | 最佳来源 |
|------|---------|
| Agent 架构 | a16z/ai-town |
| 记忆系统 | a16z/ai-town |
| 对话系统 | a16z/ai-town + RemyFinn |
| NPC 配置格式 | RemyFinn/AI-Town |
| 好感度系统 | RemyFinn/AI-Town |
| 像素艺术资源 | a16z 用的 OpenGameArt |
| 动画原理 | StardewValley 反编译 |
| 调度系统 | StardewValley 反编译 |
| 整体游戏感 | StardewValley 原理 + a16z 前端 |

---

## 五、协议合规性总结

### 直接复用(MIT / CC0)

✅ a16z/ai-town 的**前端代码**(pixi-react 组件)
✅ a16z/ai-town 的 **OpenGameArt 资源**链接
✅ OpenGameArt 上所有 CC0 资源
✅ a16z/ai-town 的 **architecture 设计思路**(理解后自己实现)

### 仅参考设计(License: None)

⚠️ RemyFinn/AI-Town 的代码——**理解后必须自己重写**
⚠️ StardewValleyDecompiled 的代码——**仅学习原理,自己重写**

### 严禁

❌ 直接复制 RemyFinn 的代码到我们的项目
❌ 直接复用 StardewValley 的反编译代码
❌ 在我们的 LICENSE 中声明这些项目的代码

---

## 六、我们的最终代码来源策略

| 代码模块 | 来源 |
|---------|------|
| PixiGame.tsx / PixiViewport.tsx / Character.tsx | **借鉴 a16z(协议允许)** |
| useHistoricalValue hook | **借鉴 a16z** |
| sprite sheet 切片数据结构 | **借鉴 a16z** |
| 地图编辑器设计 | **借鉴 a16z** |
| Agent Loop 主循环 | **参考 a16z 设计,自己用 Java 重写** |
| 记忆系统 | **参考 a16z 设计,自己用 Java 重写** |
| 对话 prompt 模板 | **借鉴 a16z + RemyFinn,自己写** |
| NPC 配置格式 | **借鉴 RemyFinn 思路,改成 YAML** |
| 好感度系统 | **参考 RemyFinn,自己用 Java 实现** |
| 动画原理(175ms, 4方向) | **从星露谷原理提取,自己用 TS 实现** |
| 调度系统 | **从星露谷原理提取,自己用 Java 实现** |
| Build AI | **我们自己设计(创新点)** |
| 规则提案机制 | **我们自己设计(创新点)** |
| 剧本系统 | **我们自己设计(创新点)** |

---

**总结**：三个参考项目覆盖了**架构、视觉、原理**三个维度,我们采取"**a16z 借鉴 + RemyFinn 参考 + 星露谷原理**"的组合策略,在协议合规的前提下最大化利用开源生态。

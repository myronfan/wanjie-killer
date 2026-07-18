/**
 * 世界配置 - 抄袭并改造自 helloagents-ai-town-phaser/src/game/content/world.ts
 *
 * 改造点：
 * - 障碍新增 kind 字段（公告栏/工位/会议室/树/水/门），用于程序化绘制
 * - 加入网文风格的「公告栏/工位桌/会议室/沙发」等元素
 */

export interface RectObstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** 渲染类型：影响显示样式（程序化绘制用） */
  kind:
    | "wall"
    | "door"
    | "building"
    | "furniture"
    | "board"
    | "tree"
    | "water"
    | "plant";
  label?: string;
}

const centeredRect = (
  id: string,
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  kind: RectObstacle["kind"],
  label?: string,
): RectObstacle => ({
  id,
  x: centerX - width / 2,
  y: centerY - height / 2,
  width,
  height,
  kind,
  label,
});

export const WORLD_CONFIG = {
  width: 1280,
  height: 720,
  playerSpawn: { x: 640, y: 600 },
  playerSpeed: 180,
  interactionDistance: 70,
  dialogueBubbleDurationMs: 10_000,
  npcStatusRefreshIntervalMs: 30_000,
  playerFootprint: { width: 22, height: 14 },
  npcFootprint: { width: 20, height: 12 },
  cameraZoom: 1,
  /** 地板颜色（程序化绘制用） */
  floorColor: "#F4E8D0",
  tileSize: 48,
  obstacles: [
    // ============ 上半部分：工位区（左） ============
    centeredRect("workstation-wall-1", 240, 200, 360, 16, "wall", "工位区隔板"),
    centeredRect("workstation-wall-2", 240, 280, 360, 16, "wall"),
    centeredRect("workstation-room-wall", 240, 100, 360, 12, "wall"),
    centeredRect("board-1", 480, 220, 60, 40, "board", "公告栏"),
    centeredRect("desk-1", 130, 220, 50, 30, "furniture", "工位1"),
    centeredRect("desk-2", 230, 220, 50, 30, "furniture", "工位2"),
    centeredRect("desk-3", 330, 220, 50, 30, "furniture", "工位3"),
    centeredRect("desk-4", 130, 300, 50, 30, "furniture", "工位4"),
    centeredRect("desk-5", 330, 300, 50, 30, "furniture", "工位5"),

    // ============ 右上：会议室 ============
    centeredRect("meeting-room-wall", 1000, 200, 360, 12, "wall", "会议室墙"),
    centeredRect("meeting-table", 1000, 230, 200, 50, "furniture", "会议桌"),
    centeredRect("meeting-whiteboard", 1180, 130, 60, 30, "board", "白板"),
    centeredRect("meeting-door-left", 870, 280, 6, 30, "door"),
    centeredRect("meeting-door-right", 1130, 280, 6, 30, "door"),

    // ============ 下半部分：休息区 ============
    centeredRect("sofa-1", 200, 580, 80, 30, "furniture", "沙发"),
    centeredRect("sofa-2", 320, 580, 80, 30, "furniture", "沙发"),
    centeredRect("coffee-machine", 480, 580, 40, 30, "furniture", "咖啡机"),
    centeredRect("bookshelf-1", 1100, 580, 30, 100, "furniture", "书架"),
    centeredRect("bookshelf-2", 1140, 580, 30, 100, "furniture", "书架"),
    centeredRect("planter", 640, 400, 80, 40, "plant", "花坛"),

    // ============ 中央分隔墙（带门） ============
    centeredRect("center-wall-left", 640, 200, 16, 180, "wall"),
    centeredRect("center-wall-right", 640, 540, 16, 140, "wall"),
    centeredRect("center-door", 640, 370, 16, 40, "door", "中央门"),

    // ============ 边缘墙 ============
    centeredRect("border-top", 640, 30, 1280, 16, "wall"),
    centeredRect("border-bottom", 640, 690, 1280, 16, "wall"),
    centeredRect("border-left", 30, 360, 16, 720, "wall"),
    centeredRect("border-right", 1250, 360, 16, 720, "wall"),

    // ============ 装饰 ============
    centeredRect("tree-1", 580, 200, 40, 40, "tree", "树"),
    centeredRect("tree-2", 700, 200, 40, 40, "tree", "树"),
    centeredRect("tree-3", 580, 520, 40, 40, "tree", "树"),
    centeredRect("tree-4", 700, 520, 40, 40, "tree", "树"),
  ] as RectObstacle[],
} as const;

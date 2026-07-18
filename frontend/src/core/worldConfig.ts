/**
 * 世界配置 - 抄袭并改造自 RemyFinn/AI-Town/src/game/content/world.ts
 *
 * 修复历史：
 * - 2026-07-19: 重构地图，参照 RemyFinn 的 RectObstacle 设计
 */

export interface RectObstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** 渲染类型：影响显示样式 */
  kind: 'wall' | 'door' | 'building' | 'furniture' | 'board' | 'tree' | 'water';
  label?: string;
}

const centeredRect = (
  id: string,
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  kind: RectObstacle['kind'],
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

/**
 * 玩家脚部框尺寸（用于精细碰撞检测）
 * 比 sprite 实际像素小一些，让玩家"看起来贴着障碍但不会撞墙"
 */
export const PLAYER_FOOTPRINT = { width: 22, height: 14 };
export const NPC_FOOTPRINT = { width: 20, height: 12 };

/**
 * 世界配置
 */
export const WORLD_CONFIG = {
  /** 世界像素尺寸 */
  width: 1280,
  height: 720,

  /** 玩家初始位置 */
  playerSpawn: { x: 640, y: 580 },

  /** 玩家移动速度（像素/秒） */
  playerSpeed: 180,

  /** 与 NPC 的对话触发距离 */
  interactionDistance: 70,

  /** 摄像机缩放（1 = 100%） */
  cameraZoom: 1.0,

  /** 障碍列表（精细 AABB 碰撞用） */
  obstacles: [
    // ============ 上半部分：工位区（左） ============
    // 工位区隔板（长条）
    centeredRect('workstation-wall-1', 240, 200, 360, 16, 'wall', '工位区隔板'),
    centeredRect('workstation-wall-2', 240, 280, 360, 16, 'wall'),
    centeredRect('workstation-room-wall', 240, 100, 360, 12, 'wall'),

    // 公告栏（一个小障碍）
    centeredRect('board-1', 480, 220, 60, 40, 'board', '公告栏'),

    // 工位桌（5 张）
    centeredRect('desk-1', 130, 220, 50, 30, 'furniture', '工位1'),
    centeredRect('desk-2', 230, 220, 50, 30, 'furniture', '工位2'),
    centeredRect('desk-3', 330, 220, 50, 30, 'furniture', '工位3'),
    centeredRect('desk-4', 130, 300, 50, 30, 'furniture', '工位4'),
    centeredRect('desk-5', 330, 300, 50, 30, 'furniture', '工位5'),

    // ============ 右上：会议室 ============
    centeredRect('meeting-room-wall', 1000, 200, 360, 12, 'wall', '会议室墙'),
    centeredRect('meeting-table', 1000, 230, 200, 50, 'furniture', '会议桌'),
    centeredRect('meeting-whiteboard', 1180, 130, 60, 30, 'board', '白板'),

    // 会议室门口装饰
    centeredRect('meeting-door-left', 870, 280, 6, 30, 'door'),
    centeredRect('meeting-door-right', 1130, 280, 6, 30, 'door'),

    // ============ 下半部分：休息区 ============
    // 沙发
    centeredRect('sofa-1', 200, 580, 80, 30, 'furniture', '沙发'),
    centeredRect('sofa-2', 320, 580, 80, 30, 'furniture', '沙发'),

    // 咖啡机（一个大方块）
    centeredRect('coffee-machine', 480, 580, 40, 30, 'furniture', '咖啡机'),

    // 书架（右下角）
    centeredRect('bookshelf-1', 1100, 580, 30, 100, 'furniture', '书架'),
    centeredRect('bookshelf-2', 1140, 580, 30, 100, 'furniture', '书架'),

    // 中间小花坛
    centeredRect('planter', 640, 400, 80, 40, 'furniture', '花坛'),

    // ============ 中央分隔墙（带门） ============
    centeredRect('center-wall-left', 640, 200, 16, 180, 'wall'),
    centeredRect('center-wall-right', 640, 540, 16, 140, 'wall'),
    centeredRect('center-door', 640, 370, 16, 40, 'door', '中央门'),

    // ============ 边缘墙（让玩家不走出世界） ============
    centeredRect('border-top', 640, 30, 1280, 16, 'wall'),
    centeredRect('border-bottom', 640, 690, 1280, 16, 'wall'),
    centeredRect('border-left', 30, 360, 16, 720, 'wall'),
    centeredRect('border-right', 1250, 360, 16, 720, 'wall'),

    // ============ 装饰：树和水池（不可走但纯装饰） ============
    centeredRect('tree-1', 580, 200, 40, 40, 'tree', '树'),
    centeredRect('tree-2', 700, 200, 40, 40, 'tree', '树'),
    centeredRect('tree-3', 580, 520, 40, 40, 'tree', '树'),
    centeredRect('tree-4', 700, 520, 40, 40, 'tree', '树'),
  ] as RectObstacle[],

  /** 地板颜色（背景） */
  floorColor: '#F4E8D0',
  /** 地板格尺寸（像素） */
  tilePixelSize: 48,
} as const;

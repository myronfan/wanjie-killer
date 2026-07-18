/**
 * 精细 AABB 碰撞检测
 *
 * 抄袭并改造自 RemyFinn/AI-Town/src/game/simulation/systems/TownSimulation.ts
 *
 * 关键改进（vs 之前的 tile-based 碰撞）：
 * - 障碍是任意矩形，不再是整数 tile
 * - 玩家/NPC 有 footprint（脚部框），更精细
 * - X/Y 轴分别检测，解决"对角线卡墙"问题
 * - 支持两个 actor 之间互相阻挡（NPC 不重叠）
 */

import type { RectObstacle } from './worldConfig';

export interface Footprint {
  width: number;
  height: number;
}

export interface AxisRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * AABB 矩形重叠检测
 */
export function rectanglesOverlap(a: AxisRect, b: AxisRect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * 计算 actor 在 position 处的脚部框
 *
 * 注意：position 是"中心底部"点（脚底中央），不是中心点
 */
export function getFootprintRect(
  position: { x: number; y: number },
  footprint: Footprint,
): AxisRect {
  return {
    x: position.x - footprint.width / 2,
    y: position.y - footprint.height,
    width: footprint.width,
    height: footprint.height,
  };
}

/**
 * 检查 actor 当前位置是否合法（在世界内，不与障碍重叠）
 */
export function isWalkable(
  position: { x: number; y: number },
  footprint: Footprint,
  obstacles: RectObstacle[],
  worldBounds: { width: number; height: number },
  ignoreIds: string[] = [],
): boolean {
  // 世界边界
  if (
    position.x < footprint.width / 2 ||
    position.x > worldBounds.width - footprint.width / 2 ||
    position.y < footprint.height ||
    position.y > worldBounds.height
  ) {
    return false;
  }

  // 障碍检测
  const rect = getFootprintRect(position, footprint);
  for (const obstacle of obstacles) {
    if (ignoreIds.includes(obstacle.id)) continue;
    // 装饰物（树/水）也阻挡
    const obstacleRect: AxisRect = obstacle;
    if (rectanglesOverlap(rect, obstacleRect)) {
      return false;
    }
  }

  return true;
}

/**
 * 沿一个轴向移动并解决碰撞
 *
 * 关键算法（来自星露谷/TownSimulation）：
 * 1. 算出新坐标
 * 2. 检查每个障碍
 * 3. 如果重叠，把 actor 推到刚好不重叠的位置
 *
 * @returns 解决碰撞后的新坐标
 */
export function resolveAxis(
  position: number,
  delta: number,
  footprint: Footprint,
  worldBounds: { width: number; height: number },
  obstacles: RectObstacle[],
  axis: 'x' | 'y',
  ignoreIds: string[] = [],
): number {
  let next = position + delta;

  // 世界边界 clamp
  if (axis === 'x') {
    next = Math.min(Math.max(next, footprint.width / 2), worldBounds.width - footprint.width / 2);
  } else {
    next = Math.min(Math.max(next, footprint.height), worldBounds.height);
  }

  // 障碍检测
  const candidatePosition =
    axis === 'x'
      ? { x: next, y: position - (axis === 'x' ? 0 : footprint.height / 2) }
      : { x: position, y: next };

  // 重新构造完整 position 用于 footprint 计算
  const testPosition =
    axis === 'x'
      ? { x: next, y: position }
      : { x: position, y: next };

  const actorRect = getFootprintRect(testPosition, footprint);

  for (const obstacle of obstacles) {
    if (ignoreIds.includes(obstacle.id)) continue;
    const obstacleRect: AxisRect = obstacle;
    if (!rectanglesOverlap(actorRect, obstacleRect)) continue;

    // 推动 actor 离开障碍
    if (axis === 'x') {
      if (delta > 0) {
        next = Math.min(next, obstacle.x - footprint.width / 2);
      } else if (delta < 0) {
        next = Math.max(next, obstacle.x + obstacle.width + footprint.width / 2);
      }
    } else {
      if (delta > 0) {
        next = Math.min(next, obstacle.y);
      } else if (delta < 0) {
        next = Math.max(next, obstacle.y + obstacle.height + footprint.height);
      }
    }
  }

  return next;
}

/**
 * 完整的移动解决（X 和 Y 轴分别处理）
 */
export function resolveMovement(
  position: { x: number; y: number },
  movement: { x: number; y: number },
  footprint: Footprint,
  obstacles: RectObstacle[],
  worldBounds: { width: number; height: number },
  ignoreIds: string[] = [],
): { x: number; y: number } {
  const movedX = resolveAxis(
    position.x,
    movement.x,
    footprint,
    worldBounds,
    obstacles,
    'x',
    ignoreIds,
  );
  const movedY = resolveAxis(
    position.y,
    movement.y,
    footprint,
    worldBounds,
    obstacles,
    'y',
    ignoreIds,
  );
  return { x: movedX, y: movedY };
}

/**
 * 距离计算（两点间）
 */
export function distance(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

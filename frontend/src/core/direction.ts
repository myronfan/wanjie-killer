/**
 * 4 方向系统（来自 StardewValley 反编译源码）
 *
 * 0 = 上 (up)
 * 1 = 右 (right)
 * 2 = 下 (down)
 * 3 = 左 (left)
 */

export type Direction = 0 | 1 | 2 | 3;

export const DIRECTIONS = {
  UP: 0 as Direction,
  RIGHT: 1 as Direction,
  DOWN: 2 as Direction,
  LEFT: 3 as Direction,
};

export const DIRECTION_VECTORS: Record<Direction, { x: number; y: number }> = {
  0: { x: 0, y: -1 },  // 上
  1: { x: 1, y: 0 },   // 右
  2: { x: 0, y: 1 },   // 下
  3: { x: -1, y: 0 },  // 左
};

export const DIRECTION_NAMES: Record<Direction, string> = {
  0: 'up',
  1: 'right',
  2: 'down',
  3: 'left',
};

/**
 * 根据键盘输入确定方向（优先级：下 > 左 > 右 > 上，模拟星露谷的设定）
 */
export function getDirectionFromKeys(keys: {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}): Direction | null {
  if (keys.down) return DIRECTIONS.DOWN;
  if (keys.left) return DIRECTIONS.LEFT;
  if (keys.right) return DIRECTIONS.RIGHT;
  if (keys.up) return DIRECTIONS.UP;
  return null;
}

/**
 * 根据两个方向之间的角度计算方向
 */
export function angleToDirection(angleRad: number): Direction {
  // 标准化到 [0, 2π)
  const a = ((angleRad % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  // 上下方向用较小区域，左右用较大区域（参考星露谷）
  if (a >= Math.PI * 0.875 || a < Math.PI * 0.125) return DIRECTIONS.RIGHT;
  if (a >= Math.PI * 0.125 && a < Math.PI * 0.375) return DIRECTIONS.DOWN;
  if (a >= Math.PI * 0.375 && a < Math.PI * 0.625) return DIRECTIONS.LEFT;
  if (a >= Math.PI * 0.625 && a < Math.PI * 0.875) return DIRECTIONS.UP;
  return DIRECTIONS.DOWN;
}

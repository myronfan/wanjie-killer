/**
 * 角色状态管理（来自 StardewValley/Character.cs）
 *
 * 关键属性：
 * - position: 像素坐标
 * - tileX, tileY: 瓦片坐标（用于碰撞检测）
 * - speed: 移动速度（像素/秒）
 * - facingDirection: 当前朝向
 * - isMoving: 是否在移动
 */

import { DIRECTIONS, type Direction, DIRECTION_VECTORS } from './direction';
import type { TileMapData } from './tileset';
import { isWalkable, TILE_SIZE } from './tileset';
import {
  createAnimationState,
  updateAnimation,
  DEFAULT_ANIMATION,
  type AnimationState,
  type AnimationConfig,
} from './animation';

export const TILE_SCALE = 3;  // 16px tile → 48px on screen
export const MOVE_SPEED = 80;        // 像素/秒（走路）
export const RUN_SPEED = 160;        // 像素/秒（跑步）

export interface CharacterState {
  pixelX: number;       // 像素 x
  pixelY: number;       // 像素 y
  facingDirection: Direction;
  isMoving: boolean;
  speed: number;
  animation: AnimationState;
  animationConfig: AnimationConfig;
  width: number;        // 角色宽度（像素）
  height: number;       // 角色高度（像素）
}

/**
 * 创建初始角色状态
 */
export function createCharacter(
  startTileX: number,
  startTileY: number
): CharacterState {
  return {
    pixelX: startTileX * TILE_SIZE * TILE_SCALE,
    pixelY: startTileY * TILE_SIZE * TILE_SCALE,
    facingDirection: DIRECTIONS.DOWN,
    isMoving: false,
    speed: MOVE_SPEED,
    animation: createAnimationState(),
    animationConfig: { ...DEFAULT_ANIMATION },
    width: 16 * TILE_SCALE,
    height: 28 * TILE_SCALE,
  };
}

/**
 * 根据键盘输入和地图，更新角色位置
 */
export function updateCharacter(
  char: CharacterState,
  keys: { up: boolean; down: boolean; left: boolean; right: boolean; shift: boolean },
  map: TileMapData,
  deltaSec: number
): void {
  // 计算移动向量
  let dx = 0;
  let dy = 0;

  if (keys.up) dy -= 1;
  if (keys.down) dy += 1;
  if (keys.left) dx -= 1;
  if (keys.right) dx += 1;

  // 归一化（避免对角线比直线快）
  if (dx !== 0 && dy !== 0) {
    const len = Math.sqrt(dx * dx + dy * dy);
    dx /= len;
    dy /= len;
  }

  // 更新朝向（即使没动也更新朝向）
  if (dx !== 0 || dy !== 0) {
    if (Math.abs(dy) > Math.abs(dx)) {
      char.facingDirection = dy < 0 ? DIRECTIONS.UP : DIRECTIONS.DOWN;
    } else {
      char.facingDirection = dx < 0 ? DIRECTIONS.LEFT : DIRECTIONS.RIGHT;
    }
    char.isMoving = true;
  } else {
    char.isMoving = false;
  }

  // 计算速度（跑步 2 倍）
  const speed = keys.shift ? RUN_SPEED : MOVE_SPEED;

  // 尝试移动（分别测试 X 和 Y 轴，避免对角卡墙）
  const newX = char.pixelX + dx * speed * deltaSec;
  const newY = char.pixelY + dy * speed * deltaSec;

  // X 轴碰撞检测
  if (dx !== 0) {
    const tileX = Math.floor((newX + (dx > 0 ? char.width : 0)) / (TILE_SIZE * TILE_SCALE));
    const tileY = Math.floor((char.pixelY + char.height / 2) / (TILE_SIZE * TILE_SCALE));
    if (isWalkable(map, tileX, tileY)) {
      char.pixelX = newX;
    }
  }

  // Y 轴碰撞检测
  if (dy !== 0) {
    const tileX = Math.floor((char.pixelX + char.width / 2) / (TILE_SIZE * TILE_SCALE));
    const tileY = Math.floor((newY + (dy > 0 ? char.height : 0)) / (TILE_SIZE * TILE_SCALE));
    if (isWalkable(map, tileX, tileY)) {
      char.pixelY = newY;
    }
  }

  // 更新动画
  if (char.isMoving) {
    updateAnimation(char.animation, char.animationConfig, deltaSec * 1000);
  } else {
    // 站立时回到站立帧
    char.animation.currentFrame = 0;
    char.animation.timer = 0;
  }
}

/**
 * 获取角色所在的瓦片坐标
 */
export function getCharacterTile(char: CharacterState): { x: number; y: number } {
  return {
    x: Math.floor((char.pixelX + char.width / 2) / (TILE_SIZE * TILE_SCALE)),
    y: Math.floor((char.pixelY + char.height) / (TILE_SIZE * TILE_SCALE)),
  };
}

/**
 * 检查两个角色是否相邻（4 格内）
 */
export function areCharactersNearby(
  a: CharacterState,
  b: CharacterState,
  tileDistance: number = 4
): boolean {
  const ax = Math.floor((a.pixelX + a.width / 2) / (TILE_SIZE * TILE_SCALE));
  const ay = Math.floor((a.pixelY + a.height / 2) / (TILE_SIZE * TILE_SCALE));
  const bx = Math.floor((b.pixelX + b.width / 2) / (TILE_SIZE * TILE_SCALE));
  const by = Math.floor((b.pixelY + b.height / 2) / (TILE_SIZE * TILE_SCALE));
  const dist = Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
  return dist <= tileDistance;
}

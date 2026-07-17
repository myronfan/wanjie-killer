/**
 * 动画系统（来自 StardewValley 反编译源码）
 *
 * 关键参数（来自 StardewValley/AnimatedSprite.cs）：
 * - 帧间隔：175ms ≈ 5.7 FPS
 * - 每动画帧数：4（默认）
 * - 循环：回到 framesPerAnimation 索引（中点）
 */

import type { Direction } from './direction';

export interface AnimationConfig {
  framesPerAnimation: number;  // 每方向帧数（默认 4）
  interval: number;            // 帧间隔（ms，默认 175）
  loop: boolean;               // 是否循环
}

export const DEFAULT_ANIMATION: AnimationConfig = {
  framesPerAnimation: 4,
  interval: 175,
  loop: true,
};

export interface AnimationState {
  currentFrame: number;
  timer: number;
  isMoving: boolean;
}

export function createAnimationState(): AnimationState {
  return {
    currentFrame: 0,
    timer: 0,
    isMoving: false,
  };
}

/**
 * 每帧更新动画状态
 * @returns 是否需要重新渲染
 */
export function updateAnimation(
  state: AnimationState,
  config: AnimationConfig,
  deltaMs: number
): boolean {
  const prevFrame = state.currentFrame;
  state.timer += deltaMs;

  if (state.timer >= config.interval) {
    state.timer = 0;
    state.currentFrame++;

    // 循环逻辑（来自星露谷源码）：
    // 走到 framesPerAnimation * 2 时回到 framesPerAnimation
    if (state.currentFrame >= config.framesPerAnimation * 2) {
      state.currentFrame = config.framesPerAnimation;
    }
  }

  return state.currentFrame !== prevFrame;
}

/**
 * 计算当前帧在 sprite sheet 中的位置
 * sprite sheet 排列：横向按方向，纵向按帧
 *
 * 实际在我们的实现中，sprite sheet 是：
 *   行 0: up 方向的 4 帧
 *   行 1: right 方向的 4 帧
 *   行 2: down 方向的 4 帧
 *   行 3: left 方向的 4 帧
 *
 * walking 动画：当前帧 = baseFrame + walkingFrame
 *  - 站立时：方向对应的基础帧（baseFrame = 0, 4, 8, 12）
 *  - 走路时：baseFrame + walkingFrame（在 base 和 base+framesPerAnimation 之间循环）
 */
export function getSpriteSheetPosition(
  direction: Direction,
  animationState: AnimationState,
  config: AnimationConfig
): { row: number; col: number; frame: number } {
  const directionRow = direction; // 0=up, 1=right, 2=down, 3=left
  const baseFrame = direction * config.framesPerAnimation; // 0, 4, 8, 12
  const frame = baseFrame + animationState.currentFrame;
  return { row: directionRow, col: animationState.currentFrame, frame };
}

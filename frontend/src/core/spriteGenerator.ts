/**
 * 程序化 sprite 生成器
 *
 * 暂时不依赖外部图片资源，用代码绘出星露谷风的占位 sprite。
 * 之后可以替换为 OpenGameArt 的真实资源。
 */

import { Graphics } from 'pixi.js';
import { PALETTE } from './palette';
import type { Direction } from './direction';

export interface SpriteConfig {
  bodyColor: string;       // 衣服颜色
  hairColor: string;       // 头发颜色
  skinColor: string;       // 肤色
  pantsColor: string;      // 裤子颜色
}

/**
 * 创建一个角色 sprite（4 方向 × 4 帧 = 16 帧 sprite sheet）
 *
 * 布局（64×256 像素，每帧 64×64）：
 *   行 0: up 方向的 4 帧
 *   行 1: right 方向的 4 帧
 *   行 2: down 方向的 4 帧
 *   行 3: left 方向的 4 帧
 *
 * 实际我们用 Graphics 对象绘制，不需要 sprite sheet。
 */
export function drawCharacter(
  graphics: Graphics,
  x: number,        // 绘制起点 x
  y: number,        // 绘制起点 y
  direction: Direction,
  frame: number,    // 当前帧（0-7，4 帧动画）
  config: SpriteConfig
): void {
  graphics.clear();

  const SCALE = 2;  // 16px → 32px

  // 计算走路偏移（走路时身体轻微上下浮动）
  const walkOffset = (frame === 1 || frame === 5) ? 0 : (frame === 2 || frame === 6) ? 1 : (frame === 3 || frame === 7) ? 0 : 0;
  const legOffset = (frame === 2 || frame === 6) ? 1 : 0;

  // 颜色解析
  const skin = config.skinColor;
  const hair = config.hairColor;
  const body = config.bodyColor;
  const pants = config.pantsColor;

  // === 头部 (16x16) ===
  const headX = x + 8 * SCALE;
  const headY = y + walkOffset + 0;

  // 头发（后）
  graphics.beginFill(hair);
  graphics.drawRect(headX, headY, 16 * SCALE, 6 * SCALE);

  // 脸
  graphics.beginFill(skin);
  graphics.drawRect(headX + 2 * SCALE, headY + 4 * SCALE, 12 * SCALE, 8 * SCALE);

  // 眼睛（仅 down 和 up）
  if (direction === 2) {
    // 朝下：看不到眼睛
    graphics.beginFill(0x000000);
    graphics.drawRect(headX + 5 * SCALE, headY + 7 * SCALE, 2 * SCALE, 1 * SCALE);
    graphics.drawRect(headX + 9 * SCALE, headY + 7 * SCALE, 2 * SCALE, 1 * SCALE);
  } else if (direction === 0) {
    // 朝上：只看到后脑勺
    graphics.beginFill(hair);
    graphics.drawRect(headX, headY, 16 * SCALE, 12 * SCALE);
  } else {
    // 朝左/朝右：单眼
    if (direction === 3) {
      graphics.beginFill(0x000000);
      graphics.drawRect(headX + 4 * SCALE, headY + 7 * SCALE, 1 * SCALE, 2 * SCALE);
    } else {
      graphics.beginFill(0x000000);
      graphics.drawRect(headX + 11 * SCALE, headY + 7 * SCALE, 1 * SCALE, 2 * SCALE);
    }
  }

  // 头发（前）
  if (direction !== 0) {
    graphics.beginFill(hair);
    graphics.drawRect(headX, headY, 16 * SCALE, 2 * SCALE);
  }

  // === 身体 (16x10) ===
  const bodyX = x + 8 * SCALE;
  const bodyY = y + walkOffset + 12 * SCALE;
  graphics.beginFill(body);
  graphics.drawRect(bodyX, bodyY, 16 * SCALE, 10 * SCALE);

  // === 腿 (16x6) ===
  const legY = y + walkOffset + 22 * SCALE + legOffset;
  graphics.beginFill(pants);

  if (frame === 2 || frame === 6) {
    // 左腿在前
    graphics.drawRect(bodyX + 2 * SCALE, legY, 5 * SCALE, 6 * SCALE);
    graphics.drawRect(bodyX + 9 * SCALE, legY, 5 * SCALE, 5 * SCALE);
  } else if (frame === 4) {
    // 右腿在前
    graphics.drawRect(bodyX + 2 * SCALE, legY, 5 * SCALE, 5 * SCALE);
    graphics.drawRect(bodyX + 9 * SCALE, legY, 5 * SCALE, 6 * SCALE);
  } else {
    // 双脚并拢
    graphics.drawRect(bodyX + 2 * SCALE, legY, 5 * SCALE, 6 * SCALE);
    graphics.drawRect(bodyX + 9 * SCALE, legY, 5 * SCALE, 6 * SCALE);
  }

  // === 描边（深色，让角色更立体） ===
  const darkSkin = darken(skin, 0.3);
  const darkBody = darken(body, 0.3);
  graphics.lineStyle(1, parseInt(darkSkin.replace('#', '0x')), 1);
  graphics.beginFill(skin);
  graphics.drawRect(headX, headY, 16 * SCALE, 12 * SCALE);
  graphics.endFill();

  graphics.lineStyle(0);
}

/**
 * 把 16x16 像素的角色绘制成 Graphics
 */
export function createCharacterSprite(config: SpriteConfig): Graphics {
  const graphics = new Graphics();
  drawCharacter(graphics, 0, 0, 2, 0, config); // 默认朝下
  return graphics;
}

/**
 * 颜色加深
 */
function darken(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const dr = Math.max(0, Math.floor(r * (1 - factor)));
  const dg = Math.max(0, Math.floor(g * (1 - factor)));
  const db = Math.max(0, Math.floor(b * (1 - factor)));
  return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`;
}

/**
 * 预定义的几个角色配置
 */
export const CHARACTER_CONFIGS: Record<string, SpriteConfig> = {
  // 林动 - 武动乾坤
  lindong: {
    bodyColor: PALETTE.shirt_red[0],
    hairColor: PALETTE.hair_black[0],
    skinColor: PALETTE.skin_medium[0],
    pantsColor: PALETTE.shirt_blue[1],
  },
  // 萧炎 - 斗破苍穹
  xiaoyan: {
    bodyColor: PALETTE.shirt_purple[0],
    hairColor: PALETTE.hair_black[0],
    skinColor: PALETTE.skin_light[0],
    pantsColor: PALETTE.shirt_blue[1],
  },
  // 默认玩家
  player: {
    bodyColor: PALETTE.shirt_blue[0],
    hairColor: PALETTE.hair_brown[0],
    skinColor: PALETTE.skin_light[0],
    pantsColor: PALETTE.wood[1],
  },
};

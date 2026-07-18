/**
 * 程序化 sprite 生成器
 *
 * 暂时不依赖外部图片资源，用代码绘出星露谷风的占位 sprite。
 * 之后可以替换为 OpenGameArt 的真实资源。
 *
 * 修复历史：
 * - 2026-07-18: 修复脸被头发覆盖、帧编号逻辑、删除错误的二次绘制
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
 * 绘制顺序（重要！）：
 *   1. 脸（底层）
 *   2. 头发后层（覆盖头顶）
 *   3. 脸下半部（恢复脸的下半部分）
 *   4. 眼睛
 *   5. 头发前刘海
 *   6. 身体
 *   7. 腿
 */
export function drawCharacter(
  graphics: Graphics,
  x: number,        // 绘制起点 x
  y: number,        // 绘制起点 y
  direction: Direction,
  frame: number,    // 当前帧（0-7，4 帧动画循环）
  config: SpriteConfig
): void {
  graphics.clear();
  graphics.lineStyle(0);

  const SCALE = 2;  // 16px → 32px

  // 计算走路偏移（走路时身体轻微上下浮动）
  // 帧 0,4 = 站立; 帧 1,5 = 起步; 帧 2,6 = 中间(抬起); 帧 3,7 = 落地
  const walkOffset = (frame === 1 || frame === 5) ? 0 : (frame === 2 || frame === 6) ? 1 : 0;
  const legOffset = (frame === 2 || frame === 6) ? 1 : 0;

  // 颜色解析
  const skin = config.skinColor;
  const hair = config.hairColor;
  const body = config.bodyColor;
  const pants = config.pantsColor;

  // === 头部 (16x16) ===
  const headX = x + 8 * SCALE;
  const headY = y + walkOffset + 0;

  // 1. 先画脸（底层，最先绘制）
  graphics.beginFill(skin);
  graphics.drawRect(headX, headY, 16 * SCALE, 12 * SCALE);
  graphics.endFill();

  // 2. 再画头发后层（覆盖头顶上半部分）
  graphics.beginFill(hair);
  graphics.drawRect(headX, headY, 16 * SCALE, 4 * SCALE);
  graphics.endFill();

  // 3. 画脸部下半部（让头发不覆盖脸的下半部分）
  graphics.beginFill(skin);
  graphics.drawRect(headX, headY + 4 * SCALE, 16 * SCALE, 8 * SCALE);
  graphics.endFill();

  // 4. 眼睛（朝下：双眼；朝上：不画；朝左/右：单眼）
  if (direction === 2) {
    // 朝下：两只眼睛
    graphics.beginFill(0x000000);
    graphics.drawRect(headX + 5 * SCALE, headY + 7 * SCALE, 2 * SCALE, 2 * SCALE);
    graphics.drawRect(headX + 9 * SCALE, headY + 7 * SCALE, 2 * SCALE, 2 * SCALE);
    graphics.endFill();
  } else if (direction === 0) {
    // 朝上：只看到后脑勺，不画眼睛
    graphics.beginFill(hair);
    graphics.drawRect(headX, headY, 16 * SCALE, 12 * SCALE);
    graphics.endFill();
  } else if (direction === 3) {
    // 朝左：左眼
    graphics.beginFill(0x000000);
    graphics.drawRect(headX + 4 * SCALE, headY + 7 * SCALE, 2 * SCALE, 2 * SCALE);
    graphics.endFill();
  } else {
    // 朝右：右眼
    graphics.beginFill(0x000000);
    graphics.drawRect(headX + 10 * SCALE, headY + 7 * SCALE, 2 * SCALE, 2 * SCALE);
    graphics.endFill();
  }

  // 5. 头发前刘海（覆盖脸的顶部，朝下/左/右时显示）
  if (direction !== 0) {
    graphics.beginFill(hair);
    graphics.drawRect(headX, headY, 16 * SCALE, 2 * SCALE);
    // 两边的刘海
    graphics.drawRect(headX + 1 * SCALE, headY + 2 * SCALE, 2 * SCALE, 1 * SCALE);
    graphics.drawRect(headX + 13 * SCALE, headY + 2 * SCALE, 2 * SCALE, 1 * SCALE);
    graphics.endFill();
  }

  // === 身体 (16x10) ===
  const bodyX = x + 8 * SCALE;
  const bodyY = y + walkOffset + 12 * SCALE;
  graphics.beginFill(body);
  graphics.drawRect(bodyX, bodyY, 16 * SCALE, 10 * SCALE);
  graphics.endFill();

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
  graphics.endFill();
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
 * 颜色加深（保留以备后用）
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

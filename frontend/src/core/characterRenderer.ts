/**
 * 角色渲染器 - 程序化绘制星露谷风的小像素人
 *
 * 不用 sprite sheet，全部用 Graphics 画：
 * - 头（圆形肤色）
 * - 发（覆盖头顶）
 * - 身体（矩形衣服色）
 * - 腿（动画时左右脚轮流画）
 * - 眼睛（2 个小方块）
 *
 * position 是"脚底中心"点（来自 worldConfig）
 * 渲染时把脚底中心换算成 sprite 的左上角
 */

import { Container, Graphics, Text } from 'pixi.js';
import type { Direction } from './direction';

export interface CharacterVisual {
  body: Container;          // 整个 sprite 容器（外部直接 set x/y）
  bodyGfx: Graphics;        // 身体 + 头 + 发
  walkGfx: Graphics;        // 腿部动画层
  eyesGfx: Graphics;        // 眼睛层
  nameText: Text;           // 头顶名字
  selectionRing: Graphics;  // 选中光圈（默认 alpha=0）
}

export interface CharacterLook {
  skinColor: number;
  hairColor: number;
  shirtColor: number;
  pantsColor: number;
  name: string;
  isPlayer?: boolean;
}

const SPRITE_WIDTH = 24;
const SPRITE_HEIGHT = 32;

function drawBodyStatic(
  g: Graphics,
  look: CharacterLook,
  direction: Direction,
): void {
  // 清空
  g.clear();

  const cx = SPRITE_WIDTH / 2;

  // ===== 腿（站立时并拢） =====
  g.beginFill(look.pantsColor);
  g.drawRect(cx - 5, 20, 4, 8);
  g.drawRect(cx + 1, 20, 4, 8);
  g.endFill();

  // 鞋
  g.beginFill(0x3a2110);
  g.drawRect(cx - 6, 27, 6, 3);
  g.drawRect(cx, 27, 6, 3);
  g.endFill();

  // ===== 身体（衣服） =====
  g.beginFill(look.shirtColor);
  g.lineStyle(1, darken(look.shirtColor, 0.3));
  g.drawRect(cx - 7, 10, 14, 12);
  g.endFill();
  g.lineStyle(0);

  // 衣服高光
  g.beginFill(0xffffff, 0.15);
  g.drawRect(cx - 6, 11, 4, 2);
  g.endFill();

  // ===== 头 =====
  const headY = 4;
  g.beginFill(look.skinColor);
  g.lineStyle(1, darken(look.skinColor, 0.25));
  g.drawCircle(cx, headY + 4, 5);
  g.endFill();
  g.lineStyle(0);

  // 耳朵（左右各一）
  g.beginFill(look.skinColor);
  g.drawCircle(cx - 5, headY + 4, 1.5);
  g.drawCircle(cx + 5, headY + 4, 1.5);
  g.endFill();

  // ===== 头发（覆盖头顶） =====
  drawHair(g, cx, headY, look.hairColor, direction);
}

function drawHair(
  g: Graphics,
  cx: number,
  headY: number,
  hairColor: number,
  direction: Direction,
): void {
  // 默认头顶头发
  g.beginFill(hairColor);
  g.drawRect(cx - 5, headY - 1, 10, 4);
  g.drawRect(cx - 6, headY, 12, 3);
  g.endFill();

  // 后面的头发（按方向不同露出不同面）
  if (direction === 0) {
    // 上：看不到脸，头发全包
    g.beginFill(hairColor);
    g.drawRect(cx - 5, headY - 1, 10, 9);
    g.endFill();
  } else if (direction === 3) {
    // 左：右边刘海长一点
    g.beginFill(hairColor);
    g.drawRect(cx - 5, headY - 1, 10, 5);
    g.drawRect(cx + 2, headY + 3, 3, 4);
    g.endFill();
  } else if (direction === 1) {
    // 右：左边刘海长一点
    g.beginFill(hairColor);
    g.drawRect(cx - 5, headY - 1, 10, 5);
    g.drawRect(cx - 5, headY + 3, 3, 4);
    g.endFill();
  }
  // 下：默认的就好，不画刘海
}

function drawEyes(
  g: Graphics,
  direction: Direction,
): void {
  g.clear();
  const cx = SPRITE_WIDTH / 2;
  const eyeY = 8;

  if (direction === 0) {
    // 上：看不到眼睛
    return;
  }

  g.beginFill(0x1a130e);
  if (direction === 2) {
    // 下：正脸，两只眼
    g.drawRect(cx - 4, eyeY, 2, 2);
    g.drawRect(cx + 2, eyeY, 2, 2);
  } else if (direction === 1) {
    // 右：侧脸，一只眼偏右
    g.drawRect(cx + 1, eyeY, 2, 2);
  } else if (direction === 3) {
    // 左：侧脸，一只眼偏左
    g.drawRect(cx - 3, eyeY, 2, 2);
  }
  g.endFill();
}

function drawWalkFrame(
  g: Graphics,
  look: CharacterLook,
  frame: number,
): void {
  g.clear();
  const cx = SPRITE_WIDTH / 2;

  // 4 帧：0=并拢, 1=左前右后, 2=并拢, 3=右前左后
  const legOffsets = [
    { left: 0, right: 0 },
    { left: -2, right: 2 },
    { left: 0, right: 0 },
    { left: 2, right: -2 },
  ];
  const off = legOffsets[frame % 4];

  g.beginFill(look.pantsColor);
  g.drawRect(cx - 5 + off.left, 20, 4, 8);
  g.drawRect(cx + 1 + off.right, 20, 4, 8);
  g.endFill();

  g.beginFill(0x3a2110);
  g.drawRect(cx - 6 + off.left, 27, 6, 3);
  g.drawRect(cx + off.right, 27, 6, 3);
  g.endFill();
}

function drawSelectionRing(g: Graphics): void {
  g.clear();
  const cx = SPRITE_WIDTH / 2;
  // 圆环用 16 段近似
  const radius = 16;
  const segments = 24;
  g.lineStyle(2, 0xfff066, 1);
  for (let i = 0; i < segments; i++) {
    const a1 = (i / segments) * Math.PI * 2;
    const a2 = ((i + 1) / segments) * Math.PI * 2;
    const x1 = cx + Math.cos(a1) * radius;
    const y1 = 16 + Math.sin(a1) * radius;
    const x2 = cx + Math.cos(a2) * radius;
    const y2 = 16 + Math.sin(a2) * radius;
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
  }
  g.lineStyle(0);
  g.alpha = 0; // 默认隐藏
}

/** 颜色变暗工具 */
function darken(color: number, ratio: number): number {
  const r = Math.max(0, ((color >> 16) & 0xff) * (1 - ratio));
  const g = Math.max(0, ((color >> 8) & 0xff) * (1 - ratio));
  const b = Math.max(0, (color & 0xff) * (1 - ratio));
  return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
}

/** 创建角色视觉对象 */
export function createCharacterVisual(look: CharacterLook): CharacterVisual {
  const container = new Container();
  container.name = look.isPlayer ? 'player' : `npc-${look.name}`;

  // 选中光圈（最底层）
  const selectionRing = new Graphics();
  drawSelectionRing(selectionRing);
  container.addChild(selectionRing);

  // 身体
  const bodyGfx = new Graphics();
  container.addChild(bodyGfx);

  // 眼睛层（在身体之上）
  const eyesGfx = new Graphics();
  container.addChild(eyesGfx);

  // 走路腿部（在身体之上）
  const walkGfx = new Graphics();
  container.addChild(walkGfx);

  // 头顶名字
  const nameText = new Text(look.name, {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: 7,
    fill: '#FFFFFF',
    stroke: '#000000',
    strokeThickness: 2,
    align: 'center',
  });
  nameText.anchor.set(0.5, 1);
  nameText.x = SPRITE_WIDTH / 2;
  nameText.y = -2;
  container.addChild(nameText);

  return { body: container, bodyGfx, walkGfx, eyesGfx, nameText, selectionRing };
}

/** 重新绘制角色（站立 + 行走） */
export function redrawCharacter(
  visual: CharacterVisual,
  look: CharacterLook,
  direction: Direction,
  frame: number,
  isMoving: boolean,
): void {
  drawBodyStatic(visual.bodyGfx, look, direction);
  drawEyes(visual.eyesGfx, direction);
  if (isMoving) {
    drawWalkFrame(visual.walkGfx, look, frame);
  } else {
    visual.walkGfx.clear();
  }
}

/** 设置选中光圈显示/隐藏 */
export function setSelected(visual: CharacterVisual, selected: boolean): void {
  visual.selectionRing.alpha = selected ? 1 : 0;
}

/** 角色 sprite 尺寸（外部用于把脚底中心 → 左上角） */
export const CHARACTER_SPRITE = {
  width: SPRITE_WIDTH,
  height: SPRITE_HEIGHT,
};

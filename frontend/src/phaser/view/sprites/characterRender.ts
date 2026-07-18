/**
 * 程序化角色渲染器 - 用 Phaser Graphics 绘制星露谷风小像素人
 *
 * 替代 helloagents-ai-town-phaser/src/phaser/view/sprites/animationFactory.ts
 *
 * 设计：
 * - 每个角色是一个 Phaser.GameObjects.Container
 *   - bodyGfx：身体 + 头 + 发 + 衣服
 *   - walkGfx：腿部（走路时切换）
 *   - eyesGfx：眼睛
 *   - selectionRing：选中光圈
 * - position 是"脚底中心"
 * - 渲染时把脚底中心换算成 sprite 左上角
 */

import Phaser from "phaser";

export interface CharacterLook {
  skinColor: number;
  hairColor: number;
  shirtColor: number;
  pantsColor: number;
}

export interface CharacterVisual {
  container: Phaser.GameObjects.Container;
  bodyGfx: Phaser.GameObjects.Graphics;
  walkGfx: Phaser.GameObjects.Graphics;
  eyesGfx: Phaser.GameObjects.Graphics;
  ringGfx: Phaser.GameObjects.Graphics;
  nameLabel: Phaser.GameObjects.Text;
  dialogueBubble: Phaser.GameObjects.Container;
  dialogueLabel: Phaser.GameObjects.Text;
}

const SPRITE_WIDTH = 24;
const SPRITE_HEIGHT = 32;

function darken(color: number, ratio: number): number {
  const r = Math.max(0, ((color >> 16) & 0xff) * (1 - ratio));
  const g = Math.max(0, ((color >> 8) & 0xff) * (1 - ratio));
  const b = Math.max(0, (color & 0xff) * (1 - ratio));
  return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
}

function drawBodyStatic(
  g: Phaser.GameObjects.Graphics,
  look: CharacterLook,
  facing: "up" | "down" | "left" | "right",
): void {
  g.clear();

  const cx = SPRITE_WIDTH / 2;

  // 腿（站立时并拢）
  g.fillStyle(look.pantsColor, 1);
  g.fillRect(cx - 5, 20, 4, 8);
  g.fillRect(cx + 1, 20, 4, 8);

  // 鞋
  g.fillStyle(0x3a2110, 1);
  g.fillRect(cx - 6, 27, 6, 3);
  g.fillRect(cx, 27, 6, 3);

  // 身体
  g.fillStyle(look.shirtColor, 1);
  g.lineStyle(1, darken(look.shirtColor, 0.3), 1);
  g.fillRect(cx - 7, 10, 14, 12);
  g.lineStyle(0, 0x000000, 0);

  // 高光
  g.fillStyle(0xffffff, 0.15);
  g.fillRect(cx - 6, 11, 4, 2);

  // 头
  g.fillStyle(look.skinColor, 1);
  g.lineStyle(1, darken(look.skinColor, 0.25), 1);
  g.fillCircle(cx, 8, 5);
  g.lineStyle(0, 0x000000, 0);

  // 耳朵
  g.fillStyle(look.skinColor, 1);
  g.fillCircle(cx - 5, 8, 1.5);
  g.fillCircle(cx + 5, 8, 1.5);

  // 头发
  drawHair(g, cx, look.hairColor, facing);
}

function drawHair(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  hairColor: number,
  facing: "up" | "down" | "left" | "right",
): void {
  g.fillStyle(hairColor, 1);
  // 头顶
  g.fillRect(cx - 5, 3, 10, 4);
  g.fillRect(cx - 6, 4, 12, 3);

  // 侧刘海
  if (facing === "up") {
    g.fillRect(cx - 5, 3, 10, 9);
  } else if (facing === "left") {
    g.fillRect(cx + 2, 7, 3, 4);
  } else if (facing === "right") {
    g.fillRect(cx - 5, 7, 3, 4);
  }
}

function drawEyes(
  g: Phaser.GameObjects.Graphics,
  facing: "up" | "down" | "left" | "right",
): void {
  g.clear();
  if (facing === "up") return;

  const cx = SPRITE_WIDTH / 2;
  g.fillStyle(0x1a130e, 1);

  if (facing === "down") {
    g.fillRect(cx - 4, 8, 2, 2);
    g.fillRect(cx + 2, 8, 2, 2);
  } else if (facing === "right") {
    g.fillRect(cx + 1, 8, 2, 2);
  } else if (facing === "left") {
    g.fillRect(cx - 3, 8, 2, 2);
  }
}

function drawWalkFrame(
  g: Phaser.GameObjects.Graphics,
  look: CharacterLook,
  frame: number,
): void {
  g.clear();
  const cx = SPRITE_WIDTH / 2;
  const offsets = [
    { l: 0, r: 0 },
    { l: -2, r: 2 },
    { l: 0, r: 0 },
    { l: 2, r: -2 },
  ];
  const o = offsets[frame % 4];

  g.fillStyle(look.pantsColor, 1);
  g.fillRect(cx - 5 + o.l, 20, 4, 8);
  g.fillRect(cx + 1 + o.r, 20, 4, 8);

  g.fillStyle(0x3a2110, 1);
  g.fillRect(cx - 6 + o.l, 27, 6, 3);
  g.fillRect(cx + o.r, 27, 6, 3);
}

function drawSelectionRing(g: Phaser.GameObjects.Graphics, selected: boolean): void {
  g.clear();
  if (!selected) {
    g.setAlpha(0);
    return;
  }
  g.setAlpha(1);
  const cx = SPRITE_WIDTH / 2;
  const r = 16;
  const segments = 24;
  g.lineStyle(2, 0xfff066, 1);
  for (let i = 0; i < segments; i++) {
    const a1 = (i / segments) * Math.PI * 2;
    const a2 = ((i + 1) / segments) * Math.PI * 2;
    g.beginPath();
    g.moveTo(cx + Math.cos(a1) * r, 16 + Math.sin(a1) * r);
    g.lineTo(cx + Math.cos(a2) * r, 16 + Math.sin(a2) * r);
    g.strokePath();
  }
  g.lineStyle(0, 0x000000, 0);
}

/** 创建角色视觉对象 */
export function createCharacterVisual(
  scene: Phaser.Scene,
  name: string,
  look: CharacterLook,
): CharacterVisual {
  const container = scene.add.container(0, 0);

  // 选中光圈（最底层）
  const ringGfx = scene.add.graphics();
  drawSelectionRing(ringGfx, false);
  container.add(ringGfx);

  // 身体
  const bodyGfx = scene.add.graphics();
  container.add(bodyGfx);

  // 眼睛
  const eyesGfx = scene.add.graphics();
  container.add(eyesGfx);

  // 走路腿部
  const walkGfx = scene.add.graphics();
  container.add(walkGfx);

  // 名字
  const nameLabel = scene.add.text(SPRITE_WIDTH / 2, -2, name, {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: "8px",
    color: "#FFFFFF",
    stroke: "#000000",
    strokeThickness: 2,
    align: "center",
  });
  nameLabel.setOrigin(0.5, 1);
  nameLabel.setResolution(2);
  container.add(nameLabel);

  // 对话气泡
  const dialogueBubble = scene.add.container(0, 0);
  const bubbleBg = scene.add.graphics();
  const dialogueLabel = scene.add.text(0, 0, "", {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: "8px",
    color: "#FFFFFF",
    align: "center",
    wordWrap: { width: 140 },
  });
  dialogueLabel.setOrigin(0.5, 1);
  dialogueLabel.setResolution(2);
  dialogueBubble.add([bubbleBg, dialogueLabel]);
  dialogueBubble.setVisible(false);
  container.add(dialogueBubble);

  return {
    container,
    bodyGfx,
    walkGfx,
    eyesGfx,
    ringGfx,
    nameLabel,
    dialogueBubble,
    dialogueLabel,
  };
}

/** 重绘角色 */
export function redrawCharacter(
  visual: CharacterVisual,
  look: CharacterLook,
  facing: "up" | "down" | "left" | "right",
  animationKey: string,
  frame: number,
): void {
  const isMoving = animationKey.startsWith("walk_");
  drawBodyStatic(visual.bodyGfx, look, facing);
  drawEyes(visual.eyesGfx, facing);
  if (isMoving) {
    drawWalkFrame(visual.walkGfx, look, frame);
  } else {
    visual.walkGfx.clear();
  }
}

export function setSelected(visual: CharacterVisual, selected: boolean): void {
  drawSelectionRing(visual.ringGfx, selected);
}

/** 把"脚底中心"换算成 sprite 左上角 */
export function positionVisual(
  visual: CharacterVisual,
  pos: { x: number; y: number },
): void {
  visual.container.x = pos.x - SPRITE_WIDTH / 2;
  visual.container.y = pos.y - SPRITE_HEIGHT;
}

export const CHARACTER_SPRITE_SIZE = { width: SPRITE_WIDTH, height: SPRITE_HEIGHT };

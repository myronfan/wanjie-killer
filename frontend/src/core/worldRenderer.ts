/**
 * 世界渲染器 - 用 PixiJS Graphics 程序化绘制地图
 *
 * 设计原则：
 * 1. 全部用 Graphics 绘制，不依赖外部图集（零资产加载）
 * 2. 风格贴近《星露谷物语》：暖色调 + 像素感 + 简单几何
 * 3. 复用 worldConfig 的 obstacles，按 kind 不同样式
 */

import { Container, Graphics, Text } from 'pixi.js';
import { WORLD_CONFIG, type RectObstacle } from './worldConfig';
import { PALETTE } from './palette';

const TILE = WORLD_CONFIG.tilePixelSize;

/** 障碍视觉样式表 */
const KIND_STYLE: Record<
  RectObstacle['kind'],
  {
    fill: number;
    stroke: number;
    strokeWidth: number;
    labelColor: string;
    labelBg: number;
  }
> = {
  wall: {
    fill: 0x8e664a,
    stroke: 0x5a3f2e,
    strokeWidth: 1,
    labelColor: '#F5E8D0',
    labelBg: 0x553318,
  },
  door: {
    fill: 0xc49647,
    stroke: 0x8e664a,
    strokeWidth: 1,
    labelColor: '#3A2E25',
    labelBg: 0xc49647,
  },
  building: {
    fill: 0x8e664a,
    stroke: 0x553318,
    strokeWidth: 2,
    labelColor: '#F5E8D0',
    labelBg: 0x553318,
  },
  furniture: {
    fill: 0xc49647,
    stroke: 0x8e664a,
    strokeWidth: 1,
    labelColor: '#3A2E25',
    labelBg: 0xc49647,
  },
  board: {
    fill: 0x5baee0,
    stroke: 0x2a6f95,
    strokeWidth: 1,
    labelColor: '#FFFFFF',
    labelBg: 0x2a6f95,
  },
  tree: {
    fill: 0x5bae5b,
    stroke: 0x3a8a3a,
    strokeWidth: 2,
    labelColor: '#FFFFFF',
    labelBg: 0x3a8a3a,
  },
  water: {
    fill: 0x5baee0,
    stroke: 0x3a85ae,
    strokeWidth: 1,
    labelColor: '#FFFFFF',
    labelBg: 0x2a6f95,
  },
};

/** 棋盘格地板 */
function drawFloor(g: Graphics): void {
  const W = WORLD_CONFIG.width;
  const H = WORLD_CONFIG.height;

  g.beginFill(0xf4e8d0);
  g.drawRect(0, 0, W, H);
  g.endFill();

  for (let y = 0; y < H; y += TILE) {
    for (let x = 0; x < W; x += TILE) {
      const isAlt = ((x / TILE) + (y / TILE)) % 2 === 0;
      g.beginFill(isAlt ? 0xe8d8b8 : 0xf4e8d0, 1);
      g.drawRect(x, y, TILE, TILE);
      g.endFill();
    }
  }

  g.lineStyle(1, 0xd8c4a0, 0.35);
  for (let x = 0; x <= W; x += TILE) {
    g.moveTo(x, 0);
    g.lineTo(x, H);
  }
  for (let y = 0; y <= H; y += TILE) {
    g.moveTo(0, y);
    g.lineTo(W, y);
  }
  g.lineStyle(0);
}

/** 单个 obstacle 的绘制 */
function drawObstacle(g: Graphics, o: RectObstacle): void {
  const style = KIND_STYLE[o.kind];

  // 阴影
  g.beginFill(0x000000, 0.18);
  g.drawRect(o.x + 2, o.y + 2, o.width, o.height);
  g.endFill();

  // 主体
  g.beginFill(style.fill, 1);
  g.lineStyle(style.strokeWidth, style.stroke);
  g.drawRect(o.x, o.y, o.width, o.height);
  g.endFill();
  g.lineStyle(0);

  // 顶部高光
  if (o.height > 8 && o.width > 8) {
    g.beginFill(0xffffff, 0.18);
    g.drawRect(o.x + 1, o.y + 1, o.width - 2, 2);
    g.endFill();
  }

  // 树：树冠 + 树干
  if (o.kind === 'tree') {
    const cx = o.x + o.width / 2;
    const cy = o.y + o.height / 2;
    g.beginFill(0x553318);
    g.drawRect(cx - 4, cy + 4, 8, 12);
    g.endFill();
    g.beginFill(0x5bae5b);
    g.lineStyle(2, 0x3a8a3a);
    g.drawCircle(cx, cy - 2, o.width / 2 - 2);
    g.endFill();
    g.lineStyle(0);
    g.beginFill(0xffffff, 0.25);
    g.drawCircle(cx - 3, cy - 5, 4);
    g.endFill();
  }

  // 门：浅色高亮
  if (o.kind === 'door') {
    g.beginFill(0xffe0bd, 0.6);
    g.drawRect(o.x + 1, o.y + 1, o.width - 2, o.height - 2);
    g.endFill();
  }
}

/** label 文字 */
function drawLabel(container: Container, o: RectObstacle): void {
  if (!o.label) return;

  const style = KIND_STYLE[o.kind];
  const text = new Text(o.label, {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: 8,
    fill: style.labelColor,
    align: 'center',
  });

  const padding = 3;
  const bg = new Graphics();
  bg.beginFill(style.labelBg, 0.9);
  bg.lineStyle(1, 0x000000, 0.4);
  bg.drawRoundedRect(
    -text.width / 2 - padding,
    -text.height / 2 - padding,
    text.width + padding * 2,
    text.height + padding * 2,
    2,
  );
  bg.endFill();
  bg.lineStyle(0);

  const wrapper = new Container();
  wrapper.addChild(bg);
  wrapper.addChild(text);

  wrapper.x = o.x + o.width / 2;
  wrapper.y = o.y - 12;

  container.addChild(wrapper);
}

/** 组装世界 */
export function buildWorld(): Container {
  const worldContainer = new Container();
  worldContainer.name = 'world';

  const floorGfx = new Graphics();
  drawFloor(floorGfx);
  worldContainer.addChild(floorGfx);

  const obstaclesGfx = new Graphics();
  for (const o of WORLD_CONFIG.obstacles) {
    drawObstacle(obstaclesGfx, o);
  }
  worldContainer.addChild(obstaclesGfx);

  const labelsLayer = new Container();
  labelsLayer.name = 'labels';
  for (const o of WORLD_CONFIG.obstacles) {
    drawLabel(labelsLayer, o);
  }
  worldContainer.addChild(labelsLayer);

  return worldContainer;
}

/** 摄像机跟随偏移（玩家居中） */
export function computeWorldOffset(
  playerX: number,
  playerY: number,
  screenW: number,
  screenH: number,
): { x: number; y: number } {
  let x = -(playerX - screenW / 2);
  let y = -(playerY - screenH / 2);
  x = Math.min(Math.max(x, screenW - WORLD_CONFIG.width), 0);
  y = Math.min(Math.max(y, screenH - WORLD_CONFIG.height), 0);
  return { x, y };
}

export const _PALETTE_REF = PALETTE;

/**
 * 世界渲染器 - 程序化绘制地板 + 障碍
 */

import Phaser from "phaser";

import { WORLD_CONFIG, type RectObstacle } from "../../game/content/world";

const TILE = WORLD_CONFIG.tileSize;

interface KindStyle {
  fill: number;
  stroke: number;
  labelColor: string;
  labelBg: number;
}

const KIND_STYLE: Record<RectObstacle["kind"], KindStyle> = {
  wall: { fill: 0x8e664a, stroke: 0x5a3f2e, labelColor: "#F5E8D0", labelBg: 0x553318 },
  door: { fill: 0xc49647, stroke: 0x8e664a, labelColor: "#3A2E25", labelBg: 0xc49647 },
  building: { fill: 0x8e664a, stroke: 0x553318, labelColor: "#F5E8D0", labelBg: 0x553318 },
  furniture: { fill: 0xc49647, stroke: 0x8e664a, labelColor: "#3A2E25", labelBg: 0xc49647 },
  board: { fill: 0x5baee0, stroke: 0x2a6f95, labelColor: "#FFFFFF", labelBg: 0x2a6f95 },
  tree: { fill: 0x5bae5b, stroke: 0x3a8a3a, labelColor: "#FFFFFF", labelBg: 0x3a8a3a },
  water: { fill: 0x5baee0, stroke: 0x3a85ae, labelColor: "#FFFFFF", labelBg: 0x2a6f95 },
  plant: { fill: 0x5bae5b, stroke: 0x3a8a3a, labelColor: "#FFFFFF", labelBg: 0x3a8a3a },
};

function drawFloor(g: Phaser.GameObjects.Graphics): void {
  const W = WORLD_CONFIG.width;
  const H = WORLD_CONFIG.height;

  g.fillStyle(0xf4e8d0, 1);
  g.fillRect(0, 0, W, H);

  // 棋盘格
  for (let y = 0; y < H; y += TILE) {
    for (let x = 0; x < W; x += TILE) {
      const isAlt = ((x / TILE) + (y / TILE)) % 2 === 0;
      g.fillStyle(isAlt ? 0xe8d8b8 : 0xf4e8d0, 1);
      g.fillRect(x, y, TILE, TILE);
    }
  }

  // 网格线
  g.lineStyle(1, 0xd8c4a0, 0.35);
  for (let x = 0; x <= W; x += TILE) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, H);
    g.strokePath();
  }
  for (let y = 0; y <= H; y += TILE) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(W, y);
    g.strokePath();
  }
  g.lineStyle(0, 0x000000, 0);
}

function drawObstacle(g: Phaser.GameObjects.Graphics, o: RectObstacle): void {
  const style = KIND_STYLE[o.kind];

  // 阴影
  g.fillStyle(0x000000, 0.18);
  g.fillRect(o.x + 2, o.y + 2, o.width, o.height);

  // 主体
  g.fillStyle(style.fill, 1);
  g.lineStyle(1, style.stroke, 1);
  g.fillRect(o.x, o.y, o.width, o.height);
  g.lineStyle(0, 0x000000, 0);

  // 顶部高光
  if (o.height > 8 && o.width > 8) {
    g.fillStyle(0xffffff, 0.18);
    g.fillRect(o.x + 1, o.y + 1, o.width - 2, 2);
  }

  // 树
  if (o.kind === "tree") {
    const cx = o.x + o.width / 2;
    const cy = o.y + o.height / 2;
    g.fillStyle(0x553318, 1);
    g.fillRect(cx - 4, cy + 4, 8, 12);
    g.fillStyle(0x5bae5b, 1);
    g.lineStyle(2, 0x3a8a3a, 1);
    g.fillCircle(cx, cy - 2, o.width / 2 - 2);
    g.lineStyle(0, 0x000000, 0);
    g.fillStyle(0xffffff, 0.25);
    g.fillCircle(cx - 3, cy - 5, 4);
  }

  // 门
  if (o.kind === "door") {
    g.fillStyle(0xffe0bd, 0.6);
    g.fillRect(o.x + 1, o.y + 1, o.width - 2, o.height - 2);
  }
}

/**
 * 组装世界：返回所有 graphic container
 */
export function buildWorld(scene: Phaser.Scene): {
  floor: Phaser.GameObjects.Graphics;
  obstacles: Phaser.GameObjects.Graphics;
  labels: Phaser.GameObjects.Container;
} {
  const floor = scene.add.graphics();
  floor.setDepth(-100);
  drawFloor(floor);

  const obstacles = scene.add.graphics();
  obstacles.setDepth(-50);
  for (const o of WORLD_CONFIG.obstacles) {
    drawObstacle(obstacles, o);
  }

  const labels = scene.add.container(0, 0);
  labels.setDepth(-40);
  for (const o of WORLD_CONFIG.obstacles) {
    if (!o.label) continue;
    const style = KIND_STYLE[o.kind];
    const text = scene.add.text(o.x + o.width / 2, o.y - 12, o.label, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: "8px",
      color: style.labelColor,
      align: "center",
      backgroundColor: `#${style.labelBg.toString(16).padStart(6, "0")}`,
      padding: { x: 4, y: 2 },
    });
    text.setOrigin(0.5, 1);
    text.setResolution(2);
    labels.add(text);
  }

  return { floor, obstacles, labels };
}

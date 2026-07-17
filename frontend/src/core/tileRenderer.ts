/**
 * 瓦片渲染器
 *
 * 用 Graphics 程序化绘制各种瓦片
 * 之后可以替换为 sprite sheet 渲染
 */

import { Graphics } from 'pixi.js';
import { PALETTE } from './palette';
import { TILE_SIZE, type TileType, type TileMapData, getMapDimensions } from './tileset';

const SCALE = 3; // 16px → 48px（视觉放大）

/**
 * 绘制单个瓦片
 */
function drawTile(g: Graphics, type: TileType, px: number, py: number): void {
  g.lineStyle(0);

  switch (type) {
    case 'grass':
      // 草地
      g.beginFill(PALETTE.grass_spring[0]);
      g.drawRect(px, py, TILE_SIZE * SCALE, TILE_SIZE * SCALE);
      g.endFill();
      // 装饰：随机小草
      g.beginFill(PALETTE.grass_spring[1], 0.6);
      for (let i = 0; i < 3; i++) {
        const sx = px + ((px * 7 + i * 13) % (TILE_SIZE * SCALE - 4)) + 2;
        const sy = py + ((py * 11 + i * 7) % (TILE_SIZE * SCALE - 4)) + 2;
        g.drawRect(sx, sy, 2, 2);
      }
      g.endFill();
      break;

    case 'grass_tall':
      g.beginFill(PALETTE.grass_spring[0]);
      g.drawRect(px, py, TILE_SIZE * SCALE, TILE_SIZE * SCALE);
      g.endFill();
      // 高草丛
      g.beginFill(PALETTE.grass_summer[0]);
      for (let i = 0; i < 4; i++) {
        const sx = px + ((px * 7 + i * 11) % (TILE_SIZE * SCALE - 6)) + 3;
        const sy = py + ((py * 13 + i * 5) % (TILE_SIZE * SCALE - 8)) + 4;
        g.drawRect(sx, sy, 3, 4);
      }
      g.endFill();
      break;

    case 'dirt':
      g.beginFill(PALETTE.soil[0]);
      g.drawRect(px, py, TILE_SIZE * SCALE, TILE_SIZE * SCALE);
      g.endFill();
      g.beginFill(PALETTE.soil[1], 0.5);
      for (let i = 0; i < 5; i++) {
        const sx = px + ((px * 5 + i * 9) % (TILE_SIZE * SCALE - 4)) + 2;
        const sy = py + ((py * 7 + i * 3) % (TILE_SIZE * SCALE - 4)) + 2;
        g.drawRect(sx, sy, 3, 3);
      }
      g.endFill();
      break;

    case 'path_h':
      // 横向路径
      g.beginFill(PALETTE.wood_light[0]);
      g.drawRect(px, py, TILE_SIZE * SCALE, TILE_SIZE * SCALE);
      g.endFill();
      g.beginFill(PALETTE.wood[0], 0.4);
      g.drawRect(px, py + TILE_SIZE * SCALE * 0.5, TILE_SIZE * SCALE, 2);
      g.drawRect(px, py + TILE_SIZE * SCALE * 0.3, TILE_SIZE * SCALE, 1);
      g.endFill();
      break;

    case 'path_v':
      g.beginFill(PALETTE.wood_light[0]);
      g.drawRect(px, py, TILE_SIZE * SCALE, TILE_SIZE * SCALE);
      g.endFill();
      g.beginFill(PALETTE.wood[0], 0.4);
      g.drawRect(px + TILE_SIZE * SCALE * 0.5, py, 2, TILE_SIZE * SCALE);
      g.drawRect(px + TILE_SIZE * SCALE * 0.3, py, 1, TILE_SIZE * SCALE);
      g.endFill();
      break;

    case 'water':
      g.beginFill(PALETTE.water[0]);
      g.drawRect(px, py, TILE_SIZE * SCALE, TILE_SIZE * SCALE);
      g.endFill();
      // 水波纹
      g.beginFill(PALETTE.water[1], 0.5);
      g.drawRect(px + 4, py + 6, 8, 1);
      g.drawRect(px + 16, py + 10, 6, 1);
      g.drawRect(px + 8, py + 22, 6, 1);
      g.endFill();
      // 高光
      g.beginFill(PALETTE.water[2], 0.7);
      g.drawRect(px + 6, py + 4, 4, 1);
      g.drawRect(px + 22, py + 14, 4, 1);
      g.endFill();
      break;

    case 'sand':
      g.beginFill('#F4D58D');
      g.drawRect(px, py, TILE_SIZE * SCALE, TILE_SIZE * SCALE);
      g.endFill();
      g.beginFill(PALETTE.wood_light[1], 0.3);
      for (let i = 0; i < 4; i++) {
        const sx = px + ((px * 5 + i * 7) % (TILE_SIZE * SCALE - 4)) + 2;
        const sy = py + ((py * 11 + i * 13) % (TILE_SIZE * SCALE - 4)) + 2;
        g.drawRect(sx, sy, 2, 2);
      }
      g.endFill();
      break;

    case 'farmland':
      g.beginFill(PALETTE.soil[1]);
      g.drawRect(px, py, TILE_SIZE * SCALE, TILE_SIZE * SCALE);
      g.endFill();
      // 犁沟
      g.beginFill(PALETTE.soil[2]);
      g.drawRect(px + 2, py + 4, TILE_SIZE * SCALE - 4, 1);
      g.drawRect(px + 2, py + 10, TILE_SIZE * SCALE - 4, 1);
      g.drawRect(px + 2, py + 16, TILE_SIZE * SCALE - 4, 1);
      g.drawRect(px + 2, py + 22, TILE_SIZE * SCALE - 4, 1);
      g.endFill();
      break;

    case 'stone':
      // 石头（装饰物）
      g.beginFill(PALETTE.stone[1]);
      g.drawRoundedRect(px + 4, py + 8, TILE_SIZE * SCALE - 8, TILE_SIZE * SCALE - 12, 2);
      g.endFill();
      g.beginFill(PALETTE.stone[2]);
      g.drawRoundedRect(px + 6, py + 10, TILE_SIZE * SCALE - 14, TILE_SIZE * SCALE - 18, 1);
      g.endFill();
      break;

    case 'tree':
      // 树（装饰物，会覆盖草地）
      // 先画一片草地作为底
      g.beginFill(PALETTE.grass_spring[0]);
      g.drawRect(px, py, TILE_SIZE * SCALE, TILE_SIZE * SCALE);
      g.endFill();
      // 树干
      g.beginFill(PALETTE.wood[1]);
      g.drawRect(px + TILE_SIZE * SCALE * 0.4, py + TILE_SIZE * SCALE * 0.5, TILE_SIZE * SCALE * 0.2, TILE_SIZE * SCALE * 0.5);
      g.endFill();
      // 树冠（多层）
      g.beginFill(PALETTE.grass_summer[0]);
      g.drawCircle(px + TILE_SIZE * SCALE * 0.5, py + TILE_SIZE * SCALE * 0.35, TILE_SIZE * SCALE * 0.45);
      g.endFill();
      g.beginFill(PALETTE.grass_summer[1]);
      g.drawCircle(px + TILE_SIZE * SCALE * 0.35, py + TILE_SIZE * SCALE * 0.4, TILE_SIZE * SCALE * 0.3);
      g.drawCircle(px + TILE_SIZE * SCALE * 0.65, py + TILE_SIZE * SCALE * 0.4, TILE_SIZE * SCALE * 0.3);
      g.endFill();
      g.beginFill(PALETTE.grass_summer[2]);
      g.drawCircle(px + TILE_SIZE * SCALE * 0.5, py + TILE_SIZE * SCALE * 0.25, TILE_SIZE * SCALE * 0.2);
      g.endFill();
      break;

    default:
      g.beginFill(0xff00ff);
      g.drawRect(px, py, TILE_SIZE * SCALE, TILE_SIZE * SCALE);
      g.endFill();
      break;
  }
}

/**
 * 绘制整个地图
 */
export function drawMap(g: Graphics, map: TileMapData): void {
  g.clear();
  const { width, height } = getMapDimensions(map);

  // 先画底层所有地面
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tile = map[y][x];
      // 装饰物不画底层
      if (tile !== 'tree' && tile !== 'stone') {
        drawTile(g, tile, x * TILE_SIZE * SCALE, y * TILE_SIZE * SCALE);
      }
    }
  }

  // 再画装饰物层
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tile = map[y][x];
      if (tile === 'tree' || tile === 'stone') {
        drawTile(g, tile, x * TILE_SIZE * SCALE, y * TILE_SIZE * SCALE);
      }
    }
  }
}

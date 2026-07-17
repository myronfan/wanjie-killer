/**
 * 瓦片地图系统
 *
 * 设计参考 a16z/ai-town 的 data/convertMap.js 和 src/editor/maps/
 * 暂时用程序化绘制（之后可替换为 OpenGameArt 资源）
 */

import { PALETTE } from './palette';

// 瓦片类型
export type TileType =
  | 'grass'      // 草地
  | 'grass_tall' // 高草
  | 'dirt'       // 泥土
  | 'path_h'     // 横向路径
  | 'path_v'     // 纵向路径
  | 'water'      // 水
  | 'stone'      // 石头
  | 'tree'       // 树
  | 'sand'       // 沙子
  | 'farmland';  // 耕地

export interface TileData {
  type: TileType;
  walkable: boolean;
  sprite?: string; // 之后指向 sprite sheet 中的位置
}

// 瓦片配置表
export const TILE_CONFIGS: Record<TileType, TileData> = {
  grass:      { type: 'grass',      walkable: true },
  grass_tall: { type: 'grass_tall', walkable: true },
  dirt:       { type: 'dirt',       walkable: true },
  path_h:     { type: 'path_h',     walkable: true },
  path_v:     { type: 'path_v',     walkable: true },
  water:      { type: 'water',      walkable: false },
  stone:      { type: 'stone',      walkable: false },
  tree:       { type: 'tree',       walkable: false },
  sand:       { type: 'sand',       walkable: true },
  farmland:   { type: 'farmland',   walkable: true },
};

export const TILE_SIZE = 16; // 像素（之后用 SCALE 放大）

// 地图数据：二维数组，每个格子是 TileType
export type TileMapData = TileType[][];

// 示例地图（小镇）
// # = 树, ~ = 水, . = 草地, : = 泥土路径, , = 高草, S = 石头
export const SAMPLE_MAP_STRING = `
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~####################################~~~~~~~####################################~~~~~~~~~
~~~~~~~~~#..................................#~~~~~#........................................#~~~~~~~~~
~~~~~~~~~#..................................#~~~~~#........................................#~~~~~~~~~
~~~~~~~~~#..................................#~~~~~#........................................#~~~~~~~~~
~~~~~~~~~#..................................######..........................................#~~~~~~~~~
~~~~~~~~~#..................................~~~~~~~~~~~~......................................#~~~~~~~~~
~~~~~~~~~#..................................~~~~~~~~~~~~......................................#~~~~~~~~~
~~~~~~~~~#..................................############......................................#~~~~~~~~~
~~~~~~~~~#.................................................::::::::::::::::::::::...........#~~~~~~~~~
~~~~~~~~~#.................................................::::::::::::::::::::::...........#~~~~~~~~~
~~~~~~~~~#.................................................::::::::::::::::::::::...........#~~~~~~~~~
~~~~~~~~~####################################................::::::::::::::::::::::...........#######
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
`;

export function parseMapString(mapString: string): TileMapData {
  const lines = mapString
    .split('\n')
    .filter((l) => l.length > 0)
    .map((l) => l.trim());

  return lines.map((line) =>
    line.split('').map((char): TileType => {
      switch (char) {
        case '#': return 'tree';
        case '~': return 'water';
        case '.': return 'grass';
        case ',': return 'grass_tall';
        case ':': return 'path_h';
        case '|': return 'path_v';
        case 'S': return 'stone';
        case 's': return 'sand';
        default:  return 'grass';
      }
    })
  );
}

export function getMapDimensions(map: TileMapData): { width: number; height: number } {
  return {
    width: map[0]?.length ?? 0,
    height: map.length,
  };
}

/**
 * 检查某个坐标是否可走
 */
export function isWalkable(map: TileMapData, x: number, y: number): boolean {
  if (y < 0 || y >= map.length) return false;
  if (x < 0 || x >= map[0].length) return false;
  const tile = map[y][x];
  return TILE_CONFIGS[tile].walkable;
}

/**
 * 检查角色位置是否在地图范围内
 */
export function isInBounds(map: TileMapData, x: number, y: number): boolean {
  return x >= 0 && x < map[0].length && y >= 0 && y < map.length;
}

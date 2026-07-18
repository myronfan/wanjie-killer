/**
 * 瓦片地图系统
 *
 * 设计参考 a16z/ai-town 的 data/convertMap.js 和 src/editor/maps/
 *
 * 修复历史：
 * - 2026-07-18: 修复 path_h/path_v 在地图字符串里无法区分的问题
 *   - 改为 path_horizontal (-)、path_vertical (|)、path_cross (+)、path_corner 4 种
 *   - 保留兼容：单字符 : 仍然是 path_horizontal
 */

import { PALETTE } from './palette';

// 瓦片类型
export type TileType =
  | 'grass'              // 草地
  | 'grass_tall'         // 高草
  | 'dirt'               // 泥土
  | 'path_horizontal'    // 横向路径
  | 'path_vertical'      // 纵向路径
  | 'path_cross'         // 十字路径
  | 'path_corner_tl'     // 拐角（左上）
  | 'path_corner_tr'     // 拐角（右上）
  | 'path_corner_bl'     // 拐角（左下）
  | 'path_corner_br'     // 拐角（右下）
  | 'path_t'             // T 形路径（上）
  | 'path_t_down'        // T 形路径（下）
  | 'path_t_left'        // T 形路径（左）
  | 'path_t_right'       // T 形路径（右）
  | 'path_end'           // 路径尽头
  | 'water'              // 水
  | 'stone'              // 石头
  | 'tree'               // 树
  | 'sand'               // 沙子
  | 'farmland';          // 耕地

export interface TileData {
  type: TileType;
  walkable: boolean;
  sprite?: string;
}

export const TILE_CONFIGS: Record<TileType, TileData> = {
  grass:           { type: 'grass',           walkable: true },
  grass_tall:      { type: 'grass_tall',      walkable: true },
  dirt:            { type: 'dirt',            walkable: true },
  path_horizontal: { type: 'path_horizontal', walkable: true },
  path_vertical:   { type: 'path_vertical',   walkable: true },
  path_cross:      { type: 'path_cross',      walkable: true },
  path_corner_tl:  { type: 'path_corner_tl',  walkable: true },
  path_corner_tr:  { type: 'path_corner_tr',  walkable: true },
  path_corner_bl:  { type: 'path_corner_bl',  walkable: true },
  path_corner_br:  { type: 'path_corner_br',  walkable: true },
  path_t:          { type: 'path_t',          walkable: true },
  path_t_down:     { type: 'path_t_down',     walkable: true },
  path_t_left:     { type: 'path_t_left',     walkable: true },
  path_t_right:    { type: 'path_t_right',    walkable: true },
  path_end:        { type: 'path_end',        walkable: true },
  water:           { type: 'water',           walkable: false },
  stone:           { type: 'stone',           walkable: false },
  tree:            { type: 'tree',            walkable: false },
  sand:            { type: 'sand',            walkable: true },
  farmland:        { type: 'farmland',        walkable: true },
};

export const TILE_SIZE = 16;

// 地图数据：二维数组，每个格子是 TileType
export type TileMapData = TileType[][];

/**
 * 地图字符 → 瓦片类型映射
 *
 * 字符说明：
 *   # = 树, ~ = 水, . = 草地, , = 高草
 *   s = 石头, S = 沙子, F = 耕地
 *   - = 横向路径, | = 纵向路径, + = 十字
 *   / = 拐角（左下到右上）
 *   \ = 拐角（左上到右下）
 *   : = 兼容旧版横向路径（同 -）
 */
const CHAR_MAP: Record<string, TileType> = {
  '#': 'tree',
  '~': 'water',
  '.': 'grass',
  ',': 'grass_tall',
  's': 'stone',
  'S': 'sand',
  'F': 'farmland',
  '-': 'path_horizontal',
  '|': 'path_vertical',
  '+': 'path_cross',
  '/': 'path_corner_br',  // / 形状：左上 → 右下
  '\\': 'path_corner_bl', // \ 形状：右上 → 左下
  ':': 'path_horizontal',
};

/**
 * 示例地图（小鎮）
 */
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
~~~~~~~~~#.................................................+++++++++++++++++++++++++++++++...........#~~~~~~~~~
~~~~~~~~~#.................................................+++++++++++++++++++++++++++++++...........#~~~~~~~~~
~~~~~~~~~#.................................................+++++++++++++++++++++++++++++++...........#~~~~~~~~~
~~~~~~~~~####################################................+++++++++++++++++++++++++++++++...........#######
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
`;

/**
 * 解析地图字符串
 */
export function parseMapString(mapString: string): TileMapData {
  const lines = mapString
    .split('\n')
    .filter((l) => l.length > 0)
    .map((l) => l.trim());

  return lines.map((line) =>
    line.split('').map((char): TileType => {
      return CHAR_MAP[char] ?? 'grass';
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

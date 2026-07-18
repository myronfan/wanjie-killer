/**
 * NPC 配置 - 抄袭并改造自 RemyFinn/AI-Town/src/game/content/npcs.ts
 *
 * 修改点：
 * - 角色换成网文角色（保留 RemyFinn 的字段结构）
 * - 新增网文人设（title/personality）
 * - 新增 wander 行为
 */

import { WORLD_CONFIG, NPC_FOOTPRINT, type RectObstacle } from './worldConfig';

export interface NpcDefinition {
  id: string;
  name: string;
  title: string;
  spriteKey: string;
  initialPosition: { x: number; y: number };
  moveSpeed: number;
  wander: {
    enabled: boolean;
    range: number;
    intervalMinMs: number;
    intervalMaxMs: number;
  };
  defaultAnimation: 'idle' | 'walk_down' | 'walk_left' | 'walk_right' | 'walk_up';
  /** 网文人设（扩展字段） */
  personality?: string;
  greeting?: string;
}

/**
 * 3 个网文角色 NPC
 *
 * 注意：NPC 出生位置必须不在 obstacle 内！
 */
export const NPC_DEFINITIONS: NpcDefinition[] = [
  {
    id: 'lindong',
    name: '林动',
    title: '武者',
    spriteKey: 'npc-lindong',
    initialPosition: { x: 130, y: 220 },
    moveSpeed: 50,
    wander: {
      enabled: true,
      range: 120,
      intervalMinMs: 3000,
      intervalMaxMs: 8000,
    },
    defaultAnimation: 'idle',
    personality: '坚韧不拔，重情重义，不服输',
    greeting: '嘿，我叫林动，有什么需要帮忙的吗？',
  },
  {
    id: 'xiaoyan',
    name: '萧炎',
    title: '炼药师',
    spriteKey: 'npc-xiaoyan',
    initialPosition: { x: 1000, y: 230 },
    moveSpeed: 40,
    wander: {
      enabled: true,
      range: 120,
      intervalMinMs: 3000,
      intervalMaxMs: 8000,
    },
    defaultAnimation: 'idle',
    personality: '冷静沉着，专注于炼药和修炼',
    greeting: '你好，我是萧炎。有什么事？',
  },
  {
    id: 'wangwu',
    name: '王五',
    title: 'UI 设计师',
    spriteKey: 'npc-wangwu',
    initialPosition: { x: 320, y: 580 },
    moveSpeed: 0,
    wander: {
      enabled: false,
      range: 0,
      intervalMinMs: 6000,
      intervalMaxMs: 10000,
    },
    defaultAnimation: 'idle',
    personality: '细腻敏感，注重美感',
    greeting: '嗨，我是王五。要不要来杯咖啡？',
  },
];

export const NPC_DEFINITIONS_BY_ID = Object.fromEntries(
  NPC_DEFINITIONS.map((npc) => [npc.id, npc]),
) as Record<string, NpcDefinition>;

export const NPC_FOOTPRINT_SIZE = NPC_FOOTPRINT;

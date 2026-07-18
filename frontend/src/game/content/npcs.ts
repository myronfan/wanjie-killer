/**
 * NPC 配置 - 抄袭并改造自 helloagents-ai-town-phaser/src/game/content/npcs.ts
 *
 * 改造点：
 * - 角色换成网文角色（保留原字段结构）
 * - 新增网文人设（personality / greeting）
 * - 新增 spriteColor 用于程序化绘制
 */

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
  defaultAnimation: "idle" | "default";
  /** 程序化绘制配置 */
  appearance: {
    skinColor: number;
    hairColor: number;
    shirtColor: number;
    pantsColor: number;
  };
  /** 网文人设 */
  personality?: string;
  greeting?: string;
}

export const NPC_DEFINITIONS: NpcDefinition[] = [
  {
    id: "lindong",
    name: "林动",
    title: "武者",
    spriteKey: "npc-lindong",
    initialPosition: { x: 230, y: 220 },
    moveSpeed: 50,
    wander: {
      enabled: true,
      range: 120,
      intervalMinMs: 3000,
      intervalMaxMs: 8000,
    },
    defaultAnimation: "idle",
    appearance: {
      skinColor: 0xe8b796,
      hairColor: 0x1a130e,
      shirtColor: 0x8e44ad,
      pantsColor: 0x383838,
    },
    personality: "坚韧不拔，重情重义，不服输",
    greeting: "嘿，我叫林动，有什么需要帮忙的吗？",
  },
  {
    id: "xiaoyan",
    name: "萧炎",
    title: "炼药师",
    spriteKey: "npc-xiaoyan",
    initialPosition: { x: 1000, y: 230 },
    moveSpeed: 40,
    wander: {
      enabled: true,
      range: 120,
      intervalMinMs: 3000,
      intervalMaxMs: 8000,
    },
    defaultAnimation: "idle",
    appearance: {
      skinColor: 0xffe0bd,
      hairColor: 0x1a130e,
      shirtColor: 0xc0392b,
      pantsColor: 0x383838,
    },
    personality: "冷静沉着，专注于炼药和修炼",
    greeting: "你好，我是萧炎。有什么事？",
  },
  {
    id: "wangwu",
    name: "王五",
    title: "UI 设计师",
    spriteKey: "npc-wangwu",
    initialPosition: { x: 320, y: 580 },
    moveSpeed: 0,
    wander: {
      enabled: false,
      range: 0,
      intervalMinMs: 6000,
      intervalMaxMs: 10000,
    },
    defaultAnimation: "idle",
    appearance: {
      skinColor: 0xf5c6a0,
      hairColor: 0x653c20,
      shirtColor: 0x4a9a4a,
      pantsColor: 0x4a235a,
    },
    personality: "细腻敏感，注重美感",
    greeting: "嗨，我是王五。要不要来杯咖啡？",
  },
];

export const NPC_DEFINITIONS_BY_ID = Object.fromEntries(
  NPC_DEFINITIONS.map((npc) => [npc.id, npc]),
) as Record<string, NpcDefinition>;

export const NPC_DEFINITIONS_BY_NAME = Object.fromEntries(
  NPC_DEFINITIONS.map((npc) => [npc.name, npc]),
) as Record<string, NpcDefinition>;

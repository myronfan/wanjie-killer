/**
 * 资源清单 - 改造自 helloagents-ai-town-phaser/src/game/assets/manifest.ts
 *
 * 改造点：
 * - 删除所有外部 sprite 引用（我们用程序化绘制）
 * - 删除音频（不需要）
 * - 保留 ActorAnimationKey 类型
 */

export type ActorAnimationKey =
  | "idle"
  | "walk_down"
  | "walk_left"
  | "walk_right"
  | "walk_up"
  | "default";

export interface ActorSpriteDefinition {
  key: string;
  textureKey: string;
  defaultAnimation: ActorAnimationKey;
}

export const ACTOR_SPRITES: Record<string, ActorSpriteDefinition> = {
  player: {
    key: "player",
    textureKey: "actor-player",
    defaultAnimation: "idle",
  },
};

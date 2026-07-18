/**
 * 场景桥接器 - 把 Simulation 状态同步到 Phaser 视图
 *
 * 改造自 helloagents-ai-town-phaser/src/phaser/adapters/sceneBridge.ts
 *
 * 简化点：删除复杂的 bubble layout 缩放，保留核心同步逻辑
 */

import Phaser from "phaser";

import { TownSimulation } from "../../game/simulation/systems/TownSimulation";
import type { NPCState, PlayerState } from "../../game/simulation/state";
import {
  createCharacterVisual,
  redrawCharacter,
  setSelected,
  positionVisual,
  type CharacterLook,
  type CharacterVisual,
} from "../view/sprites/characterRender";

const PLAYER_LOOK: CharacterLook = {
  skinColor: 0xffe0bd,
  hairColor: 0x3a2e25,
  shirtColor: 0x5baee0,
  pantsColor: 0x383838,
};

export interface ActorView {
  visual: CharacterVisual;
  facing: "up" | "down" | "left" | "right";
  frame: number;
}

export class TownSceneBridge {
  private readonly scene: Phaser.Scene;
  private readonly simulation: TownSimulation;
  private readonly playerView: ActorView;
  private readonly npcViews: Record<string, ActorView>;
  private frame = 0;

  constructor(
    scene: Phaser.Scene,
    simulation: TownSimulation,
    playerView: ActorView,
    npcViews: Record<string, ActorView>,
  ) {
    this.scene = scene;
    this.simulation = simulation;
    this.playerView = playerView;
    this.npcViews = npcViews;
  }

  render(deltaMs: number): void {
    this.frame = (this.frame + Math.floor(deltaMs / 175)) % 4;

    const state = this.simulation.getState();

    // 玩家
    this.updatePlayer(state.player);

    // NPCs
    for (const npc of Object.values(state.npcs)) {
      this.updateNpc(npc, state.time, state.player.nearbyNpcId === npc.id);
    }
  }

  private updatePlayer(player: PlayerState): void {
    const v = this.playerView;
    positionVisual(v.visual, player.position);
    v.visual.container.setDepth(player.position.y);

    if (v.facing !== player.facing) {
      v.facing = player.facing;
    }

    redrawCharacter(
      v.visual,
      PLAYER_LOOK,
      v.facing,
      player.animation,
      this.frame,
    );

    setSelected(v.visual, false);
  }

  private updateNpc(npc: NPCState, gameTime: number, isHighlighted: boolean): void {
    const v = this.npcViews[npc.id];
    positionVisual(v.visual, npc.position);
    v.visual.container.setDepth(npc.position.y);

    v.facing = npc.facing;
    redrawCharacter(
      v.visual,
      npc.appearance,
      v.facing,
      npc.animation,
      this.frame,
    );

    setSelected(v.visual, isHighlighted);

    // 对话气泡
    const showDialogue =
      npc.currentDialogue !== "" && npc.dialogueVisibleUntil > gameTime;
    v.visual.dialogueBubble.setVisible(showDialogue);
    if (showDialogue) {
      v.visual.dialogueBubble.setPosition(npc.position.x, npc.position.y - 60);
      v.visual.dialogueBubble.setDepth(npc.position.y + 1000);
      v.visual.dialogueLabel.setText(npc.currentDialogue);

      // 重绘气泡背景
      const bg = v.visual.dialogueBubble.list[0] as Phaser.GameObjects.Graphics;
      bg.clear();
      const w = v.visual.dialogueLabel.displayWidth + 12;
      const h = v.visual.dialogueLabel.displayHeight + 8;
      bg.fillStyle(0x162d4a, 0.92);
      bg.lineStyle(1, isHighlighted ? 0xf8d482 : 0x9fc9ff, 0.72);
      bg.fillRoundedRect(-w / 2, -h, w, h, 6);
      bg.strokeRoundedRect(-w / 2, -h, w, h, 6);
      bg.lineStyle(0, 0x000000, 0);
    }
  }
}

/** 创建玩家视图（独立函数） */
export function createPlayerView(
  scene: Phaser.Scene,
  name: string,
): ActorView {
  const visual = createCharacterVisual(scene, name, PLAYER_LOOK);
  return { visual, facing: "down", frame: 0 };
}

/** 创建 NPC 视图（独立函数） */
export function createNpcView(
  scene: Phaser.Scene,
  name: string,
  look: CharacterLook,
): ActorView {
  const visual = createCharacterVisual(scene, name, look);
  return { visual, facing: "down", frame: 0 };
}

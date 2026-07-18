/**
 * 主场景 - 改造自 helloagents-ai-town-phaser/src/phaser/scenes/TownScene.ts
 *
 * 改造点：
 * - 删除音频（不需要）
 * - sprite 用程序化绘制替代
 * - 背景用程序化绘制替代
 */

import Phaser from "phaser";

import { WORLD_CONFIG } from "../../game/content/world";
import { NPC_DEFINITIONS } from "../../game/content/npcs";
import { TownSimulation } from "../../game/simulation/systems/TownSimulation";
import { KeyboardBindings } from "../../game/input/bindings";
import {
  TownSceneBridge,
  createPlayerView,
  createNpcView,
  type ActorView,
} from "../adapters/sceneBridge";
import { configureFollowCamera } from "../view/camera/followCamera";
import { buildWorld } from "../view/worldRender";

export class TownScene extends Phaser.Scene {
  private readonly simulation: TownSimulation;
  private bindings?: KeyboardBindings;
  private bridge?: TownSceneBridge;
  private playerView?: ActorView;

  constructor(simulation: TownSimulation) {
    super("TownScene");
    this.simulation = simulation;
  }

  create(): void {
    // 世界
    buildWorld(this);

    // 玩家
    const state = this.simulation.getState();
    this.playerView = createPlayerView(this, "你");

    // NPCs
    const npcViews: Record<string, ActorView> = {};
    for (const def of NPC_DEFINITIONS) {
      const npcState = state.npcs[def.id];
      const view = createNpcView(
        this,
        def.name,
        def.appearance,
      );
      view.visual.container.setPosition(npcState.position.x, npcState.position.y);
      npcViews[def.id] = view;
    }

    // 桥接
    this.bridge = new TownSceneBridge(
      this,
      this.simulation,
      this.playerView,
      npcViews,
    );

    // 输入
    this.bindings = new KeyboardBindings(this);

    // 摄像机
    configureFollowCamera(
      this,
      this.playerView.visual.container,
      WORLD_CONFIG.width,
      WORLD_CONFIG.height,
      WORLD_CONFIG.cameraZoom,
    );
  }

  update(_time: number, delta: number): void {
    if (!this.bindings || !this.bridge) return;

    if (this.bindings.consumeClosePressed()) {
      this.simulation.closeDialogue();
    }

    const dialogueWasOpen = this.simulation.getState().dialogue.open;

    if (this.bindings.consumeInteractPressed()) {
      this.simulation.startDialogueWithNearbyNpc();
    }

    this.simulation.setMoveIntent(this.bindings.readMoveIntent());
    this.simulation.setRunMultiplier(this.bindings.isRunning() ? 1.7 : 1);
    this.simulation.update(delta);
    this.bridge.render(delta);

    const dialogueIsOpen = this.simulation.getState().dialogue.open;
    if (!dialogueWasOpen && dialogueIsOpen) {
      // 互动音效（已删除）
    }
  }
}

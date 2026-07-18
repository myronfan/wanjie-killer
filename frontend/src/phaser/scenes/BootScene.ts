/**
 * 启动场景 - 改造自 helloagents-ai-town-phaser/src/phaser/scenes/BootScene.ts
 *
 * 改造点：
 * - 删除所有 load.image/load.audio（程序化绘制）
 * - 立刻跳转到 TownScene
 */

import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create(): void {
    this.scene.start("TownScene");
  }
}

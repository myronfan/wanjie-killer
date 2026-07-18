/**
 * 键盘绑定 - 简化版 helloagents-ai-town-phaser/src/game/input/bindings.ts
 *
 * 简化点：移除触摸控制（保留桌面键盘）
 */

import * as Phaser from "phaser";

import { NO_MOVE_INTENT, isTypingIntoField, type MoveIntent } from "./actions";

export class KeyboardBindings {
  private readonly scene: Phaser.Scene;
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly wasd: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private readonly interact: Phaser.Input.Keyboard.Key;
  private readonly confirm: Phaser.Input.Keyboard.Key;
  private readonly close: Phaser.Input.Keyboard.Key;
  private readonly run: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.wasd = {
      up: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.interact = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.confirm = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.close = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.run = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
  }

  readMoveIntent(): MoveIntent {
    if (isTypingIntoField()) {
      return NO_MOVE_INTENT;
    }

    let x = 0;
    let y = 0;

    if (this.cursors.left.isDown || this.wasd.left.isDown) x -= 1;
    if (this.cursors.right.isDown || this.wasd.right.isDown) x += 1;
    if (this.cursors.up.isDown || this.wasd.up.isDown) y -= 1;
    if (this.cursors.down.isDown || this.wasd.down.isDown) y += 1;

    if (x === 0 && y === 0) {
      return NO_MOVE_INTENT;
    }

    return { x, y };
  }

  isRunning(): boolean {
    return this.run.isDown;
  }

  consumeInteractPressed(): boolean {
    if (isTypingIntoField()) {
      return false;
    }
    return (
      Phaser.Input.Keyboard.JustDown(this.interact) ||
      Phaser.Input.Keyboard.JustDown(this.confirm)
    );
  }

  consumeClosePressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.close);
  }
}

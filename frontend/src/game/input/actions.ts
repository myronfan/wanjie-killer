/**
 * 输入动作 - 照抄 helloagents-ai-town-phaser/src/game/input/actions.ts
 */

export interface MoveIntent {
  x: number;
  y: number;
}

export const NO_MOVE_INTENT: MoveIntent = { x: 0, y: 0 };

export const isTypingIntoField = (): boolean => {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) {
    return false;
  }

  const tag = active.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") {
    return true;
  }

  return active.isContentEditable;
};

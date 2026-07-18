/**
 * HUD（DOM 模式） - 改造自 helloagents-ai-town-phaser/src/ui/hud/domHud.ts
 *
 * 改造点：
 * - 简化为 React 不友好的纯 DOM API（vanilla DOM + CSS）
 * - 显示：时间、玩家坐标、最近 NPC 名册、对话面板
 */

import { NPC_DEFINITIONS } from "../../game/content/npcs";
import { TownSimulation } from "../../game/simulation/systems/TownSimulation";
import type { DialogueMessage } from "../../game/simulation/state";

export interface HudHandles {
  root: HTMLElement;
  destroy: () => void;
}

export function createHud(
  parent: HTMLElement,
  simulation: TownSimulation,
): HudHandles {
  const root = document.createElement("div");
  root.className = "hud";
  root.innerHTML = `
    <div class="hud-top">
      <div class="hud-title">
        <span class="hud-title-icon">⚔</span>
        <span>完结杀手</span>
        <span class="hud-version">v0.3-Phaser迁移</span>
      </div>
      <div class="hud-time">
        <span id="hud-time-text">第1天 06:00</span>
      </div>
      <div class="hud-coord">
        <span id="hud-coord-text">位置 (0, 0)</span>
      </div>
    </div>

    <div class="hud-npcs" id="hud-npcs"></div>

    <div class="hud-hint">
      <kbd>WASD</kbd> / <kbd>↑↓←→</kbd> 移动 ·
      <kbd>Shift</kbd> 加速 ·
      <kbd>E</kbd> / <kbd>Enter</kbd> 互动 ·
      <kbd>Esc</kbd> 关闭对话
    </div>

    <div class="hud-dialogue" id="hud-dialogue" style="display:none">
      <div class="hud-dialogue-header">
        <span id="hud-dialogue-name"></span>
        <span id="hud-dialogue-personality" class="hud-dialogue-personality"></span>
        <button class="hud-dialogue-close" id="hud-dialogue-close">×</button>
      </div>
      <div class="hud-dialogue-messages" id="hud-dialogue-messages"></div>
      <form class="hud-dialogue-input" id="hud-dialogue-form">
        <input
          type="text"
          id="hud-dialogue-input-field"
          placeholder="说点什么…"
          autocomplete="off"
        />
        <button type="submit" id="hud-dialogue-send">发送</button>
      </form>
    </div>
  `;
  parent.appendChild(root);

  const timeText = root.querySelector<HTMLSpanElement>("#hud-time-text");
  const coordText = root.querySelector<HTMLSpanElement>("#hud-coord-text");
  const npcsContainer = root.querySelector<HTMLDivElement>("#hud-npcs");
  const dialogue = root.querySelector<HTMLDivElement>("#hud-dialogue");
  const dialogueName = root.querySelector<HTMLSpanElement>("#hud-dialogue-name");
  const dialoguePersonality = root.querySelector<HTMLSpanElement>("#hud-dialogue-personality");
  const dialogueClose = root.querySelector<HTMLButtonElement>("#hud-dialogue-close");
  const dialogueMessages = root.querySelector<HTMLDivElement>("#hud-dialogue-messages");
  const dialogueForm = root.querySelector<HTMLFormElement>("#hud-dialogue-form");
  const dialogueInput = root.querySelector<HTMLInputElement>("#hud-dialogue-input-field");

  // NPC 名册
  for (const npc of NPC_DEFINITIONS) {
    const btn = document.createElement("button");
    btn.className = "hud-npc-btn";
    btn.dataset.npcId = npc.id;
    btn.innerHTML = `
      <span class="hud-npc-name">${npc.name}</span>
      <span class="hud-npc-title">${npc.title}</span>
    `;
    btn.addEventListener("click", () => {
      simulation.openDialogue(npc.id);
    });
    npcsContainer!.appendChild(btn);
  }

  // 对话关闭
  dialogueClose!.addEventListener("click", () => simulation.closeDialogue());

  // 对话发送
  dialogueForm!.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = dialogueInput!.value;
    if (!text.trim()) return;
    void simulation.sendMessage(text);
    dialogueInput!.value = "";
  });

  // 订阅 simulation 更新
  let lastTime = 0;
  const unsubscribe = simulation.subscribe(() => {
    const state = simulation.getState();

    // 时间（简单的游戏内时钟）
    const totalSeconds = state.time / 1000;
    const day = Math.floor(totalSeconds / 600) + 1;
    const inDaySeconds = totalSeconds % 600;
    const hours = Math.floor(inDaySeconds / 25) + 6;
    const mins = Math.floor((inDaySeconds % 25) * 2.4);
    if (timeText) {
      timeText.textContent = `第${day}天 ${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
    }

    // 坐标
    if (coordText) {
      coordText.textContent = `位置 (${Math.round(state.player.position.x)}, ${Math.round(state.player.position.y)})`;
    }

    // NPC 名册高亮
    const nearbyId = state.player.nearbyNpcId;
    npcsContainer!.querySelectorAll<HTMLButtonElement>(".hud-npc-btn").forEach((btn) => {
      btn.classList.toggle("is-nearby", btn.dataset.npcId === nearbyId);
    });

    // 对话框
    if (state.dialogue.open && state.dialogue.npcId) {
      dialogue!.style.display = "flex";
      const npc = state.npcs[state.dialogue.npcId];
      if (dialogueName) dialogueName.textContent = `${npc.name} · ${npc.title}`;
      if (dialoguePersonality) dialoguePersonality.textContent = npc.personality ?? "";

      // 滚动到底部
      const messagesEl = dialogueMessages!;
      messagesEl.innerHTML = "";
      for (const msg of state.dialogue.messages) {
        if (msg.npcId !== state.dialogue.npcId) continue;
        const div = document.createElement("div");
        div.className = `hud-msg hud-msg-${msg.speaker}`;
        const speakerLabel =
          msg.speaker === "player" ? "你" :
          msg.speaker === "npc" ? npc.name :
          "系统";
        div.innerHTML = `<span class="hud-msg-speaker">${speakerLabel}</span> ${escapeHtml(msg.text)}`;
        messagesEl.appendChild(div);
      }
      messagesEl.scrollTop = messagesEl.scrollHeight;
      lastTime = state.time;

      // 自动聚焦输入框
      if (document.activeElement !== dialogueInput) {
        // 不抢焦点（避免和游戏操作冲突）
      }
    } else {
      dialogue!.style.display = "none";
    }
  });

  return {
    root,
    destroy: () => {
      unsubscribe();
      root.remove();
    },
  };
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

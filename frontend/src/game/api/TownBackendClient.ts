/**
 * 后端 API 客户端 - 改造自 helloagents-ai-town-phaser/src/game/api/TownBackendClient.ts
 *
 * 简化点：
 * - 删掉真实 HTTP 调用
 * - 保留 apiBaseUrl / usingFallback 接口
 * - 提供本地模拟的 NPC status / dialogue
 */

import type { Vector2 } from "../simulation/state";

export interface NpcStatusPayload {
  id: string;
  currentAction: string;
  emotion: string;
  position: Vector2;
}

export interface NpcDialogueResponse {
  npcId: string;
  reply: string;
  emotion: string;
}

export class TownBackendClient {
  public readonly apiBaseUrl: string;

  constructor(apiBaseUrl = "/api") {
    this.apiBaseUrl = apiBaseUrl;
  }

  /**
   * 获取 NPC 当前状态（模拟 - 永远返回正常）
   */
  async fetchNpcStatuses(): Promise<NpcStatusPayload[]> {
    // TODO: 接入 MiniMax API
    return [];
  }

  /**
   * 发送对话并获取回复（模拟 - 返回固定话术）
   */
  async sendDialogue(
    npcId: string,
    message: string,
    npcName: string,
    npcGreeting: string | undefined,
  ): Promise<NpcDialogueResponse> {
    // TODO: 接入 MiniMax API
    const replies = [
      `嗯，让我想想……${message.length > 0 ? "你说的" + message.slice(0, 8) + "…" : "你好"}`,
      `${npcName}：我听到了。`,
      `${npcName}：有意思。`,
      `${npcName}：${npcGreeting ?? "你好"}`,
    ];
    return {
      npcId,
      reply: replies[Math.floor(Math.random() * replies.length)],
      emotion: "neutral",
    };
  }
}

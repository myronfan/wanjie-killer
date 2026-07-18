/**
 * 核心 simulation - 照抄 helloagents-ai-town-phaser/src/game/simulation/systems/TownSimulation.ts
 *
 * 修改点：
 * - 删除 HTTP 调用相关（用模拟）
 * - 删除 sendMessage 的 LLM 调用
 * - 保留所有移动/碰撞/wander/对话状态管理
 */

import { WORLD_CONFIG, type RectObstacle } from "../../content/world";
import { NPC_DEFINITIONS, type NpcDefinition } from "../../content/npcs";
import type { MoveIntent } from "../../input/actions";
import type { ActorAnimationKey } from "../../assets/manifest";
import { TownBackendClient } from "../../api/TownBackendClient";
import type {
  DialogueMessage,
  FacingDirection,
  NPCState,
  TownGameState,
  Vector2,
} from "../state";

type Listener = () => void;

interface Footprint {
  width: number;
  height: number;
}

interface AxisRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ZERO_VECTOR: Vector2 = { x: 0, y: 0 };

const normalize = (vector: MoveIntent): Vector2 => {
  const length = Math.hypot(vector.x, vector.y);
  if (length === 0) return ZERO_VECTOR;
  return { x: vector.x / length, y: vector.y / length };
};

const cloneVector = (vector: Vector2): Vector2 => ({ x: vector.x, y: vector.y });

const randomBetween = (min: number, max: number): number =>
  min + Math.random() * (max - min);

const distance = (from: Vector2, to: Vector2): number =>
  Math.hypot(from.x - to.x, from.y - to.y);

export class TownSimulation {
  private readonly backendClient: TownBackendClient;
  private readonly listeners = new Set<Listener>();
  private readonly state: TownGameState;
  private moveIntent: MoveIntent = ZERO_VECTOR;
  private runMultiplier = 1;
  private statusRequestInFlight = false;
  private messageSequence = 0;
  private lastCountdownSeconds = -1;

  constructor(backendClient = new TownBackendClient()) {
    this.backendClient = backendClient;
    this.state = {
      time: 0,
      player: {
        position: cloneVector(WORLD_CONFIG.playerSpawn),
        velocity: ZERO_VECTOR,
        facing: "down",
        animation: "idle",
        nearbyNpcId: null,
        nearbyInteractionId: null,
        isInteracting: false,
      },
      npcs: Object.fromEntries(
        NPC_DEFINITIONS.map((npc) => [npc.id, this.createNpcState(npc)]),
      ) as TownGameState["npcs"],
      dialogue: { open: false, npcId: null, sending: false, messages: [] },
      backend: {
        apiBaseUrl: this.backendClient.apiBaseUrl,
        connected: false,
        usingFallback: true,
        lastError: null,
        nextStatusRefreshAt: 0,
        lastStatusUpdateAt: null,
      },
    };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async initialize(): Promise<void> {
    if (this.state.backend.lastStatusUpdateAt !== null) return;
    await this.refreshNpcStatuses();
    this.notify();
  }

  getState(): TownGameState {
    return this.state;
  }

  setMoveIntent(intent: MoveIntent): void {
    this.moveIntent = intent;
  }

  setRunMultiplier(multiplier: number): void {
    this.runMultiplier = multiplier;
  }

  update(deltaMs: number): void {
    this.state.time += deltaMs;

    this.updatePlayer(deltaMs);
    this.updateNpcs(deltaMs);

    const nearbyChanged = this.refreshNearbyNpc() || this.refreshNearbyInteraction();
    const countdownSeconds = Math.max(
      0,
      Math.ceil((this.state.backend.nextStatusRefreshAt - this.state.time) / 1000),
    );

    if (
      this.state.time >= this.state.backend.nextStatusRefreshAt &&
      !this.statusRequestInFlight
    ) {
      void this.refreshNpcStatuses();
    }

    if (nearbyChanged || countdownSeconds !== this.lastCountdownSeconds) {
      this.lastCountdownSeconds = countdownSeconds;
      this.notify();
    }
  }

  startDialogueWithNearbyNpc(): void {
    const npcId = this.state.player.nearbyNpcId;
    if (!npcId) return;
    this.openDialogue(npcId);
  }

  openDialogue(npcId: string): void {
    if (!this.state.npcs[npcId]) return;
    if (this.state.dialogue.open && this.state.dialogue.npcId === npcId) return;

    if (this.state.dialogue.open && this.state.dialogue.npcId) {
      this.state.npcs[this.state.dialogue.npcId].isInteracting = false;
    }

    this.state.dialogue.open = true;
    this.state.dialogue.npcId = npcId;
    this.state.dialogue.sending = false;
    this.state.player.isInteracting = true;
    this.state.player.velocity = ZERO_VECTOR;
    this.state.player.animation = "idle";
    this.state.npcs[npcId].isInteracting = true;

    const npc = this.state.npcs[npcId];
    if (npc.greeting && !this.hasDialogueHistory(npcId)) {
      this.pushMessage("system", npcId, `与 ${npc.name} 的对话开始。`);
      this.pushMessage("npc", npcId, npc.greeting);
    }

    this.notify();
  }

  closeDialogue(): void {
    if (this.state.dialogue.npcId) {
      this.state.npcs[this.state.dialogue.npcId].isInteracting = false;
    }
    this.state.dialogue.open = false;
    this.state.dialogue.npcId = null;
    this.state.dialogue.sending = false;
    this.state.player.isInteracting = false;
    this.notify();
  }

  async sendMessage(rawMessage: string): Promise<void> {
    const npcId = this.state.dialogue.npcId;
    if (!npcId || this.state.dialogue.sending) return;

    const message = rawMessage.trim();
    if (!message) return;

    this.state.dialogue.sending = true;
    this.pushMessage("player", npcId, message);
    this.notify();

    const npc = this.state.npcs[npcId];
    try {
      const response = await this.backendClient.sendDialogue(
        npcId,
        message,
        npc.name,
        npc.greeting,
      );
      this.pushMessage("npc", npcId, response.reply);
      npc.currentDialogue = response.reply;
      npc.dialogueVisibleUntil = this.state.time + Number(WORLD_CONFIG.dialogueBubbleDurationMs);
    } catch (error) {
      this.pushMessage("system", npcId, `（对话出错：${String(error)}）`);
    } finally {
      this.state.dialogue.sending = false;
      this.notify();
    }
  }

  private createNpcState(npc: NpcDefinition): NPCState {
    return {
      id: npc.id,
      name: npc.name,
      title: npc.title,
      spriteKey: npc.spriteKey,
      position: cloneVector(npc.initialPosition),
      velocity: ZERO_VECTOR,
      spawnPosition: cloneVector(npc.initialPosition),
      facing: "down",
      animation: "idle",
      moveSpeed: npc.moveSpeed,
      wanderEnabled: npc.wander.enabled,
      wanderRange: npc.wander.range,
      wanderIntervalMinMs: npc.wander.intervalMinMs,
      wanderIntervalMaxMs: npc.wander.intervalMaxMs,
      wanderCooldownMs: 0,
      wanderTarget: null,
      currentDialogue: "",
      dialogueVisibleUntil: 0,
      defaultAnimation: npc.defaultAnimation,
      isInteracting: false,
      appearance: npc.appearance,
      personality: npc.personality,
      greeting: npc.greeting,
    };
  }

  private updatePlayer(deltaMs: number): void {
    const player = this.state.player;
    if (player.isInteracting) {
      player.velocity = ZERO_VECTOR;
      player.animation = "idle";
      return;
    }

    const intent = normalize(this.moveIntent);
    const speed = WORLD_CONFIG.playerSpeed * this.runMultiplier;
    player.velocity = { x: intent.x * speed, y: intent.y * speed };

    const movement = {
      x: (player.velocity.x * deltaMs) / 1000,
      y: (player.velocity.y * deltaMs) / 1000,
    };

    const next = this.resolveMovement("player", player.position, movement, WORLD_CONFIG.playerFootprint);
    player.position = next;

    if (Math.abs(intent.x) > 0.001 || Math.abs(intent.y) > 0.001) {
      player.facing = this.getFacingFromVector(intent);
      player.animation = `walk_${player.facing}` as ActorAnimationKey;
    } else {
      player.animation = "idle";
    }
  }

  private updateNpcs(deltaMs: number): void {
    for (const npc of Object.values(this.state.npcs)) {
      if (npc.isInteracting) {
        npc.velocity = ZERO_VECTOR;
        npc.animation = "idle";
        continue;
      }

      npc.wanderCooldownMs = Math.max(0, npc.wanderCooldownMs - deltaMs);

      if (!npc.wanderEnabled) {
        npc.velocity = ZERO_VECTOR;
        npc.animation = "idle";
        continue;
      }

      if (!npc.wanderTarget) {
        if (npc.wanderCooldownMs <= 0) {
          npc.wanderTarget = this.pickWanderTarget(npc);
          if (npc.wanderTarget) {
            npc.wanderCooldownMs = randomBetween(
              npc.wanderIntervalMinMs,
              npc.wanderIntervalMaxMs,
            );
          } else {
            npc.wanderCooldownMs = 1000;
          }
        } else {
          npc.velocity = ZERO_VECTOR;
          npc.animation = "idle";
          continue;
        }
      }

      if (npc.wanderTarget) {
        const dx = npc.wanderTarget.x - npc.position.x;
        const dy = npc.wanderTarget.y - npc.position.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 4) {
          npc.wanderTarget = null;
          npc.velocity = ZERO_VECTOR;
          npc.animation = "idle";
          continue;
        }

        const stepDistance = (npc.moveSpeed * deltaMs) / 1000;
        const step = Math.min(stepDistance, dist);
        const movement = {
          x: (dx / dist) * step,
          y: (dy / dist) * step,
        };
        npc.position = this.resolveMovement(npc.id, npc.position, movement, WORLD_CONFIG.npcFootprint);
        npc.facing = this.getFacingFromVector({ x: dx, y: dy });
        npc.velocity = { x: (dx / dist) * npc.moveSpeed, y: (dy / dist) * npc.moveSpeed };
        npc.animation = `walk_${npc.facing}` as ActorAnimationKey;
      }
    }
  }

  private resolveMovement(
    actorId: string,
    position: Vector2,
    movement: Vector2,
    footprint: Footprint,
  ): Vector2 {
    const movedX = this.resolveAxis(actorId, position, movement.x, footprint, "x");
    const movedY = this.resolveAxis(
      actorId,
      { x: movedX, y: position.y },
      movement.y,
      footprint,
      "y",
    );
    return { x: movedX, y: movedY };
  }

  private resolveAxis(
    actorId: string,
    position: Vector2,
    delta: number,
    footprint: Footprint,
    axis: "x" | "y",
  ): number {
    let next = position[axis] + delta;

    if (axis === "x") {
      next = Math.min(Math.max(next, footprint.width / 2), WORLD_CONFIG.width - footprint.width / 2);
    } else {
      next = Math.min(Math.max(next, footprint.height), WORLD_CONFIG.height);
    }

    const candidatePosition = axis === "x"
      ? { x: next, y: position.y }
      : { x: position.x, y: next };

    for (const obstacle of this.getBlockingRects(actorId, footprint)) {
      const actorRect = this.getFootprintRect(candidatePosition, footprint);
      if (!this.rectanglesOverlap(actorRect, obstacle)) continue;

      if (axis === "x") {
        if (delta > 0) next = Math.min(next, obstacle.x - footprint.width / 2);
        else if (delta < 0) next = Math.max(next, obstacle.x + obstacle.width + footprint.width / 2);
      } else if (delta > 0) {
        next = Math.min(next, obstacle.y);
      } else if (delta < 0) {
        next = Math.max(next, obstacle.y + obstacle.height + footprint.height);
      }
    }

    return next;
  }

  private getBlockingRects(actorId: string, footprint: Footprint): RectObstacle[] {
    const staticObstacles = [...WORLD_CONFIG.obstacles];
    const actorObstacles: RectObstacle[] = [];

    if (actorId !== "player") {
      actorObstacles.push({
        id: "player",
        kind: "wall",
        ...this.getFootprintRect(this.state.player.position, WORLD_CONFIG.playerFootprint),
      });
    }

    for (const npc of Object.values(this.state.npcs)) {
      if (npc.id === actorId) continue;
      actorObstacles.push({
        id: npc.id,
        kind: "wall",
        ...this.getFootprintRect(npc.position, footprint),
      });
    }

    return [...staticObstacles, ...actorObstacles];
  }

  private pickWanderTarget(npc: NPCState): Vector2 | null {
    for (let attempt = 0; attempt < 12; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * npc.wanderRange;
      const candidate = {
        x: npc.spawnPosition.x + Math.cos(angle) * radius,
        y: npc.spawnPosition.y + Math.sin(angle) * radius,
      };
      if (
        this.isWalkable(candidate, npc.id, WORLD_CONFIG.npcFootprint) &&
        distance(candidate, npc.spawnPosition) <= npc.wanderRange
      ) {
        return candidate;
      }
    }
    return null;
  }

  private isWalkable(position: Vector2, actorId: string, footprint: Footprint): boolean {
    if (
      position.x < footprint.width / 2 ||
      position.x > WORLD_CONFIG.width - footprint.width / 2 ||
      position.y < footprint.height ||
      position.y > WORLD_CONFIG.height
    ) {
      return false;
    }
    const rect = this.getFootprintRect(position, footprint);
    return this.getBlockingRects(actorId, footprint).every(
      (obstacle) => !this.rectanglesOverlap(rect, obstacle),
    );
  }

  private getFootprintRect(position: Vector2, footprint: Footprint): AxisRect {
    return {
      x: position.x - footprint.width / 2,
      y: position.y - footprint.height,
      width: footprint.width,
      height: footprint.height,
    };
  }

  private rectanglesOverlap(a: AxisRect, b: AxisRect): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  private getFacingFromVector(vector: Vector2): FacingDirection {
    if (Math.abs(vector.x) > Math.abs(vector.y)) {
      return vector.x >= 0 ? "right" : "left";
    }
    return vector.y >= 0 ? "down" : "up";
  }

  private pushMessage(
    speaker: DialogueMessage["speaker"],
    npcId: string,
    text: string,
  ): void {
    this.messageSequence += 1;
    this.state.dialogue.messages.push({
      id: `${npcId}-${this.messageSequence}`,
      npcId,
      speaker,
      text,
      timestamp: this.state.time,
    });
  }

  private hasDialogueHistory(npcId: string): boolean {
    return this.state.dialogue.messages.some((m) => m.npcId === npcId);
  }

  private async refreshNpcStatuses(): Promise<void> {
    if (this.statusRequestInFlight) return;
    this.statusRequestInFlight = true;
    try {
      // 模拟：暂时不请求
      this.state.backend.connected = true;
      this.state.backend.usingFallback = true;
      this.state.backend.lastStatusUpdateAt = this.state.time;
      this.state.backend.nextStatusRefreshAt =
        this.state.time + WORLD_CONFIG.npcStatusRefreshIntervalMs;
    } finally {
      this.statusRequestInFlight = false;
    }
  }

  private refreshNearbyNpc(): boolean {
    const player = this.state.player;
    let nearestId: string | null = null;
    let nearestDistance: number = WORLD_CONFIG.interactionDistance;

    for (const npc of Object.values(this.state.npcs)) {
      const d = distance(player.position, npc.position);
      if (d < nearestDistance) {
        nearestDistance = d;
        nearestId = npc.id;
      }
    }

    if (player.nearbyNpcId !== nearestId) {
      player.nearbyNpcId = nearestId;
      return true;
    }
    return false;
  }

  private refreshNearbyInteraction(): boolean {
    const player = this.state.player;
    let nearestId: string | null = null;
    const range = WORLD_CONFIG.interactionDistance + 30;

    for (const obstacle of WORLD_CONFIG.obstacles) {
      if (!obstacle.interaction) continue;
      // 计算玩家到 obstacle 中心的距离
      const cx = obstacle.x + obstacle.width / 2;
      const cy = obstacle.y + obstacle.height / 2;
      const d = Math.hypot(player.position.x - cx, player.position.y - cy);
      // 减去障碍半径估算（取宽高较大的一半）
      const r = Math.max(obstacle.width, obstacle.height) / 2;
      if (d - r < range) {
        nearestId = obstacle.id;
        break;
      }
    }

    if (player.nearbyInteractionId !== nearestId) {
      player.nearbyInteractionId = nearestId;
      return true;
    }
    return false;
  }

  /** 获取附近可互动对象的内容 */
  getNearbyInteraction(): { id: string; title: string; body: string } | null {
    const id = this.state.player.nearbyInteractionId;
    if (!id) return null;
    const obstacle = WORLD_CONFIG.obstacles.find((o) => o.id === id);
    if (!obstacle?.interaction) return null;
    return { id: obstacle.id, ...obstacle.interaction };
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }
}

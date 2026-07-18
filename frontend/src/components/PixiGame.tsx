/**
 * Pixi 游戏主组件
 *
 * 重构于 2026-07-19：使用 AABB 碰撞 + worldConfig + NPCs
 * - 移除旧 tile-based 系统
 * - 用 worldRenderer.ts 绘制世界
 * - 用 characterRenderer.ts 绘制玩家 + NPC
 * - 用 collision.ts 做精细 AABB 碰撞
 */

import { useEffect, useRef, useState } from 'react';
import { Application, Container } from 'pixi.js';
import { useKeyboard } from '../hooks/useKeyboard';
import { WORLD_CONFIG, PLAYER_FOOTPRINT, NPC_FOOTPRINT } from '../core/worldConfig';
import { NPC_DEFINITIONS, type NpcDefinition } from '../core/npcsConfig';
import { resolveMovement, distance, isWalkable } from '../core/collision';
import { buildWorld, computeWorldOffset } from '../core/worldRenderer';
import {
  createCharacterVisual,
  redrawCharacter,
  setSelected,
  CHARACTER_SPRITE,
  type CharacterVisual,
  type CharacterLook,
} from '../core/characterRenderer';
import { DIRECTIONS, getDirectionFromKeys, type Direction } from '../core/direction';
import { DEFAULT_ANIMATION, createAnimationState, updateAnimation } from '../core/animation';

const SCREEN_WIDTH = 960;
const SCREEN_HEIGHT = 640;
const INTERACT_RANGE = WORLD_CONFIG.interactionDistance;

export interface PixiGameProps {
  /** 玩家位置变化回调 */
  onPlayerMove?: (x: number, y: number) => void;
}

/** NPC 运行时状态 */
interface NpcState {
  def: NpcDefinition;
  position: { x: number; y: number };
  direction: Direction;
  animation: ReturnType<typeof createAnimationState>;
  wanderTarget: { x: number; y: number } | null;
  nextWanderAt: number;
  visual: CharacterVisual | null;
}

const PLAYER_LOOK: CharacterLook = {
  skinColor: 0xffe0bd,
  hairColor: 0x3a2e25,
  shirtColor: 0x5baee0,
  pantsColor: 0x383838,
  name: '你',
  isPlayer: true,
};

const NPC_LOOKS: Record<string, CharacterLook> = {
  lindong: {
    skinColor: 0xe8b796,
    hairColor: 0x1a130e,
    shirtColor: 0x8e44ad,
    pantsColor: 0x383838,
    name: '林动',
  },
  xiaoyan: {
    skinColor: 0xffe0bd,
    hairColor: 0x1a130e,
    shirtColor: 0xc0392b,
    pantsColor: 0x383838,
    name: '萧炎',
  },
  wangwu: {
    skinColor: 0xf5c6a0,
    hairColor: 0x653c20,
    shirtColor: 0x4a9a4a,
    pantsColor: 0x4a235a,
    name: '王五',
  },
};

function positionVisual(visual: CharacterVisual, pos: { x: number; y: number }): void {
  visual.body.x = pos.x - CHARACTER_SPRITE.width / 2;
  visual.body.y = pos.y - CHARACTER_SPRITE.height;
}

export function PixiGame({ onPlayerMove }: PixiGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const worldRef = useRef<Container | null>(null);
  const playerVisualRef = useRef<CharacterVisual | null>(null);
  const npcStatesRef = useRef<NpcState[]>([]);
  const playerPosRef = useRef<{ x: number; y: number }>({
    x: WORLD_CONFIG.playerSpawn.x,
    y: WORLD_CONFIG.playerSpawn.y,
  });
  const playerDirRef = useRef<Direction>(DIRECTIONS.DOWN);
  const playerAnimRef = useRef(createAnimationState());

  const keys = useKeyboard();
  const keysRef = useRef(keys);
  keysRef.current = keys;

  const onMoveRef = useRef(onPlayerMove);
  onMoveRef.current = onPlayerMove;

  /** UI state：最近 NPC + 选中 NPC */
  const [nearestNpcId, setNearestNpcId] = useState<string | null>(null);
  const [selectedNpcId, setSelectedNpcId] = useState<string | null>(null);
  const selectedNpcIdRef = useRef<string | null>(null);
  selectedNpcIdRef.current = selectedNpcId;

  useEffect(() => {
    if (!containerRef.current) return;

    const app = new Application({
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      backgroundColor: 0x1a1a2e,
      antialias: false,
      resolution: 1,
      autoDensity: false,
    });
    containerRef.current.appendChild(app.view as HTMLCanvasElement);
    appRef.current = app;

    // 世界
    const world = new Container();
    app.stage.addChild(world);
    worldRef.current = world;
    world.addChild(buildWorld());

    // 玩家
    const playerVisual = createCharacterVisual(PLAYER_LOOK);
    world.addChild(playerVisual.body);
    playerVisualRef.current = playerVisual;
    redrawCharacter(
      playerVisual,
      PLAYER_LOOK,
      playerDirRef.current,
      playerAnimRef.current.currentFrame,
      false,
    );
    positionVisual(playerVisual, playerPosRef.current);

    // NPCs
    npcStatesRef.current = NPC_DEFINITIONS.map((def) => {
      const visual = createCharacterVisual(
        NPC_LOOKS[def.id] || {
          skinColor: 0xffe0bd,
          hairColor: 0x1a130e,
          shirtColor: 0x5baee0,
          pantsColor: 0x383838,
          name: def.name,
        },
      );
      world.addChild(visual.body);
      const npcState: NpcState = {
        def,
        position: { ...def.initialPosition },
        direction: DIRECTIONS.DOWN,
        animation: createAnimationState(),
        wanderTarget: null,
        nextWanderAt: performance.now() + 2000 + Math.random() * 3000,
        visual,
      };
      positionVisual(visual, npcState.position);
      return npcState;
    });

    // 初始摄像机
    const offset = computeWorldOffset(
      playerPosRef.current.x,
      playerPosRef.current.y,
      SCREEN_WIDTH,
      SCREEN_HEIGHT,
    );
    world.x = offset.x;
    world.y = offset.y;

    // 主循环
    let raf = 0;
    let lastTimestamp = performance.now();
    const tick = (timestamp: number) => {
      const deltaMs = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      const deltaSec = Math.min(deltaMs / 1000, 0.1);

      updatePlayer(deltaMs, deltaSec);
      updateNpcs(timestamp, deltaMs, deltaSec);
      updateCamera();

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true });
      }
    };
  }, []);

  function updatePlayer(deltaMs: number, deltaSec: number): void {
    const visual = playerVisualRef.current;
    if (!visual) return;

    const keys = keysRef.current;
    const dir = getDirectionFromKeys(keys);
    const isMoving = dir !== null;

    if (dir !== null) {
      playerDirRef.current = dir;
    }

    let movement = { x: 0, y: 0 };
    if (dir !== null) {
      const v = WORLD_CONFIG.playerSpeed * deltaSec;
      if (dir === DIRECTIONS.LEFT) movement.x = -v;
      if (dir === DIRECTIONS.RIGHT) movement.x = v;
      if (dir === DIRECTIONS.UP) movement.y = -v;
      if (dir === DIRECTIONS.DOWN) movement.y = v;
    }

    const oldPos = playerPosRef.current;
    let newPos = resolveMovement(
      oldPos,
      movement,
      PLAYER_FOOTPRINT,
      WORLD_CONFIG.obstacles,
      { width: WORLD_CONFIG.width, height: WORLD_CONFIG.height },
    );

    // 与 NPC 的简易阻挡
    let blocked = false;
    for (const npc of npcStatesRef.current) {
      const dx = newPos.x - npc.position.x;
      const dy = newPos.y - npc.position.y;
      const minDist = (PLAYER_FOOTPRINT.width + NPC_FOOTPRINT.width) / 2;
      if (Math.abs(dx) < minDist && Math.abs(dy) < minDist) {
        blocked = true;
        break;
      }
    }
    if (!blocked) {
      playerPosRef.current = newPos;
    }

    playerAnimRef.current.isMoving = isMoving;
    updateAnimation(playerAnimRef.current, DEFAULT_ANIMATION, deltaMs);
    redrawCharacter(
      visual,
      PLAYER_LOOK,
      playerDirRef.current,
      playerAnimRef.current.currentFrame,
      isMoving,
    );
    positionVisual(visual, playerPosRef.current);

    if (
      onMoveRef.current &&
      (oldPos.x !== playerPosRef.current.x || oldPos.y !== playerPosRef.current.y)
    ) {
      onMoveRef.current(playerPosRef.current.x, playerPosRef.current.y);
    }

    // 找最近 NPC（仅 UI 用，简单地用初始位置估算，足够显示提示）
    let best: { id: string; d: number } | null = null;
    for (const npc of npcStatesRef.current) {
      const d = Math.hypot(
        playerPosRef.current.x - npc.position.x,
        playerPosRef.current.y - npc.position.y,
      );
      if (d < INTERACT_RANGE && (!best || d < best.d)) {
        best = { id: npc.def.id, d };
      }
    }
    const newNearest = best ? best.id : null;
    if (newNearest !== nearestNpcId) {
      // setState in RAF is fine
      setNearestNpcId(newNearest);
    }
  }

  function updateNpcs(now: number, deltaMs: number, deltaSec: number): void {
    for (const npc of npcStatesRef.current) {
      const visual = npc.visual;
      if (!visual) continue;

      let isMoving = false;

      if (npc.def.wander.enabled) {
        const reached =
          npc.wanderTarget && distance(npc.position, npc.wanderTarget) < 4;

        if (!npc.wanderTarget || reached) {
          if (now >= npc.nextWanderAt) {
            const cx = npc.def.initialPosition.x;
            const cy = npc.def.initialPosition.y;
            const range = npc.def.wander.range;
            const tx = cx + (Math.random() * 2 - 1) * range;
            const ty = cy + (Math.random() * 2 - 1) * range;
            if (isWalkable({ x: tx, y: ty }, NPC_FOOTPRINT, WORLD_CONFIG.obstacles, {
              width: WORLD_CONFIG.width,
              height: WORLD_CONFIG.height,
            })) {
              npc.wanderTarget = { x: tx, y: ty };
              npc.nextWanderAt =
                now +
                npc.def.wander.intervalMinMs +
                Math.random() *
                  (npc.def.wander.intervalMaxMs - npc.def.wander.intervalMinMs);
            } else {
              npc.nextWanderAt = now + 1000;
            }
          } else {
            npc.wanderTarget = null;
          }
        }

        if (npc.wanderTarget) {
          const dx = npc.wanderTarget.x - npc.position.x;
          const dy = npc.wanderTarget.y - npc.position.y;
          const d = Math.hypot(dx, dy);

          if (d > 2) {
            const speed = npc.def.moveSpeed * deltaSec;
            const step = Math.min(speed, d);
            const nx = (dx / d) * step;
            const ny = (dy / d) * step;

            const newPos = resolveMovement(
              npc.position,
              { x: nx, y: ny },
              NPC_FOOTPRINT,
              WORLD_CONFIG.obstacles,
              { width: WORLD_CONFIG.width, height: WORLD_CONFIG.height },
            );

            const playerPos = playerPosRef.current;
            const distToPlayer = Math.hypot(
              newPos.x - playerPos.x,
              newPos.y - playerPos.y,
            );
            const minDist = (PLAYER_FOOTPRINT.width + NPC_FOOTPRINT.width) / 2 + 4;
            if (distToPlayer > minDist) {
              npc.position = newPos;
              isMoving = true;

              if (Math.abs(dx) > Math.abs(dy)) {
                npc.direction = dx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
              } else {
                npc.direction = dy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP;
              }
            }
          }
        }
      }

      npc.animation.isMoving = isMoving;
      updateAnimation(npc.animation, DEFAULT_ANIMATION, deltaMs);

      const look =
        NPC_LOOKS[npc.def.id] || {
          skinColor: 0xffe0bd,
          hairColor: 0x1a130e,
          shirtColor: 0x5baee0,
          pantsColor: 0x383838,
          name: npc.def.name,
        };
      redrawCharacter(visual, look, npc.direction, npc.animation.currentFrame, isMoving);
      positionVisual(visual, npc.position);

      setSelected(visual, npc.def.id === selectedNpcIdRef.current);
    }
  }

  function updateCamera(): void {
    const world = worldRef.current;
    if (!world) return;
    const offset = computeWorldOffset(
      playerPosRef.current.x,
      playerPosRef.current.y,
      SCREEN_WIDTH,
      SCREEN_HEIGHT,
    );
    world.x = offset.x;
    world.y = offset.y;
  }

  /** 点击 NPC 切换选中 */
  function handleNpcClick(npcId: string): void {
    if (selectedNpcIdRef.current === npcId) {
      setSelectedNpcId(null);
    } else {
      setSelectedNpcId(npcId);
    }
  }

  return (
    <div
      className="relative border-4 border-sv-wood rounded overflow-hidden shadow-2xl"
      style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, background: '#1a1a2e' }}
    >
      <div ref={containerRef} style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }} />

      {/* NPC 按钮栏（点击切换选中） */}
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        {NPC_DEFINITIONS.map((npc) => {
          const isNear = nearestNpcId === npc.id;
          const isSelected = selectedNpcId === npc.id;
          return (
            <button
              key={npc.id}
              onClick={() => handleNpcClick(npc.id)}
              className={[
                'px-2 py-1 text-xs rounded border-2 transition-all',
                isSelected
                  ? 'bg-yellow-300 border-yellow-600 text-black shadow-lg'
                  : isNear
                  ? 'bg-white/80 border-white text-black'
                  : 'bg-black/50 border-white/30 text-white hover:bg-black/70',
              ].join(' ')}
              title={npc.personality}
            >
              {isSelected ? '★ ' : ''}
              {npc.name}
              {isNear && !isSelected ? ' · 在附近' : ''}
            </button>
          );
        })}
      </div>

      {/* 操作提示 */}
      <div className="absolute bottom-2 left-2 text-xs text-white bg-black/60 px-3 py-1 rounded">
        WASD / 方向键 移动 · 点击右侧按钮选中 NPC
      </div>

      {/* 选中 NPC 详情 */}
      {selectedNpcId && (
        <SelectedNpcCard
          npcId={selectedNpcId}
          onClose={() => setSelectedNpcId(null)}
        />
      )}
    </div>
  );
}

function SelectedNpcCard({ npcId, onClose }: { npcId: string; onClose: () => void }) {
  const npc = NPC_DEFINITIONS.find((n) => n.id === npcId);
  if (!npc) return null;
  return (
    <div className="absolute bottom-2 right-2 w-64 bg-sv-panel/95 border-2 border-sv-wood rounded p-3 text-sm shadow-xl">
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="font-bold text-sv-text-dark">{npc.name}</div>
          <div className="text-xs text-sv-wood">{npc.title}</div>
        </div>
        <button
          onClick={onClose}
          className="text-sv-text-dark hover:text-red-600 text-lg leading-none"
        >
          ×
        </button>
      </div>
      <p className="text-xs text-sv-text-dark/80 italic mb-2">{npc.personality}</p>
      <div className="text-xs text-sv-text-dark bg-white/50 rounded px-2 py-1">
        "{npc.greeting}"
      </div>
    </div>
  );
}

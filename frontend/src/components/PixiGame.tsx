/**
 * Pixi 游戏主组件（pixi-react）
 *
 * 借鉴 a16z/ai-town/src/components/PixiGame.tsx 的架构
 * 集成：地图 + 角色 + 摄像机跟随 + 碰撞检测
 */

import { useEffect, useRef, useState } from 'react';
import { Application, Graphics, Container } from 'pixi.js';
import { useKeyboard } from '../hooks/useKeyboard';
import {
  createCharacter,
  updateCharacter,
  TILE_SCALE,
  type CharacterState,
} from '../core/character';
import { drawCharacter, CHARACTER_CONFIGS } from '../core/spriteGenerator';
import { drawMap } from '../core/tileRenderer';
import {
  parseMapString,
  getMapDimensions,
  SAMPLE_MAP_STRING,
  TILE_SIZE,
} from '../core/tileset';

const SCREEN_WIDTH = 960;
const SCREEN_HEIGHT = 640;

export interface PixiGameProps {
  onPlayerTileChange?: (x: number, y: number) => void;
}

export function PixiGame({ onPlayerTileChange }: PixiGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const worldRef = useRef<Container | null>(null);
  const playerRef = useRef<CharacterState | null>(null);
  const playerGfxRef = useRef<Graphics | null>(null);
  const mapGfxRef = useRef<Graphics | null>(null);
  const keys = useKeyboard();
  const [lastTime, setLastTime] = useState<number>(performance.now());
  const keysRef = useRef(keys);
  keysRef.current = keys;

  // 初始化 PixiJS
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

    // 世界容器（用于摄像机移动）
    const world = new Container();
    app.stage.addChild(world);
    worldRef.current = world;

    // 绘制地图
    const map = parseMapString(SAMPLE_MAP_STRING);
    const mapGfx = new Graphics();
    drawMap(mapGfx, map);
    world.addChild(mapGfx);
    mapGfxRef.current = mapGfx;

    // 初始化玩家（在地图中央偏左）
    const { width: mapW, height: mapH } = getMapDimensions(map);
    const startX = Math.floor(mapW / 3);
    const startY = Math.floor(mapH / 2);
    const player = createCharacter(startX, startY);
    playerRef.current = player;

    // 绘制玩家
    const playerGfx = new Graphics();
    const config = CHARACTER_CONFIGS.player;
    drawCharacter(playerGfx, 0, 0, player.facingDirection, player.animation.currentFrame, config);
    playerGfx.x = player.pixelX;
    playerGfx.y = player.pixelY;
    world.addChild(playerGfx);
    playerGfxRef.current = playerGfx;

    // 摄像机初始位置（让玩家居中）
    world.x = SCREEN_WIDTH / 2 - player.pixelX - player.width / 2;
    world.y = SCREEN_HEIGHT / 2 - player.pixelY - player.height / 2;

    // 主循环
    let raf = 0;
    let lastTimestamp = performance.now();
    const tick = (timestamp: number) => {
      const deltaMs = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      const deltaSec = Math.min(deltaMs / 1000, 0.1); // 上限 100ms

      if (playerRef.current && playerGfxRef.current && worldRef.current) {
        // 更新角色
        updateCharacter(playerRef.current, keysRef.current, map, deltaSec);

        // 重绘角色
        const cfg = CHARACTER_CONFIGS.player;
        drawCharacter(
          playerGfxRef.current,
          0, 0,
          playerRef.current.facingDirection,
          playerRef.current.animation.currentFrame,
          cfg
        );
        playerGfxRef.current.x = playerRef.current.pixelX;
        playerGfxRef.current.y = playerRef.current.pixelY;

        // 摄像机跟随（平滑插值）
        const targetX = SCREEN_WIDTH / 2 - playerRef.current.pixelX - playerRef.current.width / 2;
        const targetY = SCREEN_HEIGHT / 2 - playerRef.current.pixelY - playerRef.current.height / 2;
        worldRef.current.x += (targetX - worldRef.current.x) * 0.15;
        worldRef.current.y += (targetY - worldRef.current.y) * 0.15;

        // 通知 tile 变化
        const tileX = Math.floor((playerRef.current.pixelX + playerRef.current.width / 2) / (TILE_SIZE * TILE_SCALE));
        const tileY = Math.floor((playerRef.current.pixelY + playerRef.current.height) / (TILE_SIZE * TILE_SCALE));
        if (onPlayerTileChange) onPlayerTileChange(tileX, tileY);
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      app.destroy(true, { children: true, texture: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className="border-4 border-sv-wood rounded overflow-hidden"
      style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
    />
  );
}

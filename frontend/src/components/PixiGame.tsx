/**
 * Pixi 游戏主组件（pixi-react）
 *
 * 借鉴 a16z/ai-town/src/components/PixiGame.tsx 的架构
 * 集成：地图 + 角色 + 摄像机跟随 + 碰撞检测
 *
 * 修复历史：
 * - 2026-07-18: 修复死代码（lastTime state）、清理 appRef、用 camera 模块
 */

import { useEffect, useRef } from 'react';
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
import {
  createCamera,
  updateCamera,
  type CameraState,
} from '../core/camera';

const SCREEN_WIDTH = 960;
const SCREEN_HEIGHT = 640;
const CAMERA_SMOOTHING = 0.15;

export interface PixiGameProps {
  onPlayerTileChange?: (x: number, y: number) => void;
}

export function PixiGame({ onPlayerTileChange }: PixiGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const worldRef = useRef<Container | null>(null);
  const playerRef = useRef<CharacterState | null>(null);
  const playerGfxRef = useRef<Graphics | null>(null);
  const cameraRef = useRef<CameraState | null>(null);

  const keys = useKeyboard();
  // 用 ref 跟踪最新 keys，避免 effect 闭包过期
  const keysRef = useRef(keys);
  keysRef.current = keys;

  // 用 ref 跟踪最新 callback，避免 effect 闭包过期
  const callbackRef = useRef(onPlayerTileChange);
  callbackRef.current = onPlayerTileChange;

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

    // 解析地图
    const map = parseMapString(SAMPLE_MAP_STRING);
    const { width: mapW, height: mapH } = getMapDimensions(map);

    // 绘制地图
    const mapGfx = new Graphics();
    drawMap(mapGfx, map);
    world.addChild(mapGfx);

    // 初始化玩家（在地图中央偏左）
    const startX = Math.floor(mapW / 3);
    const startY = Math.floor(mapH / 2);
    const player = createCharacter(startX, startY);
    playerRef.current = player;

    // 初始化摄像机
    const camera = createCamera({
      screenWidth: SCREEN_WIDTH,
      screenHeight: SCREEN_HEIGHT,
      mapWidth: mapW,
      mapHeight: mapH,
      tileSize: TILE_SIZE,
      tileScale: TILE_SCALE,
      smoothing: CAMERA_SMOOTHING,
    });
    cameraRef.current = camera;

    // 绘制玩家
    const playerGfx = new Graphics();
    const config = CHARACTER_CONFIGS.player;
    drawCharacter(playerGfx, 0, 0, player.facingDirection, player.animation.currentFrame, config);
    playerGfx.x = player.pixelX;
    playerGfx.y = player.pixelY;
    world.addChild(playerGfx);
    playerGfxRef.current = playerGfx;

    // 立即更新一次摄像机到正确位置（避免初始 lerp 动画）
    updateCamera(
      camera,
      player.pixelX,
      player.pixelY,
      player.width,
      player.height,
      {
        screenWidth: SCREEN_WIDTH,
        screenHeight: SCREEN_HEIGHT,
        mapWidth: mapW,
        mapHeight: mapH,
        tileSize: TILE_SIZE,
        tileScale: TILE_SCALE,
        smoothing: 1, // 第一次直接跳到位
      }
    );
    world.x = camera.x;
    world.y = camera.y;

    // 主循环
    let raf = 0;
    let lastTimestamp = performance.now();
    const tick = (timestamp: number) => {
      const deltaMs = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      const deltaSec = Math.min(deltaMs / 1000, 0.1); // 上限 100ms

      const p = playerRef.current;
      const pg = playerGfxRef.current;
      const w = worldRef.current;
      const c = cameraRef.current;

      if (p && pg && w && c) {
        // 1. 更新角色位置
        updateCharacter(p, keysRef.current, map, deltaSec);

        // 2. 重绘角色 sprite
        const cfg = CHARACTER_CONFIGS.player;
        drawCharacter(pg, 0, 0, p.facingDirection, p.animation.currentFrame, cfg);
        pg.x = p.pixelX;
        pg.y = p.pixelY;

        // 3. 更新摄像机（带边界限制 + 平滑）
        updateCamera(c, p.pixelX, p.pixelY, p.width, p.height, {
          screenWidth: SCREEN_WIDTH,
          screenHeight: SCREEN_HEIGHT,
          mapWidth: mapW,
          mapHeight: mapH,
          tileSize: TILE_SIZE,
          tileScale: TILE_SCALE,
          smoothing: CAMERA_SMOOTHING,
        });
        w.x = c.x;
        w.y = c.y;

        // 4. 通知 tile 变化（用 ref 调用最新 callback）
        const tileX = Math.floor((p.pixelX + p.width / 2) / (TILE_SIZE * TILE_SCALE));
        const tileY = Math.floor((p.pixelY + p.height) / (TILE_SIZE * TILE_SCALE));
        if (callbackRef.current) callbackRef.current(tileX, tileY);
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      // 用 appRef 而不是闭包里的 app，避免时序问题
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true });
      }
    };
  }, []); // 空依赖数组，只在挂载时跑一次

  return (
    <div
      ref={containerRef}
      className="border-4 border-sv-wood rounded overflow-hidden"
      style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
    />
  );
}

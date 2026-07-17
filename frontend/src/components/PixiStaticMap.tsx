/**
 * 静态地图组件（PixiJS）
 *
 * 借鉴 a16z/ai-town/src/components/PixiStaticMap.tsx 的设计
 * 用 Graphics 程序化绘制整个瓦片地图
 */

import { useEffect, useRef } from 'react';
import { Graphics } from 'pixi.js';
import { drawMap } from '../core/tileRenderer';
import { parseMapString, getMapDimensions, SAMPLE_MAP_STRING, type TileMapData } from '../core/tileset';

export interface PixiStaticMapProps {
  customMap?: TileMapData;
}

export function useStaticMap(customMap?: TileMapData) {
  const mapRef = useRef<TileMapData>(customMap ?? parseMapString(SAMPLE_MAP_STRING));
  const graphicsRef = useRef<Graphics | null>(null);

  // 更新地图
  useEffect(() => {
    if (customMap) {
      mapRef.current = customMap;
    }
  }, [customMap]);

  // 绘制地图
  const render = (graphics: Graphics) => {
    graphics.clear();
    drawMap(graphics, mapRef.current);
    graphicsRef.current = graphics;
  };

  return { map: mapRef.current, render, dimensions: getMapDimensions(mapRef.current) };
}

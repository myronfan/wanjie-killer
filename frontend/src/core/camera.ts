/**
 * 摄像机系统（限制边界）
 *
 * 借鉴 a16z/ai-town 的 useHistoricalValue 思路
 * 平滑跟随玩家 + 不超出地图边界
 */

export interface CameraConfig {
  screenWidth: number;   // 屏幕宽度
  screenHeight: number;  // 屏幕高度
  mapWidth: number;      // 地图宽度（瓦片）
  mapHeight: number;     // 地图高度（瓦片）
  tileSize: number;      // 瓦片尺寸（像素）
  tileScale: number;     // 瓦片缩放
  smoothing: number;     // 平滑系数（0-1）
}

export interface CameraState {
  x: number;  // 摄像机 x 偏移
  y: number;  // 摄像机 y 偏移
}

/**
 * 创建初始摄像机状态
 */
export function createCamera(config: CameraConfig): CameraState {
  return { x: 0, y: 0 };
}

/**
 * 计算目标摄像机位置（玩家居中）
 */
function calcTarget(
  playerPixelX: number,
  playerPixelY: number,
  playerWidth: number,
  playerHeight: number,
  config: CameraConfig
): { x: number; y: number } {
  return {
    x: config.screenWidth / 2 - playerPixelX - playerWidth / 2,
    y: config.screenHeight / 2 - playerPixelY - playerHeight / 2,
  };
}

/**
 * 限制摄像机在地图边界内
 *
 * 规则：
 * - 地图比屏幕大：摄像机可移动
 * - 地图比屏幕小：摄像机居中显示地图
 */
function clampCamera(
  targetX: number,
  targetY: number,
  config: CameraConfig
): { x: number; y: number } {
  const mapPixelWidth = config.mapWidth * config.tileSize * config.tileScale;
  const mapPixelHeight = config.mapHeight * config.tileSize * config.tileScale;

  // X 轴
  let clampedX: number;
  if (mapPixelWidth <= config.screenWidth) {
    // 地图比屏幕窄，地图居中
    clampedX = (config.screenWidth - mapPixelWidth) / 2;
  } else {
    // 地图比屏幕宽，限制摄像机不超出地图
    const minX = config.screenWidth - mapPixelWidth;
    const maxX = 0;
    clampedX = Math.max(minX, Math.min(maxX, targetX));
  }

  // Y 轴
  let clampedY: number;
  if (mapPixelHeight <= config.screenHeight) {
    // 地图比屏幕矮，地图居中
    clampedY = (config.screenHeight - mapPixelHeight) / 2;
  } else {
    const minY = config.screenHeight - mapPixelHeight;
    const maxY = 0;
    clampedY = Math.max(minY, Math.min(maxY, targetY));
  }

  return { x: clampedX, y: clampedY };
}

/**
 * 更新摄像机位置（每帧调用）
 */
export function updateCamera(
  camera: CameraState,
  playerPixelX: number,
  playerPixelY: number,
  playerWidth: number,
  playerHeight: number,
  config: CameraConfig
): void {
  const target = calcTarget(playerPixelX, playerPixelY, playerWidth, playerHeight, config);
  const clamped = clampCamera(target.x, target.y, config);

  // 平滑插值
  camera.x += (clamped.x - camera.x) * config.smoothing;
  camera.y += (clamped.y - camera.y) * config.smoothing;
}

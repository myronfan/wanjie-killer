/**
 * 程序入口 - 改造自 helloagents-ai-town-phaser/src/main.ts
 *
 * 改造点：
 * - 移除移动端横屏锁定
 * - 移除音频解锁
 * - 保留 Phaser.Game + Simulation + Hud 模式
 */

import * as Phaser from "phaser";

import "./styles.css";
import { WORLD_CONFIG } from "./game/content/world";
import { TownSimulation } from "./game/simulation/systems/TownSimulation";
import { TownBackendClient } from "./game/api/TownBackendClient";
import { BootScene } from "./phaser/scenes/BootScene";
import { TownScene } from "./phaser/scenes/TownScene";
import { createHud } from "./ui/hud/domHud";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("找不到 #app 容器。");
}

app.innerHTML = `
  <div class="app-shell">
    <div class="game-stage">
      <div id="game-root" class="game-root"></div>
    </div>
  </div>
`;

const gameRoot = document.querySelector<HTMLDivElement>("#game-root");
const gameStage = document.querySelector<HTMLDivElement>(".game-stage");

if (!gameRoot || !gameStage) {
  throw new Error("游戏挂载节点初始化失败。");
}

const simulation = new TownSimulation(new TownBackendClient());
createHud(gameStage, simulation);
void simulation.initialize();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: gameRoot,
  width: WORLD_CONFIG.width,
  height: WORLD_CONFIG.height,
  backgroundColor: "#081216",
  antialias: true,
  pixelArt: true,
  roundPixels: true,
  scene: [new BootScene(), new TownScene(simulation)],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    autoRound: true,
    width: WORLD_CONFIG.width,
    height: WORLD_CONFIG.height,
  },
  banner: false,
});

window.addEventListener("beforeunload", () => {
  game.destroy(true);
});

import { useState } from 'react';
import { PixiGame } from './components/PixiGame';

function App() {
  const [playerTile, setPlayerTile] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showHelp, setShowHelp] = useState(true);
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'day' | 'sunset' | 'night'>('day');

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-gradient-to-b from-sv-night to-sv-soil p-4">
      {/* 标题栏 */}
      <div className="sv-panel mb-3 w-[960px] flex justify-between items-center">
        <h1 className="text-xl font-bold text-sv-text">完结杀手</h1>
        <div className="flex gap-2 items-center">
          <span className="text-sm text-sv-text">时间：</span>
          <select
            value={timeOfDay}
            onChange={(e) => setTimeOfDay(e.target.value as 'morning' | 'day' | 'sunset' | 'night')}
            className="bg-sv-bg border-2 border-sv-wood text-sv-text text-sm px-2 py-1"
          >
            <option value="morning">早晨</option>
            <option value="day">中午</option>
            <option value="sunset">傍晚</option>
            <option value="night">夜晚</option>
          </select>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="sv-button text-sm"
          >
            {showHelp ? '隐藏' : '显示'} 帮助
          </button>
        </div>
      </div>

      {/* 游戏区 + 侧边栏 */}
      <div className="flex gap-3">
        {/* 游戏主区域 */}
        <div className="relative">
          <PixiGame onPlayerMove={(x, y) => setPlayerTile({ x, y })} />

          {/* 时间叠加层 */}
          {timeOfDay !== 'day' && (
            <div
              className="absolute inset-0 pointer-events-none rounded"
              style={{
                backgroundColor:
                  timeOfDay === 'morning' ? '#FFEFD580' :
                  timeOfDay === 'sunset' ? '#FF7F5080' :
                  '#1A205080',
              }}
            />
          )}
        </div>

        {/* 侧边信息栏 */}
        <div className="w-48 flex flex-col gap-3">
          <div className="sv-panel">
            <div className="text-sm font-bold text-sv-text mb-1">位置</div>
            <div className="text-sv-text-light bg-sv-soil p-2 rounded font-mono text-sm">
              X: {playerTile.x}<br/>
              Y: {playerTile.y}
            </div>
          </div>

          <div className="sv-panel">
            <div className="text-sm font-bold text-sv-text mb-1">状态</div>
            <div className="text-sv-text-light bg-sv-soil p-2 rounded font-mono text-xs">
              健康: 100/100<br/>
              能量: 100/100<br/>
              金币: 500
            </div>
          </div>

          <div className="sv-panel">
            <div className="text-sm font-bold text-sv-text mb-1">NPC</div>
            <div className="text-sv-text-light bg-sv-soil p-2 rounded text-xs">
              林动 (工位区)<br/>
              萧炎 (会议室)<br/>
              王五 (休息区)
            </div>
          </div>
        </div>
      </div>

      {/* 帮助面板 */}
      {showHelp && (
        <div className="sv-panel mt-3 w-[960px]">
          <div className="text-sm font-bold text-sv-text mb-2">🎮 操作说明</div>
          <div className="grid grid-cols-4 gap-3 text-sv-text-light text-sm">
            <div>
              <span className="bg-sv-wood px-2 py-0.5 rounded font-mono text-xs">WASD</span>
              <span className="ml-2">移动角色</span>
            </div>
            <div>
              <span className="bg-sv-wood px-2 py-0.5 rounded font-mono text-xs">方向键</span>
              <span className="ml-2">同上</span>
            </div>
            <div>
              <span className="bg-sv-wood px-2 py-0.5 rounded font-mono text-xs">Shift</span>
              <span className="ml-2">跑步</span>
            </div>
            <div>
              <span className="bg-sv-wood px-2 py-0.5 rounded font-mono text-xs">E</span>
              <span className="ml-2">互动</span>
            </div>
            <div>
              <span className="bg-sv-wood px-2 py-0.5 rounded font-mono text-xs">空格</span>
              <span className="ml-2">暂停</span>
            </div>
          </div>
        </div>
      )}

      {/* 底部状态 */}
      <div className="text-sv-text-light text-xs mt-2 opacity-60">
        v0.1.0 · 星露谷风前端 · 175ms 动画 · 4 方向系统
      </div>
    </div>
  );
}

export default App;

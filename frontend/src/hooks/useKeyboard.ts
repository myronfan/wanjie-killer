import { useEffect, useState } from 'react';

export interface KeyboardState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  shift: boolean;  // 跑步
  e: boolean;      // 互动
  space: boolean;  // 暂停
}

/**
 * 全局键盘状态 hook
 */
export function useKeyboard(): KeyboardState {
  const [keys, setKeys] = useState<KeyboardState>({
    up: false,
    down: false,
    left: false,
    right: false,
    shift: false,
    e: false,
    space: false,
  });

  useEffect(() => {
    const map: Record<string, keyof KeyboardState> = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
      KeyW: 'up',
      KeyS: 'down',
      KeyA: 'left',
      KeyD: 'right',
      ShiftLeft: 'shift',
      ShiftRight: 'shift',
      KeyE: 'e',
      Space: 'space',
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const key = map[e.code];
      if (key) {
        e.preventDefault();
        setKeys((prev) => ({ ...prev, [key]: true }));
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const key = map[e.code];
      if (key) {
        e.preventDefault();
        setKeys((prev) => ({ ...prev, [key]: false }));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  return keys;
}

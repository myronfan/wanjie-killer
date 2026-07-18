import { useEffect, useRef, useState } from 'react';

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
 *
 * 修复历史：
 * - 2026-07-18:
 *   - Bug #11: Space 在非游戏输入框时不 preventDefault，避免影响表单输入
 *   - Bug #14: 用 ref 跟踪 mounted 状态，避免卸载后 setState 警告
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

  // 跟踪 mounted 状态
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

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

    /**
     * 检查事件目标是否是输入元素（input/textarea/contenteditable）
     * 如果是输入元素，不处理游戏快捷键
     */
    const isInputElement = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
      if (target.isContentEditable) return true;
      return false;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      // Bug #11 修复：输入元素时不处理游戏快捷键
      if (isInputElement(e.target)) return;

      const key = map[e.code];
      if (key) {
        e.preventDefault();
        // Bug #14 修复：检查 mounted 后再 setState
        if (mountedRef.current) {
          setKeys((prev) => ({ ...prev, [key]: true }));
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const key = map[e.code];
      if (key) {
        e.preventDefault();
        if (mountedRef.current) {
          setKeys((prev) => ({ ...prev, [key]: false }));
        }
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

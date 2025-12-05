/**
 * 应用生命周期管理 Hook
 *
 * 管理应用的初始化和生命周期事件
 * - 初始化数据加载
 * - 监听键盘快捷键（Cmd/Ctrl+S 保存）
 * - 提供容器引用
 */
import { useEffect, useRef } from 'react';
import { BlockitClient } from '@lark-opdev/block-docs-addon-api';

const DocMiniApp = new BlockitClient().initAPI();

/**
 * 应用生命周期管理 Hook
 * @param loadExistingData - 加载数据的函数
 * @param flushSave - 立即保存的函数
 * @returns 容器引用
 */
export const useAppLifecycle = (
  loadExistingData: () => Promise<void>,
  flushSave: () => Promise<void>
) => {
  // 主容器引用，用于挂载键盘事件
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 初始化应用并通知 Lark 准备就绪
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        // 加载已有数据
        await loadExistingData();
        // 通知 Lark 应用已准备就绪
        DocMiniApp.LifeCycle.notifyAppReady();
      } catch {
        // Error initializing
      }
    };

    initializeComponent();
  }, [loadExistingData]);

  // 拦截 Cmd+S / Ctrl+S 快捷键，保存到 Lark 而不是浏览器默认行为
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 检测 Cmd+S (Mac) 或 Ctrl+S (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault();
        event.stopPropagation();
        // 立即保存到 Lark
        flushSave();
      }
    };

    const container = containerRef.current;
    // 在容器和 window 上都监听，确保捕获事件
    if (container) {
      container.addEventListener('keydown', handleKeyDown, true);
    }

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      if (container) {
        container.removeEventListener('keydown', handleKeyDown, true);
      }
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [flushSave]);

  return { containerRef };
};

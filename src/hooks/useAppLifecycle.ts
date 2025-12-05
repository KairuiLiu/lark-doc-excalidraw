/**
 * 应用生命周期管理 Hook
 *
 * 管理应用的初始化和生命周期事件
 * - 初始化数据加载
 * - 监听键盘快捷键（Cmd/Ctrl+S 保存）
 * - 提供容器引用
 */
import { useEffect, useRef } from 'react';
import { useDocsService } from './useDocsService';

/**
 * 应用生命周期管理 Hook
 * @param loadExistingData - 加载数据的函数
 * @param flushPendingData - 立即保存的函数
 * @returns 容器引用
 */
export const useAppLifecycle = (
  loadExistingData: () => Promise<void>,
  flushPendingData: () => void
) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { notifyReady } = useDocsService();

  useEffect(() => {
    const initializeComponent = async () => {
      try {
        await loadExistingData();
      } finally {
        notifyReady();
      }
    };

    initializeComponent();
  }, [loadExistingData]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault();
        event.stopPropagation();
        flushPendingData();
      }
    };

    const container = containerRef.current;
    container?.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      container?.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [flushPendingData]);

  return { containerRef };
};

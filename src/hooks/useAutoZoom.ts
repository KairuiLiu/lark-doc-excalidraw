/**
 * 自动缩放 Hook
 *
 * 负责监听数据变化和窗口尺寸变化，自动缩放画布以适应内容
 * - 当 Excalidraw API 就绪且有数据时，自动执行缩放
 * - 当窗口尺寸变化时，执行防抖缩放（300ms）
 * - 仅在非编辑模式下启用窗口尺寸变化的自动缩放, 编辑模式下最大可能保证用户视图不被打扰
 */
import { useCallback, useEffect, useMemo } from 'react';
import { debounce } from 'es-toolkit';
import { useExcalidrawDataContext } from '../contexts/ExcalidrawDataContext';

/**
 * 自动缩放 Hook
 * 当数据加载完成时自动调整画布缩放以适应内容
 */
export const useAutoZoom = (isAddonEditMode: boolean) => {
  const { excalidrawAPI, hasExistingData } = useExcalidrawDataContext();

  /**
   * 自动缩放以适应画布内容
   */
  const autoZoomToFit = useCallback(() => {
    if (!excalidrawAPI) return;
    try {
      excalidrawAPI.scrollToContent(excalidrawAPI.getSceneElements(), {
        fitToContent: true,
        animate: true
      });
    } catch (error) {
      console.error('Error auto-zooming to fit:', error);
    }
  }, [excalidrawAPI]);

  /**
   * 创建防抖版本的缩放函数，用于窗口尺寸变化
   * 300ms 防抖，避免频繁执行
   */
  const debouncedAutoZoom = useMemo(() => debounce(autoZoomToFit, 300), [autoZoomToFit]);

  // 当 API 就绪且有数据时，自动缩放以适应内容
  useEffect(() => {
    if (excalidrawAPI && hasExistingData) {
      // 延迟执行，确保 Excalidraw 完全初始化
      const timer = setTimeout(() => {
        autoZoomToFit();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [excalidrawAPI, hasExistingData, autoZoomToFit]);

  // 监听窗口尺寸变化，自动缩放画布
  useEffect(() => {
    if (!excalidrawAPI || !hasExistingData || isAddonEditMode) return;

    const handleResize = () => {
      console.log('Window resized, auto-zooming to fit content');
      debouncedAutoZoom();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      // 清理未执行的防抖任务
      debouncedAutoZoom.cancel();
    };
  }, [excalidrawAPI, hasExistingData, debouncedAutoZoom, isAddonEditMode]);

  useEffect(() => {
    if (!isAddonEditMode) {
      debouncedAutoZoom();
    }
  }, [isAddonEditMode, debouncedAutoZoom]);

  return {
    autoZoomToFit
  };
};

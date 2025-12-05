/**
 * Excalidraw API 管理 Hook
 *
 * 管理 Excalidraw 实例 API 和相关功能
 * - 自动缩放以适应内容
 * - 全屏模式切换
 * - API 实例管理
 */
import { useState, useCallback, useEffect } from 'react';
import { BlockitClient } from '@lark-opdev/block-docs-addon-api';

const DocMiniApp = new BlockitClient().initAPI();

/**
 * Excalidraw API 管理 Hook
 * @param hasExistingData - 是否存在已有数据
 * @returns API 实例和相关操作方法
 */
export const useExcalidrawAPI = (hasExistingData: boolean) => {
  // Excalidraw API 实例
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);

  /**
   * 自动缩放以适应画布内容
   * 延迟 100ms 确保模式切换已完成
   */
  const autoZoomToFit = useCallback(() => {
    if (excalidrawAPI) {
      setTimeout(() => {
        try {
          excalidrawAPI.scrollToContent(excalidrawAPI.getSceneElements(), {
            fitToContent: true,
            animate: false
          });
        } catch {
          // Error zooming to fit
        }
      }, 100);
    }
  }, [excalidrawAPI]);

  /**
   * 切换全屏模式
   * 如果当前不是全屏则进入全屏，否则退出全屏
   */
  const toggleFullScreen = async () => {
    try {
      await DocMiniApp.Service.Fullscreen.enterFullscreen();
    } catch {
      await DocMiniApp.Service.Fullscreen.exitFullscreen();
    }
  };

  // 当 API 就绪且有数据时，自动缩放以适应内容
  useEffect(() => {
    if (excalidrawAPI && hasExistingData) {
      autoZoomToFit();
    }
  }, [excalidrawAPI, hasExistingData, autoZoomToFit]);

  return {
    excalidrawAPI,
    setExcalidrawAPI,
    autoZoomToFit,
    toggleFullScreen
  };
};

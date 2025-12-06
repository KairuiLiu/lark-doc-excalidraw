/**
 * Excalidraw 画布组件
 *
 * 封装 Excalidraw 编辑器，提供绘图功能
 * - 编辑/查看模式切换
 * - 自动保存
 * - 处理鼠标拖拽边界问题
 */
import { useRef, useEffect, useCallback, useMemo } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import { debounce } from 'es-toolkit';
import styles from './ExcalidrawCanvas.module.css';
import { useExcalidrawDataContext } from '../../contexts/ExcalidrawDataContext';
import { useDocsService } from '../../hooks/useDocsService';
import { useAutoZoom } from '../../hooks/useAutoZoom';
import { BlockData } from '../../types';

/**
 * Excalidraw 画布组件的属性
 */
interface ExcalidrawCanvasProps {
  /** 是否为编辑模式 */
  isEditingMode: boolean;
  /** 是否为暗色模式 */
  isDarkMode: boolean;
  /** 保存数据的函数 */
  saveData: (data: Partial<BlockData>) => Promise<void>;
}

/**
 * Excalidraw 画布组件
 * 包装 Excalidraw 编辑器并处理相关事件
 */
export const ExcalidrawCanvas = ({ isEditingMode, isDarkMode, saveData }: ExcalidrawCanvasProps) => {
  const { excalidrawData, setExcalidrawAPI, excalidrawAPI } = useExcalidrawDataContext();
  const { notifyReady } = useDocsService();
  const { language } = useDocsService();
  const excalidrawWrapperRef = useRef<HTMLDivElement | null>(null);
  const isUpdatingFromSyncRef = useRef(false);
  useAutoZoom(isEditingMode);

  // 稳定的 initialData 引用，只在首次渲染时设置
  const initialDataRef = useRef(
    excalidrawData || {
      elements: [],
      appState: { collaborators: new Map() },
      files: {}
    }
  );
  /**
   * 处理 Excalidraw 内容变化
   * 仅在编辑模式下触发保存
   */
  const handleExcalidrawChangeRaw = useCallback(
    (elements: readonly any[], appState: any, files: any) => {
      // 如果是从同步更新的，不触发保存（避免循环）
      if (isUpdatingFromSyncRef.current) {
        return;
      }
      saveData({ excalidrawData: { elements, appState, files } });
    },
    [saveData]
  );

  // 对 onChange 进行防抖，避免频繁触发保存
  const handleExcalidrawChange = useMemo(
    () => debounce(handleExcalidrawChangeRaw, 300),
    [handleExcalidrawChangeRaw]
  );

  /**
   * 监听 excalidrawData 变化，通过 API 更新画布
   * 这样可以响应来自其他实例的数据变化
   *
   * 注意：同步的 appState 已经通过 cleanAppState 移除了不应该同步的字段
   * （如 viewModeEnabled, scrollX/Y, zoom, 选中状态等），
   * 所以这里可以直接应用，不会影响当前实例的视图状态
   */
  useEffect(() => {
    if (!excalidrawAPI || !excalidrawData) return;

    // 标记正在从同步更新，防止触发 onChange
    isUpdatingFromSyncRef.current = true;
    console.log('🔄 [Sync] Starting canvas update, blocking onChange');

    try {
      excalidrawAPI.updateScene({
        elements: excalidrawData.elements,
        appState: excalidrawData.appState,
        ...(excalidrawData.files && { files: excalidrawData.files })
      });
      console.log('✅ [Sync] Canvas updated with new data');
    } catch (error) {
      console.error('Failed to update canvas:', error);
      // 出错时立即重置标志
      isUpdatingFromSyncRef.current = false;
      return;
    }

    // 使用 requestAnimationFrame 来在下一帧重置标志
    // 这样可以确保 Excalidraw 的所有同步更新都完成，同时不会阻塞太久
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        isUpdatingFromSyncRef.current = false;
        console.log('✅ [Sync] Update complete, onChange unblocked');
      });
    });
  }, [excalidrawAPI, excalidrawData]);

  /**
   * 处理鼠标离开画布区域
   * 记录最后的鼠标位置，并用正确的坐标分发 mouseup 事件
   * 这样可以正确结束拖拽，避免线条连回 (0,0) 的问题
   */
  useEffect(() => {
    const wrapper = excalidrawWrapperRef.current;
    if (!wrapper) return;

    // 记录最后的鼠标位置和指针信息
    let lastClientX = 0;
    let lastClientY = 0;
    let lastPointerId = 1;
    let lastPointerType: string = 'mouse';

    /**
     * 跟踪鼠标/指针移动，记录最新位置
     */
    const trackPointerMove = (e: PointerEvent) => {
      lastClientX = e.clientX;
      lastClientY = e.clientY;
      lastPointerId = e.pointerId;
      lastPointerType = e.pointerType;
    };

    /**
     * 鼠标离开时，使用最后记录的位置分发 mouseup/pointerup
     */
    const handleMouseLeave = (e: MouseEvent) => {
      // 如果 mouseleave 事件本身有坐标，使用它；否则使用最后记录的位置
      const clientX = e.clientX || lastClientX;
      const clientY = e.clientY || lastClientY;

      // 分发 mouseup 事件
      const mouseUpEvent = new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX,
        clientY,
        screenX: e.screenX,
        screenY: e.screenY
      });
      wrapper.dispatchEvent(mouseUpEvent);

      // 分发 pointerup 事件
      const pointerUpEvent = new PointerEvent('pointerup', {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
        screenX: e.screenX,
        screenY: e.screenY,
        pointerId: lastPointerId,
        pointerType: lastPointerType
      });
      wrapper.dispatchEvent(pointerUpEvent);
    };

    // 监听 pointermove 来跟踪鼠标位置
    wrapper.addEventListener('pointermove', trackPointerMove as EventListener);
    wrapper.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      wrapper.removeEventListener('pointermove', trackPointerMove as EventListener);
      wrapper.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={excalidrawWrapperRef}
      className={`${styles.excalidrawWrapper} ${!isEditingMode && styles.readingMode}`}
    >
      <Excalidraw
        excalidrawAPI={(it) => {
          notifyReady();
          setExcalidrawAPI(it);
        }}
        initialData={initialDataRef.current}
        viewModeEnabled={!isEditingMode}
        onChange={handleExcalidrawChange}
        theme={isDarkMode ? 'dark' : 'light'}
        UIOptions={{
          canvasActions: {
            loadScene: false,
            saveToActiveFile: false,
            clearCanvas: isEditingMode,
            changeViewBackgroundColor: isEditingMode
          }
        }}
        langCode={language}
        detectScroll={false}
        handleKeyboardGlobally={false}
      />
    </div>
  );
};

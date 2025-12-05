/**
 * Excalidraw 画布组件
 *
 * 封装 Excalidraw 编辑器，提供绘图功能
 * - 编辑/查看模式切换
 * - 自动保存
 * - 处理鼠标拖拽边界问题
 */
import { useRef, useEffect, useCallback } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import styles from './ExcalidrawCanvas.module.css';
import { useExcalidrawData } from '../../hooks/useExcalidrawData';
import { useExcalidrawDataContext } from '../../contexts/ExcalidrawDataContext';
import { useDocsService } from '../../hooks/useDocsService';

/**
 * Excalidraw 画布组件的属性
 */
interface ExcalidrawCanvasProps {
  /** 是否为编辑模式 */
  isEditingMode: boolean;
}

/**
 * Excalidraw 画布组件
 * 包装 Excalidraw 编辑器并处理相关事件
 */
export const ExcalidrawCanvas = ({ isEditingMode }: ExcalidrawCanvasProps) => {
  const { saveExcalidrawData, excalidrawData } = useExcalidrawData();
  const { setExcalidrawAPI } = useExcalidrawDataContext();
  const { notifyReady } = useDocsService();
  const excalidrawWrapperRef = useRef<HTMLDivElement | null>(null);
  /**
   * 处理 Excalidraw 内容变化
   * 仅在编辑模式下触发保存
   */
  const handleExcalidrawChange = useCallback(
    (elements: readonly any[], appState: any, files: any) => {
      if (isEditingMode) {
        saveExcalidrawData(elements, appState, files);
      }
    },
    [isEditingMode, saveExcalidrawData]
  );

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
        initialData={excalidrawData || { elements: [], appState: { collaborators: new Map() }, files: {} }}
        viewModeEnabled={!isEditingMode}
        onChange={handleExcalidrawChange}
        UIOptions={{
          canvasActions: {
            loadScene: false,
            saveToActiveFile: false,
            clearCanvas: isEditingMode,
            changeViewBackgroundColor: isEditingMode
          }
        }}
        detectScroll={false}
        handleKeyboardGlobally={false}
      />
    </div>
  );
};

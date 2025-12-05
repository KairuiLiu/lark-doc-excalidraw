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
import { ExcalidrawData } from '../../types';
import styles from './ExcalidrawCanvas.module.css';

/**
 * Excalidraw 画布组件的属性
 */
interface ExcalidrawCanvasProps {
  /** Excalidraw 数据 */
  excalidrawData: ExcalidrawData | null;
  /** 是否为只读模式 */
  isReadingMode: boolean;
  /** 是否为编辑模式 */
  isEditingMode: boolean;
  /** API 就绪回调 */
  onExcalidrawAPIReady: (api: any) => void;
  /** 保存回调 */
  onSave: (elements: readonly any[], appState: any, files: any) => void;
}

/**
 * Excalidraw 画布组件
 * 包装 Excalidraw 编辑器并处理相关事件
 */
export const ExcalidrawCanvas = ({
  excalidrawData,
  isReadingMode,
  isEditingMode,
  onExcalidrawAPIReady,
  onSave
}: ExcalidrawCanvasProps) => {
  const excalidrawWrapperRef = useRef<HTMLDivElement | null>(null);

  /**
   * 处理 Excalidraw 内容变化
   * 仅在编辑模式下触发保存
   */
  const handleExcalidrawChange = useCallback(
    (elements: readonly any[], appState: any, files: any) => {
      if (isEditingMode && elements && appState) {
        onSave(elements, appState, files);
      }
    },
    [isEditingMode, onSave]
  );

  /**
   * 处理鼠标离开画布区域
   * 取消正在进行的拖拽操作，防止拖拽到容器外部导致的问题
   */
  useEffect(() => {
    const wrapper = excalidrawWrapperRef.current;
    if (!wrapper) return;

    const handleMouseLeave = () => {
      // 分发 mouseup 事件取消拖拽
      const mouseUpEvent = new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      wrapper.dispatchEvent(mouseUpEvent);

      // 同时分发 pointerup 事件处理指针事件
      const pointerUpEvent = new PointerEvent('pointerup', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        pointerType: 'mouse'
      });
      wrapper.dispatchEvent(pointerUpEvent);
    };

    wrapper.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      wrapper.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={excalidrawWrapperRef}
      className={`${styles.excalidrawWrapper} ${isReadingMode ? styles.readingMode : ''}`}
    >
      <Excalidraw
        excalidrawAPI={onExcalidrawAPIReady}
        initialData={
          excalidrawData || { elements: [], appState: { collaborators: new Map() }, files: {} }
        }
        viewModeEnabled={isReadingMode}
        onChange={handleExcalidrawChange}
        UIOptions={{
          canvasActions: {
            loadScene: false,
            saveToActiveFile: false,
            export: false,
            saveAsImage: false,
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

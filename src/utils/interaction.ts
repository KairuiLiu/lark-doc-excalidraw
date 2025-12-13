import type { AppState } from '@excalidraw/excalidraw/types/types';

/**
 * 检查是否有正在进行的交互操作
 * 用于判断是否应该阻止同步/保存，避免打断用户操作
 *
 * @param appState Excalidraw 应用状态
 * @returns 是否有正在进行的交互
 */
export const isInteractionInProgress = (appState: Partial<AppState>): boolean => {
  return !!(
    appState.editingElement || // 正在编辑元素（包括文本编辑）
    appState.multiElement || // 正在绘制多点元素（如自由绘制）
    appState.draggingElement || // 正在拖动元素
    appState.resizingElement || // 正在缩放元素
    appState.isResizing || // 正在缩放标志
    appState.isRotating || // 正在旋转元素
    appState.editingLinearElement || // 正在编辑线性元素（编辑模式下的线）
    appState.selectedLinearElement || // 选中的线性元素（连续选点绘制）
    appState.selectedElementsAreBeingDragged || // 元素正在被拖动
    appState.editingGroupId || // 正在编辑组
    appState.editingFrame || // 正在编辑框架
    appState.activeEmbeddable || // 正在交互嵌入内容
    appState.pendingImageElementId // 等待放置的图片元素
  );
};

/**
 * AppState 工具函数
 * 处理 Excalidraw appState 的清理和转换
 */
import { omit } from 'es-toolkit';
import type { AppState } from '@excalidraw/excalidraw/types/types';

/**
 * 清理 appState 对象
 * 移除不需要序列化的字段，以及不应该跨实例同步的状态
 *
 * @param appState 原始 appState 对象
 * @returns 清理后的 appState 对象
 */
export const cleanAppState = (appState?: Partial<AppState>): Partial<AppState> => {
  if (!appState) return {};
  return omit(appState, [
    // 1. 不可序列化的运行时/内部字段
    'collaborators', // 存储 Map 或 Set，不可序列化
    'fileHandle', // 浏览器文件系统句柄，不可序列化
    'newElement', // 正在绘制的元素对象
    'multiElement', // 自由绘制/多点元素对象
    'selectionElement', // 选框元素对象
    'draggingElement', // 正在拖动的元素对象
    'resizingElement', // 正在缩放的元素对象
    'startBoundElement', // 绑定的起点元素对象
    'suggestedBinding', // 建议的绑定信息
    'editingTextElement', // 正在编辑的文本元素对象
    'frameToHighlight', // 内部渲染优化
    'elementsToHighlight', // 内部渲染优化
    'selectedLinearElement', // 正在编辑的线性元素对象
    'snapLines', // 内部对齐线数组
    'searchMatches', // 搜索结果对象

    // 2. 特定于本地视图/交互/UI 的状态
    'viewModeEnabled', // 是否处于查看模式（特定于用户会话）
    'scrollX', // 本地滚动位置
    'scrollY', // 本地滚动位置
    'zoom', // 本地缩放级别
    'cursorButton', // 本地鼠标/笔状态
    'scrolledOutside', // 本地视图状态
    'selectedElementIds', // 本地选中状态
    'hoveredElementIds', // 本地悬停状态
    'selectedGroupIds', // 本地选中组状态
    'editingGroupId', // 本地编辑组状态
    'activeTool', // 本地激活工具
    'preferredSelectionTool', // 本地工具偏好
    'penMode', // 本地笔模式
    'penDetected', // 本地设备状态
    'isResizing', // 本地交互状态
    'isRotating', // 本地交互状态
    'lastPointerDownWith', // 本地输入设备
    'contextMenu', // 本地 UI 状态
    'openMenu', // 本地 UI 状态
    'openPopup', // 本地 UI 状态
    'openSidebar', // 本地 UI 状态
    'openDialog', // 本地 UI 状态
    'pasteDialog', // 本地 UI 状态
    'toast', // 本地 UI 状态
    'stats', // 本地 UI 状态
    'showWelcomeScreen', // 本地偏好
    'errorMessage', // 本地错误信息
    'isLoading', // 本地加载状态
    'shouldCacheIgnoreZoom', // 本地性能状态
    'showHyperlinkPopup', // 本地 UI 状态
    'isCropping', // 本地交互
    'croppingElementId', // 本地交互
    'activeLockedId', // 本地交互
    'editingFrame', // 本地交互
    'originSnapOffset', // 本地交互/对齐
    'userToFollow', // 协作追踪状态
    'followedBy', // 协作追踪状态
    'isBindingEnabled', // 绑定状态
    'editingElement', // 老版本兼容
    'activeEmbeddable', // 嵌入式内容交互
    'previousSelectedElementIds' // 历史选中状态
  ]);
};

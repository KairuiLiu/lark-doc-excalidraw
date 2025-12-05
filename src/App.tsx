/**
 * Lark Excalidraw 插件主应用组件
 *
 * 这是一个集成了 Excalidraw 绘图功能的 Lark 文档插件
 * 主要功能：
 * - 支持编辑和查看两种模式
 * - 自动保存到 Lark 文档存储
 * - 文件导入/导出
 * - 全屏模式
 * - 快捷键支持（Cmd/Ctrl+S）
 */
import './index.css';
import { useAddonEditMode } from './hooks/useAddonEditMode';
import { DOCS_MODE } from '@lark-opdev/block-docs-addon-api';
import { useExcalidrawData } from './hooks/useExcalidrawData';
import { useDocsService } from './hooks/useDocsService';
import { useAppLifecycle } from './hooks/useAppLifecycle';
import { EmptyStateView } from './components/EmptyStateView/EmptyStateView';
import { TopToolbar } from './components/TopToolbar/TopToolbar';
import { ExcalidrawCanvas } from './components/ExcalidrawCanvas/ExcalidrawCanvas';
import { useAutoZoom } from './hooks/useAutoZoom';

/**
 * 应用主组件
 */
export default () => {
  const {
    isLoadingData,
    hasExistingData,
    loadExistingData,
    flushPendingData,
    handleFileUpload,
    createNewDrawing
  } = useExcalidrawData();
  const { docsMode } = useDocsService();
  const isDocsEditMode = docsMode === DOCS_MODE.EDITING;
  const [isAddonEditMode, toggleAddonEditMode] = useAddonEditMode();
  const { containerRef } = useAppLifecycle(loadExistingData, flushPendingData);
  useAutoZoom(isAddonEditMode);

  if (isLoadingData) return <div>数据加载中...</div>;

  if (!hasExistingData) {
    return <EmptyStateView onFileUpload={handleFileUpload} onCreateNew={createNewDrawing} />;
  }

  return (
    <div ref={containerRef} className="excalidraw-container">
      {isDocsEditMode && (
        <TopToolbar isEditingMode={isAddonEditMode} onToggleEditMode={toggleAddonEditMode} />
      )}

      <ExcalidrawCanvas isEditingMode={isAddonEditMode} />
    </div>
  );
};

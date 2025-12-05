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
import { DOCS_MODE } from '@lark-opdev/block-docs-addon-api';
import './index.css';
import { LoadingView, EmptyStateView, TopToolbar, ExcalidrawCanvas } from './components';
import {
  useExcalidrawData,
  useDocsMode,
  useExcalidrawAPI,
  useAppLifecycle
} from './hooks';

/**
 * 应用主组件
 */
export default () => {
  // 数据管理：加载、保存、导入、导出
  const {
    excalidrawData,
    isLoading,
    hasExistingData,
    loadExistingData,
    saveExcalidrawData,
    flushSave,
    handleFileUpload,
    createNewDrawing,
    exportDrawing
  } = useExcalidrawData();

  // 文档模式管理：编辑/查看模式
  const { docsMode, effectiveEditMode, toggleEditMode } = useDocsMode();

  // Excalidraw API 管理：缩放、全屏
  const { setExcalidrawAPI, autoZoomToFit, toggleFullScreen } = useExcalidrawAPI(hasExistingData);

  // 应用生命周期：初始化、键盘快捷键
  const { containerRef } = useAppLifecycle(loadExistingData, flushSave);

  /**
   * 切换编辑/查看模式
   * 切换前先保存，切换后自动缩放画布
   */
  const handleToggleEditMode = async () => {
    await flushSave();
    toggleEditMode();
    autoZoomToFit();
  };

  /**
   * 切换全屏模式
   * 切换前先保存数据
   */
  const handleToggleFullScreen = async () => {
    await flushSave();
    await toggleFullScreen();
  };

  // 加载状态
  if (isLoading) {
    return <LoadingView />;
  }

  // 空状态：显示上传或创建选项
  if (!hasExistingData) {
    return <EmptyStateView onFileUpload={handleFileUpload} onCreateNew={createNewDrawing} />;
  }

  // 计算当前实际的编辑/查看模式
  const isEditingMode = effectiveEditMode;
  const isReadingMode = !effectiveEditMode;

  return (
    <div ref={containerRef} className="excalidraw-container">
      {docsMode !== DOCS_MODE.READING && (
        <TopToolbar
          isEditingMode={isEditingMode}
          onToggleFullScreen={handleToggleFullScreen}
          onExportDrawing={exportDrawing}
          onToggleEditMode={handleToggleEditMode}
        />
      )}

      <ExcalidrawCanvas
        excalidrawData={excalidrawData}
        isReadingMode={isReadingMode}
        isEditingMode={isEditingMode}
        onExcalidrawAPIReady={setExcalidrawAPI}
        onSave={saveExcalidrawData}
      />
    </div>
  );
};

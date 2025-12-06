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
import { EmptyStateView } from './components/EmptyStateView/EmptyStateView';
import { TopToolbar } from './components/TopToolbar/TopToolbar';
import { ExcalidrawCanvas } from './components/ExcalidrawCanvas/ExcalidrawCanvas';
import { t } from '@lingui/core/macro';
import { useHotKey } from './hooks/useHotKey';
import { useExcalidrawDataContext } from './contexts/ExcalidrawDataContext';

/**
 * 应用主组件
 */
export default () => {
  const { handleFileUpload, createNewDrawing, saveData, waitForAllSaves } = useExcalidrawData();
  const { isLoadingData, hasExistingData } = useExcalidrawDataContext();
  const { docsMode, isDarkMode } = useDocsService();
  const isDocsEditMode = docsMode === DOCS_MODE.EDITING;
  const [isAddonEditMode, setAddonEditMode] = useAddonEditMode();
  useHotKey();

  return (
    <div
      id="lark-docs-excalidraw-container"
      className="excalidraw-container"
      data-theme={isDarkMode ? 'dark' : 'light'}
    >
      {isLoadingData && <div>{t`数据加载中`}...</div>}
      {!hasExistingData && <EmptyStateView onFileUpload={handleFileUpload} onCreateNew={createNewDrawing} />}
      {!isLoadingData && hasExistingData && (
        <>
          {isDocsEditMode && (
            <TopToolbar
              saveData={saveData}
              isEditingMode={isAddonEditMode}
              setIsEditMode={setAddonEditMode}
              waitForAllSaves={waitForAllSaves}
            />
          )}
          <ExcalidrawCanvas isEditingMode={isAddonEditMode} isDarkMode={isDarkMode} saveData={saveData} />
        </>
      )}
    </div>
  );
};

/**
 * 文档模式管理 Hook
 *
 * 管理 Lark 文档的编辑/查看模式
 * - 监听文档模式变化
 * - 提供模式切换功能
 * - 在文档只读模式下强制为查看模式
 */
import { useState, useEffect } from 'react';
import { BlockitClient, DOCS_MODE } from '@lark-opdev/block-docs-addon-api';

const DocMiniApp = new BlockitClient().initAPI();

/**
 * 文档模式管理 Hook
 * @returns 文档模式状态和切换方法
 */
export const useDocsMode = () => {
  // Lark 文档模式（EDITING / READING）
  const [docsMode, setDocsMode] = useState<DOCS_MODE>(DOCS_MODE.UNKNOWN);
  // 用户选择的编辑模式
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const initializeDocsMode = async () => {
      try {
        // 获取当前文档模式
        const currentDocsMode = await DocMiniApp.Env.DocsMode.getDocsMode();
        setDocsMode(currentDocsMode);

        // 监听文档模式变化
        const handleDocsModeChange = (newDocsMode: DOCS_MODE) => {
          setDocsMode(newDocsMode);
        };

        DocMiniApp.Env.DocsMode.onDocsModeChange(handleDocsModeChange);

        return () => {
          DocMiniApp.Env.DocsMode.offDocsModeChange(handleDocsModeChange);
        };
      } catch {
        // Error initializing docs mode
      }
    };

    const cleanup = initializeDocsMode();

    return () => {
      cleanup.then((cleanupFn) => cleanupFn && cleanupFn());
    };
  }, []);

  /**
   * 切换编辑/查看模式
   */
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  // 当文档处于只读模式时，强制为查看模式
  // 当文档处于编辑模式时，允许用户在编辑/查看之间切换
  const effectiveEditMode = docsMode === DOCS_MODE.READING ? false : isEditMode;

  return {
    docsMode,
    isEditMode,
    effectiveEditMode,
    toggleEditMode
  };
};

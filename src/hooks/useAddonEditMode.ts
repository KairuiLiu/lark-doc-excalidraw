/**
 * 文档模式管理 Hook
 *
 * 管理 Lark 文档的编辑/查看模式
 * - 监听文档模式变化
 * - 提供模式切换功能
 * - 在文档只读模式下强制为查看模式
 */
import { useState, useEffect } from 'react';
import { DOCS_MODE } from '@lark-opdev/block-docs-addon-api';
import { useDocsService } from './useDocsService';

/**
 * 文档模式管理 Hook
 * @returns 文档模式状态和切换方法
 */
export const useAddonEditMode = () => {
  // Lark 文档是否是编辑模式
  const { docsMode } = useDocsService();
  const isDocsEditMode = docsMode === DOCS_MODE.EDITING;
  // 用户选择的编辑模式
  const [isAddonEditMode, setAddonIsEditMode] = useState(false);

  // 如果文档变为只读模式，强制插件为查看模式
  useEffect(() => {
    if (!isDocsEditMode) {
      setAddonIsEditMode(false);
    }
  }, [isDocsEditMode]);

  /**
   * 切换编辑/查看模式
   */
  const toggleAddonEditMode = () => {
    if (!isDocsEditMode) throw new Error('Cannot toggle edit mode in read-only document');
    setAddonIsEditMode((prev) => !prev);
  };

  return [isAddonEditMode, toggleAddonEditMode] as const;
};

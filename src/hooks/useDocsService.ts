/**
 * Lark Docs Service Hook
 *
 * 统一管理所有与 Lark Docs API 相关的功能
 * - 单例 DocMiniApp 实例
 * - 数据存储/读取
 * - 文档模式（EDITING/READING）监听
 * - 语言设置获取
 * - 暗色模式监听
 * - 全屏切换
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { BlockitClient, DOCS_MODE } from '@lark-opdev/block-docs-addon-api';
import type { BlockData } from '../types';

// 单例 DocMiniApp 实例
let docMiniAppInstance: ReturnType<BlockitClient['initAPI']> | null = null;

/**
 * 获取 DocMiniApp 单例
 */
const getDocMiniApp = () => {
  if (!docMiniAppInstance) {
    docMiniAppInstance = new BlockitClient().initAPI();
  }
  return docMiniAppInstance;
};

/**
 * Lark Docs Service Hook
 */
export const useDocsService = () => {
  const docMiniApp = getDocMiniApp();

  // 文档模式状态
  const [docsMode, setDocsMode] = useState<DOCS_MODE>(DOCS_MODE.EDITING);
  // 语言设置
  const [language, setLanguage] = useState<string>('');
  // 暗色模式
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  // 初始化完成标志
  const [isInitialized, setIsInitialized] = useState(false);

  // 用于存储订阅函数的引用，确保可以正确取消订阅
  const darkModeHandlerRef = useRef<((isDark: boolean) => void) | null>(null);
  const docsModeHandlerRef = useRef<((mode: string) => void) | null>(null);

  /**
   * 初始化：获取初始状态并订阅变化
   */
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        // 并行获取所有初始状态
        const [initialDocsMode, initialLanguage, initialDarkMode] = await Promise.all([
          docMiniApp.Env.DocsMode.getDocsMode().catch(() => DOCS_MODE.EDITING),
          docMiniApp.Env.Language.getLanguage().catch(() => 'en'),
          docMiniApp.Env.DarkMode.getIsDarkMode().catch(() => false)
        ]);

        if (!mounted) return;

        setDocsMode(initialDocsMode as DOCS_MODE);
        setLanguage(initialLanguage);
        setIsDarkMode(initialDarkMode);
        setIsInitialized(true);

        console.log('[DocsService] Initialized', {
          docsMode: initialDocsMode,
          language: initialLanguage,
          isDarkMode: initialDarkMode
        });
      } catch (error) {
        console.error('[DocsService] Initialization failed:', error);
        setIsInitialized(true); // 即使失败也标记为已初始化
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [docMiniApp]);

  /**
   * 订阅 DocsMode 变化
   */
  useEffect(() => {
    if (!isInitialized) return;

    const handler = (mode: string) => {
      console.log('[DocsService] DocsMode changed:', mode);
      setDocsMode(mode as DOCS_MODE);
    };

    docsModeHandlerRef.current = handler;
    docMiniApp.Env.DocsMode.onDocsModeChange(handler);

    return () => {
      if (docsModeHandlerRef.current) {
        docMiniApp.Env.DocsMode.offDocsModeChange(docsModeHandlerRef.current);
        docsModeHandlerRef.current = null;
      }
    };
  }, [docMiniApp, isInitialized]);

  /**
   * 订阅暗色模式变化
   */
  useEffect(() => {
    if (!isInitialized) return;

    const handler = (isDark: boolean) => {
      console.log('[DocsService] DarkMode changed:', isDark);
      setIsDarkMode(isDark);
    };

    darkModeHandlerRef.current = handler;
    docMiniApp.Env.DarkMode.onDarkModeChange(handler);

    return () => {
      if (darkModeHandlerRef.current) {
        docMiniApp.Env.DarkMode.offDarkModeChange(darkModeHandlerRef.current);
        darkModeHandlerRef.current = null;
      }
    };
  }, [docMiniApp, isInitialized]);

  /**
   * 保存数据到 Lark Record
   */
  const saveRecord = useCallback(
    async (data: BlockData) => {
      try {
        await docMiniApp.Record.setRecord([
          {
            type: 'replace',
            data: {
              path: [],
              value: data
            }
          }
        ]);
        console.log('[DocsService] Data saved', data);
      } catch (error) {
        console.error('[DocsService] Failed to save data:', error);
        throw error;
      }
    },
    [docMiniApp]
  );

  /**
   * 从 Lark Record 读取数据
   */
  const loadRecord = useCallback(async (): Promise<BlockData | null> => {
    try {
      const recordData = await docMiniApp.Record.getRecord();
      console.log('[DocsService] Data loaded', recordData);
      return recordData || null;
    } catch (error) {
      console.error('[DocsService] Failed to load data:', error);
      throw error;
    }
  }, [docMiniApp]);

  /**
   * 切换全屏模式
   */
  const toggleFullscreen = useCallback(async () => {
    try {
      await docMiniApp.Service.Fullscreen.enterFullscreen();
    } catch {
      await docMiniApp.Service.Fullscreen.exitFullscreen();
    }
  }, [docMiniApp]);

  /**
   * 通知应用已准备就绪
   */
  const notifyReady = useCallback(async () => {
    try {
      await docMiniApp.LifeCycle.notifyAppReady();
      console.log('[DocsService] App ready notification sent');
    } catch (error) {
      console.error('[DocsService] Failed to notify app ready:', error);
    }
  }, [docMiniApp]);

  return {
    // 状态
    docsMode,
    language,
    isDarkMode,
    isInitialized,

    // 方法
    saveRecord,
    loadRecord,
    toggleFullscreen,
    notifyReady,

    // 原始 API（如果需要直接访问）
    docMiniApp
  };
};

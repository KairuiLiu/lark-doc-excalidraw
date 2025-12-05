/**
 * Excalidraw 数据管理 Hook
 *
 * 负责 Excalidraw 绘图数据的业务逻辑
 * - 从 Lark 文档存储中加载数据
 * - 自动防抖保存（1秒延迟）
 * - 文件导入/导出
 * - 创建新绘图
 *
 * 使用 Context 中的状态，不创建新状态
 */
import { useCallback, useRef, useMemo } from 'react';
import { debounce, omit } from 'es-toolkit';
import { BlockData } from '../types';
import { useExcalidrawDataContext } from '../contexts/ExcalidrawDataContext';
import { useDocsService } from './useDocsService';

/**
 * 清理 appState 对象
 * 移除不需要序列化的字段，避免存储问题
 */
const cleanAppState = (appState: any) => {
  return omit(appState, ['collaborators', 'activeEmbeddable', 'contextMenuSize', 'pageSize']);
};

/**
 * Excalidraw 数据管理 Hook
 * @returns 数据状态和操作方法
 */
export const useExcalidrawData = () => {
  // 从 Context 获取状态
  const {
    excalidrawData,
    isLoadingData,
    hasExistingData,
    setExcalidrawData,
    setIsLoadingData,
    setHasExistingData
  } = useExcalidrawDataContext();

  // 使用 DocsService 进行数据读写
  const { loadRecord, saveRecord } = useDocsService();

  // 待保存的数据引用
  const pendingSaveDataRef = useRef<{ elements: readonly any[]; appState: any; files: any } | null>(null);

  /**
   * 从 Lark 文档存储中加载已有的绘图数据
   */
  const loadExistingData = useCallback(async () => {
    setIsLoadingData(true);

    try {
      // 使用 DocsService 读取数据
      const recordData = await loadRecord();

      if (recordData?.excalidrawData) {
        const loadedData = recordData.excalidrawData;
        // 恢复 collaborators Map（保存时被移除）
        if (loadedData.appState) {
          loadedData.appState.collaborators = new Map();
        }
        setExcalidrawData(loadedData);
        setHasExistingData(true);
      } else {
        // 没有数据，设置为空状态
        setExcalidrawData(null);
        setHasExistingData(false);
      }
    } catch (error) {
      console.error('Failed to load from Lark Record API:', error);
      // 加载失败，设置为空状态
      setExcalidrawData(null);
      setHasExistingData(false);
    } finally {
      setIsLoadingData(false);
    }
  }, [loadRecord, setIsLoadingData, setExcalidrawData, setHasExistingData]);

  /**
   * 执行实际的保存操作
   * 将数据保存到 Lark 文档存储
   */
  const performSave = useCallback(async () => {
    if (!pendingSaveDataRef.current) return;

    const { elements, appState, files } = pendingSaveDataRef.current;

    const dataToSave: BlockData = {
      excalidrawData: {
        elements,
        appState: cleanAppState(appState),
        files
      },
      lastModified: new Date().toISOString()
    };

    try {
      // 使用 DocsService 保存数据
      await saveRecord(dataToSave);
      pendingSaveDataRef.current = null;
    } catch (error) {
      console.error('Failed to save to Lark Record API:', error);
    }
  }, [saveRecord]);

  /**
   * 创建防抖版本的 performSave
   * 使用 es-toolkit 的 debounce，1 秒延迟
   */
  const debouncedSave = useMemo(() => debounce(performSave, 1000), [performSave]);

  /**
   * 保存 Excalidraw 数据（带防抖）
   * 使用 1 秒防抖避免频繁保存
   */
  const saveExcalidrawData = useCallback(
    (elements: readonly any[], appState: any, files?: any, flush?: boolean) => {
      pendingSaveDataRef.current = { elements, appState, files: files || {} };
      if (flush) {
        debouncedSave.cancel();
        performSave();
      } else {
        debouncedSave();
      }
    },
    [debouncedSave, performSave]
  );

  const flushPendingData = useCallback(() => {
    debouncedSave.cancel();
    performSave();
  }, [debouncedSave, performSave]);

  /**
   * 处理文件上传
   * 支持上传 .excalidraw 和 .json 格式的文件
   */
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoadingData(true);
      const text = await file.text();
      const data = JSON.parse(text);

      // 验证文件格式（必须包含 type 或 elements 字段）
      if (data.type === 'excalidraw' || data.elements) {
        const excalidrawData = {
          elements: data.elements || [],
          appState: {
            ...data.appState,
            collaborators: new Map()
          }
        };

        setExcalidrawData(excalidrawData);
        setHasExistingData(true);

        // 保存上传的数据
        saveExcalidrawData(
          excalidrawData.elements,
          excalidrawData.appState,
          (excalidrawData as any).files || {},
          true
        );
      }
    } catch (error) {
      console.error('Error parsing uploaded file:', error);
    } finally {
      setIsLoadingData(false);
    }
  }, [setIsLoadingData, setExcalidrawData, setHasExistingData, saveExcalidrawData]);

  /**
   * 创建新的空白绘图
   */
  const createNewDrawing = useCallback(() => {
    const newData = {
      elements: [],
      appState: {
        collaborators: new Map()
      },
      files: {}
    };
    setExcalidrawData(newData);
    setHasExistingData(true);

    saveExcalidrawData(newData.elements, newData.appState, newData.files, true);
  }, [setExcalidrawData, setHasExistingData, saveExcalidrawData]);

  return {
    excalidrawData,
    isLoadingData,
    hasExistingData,
    loadExistingData,
    saveExcalidrawData,
    handleFileUpload,
    createNewDrawing,
    flushPendingData
  };
};

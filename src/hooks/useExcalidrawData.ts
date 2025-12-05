/**
 * Excalidraw 数据管理 Hook
 *
 * 负责管理 Excalidraw 绘图数据的加载、保存、导入和导出功能
 * - 从 Lark 文档存储中加载数据
 * - 自动防抖保存（1秒延迟）
 * - 文件导入/导出
 * - 创建新绘图
 */
import { useState, useCallback, useRef } from 'react';
import { BlockitClient } from '@lark-opdev/block-docs-addon-api';
import { ExcalidrawData, BlockData } from '../types';

const DocMiniApp = new BlockitClient().initAPI();

/**
 * Excalidraw 数据管理 Hook
 * @returns 数据状态和操作方法
 */
export const useExcalidrawData = () => {
  // Excalidraw 绘图数据
  const [excalidrawData, setExcalidrawData] = useState<ExcalidrawData | null>(null);
  // 加载状态
  const [isLoading, setIsLoading] = useState(true);
  // 是否存在已有数据
  const [hasExistingData, setHasExistingData] = useState(false);

  // 保存定时器引用，用于防抖
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // 待保存的数据引用
  const pendingSaveDataRef = useRef<{ elements: readonly any[]; appState: any; files: any } | null>(null);

  /**
   * 从 Lark 文档存储中加载已有的绘图数据
   */
  const loadExistingData = useCallback(async () => {
    try {
      setIsLoading(true);
      let dataLoaded = false;

      try {
        // 从 Lark Record API 获取存储的数据
        const recordData = await DocMiniApp.Record.getRecord();

        if (recordData && recordData.excalidrawData) {
          const excalidrawData = recordData.excalidrawData;
          // 清理 collaborators Map，避免序列化问题
          if (excalidrawData.appState) {
            excalidrawData.appState.collaborators = new Map();
          }
          setExcalidrawData(excalidrawData);
          setHasExistingData(true);
          dataLoaded = true;
        }
      } catch {
        // Fallback to localStorage if needed
      }

      // 如果没有加载到数据，设置为空状态
      if (!dataLoaded) {
        setHasExistingData(false);
        setExcalidrawData(null);
      }
    } catch {
      setHasExistingData(false);
      setExcalidrawData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 执行实际的保存操作
   * 将数据保存到 Lark 文档存储
   */
  const performSave = async () => {
    if (!pendingSaveDataRef.current) return;

    try {
      const { elements, appState, files } = pendingSaveDataRef.current;
      // 清理不需要序列化的字段，避免存储问题
      const cleanAppState = {
        ...appState,
        collaborators: undefined,
        activeEmbeddable: undefined,
        contextMenuSize: undefined,
        pageSize: undefined
      };

      const dataToSave: BlockData = {
        excalidrawData: {
          elements,
          appState: cleanAppState,
          files
        },
        lastModified: new Date().toISOString()
      };

      try {
        // 使用 Lark Record API 保存数据
        await DocMiniApp.Record.setRecord([
          {
            type: 'replace',
            data: {
              path: [],
              value: dataToSave
            }
          }
        ]);
        pendingSaveDataRef.current = null;
      } catch {
        // Record API save failed
      }
    } catch {
      // Error saving excalidraw data
    }
  };

  /**
   * 保存 Excalidraw 数据（带防抖）
   * 使用 1 秒防抖避免频繁保存
   */
  const saveExcalidrawData = useCallback(async (elements: readonly any[], appState: any, files?: any) => {
    try {
      // 存储待保存的数据
      pendingSaveDataRef.current = { elements, appState, files: files || {} };

      // 清除之前的定时器
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // 设置新的防抖定时器（1秒后保存）
      saveTimeoutRef.current = setTimeout(async () => {
        await performSave();
      }, 1000);
    } catch {
      // Error setting up save
    }
  }, []);

  /**
   * 立即执行保存（跳过防抖）
   * 用于需要立即保存的场景，如切换模式、全屏等
   */
  const flushSave = async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    await performSave();
  };

  /**
   * 处理文件上传
   * 支持上传 .excalidraw 和 .json 格式的文件
   */
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
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
        await saveExcalidrawData(
          excalidrawData.elements,
          excalidrawData.appState,
          (excalidrawData as any).files || {}
        );
      }
    } catch {
      // Error parsing file
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 创建新的空白绘图
   */
  const createNewDrawing = () => {
    const newData = {
      elements: [],
      appState: {
        collaborators: new Map()
      },
      files: {}
    };
    setExcalidrawData(newData);
    setHasExistingData(true);

    saveExcalidrawData(newData.elements, newData.appState, newData.files);
  };

  /**
   * 导出绘图为 .excalidraw 文件
   * 下载到本地
   */
  const exportDrawing = async () => {
    if (!excalidrawData) {
      return;
    }

    const dataToExport = {
      type: 'excalidraw',
      version: 2,
      source: 'lark-excalidraw-addon',
      elements: excalidrawData.elements,
      appState: excalidrawData.appState,
      files: excalidrawData.files || {}
    };

    // 创建 Blob 并触发下载
    const blob = new Blob([JSON.stringify(dataToExport)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `excalidraw-${new Date().toISOString().slice(0, 10)}.excalidraw`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return {
    excalidrawData,
    isLoading,
    hasExistingData,
    loadExistingData,
    saveExcalidrawData,
    flushSave,
    handleFileUpload,
    createNewDrawing,
    exportDrawing
  };
};

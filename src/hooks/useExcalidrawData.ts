import { useCallback, useRef, useEffect } from 'react';
import { delay, isEqual, omit } from 'es-toolkit';
import { BlockData, ExcalidrawData } from '../types';
import { useExcalidrawDataContext } from '../contexts/ExcalidrawDataContext';
import { useDocsService } from './useDocsService';

/**
 * 清理 appState 对象
 * 移除不需要序列化的字段，以及不应该跨实例同步的状态
 */
const cleanAppState = (appState: any) => {
  return omit(appState, [
    // 不可序列化的字段
    'collaborators',
    'activeEmbeddable',
    'contextMenuSize',
    'pageSize',
    // 不应该跨实例同步的视图状态
    'viewModeEnabled',
    'scrollX',
    'scrollY',
    'zoom',
    'cursorButton',
    'scrolledOutside',
    'selectedElementIds',
    'selectedGroupIds',
    'editingGroupId',
    'selectedLinearElementId',
    'draggingElement',
    'resizingElement',
    'multiElement',
    'selectionElement',
    'isBindingEnabled',
    'startBoundElement',
    'suggestedBindings',
    'frameToHighlight',
    'editingElement',
    'elementsToHighlight'
  ]);
};

// 定义等待队列的结构
interface PendingSave {
  data: BlockData;
  resolvers: Array<(value: void) => void>;
  rejecters: Array<(reason: any) => void>;
}

/**
 * Excalidraw 数据管理 Hook
 * @returns 数据状态和操作方法
 */
export const useExcalidrawData = () => {
  const {
    excalidrawData,
    title,
    setExcalidrawData,
    setIsLoadingData,
    setHasExistingData,
    setTitle
  } = useExcalidrawDataContext();

  const { loadRecord, saveRecord, notifyReady, docMiniApp } = useDocsService();

  // 暂存 buffer
  const lastModifiedRef = useRef<number>(0);
  const uuid = useRef<string>();

  // 并发控制 Refs
  const isUploadingRef = useRef(false);
  const pendingSaveRef = useRef<PendingSave | null>(null);
  const flushResolversRef = useRef<(() => void)[]>([]);

  // 获取外部数据后覆盖本地数据
  const handleReplaceLocalData = useCallback(
    (income: BlockData) => {
      const newLastModified = income?.lastModified;
      const currentLastModified = lastModifiedRef.current;
      // 远端数据没有不合法
      if (!newLastModified) throw new Error('Invalid remote data: missing lastModified');
      // 远端数据过时
      if (currentLastModified && newLastModified < currentLastModified)
        throw new Error('Stale remote data: lastModified is older than local');

      // 更新修改时间
      lastModifiedRef.current = newLastModified;
      uuid.current = income?.uuid;

      // 更新视图数据
      setExcalidrawData((prev) => {
        if (!income.excalidrawData || isEqual(prev, income.excalidrawData)) return prev;
        setHasExistingData(true);
        return income.excalidrawData;
      });
      setTitle((prev) => income.title || prev);
    },
    [setTitle, setHasExistingData, setExcalidrawData]
  );

  // 初始化时, 从 Lark 文档存储加载已有数据
  useEffect(() => {
    const initializeComponent = async () => {
      // TODO 有什么用
      setIsLoadingData(true);
      try {
        const income = await loadRecord();
        if (income) handleReplaceLocalData(income);
        notifyReady();
      } catch (error) {
        console.error('Failed to load from Lark Record API:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    initializeComponent();
  }, []);

  // 从远端订阅数据覆盖本地数据
  useEffect(() => {
    docMiniApp.Record.onRecordChange(handleReplaceLocalData);
    return () => {
      docMiniApp.Record.offRecordChange(handleReplaceLocalData);
    };
  }, [docMiniApp, handleReplaceLocalData]);

  /**
   * 实际执行保存的原子操作
   * 包含 api 调用和 300ms 延迟
   */
  const performSave = useCallback(
    async (data: BlockData) => {
      try {
        await saveRecord(data);
        // 强制等待 300ms，防止请求过于频繁
        await delay(300);
      } catch (error) {
        console.error('Failed to save to Lark Record API:', error);
        throw error;
      }
    },
    [saveRecord]
  );

  /**
   * 处理队列循环
   * 当一个上传任务完成后，检查是否有等待的任务
   */
  const processQueue = useCallback(async () => {
    // 只要等待区有数据，就一直循环处理
    while (pendingSaveRef.current) {
      // 1. 取出当前最新的等待数据和所有相关的 promises
      const { data, resolvers, rejecters } = pendingSaveRef.current;

      // 2. 立即清空等待区 (这样在本次上传期间产生的新请求会形成新的 pending)
      pendingSaveRef.current = null;

      try {
        // 3. 执行上传
        await performSave(data);
        // 4. 成功：通知所有等待这个批次的调用者
        resolvers.forEach((resolve) => resolve());
      } catch (error) {
        // 5. 失败：拒绝所有等待这个批次的调用者
        rejecters.forEach((reject) => reject(error));
      }
    }

    // 队列处理完毕，标记为空闲
    isUploadingRef.current = false;
    if (flushResolversRef.current.length > 0) {
      flushResolversRef.current.forEach((resolve) => resolve());
      flushResolversRef.current = []; // 清空监听列表
    }
  }, [performSave]);

  /**
   * 核心保存逻辑
   * 1. 立即更新本地状态 (Optimistic UI)
   * 2. 控制并发上传逻辑
   */
  const saveData = useCallback(
    async (income: Partial<BlockData>) => {
      const localData = {
        lastModified: Date.now(),
        uuid: uuid.current,
        excalidrawData,
        title
      };

      const newData: BlockData = {
        ...localData,
        ...income
      };

      // 清理 appState
      if (newData.excalidrawData?.appState) {
        newData.excalidrawData.appState = cleanAppState(newData.excalidrawData.appState);
      }

      // 1. 如果数据没有变化，直接返回
      if (isEqual(localData, newData)) return;

      // 2. 立即更新本地 Ref 和视图（防止用户感知回退）
      handleReplaceLocalData(newData);

      // 3. 上传队列逻辑
      return new Promise<void>((resolve, reject) => {
        if (isUploadingRef.current) {
          if (!pendingSaveRef.current) {
            pendingSaveRef.current = {
              data: newData,
              resolvers: [],
              rejecters: []
            };
          } else {
            pendingSaveRef.current.data = newData;
          }
          pendingSaveRef.current.resolvers.push(resolve);
          pendingSaveRef.current.rejecters.push(reject);
        } else {
          isUploadingRef.current = true;

          performSave(newData)
            .then(() => {
              resolve();
              processQueue();
            })
            .catch((err) => {
              reject(err);
              processQueue();
            });
        }
      });
    },
    [excalidrawData, title, handleReplaceLocalData, performSave, processQueue]
  );

  const waitForAllSaves = useCallback(async () => {
    // 如果当前没在上传，直接完成
    if (!isUploadingRef.current) {
      return;
    }

    // 如果正在上传，返回一个 Promise，并将 resolve 句柄交给 processQueue 在结束后调用
    return new Promise<void>((resolve) => {
      flushResolversRef.current.push(resolve);
    });
  }, []);

  /**
   * 处理文件上传
   */
  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        setIsLoadingData(true);
        const text = await file.text();
        const fileData = JSON.parse(text) as ExcalidrawData;

        const excalidrawData: ExcalidrawData = {
          elements: fileData.elements || [],
          appState: cleanAppState(fileData.appState),
          files: fileData.files
        };
        const uuid = crypto.randomUUID();
        const lastModified = Date.now();

        // 待保存的数据
        const data = {
          excalidrawData,
          uuid,
          lastModified,
          title: undefined
        };

        await saveData(data);
      } catch (error) {
        console.error('Error parsing uploaded file:', error);
      } finally {
        setIsLoadingData(false);
      }
    },
    [setIsLoadingData, saveData]
  );

  /**
   * 创建新的空白绘图
   */
  const createNewDrawing = useCallback(async () => {
    const excalidrawData = {
      elements: [],
      appState: {
        collaborators: new Map()
      },
      files: {}
    };
    const uuid = crypto.randomUUID();
    const lastModified = Date.now();

    // 待保存的数据
    const data = {
      excalidrawData,
      uuid,
      lastModified,
      title: undefined
    };

    // 写入并同步
    await saveData(data);
  }, [saveData]);

  return {
    handleFileUpload,
    createNewDrawing,
    saveData,
    waitForAllSaves
  };
};

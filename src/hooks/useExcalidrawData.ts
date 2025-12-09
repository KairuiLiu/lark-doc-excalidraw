import { useCallback, useRef, useEffect } from 'react';
import { delay, difference, isEqual, omit } from 'es-toolkit';
import { BlockData, ExcalidrawData } from '../types';
import { useExcalidrawDataContext } from '../contexts/ExcalidrawDataContext';
import { useDocsService } from './useDocsService';

/**
 * 清理 appState 对象
 * 移除不需要序列化的字段，以及不应该跨实例同步的状态
 */
const cleanAppState = (appState: any) => {
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
    'suggestedBinding', // 推荐连接节点
    'activeEmbeddable', // 嵌入式内容交互
    'previousSelectedElementIds' // 历史选中状态
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
  const { excalidrawData, title, setExcalidrawData, setIsLoadingData, setHasExistingData, setTitle } =
    useExcalidrawDataContext();

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
      if (currentLastModified && newLastModified < currentLastModified) {
        throw new Error('Stale remote data: lastModified is older than local');
      }

      // 更新修改时间
      lastModifiedRef.current = newLastModified;
      uuid.current = income?.uuid;

      // 更新视图数据
      setExcalidrawData((prev) => {
        let anyChanged = false;
        if (
          !isEqual(
            prev?.elements.toSorted((a, b) => a.id.localeCompare(b.id)),
            income.excalidrawData?.elements.toSorted((a, b) => a.id.localeCompare(b.id))
          )
        ) {
          anyChanged = true;
          console.log(
            `🔄 [setExcalidrawData] Elements changed (${prev?.elements.length} -> ${income.excalidrawData?.elements.length})`
          );
        }
        if (!isEqual(prev?.files, income.excalidrawData?.files)) {
          anyChanged = true;
          console.log(
            `🔄 [setExcalidrawData] Files changed (${prev?.files} -> ${income.excalidrawData?.files})`
          );
        }
        if (!isEqual(cleanAppState(prev?.appState), cleanAppState(income.excalidrawData?.appState))) {
          anyChanged = true;
          console.log(
            '🔄 [setExcalidrawData] AppState changed',
            cleanAppState(prev?.appState),
            cleanAppState(income.excalidrawData?.appState)
          );
        }
        if (!anyChanged) return prev;
        setHasExistingData(true);
        return {
          elements: income.excalidrawData?.elements || [],
          appState: { ...prev?.appState, ...cleanAppState(income.excalidrawData?.appState) },
          files: income.excalidrawData?.files || {}
        };
      });
      setTitle((prev) => income.title || prev);
    },
    [setTitle, setHasExistingData, setExcalidrawData]
  );

  // 初始化时, 从 Lark 文档存储加载已有数据
  useEffect(() => {
    const initializeComponent = async () => {
      // 加载数据, 如果请求失败则用不就绪, 防止本地上传新数据
      setIsLoadingData(true);
      let income;
      try {
        income = await loadRecord();
      } catch (error) {
        console.error('Failed to load from Lark Record API:', error);
        return;
      } finally {
        setIsLoadingData(false);
      }

      // 处理数据
      try {
        if (income) handleReplaceLocalData(income);
      } catch (error) {
        console.error('Error handling remote data on initialization:', error);
      } finally {
        notifyReady();
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

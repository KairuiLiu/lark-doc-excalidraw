/**
 * Excalidraw 数据上下文
 *
 * 只负责状态管理和分发，不包含业务逻辑
 */
import { createContext, useContext, ReactNode, useState, Dispatch, SetStateAction } from 'react';
import { ExcalidrawData } from '../types';
import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import { isEqual } from 'es-toolkit';

// 定义 Context 类型 - 只包含状态，不包含业务逻辑
interface ExcalidrawDataContextType {
  // 数据状态
  excalidrawData?: ExcalidrawData;
  isLoadingData: boolean;
  hasExistingData: boolean;
  title?: string;

  // API 状态
  excalidrawAPI?: ExcalidrawImperativeAPI;

  // 状态更新函数
  setExcalidrawData: Dispatch<SetStateAction<ExcalidrawData | undefined>>;
  setIsLoadingData: Dispatch<SetStateAction<boolean>>;
  setHasExistingData: Dispatch<SetStateAction<boolean>>;
  setTitle: Dispatch<SetStateAction<string | undefined>>;
  setExcalidrawAPI: Dispatch<SetStateAction<ExcalidrawImperativeAPI | undefined>>;
}

// 创建 Context
const ExcalidrawDataContext = createContext<ExcalidrawDataContextType | null>(null);

/**
 * Provider 组件
 * 只负责管理状态，不包含业务逻辑
 */
export const ExcalidrawDataProvider = ({ children }: { children: ReactNode }) => {
  // Excalidraw 绘图数据
  const [excalidrawData, setExcalidrawData] = useState<ExcalidrawData>();
  // 包装 setExcalidrawData, 所有传入都会被深拷贝
  const setExcalidrawDataPatch = (
    data: ExcalidrawData | undefined | ((prev: ExcalidrawData | undefined) => ExcalidrawData | undefined)
  ) => {
    setExcalidrawData((prev) => {
      // 计算 income - 直接传 prev，因为我们的代码不会修改它
      const income = typeof data === 'function' ? data(prev) : data;
      // 防止外部对 data 变量修改，深拷贝返回值
      const incomeClone = structuredClone(income);
      // 确实相同则返回纯净的 prev
      if (isEqual(prev, incomeClone)) {
        return prev;
      }
      return incomeClone;
    });
  };

  // 加载状态
  const [isLoadingData, setIsLoadingData] = useState(true);
  // 是否存在已有数据
  const [hasExistingData, setHasExistingData] = useState(false);
  // 图名
  const [title, setTitle] = useState<string>();
  // Excalidraw API 实例
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | undefined>();

  return (
    <ExcalidrawDataContext.Provider
      value={{
        excalidrawData,
        isLoadingData,
        hasExistingData,
        title,
        excalidrawAPI,
        setExcalidrawData: setExcalidrawDataPatch,
        setIsLoadingData,
        setHasExistingData,
        setTitle,
        setExcalidrawAPI
      }}
    >
      {children}
    </ExcalidrawDataContext.Provider>
  );
};

/**
 * 使用 Excalidraw 数据的 Hook
 * 从 Context 中获取共享状态
 */
export const useExcalidrawDataContext = () => {
  const context = useContext(ExcalidrawDataContext);
  if (!context) {
    throw new Error('useExcalidrawDataContext must be used within ExcalidrawDataProvider');
  }
  return context;
};

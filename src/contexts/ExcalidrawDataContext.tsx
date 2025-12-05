/**
 * Excalidraw 数据上下文
 *
 * 只负责状态管理和分发，不包含业务逻辑
 */
import { createContext, useContext, ReactNode, useState, Dispatch, SetStateAction } from 'react';
import { ExcalidrawData } from '../types';

// 定义 Context 类型 - 只包含状态，不包含业务逻辑
interface ExcalidrawDataContextType {
  // 数据状态
  excalidrawData: ExcalidrawData | null;
  isLoadingData: boolean;
  hasExistingData: boolean;

  // API 状态
  excalidrawAPI: any;

  // 状态更新函数
  setExcalidrawData: Dispatch<SetStateAction<ExcalidrawData | null>>;
  setIsLoadingData: Dispatch<SetStateAction<boolean>>;
  setHasExistingData: Dispatch<SetStateAction<boolean>>;
  setExcalidrawAPI: Dispatch<SetStateAction<any>>;
}

// 创建 Context
const ExcalidrawDataContext = createContext<ExcalidrawDataContextType | null>(null);

/**
 * Provider 组件
 * 只负责管理状态，不包含业务逻辑
 */
export const ExcalidrawDataProvider = ({ children }: { children: ReactNode }) => {
  // Excalidraw 绘图数据
  const [excalidrawData, setExcalidrawData] = useState<ExcalidrawData | null>(null);
  // 加载状态
  const [isLoadingData, setIsLoadingData] = useState(true);
  // 是否存在已有数据
  const [hasExistingData, setHasExistingData] = useState(false);
  // Excalidraw API 实例
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);

  return (
    <ExcalidrawDataContext.Provider
      value={{
        excalidrawData,
        isLoadingData,
        hasExistingData,
        excalidrawAPI,
        setExcalidrawData,
        setIsLoadingData,
        setHasExistingData,
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

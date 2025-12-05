/**
 * 加载状态视图组件
 * 在数据加载过程中显示
 */
import styles from './LoadingView.module.css';

export const LoadingView = () => {
  return (
    <div className="excalidraw-container">
      <div className={styles.loading}>加载中...</div>
    </div>
  );
};

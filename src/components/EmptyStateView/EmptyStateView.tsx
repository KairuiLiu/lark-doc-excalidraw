/**
 * 空状态视图组件的属性
 */
import { t } from '@lingui/core/macro';
import styles from './EmptyStateView.module.css';

interface EmptyStateViewProps {
  /** 文件上传处理函数 */
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** 创建新绘图处理函数 */
  onCreateNew: () => void;
}

/**
 * 空状态视图组件
 * 当没有已有数据时显示，提供上传文件或创建新绘图的选项
 */
export const EmptyStateView = ({ onFileUpload, onCreateNew }: EmptyStateViewProps) => {
  return (
    <div className="excalidraw-container">
      <div className={styles.uploadSection}>
        <h3>{t`Excalidraw 绘图`}</h3>
        <p>{t`请上传一个 Excalidraw 文件或创建新绘图：`}</p>

        <div className={styles.uploadButtons}>
          <input
            type="file"
            accept=".excalidraw,.json"
            onChange={onFileUpload}
            style={{ display: 'none' }}
            id="excalidraw-upload"
          />
          <label htmlFor="excalidraw-upload" className={styles.uploadBtn}>
            📁 {t`上传 Excalidraw 文件`}
          </label>

          <button onClick={onCreateNew} className={styles.createBtn}>
            ✨ {t`创建新绘图`}
          </button>
        </div>
      </div>
    </div>
  );
};

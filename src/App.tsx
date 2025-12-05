import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { BlockitClient, DOCS_MODE } from '@lark-opdev/block-docs-addon-api';
import { Excalidraw } from '@excalidraw/excalidraw';
import './index.css';

const DocMiniApp = new BlockitClient().initAPI();

interface ExcalidrawData {
  elements: any[];
  appState: any;
  files?: any;
}

interface BlockData {
  excalidrawData?: ExcalidrawData;
  lastModified?: string;
}

export default () => {
  const [excalidrawData, setExcalidrawData] = useState<ExcalidrawData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasExistingData, setHasExistingData] = useState(false);
  const [docsMode, setDocsMode] = useState<DOCS_MODE>(DOCS_MODE.UNKNOWN);
  const [isEditMode, setIsEditMode] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const loadExistingData = useCallback(async () => {
    try {
      setIsLoading(true);
      let dataLoaded = false;

      try {
        const recordData = await DocMiniApp.Record.getRecord();

        if (recordData && recordData.excalidrawData) {
          const excalidrawData = recordData.excalidrawData;
          if (excalidrawData.appState) {
            excalidrawData.appState.collaborators = new Map();
          }
          setExcalidrawData(excalidrawData);
          setHasExistingData(true);
          dataLoaded = true;
        }
      } catch (recordError) {
        console.log('Record API not available, using localStorage fallback');

        // Fallback to localStorage
        // try {
        //   const localData = localStorage.getItem('excalidraw-data');
        //   if (localData) {
        //     const parsedData = JSON.parse(localData);
        //     if (parsedData.excalidrawData) {
        //       const excalidrawData = parsedData.excalidrawData;

        //       if (excalidrawData.appState) {
        //         excalidrawData.appState.collaborators = new Map();
        //       }

        //       setExcalidrawData(excalidrawData);
        //       setHasExistingData(true);
        //       dataLoaded = true;
        //     }
        //   }
        // } catch (localError) {
        //   console.log('localStorage also failed, starting with empty state');
        // }
      }

      if (!dataLoaded) {
        setHasExistingData(false);
        setExcalidrawData(null);
      }
    } catch (error) {
      console.error('Error loading existing data:', error);
      setHasExistingData(false);
      setExcalidrawData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveExcalidrawData = useCallback(async (elements: any[], appState: any, files?: any) => {
    try {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const cleanAppState = {
            ...appState,
            collaborators: undefined, // Remove collaborators as it's not serializable
            // Remove other non-serializable data
            activeEmbeddable: undefined,
            contextMenuSize: undefined,
            pageSize: undefined
          };

          const dataToSave: BlockData = {
            excalidrawData: {
              elements,
              appState: cleanAppState,
              files: files || {}
            },
            lastModified: new Date().toISOString()
          };

          try {
            await DocMiniApp.Record.setRecord([
              {
                type: 'replace',
                data: {
                  path: [],
                  value: dataToSave
                }
              }
            ]);
            console.log('Excalidraw data saved to Record API');
          } catch (recordError) {
            console.log('Record API save failed');
            // localStorage.setItem('excalidraw-data', JSON.stringify(dataToSave));
            // console.log('Excalidraw data saved to localStorage (fallback)');
          }
        } catch (error) {
          console.error('Error saving excalidraw data:', error);
        }
      }, 1000);
    } catch (error) {
      console.error('Error setting up save:', error);
    }
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.type === 'excalidraw' || data.elements) {
        const excalidrawData = {
          elements: data.elements || [],
          appState: {
            ...(data.appState || {}),
            collaborators: new Map()
          }
        };

        setExcalidrawData(excalidrawData);
        setHasExistingData(true);

        await saveExcalidrawData(
          excalidrawData.elements,
          excalidrawData.appState,
          (excalidrawData as any).files || {}
        );
      } else {
        console.error('请上传有效的 Excalidraw 文件');
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      console.error('文件格式错误，请上传有效的 Excalidraw 文件');
    } finally {
      setIsLoading(false);
    }
  };

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

  const toggleEditMode = () => {
    const newMode = !isEditMode;
    console.log('Toggle edit mode:', { from: isEditMode, to: newMode, docsMode });
    setIsEditMode(newMode);
  };

  const exportDrawing = async () => {
    if (!excalidrawData) {
      console.error('没有可导出的绘图数据');
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

    const blob = new Blob([JSON.stringify(dataToExport)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `excalidraw-${new Date().toISOString().slice(0, 10)}.excalidraw`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const initializeComponent = async () => {
      try {
        const currentDocsMode = await DocMiniApp.Env.DocsMode.getDocsMode();
        setDocsMode(currentDocsMode);
        const handleDocsModeChange = (newDocsMode: DOCS_MODE) => {
          setDocsMode(newDocsMode);
        };

        DocMiniApp.Env.DocsMode.onDocsModeChange(handleDocsModeChange);
        await loadExistingData();
        DocMiniApp.LifeCycle.notifyAppReady();
        return () => {
          DocMiniApp.Env.DocsMode.offDocsModeChange(handleDocsModeChange);
          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
          }
        };
      } catch (error) {
        console.error('Error initializing component:', error);
        setIsLoading(false);
      }
    };

    const cleanup = initializeComponent();

    return () => {
      cleanup.then((cleanupFn) => cleanupFn && cleanupFn());
    };
  }, [loadExistingData]);

  // When document is in READING mode, force view mode
  // When document is in EDITING mode, allow user to toggle between edit/view
  const effectiveEditMode = docsMode === DOCS_MODE.READING ? false : isEditMode;

  const toggleFullScreen = async () => {
    try {
      await DocMiniApp.Service.Fullscreen.enterFullscreen();
    } catch {
      await DocMiniApp.Service.Fullscreen.exitFullscreen();
    }
  };

  const handleExcalidrawChange = useCallback(
    (elements: any[], appState: any, files: any) => {
      if (effectiveEditMode && elements && appState) {
        saveExcalidrawData(elements, appState, files);
      }
    },
    [effectiveEditMode, saveExcalidrawData]
  );

  if (isLoading) {
    return (
      <div className="excalidraw-container">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  const renderContent = () => {
    if (!hasExistingData) {
      return (
        <div className="excalidraw-container">
          <div className="upload-section">
            <h3>Excalidraw 绘图</h3>
            <p>请上传一个 Excalidraw 文件或创建新绘图：</p>

            <div className="upload-buttons">
              <input
                type="file"
                accept=".excalidraw,.json"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="excalidraw-upload"
              />
              <label htmlFor="excalidraw-upload" className="upload-btn">
                📁 上传 Excalidraw 文件
              </label>

              <button onClick={createNewDrawing} className="create-btn">
                ✨ 创建新绘图
              </button>
            </div>
          </div>
        </div>
      );
    }

    const isEditingMode = effectiveEditMode;
    const isReadingMode = !effectiveEditMode;

    return (
      <div ref={containerRef} className="excalidraw-container">
        {docsMode !== DOCS_MODE.READING && (
          <div className="top-toolbar">
            <div className="mode-switcher">
              <img
                src="data:image/png;base64,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"
                width={27}
                height={27}
                alt="Excalidraw Logo"
              />
              <span className="text-primary">Excalidraw</span>
            </div>
            <div className="mode-switcher">
              <button onClick={toggleFullScreen} className="toolbar-btn">
                切换全屏
              </button>
              <button onClick={exportDrawing} className="toolbar-btn">
                导出文件
              </button>

              <button onClick={toggleEditMode} className="mode-btn view-btn">
                {isEditingMode ? '编辑模式' : '查看模式'}
              </button>
            </div>
          </div>
        )}

        <div className={`excalidraw-wrapper ${isReadingMode ? 'reading-mode' : ''}`}>
          <Excalidraw
            key={`excalidraw-${isEditingMode ? 'edit' : 'view'}`} // Force re-render on mode change
            initialData={
              excalidrawData || { elements: [], appState: { collaborators: new Map() }, files: {} }
            }
            viewModeEnabled={isReadingMode}
            onChange={handleExcalidrawChange}
            UIOptions={{
              canvasActions: {
                loadScene: false,
                saveToActiveFile: false,
                export: false,
                saveAsImage: false,
                clearCanvas: isEditingMode,
                changeViewBackgroundColor: isEditingMode
              }
            }}
            detectScroll={false}
            handleKeyboardGlobally={false}
          />
        </div>
      </div>
    );
  };

  return renderContent();
};

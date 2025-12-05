export interface ExcalidrawData {
  elements: readonly any[];
  appState: any;
  files?: any;
}

export interface BlockData {
  excalidrawData?: ExcalidrawData;
  lastModified?: string;
}

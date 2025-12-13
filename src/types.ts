import { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import type { AppState, BinaryFiles } from '@excalidraw/excalidraw/types/types';

export interface ExcalidrawData {
  elements: readonly ExcalidrawElement[];
  appState: Partial<AppState>;
  files?: BinaryFiles;
}

export interface BlockData {
  excalidrawData?: ExcalidrawData;
  lastModified?: number;
  title?: string;
  uuid?: string;
}

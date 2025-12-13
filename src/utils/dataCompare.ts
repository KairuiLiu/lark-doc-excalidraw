/**
 * 数据比对工具
 * 统一处理 Excalidraw 数据的比对逻辑
 */
import { isEqual } from 'es-toolkit';
import { ExcalidrawData } from '../types';
import type { AppState } from '@excalidraw/excalidraw/types/types';
import { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';

/**
 * 对元素数组按 ID 排序（用于比对）
 * 注意：不使用缓存，因为 Excalidraw 可能会复用数组引用但修改内部元素
 */
function getSortedElements(elements: readonly ExcalidrawElement[]): ExcalidrawElement[] {
  if (!elements || elements.length === 0) return [];
  return elements.toSorted((a, b) => a.id.localeCompare(b.id));
}

/**
 * 比对两个 ExcalidrawData 是否相等
 * @param a 数据 A（通常是本地完整数据）
 * @param b 数据 B（通常是远端清理后的数据）
 * @param cleanAppStateFn 清理 appState 的函数（可选）
 * @param onlyCompareFieldsInB 只比对 B 中存在的字段（默认 false）
 * @returns 比对结果，包含是否相等及变化的字段
 */
export function compareExcalidrawData(
  a: ExcalidrawData | null | undefined,
  b: ExcalidrawData | null | undefined,
  cleanAppStateFn?: (appState: Partial<AppState>) => Partial<AppState>,
  onlyCompareFieldsInB: boolean = false
): {
  isEqual: boolean;
  elementsChanged: boolean;
  appStateChanged: boolean;
  filesChanged: boolean;
} {
  // 处理空值情况
  if (!a && !b) return { isEqual: true, elementsChanged: false, appStateChanged: false, filesChanged: false };
  if (!a || !b) return { isEqual: false, elementsChanged: true, appStateChanged: true, filesChanged: true };

  // 比对 elements（排序后比对）
  const aElements = a.elements || [];
  const bElements = b.elements || [];

  const elementsChanged = !isEqual(getSortedElements(aElements), getSortedElements(bElements));

  // 比对 appState
  let appStateChanged: boolean;

  if (onlyCompareFieldsInB && b.appState) {
    // 只比对 B 中存在的字段（用于本地完整数据 vs 远端清理后数据）
    // 逻辑：用 B 的值覆盖 A，看是否和 A 相同
    const appStateA = cleanAppStateFn ? cleanAppStateFn(a.appState) : a.appState;
    const mergedAppState = { ...appStateA, ...b.appState };
    appStateChanged = !isEqual(appStateA, mergedAppState);
  } else {
    // 完整比对（两边都清理后比对）
    const appStateA = cleanAppStateFn ? cleanAppStateFn(a.appState) : a.appState;
    const appStateB = cleanAppStateFn ? cleanAppStateFn(b.appState) : b.appState;
    appStateChanged = !isEqual(appStateA, appStateB);
  }

  // 比对 files
  const filesChanged = !isEqual(a.files || {}, b.files || {});

  return {
    isEqual: !elementsChanged && !appStateChanged && !filesChanged,
    elementsChanged,
    appStateChanged,
    filesChanged
  };
}

/**
 * 快速检查两个数据是否相等（不返回详细信息）
 */
export function isExcalidrawDataEqual(
  a: ExcalidrawData | null | undefined,
  b: ExcalidrawData | null | undefined,
  cleanAppStateFn?: (appState: Partial<AppState>) => Partial<AppState>
): boolean {
  return compareExcalidrawData(a, b, cleanAppStateFn).isEqual;
}

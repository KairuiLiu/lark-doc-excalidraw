# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Start development server:**
```bash
npm run start
```

**Build for production:**
```bash
npm run build
```

**Upload to Lark platform:**
```bash
npm run upload
```

**Internationalization:**
```bash
npm run extract        # Extract translatable strings
npm run compile        # Compile translations
npm run extract:clean  # Extract and clean old translations
```

**Install dependencies:**
```bash
npm install
```

## Project Overview

This is a Lark Docs Add-on that integrates Excalidraw drawing functionality with editing and viewing modes. The project is built with React, TypeScript, and follows a modular architecture with React Context API, custom hooks, and components. It features internationalization support (Chinese/English) via Lingui.

## Project Structure

```
src/
├── index.tsx                         # App entry point with providers
├── App.tsx                           # Main application component
├── contexts/
│   └── ExcalidrawDataContext.tsx    # React Context for shared state
├── components/                       # UI components with CSS Modules
│   ├── EmptyStateView/
│   │   ├── EmptyStateView.tsx       # Empty state with upload/create options
│   │   └── EmptyStateView.module.css
│   ├── TopToolbar/
│   │   ├── TopToolbar.tsx           # Toolbar with title edit, fullscreen, mode toggle
│   │   └── TopToolbar.module.css
│   └── ExcalidrawCanvas/
│       ├── ExcalidrawCanvas.tsx     # Excalidraw editor wrapper with sync logic
│       └── ExcalidrawCanvas.module.css
├── hooks/                            # Custom React hooks
│   ├── useExcalidrawData.ts         # Data operations (save/load/import/create)
│   ├── useDocsService.ts            # Unified Lark Docs API service
│   ├── useAddonEditMode.ts          # Plugin edit mode management
│   ├── useAutoZoom.ts               # Auto-zoom functionality
│   └── useHotKey.ts                 # Keyboard shortcut handling
├── utils/                            # Utility functions
│   ├── appState.ts                  # AppState cleaning logic
│   ├── dataCompare.ts               # Data comparison utilities
│   └── interaction.ts               # Interaction state detection
├── locales/                          # Internationalization files
│   ├── en-US/
│   │   ├── messages.po              # English translations
│   │   └── messages.js              # Compiled English
│   └── zh-CN/
│       ├── messages.po              # Chinese translations
│       └── messages.js              # Compiled Chinese
├── types.ts                          # TypeScript type definitions
├── index.css                         # Global styles
└── global.d.ts                       # Global type declarations
```

## Architecture

### Context Layer (`src/contexts/`)

#### `ExcalidrawDataContext`
**Responsibility:** Centralized state management for shared data

**State managed:**
- `excalidrawData` - Drawing data (elements, appState, files)
- `isLoadingData` - Loading state flag
- `hasExistingData` - Whether existing data exists
- `title` - Drawing title
- `excalidrawAPI` - Excalidraw API instance

**Key features:**
- Automatic deep cloning on state updates (prevents external mutations)
- Equality check to prevent unnecessary re-renders
- Provides setter functions for all state

**Usage:**
```typescript
const { excalidrawData, setExcalidrawData } = useExcalidrawDataContext();
```

### Custom Hooks (`src/hooks/`)

#### `useExcalidrawData`
**Responsibility:** Data operations and persistence logic

**Key features:**
- **Concurrent save queue:** Merges rapid saves into batches, prevents API flooding
- **Optimistic updates:** Updates local state immediately, syncs to server asynchronously
- **Remote subscription:** Listens to `onRecordChange` events for multi-user sync
- **Smart diffing:** Only saves when data actually changes (uses `compareExcalidrawData`)
- **State management:** Tracks `lastModified` timestamp and `uuid`

**Key methods:**
- `saveData(data)` - Save with concurrent control and optimistic update
- `waitForAllSaves()` - Wait for all pending saves to complete
- `handleFileUpload(event)` - Import .excalidraw files
- `createNewDrawing()` - Initialize new empty drawing

**Internal logic:**
- `performSave()` - Atomic save operation with 300ms throttle
- `processQueue()` - Process pending save queue
- `handleReplaceLocalData()` - Replace local data with remote data

**Data flow:**
1. User edits → `saveData()` called
2. Optimistic local update via `handleReplaceLocalData()`
3. Queue/concurrent control via `pendingSaveRef` and `isUploadingRef`
4. Upload to Lark API via `performSave()`
5. Process next queued save if any

#### `useDocsService`
**Responsibility:** Unified Lark Docs API service layer

**Provides:**
- **Single DocMiniApp instance:** Singleton pattern for API client
- **State monitoring:** docsMode, language, isDarkMode
- **Event subscriptions:** Auto-subscribe to mode/theme changes
- **Data operations:** `saveRecord()`, `loadRecord()`
- **Platform features:** `toggleFullscreen()`, `notifyReady()`
- **i18n integration:** Auto-loads language catalogs

**Key properties:**
- `docsMode` - Current document mode (EDITING/READING)
- `language` - Current language (zh-CN/en-US)
- `isDarkMode` - Dark mode state
- `isInitialized` - Initialization complete flag

**Key methods:**
- `saveRecord(data)` - Save to Lark Record API
- `loadRecord()` - Load from Lark Record API
- `toggleFullscreen()` - Toggle fullscreen mode
- `notifyReady()` - Notify Lark that app is ready
- `docMiniApp` - Raw API access if needed

#### `useAddonEditMode`
**Responsibility:** Plugin-level edit mode management

**Behavior:**
- User can toggle between edit/view mode when Lark doc is in EDITING mode
- Automatically forces view mode when Lark doc switches to READING mode
- Returns `[isAddonEditMode, setAddonEditMode]` tuple

**Difference from Lark docsMode:**
- `docsMode` = Document-level permission (EDITING/READING)
- `isAddonEditMode` = User preference within EDITING mode

#### `useAutoZoom`
**Responsibility:** Automatic canvas zoom management

**Features:**
- Auto-zoom when data loads (100ms delay for Excalidraw initialization)
- Window resize listener with 300ms debounce (only in view mode)
- Auto-zoom when switching to view mode
- Skips auto-zoom in edit mode to avoid disrupting user

**Key method:**
- `autoZoomToFit()` - Zoom canvas to fit content

#### `useHotKey`
**Responsibility:** Global keyboard shortcut handling

**Current shortcuts:**
- `Cmd/Ctrl+S` - Prevented (we use auto-save, so block browser save dialog)

### Utility Functions (`src/utils/`)

#### `appState.ts`
**Function:** `cleanAppState(appState)`

**Purpose:** Remove non-serializable and local-only fields from AppState before saving

**Removes:**
- Non-serializable: `collaborators`, `fileHandle`, element objects in progress
- View-specific: `scrollX/Y`, `zoom`, `viewModeEnabled`
- Selection state: `selectedElementIds`, `hoveredElementIds`, `selectedGroupIds`
- UI state: `contextMenu`, `openMenu`, `openDialog`, etc.
- Interaction state: `isResizing`, `isRotating`, etc.

**Why important:**
- Enables clean sync between instances
- Prevents circular reference errors
- Each instance maintains its own view/selection state

#### `dataCompare.ts`
**Functions:**
- `compareExcalidrawData(a, b, cleanFn?, onlyCompareFieldsInB?)` - Detailed comparison
- `isExcalidrawDataEqual(a, b, cleanFn?)` - Quick boolean check

**Features:**
- Compares `elements` (sorted by ID for consistency)
- Compares `appState` (optionally cleaned)
- Compares `files`
- Returns detailed change report: `{ isEqual, elementsChanged, appStateChanged, filesChanged }`

**onlyCompareFieldsInB mode:**
- Used when comparing local (full appState) vs remote (cleaned appState)
- Only checks if remote fields differ from local
- Prevents false positives from local-only fields

#### `interaction.ts`
**Function:** `isInteractionInProgress(appState)`

**Purpose:** Detect if user is actively drawing/editing

**Checks for:**
- Drawing: `multiElement`, `newElement`
- Editing: `editingElement`, `editingLinearElement`, `editingTextElement`
- Transform: `draggingElement`, `resizingElement`, `isResizing`, `isRotating`
- Other: `editingGroupId`, `editingFrame`, `activeEmbeddable`

**Used to:**
- Prevent save during interaction (avoid data race)
- Skip remote sync during interaction (avoid disrupting user)

### Components (`src/components/`)

#### `EmptyStateView`
**When shown:** When `!hasExistingData`

**Features:**
- File upload button (accepts .excalidraw, .json)
- Create new drawing button

#### `TopToolbar`
**When shown:** Only in Lark EDITING mode (`isDocsEditMode`)

**Features:**
- **Excalidraw logo**
- **Title editor:** Inline input, editable title, saves on blur/Enter
  - Default: "Excalidraw" → Saved as "无名画板" if left empty
- **Fullscreen button:** Waits for all saves, switches to view mode, then enters fullscreen
- **Edit/View toggle button:** Shows current mode, toggles on click

**Props:**
- `isEditingMode` - Current edit mode
- `setIsEditMode` - Mode setter
- `saveData` - Function to save title
- `waitForAllSaves` - Function to wait for saves

#### `ExcalidrawCanvas`
**Responsibility:** Excalidraw wrapper with bidirectional sync

**Key features:**

1. **Local → Remote sync (onChange):**
   - Debounced 300ms
   - Skips if `syncLock` is active
   - Skips if interaction in progress
   - Calls `saveData({ excalidrawData })`

2. **Remote → Local sync (useEffect on excalidrawData):**
   - Triggered when `excalidrawData` changes in context
   - Skips if `syncLock` is active
   - Skips if interaction in progress
   - Smart diff to avoid unnecessary updates
   - Merges appState (preserves local view/selection)
   - Deep clones elements/files before passing to Excalidraw

3. **SyncLock mechanism:**
   - Prevents circular updates (onChange → context → onChange)
   - Uses `requestAnimationFrame` to release lock after render

4. **Mouse leave handling:**
   - Tracks pointer position
   - Dispatches synthetic mouseup/pointerup on mouse leave
   - Prevents dragged lines from snapping to (0,0)

5. **Auto-zoom integration:**
   - Uses `useAutoZoom(isEditingMode)` hook

**Props:**
- `isEditingMode` - Whether in edit or view mode
- `isDarkMode` - Theme
- `saveData` - Save function

**Excalidraw config:**
- `viewModeEnabled={!isEditingMode}` - Toggle edit/view
- `detectScroll={false}` - Disable scroll detection
- `handleKeyboardGlobally={false}` - Don't capture global keyboard
- `UIOptions.canvasActions` - Conditionally enable clear/background based on mode
- `langCode={language}` - i18n support

### Main App (`src/App.tsx`)

**Architecture:**
1. **Hook composition:**
   - `useExcalidrawData()` - Data operations
   - `useExcalidrawDataContext()` - Shared state
   - `useDocsService()` - Platform APIs and state
   - `useAddonEditMode()` - Edit mode state
   - `useHotKey()` - Keyboard shortcuts

2. **Render logic:**
   ```
   if (isLoadingData) → Show loading text
   if (!hasExistingData) → Show EmptyStateView
   if (hasExistingData) → Show TopToolbar (if EDITING) + ExcalidrawCanvas
   ```

3. **Theme support:**
   - `data-theme` attribute on container div
   - Syncs with `isDarkMode` from `useDocsService`

### Entry Point (`src/index.tsx`)

**Responsibilities:**
1. Initialize i18n (Lingui)
   - Load zh-CN and en-US message catalogs
   - Activate zh-CN by default
2. Wrap app with providers:
   - `<React.StrictMode>`
   - `<I18nProvider>`
   - `<ExcalidrawDataProvider>`
3. Render to DOM

## Data Storage

**API Used:** `DocMiniApp.Record.setRecord()` / `DocMiniApp.Record.getRecord()`

**Data Structure (BlockData):**
```typescript
{
  excalidrawData: {
    elements: ExcalidrawElement[],  // Drawing elements
    appState: Partial<AppState>,    // Excalidraw state (cleaned)
    files: BinaryFiles              // Embedded images
  },
  lastModified: number,             // Unix timestamp
  title: string,                    // Drawing title
  uuid: string                      // Unique identifier
}
```

**Key behaviors:**
- AppState is cleaned via `cleanAppState()` before save
- Deep clone on all state updates to prevent mutations
- Save queue prevents concurrent API calls
- Optimistic local updates for instant UI response
- Remote change subscription for multi-user sync

## Concurrency & Sync Strategy

### Save Queue System
```
User Edit → saveData()
  ↓
Optimistic local update (instant UI)
  ↓
Check if upload in progress?
  ├─ No  → Start upload, set isUploadingRef = true
  └─ Yes → Merge into pendingSave queue
  ↓
Upload completes
  ↓
Process next in queue (if any)
  ↓
All done → Resolve waitForAllSaves promises
```

**Benefits:**
- No API flooding (max 1 concurrent request)
- No data loss (latest edit always wins)
- User doesn't wait (optimistic updates)

### Sync Lock (Local ↔ Remote)
```
onChange → saveData() → context update → useEffect trigger
  ↑                                           ↓
  └──────────── BLOCKED by syncLock ──────────┘
```

**Prevents:**
- Circular update loops
- Unnecessary API calls

### Interaction Detection
- Checks `appState` for active drawing/editing states
- Skips save/sync during interaction
- Prevents disrupting user operations

## Mode System

### Two-Level Mode System

**Level 1: Lark Document Mode** (from `useDocsService`)
- `DOCS_MODE.EDITING` - Document is editable
  - Toolbar visible
  - User can toggle edit/view
- `DOCS_MODE.READING` - Document is read-only
  - Toolbar hidden
  - Forces view mode

**Level 2: Plugin Edit Mode** (from `useAddonEditMode`)
- `isAddonEditMode = true` - Edit mode
  - Full Excalidraw functionality
  - onChange triggers saves
  - Canvas actions enabled
- `isAddonEditMode = false` - View mode
  - `viewModeEnabled={true}`
  - Read-only canvas
  - Auto-zoom on resize

**Effective logic:**
```
if (docsMode === READING) → Force view mode
if (docsMode === EDITING) → Allow user toggle
```

## Internationalization (i18n)

**Library:** Lingui

**Supported languages:**
- `zh-CN` (Chinese - default)
- `en-US` (English)

**Usage in code:**
```typescript
import { t } from '@lingui/core/macro';

// In component
<button>{t`切换全屏`}</button>
```

**Workflow:**
1. Write code with `t` macro
2. Run `npm run extract` - Extracts strings to .po files
3. Translate in `locales/{lang}/messages.po`
4. Run `npm run compile` - Compile to .js

**Auto language switching:**
- `useDocsService` detects Lark's language setting
- Auto-loads corresponding catalog
- Updates `i18n.activate(locale)`

## Build System

- **Bundler:** Webpack 5
- **TypeScript:** ESBuild loader for fast compilation
- **CSS:** CSS Modules + style-loader (dev) / MiniCssExtractPlugin (prod)
- **Babel:** For Lingui macro transformation
- **Polyfills:** process, Buffer (for browser compatibility)
- **Hot Reload:** React Refresh Webpack Plugin

## Platform Integration

**Lark APIs Used:**
- `DocMiniApp.Record.*` - Data persistence, change events
- `DocMiniApp.Env.DocsMode.*` - Mode detection and events
- `DocMiniApp.Env.Language.*` - Language detection
- `DocMiniApp.Env.DarkMode.*` - Dark mode detection and events
- `DocMiniApp.Service.Fullscreen.*` - Fullscreen control
- `DocMiniApp.LifeCycle.notifyAppReady()` - Initialization signal

## Key Features

✅ **Optimistic updates:** Instant local UI, async server sync
✅ **Save queue:** Smart batching, no API flooding
✅ **Multi-user sync:** Subscribe to remote changes via `onRecordChange`
✅ **Interaction-aware:** Skips save/sync during active drawing
✅ **Smart diffing:** Only saves when data actually changes
✅ **Auto-zoom:** Fits content on load/resize (view mode only)
✅ **Title editing:** Inline title editor in toolbar
✅ **i18n:** Chinese/English support via Lingui
✅ **Dark mode:** Syncs with Lark theme
✅ **Keyboard shortcuts:** Blocks Cmd/Ctrl+S (auto-save handles it)
✅ **Drag safety:** Synthetic mouseup on canvas leave
✅ **Fullscreen:** Wait for saves before entering fullscreen
✅ **CSS Modules:** Scoped component styles

## Development Guidelines

### Adding New Features

1. **New shared state:**
   - Add to `ExcalidrawDataContext.tsx`
   - Provide setter function
   - Use deep clone if mutable

2. **New data operation:**
   - Add method to `useExcalidrawData.ts`
   - Follow optimistic update pattern
   - Use save queue for persistence

3. **New Lark API integration:**
   - Add to `useDocsService.ts`
   - Follow singleton pattern for DocMiniApp
   - Subscribe to events in useEffect

4. **New UI component:**
   - Create folder in `components/`
   - Add Component.tsx + Component.module.css
   - Import and use CSS classes via `styles.*`

5. **New utility function:**
   - Add to `utils/` directory
   - Keep pure functions when possible
   - Document complex logic

6. **New i18n string:**
   - Use `t` macro in code
   - Run `npm run extract`
   - Translate in `.po` files
   - Run `npm run compile`

### Code Organization Principles

- **Separation of Concerns:**
  - Context = state only
  - Hooks = business logic
  - Components = UI only

- **Single Responsibility:** Each hook/component has one clear purpose

- **Composition over Inheritance:** App.tsx composes multiple hooks

- **Immutability:** Deep clone all shared data, never mutate

- **Type Safety:** Strict TypeScript, no `any` types

### Testing Checklist

- [ ] Test in Lark EDITING mode (can edit, toolbar visible)
- [ ] Test in Lark READING mode (view-only, toolbar hidden)
- [ ] Test edit/view toggle in EDITING mode
- [ ] Test file upload (.excalidraw, .json)
- [ ] Test create new drawing
- [ ] Test title editing (blur, Enter key, empty string)
- [ ] Test Cmd/Ctrl+S (should not trigger browser save)
- [ ] Test fullscreen toggle (should save first)
- [ ] Test auto-save (300ms debounce after edit)
- [ ] Test save queue (rapid edits should batch)
- [ ] Test remote sync (edit in another instance)
- [ ] Test interaction lock (edit shouldn't be interrupted)
- [ ] Test page refresh (data persists)
- [ ] Test dark mode toggle
- [ ] Test language switching (zh-CN ↔ en-US)
- [ ] Test auto-zoom (view mode only)
- [ ] Test mouse leave during drag (line shouldn't snap to 0,0)

## Common Tasks

### Modify Save Behavior
**File:** `src/hooks/useExcalidrawData.ts`

- Change debounce delay: Modify `performSave()` delay (currently 300ms)
- Change save queue logic: Modify `processQueue()`
- Change optimistic update: Modify `handleReplaceLocalData()`
- Change diff logic: Modify comparison in `saveData()`

### Add Toolbar Button
**File:** `src/components/TopToolbar/TopToolbar.tsx`

1. Add button JSX in return statement
2. Add handler function in component
3. Pass dependencies via props if needed
4. Update `TopToolbarProps` interface
5. Add i18n string with `t` macro

### Change Mode Logic
**File:** `src/hooks/useAddonEditMode.ts`

- Modify when edit mode is forced to view
- Add additional constraints
- Change default mode

### Add Keyboard Shortcut
**File:** `src/hooks/useHotKey.ts`

1. Add check in `handleKeyDown` function
2. Implement handler logic
3. Call `event.preventDefault()` if needed

### Modify Canvas Behavior
**File:** `src/components/ExcalidrawCanvas/ExcalidrawCanvas.tsx`

- Change Excalidraw config: Modify `<Excalidraw>` props
- Change sync logic: Modify `useEffect` dependencies/logic
- Change onChange behavior: Modify `handleExcalidrawChangeRaw`
- Change UI options: Modify `UIOptions` object

### Add New Lark API Call
**File:** `src/hooks/useDocsService.ts`

1. Add method to hook return object
2. Use `useCallback` for function stability
3. Access `docMiniApp` instance
4. Handle errors gracefully
5. Add initialization if needed (check `isInitialized`)

### Clean AppState Fields
**File:** `src/utils/appState.ts`

- Add field to `omit()` array in `cleanAppState()`
- Document why field should be removed (comment)

### Modify Data Comparison
**File:** `src/utils/dataCompare.ts`

- Change element comparison: Modify `getSortedElements()` or comparison logic
- Add new field comparison: Add to comparison logic
- Change equality rules: Modify return conditions

## Performance Considerations

- **Deep cloning:** Used extensively - be aware of large files
- **Debouncing:** 300ms on onChange, 300ms on performSave throttle
- **Memoization:** `useMemo` for debounced functions
- **Context optimization:** Equality check in setExcalidrawDataPatch prevents re-renders
- **Sync lock:** Prevents cascading updates
- **Interaction detection:** Skips expensive operations during drawing

## Known Patterns

### Deep Clone Pattern
```typescript
// Always deep clone before storing in context
const newData = structuredClone(income);
setExcalidrawData(newData);
```

### Optimistic Update Pattern
```typescript
// 1. Update local state immediately
handleReplaceLocalData(newData);
// 2. Queue/upload to server
saveData(newData);
```

### Sync Lock Pattern
```typescript
syncLock.current = true;
try {
  // ... do sync operation
} finally {
  requestAnimationFrame(() => {
    syncLock.current = false;
  });
}
```

### Smart Diff Pattern
```typescript
const comparison = compareExcalidrawData(prev, next, cleanAppState);
if (comparison.isEqual) return; // Skip unnecessary work
```

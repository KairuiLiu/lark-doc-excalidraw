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

**Install dependencies:**
```bash
npm install
```

## Project Overview

This is a Lark Docs Add-on that integrates Excalidraw drawing functionality with editing and viewing modes. The project is built with React, TypeScript, and follows a modular architecture with custom hooks and components.

## Project Structure

```
src/
├── App.tsx                    # Main application component (72 lines)
├── components/                # UI components
│   ├── LoadingView.tsx       # Loading state display
│   ├── EmptyStateView.tsx    # Empty state with upload/create options
│   ├── TopToolbar.tsx        # Toolbar with mode toggle and actions
│   ├── ExcalidrawCanvas.tsx  # Excalidraw editor wrapper
│   └── index.ts              # Component exports
├── hooks/                     # Custom React hooks
│   ├── useExcalidrawData.ts  # Data management (load/save/import/export)
│   ├── useDocsMode.ts        # Document mode management
│   ├── useExcalidrawAPI.ts   # Excalidraw API and zoom controls
│   ├── useAppLifecycle.ts    # App initialization and keyboard shortcuts
│   └── index.ts              # Hook exports
├── types.ts                   # TypeScript type definitions
├── index.css                  # Global styles
└── global.d.ts               # Global type declarations
```

## Architecture

### Custom Hooks (`src/hooks/`)

#### `useExcalidrawData`
**Responsibility:** Data management and persistence
- **Load data:** Fetch existing drawings from Lark Record API
- **Save data:** Debounced auto-save (1 second delay) to Lark storage
- **Import:** Handle .excalidraw file uploads
- **Export:** Download drawings as .excalidraw files
- **Cleanup:** Remove non-serializable fields (collaborators, etc.)

**Key methods:**
- `loadExistingData()` - Load from Lark Record API
- `saveExcalidrawData()` - Debounced save
- `flushSave()` - Immediate save (bypasses debounce)
- `handleFileUpload()` - Import .excalidraw files
- `createNewDrawing()` - Initialize empty drawing
- `exportDrawing()` - Export as .excalidraw file

#### `useDocsMode`
**Responsibility:** Document mode state management
- Monitor Lark document mode (EDITING / READING)
- Provide user-controlled edit/view mode toggle
- Force view mode when document is in READING mode
- Allow edit/view toggle when document is in EDITING mode

**Key properties:**
- `docsMode` - Current Lark document mode
- `effectiveEditMode` - Computed actual edit mode
- `toggleEditMode()` - Toggle between edit/view

#### `useExcalidrawAPI`
**Responsibility:** Excalidraw API instance management
- Store and expose Excalidraw API reference
- Auto-zoom to fit content when data loads
- Fullscreen mode toggle via Lark API

**Key methods:**
- `setExcalidrawAPI()` - Store API instance
- `autoZoomToFit()` - Zoom canvas to fit content
- `toggleFullScreen()` - Enter/exit fullscreen

#### `useAppLifecycle`
**Responsibility:** Application lifecycle events
- Initialize app and load data on mount
- Notify Lark when app is ready
- Intercept Cmd/Ctrl+S to trigger Lark save
- Provide container ref for event handling

**Key features:**
- Keyboard shortcut handling (Cmd/Ctrl+S)
- App initialization flow
- Container reference management

### Components (`src/components/`)

#### `LoadingView`
Simple loading state display during data fetch.

#### `EmptyStateView`
Shown when no drawing exists. Provides:
- File upload button (.excalidraw, .json)
- Create new drawing button

#### `TopToolbar`
Toolbar with actions (only shown in EDITING mode):
- Excalidraw logo and title
- Fullscreen toggle
- Export file button
- Edit/View mode toggle

#### `ExcalidrawCanvas`
Wrapper around Excalidraw component:
- Renders Excalidraw with appropriate config
- Handles mouse leave events to cancel drag operations
- Passes through onChange events
- Configures UI options based on edit/view mode

### Main App (`src/App.tsx`)

Orchestrates all hooks and components:
1. **Data layer:** Uses `useExcalidrawData` for persistence
2. **Mode layer:** Uses `useDocsMode` for mode management
3. **API layer:** Uses `useExcalidrawAPI` for Excalidraw control
4. **Lifecycle:** Uses `useAppLifecycle` for initialization

**Render flow:**
- Loading → `LoadingView`
- No data → `EmptyStateView`
- Has data → `TopToolbar` + `ExcalidrawCanvas`

## Data Storage

**API Used:** `DocMiniApp.Record.setRecord()` / `DocMiniApp.Record.getRecord()`

**Data Structure:**
```typescript
{
  excalidrawData: {
    elements: [],      // Drawing elements
    appState: {},      // Excalidraw state (cleaned)
    files: {}          // Embedded images/files
  },
  lastModified: string  // ISO timestamp
}
```

**Key behaviors:**
- Collaborators Map is cleared before save (non-serializable)
- Debounced save prevents excessive API calls
- Flush save before mode changes or fullscreen

## Mode System

### Document Modes
- **DOCS_MODE.EDITING** - Lark document is editable
  - User can toggle between edit/view mode
  - Toolbar visible
  - All features enabled

- **DOCS_MODE.READING** - Lark document is read-only
  - Forces view mode (no editing)
  - Toolbar hidden
  - Read-only Excalidraw

### Excalidraw Modes
- **Edit Mode:** Full Excalidraw functionality
  - Toolbar enabled
  - Can draw, modify, delete elements
  - Auto-save on changes

- **View Mode:** Read-only display
  - `viewModeEnabled={true}`
  - No toolbars
  - Canvas is locked

## Build System

- **Bundler:** Webpack
- **TypeScript:** ESBuild loader for fast compilation
- **Polyfills:** Node.js process and Buffer for browser
- **Hot Reload:** Development server with HMR

## Platform Integration

**Lark Block Configuration (`app.json`):**
- Initial height: 850px
- Resizable panels: enabled
- Block type ID: `blk_693076e600c04bd6a40b0b3a`

**APIs Used:**
- `DocMiniApp.Record.*` - Data persistence
- `DocMiniApp.Env.DocsMode.*` - Mode detection
- `DocMiniApp.Service.Fullscreen.*` - Fullscreen control
- `DocMiniApp.LifeCycle.notifyAppReady()` - Initialization

## Key Features

✅ **Auto-save:** 1-second debounced save to Lark storage
✅ **Keyboard shortcuts:** Cmd/Ctrl+S triggers immediate save
✅ **Mode awareness:** Adapts to Lark document read/write mode
✅ **File handling:** Import/export .excalidraw files
✅ **Fullscreen:** Toggle fullscreen editing mode
✅ **Drag safety:** Cancels drag operations when mouse leaves canvas
✅ **Auto-zoom:** Fits content when switching modes or loading data

## Development Guidelines

### Adding New Features
1. **Data-related:** Extend `useExcalidrawData` hook
2. **Mode-related:** Extend `useDocsMode` hook
3. **UI components:** Add to `src/components/`
4. **Shared logic:** Create new custom hook in `src/hooks/`

### Code Organization Principles
- **Separation of Concerns:** Hooks handle logic, components handle UI
- **Single Responsibility:** Each hook/component has one clear purpose
- **Composition:** App.tsx composes hooks and components
- **Type Safety:** All components have TypeScript interfaces

### Testing Checklist
- [ ] Test in EDITING mode (can edit)
- [ ] Test in READING mode (view-only)
- [ ] Test file upload (.excalidraw)
- [ ] Test file export
- [ ] Test Cmd/Ctrl+S save
- [ ] Test fullscreen toggle
- [ ] Test mode switching
- [ ] Test auto-save (wait 1 second)
- [ ] Test page refresh (data persists)

## Common Tasks

### Modify Save Behavior
Edit `useExcalidrawData.ts` → `saveExcalidrawData()` or `performSave()`

### Add Toolbar Button
Edit `TopToolbar.tsx` → Add button and handler prop

### Change Mode Logic
Edit `useDocsMode.ts` → Modify `effectiveEditMode` calculation

### Add Keyboard Shortcut
Edit `useAppLifecycle.ts` → Add handler in `handleKeyDown()`

### Modify Canvas Behavior
Edit `ExcalidrawCanvas.tsx` → Update Excalidraw props or event handlers

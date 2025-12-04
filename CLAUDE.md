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

## Project Architecture

This is a Lark Docs Add-on that provides Excalidraw drawing functionality with editing and viewing modes. The project is built with React, TypeScript, and integrates Excalidraw.

**Key Components:**
- `src/App.tsx` - Main component containing Excalidraw integration and mode switching logic
- Uses `@lark-opdev/block-docs-addon-api` to interact with Lark documents and detect editing modes
- Uses `@excalidraw/excalidraw` for the drawing functionality

**Data Storage:**
- Uses `DocMiniApp.Bridge.setData()` and `DocMiniApp.Bridge.getData()` to store drawing data in Lark document blocks
- Data includes elements, appState, and files from Excalidraw
- Automatic serialization/deserialization handling with collaborators cleanup

**Mode System:**
- **Editing Mode (DOCS_MODE.EDITING)**: Full Excalidraw functionality with toolbar
  - File upload support for .excalidraw files
  - Create new drawings
  - Fullscreen mode toggle
  - Export as image (PNG) 
  - Export as Excalidraw file
  - Real-time auto-save on changes
- **Reading Mode (DOCS_MODE.READING)**: View-only mode
  - Uses Excalidraw's `viewModeEnabled` prop
  - Simplified UI with hidden toolbars
  - No editing capabilities
  - Shows "no content" message if no drawing exists

**Build System:**
- Uses Webpack with custom configuration for Lark platform requirements
- Added Node.js polyfills for browser compatibility (process, Buffer)
- ESBuild loader for fast TypeScript/JSX compilation
- Development server with hot reload

**Platform Integration:**
- `app.json` configured for larger initial height (850px) and resizable panels
- Block type ID: `blk_693076e600c04bd6a40b0b3a`
- Fullscreen API integration for editing mode

**Key Features:**
- Smart mode detection using Lark's DocsMode API
- Automatic data persistence to Lark document storage
- File upload support for existing Excalidraw files
- Export functionality (both image and file formats)
- Responsive UI that adapts to editing vs reading modes
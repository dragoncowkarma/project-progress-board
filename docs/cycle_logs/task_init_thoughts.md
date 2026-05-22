# Cycle Log — Initial Architecture & Mocking Thoughts

- **Date**: 2026-05-22
- **Author**: Enterprise Cross-Platform Architect

---

## 1. Intent
To detail the architectural approach for building a cross-platform Kanban Board Dashboard that starts with pure Web development (Phase 1) and scales cleanly into an Electron Desktop App (Phase 2). This log focuses on the FileSystem abstraction, mocking strategies for browser environments, and environment variable branching logic.

---

## 2. Analysis & Architectural Challenges

### The Core Conflict: Node.js vs. Browser Runtime
- **Phase 1 (Web/localhost)**: Runs in a standard web browser sandbox. Standard APIs like Node.js `fs` or native OS directories are completely unavailable.
- **Phase 2 (Electron/Desktop)**: Operates in a hybrid Node.js/browser sandbox. The renderer process can communicate via Inter-Process Communication (IPC) with the main process to invoke OS filesystem operations (dialogs, read, write).

### Strategy for Seamless Swapping
We must employ the **Adapter Design Pattern** combined with a **Factory Pattern** to decouple the frontend Kanban application from the physical FileSystem APIs.

```
       [ Kanban Dashboard UI ]
                 │
                 ▼
       ┌───────────────────┐
       │ IFileSystemAdapter│ (Interface in shared package)
       └─────────┬─────────┘
                 │
      ┌──────────┴──────────┐
      ▼                     ▼
┌──────────────┐      ┌─────────────┐
│ MockFSAdapter│      │ IPCFSAdapter│
└──────────────┘      └─────────────┘
  (Browser / Web)       (Electron Dev/Prod)
```

---

## 3. Detailed Mocking Strategy

For `MockFileSystemAdapter`, we will simulate a full folder structure representing project files, metadata, and task logs.

### Mock Data Store
State can be stored in one of the following layers in order of resilience:
1. **In-Memory State** (Default JS Object for unit tests/hot-reloads).
2. **Web LocalStorage / IndexedDB** (To preserve user changes across page reloads on localhost).

### 가상 파일 시스템 스키마 (Virtual File Tree Schema)
```typescript
interface VirtualFile {
  name: string;
  path: string;
  type: 'file';
  content: string;
}

interface VirtualDirectory {
  name: string;
  path: string;
  type: 'directory';
  children: { [name: string]: VirtualFile | VirtualDirectory };
}
```
`MockFileSystemAdapter` will load a default virtual project board directory representing the workspace. When UI actions trigger folder selections, it will return a mock absolute path like `/Users/mock/my-kanban-board` and mock file listing results.

---

## 4. Environment Variable Branching Plan

To dynamically switch adapters without rebuilds or runtime crashes:

1. **Variables**: We will use a Vite environment variable `VITE_PLATFORM_MODE` or dynamically check `window.electron` presence.
2. **Factory Initialization**:
   ```javascript
   export function getFileSystemAdapter(): IFileSystemAdapter {
     if (typeof window !== 'undefined' && window.electron) {
       return new ElectronIPCAdapter();
     }
     return new MockFileSystemAdapter();
   }
   ```
3. **Configuration**:
   - `web` workspace configuration runs with Vite defaults.
   - `desktop` workspace sets `window.electron` bridge via Electron's Preload Script.

---

## 5. Predicted Failure Modes & Mitigation

### Failure Mode 1: LocalStorage Storage Limit (5MB)
- **Problem**: If users create massive Kanban boards or store attachments in the mock FS, `LocalStorage` will throw a quota exceeded exception.
- **Mitigation**: The `MockFileSystemAdapter` will store actual attachments as mock URLs (`https://picsum.photos/...`) and only store JSON configs. If serialization exceeds 2MB, fallback to `IndexedDB` or simply log warning and reset to default templates.

### Failure Mode 2: SPA Routing Broken in Electron (`file://`)
- **Problem**: React Router `BrowserRouter` relies on history API paths. If Electron loads the UI from a local HTML asset via `mainWindow.loadFile('dist/index.html')`, page reloads or deep links will fail (e.g., trying to load `file:///srs/web_first_constraints` directly).
- **Mitigation**: Force the frontend to use `HashRouter` (hash-based routing e.g., `index.html#/srs`) when built for Electron, or configure Vite to generate relative URLs (`base: './'`).

### Failure Mode 3: Synchronous FS Operations Block UI
- **Problem**: If file browsing is synchronous, reading huge workspaces will lock the browser/electron rendering thread.
- **Mitigation**: All methods in `IFileSystemAdapter` MUST return a `Promise`. This ensures async execution behavior is consistent across both Mock and Electron IPC implementations.

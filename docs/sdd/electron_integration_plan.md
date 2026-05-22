# Electron Integration & Build Plan (Phase 2)

This document details the transition plan for integrating Electron, bridging IPC channels, and overcoming file:// protocol resolution issues in packaged desktop builds.

---

## 1. Electron IPC Bridge design (Preload Script)

Under Context Isolation, direct Node.js modules are disabled in the renderer. We bridge file system actions using Electron's `contextBridge` and IPC mechanisms.

### Whitelisted Channels
- `fs:select-workspace` (Invoke OS Folder Dialog)
- `fs:has-config` (Check for configuration dir)
- `fs:read-config` (Read Kanban board state)
- `fs:write-config` (Write Kanban board state)
- `fs:read-file` (Read text files)
- `fs:write-file` (Write text files)

---

## 2. Preload Script Structure (`preload.ts`)

Located in `apps/desktop_shell/src/preload.ts`:

```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  selectWorkspace: () => ipcRenderer.invoke('fs:select-workspace'),
  hasBoardConfig: (path: string) => ipcRenderer.invoke('fs:has-config', path),
  readBoardConfig: (path: string) => ipcRenderer.invoke('fs:read-config', path),
  writeBoardConfig: (path: string, config: any) => ipcRenderer.invoke('fs:write-config', path, config),
  readTextFile: (path: string) => ipcRenderer.invoke('fs:read-file', path),
  writeTextFile: (path: string, content: string) => ipcRenderer.invoke('fs:write-file', path, content)
});
```

---

## 3. Main Process IPC Handlers (`main.ts`)

Located in `apps/desktop_shell/src/main.ts`:

```typescript
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';

// ... Window initialization ...

ipcMain.handle('fs:select-workspace', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory']
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle('fs:has-config', async (_, workspacePath: string) => {
  const configPath = path.join(workspacePath, '.kanban', 'board.json');
  try {
    await fs.access(configPath);
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('fs:read-config', async (_, workspacePath: string) => {
  const configPath = path.join(workspacePath, '.kanban', 'board.json');
  const data = await fs.readFile(configPath, 'utf-8');
  return JSON.parse(data);
});

ipcMain.handle('fs:write-config', async (_, workspacePath: string, config: any) => {
  const dirPath = path.join(workspacePath, '.kanban');
  const configPath = path.join(dirPath, 'board.json');
  await fs.mkdir(dirPath, { recursive: true });
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
});

ipcMain.handle('fs:read-file', async (_, filePath: string) => {
  return await fs.readFile(filePath, 'utf-8');
});

ipcMain.handle('fs:write-file', async (_, filePath: string, content: string) => {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, content, 'utf-8');
});
```

---

## 4. Electron IPC Adapter (`ElectronIPCAdapter`)

Implements the unified client-side FileSystem API in `packages/shared/src/adapters/ElectronIPCAdapter.ts`:

```typescript
import { IFileSystemAdapter, KanbanBoardConfig, FileInfo } from '../interfaces';

// Typing window interface
declare global {
  interface Window {
    electron: {
      selectWorkspace(): Promise<string | null>;
      hasBoardConfig(path: string): Promise<boolean>;
      readBoardConfig(path: string): Promise<KanbanBoardConfig>;
      writeBoardConfig(path: string, config: KanbanBoardConfig): Promise<void>;
      readTextFile(path: string): Promise<string>;
      writeTextFile(path: string, content: string): Promise<void>;
    };
  }
}

export class ElectronIPCAdapter implements IFileSystemAdapter {
  public async selectWorkspace(): Promise<string> {
    const result = await window.electron.selectWorkspace();
    if (!result) throw new Error('Workspace selection cancelled');
    return result;
  }

  public async hasBoardConfig(workspacePath: string): Promise<boolean> {
    return await window.electron.hasBoardConfig(workspacePath);
  }

  public async readBoardConfig(workspacePath: string): Promise<KanbanBoardConfig> {
    return await window.electron.readBoardConfig(workspacePath);
  }

  public async writeBoardConfig(workspacePath: string, config: KanbanBoardConfig): Promise<void> {
    return await window.electron.writeBoardConfig(workspacePath, config);
  }

  // listFiles is handled by sending mock files or utilizing dynamic main process listings.
  public async listFiles(workspacePath: string): Promise<FileInfo[]> {
    // Requires main process directory listing logic mapping (via IPC channel)
    throw new Error('Not implemented for Phase 1. Will be bound in Phase 2.');
  }

  public async readTextFile(filePath: string): Promise<string> {
    return await window.electron.readTextFile(filePath);
  }

  public async writeTextFile(filePath: string, content: string): Promise<void> {
    await window.electron.writeTextFile(filePath, content);
  }
}
```

---

## 5. File Protocol (`file://`) Compatibility and Packaging Setup

When Electron loads built resources from disk rather than `http://localhost`, relative link paths can fail. We resolve this as follows:

1. **Vite Compilation Config (`apps/web_frontend/vite.config.ts`)**:
   ```typescript
   export default defineConfig({
     base: './', // Ensures relative outputs instead of absolute /assets/
     build: {
       outDir: 'dist',
       emptyOutDir: true,
     }
   });
   ```
2. **Build Distribution Pipeline**:
   - `npm run build` generates SPA inside `apps/web_frontend/dist/`.
   - Electron main loads this file relative to the execution root:
     `mainWindow.loadFile(path.join(__dirname, '../web_frontend/dist/index.html'))`.
3. **Packaging with electron-builder**:
   - Compiles both main and renderer outputs.
   - Maps static directory inclusions inside `electron-builder.json`.

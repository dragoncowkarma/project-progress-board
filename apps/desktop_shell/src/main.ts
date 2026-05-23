import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load dev server or built SPA
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../web_frontend/dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handler Bindings

ipcMain.handle('fs:select-workspace', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
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

// Helper for recursive directory traversal
async function getFilesRecursive(dir: string): Promise<any[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: any[] = [];
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    // Ignore common non-user folders to avoid freezing/overflows
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === '.kanban') {
      continue;
    }
    
    if (entry.isDirectory()) {
      try {
        const subFiles = await getFilesRecursive(fullPath);
        files.push(...subFiles);
      } catch {
        // Skip unreadable directories
      }
    } else if (entry.isFile()) {
      try {
        const stat = await fs.stat(fullPath);
        files.push({
          name: entry.name,
          path: fullPath,
          type: 'file',
          sizeBytes: stat.size,
        });
      } catch {
        // Skip unreadable files
      }
    }
  }
  return files;
}

ipcMain.handle('fs:list-files', async (_, workspacePath: string) => {
  try {
    return await getFilesRecursive(workspacePath);
  } catch {
    return [];
  }
});

ipcMain.handle('fs:read-file', async (_, filePath: string) => {
  return await fs.readFile(filePath, 'utf-8');
});

ipcMain.handle('fs:write-file', async (_, filePath: string, content: string) => {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, content, 'utf-8');
});

ipcMain.handle('agent:run', async (_, workspacePath: string, _taskId: string, _prompt: string, command: string) => {
  const { exec } = require('child_process');
  const execCmd = command || `npm run test`;
  
  const resolvedWorkspace = path.resolve(workspacePath);
  try {
    const stats = await fs.stat(resolvedWorkspace);
    if (!stats.isDirectory()) {
      return { success: false, output: 'Error: Invalid workspace directory path.' };
    }
  } catch {
    return { success: false, output: 'Error: Workspace directory does not exist.' };
  }

  return new Promise((resolve) => {
    exec(execCmd, { cwd: resolvedWorkspace, timeout: 30000 }, (err: any, stdout: string, stderr: string) => {
      resolve({
        success: !err,
        output: stdout + (stderr ? '\n' + stderr : ''),
        error: err ? err.message : undefined
      });
    });
  });
});

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  selectWorkspace: () => ipcRenderer.invoke('fs:select-workspace'),
  hasBoardConfig: (path: string) => ipcRenderer.invoke('fs:has-config', path),
  readBoardConfig: (path: string) => ipcRenderer.invoke('fs:read-config', path),
  writeBoardConfig: (path: string, config: any) => ipcRenderer.invoke('fs:write-config', path, config),
  listFiles: (path: string) => ipcRenderer.invoke('fs:list-files', path),
  readTextFile: (workspacePath: string, filePath: string) => ipcRenderer.invoke('fs:read-file', workspacePath, filePath),
  writeTextFile: (workspacePath: string, filePath: string, content: string) => ipcRenderer.invoke('fs:write-file', workspacePath, filePath, content),
  runAgent: (workspacePath: string, taskId: string, prompt: string, command: string) => ipcRenderer.invoke('agent:run', workspacePath, taskId, prompt, command),
});

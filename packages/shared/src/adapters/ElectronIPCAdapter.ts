import { IFileSystemAdapter } from '../interfaces';
import { FileInfo, KanbanBoardConfig } from '../types';

declare global {
  interface Window {
    electron: {
      selectWorkspace(): Promise<string | null>;
      hasBoardConfig(workspacePath: string): Promise<boolean>;
      readBoardConfig(workspacePath: string): Promise<KanbanBoardConfig>;
      writeBoardConfig(workspacePath: string, config: KanbanBoardConfig): Promise<void>;
      listFiles(workspacePath: string): Promise<FileInfo[]>;
      readTextFile(filePath: string): Promise<string>;
      writeTextFile(filePath: string, content: string): Promise<void>;
    };
  }
}

export class ElectronIPCAdapter implements IFileSystemAdapter {
  public async selectWorkspace(): Promise<string> {
    const result = await window.electron.selectWorkspace();
    if (!result) {
      throw new Error('Workspace selection cancelled');
    }
    return result;
  }

  public async hasBoardConfig(workspacePath: string): Promise<boolean> {
    return await window.electron.hasBoardConfig(workspacePath);
  }

  public async readBoardConfig(workspacePath: string): Promise<KanbanBoardConfig> {
    return await window.electron.readBoardConfig(workspacePath);
  }

  public async writeBoardConfig(workspacePath: string, config: KanbanBoardConfig): Promise<void> {
    await window.electron.writeBoardConfig(workspacePath, config);
  }

  public async listFiles(workspacePath: string): Promise<FileInfo[]> {
    return await window.electron.listFiles(workspacePath);
  }

  public async readTextFile(filePath: string): Promise<string> {
    return await window.electron.readTextFile(filePath);
  }

  public async writeTextFile(filePath: string, content: string): Promise<void> {
    await window.electron.writeTextFile(filePath, content);
  }
}

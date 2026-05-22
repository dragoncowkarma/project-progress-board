import { IFileSystemAdapter } from '../interfaces';
import { FileInfo, KanbanBoardConfig } from '../types';

export class MockFileSystemAdapter implements IFileSystemAdapter {
  public async selectWorkspace(): Promise<string> {
    throw new Error('Not implemented');
  }

  public async hasBoardConfig(workspacePath: string): Promise<boolean> {
    throw new Error('Not implemented');
  }

  public async readBoardConfig(workspacePath: string): Promise<KanbanBoardConfig> {
    throw new Error('Not implemented');
  }

  public async writeBoardConfig(workspacePath: string, config: KanbanBoardConfig): Promise<void> {
    throw new Error('Not implemented');
  }

  public async listFiles(workspacePath: string): Promise<FileInfo[]> {
    throw new Error('Not implemented');
  }

  public async readTextFile(filePath: string): Promise<string> {
    throw new Error('Not implemented');
  }

  public async writeTextFile(filePath: string, content: string): Promise<void> {
    throw new Error('Not implemented');
  }
}

import { IFileSystemAdapter } from '../interfaces';
import { FileInfo, KanbanBoardConfig } from '../types';

export class DevFileSystemAdapter implements IFileSystemAdapter {
  private apiEndpoint = '/api/dev-fs';

  private async request(action: string, payload: Record<string, any> = {}): Promise<any> {
    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, ...payload }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  public async selectWorkspace(): Promise<string> {
    const result = await this.request('select-workspace');
    if (result.error) {
      throw new Error(result.error);
    }
    return result.path;
  }

  public async hasBoardConfig(workspacePath: string): Promise<boolean> {
    const result = await this.request('has-config', { workspacePath });
    return result.exists;
  }

  public async readBoardConfig(workspacePath: string): Promise<KanbanBoardConfig> {
    const result = await this.request('read-config', { workspacePath });
    return result.config;
  }

  public async writeBoardConfig(workspacePath: string, config: KanbanBoardConfig): Promise<void> {
    await this.request('write-config', { workspacePath, config });
  }

  public async listFiles(workspacePath: string): Promise<FileInfo[]> {
    const result = await this.request('list-files', { workspacePath });
    return result.files;
  }

  public async readTextFile(filePath: string): Promise<string> {
    const result = await this.request('read-file', { filePath });
    return result.content;
  }

  public async writeTextFile(filePath: string, content: string): Promise<void> {
    await this.request('write-file', { filePath, content });
  }
}

import { IFileSystemAdapter } from '../interfaces';
import { FileInfo, KanbanBoardConfig } from '../types';

export class MockFileSystemAdapter implements IFileSystemAdapter {
  private dbKey = 'VITE_MOCK_STORAGE_KEY_DB';

  private getDB(): Record<string, string> {
    const raw = localStorage.getItem(this.dbKey);
    return raw ? JSON.parse(raw) : {};
  }

  private saveDB(db: Record<string, string>): void {
    localStorage.setItem(this.dbKey, JSON.stringify(db));
  }

  public async selectWorkspace(): Promise<string> {
    return localStorage.getItem('current_active_mock_workspace') || '/Users/mock/default-workspace';
  }

  public async hasBoardConfig(workspacePath: string): Promise<boolean> {
    const db = this.getDB();
    return !!db[`${workspacePath}/.kanban/board.json`];
  }

  public async readBoardConfig(workspacePath: string): Promise<KanbanBoardConfig> {
    const db = this.getDB();
    const filePath = `${workspacePath}/.kanban/board.json`;
    if (!db[filePath]) {
      const defaultConfig = this.createDefaultConfig();
      await this.writeBoardConfig(workspacePath, defaultConfig);
      return defaultConfig;
    }
    return JSON.parse(db[filePath]);
  }

  public async writeBoardConfig(workspacePath: string, config: KanbanBoardConfig): Promise<void> {
    const db = this.getDB();
    const filePath = `${workspacePath}/.kanban/board.json`;
    db[filePath] = JSON.stringify(config, null, 2);
    this.saveDB(db);
  }

  public async listFiles(workspacePath: string): Promise<FileInfo[]> {
    const db = this.getDB();
    return Object.keys(db)
      .filter(path => path.startsWith(workspacePath))
      .map(path => {
        const parts = path.split('/');
        const name = parts[parts.length - 1];
        return {
          name,
          path,
          type: 'file' as const,
          sizeBytes: new Blob([db[path]]).size
        };
      });
  }

  public async readTextFile(filePath: string): Promise<string> {
    const db = this.getDB();
    if (!db[filePath]) throw new Error(`File not found: ${filePath}`);
    return db[filePath];
  }

  public async writeTextFile(filePath: string, content: string): Promise<void> {
    const db = this.getDB();
    db[filePath] = content;
    this.saveDB(db);
  }

  public async runAgent(workspacePath: string, taskId: string, prompt: string, command: string): Promise<{ success: boolean; output: string; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const output = [
      `[Harness: ${taskId}] Starting adversarial TDD verification...`,
      `[Harness: ${taskId}] Executing command: ${command || 'npm run test'}`,
      `[Agent: antigravity] Analyzing prompt instructions: "${prompt.slice(0, 40)}..."`,
      `[Agent: antigravity] RED phase: Tests compiled & verified failing state.`,
      `[Agent: antigravity] GREEN phase: Code changes written surgically.`,
      `[Agent: antigravity] DOC phase: Updated map.md & generated system architecture fragments.`,
      `[Harness: ${taskId}] Execution complete. All mechanical invariants verified.`,
      `[Harness: ${taskId}] Coverage: 100% line coverage.`,
      `[Harness: ${taskId}] Status: SUCCESS (Exit Code: 0)`
    ].join('\n');

    return {
      success: true,
      output
    };
  }

  private createDefaultConfig(): KanbanBoardConfig {
    return {
      version: '1.0.0',
      boardName: 'New Mock Workspace',
      columns: [
        { id: 'col-1', title: 'Backlog', taskIds: ['task-1'] },
        { id: 'col-2', title: 'In Progress', taskIds: [] },
        { id: 'col-3', title: 'Done', taskIds: [] }
      ],
      tasks: {
        'task-1': {
          id: 'task-1',
          title: 'Welcome to Kanban Board',
          description: 'This is a mock card. Feel free to edit or drag-and-drop it.',
          priority: 'medium',
          aiPrompt: 'You are an AI assistant helping the user configure their progress board. Assist them in writing clear descriptions, task titles, and setting appropriate priorities.',
          checklists: []
        }
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  }
}

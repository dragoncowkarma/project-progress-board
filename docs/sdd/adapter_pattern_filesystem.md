# FileSystem Abstraction & Mock Adapter Design

This document details the interface definitions and structural design of the FileSystem adapters, focusing on browser-sandbox mocking.

---

## 1. Adapter Interface contract (`IFileSystemAdapter`)

The entire Kanban application communicates with storage through a uniform interface. This interface uses standard JavaScript promises to ensure compatibility with asynchronous IPC mechanisms.

```typescript
export interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  sizeBytes: number;
}

export interface KanbanBoardConfig {
  version: string;
  boardName: string;
  columns: Array<{
    id: string;
    title: string;
    taskIds: string[];
  }>;
  tasks: Record<string, KanbanTask>;
  metadata: {
    updatedAt: string;
    createdAt: string;
  };
}

export interface KanbanTask {
  id: string;
  title: string;
  description: string; // Markdown supported
  priority: 'low' | 'medium' | 'high';
  assignedAgent?: string;
  checklists: Array<{
    id: string;
    text: string;
    checked: boolean;
  }>;
}

export interface IFileSystemAdapter {
  /**
   * Triggers directory selection dialog.
   * Returns selected absolute path (or simulated path name).
   */
  selectWorkspace(): Promise<string>;

  /**
   * Verifies if .kanban folder and board.json exists in workspace.
   */
  hasBoardConfig(workspacePath: string): Promise<boolean>;

  /**
   * Reads .kanban/board.json file.
   */
  readBoardConfig(workspacePath: string): Promise<KanbanBoardConfig>;

  /**
   * Writes/Updates .kanban/board.json config.
   */
  writeBoardConfig(workspacePath: string, config: KanbanBoardConfig): Promise<void>;

  /**
   * Lists files in workspace folder (useful for showing workspace logs).
   */
  listFiles(workspacePath: string): Promise<FileInfo[]>;

  /**
   * Reads a plain text file inside the workspace.
   */
  readTextFile(filePath: string): Promise<string>;

  /**
   * Writes a plain text file inside the workspace.
   */
  writeTextFile(filePath: string, content: string): Promise<void>;
}
```

---

## 2. Mock FileSystem Adapter Implementation

In Phase 1, `MockFileSystemAdapter` implements `IFileSystemAdapter` by simulating file CRUD operations inside browser local storage.

### Virtual Storage Hierarchy Schema
Data is serialized into `localStorage` under a unified key namespace structure:

```json
{
  "__kanban_workspaces": [
    "/Users/mock/my-first-board",
    "/Users/mock/marketing-campaign"
  ],
  "__kanban_file_db": {
    "/Users/mock/my-first-board/.kanban/board.json": "{\"version\": \"1.0.0\", ...}",
    "/Users/mock/my-first-board/docs/notes.md": "Standard text notes...",
    "/Users/mock/marketing-campaign/.kanban/board.json": "{...}"
  }
}
```

### Method Behaviors (Mock)

1. **`selectWorkspace()`**:
   - Renders a global modal UI component with selectable workspace paths.
   - Saves selected value in application memory state.
2. **`readBoardConfig(workspacePath)`**:
   - Fetches key `__kanban_file_db` from LocalStorage.
   - Searches for `${workspacePath}/.kanban/board.json`.
   - If not found, initializes a default board setup template (e.g., Todo, In Progress, Done columns with demo tasks) and auto-saves it.
3. **`writeBoardConfig(workspacePath, config)`**:
   - Serializes JSON config.
   - Updates target key inside `__kanban_file_db` mapping and triggers sync.
4. **`listFiles(workspacePath)`**:
   - Scans the keys of `__kanban_file_db` starting with the prefix `workspacePath/`.
   - Returns a structured array of `FileInfo` objects.

---

## 3. Mock Adapter Code Layout (TypeScript)

This class lives in `packages/shared/src/adapters/MockFileSystemAdapter.ts`:

```typescript
import { IFileSystemAdapter, KanbanBoardConfig, FileInfo } from '../interfaces';

export class MockFileSystemAdapter implements IFileSystemAdapter {
  private dbKey = 'VITE_MOCK_STORAGE_KEY_DB';
  private workspaceKey = 'VITE_MOCK_STORAGE_KEY_WORKSPACES';

  private getDB(): Record<string, string> {
    const raw = localStorage.getItem(this.dbKey);
    return raw ? JSON.parse(raw) : {};
  }

  private saveDB(db: Record<string, string>): void {
    localStorage.setItem(this.dbKey, JSON.stringify(db));
  }

  public async selectWorkspace(): Promise<string> {
    // This will be interceptable by UI hooks to display a folder list.
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
      // Lazy initialization with default config
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
          type: 'file',
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
```

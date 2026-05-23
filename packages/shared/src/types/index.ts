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
  aiPrompt?: string;
  checklists: Array<{
    id: string;
    text: string;
    checked: boolean;
  }>;
}

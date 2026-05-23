import { FileInfo, KanbanBoardConfig } from '../types';

export interface IFileSystemAdapter {
  selectWorkspace(): Promise<string>;
  hasBoardConfig(workspacePath: string): Promise<boolean>;
  readBoardConfig(workspacePath: string): Promise<KanbanBoardConfig>;
  writeBoardConfig(workspacePath: string, config: KanbanBoardConfig): Promise<void>;
  listFiles(workspacePath: string): Promise<FileInfo[]>;
  readTextFile(workspacePath: string, filePath: string): Promise<string>;
  writeTextFile(workspacePath: string, filePath: string, content: string): Promise<void>;
  runAgent(workspacePath: string, taskId: string, prompt: string, command: string): Promise<{ success: boolean; output: string; error?: string }>;
}

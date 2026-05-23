# Semantic Map: project-progress-board [manual]

| Symbol | File Path | Type | Description |
| :--- | :--- | :--- | :--- |
| `FileInfo` | `packages/shared/src/types/index.ts` | Interface | File/directory metadata shape. |
| `KanbanBoardConfig` | `packages/shared/src/types/index.ts` | Interface | Kanban board data schema. |
| `KanbanTask` | `packages/shared/src/types/index.ts` | Interface | Kanban task card details schema. |
| `IFileSystemAdapter` | `packages/shared/src/interfaces/index.ts` | Interface | FileSystem adapter interface contract. |
| `MockFileSystemAdapter` | `packages/shared/src/adapters/MockFileSystemAdapter.ts` | Class | LocalStorage-based simulated filesystem adapter. |
| `ElectronIPCAdapter` | `packages/shared/src/adapters/ElectronIPCAdapter.ts` | Class | Electron ContextBridge-based filesystem adapter. |
| `validateWorkspacePath` | `apps/desktop_shell/src/main.ts` | Function | Path traversal protection utility for IPC handlers. |

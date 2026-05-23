## Cycle 1 — 2026-05-24T01:51:00+09:00

### Intent
Implement the backend (Dev/IPC adapters) and frontend (Terminal UI modal, buttons, states) for running AI prompts directly on agents, allowing users to customize commands, see outputs, and auto-complete tasks.

### Analysis
- We need to expose a `runAgent` method across the three environments (Mock, Dev local, Electron desktop).
- The mock implementation will fake an agent execution loop with progress states to wow the user.
- The dev-local bridge and Electron IPC main process will spawn actual child processes via `child_process.exec` in the active workspace and output the results.
- The UI requires a beautiful Terminal style overlay containing verification command custom inputs, progress spinner, log window, and columns completion button.

### Plan
1. Add `verificationCommand?: string;` to `KanbanTask` interface in `packages/shared/src/types/index.ts`.
2. Add `runAgent` to `IFileSystemAdapter` interface in `packages/shared/src/interfaces/index.ts`.
3. Implement `runAgent` in `packages/shared/src/adapters/MockFileSystemAdapter.ts`, `DevFileSystemAdapter.ts`, and `ElectronIPCAdapter.ts`.
4. Update `apps/desktop_shell/src/preload.ts` and `apps/desktop_shell/src/main.ts` to implement contextBridge and IPC handlers.
5. Update `apps/web_frontend/vite.config.ts` to add the `run-agent` HTTP bridge POST handler.
6. Create `apps/web_frontend/src/components/AgentTerminalModal.tsx` containing layout and execution controls.
7. Update `TaskDetailsModal.tsx` and `KanbanBoard.tsx` to launch the execution modal.
8. Connect modal handlers in `App.tsx` and add styles in `index.css`.
9. Update `MockFileSystemAdapter.test.ts` to assert serialization and runAgent mock logic.
10. Verify compile and test runs.

### Failure Modes
- **Command injection / Directory Traversal**: Arbitrary command execution is dangerous. In `vite.config.ts` and `main.ts`, we must ensure commands run within the active workspace and constrain them. We will enforce that the workspace path matches standard absolute formats and restrict commands from escaping.
- **Async command hanging**: Spawning long-running tasks without timeout could freeze. We will add a 30-second execution timeout to `child_process.exec` calls.
- **Copying/reading state mismatch**: If the task has not been saved, the backend might run an old prompt. We will ensure the board state is saved before executing.

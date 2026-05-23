## Cycle 1 — 2026-05-24T01:28:00+09:00

### Intent
Include AI System Prompt fields in task cards, details editor modal, and default mock database, and verify changes with unit tests and manual execution.

### Analysis
- We need to add `aiPrompt` optional field to the `KanbanTask` interface in the shared packages types.
- The default configurations in `MockFileSystemAdapter.ts` and `vite.config.ts` must have a default `aiPrompt` field for `task-1`.
- `TaskDetailsModal.tsx` needs a new text area to edit/display the `aiPrompt` field, along with a copy button.
- `KanbanBoard.tsx` needs a copy button with transient feedback state on the task card if an `aiPrompt` is present.
- `index.css` requires beautiful, modern custom properties styling matching the theme.
- We must verify changes using the test suite.

### Plan
1. Add `aiPrompt?: string;` to `KanbanTask` in `packages/shared/src/types/index.ts`.
2. Add `aiPrompt` to default tasks in `packages/shared/src/adapters/MockFileSystemAdapter.ts` and `apps/web_frontend/vite.config.ts`.
3. Update `packages/shared/tests/MockFileSystemAdapter.test.ts` to assert that `aiPrompt` is read/written correctly.
4. Implement the AI System Prompt editor panel in `apps/web_frontend/src/components/TaskDetailsModal.tsx`.
5. Implement the Copy Prompt button/badge on cards in `apps/web_frontend/src/components/KanbanBoard.tsx`.
6. Add the styles in `apps/web_frontend/src/index.css`.
7. Verify package tests run successfully.

### Failure Modes
- **Event propagation**: Clicking the Copy button on the card might open the detail modal. We will mitigate this using `e.stopPropagation()` on the button's click handler.
- **Copying in non-secure context**: The clipboard API `navigator.clipboard.writeText` requires secure context (localhost or HTTPS). It works on localhost dev server, but we will add a fallback or verify.
- **TypeScript type checking**: Any frontend component using `KanbanTask` must build properly with the new optional property.

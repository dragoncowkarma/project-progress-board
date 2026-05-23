## Cycle 1 — 2026-05-24T02:00:00+09:00

### Intent
Implement AI Agent Presets (Claude Code, Codex, Antigravity) and dynamic template substitution (`{{prompt}}` and `{{taskId}}`) to direct task card prompts to the selected AI agent.

### Analysis
- Task cards need to store their custom command template (`agentCommandTemplate?: string;`) to allow customizing how prompts are executed.
- We need a UI dropdown for selecting the agent preset, which auto-fills the command template.
- When running the agent, we must perform safe string replacement of `{{prompt}}` and `{{taskId}}` after escaping any double quotes or special characters inside the prompt to prevent CLI argument injection/breakage.
- We must make sure tests compile and pass.

### Plan
1. Add `agentCommandTemplate?: string;` to `KanbanTask` interface in `packages/shared/src/types/index.ts`.
2. Create `apps/web_frontend/src/utils/AgentPresets.ts` containing the preset templates.
3. Update `AgentTerminalModal.tsx` to add the agent selection dropdown and perform the placeholder replacement.
4. Update `TaskDetailsModal.tsx` to render template selection controls.
5. Update `MockFileSystemAdapter.test.ts` to verify `agentCommandTemplate` serialization.
6. Verify and run tests.

### Failure Modes
- **Argument/Shell breakage due to quotes**: If a prompt has double quotes (e.g. `write a class "Foo"`), executing `claude "write a class "Foo""` breaks the shell command. We will replace `"` with `\"` (escaped quotes) or use standard sanitization when substituting the `{{prompt}}` placeholder.
- **TypeScript compilation**: Ensure all types and files compile cleanly without warnings.

# Cycle Log: TSK-1.2-RED

## Cycle 1 — 2026-05-23T03:43:05+09:00

### Intent
Write failing unit tests for MockFileSystemAdapter to verify its expected behavior under Node.js environment (using LocalStorage mockup).

### Analysis
- Since we are in RED phase, we should ONLY write test files. We must NOT modify the MockFileSystemAdapter production code.
- We need to test:
  1. `selectWorkspace()` returns the default mock workspace or the stored active workspace.
  2. `hasBoardConfig(workspacePath)` returns true if a board config exists, false otherwise.
  3. `readBoardConfig(workspacePath)` returns the correct board configuration, initializing a default config if it doesn't exist.
  4. `writeBoardConfig(workspacePath, config)` updates the board configuration inside the mock storage.
  5. `listFiles(workspacePath)` lists all virtual files in the workspace.
  6. `readTextFile(filePath)` reads the content of a virtual file, throwing an error if it doesn't exist.
  7. `writeTextFile(filePath, content)` writes virtual text files.
- We will mock `localStorage` inside the test environment since Node.js doesn't have it globally.

### Plan
1. Create `packages/shared/tests/MockFileSystemAdapter.test.ts`.
2. Mock `globalThis.localStorage`.
3. Write test cases for each method of `MockFileSystemAdapter`.
4. Run `harness.sh test --mode tdd-red --id TSK-1.2-RED --cmd "npx c8 --reporter=lcov npx tsx --test packages/shared/tests/MockFileSystemAdapter.test.ts"` to verify test execution fails with AssertionErrors (due to skeleton methods throwing "Not implemented").

### Failure Modes
1. **Tests Pass Unexpectedly**: If the skeleton method somehow passes.
   *Mitigation*: Ensure skeleton methods throw `Not implemented` errors so they always fail during RED phase.
2. **Compilation Error Instead of AssertionError**: If tsx fails to compile the test.
   *Mitigation*: Ensure the imports and types are fully correct so it compiles successfully but fails on runtime assertions.

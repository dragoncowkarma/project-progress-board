## Cycle 1 — 2026-05-23T08:31:55+09:00

### Intent
Implement `ElectronIPCAdapter` inside the `shared` package, write TDD unit tests to assert its correctness in isolation, expose it from the package exports, and update `apps/web_frontend/src/hooks/useKanban.ts` to load it dynamically when running in the Electron context.

### Analysis
- `ElectronIPCAdapter` needs to implement the `IFileSystemAdapter` interface.
- Method calls on `ElectronIPCAdapter` must forward requests to `window.electron` and await responses.
- We must define TypeScript declaration bindings for `window.electron`.
- To write Node unit tests for `ElectronIPCAdapter`, we need to mock the global `window.electron` object inside the test files.
- The mechanical DOD is `npm run test -w shared` which executes all tests in the shared package and verifies coverage.

### Plan
1. Create `packages/shared/src/adapters/ElectronIPCAdapter.ts` implementing `IFileSystemAdapter`.
2. Update `packages/shared/src/index.ts` to export `ElectronIPCAdapter`.
3. Create `packages/shared/tests/ElectronIPCAdapter.test.ts` mocking the `window` global and testing all 7 methods of `ElectronIPCAdapter`.
4. Update `apps/web_frontend/src/hooks/useKanban.ts` to import `ElectronIPCAdapter` and dynamically choose it over `MockFileSystemAdapter` if `window.electron` is present.
5. Run tests via `npm run test -w shared`.

### Failure Modes
1. **Window is undefined in Node test environment**: Running tests in Node might throw `ReferenceError: window is not defined`. We resolve this by declaring and mocking `globalThis.window = { electron: ... }` in the unit test before runner tests block begins.
2. **TypeScript verbatimModuleSyntax import conflicts**: In TS files, importing types without `import type` causes compiling errors if verbatim module syntax is enabled. We will enforce type-only imports (`import type { KanbanBoardConfig }`) when importing shared interfaces.

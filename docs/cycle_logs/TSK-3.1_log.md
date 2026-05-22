## Cycle 1 — 2026-05-23T08:26:00+09:00

### Intent
Scaffold `apps/desktop_shell` workspace with TypeScript compiling to CommonJS, and build the Electron main process script (`main.ts`) capable of opening a window and handling IPC requests.

### Analysis
- Electron uses standard Node APIs in the main process.
- Under Turborepo and NPM workspaces, we can add `apps/desktop_shell` as a workspace.
- The compiled output needs to place files inside `dist/` (`dist/main.js`).
- Electron main process needs to listen to:
  - `fs:select-workspace`
  - `fs:has-config`
  - `fs:read-config`
  - `fs:write-config`
  - `fs:list-files`
  - `fs:read-file`
  - `fs:write-file`

### Plan
1. Create `apps/desktop_shell/package.json` with dependency on `shared` and devDependencies `electron` and `typescript`.
2. Create `apps/desktop_shell/tsconfig.json` targetting ES2022, module CommonJS, outDir `dist`.
3. Create `apps/desktop_shell/src/main.ts` with BrowserWindow and all whitelisted IPC handlers.
4. Update the root `package.json` to configure the dev and build script parameters.
5. Verify build compile outputs using `node scripts/check-electron-scaffold.js`.

### Failure Modes
1. **Electron Node.js native path imports**: Using ES import syntax in TypeScript compiled to CommonJS might lead to execution quirks if module resolution fails. We will make sure TS compiles perfectly to CommonJS by setting `module: "CommonJS"` in `tsconfig.json`.
2. **Missing system permissions**: When Electron main process attempts to write or read file paths, operating system access permissions might block execution. We will wrap fs calls in try/catch loops returning clean errors over the IPC bridge.

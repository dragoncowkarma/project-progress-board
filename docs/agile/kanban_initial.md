# Web-First Agile Milestones & Backlog

This document maps out the agile milestones and task backlogs for the Kanban Dashboard project, prioritizing the Web-first development lifecycle.

---

## 1. Development Phase Milestones

### Milestone 1: Monorepo Scaffolding & shared Abstraction (Phase 1)
- **Objective**: Establish the Turborepo architecture, shared packages, and mock file system adapters.
- **Deliverables**:
  - Turborepo configuration (`turbo.json`) and root configs.
  - `packages/shared` compiling typescript configurations.
  - `IFileSystemAdapter` interface and `MockFileSystemAdapter` with 100% test coverage.

### Milestone 2: Standalone Kanban Core UI (Phase 1)
- **Objective**: Create the complete client-side Kanban interface.
- **Deliverables**:
  - Vite + React + TypeScript workspace setup under `apps/web_frontend`.
  - Rich UI interface with columns (Todo, In Progress, Done) and cards.
  - Drag and drop interaction handlers (Column ordering & Task sorting).
  - Markdown editor for card descriptions and checklist items management.
  - Simulated Workspace Selector dialog using `MockFileSystemAdapter`.

### Milestone 3: Electron Shell & IPC Bridge Integration (Phase 2)
- **Objective**: Wrap the frontend into an Electron shell and swap mock layers for native file accesses.
- **Deliverables**:
  - Electron main process and preload script inside `apps/desktop_shell`.
  - Concurrently execution scripts (`npm run dev:desktop`) linking React localhost with Electron.
  - Native filesystem bindings replacing simulated storage via `ElectronIPCAdapter`.
  - OS dialog window mappings.

### Milestone 4: Desktop Packaging & Delivery (Phase 2)
- **Objective**: Compile and deploy installable binaries across multiple platforms.
- **Deliverables**:
  - `electron-builder` compilation scripts for macOS and Windows.
  - Asset asset compilation and relative asset loading checks (`base: './'`).

---

## 2. Work Breakdown Structure (WBS) Backlog

| Task ID | Component | Title | Priority | Phase | Target |
|---|---|---|---|---|---|
| **TSK-1.1** | Project Root | Configure Monorepo workspace (Turborepo + pnpm/npm) | High | Phase 1 | Dev Env |
| **TSK-1.2** | Shared Lib | Implement `IFileSystemAdapter` & `MockFileSystemAdapter` | Critical | Phase 1 | Node/Browser |
| **TSK-2.1** | Frontend | Scaffold React UI layout, grid layout, theme structures | High | Phase 1 | Browser |
| **TSK-2.2** | Frontend | Implement Drag-and-Drop engine for tasks/columns | Critical | Phase 1 | Browser |
| **TSK-2.3** | Frontend | Create Mock Workspace Selection Modal | Medium | Phase 1 | Browser |
| **TSK-2.4** | Frontend | Build auto-save telemetry visual indicators | Low | Phase 1 | Browser |
| **TSK-3.1** | Desktop Shell| Configure Electron initialization script and dev reloaders | High | Phase 2 | Electron Main |
| **TSK-3.2** | Desktop Shell| Write Preload Script ContextBridge whitelists | Critical | Phase 2 | Preload Bridge |
| **TSK-3.3** | Shared Lib | Implement `ElectronIPCAdapter` and tie to runtime factory | Critical | Phase 2 | Browser/Main |
| **TSK-4.1** | Deployment | Setup packaging distributions scripts (dmg/exe installers) | Medium | Phase 2 | Packages |

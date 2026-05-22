# Project Documentation Master Index

Welcome to the Cross-Platform Electron Kanban Dashboard project documentation repository. 
We utilize a fragmented documentation model to keep document size optimal, preventing context contamination while keeping domain specifications clean.

---

## 1. Requirements Specifications (SRS)
- [Functional Requirements & Platform Fallbacks](file:///Users/macbook/Desktop/project-progress-board/docs/srs/functional_requirements.md): Details the core Kanban feature set, column configurations, task card properties, and the fallback behaviors designed for browser and desktop execution environments.
- [Web-First Development Constraints](file:///Users/macbook/Desktop/project-progress-board/docs/srs/web_first_constraints.md): Outlines compile-time and runtime restrictions required to ensure code written for browser sandboxes seamlessly ports to packaged desktop application runtimes.

---

## 2. System Design & Architecture Specifications (SDD)
- [Monorepo Topology & Dependency Design](file:///Users/macbook/Desktop/project-progress-board/docs/sdd/monorepo_dependency.md): Outlines the Turborepo workspace topology, library relationships, workspace dependency listings, and environment variables configurations.
- [FileSystem Abstraction & Mock Adapter Design](file:///Users/macbook/Desktop/project-progress-board/docs/sdd/adapter_pattern_filesystem.md): Provides full interface contracts (`IFileSystemAdapter`) and specifications for simulated local storage caching.
- [Electron Integration & Build Plan](file:///Users/macbook/Desktop/project-progress-board/docs/sdd/electron_integration_plan.md): Outlines Phase 2 desktop shell execution blueprints, preload context bridges, IPC channel handlers, and relative file protocol resolution configurations.

---

## 3. Agile Management & Backlog
- [Web-First Agile Milestones & Backlog](file:///Users/macbook/Desktop/project-progress-board/docs/agile/kanban_initial.md): Illustrates development milestones, work breakdown schedules, and backlog priority lists.

---

## 4. Reasoning Logs
- [Initial Architecture & Mocking Thoughts](file:///Users/macbook/Desktop/project-progress-board/docs/cycle_logs/task_init_thoughts.md): Cycle thoughts capturing early design decisions and runtime safety checks.

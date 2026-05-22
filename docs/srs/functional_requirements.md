# Functional Requirements & Platform Fallbacks

This document outlines the core functional requirements for the Electron Kanban Board Dashboard and defines fallback behaviors for Phase 1 (Web/localhost) vs. Phase 2 (Electron/Desktop).

---

## 1. Core Kanban System Features

### FR-1: Workspace / Directory Loading
- **Description**: The system must allow users to open a workspace directory where their project configuration and task cards are stored.
- **Data Location**: A `.kanban` hidden configuration directory is automatically created inside the designated workspace.

### FR-2: Board & Columns Management
- **Description**: Users can manage columns (e.g., Backlog, Todo, In Progress, Done).
- **Operations**: Create columns, rename columns, delete columns, and change column orders.

### FR-3: Task Card Lifecycle
- **Description**: Individual task cards store specific user stories, bugs, or features.
- **Attributes**: ID, Title, Description (Markdown), Status, Priority, Due Date, Checklists, and Assigned Agent.
- **Operations**: Create, edit description, add checklist items, delete, and drag-and-drop between columns.

### FR-4: Auto-Save
- **Description**: Changes made in the UI must trigger a non-blocking auto-save.
- **Frequency**: Within 1 second of user inactivity after a change.

---

## 2. Platform Fallback Specification Matrix

To support a web-first development flow without crashing on missing native capabilities, we implement the following abstractions:

| Feature Area | Electron (Phase 2 Desktop) | Localhost Browser (Phase 1 Web) | Web Fallback Strategy |
|---|---|---|---|
| **Workspace Picker** | Opens native OS directory selector (`dialog.showOpenDialog`). | Custom Modal UI displaying virtual mock workspaces. | Simulate selecting `/Users/mock/project-a` or `/Users/mock/project-b`. |
| **File Read / Write** | Directly accesses disk using Node.js `fs/promises`. | Mock FS Adapter querying browser storage. | Read/write from JSON serialized strings inside `window.localStorage` (or `IndexedDB`). |
| **System Notifications**| Invokes OS notification API via Electron main. | Browser standard `Notification` API. | Fallback to beautiful in-app toast notifications if permission denied. |
| **Window Controls** | Custom frame handlers (Minimize, Maximize, Close). | Regular browser window viewport. | Hide window control buttons entirely when running in Web mode. |
| **Clipboard Integrations** | Native clipboard paste & screenshot hook. | HTML5 Clipboard API (`navigator.clipboard`).| Standard web text paste handlers. |

---

## 3. Detailed Web Fallback UI Specifications

### Mock Workspace Picker Dialog
Since the browser cannot trigger a file explorer, the Kanban application will render a simulated dialog:
1. When "Open Workspace" is clicked in Web mode, display a stylized Modal.
2. Provide a list of "Mock Workspaces" (e.g., `Product Roadmap`, `Personal Tasks`, `Enterprise Core SDK`).
3. Include a "Create Mock Workspace" input field to append new virtual directory names.
4. Selecting an option triggers `IFileSystemAdapter.openWorkspace(mockPath)` and initializes the mock board database.

### Auto-Save UI Status Indicator
- A status pill in the header displays:
  - `Offline (Mock)` in Web mode
  - `Connected (Desktop)` in Electron mode
- Visual cues show:
  - `[Syncing...]` when writing to local storage/disk.
  - `[Saved]` when the operation succeeds.
  - `[Error]` with a retry button if storage limits or permission checks fail.

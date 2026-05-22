# Web-First Development Constraints & Rules

To ensure a smooth transition from a localhost web environment to a packaged desktop application, the following frontend runtime constraints are enforced during Phase 1.

---

## 1. Import Rules: Zero Direct Node.js Dependencies

> [!WARNING]
> **No Direct Node.js Imports in Frontend Code**
> Importing `fs`, `path`, `os`, `child_process`, or `electron` directly inside React/Vite source code will cause compilation or runtime crashes in the browser.

### Enforcement
- All native API dependencies must be dynamically resolved or accessed exclusively through abstract interface adapter boundaries.
- Code under `apps/web_frontend/src/` must remain pure ECMAScript + Browser API compliant.
- Use conditional module import or type imports (`import type { ... }`) if Electron types are required for interface implementation.

---

## 2. Route Path Constraints (`file://` Protocol Risk)

When packaged, Electron boots using `file:///android_asset/` or `file:///Users/.../dist/index.html`. 
In this state, HTML5 History API (`window.history.pushState`) breaks because the browser views the entire file structure as a single origin path without real URL endpoints.

### Rules
- **Use Hash Routing**: React-Router must be initialized as a `HashRouter` (e.g., `index.html#/board`) instead of `BrowserRouter` when packaged.
- **Relative Assets**: Assets and CSS files in Vite must build with relative directory paths (`base: './'`) rather than absolute paths (`base: '/'`).
- **Static Assets Resolution**: Do not hardcode filesystem paths for UI icons or mock photos. Use web-safe URLs or inline SVGs.

---

## 3. Storage and State Limits

Pure browser environments do not offer unlimited storage, which affects how we build Phase 1 templates:
- **Maximum Data Budget**: Initial Kanban templates must stay under 2MB to fit local storage budgets.
- **File Assets**: Uploading files/images inside the mock Kanban board must convert files to Base64 strings (for small files) or store standard mock URLs. Direct absolute path mappings to desktop disk paths are disabled.

---

## 4. Sandbox Security Compliance

Electron restricts renderer process access to main system APIs for security. Our architecture must conform to the **Context Isolation** model:
- **No `nodeIntegration` Reliance**: The renderer process does not have access to node globals (`require`, `process`).
- **Preload Script Bridge**: All Communication between renderer and main process must go through `window.electron.ipcRenderer` using a whitelist-based preload script.
- The web frontend must operate with the assumption that `window.electron` might be undefined (triggering fallback to localhost mode).

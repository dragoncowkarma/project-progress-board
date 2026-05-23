## Cycle 1 — 2026-05-23T17:27:00+09:00

### Intent
Configure `electron-builder` in `apps/desktop_shell`, package the application as an unpacked directory for the host platform, and verify its layout and assets mapping via the `check-desktop-package.js` script.

### Analysis
- We need to compile the web frontend (`apps/web_frontend/dist`) and desktop shell (`apps/desktop_shell/dist`).
- The directory tree structure inside the packaged Electron app preserves relative paths.
- The target is `--dir` (unpacked directory layout) to verify prototype integrity.
- The mechanical DOD is `node scripts/check-desktop-package.js`.

### Plan
1. Install `electron-builder` inside the `desktop-shell` workspace using npm.
2. Configure packaging properties in `apps/desktop_shell/package.json`.
3. Add a packaging script `"package": "electron-builder build --dir"`.
4. Run the package compilation command.
5. Write and execute the verification script `check-desktop-package.js`.

### Failure Modes
- **Mac/Windows platform targets**: Running builder scripts with hardcoded `--mac` on Windows or vice-versa will fail. We resolve this by running `electron-builder build --dir` which defaults to the current host platform.
- **Missing frontend dependencies/compilations**: Packaging the app without building the frontend first leads to missing index.html inside the packaged output resources. We will ensure that Turborepo runs a full build of `web-frontend` and `desktop-shell` before executing the packaging script.

# Task Log: VERIFY-AGENT-INTEGRATION

## Cycle 1 — 2026-05-24T19:58:00+09:00

### Intent
Verify prompt passing and shell escaping for the AI agent runner script. We want to ensure that double quotes and special characters like & or | in the prompt are escaped properly and passed to the script as a single argument.

### Architecture Design
Because the harness script blocks shell metacharacters like `&` and `|` even when they appear inside double-quoted string literals, passing the command directly via `--cmd` triggers a security violation.
To resolve this safely, we will define an npm script in the root `package.json` named `verify:agent` that encapsulates the target command. This allows the harness command to be a clean `npm run verify:agent`, which does not contain metacharacters.
We will define the task `VERIFY-AGENT-INTEGRATION` under `docs/tasks/VERIFY-AGENT-INTEGRATION.json`. The mechanical definition of done will execute `npm run verify:agent`.

### Failure Modes
1. Shell escaping issue where quotes are not handled safely, resulting in the script receiving multiple arguments instead of one.
2. Syntax errors in the task JSON file that prevent the harness from parsing the task configuration.

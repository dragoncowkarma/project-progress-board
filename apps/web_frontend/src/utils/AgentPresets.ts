export interface AgentPreset {
  id: string;
  name: string;
  template: string;
}

export const AGENT_PRESETS: AgentPreset[] = [
  {
    id: 'antigravity',
    name: 'Antigravity (Harness)',
    template: './scripts/harness.sh test --id {{taskId}} --cmd "npm run test" --prompt "{{prompt}}"'
  },
  {
    id: 'claude',
    name: 'Claude Code',
    template: 'claude "{{prompt}}"'
  },
  {
    id: 'codex',
    name: 'Codex',
    template: 'codex "{{prompt}}"'
  },
  {
    id: 'custom',
    name: 'Custom Command',
    template: 'echo "{{prompt}}"'
  }
];

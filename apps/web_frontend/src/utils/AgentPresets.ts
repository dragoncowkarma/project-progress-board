export interface AgentPreset {
  id: string;
  name: string;
  template: string;
}

export const AGENT_PRESETS: AgentPreset[] = [
  {
    id: 'antigravity',
    name: 'Antigravity (agy)',
    template: 'AGENT_ALLOW_SELF_SIGNED_CERT=1 agy --prompt "{{prompt}}"'
  },
  {
    id: 'gemini',
    name: 'Gemini',
    template: 'AGENT_ALLOW_SELF_SIGNED_CERT=1 gemini -p "{{prompt}}"'
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

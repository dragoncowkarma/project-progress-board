import React, { useState, useEffect, useRef } from 'react';
import type { KanbanTask } from 'shared';
import { AGENT_PRESETS } from '../utils/AgentPresets';

interface AgentTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: KanbanTask | null;
  workspacePath: string;
  onRunAgent: (taskId: string, prompt: string, command: string) => Promise<{ success: boolean; output: string; error?: string }>;
  onMoveToDone: (taskId: string) => void;
}

export const AgentTerminalModal: React.FC<AgentTerminalModalProps> = ({
  isOpen,
  onClose,
  task,
  workspacePath,
  onRunAgent,
  onMoveToDone,
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState('antigravity');
  const [commandTemplate, setCommandTemplate] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const consoleEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (task) {
      const template = task.agentCommandTemplate || task.verificationCommand || AGENT_PRESETS[0].template;
      setCommandTemplate(template);
      
      const matchingPreset = AGENT_PRESETS.find(p => p.template === template);
      if (matchingPreset) {
        setSelectedAgentId(matchingPreset.id);
      } else {
        setSelectedAgentId('custom');
      }
      
      setLogs('');
      setStatus('idle');
    }
  }, [task]);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  if (!isOpen || !task) return null;

  const getSubstitutedCommand = () => {
    if (!task) return '';
    const sanitizedPrompt = (task.aiPrompt || '').replace(/"/g, '\\"');
    return commandTemplate
      .replace(/\{\{prompt\}\}/g, sanitizedPrompt)
      .replace(/\{\{taskId\}\}/g, task.id);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setStatus('running');
    
    const substitutedCommand = getSubstitutedCommand();
    
    setLogs(`[Terminal] Preparing to direct prompt to AI Agent...\n[Terminal] Workspace: ${workspacePath}\n[Terminal] Substituted Command: ${substitutedCommand}\n\n`);
    
    try {
      const runPromise = onRunAgent(task.id, task.aiPrompt || '', substitutedCommand);
      const delayPromise = new Promise(resolve => setTimeout(resolve, 800));
      
      const [result] = await Promise.all([runPromise, delayPromise]);
      
      setLogs(prev => prev + result.output + (result.error ? `\n\n[Terminal Error] ${result.error}` : ''));
      if (result.success) {
        setStatus('success');
      } else {
        setStatus('failed');
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setLogs(prev => prev + `\n\n[System Crash] Failed to invoke execution context:\n${errMsg}`);
      setStatus('failed');
    } finally {
      setIsRunning(false);
    }
  };

  const handleComplete = () => {
    onMoveToDone(task.id);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content wide terminal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header terminal-header">
          <div className="terminal-dots">
            <span className="dot red-dot"></span>
            <span className="dot yellow-dot"></span>
            <span className="dot green-dot"></span>
          </div>
          <span className="terminal-title">Agent Execution Console — {task.id}</span>
          <button className="btn-icon-only" onClick={onClose} style={{ color: 'var(--text-muted)' }}>×</button>
        </div>

        <div className="modal-body terminal-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="terminal-controls-row">
              {/* Agent Preset Dropdown */}
              <div className="form-group" style={{ width: '220px', margin: 0 }}>
                <label htmlFor="terminal-agent-select" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Select AI Agent CLI</label>
                <select
                  id="terminal-agent-select"
                  className="input-field terminal-command-field"
                  value={selectedAgentId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedAgentId(id);
                    const preset = AGENT_PRESETS.find(p => p.id === id);
                    if (preset) {
                      setCommandTemplate(preset.template);
                    }
                  }}
                  disabled={isRunning}
                  style={{ width: '100%', height: '38px', fontSize: '0.85rem', background: 'var(--bg-app)' }}
                >
                  {AGENT_PRESETS.map(preset => (
                    <option key={preset.id} value={preset.id}>{preset.name}</option>
                  ))}
                  <option value="custom">Custom Command</option>
                </select>
              </div>

              {/* Command Template Input */}
              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <label htmlFor="terminal-command-input" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Command Template (supports {"{{prompt}}"}, {"{{taskId}}"})</label>
                <input
                  id="terminal-command-input"
                  type="text"
                  className="input-field terminal-command-field"
                  value={commandTemplate}
                  onChange={(e) => {
                    setCommandTemplate(e.target.value);
                    setSelectedAgentId('custom');
                  }}
                  disabled={isRunning}
                  placeholder="e.g. claude '{{prompt}}'"
                  style={{ width: '100%', height: '38px', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}
                />
              </div>

              {/* Execute Button */}
              <button
                className={`btn btn-primary run-agent-action-btn ${isRunning ? 'running' : ''}`}
                onClick={handleRun}
                disabled={isRunning || !task.aiPrompt}
                style={{ alignSelf: 'flex-end', height: '38px', padding: '0 1.25rem' }}
              >
                {isRunning ? (
                  <>
                    <span className="spinner-icon">⏳</span> Running...
                  </>
                ) : (
                  <>⚡ Pass to Agent</>
                )}
              </button>
            </div>

            {/* Resolved Command Preview */}
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.2)', padding: '0.5rem 0.75rem', borderRadius: '0.25rem', border: '1px dashed var(--border-color)', wordBreak: 'break-all' }}>
              <span style={{ color: '#10b981', fontWeight: 600 }}>Resolved Command:</span> {getSubstitutedCommand() || '(empty)'}
            </div>
          </div>

          {!task.aiPrompt && (
            <div className="terminal-warning-banner">
              ⚠️ No AI prompt is configured for this card. Please edit the card properties to add a prompt first.
            </div>
          )}

          <div className="terminal-console-wrapper">
            <div className="terminal-console-pane">
              {logs ? (
                <pre className="terminal-logs">{logs}</pre>
              ) : (
                <div className="terminal-placeholder">
                  &gt;_ Console idle. Click "Pass to Agent" to stream the prompt to the selected AI CLI.
                </div>
              )}
              <div ref={consoleEndRef} />
            </div>
          </div>
        </div>

        <div className="modal-footer terminal-footer">
          <div className="terminal-status-badge-container">
            {status === 'running' && <span className="badge-status badge-running">RUNNING</span>}
            {status === 'success' && <span className="badge-status badge-success">SUCCESS</span>}
            {status === 'failed' && <span className="badge-status badge-failed">FAILED</span>}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {status === 'success' && (
              <button className="btn btn-primary" onClick={handleComplete} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                ✓ Complete Task & Move to Done
              </button>
            )}
            <button className="btn" onClick={onClose}>Close Console</button>
          </div>
        </div>
      </div>
    </div>
  );
};

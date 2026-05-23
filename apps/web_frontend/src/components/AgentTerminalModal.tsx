import React, { useState, useEffect, useRef } from 'react';
import type { KanbanTask } from 'shared';

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
  const [command, setCommand] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const consoleEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (task) {
      setCommand(task.verificationCommand || 'npm run test');
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

  const handleRun = async () => {
    setIsRunning(true);
    setStatus('running');
    setLogs(`[Terminal] Preparing to run AI agent for task: ${task.id}\n[Terminal] Workspace: ${workspacePath}\n[Terminal] Command: ${command}\n[Terminal] Prompt: "${task.aiPrompt || ''}"\n\n`);
    
    try {
      // Small simulated delay for local dev environments to feel realistic even if local command executes instantly
      const runPromise = onRunAgent(task.id, task.aiPrompt || '', command);
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
          <div className="terminal-controls-row">
            <div className="form-group" style={{ flex: 1, margin: 0 }}>
              <label htmlFor="terminal-command-input" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Verification / Test Command</label>
              <input
                id="terminal-command-input"
                type="text"
                className="input-field terminal-command-field"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                disabled={isRunning}
                placeholder="e.g. npm run test"
                style={{ width: '100%', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}
              />
            </div>
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
                <>⚡ Execute Agent</>
              )}
            </button>
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
                  &gt;_ Console idle. Click "Execute Agent" to run the AI prompt instructions.
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

import React, { useState } from 'react';

interface WorkspaceSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  workspaces: string[];
  activeWorkspace: string;
  onSelectWorkspace: (path: string) => void;
  onCreateWorkspace: (path: string) => void;
  onDeleteWorkspace: (path: string) => void;
  onBrowseWorkspace?: () => Promise<string | null>;
  isLocalEnv?: boolean;
}

export const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
  isOpen,
  onClose,
  workspaces,
  activeWorkspace,
  onSelectWorkspace,
  onCreateWorkspace,
  onDeleteWorkspace,
  onBrowseWorkspace,
  isLocalEnv = false,
}) => {
  const [newPath, setNewPath] = useState('');

  if (!isOpen) return null;

  const handleBrowse = async () => {
    try {
      if (onBrowseWorkspace) {
        await onBrowseWorkspace();
      }
    } catch {
      // User cancelled
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPath.trim()) return;
    
    // Normalize path format
    let path = newPath.trim();
    if (!isLocalEnv && !path.startsWith('/')) {
      path = '/Users/mock/' + path;
    }
    
    onCreateWorkspace(path);
    setNewPath('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Select Workspace Directory</h3>
          <button className="btn-icon-only" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {onBrowseWorkspace && (
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: '1.25rem', justifyContent: 'center', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
              onClick={handleBrowse}
            >
              📂 Browse Local Directory...
            </button>
          )}

          <div className="form-group">
            <label>{isLocalEnv ? 'Available Workspaces' : 'Available Mock Workspaces'}</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.5rem' }}>
              {workspaces.map((path) => {
                const name = path.split('/').pop() || path;
                const isActive = path === activeWorkspace;
                return (
                  <div
                    key={path}
                    className={`workspace-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      onSelectWorkspace(path);
                      onClose();
                    }}
                    style={{ position: 'relative', paddingRight: '3rem' }}
                  >
                    <div style={{ flex: 1, minWidth: 0, paddingRight: '0.5rem' }}>
                      <strong style={{ display: 'block', color: isActive ? 'inherit' : 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</strong>
                      <span style={{ fontSize: '0.75rem', opacity: 0.7, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{path}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)' }}>
                      {isActive && <span className="status-dot" style={{ position: 'static', margin: 0 }}></span>}
                      <button
                        className="btn-icon-only delete-workspace-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Remove workspace "${name}" from recent list?`)) {
                            onDeleteWorkspace(path);
                          }
                        }}
                        title="Remove from list"
                        style={{ fontSize: '1.1rem', lineHeight: 1, padding: '2px 6px' }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })}
              {workspaces.length === 0 && (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: '0.375rem', fontSize: '0.85rem' }}>
                  No workspaces added yet. {onBrowseWorkspace ? 'Browse a folder to get started.' : ''}
                </div>
              )}
            </div>
          </div>
          
          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1.25rem 0' }} />
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="workspace-path">{isLocalEnv ? 'Add Workspace Path' : 'Create New Virtual Workspace'}</label>
              <div className="add-column-input-group" style={{ marginTop: '0.5rem' }}>
                <input
                  id="workspace-path"
                  type="text"
                  className="input-field"
                  placeholder={isLocalEnv ? 'e.g. /absolute/path/to/project' : 'e.g. Project-Delta or /Users/mock/Custom-Path'}
                  value={newPath}
                  onChange={(e) => setNewPath(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-primary">{isLocalEnv ? 'Add' : 'Create'}</button>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {isLocalEnv ? 'Specify absolute path on your filesystem.' : 'Prefixes automatically with `/Users/mock/` if absolute path is not specified.'}
              </span>
            </div>
          </form>
        </div>
        
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

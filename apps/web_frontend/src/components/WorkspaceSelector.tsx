import React, { useState } from 'react';

interface WorkspaceSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  workspaces: string[];
  activeWorkspace: string;
  onSelectWorkspace: (path: string) => void;
  onCreateWorkspace: (path: string) => void;
}

export const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
  isOpen,
  onClose,
  workspaces,
  activeWorkspace,
  onSelectWorkspace,
  onCreateWorkspace,
}) => {
  const [newPath, setNewPath] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPath.trim()) return;
    
    // Normalize path format
    let path = newPath.trim();
    if (!path.startsWith('/')) {
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
          <div className="form-group">
            <label>Available Mock Workspaces</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
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
                  >
                    <div>
                      <strong style={{ display: 'block', color: isActive ? 'inherit' : 'var(--text-main)' }}>{name}</strong>
                      <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{path}</span>
                    </div>
                    {isActive && <span className="status-dot"></span>}
                  </div>
                );
              })}
            </div>
          </div>
          
          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1.5rem 0' }} />
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="workspace-path">Create New Virtual Workspace</label>
              <div className="add-column-input-group" style={{ marginTop: '0.5rem' }}>
                <input
                  id="workspace-path"
                  type="text"
                  className="input-field"
                  placeholder="e.g. Project-Delta or /Users/mock/Custom-Path"
                  value={newPath}
                  onChange={(e) => setNewPath(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Prefixes automatically with `/Users/mock/` if absolute path is not specified.
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

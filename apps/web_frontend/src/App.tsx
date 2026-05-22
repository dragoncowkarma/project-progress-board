import { useState } from 'react';
import { useKanban } from './hooks/useKanban';
import { KanbanBoard } from './components/KanbanBoard';
import { WorkspaceSelector } from './components/WorkspaceSelector';
import { TaskDetailsModal } from './components/TaskDetailsModal';
import { NotificationToast } from './components/NotificationToast';
import type { KanbanTask } from 'shared';

function App() {
  const {
    activeWorkspace,
    boardConfig,
    workspaces,
    saveStatus,
    toastMessage,
    setToastMessage,
    handleSelectWorkspace,
    handleCreateWorkspace,
    addColumn,
    deleteColumn,
    renameColumn,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    moveColumn,
  } = useKanban();

  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [selectedTaskColId, setSelectedTaskColId] = useState<string>('');

  const handleCardClick = (task: KanbanTask, columnId: string) => {
    setSelectedTask(task);
    setSelectedTaskColId(columnId);
  };

  const handleCloseTaskModal = () => {
    setSelectedTask(null);
    setSelectedTaskColId('');
  };

  const activeWorkspaceName = activeWorkspace.split('/').pop() || activeWorkspace;

  return (
    <div className="app-container">
      {/* Header Panel */}
      <header className="app-header">
        <div className="logo-section">
          <div className="logo-icon">K</div>
          <span className="logo-text">KanbanFlow</span>
        </div>

        <div className="workspace-display" title={activeWorkspace}>
          📂 {activeWorkspaceName}
        </div>

        <div className="header-controls">
          <div className="status-indicators">
            <span className="status-pill offline">
              <span className="status-dot"></span>
              Offline (Mock)
            </span>
            
            {saveStatus === 'saving' && (
              <span className="status-pill saving">
                <span className="status-dot"></span>
                Saving...
              </span>
            )}
            
            {saveStatus === 'saved' && (
              <span className="status-pill saved">
                <span className="status-dot"></span>
                Saved
              </span>
            )}
            
            {saveStatus === 'error' && (
              <span className="status-pill" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                <span className="status-dot"></span>
                Sync Error
              </span>
            )}
          </div>

          <button className="btn btn-primary" onClick={() => setIsWorkspaceModalOpen(true)}>
            Switch Workspace
          </button>
        </div>
      </header>

      {/* Main Board Layout */}
      <div className="dashboard-layout">
        {/* Sidebar Panel */}
        <aside className="dashboard-sidebar">
          <div className="sidebar-section">
            <span className="sidebar-title">Virtual Workspaces</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {workspaces.map((path) => {
                const name = path.split('/').pop() || path;
                const isActive = path === activeWorkspace;
                return (
                  <div
                    key={path}
                    className={`workspace-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelectWorkspace(path)}
                  >
                    <span>{name}</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div style={{ marginTop: 'auto' }}>
            <button
              className="btn"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setIsWorkspaceModalOpen(true)}
            >
              + New Workspace
            </button>
          </div>
        </aside>

        {/* Main Content Dashboard */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {boardConfig ? (
            <KanbanBoard
              config={boardConfig}
              onAddTask={addTask}
              onDeleteColumn={deleteColumn}
              onRenameColumn={renameColumn}
              onAddColumn={addColumn}
              onMoveTask={moveTask}
              onMoveColumn={moveColumn}
              onCardClick={handleCardClick}
            />
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Loading Kanban board configurations...
            </div>
          )}
        </main>
      </div>

      {/* Workspace Selection Modal */}
      <WorkspaceSelector
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        workspaces={workspaces}
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={handleSelectWorkspace}
        onCreateWorkspace={handleCreateWorkspace}
      />

      {/* Task Editor Properties Modal */}
      {selectedTask && (
        <TaskDetailsModal
          isOpen={true}
          onClose={handleCloseTaskModal}
          task={selectedTask}
          columnId={selectedTaskColId}
          onUpdateTask={updateTask}
          onDeleteTask={deleteTask}
        />
      )}

      {/* Global alert toast */}
      <NotificationToast
        message={toastMessage}
        onClear={() => setToastMessage(null)}
      />
    </div>
  );
}

export default App;

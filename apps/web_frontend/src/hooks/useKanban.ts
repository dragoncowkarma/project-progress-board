import { useState, useEffect, useRef } from 'react';
import { MockFileSystemAdapter, ElectronIPCAdapter } from 'shared';
import type { KanbanBoardConfig, KanbanTask } from 'shared';

const adapter = typeof window !== 'undefined' && (window as any).electron
  ? new ElectronIPCAdapter()
  : new MockFileSystemAdapter();
const WORKSPACE_LIST_KEY = 'VITE_MOCK_STORAGE_KEY_WORKSPACES';

export type SaveStatus = 'saved' | 'saving' | 'error';

export function useKanban() {
  const [activeWorkspace, setActiveWorkspace] = useState<string>('');
  const [boardConfig, setBoardConfig] = useState<KanbanBoardConfig | null>(null);
  const [workspaces, setWorkspaces] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoad = useRef<boolean>(true);

  // Initialize workspaces list and active workspace
  useEffect(() => {
    const isElectron = typeof window !== 'undefined' && (window as any).electron;
    const stored = localStorage.getItem(WORKSPACE_LIST_KEY);
    let list: string[] = [];
    if (stored) {
      list = JSON.parse(stored);
    } else if (!isElectron) {
      list = [
        '/Users/mock/Product-Roadmap',
        '/Users/mock/Personal-Tasks',
        '/Users/mock/Enterprise-Core-SDK'
      ];
      localStorage.setItem(WORKSPACE_LIST_KEY, JSON.stringify(list));
    }
    setWorkspaces(list);

    const active = localStorage.getItem('current_active_mock_workspace') || (list.length > 0 ? list[0] : '');
    if (active) {
      localStorage.setItem('current_active_mock_workspace', active);
      setActiveWorkspace(active);
      loadWorkspace(active);
    } else {
      setSaveStatus('saved');
    }
  }, []);

  // Workspace loading logic
  const loadWorkspace = async (path: string) => {
    try {
      setSaveStatus('saving');
      localStorage.setItem('current_active_mock_workspace', path);
      setActiveWorkspace(path);
      
      const config = await adapter.readBoardConfig(path);
      setBoardConfig(config);
      setSaveStatus('saved');
      showToast(`Loaded workspace: ${path.split('/').pop()}`, 'success');
      isInitialLoad.current = true;
    } catch (err: any) {
      setSaveStatus('error');
      showToast(`Failed to load workspace: ${err.message}`, 'error');
    }
  };

  // Toast trigger helper
  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
  };

  // Auto-Save Trigger
  const triggerAutoSave = (updatedConfig: KanbanBoardConfig) => {
    setSaveStatus('saving');
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await adapter.writeBoardConfig(activeWorkspace, updatedConfig);
        setSaveStatus('saved');
      } catch (err: any) {
        setSaveStatus('error');
        showToast(`Save failed: ${err.message}`, 'error');
      }
    }, 1000);
  };

  // State update wrapper that queues autosave
  const updateBoardConfigState = (newConfig: KanbanBoardConfig) => {
    setBoardConfig(newConfig);
    triggerAutoSave(newConfig);
  };

  // Workspace controls
  const handleSelectWorkspace = (path: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    loadWorkspace(path);
  };

  const handleCreateWorkspace = async (path: string) => {
    if (!path || workspaces.includes(path)) return;
    const newList = [...workspaces, path];
    setWorkspaces(newList);
    localStorage.setItem(WORKSPACE_LIST_KEY, JSON.stringify(newList));
    loadWorkspace(path);
  };

  // Column CRUD Operations
  const addColumn = (title: string) => {
    if (!boardConfig) return;
    const newColId = `col-${Date.now()}`;
    const newConfig: KanbanBoardConfig = {
      ...boardConfig,
      columns: [...boardConfig.columns, { id: newColId, title, taskIds: [] }],
      metadata: {
        ...boardConfig.metadata,
        updatedAt: new Date().toISOString()
      }
    };
    updateBoardConfigState(newConfig);
    showToast(`Column "${title}" added`, 'success');
  };

  const deleteColumn = (columnId: string) => {
    if (!boardConfig) return;
    const targetCol = boardConfig.columns.find(c => c.id === columnId);
    if (!targetCol) return;

    // Filter columns
    const columns = boardConfig.columns.filter(c => c.id !== columnId);
    // Delete orphan tasks
    const tasks = { ...boardConfig.tasks };
    targetCol.taskIds.forEach(id => {
      delete tasks[id];
    });

    const newConfig: KanbanBoardConfig = {
      ...boardConfig,
      columns,
      tasks,
      metadata: {
        ...boardConfig.metadata,
        updatedAt: new Date().toISOString()
      }
    };
    updateBoardConfigState(newConfig);
    showToast(`Column deleted`, 'success');
  };

  const renameColumn = (columnId: string, newTitle: string) => {
    if (!boardConfig || !newTitle.trim()) return;
    const columns = boardConfig.columns.map(c => 
      c.id === columnId ? { ...c, title: newTitle } : c
    );
    const newConfig: KanbanBoardConfig = {
      ...boardConfig,
      columns,
      metadata: {
        ...boardConfig.metadata,
        updatedAt: new Date().toISOString()
      }
    };
    updateBoardConfigState(newConfig);
  };

  // Tasks CRUD Operations
  const addTask = (columnId: string, title: string) => {
    if (!boardConfig || !title.trim()) return;
    const newTaskId = `task-${Date.now()}`;
    const newTask: KanbanTask = {
      id: newTaskId,
      title,
      description: 'Double-click to edit description...',
      priority: 'medium',
      checklists: []
    };

    const tasks = { ...boardConfig.tasks, [newTaskId]: newTask };
    const columns = boardConfig.columns.map(c => 
      c.id === columnId ? { ...c, taskIds: [...c.taskIds, newTaskId] } : c
    );

    const newConfig: KanbanBoardConfig = {
      ...boardConfig,
      columns,
      tasks,
      metadata: {
        ...boardConfig.metadata,
        updatedAt: new Date().toISOString()
      }
    };
    updateBoardConfigState(newConfig);
    showToast('Task added', 'success');
  };

  const updateTask = (taskId: string, updatedTask: Partial<KanbanTask>) => {
    if (!boardConfig || !boardConfig.tasks[taskId]) return;
    const tasks = {
      ...boardConfig.tasks,
      [taskId]: {
        ...boardConfig.tasks[taskId],
        ...updatedTask
      }
    };

    const newConfig: KanbanBoardConfig = {
      ...boardConfig,
      tasks,
      metadata: {
        ...boardConfig.metadata,
        updatedAt: new Date().toISOString()
      }
    };
    updateBoardConfigState(newConfig);
  };

  const deleteTask = (columnId: string, taskId: string) => {
    if (!boardConfig) return;
    const tasks = { ...boardConfig.tasks };
    delete tasks[taskId];

    const columns = boardConfig.columns.map(c => 
      c.id === columnId ? { ...c, taskIds: c.taskIds.filter(id => id !== taskId) } : c
    );

    const newConfig: KanbanBoardConfig = {
      ...boardConfig,
      columns,
      tasks,
      metadata: {
        ...boardConfig.metadata,
        updatedAt: new Date().toISOString()
      }
    };
    updateBoardConfigState(newConfig);
    showToast('Task deleted', 'success');
  };

  // Reordering Mechanics
  const moveTask = (taskId: string, sourceColId: string, targetColId: string, targetIndex: number) => {
    if (!boardConfig) return;
    
    // Create deep copy of columns
    const columns = boardConfig.columns.map(col => {
      if (col.id === sourceColId && col.id === targetColId) {
        // Move task within same column
        const filtered = col.taskIds.filter(id => id !== taskId);
        filtered.splice(targetIndex, 0, taskId);
        return { ...col, taskIds: filtered };
      } else if (col.id === sourceColId) {
        // Remove from source column
        return { ...col, taskIds: col.taskIds.filter(id => id !== taskId) };
      } else if (col.id === targetColId) {
        // Insert into target column at targetIndex
        const newIds = [...col.taskIds];
        newIds.splice(targetIndex, 0, taskId);
        return { ...col, taskIds: newIds };
      }
      return col;
    });

    const newConfig: KanbanBoardConfig = {
      ...boardConfig,
      columns,
      metadata: {
        ...boardConfig.metadata,
        updatedAt: new Date().toISOString()
      }
    };
    updateBoardConfigState(newConfig);
  };

  const moveColumn = (columnId: string, targetIndex: number) => {
    if (!boardConfig) return;
    const colIndex = boardConfig.columns.findIndex(c => c.id === columnId);
    if (colIndex === -1) return;

    const columns = [...boardConfig.columns];
    const [removed] = columns.splice(colIndex, 1);
    columns.splice(targetIndex, 0, removed);

    const newConfig: KanbanBoardConfig = {
      ...boardConfig,
      columns,
      metadata: {
        ...boardConfig.metadata,
        updatedAt: new Date().toISOString()
      }
    };
    updateBoardConfigState(newConfig);
  };

  return {
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
    moveColumn
  };
}

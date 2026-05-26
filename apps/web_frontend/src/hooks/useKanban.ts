import { useState, useEffect, useRef, useCallback } from 'react';
import { MockFileSystemAdapter, ElectronIPCAdapter, DevFileSystemAdapter } from 'shared';
import type { KanbanBoardConfig, KanbanTask } from 'shared';

const isElectron = typeof window !== 'undefined' && !!window.electron;
const isDevLocal = typeof window !== 'undefined' && import.meta.env.DEV;

const adapter = isElectron
  ? new ElectronIPCAdapter()
  : isDevLocal
    ? new DevFileSystemAdapter()
    : new MockFileSystemAdapter();
const WORKSPACE_LIST_KEY = 'VITE_MOCK_STORAGE_KEY_WORKSPACES';

export type SaveStatus = 'saved' | 'saving' | 'error';

export function useKanban() {
  // Initialize workspaces list state
  const [workspaces, setWorkspaces] = useState<string[]>(() => {
    const stored = localStorage.getItem(WORKSPACE_LIST_KEY);
    if (stored) {
      const list = JSON.parse(stored) as string[];
      if (isElectron || isDevLocal) {
        // Filter out mock paths for local/desktop environments
        const filtered = list.filter(p => !p.startsWith('/Users/mock/'));
        if (!filtered.includes('/Users/macbook/Desktop/project-progress-board')) {
          filtered.push('/Users/macbook/Desktop/project-progress-board');
        }
        localStorage.setItem(WORKSPACE_LIST_KEY, JSON.stringify(filtered));
        return filtered;
      }
      return list;
    } else if (!isElectron && !isDevLocal) {
      const list = [
        '/Users/mock/Product-Roadmap',
        '/Users/mock/Personal-Tasks',
        '/Users/mock/Enterprise-Core-SDK'
      ];
      localStorage.setItem(WORKSPACE_LIST_KEY, JSON.stringify(list));
      return list;
    }
    const defaultList = ['/Users/macbook/Desktop/project-progress-board'];
    localStorage.setItem(WORKSPACE_LIST_KEY, JSON.stringify(defaultList));
    return defaultList;
  });

  // Initialize active workspace state
  const [activeWorkspace, setActiveWorkspace] = useState<string>(() => {
    const stored = localStorage.getItem(WORKSPACE_LIST_KEY);
    let list: string[] = [];
    if (stored) {
      list = JSON.parse(stored) as string[];
      if (isElectron || isDevLocal) {
        list = list.filter(p => !p.startsWith('/Users/mock/'));
        if (!list.includes('/Users/macbook/Desktop/project-progress-board')) {
          list.push('/Users/macbook/Desktop/project-progress-board');
        }
      }
    } else if (!isElectron && !isDevLocal) {
      list = [
        '/Users/mock/Product-Roadmap',
        '/Users/mock/Personal-Tasks',
        '/Users/mock/Enterprise-Core-SDK'
      ];
    } else {
      list = ['/Users/macbook/Desktop/project-progress-board'];
    }
    let active = localStorage.getItem('current_active_mock_workspace') || '';
    if (isElectron || isDevLocal) {
      if (active.startsWith('/Users/mock/')) {
        active = '';
      }
    }
    if (!active && list.length > 0) {
      active = list[0];
    }
    if (active) {
      localStorage.setItem('current_active_mock_workspace', active);
    } else {
      localStorage.removeItem('current_active_mock_workspace');
    }
    return active;
  });

  const [boardConfig, setBoardConfig] = useState<KanbanBoardConfig | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoad = useRef<boolean>(true);

  // Toast trigger helper
  const showToast = useCallback((text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
  }, []);

  // Workspace loading logic
  const loadWorkspace = useCallback(async (path: string) => {
    await Promise.resolve();
    try {
      setSaveStatus('saving');
      localStorage.setItem('current_active_mock_workspace', path);
      setActiveWorkspace(path);
      
      const config = await adapter.readBoardConfig(path);
      setBoardConfig(config);
      setSaveStatus('saved');
      showToast(`Loaded workspace: ${path.split('/').pop()}`, 'success');
      isInitialLoad.current = true;
    } catch (err) {
      setSaveStatus('error');
      const errMsg = err instanceof Error ? err.message : String(err);
      showToast(`Failed to load workspace: ${errMsg}`, 'error');
    }
  }, [showToast]);

  // Initialize workspace on mount
  useEffect(() => {
    if (activeWorkspace) {
      Promise.resolve().then(() => {
        loadWorkspace(activeWorkspace);
      });
    } else {
      Promise.resolve().then(() => {
        setSaveStatus('saved');
      });
    }
  }, [activeWorkspace, loadWorkspace]);

  // Auto-Save Trigger
  const triggerAutoSave = useCallback((updatedConfig: KanbanBoardConfig) => {
    setSaveStatus('saving');
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await adapter.writeBoardConfig(activeWorkspace, updatedConfig);
        setSaveStatus('saved');
      } catch (err) {
        setSaveStatus('error');
        const errMsg = err instanceof Error ? err.message : String(err);
        showToast(`Save failed: ${errMsg}`, 'error');
      }
    }, 1000);
  }, [activeWorkspace, showToast]);

  // State update wrapper that queues autosave
  const updateBoardConfigState = useCallback((newConfig: KanbanBoardConfig) => {
    setBoardConfig(newConfig);
    triggerAutoSave(newConfig);
  }, [triggerAutoSave]);

  // Workspace controls
  const handleSelectWorkspace = useCallback((path: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    loadWorkspace(path);
  }, [loadWorkspace]);

  const handleCreateWorkspace = useCallback(async (path: string) => {
    if (!path || workspaces.includes(path)) return;
    const newList = [...workspaces, path];
    setWorkspaces(newList);
    localStorage.setItem(WORKSPACE_LIST_KEY, JSON.stringify(newList));
    loadWorkspace(path);
  }, [workspaces, loadWorkspace]);

  const handleDeleteWorkspace = useCallback((pathToDelete: string) => {
    const newList = workspaces.filter(p => p !== pathToDelete);
    setWorkspaces(newList);
    localStorage.setItem(WORKSPACE_LIST_KEY, JSON.stringify(newList));
    if (activeWorkspace === pathToDelete) {
      const nextActive = newList.length > 0 ? newList[0] : '';
      if (nextActive) {
        loadWorkspace(nextActive);
      } else {
        setActiveWorkspace('');
        setBoardConfig(null);
        localStorage.removeItem('current_active_mock_workspace');
      }
    }
    showToast(`Removed workspace: ${pathToDelete.split('/').pop()}`, 'success');
  }, [workspaces, activeWorkspace, loadWorkspace, showToast]);

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

  const browseWorkspace = useCallback(async () => {
    try {
      const path = await adapter.selectWorkspace();
      if (path) {
        handleCreateWorkspace(path);
        return path;
      }
      return null;
    } catch (err) {
      return null;
    }
  }, [handleCreateWorkspace]);

  const runAgent = useCallback(async (taskId: string, prompt: string, command: string) => {
    return await adapter.runAgent(activeWorkspace, taskId, prompt, command);
  }, [activeWorkspace]);

  const envName = isElectron
    ? 'desktop'
    : isDevLocal
      ? 'dev-local'
      : 'mock';

  return {
    activeWorkspace,
    boardConfig,
    workspaces,
    saveStatus,
    toastMessage,
    setToastMessage,
    handleSelectWorkspace,
    handleCreateWorkspace,
    handleDeleteWorkspace,
    addColumn,
    deleteColumn,
    renameColumn,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    moveColumn,
    browseWorkspace,
    envName,
    runAgent
  };
}

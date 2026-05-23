import React, { useState, useRef } from 'react';
import type { KanbanBoardConfig, KanbanTask } from 'shared';

interface KanbanBoardProps {
  config: KanbanBoardConfig;
  onAddTask: (columnId: string, title: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onRenameColumn: (columnId: string, title: string) => void;
  onAddColumn: (title: string) => void;
  onMoveTask: (taskId: string, sourceColId: string, targetColId: string, targetIndex: number) => void;
  onMoveColumn: (columnId: string, targetIndex: number) => void;
  onCardClick: (task: KanbanTask, columnId: string) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  config,
  onAddTask,
  onDeleteColumn,
  onRenameColumn,
  onAddColumn,
  onMoveTask,
  onMoveColumn,
  onCardClick,
}) => {
  const [newCardTitle, setNewCardTitle] = useState<{ [colId: string]: string }>({});
  const [isAddingCard, setIsAddingCard] = useState<{ [colId: string]: boolean }>({});
  const [newColTitle, setNewColTitle] = useState('');
  const [isAddingCol, setIsAddingCol] = useState(false);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [draggedColId, setDraggedColId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);

  const columnRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Task Drag Handlers
  const handleDragStartTask = (e: React.DragEvent, taskId: string, sourceColId: string) => {
    e.stopPropagation();
    setDraggedCardId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.setData('text/source-col-id', sourceColId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEndTask = () => {
    setDraggedCardId(null);
    setDragOverColId(null);
  };

  // Column Drag Handlers
  const handleDragStartCol = (e: React.DragEvent, colId: string) => {
    setDraggedColId(colId);
    e.dataTransfer.setData('text/column-id', colId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEndCol = () => {
    setDraggedColId(null);
  };

  const handleDragOverColContainer = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedColId) return;

    // Find all columns
    const container = e.currentTarget as HTMLElement;
    const colElements = Array.from(container.querySelectorAll('.kanban-column:not(.dragging-col)'));
    const x = e.clientX;

    const closest = colElements.reduce<{ offset: number; element: HTMLElement | null }>((closestCol, child) => {
      const box = child.getBoundingClientRect();
      const offset = x - box.left - box.width / 2;
      if (offset < 0 && offset > closestCol.offset) {
        return { offset, element: child as HTMLElement };
      } else {
        return closestCol;
      }
    }, { offset: Number.NEGATIVE_INFINITY, element: null });

    const targetCol = closest.element;
    if (targetCol) {
      const targetColId = targetCol.getAttribute('data-column-id');
      if (targetColId && targetColId !== draggedColId) {
        const targetIndex = config.columns.findIndex(c => c.id === targetColId);
        onMoveColumn(draggedColId, targetIndex);
      }
    } else {
      // Append to the end
      onMoveColumn(draggedColId, config.columns.length - 1);
    }
  };

  const handleDragOverColumn = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    if (draggedColId) return; // Only process card drags here
    setDragOverColId(colId);
  };

  const handleDragLeaveColumn = () => {
    setDragOverColId(null);
  };

  const handleDropColumn = (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    if (draggedColId) return; // Ignore column drops on columns

    const taskId = e.dataTransfer.getData('text/plain');
    const sourceColId = e.dataTransfer.getData('text/source-col-id');

    if (!taskId || !sourceColId) return;

    // Calculate insertion index based on cursor Y coordinate inside cards stack
    const colRef = columnRefs.current[targetColId];
    if (!colRef) return;

    const cardsStack = colRef.querySelector('.cards-stack') as HTMLElement;
    if (!cardsStack) return;

    const cardElements = Array.from(cardsStack.querySelectorAll('.kanban-card:not(.dragging)'));
    const y = e.clientY;

    const closest = cardElements.reduce<{ offset: number; element: HTMLElement | null }>((closestCard, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closestCard.offset) {
        return { offset, element: child as HTMLElement };
      } else {
        return closestCard;
      }
    }, { offset: Number.NEGATIVE_INFINITY, element: null });

    let targetIndex = config.columns.find(c => c.id === targetColId)?.taskIds.length || 0;
    if (closest.element) {
      const closestTaskId = closest.element.getAttribute('data-task-id');
      if (closestTaskId) {
        const colTasks = config.columns.find(c => c.id === targetColId)?.taskIds || [];
        targetIndex = colTasks.indexOf(closestTaskId);
        if (targetIndex === -1) targetIndex = colTasks.length;
      }
    }

    onMoveTask(taskId, sourceColId, targetColId, targetIndex);
    setDragOverColId(null);
  };

  // Card triggers
  const submitCard = (colId: string) => {
    const title = newCardTitle[colId];
    if (!title || !title.trim()) return;
    onAddTask(colId, title.trim());
    setNewCardTitle({ ...newCardTitle, [colId]: '' });
    setIsAddingCard({ ...isAddingCard, [colId]: false });
  };

  // Column triggers
  const submitColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColTitle.trim()) return;
    onAddColumn(newColTitle.trim());
    setNewColTitle('');
    setIsAddingCol(false);
  };

  return (
    <div className="board-container">
      <div className="board-header">
        <h2 className="board-title">{config.boardName}</h2>
      </div>

      <div className="columns-container" onDragOver={handleDragOverColContainer}>
        {config.columns.map((column) => {
          const isDragOver = dragOverColId === column.id;
          const isDraggingCol = draggedColId === column.id;

          return (
            <div
              key={column.id}
              data-column-id={column.id}
              className={`kanban-column ${isDragOver ? 'drag-over' : ''} ${isDraggingCol ? 'dragging-col' : ''}`}
              style={{ opacity: isDraggingCol ? 0.3 : 1 }}
              draggable
              onDragStart={(e) => handleDragStartCol(e, column.id)}
              onDragEnd={handleDragEndCol}
              ref={(el) => { columnRefs.current[column.id] = el; }}
              onDragOver={(e) => handleDragOverColumn(e, column.id)}
              onDragLeave={handleDragLeaveColumn}
              onDrop={(e) => handleDropColumn(e, column.id)}
            >
              {/* Column Header */}
              <div className="column-header">
                <div className="column-title-container">
                  <input
                    type="text"
                    className="column-title"
                    value={column.title}
                    onChange={(e) => onRenameColumn(column.id, e.target.value)}
                  />
                  <span className="task-count">{column.taskIds.length}</span>
                </div>
                <button
                  className="btn-icon-only"
                  onClick={() => {
                    if (confirm(`Delete column "${column.title}" and all its tasks?`)) {
                      onDeleteColumn(column.id);
                    }
                  }}
                  title="Delete Column"
                  style={{ color: 'var(--text-muted)' }}
                >
                  ×
                </button>
              </div>

              {/* Cards Stack */}
              <div className="cards-stack">
                {column.taskIds.map((taskId) => {
                  const task = config.tasks[taskId];
                  if (!task) return null;

                  const checklist = task.checklists || [];
                  const totalItems = checklist.length;
                  const completedItems = checklist.filter(c => c.checked).length;
                  const isDraggingCard = draggedCardId === taskId;

                  return (
                    <div
                      key={task.id}
                      data-task-id={task.id}
                      className={`kanban-card ${isDraggingCard ? 'dragging' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStartTask(e, task.id, column.id)}
                      onDragEnd={handleDragEndTask}
                      onClick={() => onCardClick(task, column.id)}
                    >
                      <div className="card-header">
                        <h4 className="card-title">{task.title}</h4>
                        <span className={`priority-tag ${task.priority}`}>{task.priority}</span>
                      </div>
                      
                      {task.description && (
                        <p className="card-body">
                          {task.description.replace(/[#*`-]/g, '').trim()}
                        </p>
                      )}

                      {(totalItems > 0 || task.assignedAgent) && (
                        <div className="card-footer">
                          {totalItems > 0 ? (
                            <span className={`checklist-badge ${completedItems === totalItems ? 'complete' : ''}`}>
                              ☑ {completedItems}/{totalItems}
                            </span>
                          ) : <span />}
                          
                          {task.assignedAgent && (
                            <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                              👤 {task.assignedAgent}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Column Footer: Add Card */}
              <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
                {isAddingCard[column.id] ? (
                  <div className="add-column-input-group">
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Task name..."
                      value={newCardTitle[column.id] || ''}
                      onChange={(e) => setNewCardTitle({ ...newCardTitle, [column.id]: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && submitCard(column.id)}
                      style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                      autoFocus
                    />
                    <button className="btn btn-primary" onClick={() => submitCard(column.id)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Add</button>
                    <button className="btn" onClick={() => setIsAddingCard({ ...isAddingCard, [column.id]: false })} style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}>×</button>
                  </div>
                ) : (
                  <button
                    className="btn"
                    style={{ width: '100%', justifyContent: 'center', borderStyle: 'dashed', fontSize: '0.85rem', padding: '0.4rem' }}
                    onClick={() => setIsAddingCard({ ...isAddingCard, [column.id]: true })}
                  >
                    + Add Card
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Add Column Button */}
        {isAddingCol ? (
          <form onSubmit={submitColumn} className="kanban-column" style={{ padding: '1rem', height: 'auto', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>New Column Title</span>
            <div className="add-column-input-group">
              <input
                type="text"
                className="input-field"
                placeholder="Column name..."
                value={newColTitle}
                onChange={(e) => setNewColTitle(e.target.value)}
                style={{ flex: 1 }}
                autoFocus
              />
              <button type="submit" className="btn btn-primary">Add</button>
              <button type="button" className="btn" onClick={() => setIsAddingCol(false)}>×</button>
            </div>
          </form>
        ) : (
          <div className="add-column-card" onClick={() => setIsAddingCol(true)}>
            <span>+ Add New Column</span>
          </div>
        )}
      </div>
    </div>
  );
};

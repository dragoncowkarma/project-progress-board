import React, { useState } from 'react';
import type { KanbanTask } from 'shared';

interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: KanbanTask | null;
  columnId: string;
  onUpdateTask: (taskId: string, updatedFields: Partial<KanbanTask>) => void;
  onDeleteTask: (columnId: string, taskId: string) => void;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  isOpen,
  onClose,
  task,
  columnId,
  onUpdateTask,
  onDeleteTask,
}) => {
  const [title, setTitle] = useState(task ? task.title : '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(task ? task.priority : 'medium');
  const [description, setDescription] = useState(task ? task.description || '' : '');
  const [aiPrompt, setAiPrompt] = useState(task ? task.aiPrompt || '' : '');
  const [checklistText, setChecklistText] = useState('');

  if (!isOpen || !task) return null;

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    onUpdateTask(task.id, { title: e.target.value });
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as 'low' | 'medium' | 'high';
    setPriority(val);
    onUpdateTask(task.id, { priority: val });
  };

  const handleDescChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    onUpdateTask(task.id, { description: e.target.value });
  };

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checklistText.trim()) return;
    
    const newItem = {
      id: `check-${Date.now()}`,
      text: checklistText.trim(),
      checked: false
    };
    
    const newChecklists = [...(task.checklists || []), newItem];
    onUpdateTask(task.id, { checklists: newChecklists });
    setChecklistText('');
  };

  const toggleChecklistItem = (itemId: string, currentStatus: boolean) => {
    const updated = (task.checklists || []).map(item =>
      item.id === itemId ? { ...item, checked: !currentStatus } : item
    );
    onUpdateTask(task.id, { checklists: updated });
  };

  const deleteChecklistItem = (itemId: string) => {
    const updated = (task.checklists || []).filter(item => item.id !== itemId);
    onUpdateTask(task.id, { checklists: updated });
  };

  const handleDeleteTask = () => {
    if (confirm('Are you sure you want to delete this task card?')) {
      onDeleteTask(columnId, task.id);
      onClose();
    }
  };

  // Simple, client-safe Markdown Parser to render Preview HTML
  const parseMarkdownToHtml = (text: string) => {
    if (!text) return '';
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold & Italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Code blocks & Inline code
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');

    // Lists (simplified)
    html = html.replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>');

    // Paragraph splits
    const lines = html.split('\n');
    const processedLines = lines.map(line => {
      const trimmed = line.trim();
      if (
        trimmed.startsWith('<h') || 
        trimmed.startsWith('<li') || 
        trimmed.startsWith('<pre') || 
        trimmed.startsWith('</pre>') || 
        trimmed.startsWith('<code>') || 
        trimmed.startsWith('</code>') || 
        trimmed === ''
      ) {
        return line;
      }
      return `<p>${line}</p>`;
    });

    return processedLines.join('\n');
  };

  const checklists = task.checklists || [];
  const completedCount = checklists.filter(item => item.checked).length;
  const totalCount = checklists.length;
  const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Task Card Properties</h3>
          <button className="btn-icon-only" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            
            {/* Left Column: Title & Markdown Description Pane */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label htmlFor="task-title-input">Task Title</label>
                <input
                  id="task-title-input"
                  type="text"
                  className="input-field"
                  value={title}
                  onChange={handleTitleChange}
                />
              </div>
              
              <div className="pane-layout">
                <div className="markdown-pane">
                  <label htmlFor="task-desc-textarea" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Description (Markdown)</label>
                  <textarea
                    id="task-desc-textarea"
                    className="input-field"
                    style={{ flex: 1, minHeight: '200px', resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                    placeholder="Enter details using Markdown (# Title, **bold**, - lists)..."
                    value={description}
                    onChange={handleDescChange}
                  />
                </div>
                
                <div className="markdown-pane">
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Live Preview</span>
                  <div
                    className="markdown-preview"
                    dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(description) }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label htmlFor="task-ai-prompt-textarea" style={{ margin: 0 }}>🤖 AI System Prompt</label>
                  {aiPrompt && (
                    <button
                      type="button"
                      className="btn-copy-prompt-inline"
                      onClick={() => {
                        navigator.clipboard.writeText(aiPrompt);
                      }}
                      style={{
                        fontSize: '0.75rem',
                        color: '#c084fc',
                        background: 'rgba(168, 85, 247, 0.1)',
                        border: '1px solid rgba(168, 85, 247, 0.25)',
                        borderRadius: '0.25rem',
                        padding: '0.2rem 0.5rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      📋 Copy Prompt
                    </button>
                  )}
                </div>
                <textarea
                  id="task-ai-prompt-textarea"
                  className="input-field"
                  style={{ minHeight: '80px', resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                  placeholder="Enter specific instructions/prompts for AI agents executing this task..."
                  value={aiPrompt}
                  onChange={(e) => {
                    setAiPrompt(e.target.value);
                    onUpdateTask(task.id, { aiPrompt: e.target.value });
                  }}
                />
              </div>
            </div>
            
            {/* Right Column: Priority, Checklist Manager & Deletion */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
              <div className="form-group">
                <label htmlFor="task-priority-select">Priority Tag</label>
                <select
                  id="task-priority-select"
                  className="input-field"
                  value={priority}
                  onChange={handlePriorityChange}
                  style={{ background: 'var(--bg-app)' }}
                >
                  <option value="low">Green (Low)</option>
                  <option value="medium">Amber (Medium)</option>
                  <option value="high">Red (High)</option>
                </select>
              </div>
              
              <div className="checklist-manager">
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Checklist ({completedCount}/{totalCount})
                </label>
                
                {totalCount > 0 && (
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${percentComplete}%`, height: '100%', background: 'var(--priority-low)', transition: 'width 0.3s ease' }}></div>
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '180px', overflowY: 'auto', marginTop: '0.5rem' }}>
                  {checklists.map(item => (
                    <div key={item.id} className="checklist-item">
                      <div className="checklist-item-left">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => toggleChecklistItem(item.id, item.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                        <span className={`checklist-text ${item.checked ? 'checked' : ''}`}>{item.text}</span>
                      </div>
                      <button className="btn-icon-only" onClick={() => deleteChecklistItem(item.id)} style={{ color: 'var(--priority-high)' }}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                
                <form onSubmit={handleAddChecklistItem} style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="New checklist item..."
                    value={checklistText}
                    onChange={(e) => setChecklistText(e.target.value)}
                    style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>+</button>
                </form>
              </div>
              
              <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button className="btn btn-danger" style={{ width: '100%', justifyContent: 'center' }} onClick={handleDeleteTask}>
                  Delete Task Card
                </button>
              </div>
            </div>
            
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>Save & Close</button>
        </div>
      </div>
    </div>
  );
};

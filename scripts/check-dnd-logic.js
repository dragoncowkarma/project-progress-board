const assert = require('assert');

// Simulate the moveTask logic
function moveTaskSim(columns, taskId, sourceColId, targetColId, targetIndex) {
  return columns.map(col => {
    if (col.id === sourceColId && col.id === targetColId) {
      const filtered = col.taskIds.filter(id => id !== taskId);
      filtered.splice(targetIndex, 0, taskId);
      return { ...col, taskIds: filtered };
    } else if (col.id === sourceColId) {
      return { ...col, taskIds: col.taskIds.filter(id => id !== taskId) };
    } else if (col.id === targetColId) {
      const newIds = [...col.taskIds];
      newIds.splice(targetIndex, 0, taskId);
      return { ...col, taskIds: newIds };
    }
    return col;
  });
}

function moveColumnSim(columns, columnId, targetIndex) {
  const colIndex = columns.findIndex(c => c.id === columnId);
  if (colIndex === -1) return columns;
  const newCols = [...columns];
  const [removed] = newCols.splice(colIndex, 1);
  newCols.splice(targetIndex, 0, removed);
  return newCols;
}

try {
  console.log('Verifying Drag-and-Drop state reordering logic...');

  // 1. Move card within same column
  const columns = [
    { id: 'col-1', taskIds: ['t-1', 't-2', 't-3'] },
    { id: 'col-2', taskIds: [] }
  ];
  let res = moveTaskSim(columns, 't-2', 'col-1', 'col-1', 0);
  assert.deepStrictEqual(res[0].taskIds, ['t-2', 't-1', 't-3'], 'Should move t-2 to position 0');

  res = moveTaskSim(columns, 't-3', 'col-1', 'col-1', 1);
  assert.deepStrictEqual(res[0].taskIds, ['t-1', 't-3', 't-2'], 'Should move t-3 to position 1');

  // 2. Move card to another column
  res = moveTaskSim(columns, 't-2', 'col-1', 'col-2', 0);
  assert.deepStrictEqual(res[0].taskIds, ['t-1', 't-3'], 'Should remove t-2 from col-1');
  assert.deepStrictEqual(res[1].taskIds, ['t-2'], 'Should insert t-2 into col-2 at position 0');

  // 3. Move column
  const resCol = moveColumnSim(columns, 'col-2', 0);
  assert.deepStrictEqual(resCol.map(c => c.id), ['col-2', 'col-1'], 'Should move col-2 to front');

  console.log('✅ DnD array logic checks passed successfully!');
  process.exit(0);
} catch (err) {
  console.error('❌ DnD array logic checks failed:', err.message);
  process.exit(1);
}

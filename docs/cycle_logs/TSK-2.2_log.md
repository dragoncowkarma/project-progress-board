## Cycle 1 — 2026-05-23T08:14:20+09:00

### Intent
Implement and verify custom HTML5 drag-and-drop mechanics in the KanbanBoard component, validating array reordering algorithms.

### Analysis
- Cards must support sorting inside columns and transferring across columns.
- Columns must support horizontal reordering.
- The drag and drop events are managed natively via HTML5 standard dataTransfer.
- We must make sure that card and column state updates accurately transform the board configuration tree.

### Plan
1. Bind HTML5 draggable properties to Kanban cards and columns.
2. Implement drag start and drag end event states.
3. Compute dropping indexes using cursor coordinates relative to other card/column center lines (to feel smooth and responsive).
4. Verify logic with unit-test script `scripts/check-dnd-logic.js`.
5. Execute harness validation.

### Failure Modes
1. **Drop target calculations failing**: If Y position relative calculations fail, items might not drop at the correct index. We mitigate this by testing the Y offset logic carefully.
2. **Column vs Task dragging event conflicts**: Dragging a column might trigger card dragging events. We prevent this by checking which entity is active and calling `e.stopPropagation()`.

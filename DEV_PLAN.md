# Development History

## Phases

**1-3. Foundation**
- Vite + React + TypeScript setup
- React Flow integration
- Custom node types with color support

**4-5. Core Features**
- Interactive graph (drag, zoom, pan, minimap)
- Parameter editor panel
- Real-time updates
- Dark theme

**6-7. Node Operations**
- Create/duplicate/delete with hotkeys
- Edge cleanup on deletion
- Toolbar UI

**8. Undo/Redo**
- 16-step history with `Cmd/Ctrl+Z` / `Cmd/Ctrl+Y`
- Smart snapshot timing (on commit, not per keystroke)

**9. Architecture Refactor**
- Extracted pure logic to `src/lib/` (HistoryManager, GraphOperations)
- Refactored hooks to be thin wrappers
- Comprehensive test suite (55/55 passing)

**10. Multi-Selection**
- Modifier keys: Shift (add), Cmd/Ctrl (toggle), Alt (remove)
- Visual selection sync between app state and ReactFlow
- Batch color editing for multiple nodes
- Adaptive parameter editor (0/1/N+ nodes)

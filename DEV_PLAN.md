# Development History

## Phases

**1. Foundation**
- Vite + React + TypeScript setup
- React Flow integration
- Custom node types with color support

**2. Core Features**
- Interactive graph (drag, zoom, pan, minimap)
- Parameter editor panel
- Real-time updates
- Dark theme

**3. Node Operations**
- Create/duplicate/delete with hotkeys
- Edge cleanup on deletion
- Toolbar UI

**4. Undo/Redo**
- 16-step history with `Cmd/Ctrl+Z` / `Cmd/Ctrl+Y`
- Smart snapshot timing (on commit, not per keystroke)

**5. Architecture Refactor**
- Extracted pure logic to `src/lib/` (HistoryManager, GraphOperations)
- Refactored hooks to be thin wrappers
- Comprehensive test suite (55/55 passing)

**6. Multi-Selection**
- Modifier keys: Shift (add), Cmd/Ctrl (toggle), Alt (remove)
- Visual selection sync between app state and ReactFlow
- Batch color editing for multiple nodes
- Adaptive parameter editor (0/1/N+ nodes)

**7. File I/O**
- Save/Save As/Load operations with File menu
- File System Access API for seamless overwriting in modern browsers
- Versioned JSON format (simplified from YAML)
- Current filename tracking and display
- New graph operation clears file handle

**8. Hierarchical Groups (Nested Mind Maps)** ✓

- `DocumentModel` class with `parentId` and `upstreamIds`
- `ReactFlowAdapter` converts between model and view formats
- Navigation state (`currentGroupId`) - ephemeral, not saved/undoable
- Double-click or hover + `E` to enter group, `ESC` to exit
- Breadcrumb trail for current path navigation

**9. Cut/Copy/Paste** ✓

- DocumentModel clipboard helpers (`getAllDescendants`, `copySubtree`, `pasteNodes`)
- Cut/Copy/Paste with keyboard shortcuts (`Cmd/Ctrl+X/C/V`)
- Duplicate refactored to use copy+paste internals
- All operations respect hierarchy (entire subtrees with remapped IDs)
- Edit menu with icons and shortcuts

--- Current Position
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

- `DocumentModel` class - hierarchical structure with `parentId` and `upstreamIds`
- Immutable operations, computed children, no view dependencies
- `useDocumentHistory` - tracks DocumentModel snapshots for undo/redo
- `ReactFlowAdapter` - converts between model and ReactFlow formats
- File I/O updated to JSON format, serializes hierarchical structure
- Navigation state (`currentGroupId`) - ephemeral, not saved/undoable
- `useGraphModel` refactored to use DocumentModel
- Selection state synchronized between App and graph model
- Node movement and selection working
- Double-click node or hover + `E` key to navigate into (show children as siblings)
- `ESC` key to navigate to parent group
- Breadcrumb trail at bottom showing current path (Root > Node1 > Node2)
- Clickable breadcrumbs for quick navigation to any level
- Hover tracking for keyboard-driven navigation
- Comprehensive test suite (107 tests passing)

**PHASE 8 COMPLETE**

*Design Notes:*
- Single source of truth: `parentId` on child, no `children` array
- Edges as `upstreamIds` on downstream node (not separate Edge objects)
- ReactFlow shows nodes where `parentId === currentGroupId`
- Creating nodes sets `parentId` to `currentGroupId`
- Moving nodes between groups changes `parentId` (undoable)
- Selection cleared when navigating between groups

--- Current Position

**9. Cut/Copy/Paste**
- Move "new node" and "duplicate" to Edit menu
- Add cut, copy and paste operations
- Clipboard operations respect hierarchy
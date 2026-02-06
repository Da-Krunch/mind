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
- Versioned YAML format (independent integer version)
- Current filename tracking and display
- New graph operation clears file handle

--- Here


**8. Hierarchical Groups (Nested Mind Maps)**

*Document Model:*
- New `DocumentModel` class in `src/lib/` - canonical source of truth
- Nodes have `parentId: string | null` (null = root level)
- Nodes have `children: string[]` array of child IDs
- Edges are stored per-group (only visible within current context)
- File I/O serializes/deserializes full hierarchy

*Navigation:*
- App tracks `currentGroupId: string | null` (null = root)
- Double-click node → navigate into it (show its children)
- ESC key → navigate to parent (or stay at root)
- Breadcrumb trail shows current path (Root > Node1 > Node2)
- Show the breadcrumb at the bottom of the screen

*View Layer:*
- ReactFlow shows only nodes at current level (children of `currentGroupId`)
- Edges shown only between visible nodes at current level
- Transform `DocumentModel` → ReactFlow nodes/edges based on current context

*Implications:*
- Selected node references must be validated against current context
- Undo/redo must track group navigation state
- Creating nodes adds them to current group
- Moving nodes between groups requires special operation

**9. Cut/Copy/Paste
- Add edit menu, move "new node" and "duplicate" in there.
- Add cut, copy and paste actions.
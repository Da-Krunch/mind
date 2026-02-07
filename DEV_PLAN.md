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
- Each node has:
  - `parentId: string | null` (null = root level)
  - `upstreamIds: string[]` - node IDs this node connects FROM (replaces Edge type)
- No `children` array - compute children on-demand by scanning `parentId`
- No separate Edge type - edges encoded as downstream node's `upstreamIds`
- File I/O serializes flat node array with parent/upstream relationships

*Navigation:*
- App tracks `currentGroupId: string | null` (null = root)
- Double-click node → navigate into it (show its children as siblings)
- ESC key → navigate to parent (or stay at root)
- Breadcrumb trail at bottom shows current path (Root > Node1 > Node2)

*View Layer:*
- ReactFlow shows nodes where `parentId === currentGroupId`
- ReactFlow edges generated from visible nodes' `upstreamIds`
- Transform: DocumentModel → ReactFlow (filter by parent, generate edges)
- Reverse: ReactFlow edge creation → update downstream node's `upstreamIds`

*Rationale:*
- Single source of truth: parent stored once on child
- Edges "owned" by downstream node (natural direction)
- O(n) child scanning acceptable for typical sizes
- Simpler serialization (just nodes, no edge array)

*Implications:*
- Navigation (`currentGroupId`) is ephemeral UI state - not saved, not undoable
- Undo/redo only tracks document changes (nodes, properties, relationships)
- Creating nodes sets `parentId` to `currentGroupId`
- Moving nodes between groups = change `parentId` (this IS undoable)
- Deleting node removes its ID from all nodes' `upstreamIds`
- Edge creation adds source ID to target's `upstreamIds`
- Selection cleared when navigating to different group

**9. Cut/Copy/Paste
- Add edit menu, move "new node" and "duplicate" in there.
- Add cut, copy and paste actions.
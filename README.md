# Mind

A web-based node graph editor for visual thinking and organization.

## Features

**Node Management**
- Edit menu with node operations
- Create new node (`Space`)
- Duplicate selected node (`Cmd/Ctrl+D`)
- Delete nodes
- Multi-selection with modifiers (Shift to add, Cmd/Ctrl to toggle, Alt to remove)
- Color-coded selection glow
- Drag to reposition

**Editing**
- Parameter editor adapts to selection:
  - 1 node: Edit all properties (title, color, description)
  - 2+ nodes: Batch edit color only
  - 0 nodes: All fields disabled
- Undo/redo with 16-step history (`Cmd/Ctrl+Z`, `Cmd/Ctrl+Y`)

**File I/O**
- File menu with dropdown operations
- New empty graph (`Cmd/Ctrl+Shift+N`)
- Save to current file (`Cmd/Ctrl+S`) - seamlessly overwrites in modern browsers
- Save As with new filename (`Cmd/Ctrl+Shift+S`)
- Load from JSON file (`Cmd/Ctrl+O`)
- Current filename displayed in toolbar
- Uses File System Access API for seamless file overwriting (Chrome, Edge)
- Falls back to downloads for unsupported browsers
- Versioned JSON format

**Connections**
- Connect nodes with draggable edges
- Edges auto-update with node movement

**Navigation**
- Pan, zoom, and minimap
- Background grid

## Tech Stack

React • TypeScript • React Flow • Vite • Vitest

## Development

```bash
npm install       # Install dependencies
npm run dev       # Start dev server
npm test          # Run tests (watch mode)
npm run test:ui   # Visual test dashboard
npm run build     # Build for production
```

## Architecture

MVC pattern with clean separation of concerns:

**Model Layer** (`src/lib/`)
- Pure TypeScript classes with no React or view dependencies
- `DocumentModel` - Hierarchical document structure with parent/child relationships
- `FileOperations` - JSON serialization/deserialization with versioning
- `ReactFlowAdapter` - Converts between model and view formats
- Fully unit tested (107 tests)

**Controller Layer** (`src/hooks/`)
- Thin React hooks that bridge model and view
- `useDocumentHistory` - Undo/redo for DocumentModel snapshots
- `useGraphModel` - Orchestrates document state, file I/O, and navigation

**View Layer** (`src/components/`)
- React components for UI rendering
- `App` - Coordinates selection and event handling
- `NodeGraph` - ReactFlow canvas with keyboard shortcuts
- `ParameterEditor` - Adaptive editing panel

The architecture allows the view layer (ReactFlow) to be replaced without touching business logic.

See `DEV_PLAN.md` for detailed development history.

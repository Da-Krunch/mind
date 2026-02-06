# Mind

A web-based node graph editor for visual thinking and organization.

## Features

**Node Management**
- Create, duplicate, and delete nodes (`Cmd/Ctrl+N`, `Cmd/Ctrl+D`)
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
- New empty graph
- Save to current file (`Cmd/Ctrl+S`) - seamlessly overwrites in modern browsers
- Save As with new filename (`Cmd/Ctrl+Shift+S`)
- Load from YAML file (`Cmd/Ctrl+O`)
- Current filename displayed in toolbar
- Uses File System Access API for seamless file overwriting (Chrome, Edge)
- Falls back to downloads for unsupported browsers
- Versioned file format for compatibility

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

Clean three-layer separation for testability and maintainability:

**Model Layer** (`src/lib/`)
- Pure TypeScript classes with no React dependencies
- `HistoryManager` - Undo/redo state management
- `GraphOperations` - Node/edge manipulation logic
- `FileOperations` - YAML serialization/deserialization
- Fully unit tested (53 tests)

**Integration Layer** (`src/hooks/`)
- Thin React hooks that bridge model and view
- `useHistory` - Connects HistoryManager to React lifecycle
- `useGraphModel` - Connects GraphOperations and FileOperations to React state
- Integration tested (9 tests)

**Presentation Layer** (`src/components/`)
- React components for UI rendering
- `App` - Coordinates state and selection
- `NodeGraph` - ReactFlow canvas and interactions
- `ParameterEditor` - Adaptive editing panel

See `DEV_PLAN.md` for development history.

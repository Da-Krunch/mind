# Mind - Development History

Web-based node graph editor with interactive nodes, connections, and parameter editing.

## Tech Stack

- **React + TypeScript** - UI with type safety
- **React Flow** - Graph visualization
- **Vite** - Fast build tooling
- **Vitest** - Testing

## Development Phases

### 1-3. Foundation
- Project scaffolding with Vite + React + TypeScript
- React Flow integration with custom node types
- Type definitions for node data (title, color, description)

### 4-5. Core Features
- Interactive node graph with drag, zoom, pan
- Side panel parameter editor (enabled when 1 node selected)
- Real-time node data updates
- Dark theme with color-coded nodes

### 6-7. Node Management
- Create new nodes (`Cmd/Ctrl+N`)
- Duplicate nodes (`Cmd/Ctrl+D`)
- Delete nodes with edge cleanup
- Multi-select for batch operations

### 8. Undo/Redo System
- History management (16 steps)
- Keyboard shortcuts (`Cmd/Ctrl+Z`, `Cmd/Ctrl+Y`)
- Snapshot capture on all operations

### 9. Testing & Architecture Refactor
- Separated pure logic from React code
- Created testable classes in `src/lib/`:
  - `HistoryManager` - Undo/redo state
  - `GraphOperations` - Graph manipulation
- Achieved 100% test coverage for core logic (46/46 tests)

---

## Architecture

The app follows a clean separation of concerns:

**Pure Logic** (`src/lib/`)
- `HistoryManager.ts` - Undo/redo state management
- `GraphOperations.ts` - Graph manipulation functions
- Fully tested, no React dependencies

**React Layer**
- `App.tsx` - Top-level coordinator
- `useGraphModel` - Hook bridging logic and React
- `NodeGraph` - ReactFlow visualization
- `ParameterEditor` - Side panel for editing

This separation makes the core logic easy to test, debug, and reuse.

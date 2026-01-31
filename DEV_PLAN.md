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
  - `HistoryManager` - Undo/redo state management
  - `GraphOperations` - Graph manipulation functions
- Refactored hooks to be thin wrappers around pure classes
- Test suite: 55/55 passing
  - 46 tests for pure logic (100% coverage)
  - 9 tests for React integration layer

---

## Architecture

The app follows a clean three-layer architecture:

**1. Pure Logic** (`src/lib/`)
- `HistoryManager.ts` - Undo/redo state management
- `GraphOperations.ts` - Graph manipulation functions
- No React dependencies, fully testable

**2. React Integration** (`src/hooks/`)
- `useHistory` - Thin wrapper connecting HistoryManager to React state
- `useGraphModel` - Thin wrapper connecting GraphOperations to React state
- Handles React lifecycle, delegates logic to pure classes

**3. Presentation** (`src/components/`)
- `App.tsx` - Top-level coordinator
- `NodeGraph.tsx` - ReactFlow visualization
- `ParameterEditor.tsx` - Side panel for editing

This architecture makes the core logic easy to test, debug, and reuse, while keeping React integration clean and minimal.

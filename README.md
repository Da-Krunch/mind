# Mind

A web-based node graph editor with colored nodes, connections, and a parameter panel.

## Features

- Create, duplicate, and delete nodes (`Cmd/Ctrl+N`, `Cmd/Ctrl+D`)
- Connect nodes with draggable edges (noodles)
- Edit node parameters: title, color, description
- Undo/redo history (16 steps) with `Cmd/Ctrl+Z` and `Cmd/Ctrl+Y`
- Color-coded selection glow
- Drag nodes to reposition
- MiniMap and zoom controls

## Tech Stack

React • TypeScript • React Flow • Vite • Vitest

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Run tests
npm test              # Watch mode
npm test -- --run     # Run once
npm run test:ui       # Visual test dashboard

# Build for production
npm run build
npm run preview
```

## Architecture

- **Model**: Pure TypeScript classes in `src/lib/` (HistoryManager, GraphOperations)
- **View**: React components (NodeGraph, ParameterEditor)
- **Controller**: React hooks that bridge model and view

See `DEV_PLAN.md` for development history.

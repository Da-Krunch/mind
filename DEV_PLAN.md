# Development Plan: Mind - Node Graph Editor

## 🎯 Project Goal
Build a local web-based node graph editor with interactive nodes, connections (noodles), and a side panel to edit the content of the selected node.
Each node has a title, shown in the editor, a color, and a description.
The side panel allows to edit the content of the node. It is enabled if and only if exactly one node is selected. Multiple selections are allowable in the node graph, so I can move the nodes around manually as I please. 

## 📚 Technology Stack Decision

### Core Technologies
1. **HTML** - Structure of the web page
2. **CSS** - Styling and layout
3. **JavaScript/TypeScript** - Logic and interactivity
4. **React** - UI framework (component-based architecture)
5. **React Flow** - Graph visualization library

### Why This Stack?
- **React**: Component model similar to OOP (familiar for C++/Python devs)
- **TypeScript**: Type safety catches errors at compile time
- **React Flow**: Handles complex graph interactions (zoom, pan, connections, multi-select)
- **Vite**: Fast build tool with instant hot reload

---

## 🎯 High-Level Steps

### 1. Project Scaffolding
- Set up npm project with dependencies
- Configure TypeScript and Vite
- Create HTML entry point

### 2. Basic React Structure
- Set up React app with main component
- Add global styles
- Verify hot reload works

### 3a. Type Definitions & React Flow Setup
- Create `src/types.ts` with NodeData interface
- Install React Flow library
- Create basic Flow component skeleton

### 3b. Node Graph Canvas
- Add sample nodes with title, color, description
- Add connections (edges/noodles)
- Style the canvas (dark theme, controls, minimap)
- Enable multi-select for moving nodes

### 4. Editor Side Panel
- Create panel component with form fields (title, color, description)
- Show disabled state when selection ≠ 1 node
- Enable editing when exactly 1 node selected
- Update node data in real-time

### 5. State Management
- Wire up selection state between graph and panel
- Sync edits from panel back to nodes
- Handle edge cases (delete selected node, etc.)

### 6. Polish
- Visual feedback for selected nodes
- Smooth interactions and transitions
- Test all scenarios

### 7. Node Management ✨ NEW
- Add button to create new nodes
- Duplicate existing nodes
- Ensure consistent edge visuals for all connections
- Delete nodes functionality

### 8. Add an undo queue, 16 steps back
- On ctrl (command) z, undo
- On ctrl (command) y, redo

---

## 🎮 Status

Phases 1-6: ✅ Complete
Phase 7: 🚧 In Progress

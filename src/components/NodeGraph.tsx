import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Connection,
  Background,
  Controls,
  MiniMap,
  NodeMouseHandler,
  NodeProps,
  Handle,
  Position,
  OnNodesChange,
  OnEdgesChange,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { NodeData } from '../types';
import './NodeGraph.css';

/**
 * Custom Node Component - Displays node with its custom color
 * React Flow will pass the node data as props
 * 
 * Handles are the connection points where edges (noodles) attach
 */
function ColoredNode({ data, selected }: NodeProps<NodeData & { label: string }>) {
  const nodeData = data as NodeData & { label: string };
  
  // Convert hex color to rgba for the glow effect
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  
  return (
    <>
      {/* Input handle (top) - where edges come IN */}
      <Handle type="target" position={Position.Top} />
      
      <div 
        className={`custom-node ${selected ? 'selected' : ''}`}
        style={{
          borderLeftColor: nodeData.color,
          borderLeftWidth: '4px',
          borderLeftStyle: 'solid',
          // Apply colored glow when selected (no offset, pure glow)
          boxShadow: selected 
            ? `0 0 20px ${hexToRgba(nodeData.color, 0.6)}, 0 0 40px ${hexToRgba(nodeData.color, 0.3)}`
            : undefined,
        }}
      >
        <div 
          className="node-color-indicator"
          style={{ backgroundColor: nodeData.color }}
        />
        <div className="node-label">{nodeData.label}</div>
      </div>
      
      {/* Output handle (bottom) - where edges go OUT */}
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}

// Register custom node types
const nodeTypes = {
  colored: ColoredNode,
};

interface NodeGraphProps {
  // Graph state
  nodes: Node[];
  edges: Edge[];
  currentFilename: string | null;
  
  // ReactFlow handlers
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  onNodeDragStop: () => void;
  
  // UI event handlers
  onNodeClick: (
    nodeId: string, 
    nodeData: NodeData,
    modifiers: { shift: boolean; cmdCtrl: boolean; alt: boolean }
  ) => void;
  onPaneClick: () => void;
  
  // Selected nodes (for highlighting)
  selectedNodeIds: string[];
  
  // Graph operations (called by keyboard shortcuts and toolbar)
  onCreateNode: (position?: { x: number; y: number }) => void;
  onDuplicateNode: (nodeId: string) => void;
  onNew: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onLoad: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

/**
 * NodeGraph Component - Presentation layer for the interactive node graph canvas
 * 
 * This component is now a "view" that receives all state and operations as props.
 * It handles:
 * - Rendering the ReactFlow canvas
 * - User interactions (clicks, drags, keyboard shortcuts)
 * - Delegating operations to parent via callbacks
 * 
 * This separation follows MVC pattern:
 * - Model: useGraphModel hook
 * - View: This component
 * - Controller: App component
 */
function NodeGraph({ 
  nodes,
  edges,
  currentFilename,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeDragStop,
  onNodeClick, 
  onPaneClick, 
  selectedNodeIds,
  onCreateNode,
  onDuplicateNode,
  onNew,
  onSave,
  onSaveAs,
  onLoad,
  onUndo,
  onRedo,
}: NodeGraphProps) {
  // Get ReactFlow instance for coordinate conversion
  const { screenToFlowPosition } = useReactFlow();
  
  // Track mouse position for node creation
  const mousePositionRef = useRef({ x: 0, y: 0 });
  
  // Update mouse position on move
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mousePositionRef.current = { x: event.clientX, y: event.clientY };
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  // Synchronize selectedNodeIds with ReactFlow's selected property on nodes
  // This ensures the visual selection (glow) matches our app state
  const nodesWithSelection = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      selected: selectedNodeIds.includes(node.id),
    }));
  }, [nodes, selectedNodeIds]);

  // State for menu dropdowns
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [editMenuOpen, setEditMenuOpen] = useState(false);
  const fileMenuRef = useRef<HTMLDivElement>(null);
  const editMenuRef = useRef<HTMLDivElement>(null);

  // Handle node clicks - notify parent component with modifier keys
  const handleNodeClick: NodeMouseHandler = useCallback(
    (event, node) => {
      // Close any open menus when clicking on nodes
      setFileMenuOpen(false);
      setEditMenuOpen(false);
      
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      onNodeClick(node.id, node.data as NodeData, {
        shift: event.shiftKey,
        cmdCtrl: isMac ? event.metaKey : event.ctrlKey,
        alt: event.altKey,
      });
    },
    [onNodeClick]
  );
  
  // Handle pane clicks - close menus and notify parent
  const handlePaneClick = useCallback(
    () => {
      // Close any open menus when clicking on the pane
      setFileMenuOpen(false);
      setEditMenuOpen(false);
      
      onPaneClick();
    },
    [onPaneClick]
  );
  
  // Keyboard shortcuts for undo/redo and node operations
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? event.metaKey : event.ctrlKey;
      
      // Create new node: Space (no modifiers)
      if (event.key === ' ' && !modifier && !event.shiftKey && !event.altKey) {
        // Only if not typing in an input field
        if (event.target instanceof HTMLElement && 
            event.target.tagName !== 'INPUT' && 
            event.target.tagName !== 'TEXTAREA') {
          event.preventDefault();
          // Convert screen coordinates to flow coordinates
          const position = screenToFlowPosition(mousePositionRef.current);
          onCreateNode(position);
          return;
        }
      }
      
      // Undo: Cmd/Ctrl+Z
      if (modifier && event.key.toLowerCase() === 'z' && !event.shiftKey) {
        event.preventDefault();
        onUndo();
      } 
      // Redo: Cmd/Ctrl+Y or Cmd/Ctrl+Shift+Z
      else if (modifier && (event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey))) {
        event.preventDefault();
        onRedo();
      }
      // New graph: Cmd/Ctrl+Shift+N
      else if (modifier && event.shiftKey && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        onNew();
      }
      // Save As: Cmd/Ctrl+Shift+S
      else if (modifier && event.shiftKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        onSaveAs();
      }
      // Save: Cmd/Ctrl+S
      else if (modifier && event.key.toLowerCase() === 's') {
        event.preventDefault();
        onSave();
      }
      // Load: Cmd/Ctrl+O
      else if (modifier && event.key.toLowerCase() === 'o') {
        event.preventDefault();
        onLoad();
      }
      // Duplicate node: Cmd/Ctrl+D (duplicate first selected node)
      else if (modifier && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        if (selectedNodeIds.length > 0) {
          onDuplicateNode(selectedNodeIds[0]);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUndo, onRedo, onNew, onSave, onSaveAs, onLoad, onCreateNode, onDuplicateNode, selectedNodeIds, screenToFlowPosition]);

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* Toolbar for node management and file operations */}
      <div className="node-graph-toolbar">
        {/* File menu dropdown */}
        <div className="menu-container" ref={fileMenuRef}>
          <button 
            className="toolbar-button menu-button"
            onClick={() => setFileMenuOpen(!fileMenuOpen)}
            title="File operations"
          >
            File {fileMenuOpen ? '▼' : '▶'}
          </button>
          {fileMenuOpen && (
            <div className="dropdown-menu">
              <button 
                className="menu-item"
                onClick={() => {
                  onNew();
                  setFileMenuOpen(false);
                }}
              >
                <span className="menu-icon">📄</span>
                <span className="menu-label">New</span>
                <span className="menu-shortcut">⌘⇧N</span>
              </button>
              <button 
                className="menu-item"
                onClick={() => {
                  onLoad();
                  setFileMenuOpen(false);
                }}
              >
                <span className="menu-icon">📂</span>
                <span className="menu-label">Open...</span>
                <span className="menu-shortcut">⌘O</span>
              </button>
              <div className="menu-separator" />
              <button 
                className="menu-item"
                onClick={() => {
                  onSave();
                  setFileMenuOpen(false);
                }}
              >
                <span className="menu-icon">💾</span>
                <span className="menu-label">Save</span>
                <span className="menu-shortcut">⌘S</span>
              </button>
              <button 
                className="menu-item"
                onClick={() => {
                  onSaveAs();
                  setFileMenuOpen(false);
                }}
              >
                <span className="menu-icon">💾</span>
                <span className="menu-label">Save As...</span>
                <span className="menu-shortcut">⌘⇧S</span>
              </button>
            </div>
          )}
        </div>

        {/* Edit menu dropdown */}
        <div className="menu-container" ref={editMenuRef}>
          <button 
            className="toolbar-button menu-button"
            onClick={() => setEditMenuOpen(!editMenuOpen)}
            title="Edit operations"
          >
            Edit {editMenuOpen ? '▼' : '▶'}
          </button>
          {editMenuOpen && (
            <div className="dropdown-menu">
              <button 
                className="menu-item"
                onClick={() => {
                  // Convert screen coordinates to flow coordinates
                  const position = screenToFlowPosition(mousePositionRef.current);
                  onCreateNode(position);
                  setEditMenuOpen(false);
                }}
              >
                <span className="menu-icon">➕</span>
                <span className="menu-label">New Node</span>
                <span className="menu-shortcut">Space</span>
              </button>
              <button 
                className="menu-item"
                onClick={() => {
                  if (selectedNodeIds.length > 0) {
                    onDuplicateNode(selectedNodeIds[0]);
                  }
                  setEditMenuOpen(false);
                }}
                disabled={selectedNodeIds.length === 0}
              >
                <span className="menu-icon">📋</span>
                <span className="menu-label">Duplicate Node</span>
                <span className="menu-shortcut">⌘D</span>
              </button>
            </div>
          )}
        </div>

        {/* Current filename display */}
        {currentFilename && (
          <div className="toolbar-filename" title={currentFilename}>
            📄 {currentFilename}
          </div>
        )}
      </div>

      <ReactFlow
        nodes={nodesWithSelection}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        selectNodesOnDrag={false}
      >
        {/* Background grid */}
        <Background />
        
        {/* Zoom and pan controls */}
        <Controls />
        
        {/* Mini map for navigation */}
        <MiniMap
          nodeColor={(node) => {
            const nodeData = node.data as NodeData;
            return nodeData?.color || '#555';
          }}
          maskColor="rgba(0, 0, 0, 0.2)"
        />
      </ReactFlow>
    </div>
  );
}

export default NodeGraph;

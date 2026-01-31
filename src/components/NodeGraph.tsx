import { useCallback, useEffect } from 'react';
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
  
  // ReactFlow handlers
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  onNodeDragStop: () => void;
  
  // UI event handlers
  onNodeClick: (nodeId: string, nodeData: NodeData) => void;
  onPaneClick: () => void;
  
  // Selected node (for highlighting)
  selectedNodeId: string | null;
  
  // Graph operations (called by keyboard shortcuts)
  onCreateNode: () => void;
  onDuplicateNode: (nodeId: string) => void;
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
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeDragStop,
  onNodeClick, 
  onPaneClick, 
  selectedNodeId,
  onCreateNode,
  onDuplicateNode,
  onUndo,
  onRedo,
}: NodeGraphProps) {
  // Handle node clicks - notify parent component
  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      onNodeClick(node.id, node.data as NodeData);
    },
    [onNodeClick]
  );
  
  // Keyboard shortcuts for undo/redo and node operations
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? event.metaKey : event.ctrlKey;
      
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
      // Create new node: Cmd/Ctrl+N
      else if (modifier && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        onCreateNode();
      }
      // Duplicate node: Cmd/Ctrl+D
      else if (modifier && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        if (selectedNodeId) {
          onDuplicateNode(selectedNodeId);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUndo, onRedo, onCreateNode, onDuplicateNode, selectedNodeId]);

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* Toolbar for node management */}
      <div className="node-graph-toolbar">
        <button 
          className="toolbar-button"
          onClick={onCreateNode}
          title="Create new node (Cmd/Ctrl+N)"
        >
          ➕ New Node
        </button>
        <button 
          className="toolbar-button"
          onClick={() => selectedNodeId && onDuplicateNode(selectedNodeId)}
          disabled={!selectedNodeId}
          title="Duplicate selected node (Cmd/Ctrl+D)"
        >
          📋 Duplicate
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={onPaneClick}
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

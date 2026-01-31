import { useCallback, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  NodeMouseHandler,
  NodeProps,
  Handle,
  Position,
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
  onNodeClick: (nodeId: string, nodeData: NodeData) => void;
  onPaneClick: () => void;
  selectedNodeId: string | null;
  selectedNodeData: NodeData | null;
}

/**
 * Initial sample nodes with our NodeData structure
 * Each node needs: id, position, data, type
 * The 'label' field is what React Flow displays on the node
 */
const initialNodes: Node<NodeData>[] = [
  {
    id: '1',
    type: 'colored',  // Use our custom colored node type
    position: { x: 250, y: 100 },
    data: {
      title: 'Welcome',
      color: '#3b82f6',
      description: 'This is the first node. Click to select it!',
      label: 'Welcome',  // Display title on the node
    } as NodeData & { label: string },
  },
  {
    id: '2',
    type: 'colored',
    position: { x: 100, y: 300 },
    data: {
      title: 'Ideas',
      color: '#10b981',
      description: 'Store your brilliant ideas here.',
      label: 'Ideas',
    } as NodeData & { label: string },
  },
  {
    id: '3',
    type: 'colored',
    position: { x: 400, y: 300 },
    data: {
      title: 'Tasks',
      color: '#f59e0b',
      description: 'Keep track of things to do.',
      label: 'Tasks',
    } as NodeData & { label: string },
  },
];

/**
 * Initial edges (connections) between nodes
 * Edges need: id, source (node id), target (node id)
 */
const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e1-3', source: '1', target: '3', animated: true },
];

/**
 * NodeGraph Component - The interactive node graph canvas
 * Fully owns and manages the nodes state
 */
function NodeGraph({ onNodeClick, onPaneClick, selectedNodeId, selectedNodeData }: NodeGraphProps) {
  // useNodesState and useEdgesState manage the nodes and edges with React state
  // Similar to useState but with special React Flow helpers
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update node data when it changes in the editor
  useEffect(() => {
    if (selectedNodeId && selectedNodeData) {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedNodeId
            ? { 
                ...node, 
                data: { 
                  ...selectedNodeData, 
                  label: selectedNodeData.title + 
                    (selectedNodeData.description.length > 0 ? "(...)" : "") // Sync title to label for display
                } as NodeData & { label: string }
              }
            : node
        )
      );
    }
  }, [selectedNodeId, selectedNodeData, setNodes]);

  // Handle creating new connections when user drags from one node to another
  const onConnect = useCallback(
    // callback function: takes a Connection object and adds it to the edges array
    (params: Connection) => setEdges(
        // takes an array of edges and returns a new array with the new edge added
        (eds) => addEdge(params, eds)
    ),
    // dependencies: setEdges is the only thing we need to re-run onConnect
    [setEdges]
  );

  // Handle node clicks - notify parent component
  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      onNodeClick(node.id, node.data as NodeData);
    },
    [onNodeClick]
  );

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={onPaneClick}
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

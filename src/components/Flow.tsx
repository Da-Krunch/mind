import { useCallback } from 'react';
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
} from 'reactflow';
import 'reactflow/dist/style.css';
import { NodeData } from '../types';
import './Flow.css';

/**
 * Initial sample nodes with our NodeData structure
 * Each node needs: id, position, data, type
 */
const initialNodes: Node<NodeData>[] = [
  {
    id: '1',
    type: 'default',
    position: { x: 250, y: 100 },
    data: {
      title: 'Welcome',
      color: '#3b82f6',
      description: 'This is the first node. Click to select it!',
    },
  },
  {
    id: '2',
    type: 'default',
    position: { x: 100, y: 300 },
    data: {
      title: 'Ideas',
      color: '#10b981',
      description: 'Store your brilliant ideas here.',
    },
  },
  {
    id: '3',
    type: 'default',
    position: { x: 400, y: 300 },
    data: {
      title: 'Tasks',
      color: '#f59e0b',
      description: 'Keep track of things to do.',
    },
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
 * Flow Component - The interactive node graph canvas
 */
function Flow() {
  // useNodesState and useEdgesState manage the nodes and edges with React state
  // Similar to useState but with special React Flow helpers
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

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

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        selectNodesOnDrag={false}
      >
        {/* Background grid */}
        <Background />
        
        {/* Zoom and pan controls */}
        <Controls />
        
        {/* Mini map for navigation */}
        <MiniMap />
      </ReactFlow>
    </div>
  );
}

export default Flow;

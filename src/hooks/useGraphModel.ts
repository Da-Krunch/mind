import { useCallback } from 'react';
import { 
  Node, 
  Edge, 
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  OnNodesChange,
  OnEdgesChange,
} from 'reactflow';
import { NodeData } from '../types';
import { useHistory } from './useHistory';
import { GraphOperations } from '../lib/GraphOperations';

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
 * All edges have consistent styling (no animation for uniformity)
 */
const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e1-3', source: '1', target: '3' },
];

export interface GraphModel {
  // State
  nodes: Node[];
  edges: Edge[];
  
  // ReactFlow event handlers
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  onNodeDragStop: () => void;
  
  // Graph operations
  createNode: () => Node;
  duplicateNode: (nodeId: string) => Node | null;
  deleteNode: (nodeId: string) => void;
  updateNodeData: (nodeId: string, data: NodeData) => void;
  
  // History operations
  undo: () => void;
  redo: () => void;
  captureSnapshot: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * Custom hook for managing the graph data model
 * 
 * This hook is now a thin React wrapper around pure business logic.
 * It handles:
 * - React state management (useNodesState, useEdgesState)
 * - History integration (useHistory)
 * - Delegating operations to GraphOperations
 * 
 * Architecture:
 * - Pure logic: GraphOperations, HistoryManager (in src/lib/)
 * - React integration: This hook
 * - Presentation: NodeGraph component
 */
export function useGraphModel(): GraphModel {
  // React Flow state management hooks
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // History management (undo/redo with 16 steps)
  const { undo, redo, captureSnapshot, canUndo, canRedo } = useHistory(
    nodes,
    edges,
    setNodes,
    setEdges,
    16
  );
  
  // Handle creating new connections when user drags from one node to another
  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge(params, eds));
    captureSnapshot();
  }, [setEdges, captureSnapshot]);
  
  // Handle when node drag stops (capture for undo history)
  const onNodeDragStop = useCallback(() => {
    captureSnapshot();
  }, [captureSnapshot]);
  
  // Create a new node with default values
  const createNode = useCallback((): Node => {
    const newNode = GraphOperations.createNode();
    setNodes((nds) => GraphOperations.addNode(nds, newNode));
    captureSnapshot();
    return newNode;
  }, [setNodes, captureSnapshot]);
  
  // Duplicate an existing node
  const duplicateNode = useCallback((nodeId: string): Node | null => {
    const nodeToDuplicate = GraphOperations.findNode(nodes, nodeId);
    if (!nodeToDuplicate) return null;
    
    const duplicatedNode = GraphOperations.duplicateNode(nodeToDuplicate);
    setNodes((nds) => GraphOperations.addNode(nds, duplicatedNode));
    captureSnapshot();
    
    return duplicatedNode;
  }, [nodes, setNodes, captureSnapshot]);
  
  // Delete a node and all its connected edges
  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => GraphOperations.removeNode(nds, nodeId));
    setEdges((eds) => GraphOperations.removeNodeEdges(eds, nodeId));
    captureSnapshot();
  }, [setNodes, setEdges, captureSnapshot]);
  
  // Update a node's data (without capturing snapshot - let caller decide when to snapshot)
  const updateNodeData = useCallback((nodeId: string, data: NodeData) => {
    setNodes((nds) => GraphOperations.updateNodeData(nds, nodeId, data));
  }, [setNodes]);
  
  return {
    // State
    nodes,
    edges,
    
    // ReactFlow handlers
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeDragStop,
    
    // Graph operations
    createNode,
    duplicateNode,
    deleteNode,
    updateNodeData,
    
    // History
    undo,
    redo,
    captureSnapshot,
    canUndo,
    canRedo,
  };
}

import { useCallback, useEffect } from 'react';
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
 * This hook encapsulates all graph state and operations, separating the data model
 * from the presentation layer (ReactFlow component). This makes the code more:
 * - Testable: Can test graph logic without rendering
 * - Maintainable: Single source of truth for graph state
 * - Reusable: Could have multiple views of the same graph
 * 
 * Similar to MVC pattern in other languages:
 * - This hook is the "Model" (data + business logic)
 * - NodeGraph component is the "View" (presentation)
 * - App component is the "Controller" (coordination)
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
    const newNode: Node<NodeData> = {
      id: `node-${Date.now()}`,
      type: 'colored',
      position: { 
        x: Math.random() * 400 + 100, 
        y: Math.random() * 400 + 100 
      },
      data: {
        title: 'New Node',
        color: '#8b5cf6',  // Purple for new nodes
        description: '',
        label: 'New Node',
      } as NodeData & { label: string },
    };
    
    setNodes((nds) => [...nds, newNode]);
    captureSnapshot();
    
    return newNode;
  }, [setNodes, captureSnapshot]);
  
  // Duplicate an existing node
  const duplicateNode = useCallback((nodeId: string): Node | null => {
    const nodeToDuplicate = nodes.find(n => n.id === nodeId);
    if (!nodeToDuplicate) return null;
    
    const duplicatedNode: Node<NodeData> = {
      ...nodeToDuplicate,
      id: `node-${Date.now()}`,
      position: {
        x: nodeToDuplicate.position.x + 50,
        y: nodeToDuplicate.position.y + 50,
      },
      data: {
        ...nodeToDuplicate.data,
        title: `${nodeToDuplicate.data.title} (Copy)`,
        label: `${nodeToDuplicate.data.title} (Copy)`,
      } as NodeData & { label: string },
    };
    
    setNodes((nds) => [...nds, duplicatedNode]);
    captureSnapshot();
    
    return duplicatedNode;
  }, [nodes, setNodes, captureSnapshot]);
  
  // Delete a node and all its connected edges
  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter(n => n.id !== nodeId));
    setEdges((eds) => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    captureSnapshot();
  }, [setNodes, setEdges, captureSnapshot]);
  
  // Update a node's data (without capturing snapshot - let caller decide when to snapshot)
  const updateNodeData = useCallback((nodeId: string, data: NodeData) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...data,
                label: data.title + (data.description.length > 0 ? "(...)" : "")
              } as NodeData & { label: string }
            }
          : node
      )
    );
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

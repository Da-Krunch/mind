import { useCallback, useState, useRef } from 'react';
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
import { FileOperations } from '../lib/FileOperations';

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
      label: 'Welcome(...)',  // this should be generated from the title and description
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
      label: 'Ideas(...)', // this should be generated from the title and description
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
      label: 'Tasks(...)', // this should be generated from the title and description
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
  currentFilename: string | null;
  hasFileHandle: boolean;
  
  // ReactFlow event handlers
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  onNodeDragStop: () => void;
  
  // Graph operations
  createNode: (position?: { x: number; y: number }) => Node;
  duplicateNode: (nodeId: string) => Node | null;
  deleteNode: (nodeId: string) => void;
  updateNodeData: (nodeId: string, data: NodeData) => void;
  
  // File operations
  newGraph: () => void;
  save: () => void;
  saveAs: () => void;
  load: () => Promise<{ success: boolean; error: string | null }>;
  
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
  
  // Track the current working file
  const [currentFilename, setCurrentFilename] = useState<string | null>(null);
  const fileHandleRef = useRef<FileSystemFileHandle | null>(null);
  
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
  const createNode = useCallback((position?: { x: number; y: number }): Node => {
    const newNode = GraphOperations.createNode(position);
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
  
  // Create a new empty graph
  const newGraph = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setCurrentFilename(null);
    fileHandleRef.current = null;
    captureSnapshot();
  }, [setNodes, setEdges, captureSnapshot]);
  
  // Save to current file (or prompt if no current file)
  const save = useCallback(async () => {
    const yamlContent = FileOperations.serialize(nodes, edges);
    
    if (FileOperations.isFileSystemAccessSupported()) {
      try {
        // Use File System Access API for seamless saving
        const handle = await FileOperations.saveToFileHandle(yamlContent, fileHandleRef.current ?? undefined);
        fileHandleRef.current = handle;
        setCurrentFilename(handle.name);
      } catch (error) {
        // User cancelled or error occurred
        console.error('Save failed:', error);
      }
    } else {
      // Fallback to download for unsupported browsers
      const filename = currentFilename || 'mind-graph.yaml';
      FileOperations.download(yamlContent, filename);
      if (!currentFilename) {
        setCurrentFilename(filename);
      }
    }
  }, [nodes, edges, currentFilename]);
  
  // Always prompt for new filename
  const saveAs = useCallback(async () => {
    const yamlContent = FileOperations.serialize(nodes, edges);
    
    if (FileOperations.isFileSystemAccessSupported()) {
      try {
        // Always prompt for new location
        const handle = await FileOperations.saveToFileHandle(yamlContent);
        fileHandleRef.current = handle;
        setCurrentFilename(handle.name);
      } catch (error) {
        // User cancelled or error occurred
        console.error('Save As failed:', error);
      }
    } else {
      // Fallback to download with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `mind-graph-${timestamp}.yaml`;
      FileOperations.download(yamlContent, filename);
      setCurrentFilename(filename);
    }
  }, [nodes, edges]);
  
  // Load graph from YAML file
  const load = useCallback(async () => {
    try {
      if (FileOperations.isFileSystemAccessSupported()) {
        // Use File System Access API
        const { content, filename, fileHandle } = await FileOperations.loadFromFileHandle();
        const { nodes: loadedNodes, edges: loadedEdges } = FileOperations.deserialize(content);
        setNodes(loadedNodes);
        setEdges(loadedEdges);
        setCurrentFilename(filename);
        fileHandleRef.current = fileHandle;
        captureSnapshot();
        return { success: true, error: null };
      } else {
        // Fallback to file input
        const { content, filename } = await FileOperations.upload();
        const { nodes: loadedNodes, edges: loadedEdges } = FileOperations.deserialize(content);
        setNodes(loadedNodes);
        setEdges(loadedEdges);
        setCurrentFilename(filename);
        captureSnapshot();
        return { success: true, error: null };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }, [setNodes, setEdges, captureSnapshot]);
  
  return {
    // State
    nodes,
    edges,
    currentFilename,
    hasFileHandle: fileHandleRef.current !== null,
    
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
    
    // File operations
    newGraph,
    save,
    saveAs,
    load,
    
    // History
    undo,
    redo,
    captureSnapshot,
    canUndo,
    canRedo,
  };
}

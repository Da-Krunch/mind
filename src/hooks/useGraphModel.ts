import { useCallback, useState, useRef, useMemo } from 'react';
import { 
  Node, 
  Edge, 
  Connection,
  OnNodesChange,
  OnEdgesChange,
  NodeChange,
  EdgeChange,
} from 'reactflow';
import { NodeData, Result } from '../types';
import { useDocumentHistory } from './useDocumentHistory';
import { DocumentModel } from '../lib/DocumentModel';
import { FileOperations } from '../lib/FileOperations';
import * as Adapter from '../lib/ReactFlowAdapter';
import { HISTORY_MAX_STEPS } from '../constants';

/**
 * Create initial sample document
 * Creates 3 nodes at root level with connections
 */
function createInitialDocument(): DocumentModel {
  const doc = DocumentModel.empty();
  
  const node1 = doc.createNode(null, { x: 250, y: 100 });
  const node2 = doc.createNode(null, { x: 100, y: 300 });
  const node3 = doc.createNode(null, { x: 400, y: 300 });
  
  let newDoc = doc.addNode(node1).addNode(node2).addNode(node3);
  
  // Update with sample content
  newDoc = newDoc.updateNodeData(node1.id, {
    title: 'Welcome',
    color: '#3b82f6',
    description: 'This is the first node. Click to select it!',
  });
  newDoc = newDoc.updateNodeData(node2.id, {
    title: 'Ideas',
    color: '#10b981',
    description: 'Store your brilliant ideas here.',
  });
  newDoc = newDoc.updateNodeData(node3.id, {
    title: 'Tasks',
    color: '#f59e0b',
    description: 'Keep track of things to do.',
  });
  
  // Add connections
  newDoc = newDoc.addEdge(node1.id, node2.id);
  newDoc = newDoc.addEdge(node1.id, node3.id);
  
  return newDoc;
}

export interface GraphModel {
  // State
  nodes: Node[];  // ReactFlow nodes (computed from document)
  edges: Edge[];  // ReactFlow edges (computed from document)
  currentFilename: string | null;
  hasFileHandle: boolean;
  currentGroupId: string | null;  // Current navigation context
  
  // ReactFlow event handlers
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  onNodeDragStop: () => void;
  
  // Graph operations
  createNode: (position?: { x: number; y: number }) => Node<NodeData>;
  duplicateNode: (nodeId: string) => Node<NodeData> | null;
  deleteNode: (nodeId: string) => void;
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
  
  // Selection operations
  setSelectedNodeIds: (nodeIds: string[]) => void;
  
  // Navigation operations
  navigateInto: (nodeId: string) => void;
  navigateToParent: () => void;
  navigateToRoot: () => void;
  
  // File operations
  newGraph: () => void;
  save: () => void;
  saveAs: () => void;
  load: () => Promise<Result<void>>;
  
  // History operations
  undo: () => void;
  redo: () => void;
  captureSnapshot: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * Custom hook for managing the hierarchical document model
 * 
 * Architecture (Phase 8):
 * - Model: DocumentModel (pure business logic, no React/ReactFlow dependencies)
 * - Adapter: ReactFlowAdapter (converts between model and view)
 * - View: ReactFlow (presentation layer)
 * - Navigation: currentGroupId (ephemeral UI state, not saved/undoable)
 * 
 * The hook manages:
 * - Document state (DocumentModel)
 * - Navigation state (currentGroupId)
 * - History (undo/redo on document changes only)
 * - File I/O (serialization/deserialization)
 * - Conversion to ReactFlow format for rendering
 */
export function useGraphModel(): GraphModel {
  // Core document state
  const [document, setDocument] = useState<DocumentModel>(() => createInitialDocument());
  
  // Navigation state (ephemeral - not saved, not undoable)
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
  
  // Track the current working file
  const [currentFilename, setCurrentFilename] = useState<string | null>(null);
  const fileHandleRef = useRef<FileSystemFileHandle | null>(null);
  
  // Selection state (needed for adapter)
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  
  // History management (undo/redo) - tracks DocumentModel snapshots
  const { undo, redo, captureSnapshot, canUndo, canRedo } = useDocumentHistory(
    document,
    setDocument,
    HISTORY_MAX_STEPS
  );
  
  // Convert document to ReactFlow format for rendering
  const nodes = useMemo(
    () => Adapter.getVisibleNodes(document, currentGroupId, selectedNodeIds),
    [document, currentGroupId, selectedNodeIds]
  );
  
  const edges = useMemo(
    () => Adapter.getVisibleEdges(document, currentGroupId),
    [document, currentGroupId]
  );
  
  // Handle ReactFlow node changes (position updates, deletions, etc.)
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setDocument((doc) => {
      let updatedDoc = doc;
      for (const change of changes) {
        if (change.type === 'position' && change.position) {
          // Update position (both during drag and after)
          updatedDoc = updatedDoc.updateNodePosition(change.id, change.position);
        }
      }
      return updatedDoc;
    });
  }, []);
  
  // Handle ReactFlow edge changes (deletions)
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setDocument((doc) => {
      let updatedDoc = doc;
      for (const change of changes) {
        if (change.type === 'remove') {
          // Parse edge id (format: "sourceId-targetId")
          const [sourceId, targetId] = change.id.split('-');
          if (sourceId && targetId) {
            updatedDoc = updatedDoc.removeEdge(sourceId, targetId);
          }
        }
      }
      return updatedDoc;
    });
  }, []);
  
  // Handle creating new connections when user drags from one node to another
  const onConnect = useCallback((params: Connection) => {
    if (params.source && params.target) {
      setDocument((doc) => doc.addEdge(params.source!, params.target!));
      captureSnapshot();
    }
  }, [captureSnapshot]);
  
  // Handle when node drag stops (capture for undo history)
  const onNodeDragStop = useCallback(() => {
    captureSnapshot();
  }, [captureSnapshot]);
  
  // Create a new node with default values in the current group
  const createNode = useCallback((position?: { x: number; y: number }): Node<NodeData> => {
    let newNode: any;
    setDocument((doc) => {
      newNode = doc.createNode(currentGroupId, position);
      return doc.addNode(newNode);
    });
    captureSnapshot();
    return Adapter.toReactFlowNode(newNode);
  }, [currentGroupId, captureSnapshot]);
  
  // Duplicate an existing node
  const duplicateNode = useCallback((nodeId: string): Node<NodeData> | null => {
    let duplicatedNode: any = null;
    setDocument((doc) => {
      const result = doc.duplicateNode(nodeId);
      if (!result) return doc;
      duplicatedNode = result.node;
      return result.model;
    });
    if (duplicatedNode) {
      captureSnapshot();
      return Adapter.toReactFlowNode(duplicatedNode);
    }
    return null;
  }, [captureSnapshot]);
  
  // Delete a node and all its connected edges
  const deleteNode = useCallback((nodeId: string) => {
    setDocument((doc) => doc.removeNode(nodeId));
    captureSnapshot();
  }, [captureSnapshot]);
  
  // Update a node's data (without capturing snapshot - let caller decide when to snapshot)
  const updateNodeData = useCallback((nodeId: string, data: Partial<NodeData>) => {
    setDocument((doc) => doc.updateNodeData(nodeId, data));
  }, []);
  
  // Navigation: Navigate into a node (show its children)
  const navigateInto = useCallback((nodeId: string) => {
    const node = document.findNode(nodeId);
    if (node) {
      setCurrentGroupId(nodeId);
      setSelectedNodeIds([]);  // Clear selection when navigating
    }
  }, [document]);
  
  // Navigation: Navigate to parent of current group
  const navigateToParent = useCallback(() => {
    if (currentGroupId === null) return;  // Already at root
    
    const currentNode = document.findNode(currentGroupId);
    if (currentNode) {
      setCurrentGroupId(currentNode.data.parentId);
      setSelectedNodeIds([]);  // Clear selection when navigating
    }
  }, [document, currentGroupId]);
  
  // Navigation: Navigate to root level
  const navigateToRoot = useCallback(() => {
    setCurrentGroupId(null);
    setSelectedNodeIds([]);  // Clear selection when navigating
  }, []);
  
  // Create a new empty graph
  const newGraph = useCallback(() => {
    setDocument(DocumentModel.empty());
    setCurrentGroupId(null);
    setCurrentFilename(null);
    fileHandleRef.current = null;
    setSelectedNodeIds([]);
    captureSnapshot();
  }, [captureSnapshot]);
  
  // Save to current file (or prompt if no current file)
  const save = useCallback(async () => {
    const yamlContent = FileOperations.serialize(document);
    
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
      const filename = currentFilename || 'mind-graph.json';
      FileOperations.download(yamlContent, filename);
      if (!currentFilename) {
        setCurrentFilename(filename);
      }
    }
  }, [document, currentFilename]);
  
  // Always prompt for new filename
  const saveAs = useCallback(async () => {
    const yamlContent = FileOperations.serialize(document);
    
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
      const filename = `mind-graph-${timestamp}.json`;
      FileOperations.download(yamlContent, filename);
      setCurrentFilename(filename);
    }
  }, [document]);
  
  // Load graph from YAML file
  const load = useCallback(async (): Promise<Result<void>> => {
    try {
      if (FileOperations.isFileSystemAccessSupported()) {
        // Use File System Access API
        const { content, filename, fileHandle } = await FileOperations.loadFromFileHandle();
        const loadedDoc = FileOperations.deserialize(content);
        setDocument(loadedDoc);
        setCurrentGroupId(null);  // Reset to root after loading
        setSelectedNodeIds([]);
        setCurrentFilename(filename);
        fileHandleRef.current = fileHandle;
        captureSnapshot();
        return { success: true, data: undefined };
      } else {
        // Fallback to file input
        const { content, filename } = await FileOperations.upload();
        const loadedDoc = FileOperations.deserialize(content);
        setDocument(loadedDoc);
        setCurrentGroupId(null);  // Reset to root after loading
        setSelectedNodeIds([]);
        setCurrentFilename(filename);
        captureSnapshot();
        return { success: true, data: undefined };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }, [captureSnapshot]);
  
  return {
    // State
    nodes,
    edges,
    currentFilename,
    hasFileHandle: fileHandleRef.current !== null,
    currentGroupId,
    
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
    
    // Selection operations
    setSelectedNodeIds,
    
    // Navigation operations
    navigateInto,
    navigateToParent,
    navigateToRoot,
    
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

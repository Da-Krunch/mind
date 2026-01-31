import { useState, useCallback, useRef } from 'react';
import './App.css';
import NodeGraph from './components/NodeGraph';
import ParameterEditor from './components/ParameterEditor';
import { NodeData } from './types';

// Combined state type for selected node (ensures ID and data are always in sync)
interface SelectedNode {
  id: string;
  data: NodeData;
}

function App() {
  // State for which node is selected (null = nothing selected)
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
  
  // Ref to store the delete function from NodeGraph
  const deleteNodeRef = useRef<((nodeId: string) => void) | null>(null);
  
  // Ref to store the snapshot function from NodeGraph
  const snapshotRef = useRef<(() => void) | null>(null);

  // Called when user clicks a node in the NodeGraph
  const handleNodeClick = useCallback((nodeId: string, nodeData: NodeData) => {
    setSelectedNode({ id: nodeId, data: nodeData });
  }, []);

  // Called when user edits data in the ParameterEditor
  const handleNodeDataChange = useCallback((updatedData: NodeData) => {
    setSelectedNode((prev) => 
      prev ? { ...prev, data: updatedData } : null
    );
  }, []);

  // Called when user closes the editor or clicks canvas
  const handleClose = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Called when user deletes a node from ParameterEditor
  const handleDeleteNode = useCallback((nodeId: string) => {
    // Call the NodeGraph's delete function
    if (deleteNodeRef.current) {
      deleteNodeRef.current(nodeId);
    }
    // Deselect the node
    setSelectedNode(null);
  }, []);
  
  // Callback to receive the delete function from NodeGraph
  const registerDeleteFunction = useCallback((deleteFn: (nodeId: string) => void) => {
    deleteNodeRef.current = deleteFn;
  }, []);
  
  // Callback to receive the snapshot function from NodeGraph
  const registerSnapshotFunction = useCallback((snapshotFn: () => void) => {
    snapshotRef.current = snapshotFn;
  }, []);
  
  // Called when user commits changes in ParameterEditor (blur or Enter)
  const handleCommitChanges = useCallback(() => {
    if (snapshotRef.current) {
      snapshotRef.current();
    }
  }, []);

  return (
    <div className="app">
      <NodeGraph 
        onNodeClick={handleNodeClick}
        onPaneClick={handleClose}
        selectedNodeId={selectedNode?.id ?? null}
        selectedNodeData={selectedNode?.data ?? null}
        onRegisterDelete={registerDeleteFunction}
        onRegisterSnapshot={registerSnapshotFunction}
      />
      <ParameterEditor 
        nodeId={selectedNode?.id ?? null}
        nodeData={selectedNode?.data ?? null}
        onDataChange={handleNodeDataChange}
        onClose={handleClose}
        onDelete={handleDeleteNode}
        onCommitChanges={handleCommitChanges}
      />
    </div>
  );
}

export default App;

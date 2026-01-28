import { useState, useCallback } from 'react';
import './App.css';
import Flow from './components/Flow';
import NodeEditor from './components/NodeEditor';
import { NodeData } from './types';

function App() {
  // State for which node is selected
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeData, setSelectedNodeData] = useState<NodeData | null>(null);

  // Called when user clicks a node in the Flow
  const handleNodeClick = useCallback((nodeId: string, nodeData: NodeData) => {
    setSelectedNodeId(nodeId);
    setSelectedNodeData(nodeData);
  }, []);

  // Called when user edits data in the NodeEditor
  const handleNodeDataChange = useCallback((updatedData: NodeData) => {
    setSelectedNodeData(updatedData);
  }, []);

  // Called when user closes the editor or clicks canvas
  const handleClose = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedNodeData(null);
  }, []);

  return (
    <div className="app">
      <Flow 
        onNodeClick={handleNodeClick}
        onPaneClick={handleClose}
        selectedNodeId={selectedNodeId}
        selectedNodeData={selectedNodeData}
      />
      <NodeEditor 
        nodeId={selectedNodeId}
        nodeData={selectedNodeData}
        onDataChange={handleNodeDataChange}
        onClose={handleClose}
      />
    </div>
  );
}

export default App;

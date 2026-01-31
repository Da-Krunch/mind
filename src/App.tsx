import { useState, useCallback } from 'react';
import './App.css';
import Flow from './components/Flow';
import NodeEditor from './components/NodeEditor';
import { NodeData } from './types';

// Combined state type for selected node (ensures ID and data are always in sync)
interface SelectedNode {
  id: string;
  data: NodeData;
}

function App() {
  // State for which node is selected (null = nothing selected)
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);

  // Called when user clicks a node in the Flow
  const handleNodeClick = useCallback((nodeId: string, nodeData: NodeData) => {
    setSelectedNode({ id: nodeId, data: nodeData });
  }, []);

  // Called when user edits data in the NodeEditor
  const handleNodeDataChange = useCallback((updatedData: NodeData) => {
    setSelectedNode((prev) => 
      prev ? { ...prev, data: updatedData } : null
    );
  }, []);

  // Called when user closes the editor or clicks canvas
  const handleClose = useCallback(() => {
    setSelectedNode(null);
  }, []);

  return (
    <div className="app">
      <Flow 
        onNodeClick={handleNodeClick}
        onPaneClick={handleClose}
        selectedNodeId={selectedNode?.id ?? null}
        selectedNodeData={selectedNode?.data ?? null}
      />
      <NodeEditor 
        nodeId={selectedNode?.id ?? null}
        nodeData={selectedNode?.data ?? null}
        onDataChange={handleNodeDataChange}
        onClose={handleClose}
      />
    </div>
  );
}

export default App;

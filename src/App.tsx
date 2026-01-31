import { useState, useCallback } from 'react';
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

  return (
    <div className="app">
      <NodeGraph 
        onNodeClick={handleNodeClick}
        onPaneClick={handleClose}
        selectedNodeId={selectedNode?.id ?? null}
        selectedNodeData={selectedNode?.data ?? null}
      />
      <ParameterEditor 
        nodeId={selectedNode?.id ?? null}
        nodeData={selectedNode?.data ?? null}
        onDataChange={handleNodeDataChange}
        onClose={handleClose}
      />
    </div>
  );
}

export default App;

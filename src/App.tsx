import { useState, useCallback, useEffect } from 'react';
import './App.css';
import NodeGraph from './components/NodeGraph';
import ParameterEditor from './components/ParameterEditor';
import { NodeData } from './types';
import { useGraphModel } from './hooks/useGraphModel';

// Combined state type for selected node (ensures ID and data are always in sync)
interface SelectedNode {
  id: string;
  data: NodeData;
}

function App() {
  // Graph model hook - single source of truth for graph state
  const graph = useGraphModel();
  
  // State for which node is selected (null = nothing selected)
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);

  // Update node data in graph when edited in ParameterEditor
  useEffect(() => {
    if (selectedNode) {
      graph.updateNodeData(selectedNode.id, selectedNode.data);
    }
  }, [selectedNode, graph]);

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
    graph.deleteNode(nodeId);
    setSelectedNode(null);
  }, [graph]);
  
  // Called when user commits changes in ParameterEditor (blur or Enter)
  const handleCommitChanges = useCallback(() => {
    graph.captureSnapshot();
  }, [graph]);

  return (
    <div className="app">
      <NodeGraph 
        nodes={graph.nodes}
        edges={graph.edges}
        onNodesChange={graph.onNodesChange}
        onEdgesChange={graph.onEdgesChange}
        onConnect={graph.onConnect}
        onNodeDragStop={graph.onNodeDragStop}
        onNodeClick={handleNodeClick}
        onPaneClick={handleClose}
        selectedNodeId={selectedNode?.id ?? null}
        onCreateNode={graph.createNode}
        onDuplicateNode={graph.duplicateNode}
        onUndo={graph.undo}
        onRedo={graph.redo}
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

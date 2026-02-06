import { useState, useCallback } from 'react';
import './App.css';
import NodeGraph from './components/NodeGraph';
import ParameterEditor from './components/ParameterEditor';
import { NodeData } from './types';
import { useGraphModel } from './hooks/useGraphModel';

function App() {
  // Graph model hook - single source of truth for graph state
  const graph = useGraphModel();
  
  // Track which nodes are selected (for glow effect and editing)
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);

  // Called when user clicks a node in the NodeGraph
  const handleNodeClick = useCallback((
    nodeId: string, 
    _nodeData: NodeData,
    modifiers: { shift: boolean; cmdCtrl: boolean; alt: boolean }
  ) => {
    setSelectedNodeIds((prev) => {
      if (modifiers.alt) {
        // Alt: Remove from selection
        return prev.filter(id => id !== nodeId);
      } else if (modifiers.cmdCtrl) {
        // Cmd/Ctrl: Toggle selection
        if (prev.includes(nodeId)) {
          return prev.filter(id => id !== nodeId);
        } else {
          return [...prev, nodeId];
        }
      } else if (modifiers.shift) {
        // Shift: Add to selection
        if (!prev.includes(nodeId)) {
          return [...prev, nodeId];
        }
        return prev;
      } else {
        // No modifier: Replace selection
        return [nodeId];
      }
    });
  }, []);

  // Called when user edits data in the ParameterEditor
  // Updates single node or multiple nodes (color only for multi-select)
  const handleNodeDataChange = useCallback((nodeIds: string[], updatedData: Partial<NodeData>) => {
    nodeIds.forEach(nodeId => {
      const node = graph.nodes.find(n => n.id === nodeId);
      if (node) {
        const currentData = node.data as NodeData;
        // For multi-select, only update the provided properties (e.g., color)
        graph.updateNodeData(nodeId, { ...currentData, ...updatedData });
      }
    });
  }, [graph]);

  // Called when user closes the editor or clicks canvas
  const handleClose = useCallback(() => {
    setSelectedNodeIds([]);
  }, []);

  // Called when user deletes a node from ParameterEditor
  const handleDeleteNode = useCallback((nodeId: string) => {
    graph.deleteNode(nodeId);
    setSelectedNodeIds((prev) => prev.filter(id => id !== nodeId));
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
        selectedNodeIds={selectedNodeIds}
        onCreateNode={graph.createNode}
        onDuplicateNode={graph.duplicateNode}
        onUndo={graph.undo}
        onRedo={graph.redo}
      />
      <ParameterEditor 
        nodes={graph.nodes}
        selectedNodeIds={selectedNodeIds}
        onDataChange={handleNodeDataChange}
        onClose={handleClose}
        onDelete={handleDeleteNode}
        onCommitChanges={handleCommitChanges}
      />
    </div>
  );
}

export default App;

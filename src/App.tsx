import { useState, useCallback } from 'react';
import { ReactFlowProvider } from 'reactflow';
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
      let newSelection: string[];
      if (modifiers.alt) {
        // Alt: Remove from selection
        newSelection = prev.filter(id => id !== nodeId);
      } else if (modifiers.cmdCtrl) {
        // Cmd/Ctrl: Toggle selection
        if (prev.includes(nodeId)) {
          newSelection = prev.filter(id => id !== nodeId);
        } else {
          newSelection = [...prev, nodeId];
        }
      } else if (modifiers.shift) {
        // Shift: Add to selection
        if (!prev.includes(nodeId)) {
          newSelection = [...prev, nodeId];
        } else {
          newSelection = prev;
        }
      } else {
        // No modifier: Replace selection
        newSelection = [nodeId];
      }
      
      // Sync with graph model
      graph.setSelectedNodeIds(newSelection);
      return newSelection;
    });
  }, [graph]);

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
    graph.setSelectedNodeIds([]);
  }, [graph]);

  // Called when user deletes a node from ParameterEditor
  const handleDeleteNode = useCallback((nodeId: string) => {
    graph.deleteNode(nodeId);
    const newSelection = selectedNodeIds.filter(id => id !== nodeId);
    setSelectedNodeIds(newSelection);
    graph.setSelectedNodeIds(newSelection);
  }, [graph, selectedNodeIds]);
  
  // Called when user commits changes in ParameterEditor (blur or Enter)
  const handleCommitChanges = useCallback(() => {
    graph.captureSnapshot();
  }, [graph]);

  // Called when user creates a new graph
  const handleNew = useCallback(() => {
    graph.newGraph();
    setSelectedNodeIds([]);
    // graph.newGraph() already clears selection internally
  }, [graph]);

  // Called when user saves the graph
  const handleSave = useCallback(() => {
    graph.save();
  }, [graph]);

  // Called when user saves the graph with a new name
  const handleSaveAs = useCallback(() => {
    graph.saveAs();
  }, [graph]);

  // Called when user loads a graph
  const handleLoad = useCallback(async () => {
    const result = await graph.load();
    if (result.success) {
      // Clear selection on successful load
      setSelectedNodeIds([]);
      // graph.load() already clears selection internally
    } else {
      // Show error to user (could be replaced with a toast/notification system)
      alert(`Failed to load file: ${result.error}`);
    }
  }, [graph]);

  return (
    <ReactFlowProvider>
      <div className="app">
        <NodeGraph 
          nodes={graph.nodes}
          edges={graph.edges}
          currentFilename={graph.currentFilename}
          onNodesChange={graph.onNodesChange}
          onEdgesChange={graph.onEdgesChange}
          onConnect={graph.onConnect}
          onNodeDragStop={graph.onNodeDragStop}
          onNodeClick={handleNodeClick}
          onPaneClick={handleClose}
          selectedNodeIds={selectedNodeIds}
          onCreateNode={graph.createNode}
          onDuplicateNode={graph.duplicateNode}
          onNew={handleNew}
          onSave={handleSave}
          onSaveAs={handleSaveAs}
          onLoad={handleLoad}
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
    </ReactFlowProvider>
  );
}

export default App;

import { useState, useEffect, useRef } from 'react';
import { Node } from 'reactflow';
import { NodeData } from '../types';
import './ParameterEditor.css';

interface ParameterEditorProps {
  nodes: Node[];                  // All nodes in the graph
  selectedNodeIds: string[];      // IDs of selected nodes
  onDataChange: (nodeIds: string[], data: Partial<NodeData>) => void;  // Callback when data changes
  onClose: () => void;            // Callback to deselect nodes
  onDelete?: (nodeId: string) => void;  // Callback to delete node
  onCommitChanges?: () => void;   // Callback when user commits changes (blur/Enter)
}

/**
 * ParameterEditor Component - Side panel for editing node parameters
 * 
 * Behavior based on selection:
 * - 0 nodes: All fields disabled
 * - 1 node: All fields enabled (title, color, description)
 * - 2+ nodes: Only color field enabled (batch edit)
 */
function ParameterEditor(
    { nodes, selectedNodeIds, onDataChange, onClose, onDelete, onCommitChanges }: ParameterEditorProps
) {
  // Local state for form fields (allows instant typing without lag)
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [description, setDescription] = useState('');

  // Track what we loaded to prevent propagation loops
  const lastLoadedValuesRef = useRef<{title: string, color: string, description: string} | null>(null);
  const loadedNodeIdRef = useRef<string | null>(null);

  // Get the selected nodes
  const selectedNodes = nodes.filter(n => selectedNodeIds.includes(n.id));
  const selectionCount = selectedNodes.length;
  
  // For single selection, get the node data
  const singleNode = selectionCount === 1 ? selectedNodes[0] : null;

  // On selection change (IDs change), update local state
  // IMPORTANT: Only depend on selectedNodeIds, not nodes or selectedNodes
  // This prevents re-loading when node data changes (which would create a loop)
  useEffect(() => {
    if (selectionCount === 1 && singleNode && singleNode.id !== loadedNodeIdRef.current) {
      // Single node selected - load its data
      const data = singleNode.data as NodeData;
      setTitle(data.title);
      setColor(data.color);
      setDescription(data.description);
      loadedNodeIdRef.current = singleNode.id;
      lastLoadedValuesRef.current = {
        title: data.title,
        color: data.color,
        description: data.description
      };
    } else if (selectionCount === 0) {
      // No selection - reset
      loadedNodeIdRef.current = null;
      lastLoadedValuesRef.current = null;
    } else if (selectionCount > 1 && loadedNodeIdRef.current !== 'multi') {
      // Multiple nodes - only load once when entering multi-select mode
      const firstNodeData = selectedNodes[0].data as NodeData;
      setColor(firstNodeData.color);
      loadedNodeIdRef.current = 'multi';
      lastLoadedValuesRef.current = {
        title: '',
        color: firstNodeData.color,
        description: ''
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNodeIds]);

  // Propagate changes to parent (only for user input, not for loading)
  useEffect(() => {
    // Skip if no valid state loaded
    if (!loadedNodeIdRef.current) return;
    
    if (selectionCount === 1 && loadedNodeIdRef.current === singleNode?.id) {
      // Single node editing - propagate all changes
      const lastLoaded = lastLoadedValuesRef.current;
      // Only propagate if we have loaded values AND they've changed (not on initial load)
      const valuesChanged = lastLoaded && (
        lastLoaded.title !== title || 
        lastLoaded.color !== color || 
        lastLoaded.description !== description
      );
      
      if (valuesChanged) {
        onDataChange(selectedNodeIds, { title, color, description });
        lastLoadedValuesRef.current = { title, color, description };
      }
    } else if (selectionCount > 1 && loadedNodeIdRef.current === 'multi') {
      // Multi-node editing - only propagate color changes
      const lastLoaded = lastLoadedValuesRef.current;
      // Only propagate if we have loaded values AND color has changed (not on initial load)
      const colorChanged = lastLoaded && lastLoaded.color !== color;
      
      if (colorChanged) {
        onDataChange(selectedNodeIds, { color });
        lastLoadedValuesRef.current = { title: '', color, description: '' };
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, color, description]);

  // Determine UI state
  const noSelection = selectionCount === 0;
  const singleSelection = selectionCount === 1;
  const multiSelection = selectionCount > 1;

  // Handle Enter key to commit changes
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onCommitChanges) {
      onCommitChanges();
    }
  };

  // Handle blur to commit changes
  const handleBlur = () => {
    if (onCommitChanges) {
      onCommitChanges();
    }
  };

  return (
    <div className={`parameter-editor${noSelection ? " disabled" : ""}`}>
      <div className="editor-header">
        <h2>
          {noSelection && "No Selection"}
          {singleSelection && "Edit Node"}
          {multiSelection && `Edit ${selectionCount} Nodes`}
        </h2>
        <button
          className="close-button"
          onClick={onClose}
          aria-label="Close"
          disabled={noSelection}
          style={noSelection ? { opacity: 0.5, cursor: "not-allowed" } : {}}
        >
          ✕
        </button>
      </div>

      <div className="editor-content">
        {/* Show message for multi-selection */}
        {multiSelection && (
          <div className="multi-select-info">
            <p>Multiple nodes selected. Only color can be edited in batch mode.</p>
          </div>
        )}

        {/* Title field - only enabled for single selection */}
        <div className="form-group">
          <label htmlFor="node-title">Title</label>
          <input
            id="node-title"
            type="text"
            value={singleSelection ? title : ""}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={multiSelection ? "Multiple values..." : "Node title..."}
            className="input"
            disabled={!singleSelection}
            style={!singleSelection ? { background: "#3a3a3a", color: "#888" } : {}}
          />
        </div>

        {/* Color field - enabled for single or multi selection */}
        <div className="form-group">
          <label htmlFor="node-color">Color</label>
          <div className="color-input-group">
            <input
              id="node-color"
              type="color"
              value={noSelection ? "#404040" : color}
              onChange={(e) => setColor(e.target.value)}
              onBlur={handleBlur}
              className="color-picker"
              disabled={noSelection}
              style={noSelection ? { cursor: "not-allowed", background: "#3a3a3a" } : {}}
            />
            <input
              type="text"
              value={noSelection ? "" : color}
              onChange={(e) => setColor(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder=""
              className="input color-text"
              disabled={noSelection}
              style={noSelection ? { background: "#3a3a3a", color: "#888" } : {}}
            />
          </div>
        </div>

        {/* Description field - only enabled for single selection */}
        <div className="form-group flex-grow">
          <label htmlFor="node-description">Description</label>
          <textarea
            id="node-description"
            value={singleSelection ? description : ""}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleBlur}
            placeholder={multiSelection ? "Multiple values..." : "Node description..."}
            className="textarea"
            disabled={!singleSelection}
            style={!singleSelection ? { background: "#3a3a3a", color: "#888" } : {}}
          />
        </div>

        <div className="node-info">
          <div className="info-item">
            <span className="info-label">
              {singleSelection ? "Node ID:" : "Selection:"}
            </span>
            <span className="info-value">
              {noSelection && "—"}
              {singleSelection && singleNode?.id}
              {multiSelection && `${selectionCount} nodes`}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Characters:</span>
            <span className="info-value">
              {singleSelection ? description.length : "—"}
            </span>
          </div>
        </div>

        {/* Delete button - only for single selection */}
        {onDelete && singleSelection && (
          <button
            className="delete-button"
            onClick={() => singleNode && onDelete(singleNode.id)}
            title="Delete this node"
          >
            🗑️ Delete Node
          </button>
        )}
      </div>
    </div>
  );
}

export default ParameterEditor;

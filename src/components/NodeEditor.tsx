import { useState, useEffect } from 'react';
import { NodeData } from '../types';
import './NodeEditor.css';

interface NodeEditorProps {
  nodeId: string | null;          // ID of selected node (null if none)
  nodeData: NodeData | null;      // Data of selected node
  onDataChange: (data: NodeData) => void;  // Callback when data changes
  onClose: () => void;            // Callback to deselect node
}

/**
 * NodeEditor Component - Side panel for editing node content
 * 
 * Enabled only when exactly 1 node is selected
 * Shows form fields for: title, color, description
 */
function NodeEditor(
    { nodeId, nodeData, onDataChange, onClose }: // props
    NodeEditorProps // type definition
) {
  // Local state for form fields (allows instant typing without lag)
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [description, setDescription] = useState('');

  // Track if we're loading initial data (to prevent propagating on first load)
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // On node selection, update local state
  useEffect(() => {
    if (nodeData) {
      setTitle(nodeData.title);
      setColor(nodeData.color);
      setDescription(nodeData.description);
      setIsInitialLoad(true); // Mark as initial load when node changes
    }
  }, [nodeData, nodeId]);

  // On param edit, propagate changes to parent component (updates the actual node)
  useEffect(() => {
    if (nodeData && !isInitialLoad) {
      onDataChange({
        title,
        color,
        description,
      });
    }
    if (isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [title, color, description, nodeData, onDataChange, isInitialLoad]);

  // Always show the editor panel, but disable fields if 0 or >1 node selected

  // Determine if we have exactly one selected node
  const exactlyOneSelected = !!nodeId && !!nodeData;

  // For clarity: if not exactly one node, disable all fields and add a visual "disabled" style
  // (for greyed out effect, .disabled styling can be added in CSS)
  return (
    <div className={`node-editor${!exactlyOneSelected ? " disabled" : ""}`}>
      <div className="editor-header">
        <h2>Edit Node</h2>
        <button
          className="close-button"
          onClick={onClose}
          aria-label="Close"
          disabled={!exactlyOneSelected}
          style={!exactlyOneSelected ? { opacity: 0.5, cursor: "not-allowed" } : {}}
        >
          ✕
        </button>
      </div>

      <div className="editor-content">

        {/* Title field */}
        <div className="form-group">
          <label htmlFor="node-title">Title</label>
          <input
            id="node-title"
            type="text"
            value={exactlyOneSelected?title:""}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Node title..."
            className="input"
            disabled={!exactlyOneSelected}
            style={!exactlyOneSelected ? { background: "#3a3a3a", color: "#888" } : {}}
          />
        </div>

        {/* Color field */}
        <div className="form-group">
          <label htmlFor="node-color">Color</label>
          <div className="color-input-group">
            <input
              id="node-color"
              type="color"
              value={exactlyOneSelected?color:"#404040"}
              onChange={(e) => setColor(e.target.value)}
              className="color-picker"
              disabled={!exactlyOneSelected}
              style={!exactlyOneSelected ? { cursor: "not-allowed", background: "#3a3a3a" } : {}}
            />
            <input
              type="text"
              value={exactlyOneSelected?color:""}
              onChange={(e) => setColor(e.target.value)}
              placeholder=""
              className="input color-text"
              disabled={!exactlyOneSelected}
              style={!exactlyOneSelected ? { background: "#3a3a3a", color: "#888" } : {}}
            />
          </div>
        </div>

        {/* Description field */}
        <div className="form-group flex-grow">
          <label htmlFor="node-description">Description</label>
          <textarea
            id="node-description"
            value={exactlyOneSelected?description:""}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Node description..."
            className="textarea"
            disabled={!exactlyOneSelected}
            style={!exactlyOneSelected ? { background: "#3a3a3a", color: "#888" } : {}}
          />
        </div>

        <div className="node-info">
          <div className="info-item">
            <span className="info-label">Node ID:</span>
            <span className="info-value">
              {exactlyOneSelected ? nodeId : "—"}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Characters:</span>
            <span className="info-value">
              {exactlyOneSelected ? description.length : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NodeEditor;

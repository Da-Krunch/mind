import { useState, useEffect, useRef } from 'react';
import { NodeData } from '../types';
import './ParameterEditor.css';

interface ParameterEditorProps {
  nodeId: string | null;          // ID of selected node (null if none)
  nodeData: NodeData | null;      // Data of selected node
  onDataChange: (data: NodeData) => void;  // Callback when data changes
  onClose: () => void;            // Callback to deselect node
}

/**
 * ParameterEditor Component - Side panel for editing node parameters
 * 
 * Enabled only when exactly 1 node is selected
 * Shows form fields for: title, color, description
 */
function ParameterEditor(
    { nodeId, nodeData, onDataChange, onClose }: // props
    ParameterEditorProps // type definition
) {
  // Local state for form fields (allows instant typing without lag)
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [description, setDescription] = useState('');

  // Use a ref to track the last values we loaded from nodeData
  // This lets us detect if local changes are from user input or from loading
  const lastLoadedValuesRef = useRef<{title: string, color: string, description: string} | null>(null);
  const loadedNodeIdRef = useRef<string | null>(null);

  // On node selection, update local state
  useEffect(() => {
    console.log('🔵 Loading node data:', { nodeId, nodeData, loadedNodeId: loadedNodeIdRef.current });
    if (nodeData && nodeId !== loadedNodeIdRef.current) {
      // New node selected - load its data into local state
      console.log('  Loading NEW node, setting local state to:', nodeData.title, nodeData.color, nodeData.description);
      setTitle(nodeData.title);
      setColor(nodeData.color);
      setDescription(nodeData.description);
      loadedNodeIdRef.current = nodeId;
      // Remember these values - don't propagate them back
      lastLoadedValuesRef.current = {
        title: nodeData.title,
        color: nodeData.color,
        description: nodeData.description
      };
    } else if (!nodeData) {
      // No node selected - reset
      console.log('  No node selected, resetting');
      loadedNodeIdRef.current = null;
      lastLoadedValuesRef.current = null;
    }
  }, [nodeData, nodeId]);

  // On param edit, propagate changes to parent component (updates the actual node)
  // This should ONLY run when local form fields change due to USER INPUT
  useEffect(() => {
    console.log('🟡 Propagation check:', { 
      loadedNodeId: loadedNodeIdRef.current, 
      nodeId, 
      localState: { title, color, description },
      lastLoaded: lastLoadedValuesRef.current
    });
    
    // Only propagate if we have a loaded node and the values have changed from what we loaded
    if (loadedNodeIdRef.current && nodeId === loadedNodeIdRef.current) {
      const lastLoaded = lastLoadedValuesRef.current;
      const valuesChanged = !lastLoaded || 
        lastLoaded.title !== title || 
        lastLoaded.color !== color || 
        lastLoaded.description !== description;
      
      if (valuesChanged) {
        console.log('🔴 PROPAGATING changes to parent:', { title, color, description });
        onDataChange({
          title,
          color,
          description,
        });
        // Update lastLoaded so we don't propagate the same values again
        lastLoadedValuesRef.current = { title, color, description };
      } else {
        console.log('  ⏭️  Skipping propagation (values unchanged from load)');
      }
    } else {
      console.log('  ⏭️  Skipping propagation (no node loaded or ID mismatch)');
    }
  }, [title, color, description, onDataChange, nodeId]);

  // Always show the editor panel, but disable fields if 0 or >1 node selected

  // Determine if we have exactly one selected node
  const exactlyOneSelected = !!nodeId && !!nodeData;

  // For clarity: if not exactly one node, disable all fields and add a visual "disabled" style
  // (for greyed out effect, .disabled styling can be added in CSS)
  return (
    <div className={`parameter-editor${!exactlyOneSelected ? " disabled" : ""}`}>
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

export default ParameterEditor;

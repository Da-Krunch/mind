import { useState, useEffect, useRef, useCallback } from 'react';
import { Node, Edge } from 'reactflow';

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

interface UseHistoryReturn {
  undo: () => void;
  redo: () => void;
  captureSnapshot: () => void;
  canUndo: boolean;
  canRedo: boolean;
  historyLength: number;
}

/**
 * Custom hook for managing undo/redo history
 * 
 * Tracks changes to nodes and edges, allowing undo/redo up to a maximum number of steps.
 * Uses a flag-based system to capture snapshots reliably when state actually updates.
 * 
 * @param nodes - Current nodes array
 * @param edges - Current edges array
 * @param setNodes - Function to update nodes
 * @param setEdges - Function to update edges
 * @param maxSteps - Maximum number of undo steps (default: 16)
 * @returns Object with undo, redo, and captureSnapshot functions plus state info
 */
export function useHistory(
  nodes: Node[],
  edges: Edge[],
  setNodes: (nodes: Node[]) => void,
  setEdges: (edges: Edge[]) => void,
  maxSteps: number = 16
): UseHistoryReturn {
  const [history, setHistory] = useState<HistoryState[]>([
    { nodes: [...nodes], edges: [...edges] }
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // Refs for controlling capture behavior
  const isRestoringRef = useRef(false);  // Prevent capturing during undo/redo
  const shouldCaptureRef = useRef(false);  // Flag to indicate we want to capture next change
  
  // Capture snapshot when nodes or edges change (if flagged)
  useEffect(() => {
    if (isRestoringRef.current) return;  // Don't capture during undo/redo
    if (!shouldCaptureRef.current) return;  // Only capture when explicitly requested
    
    shouldCaptureRef.current = false;  // Reset flag
    
    setHistory(prev => {
      // Remove any "future" history if we're not at the end
      const newHistory = prev.slice(0, historyIndex + 1);
      // Add new snapshot
      newHistory.push({ nodes: [...nodes], edges: [...edges] });
      // Limit to maxSteps + 1 total states (including current)
      if (newHistory.length > maxSteps + 1) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, maxSteps));
  }, [nodes, edges, historyIndex, maxSteps]);
  
  // Request a snapshot capture (will happen on next state change)
  const captureSnapshot = useCallback(() => {
    shouldCaptureRef.current = true;
  }, []);
  
  // Undo function
  const undo = useCallback(() => {
    if (historyIndex > 0 && history.length > 0) {
      const newIndex = historyIndex - 1;
      const snapshot = history[newIndex];
      
      // Safety check - ensure snapshot exists
      if (!snapshot) return;
      
      isRestoringRef.current = true;
      setNodes(snapshot.nodes);
      setEdges(snapshot.edges);
      setHistoryIndex(newIndex);
      
      // Reset flag after state updates
      setTimeout(() => {
        isRestoringRef.current = false;
      }, 0);
    }
  }, [historyIndex, history, setNodes, setEdges]);
  
  // Redo function
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1 && history.length > 0) {
      const newIndex = historyIndex + 1;
      const snapshot = history[newIndex];
      
      // Safety check - ensure snapshot exists
      if (!snapshot) return;
      
      isRestoringRef.current = true;
      setNodes(snapshot.nodes);
      setEdges(snapshot.edges);
      setHistoryIndex(newIndex);
      
      // Reset flag after state updates
      setTimeout(() => {
        isRestoringRef.current = false;
      }, 0);
    }
  }, [historyIndex, history, setNodes, setEdges]);
  
  return {
    undo,
    redo,
    captureSnapshot,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    historyLength: history.length,
  };
}

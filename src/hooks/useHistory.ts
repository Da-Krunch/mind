import { useRef, useCallback, useEffect, useState } from 'react';
import { Node, Edge } from 'reactflow';
import { HistoryManager } from '../lib/HistoryManager';

interface UseHistoryReturn {
  undo: () => void;
  redo: () => void;
  captureSnapshot: () => void;
  canUndo: boolean;
  canRedo: boolean;
  historyLength: number;
}

/**
 * React hook wrapper for HistoryManager
 * 
 * Provides a React-friendly interface to the pure HistoryManager class.
 * Handles integration with React's rendering cycle and state management.
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
  // Create HistoryManager instance (persists across renders)
  const managerRef = useRef<HistoryManager>(
    new HistoryManager({ nodes, edges }, maxSteps)
  );
  
  // Flag to prevent capturing during undo/redo
  const isRestoringRef = useRef(false);
  
  // Flag to request snapshot capture on next render
  const shouldCaptureRef = useRef(false);
  
  // State to trigger re-renders when history state changes
  const [, forceUpdate] = useState({});
  
  // Capture snapshot when nodes or edges change (if flagged)
  useEffect(() => {
    if (isRestoringRef.current) return;
    if (!shouldCaptureRef.current) return;
    
    shouldCaptureRef.current = false;
    managerRef.current.capture({ nodes, edges });
    forceUpdate({}); // Trigger re-render to update canUndo/canRedo
  }, [nodes, edges]);
  
  // Request a snapshot capture (will happen on next state change)
  const captureSnapshot = useCallback(() => {
    shouldCaptureRef.current = true;
  }, []);
  
  // Undo to previous state
  const undo = useCallback(() => {
    const previous = managerRef.current.undo();
    if (previous) {
      isRestoringRef.current = true;
      setNodes(previous.nodes);
      setEdges(previous.edges);
      
      // Reset flag after state updates
      setTimeout(() => {
        isRestoringRef.current = false;
      }, 0);
      
      forceUpdate({}); // Trigger re-render
    }
  }, [setNodes, setEdges]);
  
  // Redo to next state
  const redo = useCallback(() => {
    const next = managerRef.current.redo();
    if (next) {
      isRestoringRef.current = true;
      setNodes(next.nodes);
      setEdges(next.edges);
      
      // Reset flag after state updates
      setTimeout(() => {
        isRestoringRef.current = false;
      }, 0);
      
      forceUpdate({}); // Trigger re-render
    }
  }, [setNodes, setEdges]);
  
  return {
    undo,
    redo,
    captureSnapshot,
    canUndo: managerRef.current.canUndo(),
    canRedo: managerRef.current.canRedo(),
    historyLength: managerRef.current.length(),
  };
}

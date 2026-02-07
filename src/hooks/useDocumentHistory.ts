import { useRef, useCallback, useState } from 'react';
import { DocumentModel, HierarchicalNode } from '../lib/DocumentModel';

interface UseDocumentHistoryReturn {
  undo: () => void;
  redo: () => void;
  captureSnapshot: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * History manager for DocumentModel
 * 
 * Tracks document snapshots for undo/redo functionality.
 * Stores the document as JSON (serialized nodes) for efficient deep cloning.
 */
class DocumentHistoryManager {
  private history: HierarchicalNode[][] = [];
  private currentIndex: number = -1;
  private maxSteps: number;

  constructor(maxSteps: number = 16) {
    this.maxSteps = maxSteps;
  }

  /**
   * Capture a snapshot of the current document
   */
  capture(document: DocumentModel): void {
    // Remove any redo history when capturing new state
    this.history = this.history.slice(0, this.currentIndex + 1);
    
    // Add new snapshot (as JSON for deep clone)
    const snapshot = document.toJSON();
    this.history.push(snapshot);
    
    // Enforce max steps limit
    if (this.history.length > this.maxSteps) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }
  }

  /**
   * Undo to previous state
   */
  undo(): DocumentModel | null {
    if (!this.canUndo()) return null;
    
    this.currentIndex--;
    return DocumentModel.fromJSON(this.history[this.currentIndex]);
  }

  /**
   * Redo to next state
   */
  redo(): DocumentModel | null {
    if (!this.canRedo()) return null;
    
    this.currentIndex++;
    return DocumentModel.fromJSON(this.history[this.currentIndex]);
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Get current history length
   */
  length(): number {
    return this.history.length;
  }
}

/**
 * React hook for DocumentModel history (undo/redo)
 * 
 * Provides undo/redo functionality specifically for DocumentModel.
 * Stores snapshots as JSON for efficient deep cloning.
 * 
 * @param document - Current document state
 * @param setDocument - Function to update document
 * @param maxSteps - Maximum number of undo steps (default: 16)
 * @returns Object with undo, redo, and captureSnapshot functions plus state info
 */
export function useDocumentHistory(
  document: DocumentModel,
  setDocument: (doc: DocumentModel) => void,
  maxSteps: number = 16
): UseDocumentHistoryReturn {
  // Create history manager (persists across renders)
  const managerRef = useRef<DocumentHistoryManager>(
    new DocumentHistoryManager(maxSteps)
  );
  
  // Flag to prevent capturing during undo/redo
  const isRestoringRef = useRef(false);
  
  // Ref to always capture the latest document
  const documentRef = useRef(document);
  documentRef.current = document;
  
  // State to trigger re-renders when history state changes
  const [, forceUpdate] = useState({});
  
  // Capture a snapshot of the current document
  const captureSnapshot = useCallback(() => {
    if (isRestoringRef.current) return;
    
    managerRef.current.capture(documentRef.current);
    forceUpdate({}); // Trigger re-render to update canUndo/canRedo
  }, []);
  
  // Undo to previous state
  const undo = useCallback(() => {
    const previous = managerRef.current.undo();
    if (previous) {
      isRestoringRef.current = true;
      setDocument(previous);
      
      // Reset flag after state updates
      setTimeout(() => {
        isRestoringRef.current = false;
      }, 0);
      
      forceUpdate({}); // Trigger re-render
    }
  }, [setDocument]);
  
  // Redo to next state
  const redo = useCallback(() => {
    const next = managerRef.current.redo();
    if (next) {
      isRestoringRef.current = true;
      setDocument(next);
      
      // Reset flag after state updates
      setTimeout(() => {
        isRestoringRef.current = false;
      }, 0);
      
      forceUpdate({}); // Trigger re-render
    }
  }, [setDocument]);
  
  return {
    undo,
    redo,
    captureSnapshot,
    canUndo: managerRef.current.canUndo(),
    canRedo: managerRef.current.canRedo(),
  };
}

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDocumentHistory } from './useDocumentHistory';
import { DocumentModel } from '../lib/DocumentModel';

describe('useDocumentHistory', () => {
  it('should initialize with no undo/redo available', () => {
    const document = DocumentModel.empty();
    const setDocument = () => {};

    const { result } = renderHook(() => useDocumentHistory(document, setDocument));

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('should capture snapshots', () => {
    const document = DocumentModel.empty();
    let currentDoc = document;
    const setDocument = (doc: DocumentModel) => { currentDoc = doc; };

    const { result, rerender } = renderHook(() => useDocumentHistory(currentDoc, setDocument));

    // Capture initial state
    act(() => {
      result.current.captureSnapshot();
    });
    rerender();

    expect(result.current.canUndo).toBe(false); // Can't undo to before first snapshot
    expect(result.current.canRedo).toBe(false);

    // Make a change and capture
    const node = currentDoc.createNode(null);
    currentDoc = currentDoc.addNode(node);
    rerender();
    
    act(() => {
      result.current.captureSnapshot();
    });
    rerender();

    expect(result.current.canUndo).toBe(true);  // Now we can undo
    expect(result.current.canRedo).toBe(false);
  });

  it('should undo to previous state', () => {
    const doc = DocumentModel.empty();
    let currentDoc = doc;
    const setDocument = (newDoc: DocumentModel) => { currentDoc = newDoc; };

    const { result, rerender } = renderHook(() => useDocumentHistory(currentDoc, setDocument));

    // Capture empty state
    act(() => {
      result.current.captureSnapshot();
    });
    rerender();

    // Add a node and capture
    const node = currentDoc.createNode(null);
    currentDoc = currentDoc.addNode(node);
    rerender();
    
    act(() => {
      result.current.captureSnapshot();
    });
    rerender();

    expect(currentDoc.getNodeCount()).toBe(1);
    expect(result.current.canUndo).toBe(true);

    // Undo
    act(() => {
      result.current.undo();
    });
    rerender();

    expect(currentDoc.getNodeCount()).toBe(0);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it('should redo to next state', () => {
    const doc = DocumentModel.empty();
    let currentDoc = doc;
    const setDocument = (newDoc: DocumentModel) => { currentDoc = newDoc; };

    const { result, rerender } = renderHook(() => useDocumentHistory(currentDoc, setDocument));

    // Capture empty state
    act(() => {
      result.current.captureSnapshot();
    });
    rerender();

    // Add a node and capture
    const node = currentDoc.createNode(null);
    currentDoc = currentDoc.addNode(node);
    rerender();
    
    act(() => {
      result.current.captureSnapshot();
    });
    rerender();

    // Undo
    act(() => {
      result.current.undo();
    });
    rerender();

    expect(currentDoc.getNodeCount()).toBe(0);
    expect(result.current.canRedo).toBe(true);

    // Redo
    act(() => {
      result.current.redo();
    });
    rerender();

    expect(currentDoc.getNodeCount()).toBe(1);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('should preserve document data through undo/redo', () => {
    const doc = DocumentModel.empty();
    let currentDoc = doc;
    const setDocument = (newDoc: DocumentModel) => { currentDoc = newDoc; };

    const { result, rerender } = renderHook(() => useDocumentHistory(currentDoc, setDocument));

    // Capture empty state
    act(() => {
      result.current.captureSnapshot();
    });
    rerender();

    // Add a node with specific data
    const node = currentDoc.createNode(null, { x: 123, y: 456 });
    currentDoc = currentDoc.addNode(node);
    currentDoc = currentDoc.updateNodeData(node.id, {
      title: 'Test Node',
      color: '#ff0000',
      description: 'Test description',
    });
    rerender();
    
    act(() => {
      result.current.captureSnapshot();
    });
    rerender();

    // Undo
    act(() => {
      result.current.undo();
    });
    rerender();

    expect(currentDoc.getNodeCount()).toBe(0);

    // Redo
    act(() => {
      result.current.redo();
    });
    rerender();

    const restoredNode = currentDoc.findNode(node.id);
    expect(restoredNode).toBeDefined();
    expect(restoredNode?.position).toEqual({ x: 123, y: 456 });
    expect(restoredNode?.data.title).toBe('Test Node');
    expect(restoredNode?.data.color).toBe('#ff0000');
    expect(restoredNode?.data.description).toBe('Test description');
  });

  it('should preserve hierarchical relationships', () => {
    const doc = DocumentModel.empty();
    let currentDoc = doc;
    const setDocument = (newDoc: DocumentModel) => { currentDoc = newDoc; };

    const { result, rerender } = renderHook(() => useDocumentHistory(currentDoc, setDocument));

    // Capture empty state
    act(() => {
      result.current.captureSnapshot();
    });
    rerender();

    // Create parent and child
    const parent = currentDoc.createNode(null);
    const child = currentDoc.createNode(parent.id);
    currentDoc = currentDoc.addNode(parent).addNode(child);
    currentDoc = currentDoc.addEdge(parent.id, child.id);
    rerender();
    
    act(() => {
      result.current.captureSnapshot();
    });
    rerender();

    // Undo
    act(() => {
      result.current.undo();
    });
    rerender();

    // Redo
    act(() => {
      result.current.redo();
    });
    rerender();

    const restoredChild = currentDoc.findNode(child.id);
    expect(restoredChild?.data.parentId).toBe(parent.id);
    expect(restoredChild?.data.upstreamIds).toContain(parent.id);
  });

  it('should enforce max steps limit', () => {
    const doc = DocumentModel.empty();
    let currentDoc = doc;
    const setDocument = (newDoc: DocumentModel) => { currentDoc = newDoc; };

    const maxSteps = 3;
    const { result, rerender } = renderHook(() => 
      useDocumentHistory(currentDoc, setDocument, maxSteps)
    );

    // Capture 4 states (exceeds maxSteps)
    for (let i = 0; i < 4; i++) {
      const node = currentDoc.createNode(null);
      currentDoc = currentDoc.addNode(node);
      rerender();
      
      act(() => {
        result.current.captureSnapshot();
      });
      rerender();
    }

    // Should only be able to undo maxSteps-1 times
    let undoCount = 0;
    while (result.current.canUndo) {
      act(() => {
        result.current.undo();
      });
      rerender();
      undoCount++;
    }

    expect(undoCount).toBe(maxSteps - 1);
  });
});

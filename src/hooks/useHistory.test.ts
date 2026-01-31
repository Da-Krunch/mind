import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHistory } from './useHistory';
import { Node, Edge } from 'reactflow';

/**
 * Integration tests for useHistory hook
 * 
 * Note: The business logic is fully tested in HistoryManager.test.ts
 * These tests only verify the React integration layer works correctly.
 */
describe('useHistory - React Integration', () => {
  const initialNodes: Node[] = [
    { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
  ];

  const initialEdges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2' },
  ];

  it('should return the correct interface', () => {
    let nodes = [...initialNodes];
    let edges = [...initialEdges];
    const setNodes = (newNodes: Node[]) => { nodes = newNodes; };
    const setEdges = (newEdges: Edge[]) => { edges = newEdges; };

    const { result } = renderHook(() =>
      useHistory(nodes, edges, setNodes, setEdges)
    );

    // Verify all expected methods and properties exist
    expect(typeof result.current.undo).toBe('function');
    expect(typeof result.current.redo).toBe('function');
    expect(typeof result.current.captureSnapshot).toBe('function');
    expect(typeof result.current.canUndo).toBe('boolean');
    expect(typeof result.current.canRedo).toBe('boolean');
    expect(typeof result.current.historyLength).toBe('number');
  });

  it('should initialize with no undo/redo available', () => {
    let nodes = [...initialNodes];
    let edges = [...initialEdges];
    const setNodes = (newNodes: Node[]) => { nodes = newNodes; };
    const setEdges = (newEdges: Edge[]) => { edges = newEdges; };

    const { result } = renderHook(() =>
      useHistory(nodes, edges, setNodes, setEdges)
    );

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('should capture snapshots and enable undo', () => {
    let nodes = [...initialNodes];
    let edges = [...initialEdges];
    const setNodes = (newNodes: Node[]) => { nodes = newNodes; };
    const setEdges = (newEdges: Edge[]) => { edges = newEdges; };

    const { result, rerender } = renderHook(() =>
      useHistory(nodes, edges, setNodes, setEdges)
    );

    // Modify state
    nodes = [{ id: '2', position: { x: 100, y: 100 }, data: { label: 'Node 2' } }];
    
    // Request snapshot
    act(() => {
      result.current.captureSnapshot();
    });

    // Rerender to trigger useEffect
    rerender();

    // Should now be able to undo
    expect(result.current.canUndo).toBe(true);
  });
});

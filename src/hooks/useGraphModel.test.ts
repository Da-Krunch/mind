import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGraphModel } from './useGraphModel';

/**
 * Integration tests for useGraphModel hook
 * 
 * Note: The business logic is fully tested in GraphOperations.test.ts and HistoryManager.test.ts
 * These tests only verify the React integration layer works correctly.
 */
describe('useGraphModel - React Integration', () => {
  it('should return the correct interface', () => {
    const { result } = renderHook(() => useGraphModel());

    // Verify state
    expect(Array.isArray(result.current.nodes)).toBe(true);
    expect(Array.isArray(result.current.edges)).toBe(true);

    // Verify ReactFlow handlers
    expect(typeof result.current.onNodesChange).toBe('function');
    expect(typeof result.current.onEdgesChange).toBe('function');
    expect(typeof result.current.onConnect).toBe('function');
    expect(typeof result.current.onNodeDragStop).toBe('function');

    // Verify graph operations
    expect(typeof result.current.createNode).toBe('function');
    expect(typeof result.current.duplicateNode).toBe('function');
    expect(typeof result.current.deleteNode).toBe('function');
    expect(typeof result.current.updateNodeData).toBe('function');

    // Verify history operations
    expect(typeof result.current.undo).toBe('function');
    expect(typeof result.current.redo).toBe('function');
    expect(typeof result.current.captureSnapshot).toBe('function');
    expect(typeof result.current.canUndo).toBe('boolean');
    expect(typeof result.current.canRedo).toBe('boolean');
  });

  it('should initialize with default nodes and edges', () => {
    const { result } = renderHook(() => useGraphModel());

    // Should have initial nodes
    expect(result.current.nodes.length).toBeGreaterThan(0);
    expect(result.current.edges.length).toBeGreaterThan(0);
  });

  it('should create a new node', () => {
    const { result } = renderHook(() => useGraphModel());

    const initialCount = result.current.nodes.length;

    act(() => {
      result.current.createNode();
    });

    expect(result.current.nodes.length).toBe(initialCount + 1);
  });

  it('should duplicate a node', () => {
    const { result } = renderHook(() => useGraphModel());

    const firstNodeId = result.current.nodes[0].id;
    const initialCount = result.current.nodes.length;

    act(() => {
      result.current.duplicateNode(firstNodeId);
    });

    expect(result.current.nodes.length).toBe(initialCount + 1);
  });

  it('should delete a node', () => {
    const { result } = renderHook(() => useGraphModel());

    const firstNodeId = result.current.nodes[0].id;
    const initialCount = result.current.nodes.length;

    act(() => {
      result.current.deleteNode(firstNodeId);
    });

    expect(result.current.nodes.length).toBe(initialCount - 1);
    expect(result.current.nodes.find(n => n.id === firstNodeId)).toBeUndefined();
  });

  it('should update node data', () => {
    const { result } = renderHook(() => useGraphModel());

    const firstNodeId = result.current.nodes[0].id;
    const newTitle = 'Updated Title';

    act(() => {
      result.current.updateNodeData(firstNodeId, {
        title: newTitle,
        color: '#ff0000',
        description: 'Updated description',
      });
    });

    const updatedNode = result.current.nodes.find(n => n.id === firstNodeId);
    expect(updatedNode?.data.title).toBe(newTitle);
  });
});

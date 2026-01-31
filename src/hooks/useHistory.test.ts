import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHistory } from './useHistory';
import { Node, Edge } from 'reactflow';

describe('useHistory', () => {
  // Test data
  const initialNodes: Node[] = [
    { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
    { id: '2', position: { x: 100, y: 100 }, data: { label: 'Node 2' } },
  ];

  const initialEdges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2' },
  ];

  let nodes: Node[];
  let edges: Edge[];
  let setNodes: (nodes: Node[]) => void;
  let setEdges: (edges: Edge[]) => void;

  beforeEach(() => {
    // Reset state before each test
    nodes = [...initialNodes];
    edges = [...initialEdges];
    setNodes = (newNodes: Node[]) => { nodes = newNodes; };
    setEdges = (newEdges: Edge[]) => { edges = newEdges; };
  });

  describe('Initial State', () => {
    it('should initialize with correct initial state', () => {
      const { result } = renderHook(() =>
        useHistory(nodes, edges, setNodes, setEdges)
      );

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.historyLength).toBe(1);
    });

    it('should not allow undo on initial state', () => {
      const { result } = renderHook(() =>
        useHistory(nodes, edges, setNodes, setEdges)
      );

      const nodesBefore = nodes;
      act(() => {
        result.current.undo();
      });

      expect(nodes).toBe(nodesBefore);
    });

    it('should not allow redo on initial state', () => {
      const { result } = renderHook(() =>
        useHistory(nodes, edges, setNodes, setEdges)
      );

      const nodesBefore = nodes;
      act(() => {
        result.current.redo();
      });

      expect(nodes).toBe(nodesBefore);
    });
  });

  describe('Capturing Snapshots', () => {
    it('should capture a snapshot when requested', () => {
      const { result, rerender } = renderHook(
        ({ n, e }) => useHistory(n, e, setNodes, setEdges),
        { initialProps: { n: nodes, e: edges } }
      );

      // Modify state
      const newNodes = [
        ...nodes,
        { id: '3', position: { x: 200, y: 200 }, data: { label: 'Node 3' } },
      ];
      
      act(() => {
        nodes = newNodes;
        result.current.captureSnapshot();
      });

      // Rerender with new state to trigger useEffect
      rerender({ n: newNodes, e: edges });

      expect(result.current.historyLength).toBe(2);
      expect(result.current.canUndo).toBe(true);
    });

    it('should allow undo after capturing snapshot', () => {
      const { result, rerender } = renderHook(() =>
        useHistory(nodes, edges, setNodes, setEdges)
      );

      const originalNodes = [...nodes];

      // Add a node
      act(() => {
        nodes = [
          ...nodes,
          { id: '3', position: { x: 200, y: 200 }, data: { label: 'Node 3' } },
        ];
      });
      rerender();

      // Capture snapshot
      act(() => {
        result.current.captureSnapshot();
      });
      rerender();

      expect(nodes.length).toBe(3);

      // Undo
      act(() => {
        result.current.undo();
      });

      expect(nodes.length).toBe(originalNodes.length);
      expect(nodes[0].id).toBe(originalNodes[0].id);
    });
  });

  describe('Undo Functionality', () => {
    it('should restore previous state on undo', () => {
      const { result, rerender } = renderHook(() =>
        useHistory(nodes, edges, setNodes, setEdges)
      );

      const originalNodes = [...nodes];

      // Change 1: Add node
      act(() => {
        nodes = [
          ...nodes,
          { id: '3', position: { x: 200, y: 200 }, data: { label: 'Node 3' } },
        ];
      });
      rerender();
      act(() => result.current.captureSnapshot());
      rerender();

      // Change 2: Add another node
      act(() => {
        nodes = [
          ...nodes,
          { id: '4', position: { x: 300, y: 300 }, data: { label: 'Node 4' } },
        ];
      });
      rerender();
      act(() => result.current.captureSnapshot());
      rerender();

      expect(nodes.length).toBe(4);

      // Undo once - should have 3 nodes
      act(() => result.current.undo());
      expect(nodes.length).toBe(3);

      // Undo again - should have 2 nodes
      act(() => result.current.undo());
      expect(nodes.length).toBe(2);
      expect(nodes[0].id).toBe(originalNodes[0].id);
    });

    it('should update canUndo flag correctly', () => {
      const { result, rerender } = renderHook(() =>
        useHistory(nodes, edges, setNodes, setEdges)
      );

      expect(result.current.canUndo).toBe(false);

      // Add a change
      act(() => {
        nodes = [...nodes, { id: '3', position: { x: 200, y: 200 }, data: { label: 'Node 3' } }];
      });
      rerender();
      act(() => result.current.captureSnapshot());
      rerender();

      expect(result.current.canUndo).toBe(true);

      // Undo to beginning
      act(() => result.current.undo());
      expect(result.current.canUndo).toBe(false);
    });

    it('should handle edges correctly on undo', () => {
      const { result, rerender } = renderHook(() =>
        useHistory(nodes, edges, setNodes, setEdges)
      );

      const originalEdges = [...edges];

      // Add an edge
      act(() => {
        edges = [...edges, { id: 'e2-3', source: '2', target: '3' }];
      });
      rerender();
      act(() => result.current.captureSnapshot());
      rerender();

      expect(edges.length).toBe(2);

      // Undo
      act(() => result.current.undo());
      expect(edges.length).toBe(originalEdges.length);
      expect(edges[0].id).toBe(originalEdges[0].id);
    });
  });

  describe('Redo Functionality', () => {
    it('should restore next state on redo', () => {
      const { result, rerender } = renderHook(() =>
        useHistory(nodes, edges, setNodes, setEdges)
      );

      // Add a node
      act(() => {
        nodes = [...nodes, { id: '3', position: { x: 200, y: 200 }, data: { label: 'Node 3' } }];
      });
      rerender();
      act(() => result.current.captureSnapshot());
      rerender();

      const nodesAfterAdd = [...nodes];

      // Undo
      act(() => result.current.undo());
      expect(nodes.length).toBe(2);

      // Redo
      act(() => result.current.redo());
      expect(nodes.length).toBe(3);
      expect(nodes[2].id).toBe(nodesAfterAdd[2].id);
    });

    it('should update canRedo flag correctly', () => {
      const { result, rerender } = renderHook(() =>
        useHistory(nodes, edges, setNodes, setEdges)
      );

      expect(result.current.canRedo).toBe(false);

      // Add a change
      act(() => {
        nodes = [...nodes, { id: '3', position: { x: 200, y: 200 }, data: { label: 'Node 3' } }];
      });
      rerender();
      act(() => result.current.captureSnapshot());
      rerender();

      expect(result.current.canRedo).toBe(false);

      // Undo
      act(() => result.current.undo());
      expect(result.current.canRedo).toBe(true);

      // Redo
      act(() => result.current.redo());
      expect(result.current.canRedo).toBe(false);
    });

    it('should handle multiple undo/redo cycles', () => {
      const { result, rerender } = renderHook(() =>
        useHistory(nodes, edges, setNodes, setEdges)
      );

      // Add 3 changes
      for (let i = 3; i <= 5; i++) {
        act(() => {
          nodes = [...nodes, { id: `${i}`, position: { x: i * 100, y: i * 100 }, data: { label: `Node ${i}` } }];
        });
        rerender();
        act(() => result.current.captureSnapshot());
        rerender();
      }

      expect(nodes.length).toBe(5);

      // Undo 2 times
      act(() => result.current.undo());
      act(() => result.current.undo());
      expect(nodes.length).toBe(3);

      // Redo 1 time
      act(() => result.current.redo());
      expect(nodes.length).toBe(4);

      // Undo 1 time
      act(() => result.current.undo());
      expect(nodes.length).toBe(3);

      // Redo 2 times
      act(() => result.current.redo());
      act(() => result.current.redo());
      expect(nodes.length).toBe(5);
    });
  });

  describe('History Limits', () => {
    it('should respect maximum history size', () => {
      const maxSteps = 3;
      const { result, rerender } = renderHook(() =>
        useHistory(nodes, edges, setNodes, setEdges, maxSteps)
      );

      // Add maxSteps + 2 changes (should only keep maxSteps + 1 total states)
      for (let i = 3; i <= 7; i++) {
        act(() => {
          nodes = [...nodes, { id: `${i}`, position: { x: i * 100, y: i * 100 }, data: { label: `Node ${i}` } }];
        });
        rerender();
        act(() => result.current.captureSnapshot());
        rerender();
      }

      // History should be limited to maxSteps + 1 (initial + maxSteps)
      expect(result.current.historyLength).toBeLessThanOrEqual(maxSteps + 1);
    });

    it('should still allow undo after reaching history limit', () => {
      const maxSteps = 2;
      const { result, rerender } = renderHook(() =>
        useHistory(nodes, edges, setNodes, setEdges, maxSteps)
      );

      // Add 4 changes (exceeds limit)
      for (let i = 3; i <= 6; i++) {
        act(() => {
          nodes = [...nodes, { id: `${i}`, position: { x: i * 100, y: i * 100 }, data: { label: `Node ${i}` } }];
        });
        rerender();
        act(() => result.current.captureSnapshot());
        rerender();
      }

      expect(nodes.length).toBe(6);

      // Should still be able to undo up to maxSteps times
      act(() => result.current.undo());
      expect(nodes.length).toBe(5);

      act(() => result.current.undo());
      expect(nodes.length).toBe(4);

      // Can't undo further (at history limit)
      expect(result.current.canUndo).toBe(false);
    });
  });

  describe('History Branching', () => {
    it('should clear future history when making new change after undo', () => {
      const { result, rerender } = renderHook(() =>
        useHistory(nodes, edges, setNodes, setEdges)
      );

      // Add 2 changes
      act(() => {
        nodes = [...nodes, { id: '3', position: { x: 200, y: 200 }, data: { label: 'Node 3' } }];
      });
      rerender();
      act(() => result.current.captureSnapshot());
      rerender();

      act(() => {
        nodes = [...nodes, { id: '4', position: { x: 300, y: 300 }, data: { label: 'Node 4' } }];
      });
      rerender();
      act(() => result.current.captureSnapshot());
      rerender();

      expect(nodes.length).toBe(4);

      // Undo once
      act(() => result.current.undo());
      expect(nodes.length).toBe(3);
      expect(result.current.canRedo).toBe(true);

      // Make a new change (should clear redo history)
      act(() => {
        nodes = [...nodes, { id: '5', position: { x: 400, y: 400 }, data: { label: 'Node 5' } }];
      });
      rerender();
      act(() => result.current.captureSnapshot());
      rerender();

      expect(nodes.length).toBe(4);
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid successive captures', () => {
      const { result, rerender } = renderHook(() =>
        useHistory(nodes, edges, setNodes, setEdges)
      );

      // Capture multiple times rapidly
      act(() => {
        nodes = [...nodes, { id: '3', position: { x: 200, y: 200 }, data: { label: 'Node 3' } }];
      });
      rerender();

      act(() => {
        result.current.captureSnapshot();
        result.current.captureSnapshot();
        result.current.captureSnapshot();
      });
      rerender();

      // Should only capture once (flag-based system prevents duplicates)
      expect(result.current.historyLength).toBe(2);
    });

    it('should not capture during undo/redo', () => {
      const { result, rerender } = renderHook(() =>
        useHistory(nodes, edges, setNodes, setEdges)
      );

      // Add a change
      act(() => {
        nodes = [...nodes, { id: '3', position: { x: 200, y: 200 }, data: { label: 'Node 3' } }];
      });
      rerender();
      act(() => result.current.captureSnapshot());
      rerender();

      const historyLength = result.current.historyLength;

      // Undo (should not create new history)
      act(() => result.current.undo());
      expect(result.current.historyLength).toBe(historyLength);

      // Redo (should not create new history)
      act(() => result.current.redo());
      expect(result.current.historyLength).toBe(historyLength);
    });

    it('should handle empty nodes and edges', () => {
      const { result } = renderHook(() =>
        useHistory([], [], setNodes, setEdges)
      );

      expect(result.current.historyLength).toBe(1);
      expect(result.current.canUndo).toBe(false);
    });
  });
});

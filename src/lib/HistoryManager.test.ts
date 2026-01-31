import { describe, it, expect, beforeEach } from 'vitest';
import { HistoryManager, GraphState } from './HistoryManager';
import { Node, Edge } from 'reactflow';

describe('HistoryManager', () => {
  let initialState: GraphState;
  let history: HistoryManager;

  beforeEach(() => {
    initialState = {
      nodes: [
        { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
        { id: '2', position: { x: 100, y: 100 }, data: { label: 'Node 2' } },
      ] as Node[],
      edges: [{ id: 'e1-2', source: '1', target: '2' }] as Edge[],
    };
    history = new HistoryManager(initialState, 16);
  });

  describe('Initial State', () => {
    it('should initialize with one state', () => {
      expect(history.length()).toBe(1);
      expect(history.getCurrentIndex()).toBe(0);
    });

    it('should not allow undo initially', () => {
      expect(history.canUndo()).toBe(false);
      expect(history.undo()).toBeNull();
    });

    it('should not allow redo initially', () => {
      expect(history.canRedo()).toBe(false);
      expect(history.redo()).toBeNull();
    });
  });

  describe('Capture', () => {
    it('should capture a new state', () => {
      const newState: GraphState = {
        nodes: [...initialState.nodes, { id: '3', position: { x: 200, y: 200 }, data: { label: 'Node 3' } }] as Node[],
        edges: initialState.edges,
      };

      history.capture(newState);

      expect(history.length()).toBe(2);
      expect(history.canUndo()).toBe(true);
    });

    it('should allow multiple captures', () => {
      for (let i = 0; i < 5; i++) {
        const newState: GraphState = {
          nodes: [...initialState.nodes, { id: `${i}`, position: { x: i * 100, y: i * 100 }, data: { label: `Node ${i}` } }] as Node[],
          edges: initialState.edges,
        };
        history.capture(newState);
      }

      expect(history.length()).toBe(6);
      expect(history.canUndo()).toBe(true);
    });

    it('should clear future history when capturing after undo', () => {
      // Add 2 states
      history.capture({ nodes: [...initialState.nodes], edges: [] });
      history.capture({ nodes: [...initialState.nodes], edges: [] });

      expect(history.length()).toBe(3);

      // Undo once
      history.undo();
      expect(history.canRedo()).toBe(true);

      // Capture new state (should clear redo history)
      history.capture({ nodes: [], edges: [] });

      expect(history.canRedo()).toBe(false);
      expect(history.length()).toBe(3); // Initial + 1 undo'd + 1 new
    });
  });

  describe('Undo', () => {
    it('should restore previous state', () => {
      const state1 = { nodes: [{ id: '1', position: { x: 0, y: 0 }, data: {} }] as Node[], edges: [] as Edge[] };
      const state2 = { nodes: [{ id: '2', position: { x: 100, y: 100 }, data: {} }] as Node[], edges: [] as Edge[] };

      history.capture(state1);
      history.capture(state2);

      const undoneState = history.undo();
      
      expect(undoneState).toBeDefined();
      expect(undoneState?.nodes).toHaveLength(1);
      expect(undoneState?.nodes[0].id).toBe('1');
    });

    it('should allow multiple undos', () => {
      for (let i = 1; i <= 3; i++) {
        history.capture({ nodes: [{ id: `${i}`, position: { x: 0, y: 0 }, data: {} }] as Node[], edges: [] });
      }

      expect(history.length()).toBe(4);

      history.undo();
      expect(history.getCurrentIndex()).toBe(2);

      history.undo();
      expect(history.getCurrentIndex()).toBe(1);

      history.undo();
      expect(history.getCurrentIndex()).toBe(0);
    });

    it('should not undo beyond initial state', () => {
      expect(history.undo()).toBeNull();
      expect(history.getCurrentIndex()).toBe(0);
    });
  });

  describe('Redo', () => {
    it('should restore next state', () => {
      const state1 = { nodes: [{ id: '1', position: { x: 0, y: 0 }, data: {} }] as Node[], edges: [] as Edge[] };
      
      history.capture(state1);
      history.undo();

      const redoneState = history.redo();
      
      expect(redoneState).toBeDefined();
      expect(redoneState?.nodes[0].id).toBe('1');
    });

    it('should allow multiple redos', () => {
      for (let i = 1; i <= 3; i++) {
        history.capture({ nodes: [{ id: `${i}`, position: { x: 0, y: 0 }, data: {} }] as Node[], edges: [] });
      }

      // Undo 3 times
      history.undo();
      history.undo();
      history.undo();

      expect(history.getCurrentIndex()).toBe(0);

      // Redo 2 times
      history.redo();
      history.redo();

      expect(history.getCurrentIndex()).toBe(2);
    });

    it('should not redo beyond last state', () => {
      expect(history.redo()).toBeNull();
      
      history.capture({ nodes: [], edges: [] });
      expect(history.redo()).toBeNull();
    });
  });

  describe('History Limits', () => {
    it('should respect maximum size', () => {
      const maxHistory = new HistoryManager(initialState, 3);

      // Add 5 states (should only keep 4 total: 3 max + 1 current)
      for (let i = 0; i < 5; i++) {
        maxHistory.capture({ nodes: [{ id: `${i}`, position: { x: 0, y: 0 }, data: {} }] as Node[], edges: [] });
      }

      expect(maxHistory.length()).toBeLessThanOrEqual(4);
    });

    it('should still allow undo after reaching limit', () => {
      const maxHistory = new HistoryManager(initialState, 2);

      // Add 4 states
      for (let i = 0; i < 4; i++) {
        maxHistory.capture({ nodes: [{ id: `${i}`, position: { x: 0, y: 0 }, data: {} }] as Node[], edges: [] });
      }

      expect(maxHistory.canUndo()).toBe(true);
      
      const undone = maxHistory.undo();
      expect(undone).toBeDefined();
    });
  });

  describe('State Isolation', () => {
    it('should not mutate original state', () => {
      const mutableState = {
        nodes: [{ id: '1', position: { x: 0, y: 0 }, data: { label: 'Original' } }] as Node[],
        edges: [] as Edge[],
      };

      const manager = new HistoryManager(mutableState);
      
      // Mutate the original
      mutableState.nodes[0].data.label = 'Mutated';

      // Undo should still return the original unmutated state
      const restored = manager.undo();
      expect(restored).toBeNull(); // Can't undo from initial

      // But the initial state should be protected
      manager.capture({ nodes: [], edges: [] });
      const undoneState = manager.undo();
      
      expect(undoneState?.nodes[0].data.label).toBe('Original');
    });
  });

  describe('canUndo and canRedo', () => {
    it('should correctly report undo availability', () => {
      expect(history.canUndo()).toBe(false);
      
      history.capture({ nodes: [], edges: [] });
      expect(history.canUndo()).toBe(true);
      
      history.undo();
      expect(history.canUndo()).toBe(false);
    });

    it('should correctly report redo availability', () => {
      expect(history.canRedo()).toBe(false);
      
      history.capture({ nodes: [], edges: [] });
      expect(history.canRedo()).toBe(false);
      
      history.undo();
      expect(history.canRedo()).toBe(true);
      
      history.redo();
      expect(history.canRedo()).toBe(false);
    });
  });
});

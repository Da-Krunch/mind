import { Node, Edge } from 'reactflow';

/**
 * Pure TypeScript class for managing undo/redo history
 * 
 * No React dependencies - easy to test!
 * 
 * Usage:
 *   const history = new HistoryManager({ nodes, edges }, 16);
 *   history.capture({ nodes: newNodes, edges: newEdges });
 *   const previous = history.undo();
 *   const next = history.redo();
 */

export interface GraphState {
  nodes: Node[];
  edges: Edge[];
}

export class HistoryManager {
  private history: GraphState[];
  private currentIndex: number;
  private maxSteps: number;

  constructor(initialState: GraphState, maxSteps: number = 16) {
    this.history = [this.cloneState(initialState)];
    this.currentIndex = 0;
    this.maxSteps = maxSteps;
  }

  /**
   * Capture a new state snapshot
   * Clears any "future" history if we're not at the end
   */
  capture(state: GraphState): void {
    // Remove future history
    this.history = this.history.slice(0, this.currentIndex + 1);

    // Add new state
    this.history.push(this.cloneState(state));

    // Enforce max size
    if (this.history.length > this.maxSteps + 1) {
      this.history.shift();
    } else {
      this.currentIndex = Math.min(this.currentIndex + 1, this.maxSteps);
    }
  }

  /**
   * Undo to previous state
   * Returns previous state or null if can't undo
   */
  undo(): GraphState | null {
    if (this.currentIndex <= 0) {
      return null;
    }

    this.currentIndex--;
    return this.cloneState(this.history[this.currentIndex]);
  }

  /**
   * Redo to next state
   * Returns next state or null if can't redo
   */
  redo(): GraphState | null {
    if (this.currentIndex >= this.history.length - 1) {
      return null;
    }

    this.currentIndex++;
    return this.cloneState(this.history[this.currentIndex]);
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

  /**
   * Get current index
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Deep clone state to prevent mutations
   */
  private cloneState(state: GraphState): GraphState {
    return {
      nodes: state.nodes.map(n => ({ ...n, data: { ...n.data } })),
      edges: state.edges.map(e => ({ ...e })),
    };
  }
}

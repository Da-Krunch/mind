import { Node, Edge } from 'reactflow';
import { NodeData } from '../types';

/**
 * Pure functions for graph operations
 * 
 * No React dependencies - just pure TypeScript functions
 * Easy to test, easy to understand
 */

export class GraphOperations {
  /**
   * Generate a unique node ID
   */
  static generateNodeId(): string {
    // Use crypto.randomUUID if available, fallback to timestamp + random
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `node-${crypto.randomUUID()}`;
    }
    return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a new node with default values
   */
  static createNode(): Node<NodeData> {
    return {
      id: this.generateNodeId(),
      type: 'colored',
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100,
      },
      data: {
        title: 'New Node',
        color: '#8b5cf6',
        description: '',
        label: 'New Node',
      } as NodeData & { label: string },
    };
  }

  /**
   * Duplicate an existing node with offset position
   */
  static duplicateNode(node: Node<NodeData>): Node<NodeData> {
    return {
      ...node,
      id: this.generateNodeId(),
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50,
      },
      data: {
        ...node.data,
        title: `${node.data.title} (Copy)`,
        label: `${node.data.title} (Copy)`,
      } as NodeData & { label: string },
    };
  }

  /**
   * Add a node to the nodes array
   */
  static addNode(nodes: Node[], newNode: Node): Node[] {
    return [...nodes, newNode];
  }

  /**
   * Remove a node by ID
   */
  static removeNode(nodes: Node[], nodeId: string): Node[] {
    return nodes.filter(n => n.id !== nodeId);
  }

  /**
   * Remove all edges connected to a node
   */
  static removeNodeEdges(edges: Edge[], nodeId: string): Edge[] {
    return edges.filter(e => e.source !== nodeId && e.target !== nodeId);
  }

  /**
   * Update node data
   */
  static updateNodeData(nodes: Node[], nodeId: string, data: NodeData): Node[] {
    return nodes.map(node =>
      node.id === nodeId
        ? {
            ...node,
            data: {
              ...data,
              label: data.title + (data.description.length > 0 ? '(...)' : ''),
            } as NodeData & { label: string },
          }
        : node
    );
  }

  /**
   * Find a node by ID
   */
  static findNode(nodes: Node[], nodeId: string): Node | undefined {
    return nodes.find(n => n.id === nodeId);
  }

  /**
   * Check if all edges reference existing nodes
   */
  static validateEdges(nodes: Node[], edges: Edge[]): boolean {
    const nodeIds = new Set(nodes.map(n => n.id));
    return edges.every(e => nodeIds.has(e.source) && nodeIds.has(e.target));
  }

  /**
   * Get all unique node IDs
   */
  static getNodeIds(nodes: Node[]): string[] {
    return nodes.map(n => n.id);
  }
}

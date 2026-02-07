import { Node, Edge } from 'reactflow';
import { NodeData } from '../types';
import {
  DEFAULT_NODE_TITLE,
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_DESCRIPTION,
  RANDOM_POSITION_RANGE,
  RANDOM_POSITION_OFFSET,
  DUPLICATE_NODE_OFFSET,
} from '../constants';

/**
 * Pure functions for graph operations
 * 
 * No React dependencies - just pure TypeScript functions
 * Easy to test, easy to understand
 */

/**
 * Generate a unique node ID
 */
export function generateNodeId(): string {
  // Use crypto.randomUUID if available, fallback to timestamp + random
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `node-${crypto.randomUUID()}`;
  }
  return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new node with default values
 * @param position Optional position for the node (defaults to random if not provided)
 */
export function createNode(position?: { x: number; y: number }): Node<NodeData> {
  return {
    id: generateNodeId(),
    type: 'colored',
    position: position ?? {
      x: Math.random() * RANDOM_POSITION_RANGE + RANDOM_POSITION_OFFSET,
      y: Math.random() * RANDOM_POSITION_RANGE + RANDOM_POSITION_OFFSET,
    },
    data: {
      title: DEFAULT_NODE_TITLE,
      color: DEFAULT_NODE_COLOR,
      description: DEFAULT_NODE_DESCRIPTION,
    },
  };
}

/**
 * Duplicate an existing node with offset position
 */
export function duplicateNode(node: Node<NodeData>): Node<NodeData> {
  return {
    ...node,
    id: generateNodeId(),
    position: {
      x: node.position.x + DUPLICATE_NODE_OFFSET,
      y: node.position.y + DUPLICATE_NODE_OFFSET,
    },
    data: {
      title: `${node.data.title} (Copy)`,
      color: node.data.color,
      description: node.data.description,
    },
  };
}

/**
 * Add a node to the nodes array
 */
export function addNode(nodes: Node[], newNode: Node): Node[] {
  return [...nodes, newNode];
}

/**
 * Remove a node by ID
 */
export function removeNode(nodes: Node[], nodeId: string): Node[] {
  return nodes.filter(n => n.id !== nodeId);
}

/**
 * Remove all edges connected to a node
 */
export function removeNodeEdges(edges: Edge[], nodeId: string): Edge[] {
  return edges.filter(e => e.source !== nodeId && e.target !== nodeId);
}

/**
 * Update node data
 */
export function updateNodeData(nodes: Node[], nodeId: string, data: NodeData): Node[] {
  return nodes.map(node =>
    node.id === nodeId
      ? {
          ...node,
          data,
        }
      : node
  );
}

/**
 * Find a node by ID
 */
export function findNode(nodes: Node[], nodeId: string): Node | undefined {
  return nodes.find(n => n.id === nodeId);
}

/**
 * Check if all edges reference existing nodes
 */
export function validateEdges(nodes: Node[], edges: Edge[]): boolean {
  const nodeIds = new Set(nodes.map(n => n.id));
  return edges.every(e => nodeIds.has(e.source) && nodeIds.has(e.target));
}

/**
 * Get all unique node IDs
 */
export function getNodeIds(nodes: Node[]): string[] {
  return nodes.map(n => n.id);
}

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
 * Extended NodeData with hierarchical and connection information
 * 
 * Hierarchical Groups
 * - parentId: which group/container this node belongs to (null = root level)
 * - upstreamIds: nodes that connect TO this node (incoming edges)
 */
export interface HierarchicalNodeData extends NodeData {
  parentId: string | null;     // Parent group ID, null for root-level nodes
  upstreamIds: string[];        // IDs of nodes that connect to this node
}

/**
 * A node in the hierarchical document model
 * Pure data structure - no view dependencies
 */
export interface HierarchicalNode {
  id: string;
  position: { x: number; y: number };
  data: HierarchicalNodeData;
}

/**
 * DocumentModel: The core data structure for hierarchical node graphs
 * 
 * Design principles:
 * - Single source of truth: nodes stored in flat array
 * - Parent relationship: only stored on child (parentId)
 * - Edges: stored as upstreamIds on downstream node
 * - Children: computed on-demand (not stored)
 * 
 * This is a pure data structure with no React dependencies.
 */
export class DocumentModel {
  private nodes: HierarchicalNode[];

  constructor(nodes: HierarchicalNode[] = []) {
    this.nodes = nodes;
  }

  /**
   * Get all nodes (flat array)
   */
  getAllNodes(): HierarchicalNode[] {
    return [...this.nodes];
  }

  /**
   * Get nodes that belong to a specific parent
   * @param parentId The parent's ID, or null for root-level nodes
   */
  getNodesByParent(parentId: string | null): HierarchicalNode[] {
    return this.nodes.filter(node => node.data.parentId === parentId);
  }

  /**
   * Find a node by ID
   */
  findNode(nodeId: string): HierarchicalNode | undefined {
    return this.nodes.find(n => n.id === nodeId);
  }

  /**
   * Generate a unique node ID
   */
  static generateNodeId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `node-${crypto.randomUUID()}`;
    }
    return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a new node with default values
   * @param parentId The parent group ID (null for root level)
   * @param position Optional position (defaults to random if not provided)
   */
  createNode(
    parentId: string | null = null,
    position?: { x: number; y: number }
  ): HierarchicalNode {
    return {
      id: DocumentModel.generateNodeId(),
      position: position ?? {
        x: Math.random() * RANDOM_POSITION_RANGE + RANDOM_POSITION_OFFSET,
        y: Math.random() * RANDOM_POSITION_RANGE + RANDOM_POSITION_OFFSET,
      },
      data: {
        title: DEFAULT_NODE_TITLE,
        color: DEFAULT_NODE_COLOR,
        description: DEFAULT_NODE_DESCRIPTION,
        parentId,
        upstreamIds: [],
      },
    };
  }

  /**
   * Add a node to the document
   * Returns a new DocumentModel (immutable operation)
   */
  addNode(node: HierarchicalNode): DocumentModel {
    return new DocumentModel([...this.nodes, node]);
  }

  /**
   * Remove a node from the document
   * Also cleans up references: removes this node's ID from all upstreamIds
   * Returns a new DocumentModel (immutable operation)
   */
  removeNode(nodeId: string): DocumentModel {
    const filteredNodes = this.nodes
      .filter(n => n.id !== nodeId)
      .map(node => ({
        ...node,
        data: {
          ...node.data,
          upstreamIds: node.data.upstreamIds.filter(id => id !== nodeId),
        },
      }));
    return new DocumentModel(filteredNodes);
  }

  /**
   * Update a node's data (title, color, description)
   * Does NOT update parentId or upstreamIds (use specific methods for those)
   * Returns a new DocumentModel (immutable operation)
   */
  updateNodeData(
    nodeId: string,
    updates: Partial<Pick<HierarchicalNodeData, 'title' | 'color' | 'description'>>
  ): DocumentModel {
    const updatedNodes = this.nodes.map(node =>
      node.id === nodeId
        ? {
            ...node,
            data: {
              ...node.data,
              ...updates,
            },
          }
        : node
    );
    return new DocumentModel(updatedNodes);
  }

  /**
   * Update a node's position
   * Returns a new DocumentModel (immutable operation)
   */
  updateNodePosition(
    nodeId: string,
    position: { x: number; y: number }
  ): DocumentModel {
    const updatedNodes = this.nodes.map(node =>
      node.id === nodeId
        ? { ...node, position }
        : node
    );
    return new DocumentModel(updatedNodes);
  }

  /**
   * Move a node to a different parent group
   * Returns a new DocumentModel (immutable operation)
   */
  moveNodeToParent(nodeId: string, newParentId: string | null): DocumentModel {
    const updatedNodes = this.nodes.map(node =>
      node.id === nodeId
        ? {
            ...node,
            data: {
              ...node.data,
              parentId: newParentId,
            },
          }
        : node
    );
    return new DocumentModel(updatedNodes);
  }

  /**
   * Add an edge (connection) from source to target
   * Adds sourceId to target's upstreamIds (if not already present)
   * Returns a new DocumentModel (immutable operation)
   */
  addEdge(sourceId: string, targetId: string): DocumentModel {
    const updatedNodes = this.nodes.map(node => {
      if (node.id === targetId) {
        // Add sourceId to upstreamIds if not already present
        const upstreamIds = node.data.upstreamIds.includes(sourceId)
          ? node.data.upstreamIds
          : [...node.data.upstreamIds, sourceId];
        return {
          ...node,
          data: {
            ...node.data,
            upstreamIds,
          },
        };
      }
      return node;
    });
    return new DocumentModel(updatedNodes);
  }

  /**
   * Remove an edge (connection) from source to target
   * Removes sourceId from target's upstreamIds
   * Returns a new DocumentModel (immutable operation)
   */
  removeEdge(sourceId: string, targetId: string): DocumentModel {
    const updatedNodes = this.nodes.map(node => {
      if (node.id === targetId) {
        return {
          ...node,
          data: {
            ...node.data,
            upstreamIds: node.data.upstreamIds.filter(id => id !== sourceId),
          },
        };
      }
      return node;
    });
    return new DocumentModel(updatedNodes);
  }

  /**
   * Duplicate a node
   * The duplicate has the same parent and data, but new ID, offset position, and no upstreams
   * Returns both the new DocumentModel and the new node
   */
  duplicateNode(nodeId: string): { model: DocumentModel; node: HierarchicalNode } | null {
    const original = this.findNode(nodeId);
    if (!original) return null;

    const duplicated: HierarchicalNode = {
      ...original,
      id: DocumentModel.generateNodeId(),
      position: {
        x: original.position.x + DUPLICATE_NODE_OFFSET,
        y: original.position.y + DUPLICATE_NODE_OFFSET,
      },
      data: {
        ...original.data,
        title: `${original.data.title} (Copy)`,
        upstreamIds: [], // Don't copy connections
      },
    };

    return {
      model: this.addNode(duplicated),
      node: duplicated,
    };
  }

  /**
   * Validate the document structure
   * Checks:
   * - All parentIds reference existing nodes (or are null)
   * - All upstreamIds reference existing nodes
   * - No cycles in parent hierarchy
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const nodeIds = new Set(this.nodes.map(n => n.id));

    // Check parentId references
    for (const node of this.nodes) {
      if (node.data.parentId !== null && !nodeIds.has(node.data.parentId)) {
        errors.push(`Node ${node.id} has invalid parentId: ${node.data.parentId}`);
      }
    }

    // Check upstreamIds references
    for (const node of this.nodes) {
      for (const upstreamId of node.data.upstreamIds) {
        if (!nodeIds.has(upstreamId)) {
          errors.push(`Node ${node.id} has invalid upstreamId: ${upstreamId}`);
        }
      }
    }

    // Check for cycles in parent hierarchy
    for (const node of this.nodes) {
      if (this.hasCycle(node.id)) {
        errors.push(`Node ${node.id} is part of a parent cycle`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if a node is part of a parent cycle
   * Uses Floyd's cycle detection algorithm
   */
  private hasCycle(nodeId: string): boolean {
    const visited = new Set<string>();
    let current = nodeId;

    while (current) {
      if (visited.has(current)) {
        return true; // Cycle detected
      }
      visited.add(current);

      const node = this.findNode(current);
      if (!node || node.data.parentId === null) {
        return false; // Reached root or invalid node
      }
      current = node.data.parentId;
    }

    return false;
  }

  /**
   * Get the parent chain from a node to the root
   * Returns array of node IDs from node to root (excluding the node itself)
   * Useful for breadcrumb navigation
   */
  getParentChain(nodeId: string): string[] {
    const chain: string[] = [];
    let current = this.findNode(nodeId);

    while (current && current.data.parentId !== null) {
      chain.push(current.data.parentId);
      current = this.findNode(current.data.parentId);
    }

    return chain;
  }

  /**
   * Convert nodes to ReactFlow edges for rendering
   * Generates edges from upstreamIds
   */
  toReactFlowEdges(): Array<{ id: string; source: string; target: string }> {
    const edges: Array<{ id: string; source: string; target: string }> = [];
    
    for (const node of this.nodes) {
      for (const upstreamId of node.data.upstreamIds) {
        edges.push({
          id: `${upstreamId}-${node.id}`,
          source: upstreamId,
          target: node.id,
        });
      }
    }

    return edges;
  }

  /**
   * Get count of nodes in document
   */
  getNodeCount(): number {
    return this.nodes.length;
  }

  /**
   * Create an empty document
   */
  static empty(): DocumentModel {
    return new DocumentModel([]);
  }

  /**
   * Serialize the document to JSON-compatible format
   * This is the canonical data format, independent of any view library
   */
  toJSON(): HierarchicalNode[] {
    // Return a deep copy to prevent external mutation
    return this.nodes.map(node => ({
      id: node.id,
      position: { ...node.position },
      data: {
        title: node.data.title,
        color: node.data.color,
        description: node.data.description,
        parentId: node.data.parentId,
        upstreamIds: [...node.data.upstreamIds],
      },
    }));
  }

  /**
   * Deserialize from JSON-compatible format
   * Creates a new DocumentModel from saved data
   */
  static fromJSON(nodes: HierarchicalNode[]): DocumentModel {
    // Validate the structure
    if (!Array.isArray(nodes)) {
      throw new Error('Invalid document format: nodes must be an array');
    }

    // Create a deep copy to prevent external mutation
    const nodeCopies: HierarchicalNode[] = nodes.map(node => {
      if (!node.id || !node.position || !node.data) {
        throw new Error(`Invalid node structure: ${JSON.stringify(node)}`);
      }

      return {
        id: node.id,
        position: { x: node.position.x, y: node.position.y },
        data: {
          title: node.data.title ?? '',
          color: node.data.color ?? '#8b5cf6',
          description: node.data.description ?? '',
          parentId: node.data.parentId ?? null,
          upstreamIds: Array.isArray(node.data.upstreamIds) ? [...node.data.upstreamIds] : [],
        },
      };
    });

    return new DocumentModel(nodeCopies);
  }
}

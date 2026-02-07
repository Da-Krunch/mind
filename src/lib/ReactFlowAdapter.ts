import { Node as ReactFlowNode, Edge as ReactFlowEdge } from 'reactflow';
import { DocumentModel, HierarchicalNode } from './DocumentModel';
import { NodeData } from '../types';

/**
 * ReactFlowAdapter - Converts between DocumentModel and ReactFlow types
 * 
 * This adapter sits between the pure data model and the view layer,
 * allowing us to keep them independent of each other.
 */

/**
 * Convert a HierarchicalNode to a ReactFlow Node
 * Adds view-specific properties like 'type' and 'selected'
 */
export function toReactFlowNode(
  node: HierarchicalNode,
  selected: boolean = false
): ReactFlowNode<NodeData> {
  return {
    id: node.id,
    type: 'colored',
    position: node.position,
    data: {
      title: node.data.title,
      color: node.data.color,
      description: node.data.description,
    },
    selected,
  };
}

/**
 * Convert a ReactFlow Node back to a HierarchicalNode
 * Requires parentId and upstreamIds to be provided
 */
export function fromReactFlowNode(
  reactFlowNode: ReactFlowNode<NodeData>,
  parentId: string | null,
  upstreamIds: string[]
): HierarchicalNode {
  return {
    id: reactFlowNode.id,
    position: reactFlowNode.position,
    data: {
      title: reactFlowNode.data.title,
      color: reactFlowNode.data.color,
      description: reactFlowNode.data.description,
      parentId,
      upstreamIds,
    },
  };
}

/**
 * Get visible nodes for a given group (parent)
 * Converts them to ReactFlow format with selection state
 */
export function getVisibleNodes(
  document: DocumentModel,
  currentGroupId: string | null,
  selectedNodeIds: string[]
): ReactFlowNode<NodeData>[] {
  const visibleNodes = document.getNodesByParent(currentGroupId);
  return visibleNodes.map(node => 
    toReactFlowNode(node, selectedNodeIds.includes(node.id))
  );
}

/**
 * Generate ReactFlow edges for visible nodes
 * Only includes edges where both source and target are visible
 */
export function getVisibleEdges(
  document: DocumentModel,
  currentGroupId: string | null
): ReactFlowEdge[] {
  const visibleNodes = document.getNodesByParent(currentGroupId);
  const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
  const edges: ReactFlowEdge[] = [];

  for (const node of visibleNodes) {
    for (const upstreamId of node.data.upstreamIds) {
      // Only show edge if source is also visible
      if (visibleNodeIds.has(upstreamId)) {
        edges.push({
          id: `${upstreamId}-${node.id}`,
          source: upstreamId,
          target: node.id,
        });
      }
    }
  }

  return edges;
}

/**
 * Update a node's position in the document
 * Helper to sync ReactFlow position changes back to the model
 */
export function updateNodePosition(
  document: DocumentModel,
  nodeId: string,
  position: { x: number; y: number }
): DocumentModel {
  return document.updateNodePosition(nodeId, position);
}

/**
 * Update multiple node positions (for batch updates)
 */
export function updateNodePositions(
  document: DocumentModel,
  updates: Array<{ id: string; position: { x: number; y: number } }>
): DocumentModel {
  let updatedDoc = document;
  for (const { id, position } of updates) {
    updatedDoc = updatedDoc.updateNodePosition(id, position);
  }
  return updatedDoc;
}

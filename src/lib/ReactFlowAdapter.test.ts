import { describe, it, expect } from 'vitest';
import { DocumentModel } from './DocumentModel';
import * as Adapter from './ReactFlowAdapter';

describe('ReactFlowAdapter', () => {
  describe('toReactFlowNode', () => {
    it('should convert HierarchicalNode to ReactFlow Node', () => {
      const doc = DocumentModel.empty();
      const hierarchicalNode = doc.createNode(null, { x: 100, y: 200 });

      const reactFlowNode = Adapter.toReactFlowNode(hierarchicalNode);

      expect(reactFlowNode.id).toBe(hierarchicalNode.id);
      expect(reactFlowNode.type).toBe('colored');
      expect(reactFlowNode.position).toEqual({ x: 100, y: 200 });
      expect(reactFlowNode.data.title).toBe('New Node');
      expect(reactFlowNode.selected).toBe(false);
    });

    it('should set selected flag', () => {
      const doc = DocumentModel.empty();
      const node = doc.createNode(null);

      const reactFlowNode = Adapter.toReactFlowNode(node, true);

      expect(reactFlowNode.selected).toBe(true);
    });
  });

  describe('getVisibleNodes', () => {
    it('should return root-level nodes when currentGroupId is null', () => {
      const doc = DocumentModel.empty();
      const root1 = doc.createNode(null);
      const root2 = doc.createNode(null);
      const child = doc.createNode(root1.id);

      const newDoc = doc.addNode(root1).addNode(root2).addNode(child);

      const visible = Adapter.getVisibleNodes(newDoc, null, []);

      expect(visible).toHaveLength(2);
      expect(visible.map(n => n.id)).toContain(root1.id);
      expect(visible.map(n => n.id)).toContain(root2.id);
      expect(visible.map(n => n.id)).not.toContain(child.id);
    });

    it('should return children when currentGroupId is set', () => {
      const doc = DocumentModel.empty();
      const parent = doc.createNode(null);
      const child1 = doc.createNode(parent.id);
      const child2 = doc.createNode(parent.id);

      const newDoc = doc.addNode(parent).addNode(child1).addNode(child2);

      const visible = Adapter.getVisibleNodes(newDoc, parent.id, []);

      expect(visible).toHaveLength(2);
      expect(visible.map(n => n.id)).toContain(child1.id);
      expect(visible.map(n => n.id)).toContain(child2.id);
    });

    it('should mark selected nodes', () => {
      const doc = DocumentModel.empty();
      const node1 = doc.createNode(null);
      const node2 = doc.createNode(null);

      const newDoc = doc.addNode(node1).addNode(node2);

      const visible = Adapter.getVisibleNodes(newDoc, null, [node1.id]);

      const visibleNode1 = visible.find(n => n.id === node1.id);
      const visibleNode2 = visible.find(n => n.id === node2.id);

      expect(visibleNode1?.selected).toBe(true);
      expect(visibleNode2?.selected).toBe(false);
    });
  });

  describe('getVisibleEdges', () => {
    it('should generate edges from upstreamIds', () => {
      const doc = DocumentModel.empty();
      const node1 = doc.createNode(null);
      const node2 = doc.createNode(null);
      const node3 = doc.createNode(null);

      let newDoc = doc.addNode(node1).addNode(node2).addNode(node3);
      newDoc = newDoc.addEdge(node1.id, node3.id);
      newDoc = newDoc.addEdge(node2.id, node3.id);

      const edges = Adapter.getVisibleEdges(newDoc, null);

      expect(edges).toHaveLength(2);
      expect(edges).toContainEqual({
        id: `${node1.id}-${node3.id}`,
        source: node1.id,
        target: node3.id,
      });
      expect(edges).toContainEqual({
        id: `${node2.id}-${node3.id}`,
        source: node2.id,
        target: node3.id,
      });
    });

    it('should only show edges where both nodes are visible', () => {
      const doc = DocumentModel.empty();
      const parent = doc.createNode(null);
      const child1 = doc.createNode(parent.id);
      const child2 = doc.createNode(parent.id);

      let newDoc = doc.addNode(parent).addNode(child1).addNode(child2);
      newDoc = newDoc.addEdge(parent.id, child1.id);  // Cross-level edge
      newDoc = newDoc.addEdge(child1.id, child2.id);  // Same-level edge

      // When viewing parent's children
      const edges = Adapter.getVisibleEdges(newDoc, parent.id);

      // Only the child1->child2 edge should be visible
      expect(edges).toHaveLength(1);
      expect(edges[0].source).toBe(child1.id);
      expect(edges[0].target).toBe(child2.id);
    });

    it('should return empty array for group with no connections', () => {
      const doc = DocumentModel.empty();
      const node1 = doc.createNode(null);
      const node2 = doc.createNode(null);

      const newDoc = doc.addNode(node1).addNode(node2);

      const edges = Adapter.getVisibleEdges(newDoc, null);

      expect(edges).toEqual([]);
    });
  });

  describe('updateNodePosition', () => {
    it('should update node position in document', () => {
      const doc = DocumentModel.empty();
      const node = doc.createNode(null, { x: 100, y: 200 });
      const doc1 = doc.addNode(node);

      const doc2 = Adapter.updateNodePosition(doc1, node.id, { x: 300, y: 400 });

      const updated = doc2.findNode(node.id);
      expect(updated?.position).toEqual({ x: 300, y: 400 });
    });
  });

  describe('updateNodePositions', () => {
    it('should update multiple node positions', () => {
      const doc = DocumentModel.empty();
      const node1 = doc.createNode(null, { x: 0, y: 0 });
      const node2 = doc.createNode(null, { x: 0, y: 0 });

      let newDoc = doc.addNode(node1).addNode(node2);

      newDoc = Adapter.updateNodePositions(newDoc, [
        { id: node1.id, position: { x: 100, y: 200 } },
        { id: node2.id, position: { x: 300, y: 400 } },
      ]);

      const updated1 = newDoc.findNode(node1.id);
      const updated2 = newDoc.findNode(node2.id);

      expect(updated1?.position).toEqual({ x: 100, y: 200 });
      expect(updated2?.position).toEqual({ x: 300, y: 400 });
    });
  });
});

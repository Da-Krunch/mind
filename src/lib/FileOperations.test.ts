import { describe, it, expect } from 'vitest';
import { FileOperations } from './FileOperations';
import { DocumentModel, HierarchicalNode } from './DocumentModel';

describe('FileOperations', () => {
  describe('serialize', () => {
    it('should serialize a document to JSON', () => {
      const doc = DocumentModel.empty();
      const node1 = doc.createNode(null, { x: 100, y: 200 });
      const node2 = doc.createNode(null, { x: 300, y: 400 });
      
      let newDoc = doc.addNode(node1).addNode(node2);
      newDoc = newDoc.addEdge(node1.id, node2.id);
      newDoc = newDoc.updateNodeData(node1.id, { title: 'Test', color: '#3b82f6', description: 'Test node' });

      const json = FileOperations.serialize(newDoc);

      expect(json).toContain('"version": 1');
      expect(json).toContain('"title": "Test"');
      expect(json).toContain('"color": "#3b82f6"');
      expect(json).toContain('"description": "Test node"');
      expect(json).toContain('"parentId": null');
      expect(json).toContain('"upstreamIds"');
    });

    it('should handle empty document', () => {
      const doc = DocumentModel.empty();
      const json = FileOperations.serialize(doc);

      expect(json).toContain('"version": 1');
      expect(json).toContain('"nodes": []');
    });

    it('should serialize hierarchical structure', () => {
      const doc = DocumentModel.empty();
      const parent = doc.createNode(null);
      const child = doc.createNode(parent.id);

      const newDoc = doc.addNode(parent).addNode(child);
      const json = FileOperations.serialize(newDoc);

      expect(json).toContain('"parentId": null');
      expect(json).toContain(`"parentId": "${parent.id}"`);
    });

    it('should serialize connections as upstreamIds', () => {
      const doc = DocumentModel.empty();
      const node1 = doc.createNode(null);
      const node2 = doc.createNode(null);
      const node3 = doc.createNode(null);

      let newDoc = doc.addNode(node1).addNode(node2).addNode(node3);
      newDoc = newDoc.addEdge(node1.id, node3.id);
      newDoc = newDoc.addEdge(node2.id, node3.id);

      const json = FileOperations.serialize(newDoc);
      const parsed = JSON.parse(json);

      // node3 should have both node1 and node2 in its upstreamIds
      const node3Data = parsed.nodes.find((n: any) => n.id === node3.id);
      expect(node3Data.data.upstreamIds).toContain(node1.id);
      expect(node3Data.data.upstreamIds).toContain(node2.id);
    });
  });

  describe('deserialize', () => {
    it('should deserialize JSON to DocumentModel', () => {
      const json = `{
  "version": 1,
  "nodes": [
    {
      "id": "node-1",
      "position": { "x": 100, "y": 200 },
      "data": {
        "title": "Test Node",
        "color": "#3b82f6",
        "description": "Test description",
        "parentId": null,
        "upstreamIds": []
      }
    },
    {
      "id": "node-2",
      "position": { "x": 300, "y": 400 },
      "data": {
        "title": "Child Node",
        "color": "#10b981",
        "description": "",
        "parentId": "node-1",
        "upstreamIds": ["node-1"]
      }
    }
  ]
}`;

      const doc = FileOperations.deserialize(json);

      expect(doc.getNodeCount()).toBe(2);
      
      const node1 = doc.findNode('node-1');
      expect(node1).toBeDefined();
      expect(node1?.position.x).toBe(100);
      expect(node1?.data.title).toBe('Test Node');
      expect(node1?.data.parentId).toBe(null);
      expect(node1?.data.upstreamIds).toEqual([]);

      const node2 = doc.findNode('node-2');
      expect(node2).toBeDefined();
      expect(node2?.data.parentId).toBe('node-1');
      expect(node2?.data.upstreamIds).toEqual(['node-1']);
    });

    it('should throw error if version is missing', () => {
      const json = '{"nodes": []}';

      expect(() => FileOperations.deserialize(json)).toThrow('version missing');
    });

    it('should throw error if version is too new', () => {
      const json = '{"version": 999, "nodes": []}';

      expect(() => FileOperations.deserialize(json)).toThrow('version 999 is newer');
    });
  });

  describe('round-trip', () => {
    it('should preserve data through serialize -> deserialize', () => {
      const doc = DocumentModel.empty();
      const node1: HierarchicalNode = {
        id: 'node-1',
        position: { x: 123, y: 456 },
        data: {
          title: 'Round Trip',
          color: '#10b981',
          description: 'Test',
          parentId: null,
          upstreamIds: [],
        },
      };
      const node2: HierarchicalNode = {
        id: 'node-2',
        position: { x: 789, y: 101 },
        data: {
          title: 'Second',
          color: '#f59e0b',
          description: 'Another',
          parentId: 'node-1',
          upstreamIds: ['node-1'],
        },
      };

      const originalDoc = doc.addNode(node1).addNode(node2);
      const json = FileOperations.serialize(originalDoc);
      const loadedDoc = FileOperations.deserialize(json);

      expect(loadedDoc.getNodeCount()).toBe(2);
      
      const loaded1 = loadedDoc.findNode('node-1');
      expect(loaded1?.position.x).toBe(123);
      expect(loaded1?.data.title).toBe('Round Trip');
      expect(loaded1?.data.color).toBe('#10b981');
      expect(loaded1?.data.parentId).toBe(null);
      expect(loaded1?.data.upstreamIds).toEqual([]);

      const loaded2 = loadedDoc.findNode('node-2');
      expect(loaded2?.position.x).toBe(789);
      expect(loaded2?.data.title).toBe('Second');
      expect(loaded2?.data.parentId).toBe('node-1');
      expect(loaded2?.data.upstreamIds).toEqual(['node-1']);
    });

    it('should preserve complex hierarchical structure', () => {
      const doc = DocumentModel.empty();
      
      // Create a tree: root -> (child1, child2), child1 -> grandchild
      const root = doc.createNode(null);
      const child1 = doc.createNode(root.id);
      const child2 = doc.createNode(root.id);
      const grandchild = doc.createNode(child1.id);

      let newDoc = doc.addNode(root).addNode(child1).addNode(child2).addNode(grandchild);
      
      // Add some connections
      newDoc = newDoc.addEdge(root.id, child1.id);
      newDoc = newDoc.addEdge(child1.id, grandchild.id);

      const json = FileOperations.serialize(newDoc);
      const loadedDoc = FileOperations.deserialize(json);

      // Verify structure
      expect(loadedDoc.getNodeCount()).toBe(4);
      expect(loadedDoc.getNodesByParent(root.id)).toHaveLength(2);
      expect(loadedDoc.getNodesByParent(child1.id)).toHaveLength(1);
      
      // Verify connections
      const loadedChild1 = loadedDoc.findNode(child1.id);
      expect(loadedChild1?.data.upstreamIds).toContain(root.id);
      
      const loadedGrandchild = loadedDoc.findNode(grandchild.id);
      expect(loadedGrandchild?.data.upstreamIds).toContain(child1.id);
    });
  });
});

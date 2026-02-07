import { describe, it, expect } from 'vitest';
import { DocumentModel, HierarchicalNode } from './DocumentModel';

describe('DocumentModel', () => {
  describe('Node Creation', () => {
    it('should create an empty document', () => {
      const doc = DocumentModel.empty();
      expect(doc.getNodeCount()).toBe(0);
      expect(doc.getAllNodes()).toEqual([]);
    });

    it('should create a node with default values', () => {
      const doc = new DocumentModel();
      const node = doc.createNode(null);

      expect(node.id).toMatch(/^node-/);
      expect(node.data.title).toBe('New Node');
      expect(node.data.color).toBe('#8b5cf6');
      expect(node.data.description).toBe('');
      expect(node.data.parentId).toBe(null);
      expect(node.data.upstreamIds).toEqual([]);
      expect(node.position).toBeDefined();
    });

    it('should create a node with specified parent', () => {
      const doc = new DocumentModel();
      const node = doc.createNode('parent-123');

      expect(node.data.parentId).toBe('parent-123');
    });

    it('should create a node with specified position', () => {
      const doc = new DocumentModel();
      const node = doc.createNode(null, { x: 100, y: 200 });

      expect(node.position).toEqual({ x: 100, y: 200 });
    });

    it('should generate unique node IDs', () => {
      const id1 = DocumentModel.generateNodeId();
      const id2 = DocumentModel.generateNodeId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('Adding and Removing Nodes', () => {
    it('should add a node to the document', () => {
      const doc = DocumentModel.empty();
      const node = doc.createNode(null);
      const newDoc = doc.addNode(node);

      expect(newDoc.getNodeCount()).toBe(1);
      expect(newDoc.findNode(node.id)).toEqual(node);
    });

    it('should be immutable when adding nodes', () => {
      const doc = DocumentModel.empty();
      const node = doc.createNode(null);
      const newDoc = doc.addNode(node);

      expect(doc.getNodeCount()).toBe(0);
      expect(newDoc.getNodeCount()).toBe(1);
    });

    it('should remove a node from the document', () => {
      const doc = DocumentModel.empty();
      const node = doc.createNode(null);
      const doc1 = doc.addNode(node);
      const doc2 = doc1.removeNode(node.id);

      expect(doc2.getNodeCount()).toBe(0);
      expect(doc2.findNode(node.id)).toBeUndefined();
    });

    it('should remove node ID from all upstreamIds when removing a node', () => {
      const doc = DocumentModel.empty();
      const node1 = doc.createNode(null);
      const node2 = doc.createNode(null);
      
      let newDoc = doc.addNode(node1).addNode(node2);
      // Add edge from node1 to node2
      newDoc = newDoc.addEdge(node1.id, node2.id);
      
      // Verify edge was added
      const node2WithEdge = newDoc.findNode(node2.id);
      expect(node2WithEdge?.data.upstreamIds).toContain(node1.id);
      
      // Remove node1
      newDoc = newDoc.removeNode(node1.id);
      
      // Verify node2's upstreamIds no longer contains node1.id
      const node2After = newDoc.findNode(node2.id);
      expect(node2After?.data.upstreamIds).not.toContain(node1.id);
      expect(node2After?.data.upstreamIds).toEqual([]);
    });

    it('should check if a node exists', () => {
      const doc = DocumentModel.empty();
      const node = doc.createNode(null);
      const newDoc = doc.addNode(node);

      expect(newDoc.findNode(node.id)).toBeDefined();
      expect(newDoc.findNode('non-existent')).toBeUndefined();
    });
  });

  describe('Updating Nodes', () => {
    it('should update node data', () => {
      const doc = DocumentModel.empty();
      const node = doc.createNode(null);
      let newDoc = doc.addNode(node);

      newDoc = newDoc.updateNodeData(node.id, {
        title: 'Updated Title',
        color: '#ff0000',
        description: 'New description',
      });

      const updated = newDoc.findNode(node.id);
      expect(updated?.data.title).toBe('Updated Title');
      expect(updated?.data.color).toBe('#ff0000');
      expect(updated?.data.description).toBe('New description');
    });

    it('should update node data partially', () => {
      const doc = DocumentModel.empty();
      const node = doc.createNode(null);
      let newDoc = doc.addNode(node);

      newDoc = newDoc.updateNodeData(node.id, { title: 'Only Title' });

      const updated = newDoc.findNode(node.id);
      expect(updated?.data.title).toBe('Only Title');
      expect(updated?.data.color).toBe(node.data.color); // unchanged
      expect(updated?.data.description).toBe(node.data.description); // unchanged
    });

    it('should update node position', () => {
      const doc = DocumentModel.empty();
      const node = doc.createNode(null);
      let newDoc = doc.addNode(node);

      newDoc = newDoc.updateNodePosition(node.id, { x: 300, y: 400 });

      const updated = newDoc.findNode(node.id);
      expect(updated?.position).toEqual({ x: 300, y: 400 });
    });

    it('should be immutable when updating nodes', () => {
      const doc = DocumentModel.empty();
      const node = doc.createNode(null);
      const doc1 = doc.addNode(node);
      const doc2 = doc1.updateNodeData(node.id, { title: 'New Title' });

      const node1 = doc1.findNode(node.id);
      const node2 = doc2.findNode(node.id);

      expect(node1?.data.title).toBe('New Node');
      expect(node2?.data.title).toBe('New Title');
    });
  });

  describe('Parent Hierarchy', () => {
    it('should move a node to a different parent', () => {
      const doc = DocumentModel.empty();
      const parent1 = doc.createNode(null);
      const parent2 = doc.createNode(null);
      const child = doc.createNode(parent1.id);

      let newDoc = doc.addNode(parent1).addNode(parent2).addNode(child);
      newDoc = newDoc.moveNodeToParent(child.id, parent2.id);

      const updated = newDoc.findNode(child.id);
      expect(updated?.data.parentId).toBe(parent2.id);
    });

    it('should move a node to root level', () => {
      const doc = DocumentModel.empty();
      const parent = doc.createNode(null);
      const child = doc.createNode(parent.id);

      let newDoc = doc.addNode(parent).addNode(child);
      newDoc = newDoc.moveNodeToParent(child.id, null);

      const updated = newDoc.findNode(child.id);
      expect(updated?.data.parentId).toBe(null);
    });

    it('should get nodes by parent', () => {
      const doc = DocumentModel.empty();
      const parent = doc.createNode(null);
      const child1 = doc.createNode(parent.id);
      const child2 = doc.createNode(parent.id);
      const otherNode = doc.createNode(null);

      const newDoc = doc
        .addNode(parent)
        .addNode(child1)
        .addNode(child2)
        .addNode(otherNode);

      const parentChildren = newDoc.getNodesByParent(parent.id);
      expect(parentChildren).toHaveLength(2);
      expect(parentChildren.map(n => n.id)).toContain(child1.id);
      expect(parentChildren.map(n => n.id)).toContain(child2.id);
    });

    it('should get root-level nodes', () => {
      const doc = DocumentModel.empty();
      const root1 = doc.createNode(null);
      const root2 = doc.createNode(null);
      const parent = doc.createNode(null);
      const child = doc.createNode(parent.id);

      const newDoc = doc
        .addNode(root1)
        .addNode(root2)
        .addNode(parent)
        .addNode(child);

      const rootNodes = newDoc.getNodesByParent(null);
      expect(rootNodes).toHaveLength(3);
      expect(rootNodes.map(n => n.id)).toContain(root1.id);
      expect(rootNodes.map(n => n.id)).toContain(root2.id);
      expect(rootNodes.map(n => n.id)).toContain(parent.id);
    });

    it('should get parent chain for breadcrumb', () => {
      const doc = DocumentModel.empty();
      const root = doc.createNode(null);
      const level1 = doc.createNode(root.id);
      const level2 = doc.createNode(level1.id);
      const level3 = doc.createNode(level2.id);

      const newDoc = doc
        .addNode(root)
        .addNode(level1)
        .addNode(level2)
        .addNode(level3);

      const chain = newDoc.getParentChain(level3.id);
      expect(chain).toEqual([level2.id, level1.id, root.id]);
    });

    it('should return empty chain for root node', () => {
      const doc = DocumentModel.empty();
      const root = doc.createNode(null);
      const newDoc = doc.addNode(root);

      const chain = newDoc.getParentChain(root.id);
      expect(chain).toEqual([]);
    });
  });

  describe('Edges (Connections)', () => {
    it('should add an edge between nodes', () => {
      const doc = DocumentModel.empty();
      const node1 = doc.createNode(null);
      const node2 = doc.createNode(null);

      let newDoc = doc.addNode(node1).addNode(node2);
      newDoc = newDoc.addEdge(node1.id, node2.id);

      const target = newDoc.findNode(node2.id);
      expect(target?.data.upstreamIds).toContain(node1.id);
    });

    it('should not duplicate edges', () => {
      const doc = DocumentModel.empty();
      const node1 = doc.createNode(null);
      const node2 = doc.createNode(null);

      let newDoc = doc.addNode(node1).addNode(node2);
      newDoc = newDoc.addEdge(node1.id, node2.id);
      newDoc = newDoc.addEdge(node1.id, node2.id); // Add same edge again

      const target = newDoc.findNode(node2.id);
      expect(target?.data.upstreamIds.filter(id => id === node1.id)).toHaveLength(1);
    });

    it('should remove an edge between nodes', () => {
      const doc = DocumentModel.empty();
      const node1 = doc.createNode(null);
      const node2 = doc.createNode(null);

      let newDoc = doc.addNode(node1).addNode(node2);
      newDoc = newDoc.addEdge(node1.id, node2.id);
      newDoc = newDoc.removeEdge(node1.id, node2.id);

      const target = newDoc.findNode(node2.id);
      expect(target?.data.upstreamIds).not.toContain(node1.id);
    });

    it('should handle multiple upstream connections', () => {
      const doc = DocumentModel.empty();
      const node1 = doc.createNode(null);
      const node2 = doc.createNode(null);
      const node3 = doc.createNode(null);

      let newDoc = doc.addNode(node1).addNode(node2).addNode(node3);
      newDoc = newDoc.addEdge(node1.id, node3.id);
      newDoc = newDoc.addEdge(node2.id, node3.id);

      const target = newDoc.findNode(node3.id);
      expect(target?.data.upstreamIds).toHaveLength(2);
      expect(target?.data.upstreamIds).toContain(node1.id);
      expect(target?.data.upstreamIds).toContain(node2.id);
    });

    it('should convert to ReactFlow edges format', () => {
      const doc = DocumentModel.empty();
      const node1 = doc.createNode(null);
      const node2 = doc.createNode(null);
      const node3 = doc.createNode(null);

      let newDoc = doc.addNode(node1).addNode(node2).addNode(node3);
      newDoc = newDoc.addEdge(node1.id, node2.id);
      newDoc = newDoc.addEdge(node2.id, node3.id);

      const edges = newDoc.toReactFlowEdges();
      expect(edges).toHaveLength(2);
      expect(edges).toContainEqual({
        id: `${node1.id}-${node2.id}`,
        source: node1.id,
        target: node2.id,
      });
      expect(edges).toContainEqual({
        id: `${node2.id}-${node3.id}`,
        source: node2.id,
        target: node3.id,
      });
    });
  });

  describe('Node Duplication', () => {
    it('should duplicate a node', () => {
      const doc = DocumentModel.empty();
      const original = doc.createNode(null, { x: 100, y: 100 });
      const doc1 = doc.addNode(original);

      const result = doc1.duplicateNode(original.id);
      expect(result).not.toBeNull();
      
      const { model: doc2, node: duplicate } = result!;

      expect(doc2.getNodeCount()).toBe(2);
      expect(duplicate.id).not.toBe(original.id);
      expect(duplicate.data.title).toBe('New Node (Copy)');
      expect(duplicate.data.color).toBe(original.data.color);
      expect(duplicate.data.description).toBe(original.data.description);
      expect(duplicate.data.parentId).toBe(original.data.parentId);
      expect(duplicate.position.x).toBe(150); // offset by 50
      expect(duplicate.position.y).toBe(150);
    });

    it('should not copy connections when duplicating', () => {
      const doc = DocumentModel.empty();
      const node1 = doc.createNode(null);
      const node2 = doc.createNode(null);

      let newDoc = doc.addNode(node1).addNode(node2);
      newDoc = newDoc.addEdge(node1.id, node2.id);

      const result = newDoc.duplicateNode(node2.id);
      expect(result).not.toBeNull();
      
      const { node: duplicate } = result!;
      expect(duplicate.data.upstreamIds).toEqual([]);
    });

    it('should return null when duplicating non-existent node', () => {
      const doc = DocumentModel.empty();
      const result = doc.duplicateNode('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('Validation', () => {
    it('should validate a valid document', () => {
      const doc = DocumentModel.empty();
      const parent = doc.createNode(null);
      const child = doc.createNode(parent.id);

      const newDoc = doc.addNode(parent).addNode(child);
      const validation = newDoc.validate();

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid parentId', () => {
      const doc = DocumentModel.empty();
      const node: HierarchicalNode = {
        id: 'test-node',
        position: { x: 0, y: 0 },
        data: {
          title: 'Test',
          color: '#000000',
          description: '',
          parentId: 'non-existent-parent',
          upstreamIds: [],
        },
      };

      const newDoc = doc.addNode(node);
      const validation = newDoc.validate();

      expect(validation.valid).toBe(false);
      expect(validation.errors).toHaveLength(1);
      expect(validation.errors[0]).toContain('invalid parentId');
    });

    it('should detect invalid upstreamId', () => {
      const doc = DocumentModel.empty();
      const node: HierarchicalNode = {
        id: 'test-node',
        position: { x: 0, y: 0 },
        data: {
          title: 'Test',
          color: '#000000',
          description: '',
          parentId: null,
          upstreamIds: ['non-existent-upstream'],
        },
      };

      const newDoc = doc.addNode(node);
      const validation = newDoc.validate();

      expect(validation.valid).toBe(false);
      expect(validation.errors).toHaveLength(1);
      expect(validation.errors[0]).toContain('invalid upstreamId');
    });

    it('should detect parent cycles', () => {
      const doc = DocumentModel.empty();
      const node1: HierarchicalNode = {
        id: 'node-1',
        position: { x: 0, y: 0 },
        data: {
          title: 'Node 1',
          color: '#000000',
          description: '',
          parentId: 'node-2',
          upstreamIds: [],
        },
      };
      const node2: HierarchicalNode = {
        id: 'node-2',
        position: { x: 0, y: 0 },
        data: {
          title: 'Node 2',
          color: '#000000',
          description: '',
          parentId: 'node-1',
          upstreamIds: [],
        },
      };

      const newDoc = doc.addNode(node1).addNode(node2);
      const validation = newDoc.validate();

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('cycle'))).toBe(true);
    });

    it('should detect self-referencing parent', () => {
      const doc = DocumentModel.empty();
      const node: HierarchicalNode = {
        id: 'node-1',
        position: { x: 0, y: 0 },
        data: {
          title: 'Node 1',
          color: '#000000',
          description: '',
          parentId: 'node-1', // self-reference
          upstreamIds: [],
        },
      };

      const newDoc = doc.addNode(node);
      const validation = newDoc.validate();

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('cycle'))).toBe(true);
    });
  });

  describe('Serialization', () => {
    it('should serialize to JSON format', () => {
      const doc = DocumentModel.empty();
      const node1 = doc.createNode(null, { x: 100, y: 200 });
      const node2 = doc.createNode(node1.id, { x: 300, y: 400 });

      let newDoc = doc.addNode(node1).addNode(node2);
      newDoc = newDoc.addEdge(node1.id, node2.id);

      const json = newDoc.toJSON();

      expect(json).toHaveLength(2);
      expect(json[0].id).toBe(node1.id);
      expect(json[0].position).toEqual({ x: 100, y: 200 });
      expect(json[0].data.parentId).toBe(null);
      expect(json[1].id).toBe(node2.id);
      expect(json[1].data.parentId).toBe(node1.id);
      expect(json[1].data.upstreamIds).toContain(node1.id);
    });

    it('should create deep copy in toJSON', () => {
      const doc = DocumentModel.empty();
      const node = doc.createNode(null);
      const newDoc = doc.addNode(node);

      const json1 = newDoc.toJSON();
      const json2 = newDoc.toJSON();

      // Modify json1
      json1[0].data.title = 'Modified';

      // json2 should be unaffected
      expect(json2[0].data.title).toBe('New Node');
    });

    it('should deserialize from JSON format', () => {
      const nodes: HierarchicalNode[] = [
        {
          id: 'node-1',
          position: { x: 100, y: 200 },
          data: {
            title: 'Test',
            color: '#ff0000',
            description: 'Description',
            parentId: null,
            upstreamIds: [],
          },
        },
        {
          id: 'node-2',
          position: { x: 300, y: 400 },
          data: {
            title: 'Child',
            color: '#00ff00',
            description: '',
            parentId: 'node-1',
            upstreamIds: ['node-1'],
          },
        },
      ];

      const doc = DocumentModel.fromJSON(nodes);

      expect(doc.getNodeCount()).toBe(2);
      const loaded1 = doc.findNode('node-1');
      expect(loaded1?.data.title).toBe('Test');
      expect(loaded1?.data.parentId).toBe(null);
      
      const loaded2 = doc.findNode('node-2');
      expect(loaded2?.data.parentId).toBe('node-1');
      expect(loaded2?.data.upstreamIds).toContain('node-1');
    });

    it('should throw error for invalid JSON structure', () => {
      expect(() => DocumentModel.fromJSON(null as any)).toThrow('must be an array');
      expect(() => DocumentModel.fromJSON('not an array' as any)).toThrow('must be an array');
    });

    it('should throw error for invalid node structure', () => {
      const invalidNodes = [
        { id: 'test' }, // missing position and data
      ] as any;

      expect(() => DocumentModel.fromJSON(invalidNodes)).toThrow('Invalid node structure');
    });

    it('should handle missing optional fields with defaults', () => {
      const nodes: any[] = [
        {
          id: 'node-1',
          position: { x: 0, y: 0 },
          data: {
            // Missing all fields
          },
        },
      ];

      const doc = DocumentModel.fromJSON(nodes);
      const node = doc.findNode('node-1');

      expect(node?.data.title).toBe('');
      expect(node?.data.color).toBe('#8b5cf6');
      expect(node?.data.description).toBe('');
      expect(node?.data.parentId).toBe(null);
      expect(node?.data.upstreamIds).toEqual([]);
    });

    it('should round-trip through JSON', () => {
      const doc = DocumentModel.empty();
      const node1 = doc.createNode(null);
      const node2 = doc.createNode(node1.id);

      let newDoc = doc.addNode(node1).addNode(node2);
      newDoc = newDoc.updateNodeData(node1.id, { title: 'Parent', color: '#ff0000' });
      newDoc = newDoc.updateNodeData(node2.id, { title: 'Child', color: '#00ff00' });
      newDoc = newDoc.addEdge(node1.id, node2.id);

      const json = newDoc.toJSON();
      const loadedDoc = DocumentModel.fromJSON(json);

      expect(loadedDoc.getNodeCount()).toBe(newDoc.getNodeCount());
      
      const loaded1 = loadedDoc.findNode(node1.id);
      expect(loaded1?.data.title).toBe('Parent');
      expect(loaded1?.data.color).toBe('#ff0000');
      
      const loaded2 = loadedDoc.findNode(node2.id);
      expect(loaded2?.data.title).toBe('Child');
      expect(loaded2?.data.parentId).toBe(node1.id);
      expect(loaded2?.data.upstreamIds).toContain(node1.id);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty operations gracefully', () => {
      const doc = DocumentModel.empty();
      
      expect(doc.findNode('non-existent')).toBeUndefined();
      expect(doc.getNodesByParent(null)).toHaveLength(0);
      expect(doc.getNodesByParent('non-existent')).toHaveLength(0);
      expect(doc.getParentChain('non-existent')).toEqual([]);
      expect(doc.toReactFlowEdges()).toEqual([]);
    });

    it('should handle updating non-existent node', () => {
      const doc = DocumentModel.empty();
      const newDoc = doc.updateNodeData('non-existent', { title: 'New' });
      
      expect(newDoc.getNodeCount()).toBe(0);
    });

    it('should handle removing non-existent node', () => {
      const doc = DocumentModel.empty();
      const node = doc.createNode(null);
      const doc1 = doc.addNode(node);
      const doc2 = doc1.removeNode('non-existent');
      
      expect(doc2.getNodeCount()).toBe(1);
    });

    it('should handle adding edge to/from non-existent nodes', () => {
      const doc = DocumentModel.empty();
      const node = doc.createNode(null);
      const doc1 = doc.addNode(node);
      
      // Adding edge from non-existent source
      const doc2 = doc1.addEdge('non-existent', node.id);
      const target = doc2.findNode(node.id);
      expect(target?.data.upstreamIds).toContain('non-existent');
      
      // Adding edge to non-existent target does nothing
      const doc3 = doc1.addEdge(node.id, 'non-existent');
      expect(doc3.findNode('non-existent')).toBeUndefined();
    });
  });
});

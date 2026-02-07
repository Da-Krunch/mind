import { describe, it, expect } from 'vitest';
import * as GraphOps from './GraphOperations';
import { Node, Edge } from 'reactflow';
import { NodeData, getNodeLabel } from '../types';

describe('GraphOperations', () => {
  describe('generateNodeId', () => {
    it('should generate unique IDs', () => {
      const id1 = GraphOps.generateNodeId();
      const id2 = GraphOps.generateNodeId();
      
      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it('should generate IDs with node- prefix', () => {
      const id = GraphOps.generateNodeId();
      expect(id).toMatch(/^node-/);
    });
  });

  describe('createNode', () => {
    it('should create a node with default values', () => {
      const node = GraphOps.createNode();
      
      expect(node.id).toBeTruthy();
      expect(node.type).toBe('colored');
      expect(node.data.title).toBe('New Node');
      expect(node.data.color).toBe('#8b5cf6');
      expect(node.data.description).toBe('');
    });

    it('should create nodes with different positions', () => {
      const node1 = GraphOps.createNode();
      const node2 = GraphOps.createNode();
      
      // Very unlikely to have exact same random position
      const samePosition = 
        node1.position.x === node2.position.x && 
        node1.position.y === node2.position.y;
      
      expect(samePosition).toBe(false);
    });

    it('should create nodes with unique IDs', () => {
      const node1 = GraphOps.createNode();
      const node2 = GraphOps.createNode();
      
      expect(node1.id).not.toBe(node2.id);
    });
  });

  describe('duplicateNode', () => {
    it('should duplicate a node with offset position', () => {
      const original: Node<NodeData> = {
        id: 'original',
        type: 'colored',
        position: { x: 100, y: 100 },
        data: {
          title: 'Original',
          color: '#ff0000',
          description: 'Test',
        },
      };

      const duplicate = GraphOps.duplicateNode(original);

      expect(duplicate.id).not.toBe(original.id);
      expect(duplicate.position.x).toBe(150);
      expect(duplicate.position.y).toBe(150);
      expect(duplicate.data.title).toContain('Copy');
      expect(duplicate.data.color).toBe(original.data.color);
    });

    it('should preserve node type', () => {
      const original: Node<NodeData> = {
        id: 'test',
        type: 'colored',
        position: { x: 0, y: 0 },
        data: {
          title: 'Test',
          color: '#000',
          description: '',
        },
      };

      const duplicate = GraphOps.duplicateNode(original);
      expect(duplicate.type).toBe('colored');
    });
  });

  describe('addNode', () => {
    it('should add a node to empty array', () => {
      const nodes: Node[] = [];
      const newNode: Node = {
        id: '1',
        type: 'colored',
        position: { x: 0, y: 0 },
        data: {},
      };

      const result = GraphOps.addNode(nodes, newNode);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should add a node to existing array', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {}, type: 'default' },
      ];
      const newNode: Node = {
        id: '2',
        type: 'colored',
        position: { x: 100, y: 100 },
        data: {},
      };

      const result = GraphOps.addNode(nodes, newNode);

      expect(result).toHaveLength(2);
      expect(result[1].id).toBe('2');
    });

    it('should not mutate original array', () => {
      const nodes: Node[] = [{ id: '1', position: { x: 0, y: 0 }, data: {}, type: 'default' }];
      const newNode: Node = { id: '2', position: { x: 0, y: 0 }, data: {}, type: 'default' };

      GraphOps.addNode(nodes, newNode);

      expect(nodes).toHaveLength(1);
    });
  });

  describe('removeNode', () => {
    it('should remove a node by ID', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {}, type: 'default' },
        { id: '2', position: { x: 100, y: 100 }, data: {}, type: 'default' },
      ];

      const result = GraphOps.removeNode(nodes, '1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('should handle non-existent ID gracefully', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {}, type: 'default' },
      ];

      const result = GraphOps.removeNode(nodes, 'non-existent');

      expect(result).toHaveLength(1);
    });

    it('should not mutate original array', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {}, type: 'default' },
      ];

      GraphOps.removeNode(nodes, '1');

      expect(nodes).toHaveLength(1);
    });
  });

  describe('removeNodeEdges', () => {
    it('should remove edges connected to a node', () => {
      const edges: Edge[] = [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e2-3', source: '2', target: '3' },
        { id: 'e3-4', source: '3', target: '4' },
      ];

      const result = GraphOps.removeNodeEdges(edges, '2');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('e3-4');
    });

    it('should handle node with no connections', () => {
      const edges: Edge[] = [
        { id: 'e1-2', source: '1', target: '2' },
      ];

      const result = GraphOps.removeNodeEdges(edges, '3');

      expect(result).toHaveLength(1);
    });

    it('should not mutate original array', () => {
      const edges: Edge[] = [
        { id: 'e1-2', source: '1', target: '2' },
      ];

      GraphOps.removeNodeEdges(edges, '1');

      expect(edges).toHaveLength(1);
    });
  });

  describe('updateNodeData', () => {
    it('should update node data by ID', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: { title: 'Old', color: '#000', description: '' }, type: 'default' },
      ];
      const newData: NodeData = {
        title: 'New Title',
        color: '#ff0000',
        description: 'New description',
      };

      const result = GraphOps.updateNodeData(nodes, '1', newData);

      expect(result[0].data.title).toBe('New Title');
      expect(result[0].data.color).toBe('#ff0000');
      expect(result[0].data.description).toBe('New description');
    });

    it('should update all fields of node data', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: { title: 'Old', color: '#000', description: '' }, type: 'default' },
      ];
      const newData: NodeData = {
        title: 'New',
        color: '#ffffff',
        description: 'Updated',
      };

      const result = GraphOps.updateNodeData(nodes, '1', newData);

      expect(result[0].data).toEqual(newData);
    });

    it('should handle non-existent ID gracefully', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: { title: 'Original' }, type: 'default' },
      ];
      const newData: NodeData = {
        title: 'New',
        color: '#000',
        description: '',
      };

      const result = GraphOps.updateNodeData(nodes, 'non-existent', newData);

      expect(result[0].data.title).toBe('Original');
    });

    it('should not mutate original array', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: { title: 'Original' }, type: 'default' },
      ];
      const newData: NodeData = {
        title: 'New',
        color: '#000',
        description: '',
      };

      GraphOps.updateNodeData(nodes, '1', newData);

      expect(nodes[0].data.title).toBe('Original');
    });
  });

  describe('findNode', () => {
    it('should find a node by ID', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {}, type: 'default' },
        { id: '2', position: { x: 100, y: 100 }, data: {}, type: 'default' },
      ];

      const result = GraphOps.findNode(nodes, '2');

      expect(result).toBeDefined();
      expect(result?.id).toBe('2');
    });

    it('should return undefined for non-existent ID', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {}, type: 'default' },
      ];

      const result = GraphOps.findNode(nodes, 'non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('validateEdges', () => {
    it('should validate correct edges', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {}, type: 'default' },
        { id: '2', position: { x: 100, y: 100 }, data: {}, type: 'default' },
      ];
      const edges: Edge[] = [
        { id: 'e1-2', source: '1', target: '2' },
      ];

      const result = GraphOps.validateEdges(nodes, edges);

      expect(result).toBe(true);
    });

    it('should detect invalid source', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {}, type: 'default' },
      ];
      const edges: Edge[] = [
        { id: 'e2-1', source: '2', target: '1' },
      ];

      const result = GraphOps.validateEdges(nodes, edges);

      expect(result).toBe(false);
    });

    it('should detect invalid target', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {}, type: 'default' },
      ];
      const edges: Edge[] = [
        { id: 'e1-2', source: '1', target: '2' },
      ];

      const result = GraphOps.validateEdges(nodes, edges);

      expect(result).toBe(false);
    });

    it('should validate empty edges', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {}, type: 'default' },
      ];
      const edges: Edge[] = [];

      const result = GraphOps.validateEdges(nodes, edges);

      expect(result).toBe(true);
    });
  });

  describe('getNodeIds', () => {
    it('should extract all node IDs', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {}, type: 'default' },
        { id: '2', position: { x: 100, y: 100 }, data: {}, type: 'default' },
        { id: '3', position: { x: 200, y: 200 }, data: {}, type: 'default' },
      ];

      const result = GraphOps.getNodeIds(nodes);

      expect(result).toEqual(['1', '2', '3']);
    });

    it('should handle empty array', () => {
      const result = GraphOps.getNodeIds([]);

      expect(result).toEqual([]);
    });
  });

  describe('getNodeLabel', () => {
    it('should return title when description is empty', () => {
      const data: NodeData = {
        title: 'Test Title',
        color: '#000',
        description: '',
      };

      expect(getNodeLabel(data)).toBe('Test Title');
    });

    it('should add ellipsis when description exists', () => {
      const data: NodeData = {
        title: 'Test Title',
        color: '#000',
        description: 'Some description',
      };

      expect(getNodeLabel(data)).toBe('Test Title(...)');
    });

    it('should add ellipsis even for short descriptions', () => {
      const data: NodeData = {
        title: 'Title',
        color: '#000',
        description: 'x',
      };

      expect(getNodeLabel(data)).toBe('Title(...)');
    });
  });
});

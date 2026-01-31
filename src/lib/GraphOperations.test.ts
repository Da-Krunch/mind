import { describe, it, expect } from 'vitest';
import { GraphOperations } from './GraphOperations';
import { Node, Edge } from 'reactflow';
import { NodeData } from '../types';

describe('GraphOperations', () => {
  describe('generateNodeId', () => {
    it('should generate unique IDs', () => {
      const id1 = GraphOperations.generateNodeId();
      const id2 = GraphOperations.generateNodeId();
      
      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it('should generate IDs with node- prefix', () => {
      const id = GraphOperations.generateNodeId();
      expect(id).toMatch(/^node-/);
    });
  });

  describe('createNode', () => {
    it('should create a node with default values', () => {
      const node = GraphOperations.createNode();
      
      expect(node.id).toBeTruthy();
      expect(node.type).toBe('colored');
      expect(node.data.title).toBe('New Node');
      expect(node.data.color).toBe('#8b5cf6');
      expect(node.data.description).toBe('');
    });

    it('should create nodes with different positions', () => {
      const node1 = GraphOperations.createNode();
      const node2 = GraphOperations.createNode();
      
      // Very unlikely to have exact same random position
      const samePosition = 
        node1.position.x === node2.position.x && 
        node1.position.y === node2.position.y;
      
      expect(samePosition).toBe(false);
    });

    it('should create nodes with unique IDs', () => {
      const node1 = GraphOperations.createNode();
      const node2 = GraphOperations.createNode();
      
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
          label: 'Original',
        } as NodeData & { label: string },
      };

      const duplicate = GraphOperations.duplicateNode(original);

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
        data: { title: 'Test', color: '#000', description: '', label: 'Test' } as NodeData & { label: string },
      };

      const duplicate = GraphOperations.duplicateNode(original);
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

      const result = GraphOperations.addNode(nodes, newNode);

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

      const result = GraphOperations.addNode(nodes, newNode);

      expect(result).toHaveLength(2);
      expect(result[1].id).toBe('2');
    });

    it('should not mutate original array', () => {
      const nodes: Node[] = [{ id: '1', position: { x: 0, y: 0 }, data: {}, type: 'default' }];
      const newNode: Node = { id: '2', position: { x: 0, y: 0 }, data: {}, type: 'default' };

      GraphOperations.addNode(nodes, newNode);

      expect(nodes).toHaveLength(1);
    });
  });

  describe('removeNode', () => {
    it('should remove a node by ID', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {}, type: 'default' },
        { id: '2', position: { x: 100, y: 100 }, data: {}, type: 'default' },
      ];

      const result = GraphOperations.removeNode(nodes, '1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('should handle non-existent ID gracefully', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {}, type: 'default' },
      ];

      const result = GraphOperations.removeNode(nodes, 'non-existent');

      expect(result).toHaveLength(1);
    });

    it('should not mutate original array', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {}, type: 'default' },
      ];

      GraphOperations.removeNode(nodes, '1');

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

      const result = GraphOperations.removeNodeEdges(edges, '2');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('e3-4');
    });

    it('should handle node with no connections', () => {
      const edges: Edge[] = [
        { id: 'e1-2', source: '1', target: '2' },
      ];

      const result = GraphOperations.removeNodeEdges(edges, '3');

      expect(result).toHaveLength(1);
    });

    it('should not mutate original array', () => {
      const edges: Edge[] = [
        { id: 'e1-2', source: '1', target: '2' },
      ];

      GraphOperations.removeNodeEdges(edges, '1');

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

      const result = GraphOperations.updateNodeData(nodes, '1', newData);

      expect(result[0].data.title).toBe('New Title');
      expect(result[0].data.color).toBe('#ff0000');
      expect(result[0].data.label).toBe('New Title(...)');
    });

    it('should add ellipsis to label when description exists', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {}, type: 'default' },
      ];
      const newData: NodeData = {
        title: 'Title',
        color: '#000',
        description: 'Some description',
      };

      const result = GraphOperations.updateNodeData(nodes, '1', newData);

      expect(result[0].data.label).toBe('Title(...)');
    });

    it('should not add ellipsis when description is empty', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {}, type: 'default' },
      ];
      const newData: NodeData = {
        title: 'Title',
        color: '#000',
        description: '',
      };

      const result = GraphOperations.updateNodeData(nodes, '1', newData);

      expect(result[0].data.label).toBe('Title');
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

      const result = GraphOperations.updateNodeData(nodes, 'non-existent', newData);

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

      GraphOperations.updateNodeData(nodes, '1', newData);

      expect(nodes[0].data.title).toBe('Original');
    });
  });

  describe('findNode', () => {
    it('should find a node by ID', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {}, type: 'default' },
        { id: '2', position: { x: 100, y: 100 }, data: {}, type: 'default' },
      ];

      const result = GraphOperations.findNode(nodes, '2');

      expect(result).toBeDefined();
      expect(result?.id).toBe('2');
    });

    it('should return undefined for non-existent ID', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {}, type: 'default' },
      ];

      const result = GraphOperations.findNode(nodes, 'non-existent');

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

      const result = GraphOperations.validateEdges(nodes, edges);

      expect(result).toBe(true);
    });

    it('should detect invalid source', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {}, type: 'default' },
      ];
      const edges: Edge[] = [
        { id: 'e2-1', source: '2', target: '1' },
      ];

      const result = GraphOperations.validateEdges(nodes, edges);

      expect(result).toBe(false);
    });

    it('should detect invalid target', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {}, type: 'default' },
      ];
      const edges: Edge[] = [
        { id: 'e1-2', source: '1', target: '2' },
      ];

      const result = GraphOperations.validateEdges(nodes, edges);

      expect(result).toBe(false);
    });

    it('should validate empty edges', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {}, type: 'default' },
      ];
      const edges: Edge[] = [];

      const result = GraphOperations.validateEdges(nodes, edges);

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

      const result = GraphOperations.getNodeIds(nodes);

      expect(result).toEqual(['1', '2', '3']);
    });

    it('should handle empty array', () => {
      const result = GraphOperations.getNodeIds([]);

      expect(result).toEqual([]);
    });
  });
});

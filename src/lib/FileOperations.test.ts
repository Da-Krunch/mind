import { describe, it, expect } from 'vitest';
import { FileOperations, FILE_FORMAT_VERSION } from './FileOperations';
import { Node, Edge } from 'reactflow';

describe('FileOperations', () => {
  describe('serialize', () => {
    it('should serialize nodes and edges to YAML', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'colored',
          position: { x: 100, y: 200 },
          data: { title: 'Test', color: '#3b82f6', description: 'Test node', label: 'Test' },
        },
      ];
      const edges: Edge[] = [
        {
          id: 'e1-2',
          source: '1',
          target: '2',
        },
      ];

      const yaml = FileOperations.serialize(nodes, edges);

      expect(yaml).toContain(`version: ${FILE_FORMAT_VERSION}`);
      expect(yaml).toContain("id: '1'");
      expect(yaml).toContain('title: Test');
      expect(yaml).toContain("color: '#3b82f6'");
      expect(yaml).toContain("source: '1'");
      expect(yaml).toContain("target: '2'");
    });

    it('should handle empty nodes and edges', () => {
      const yaml = FileOperations.serialize([], []);

      expect(yaml).toContain(`version: ${FILE_FORMAT_VERSION}`);
      expect(yaml).toContain('nodes: []');
      expect(yaml).toContain('edges: []');
    });
  });

  describe('deserialize', () => {
    it('should deserialize valid YAML to nodes and edges', () => {
      const yaml = `
version: 1
nodes:
  - id: "1"
    type: colored
    position:
      x: 100
      y: 200
    data:
      title: Test
      color: "#3b82f6"
      description: Test node
      label: Test
edges:
  - id: e1-2
    source: "1"
    target: "2"
`;

      const result = FileOperations.deserialize(yaml);

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].id).toBe('1');
      expect(result.nodes[0].position.x).toBe(100);
      expect(result.nodes[0].data.title).toBe('Test');
      expect(result.edges).toHaveLength(1);
      expect(result.edges[0].source).toBe('1');
    });

    it('should throw error if version is missing', () => {
      const yaml = `
nodes: []
edges: []
`;

      expect(() => FileOperations.deserialize(yaml)).toThrow('version missing');
    });

    it('should throw error if version is too new', () => {
      const yaml = `
version: 999
nodes: []
edges: []
`;

      expect(() => FileOperations.deserialize(yaml)).toThrow('version 999 is newer');
    });

    it('should ignore label field from file (computed on-the-fly)', () => {
      const yaml = `
version: 1
nodes:
  - id: "1"
    type: colored
    position:
      x: 0
      y: 0
    data:
      title: NoLabel
      color: "#fff"
      description: ""
      label: "OldLabel"
edges: []
`;

      const result = FileOperations.deserialize(yaml);

      // Label is not stored in NodeData - it's computed on-the-fly
      expect(result.nodes[0].data).not.toHaveProperty('label');
    });
  });

  describe('round-trip', () => {
    it('should preserve data through serialize -> deserialize', () => {
      const originalNodes: Node[] = [
        {
          id: '1',
          type: 'colored',
          position: { x: 123, y: 456 },
          data: { title: 'Round Trip', color: '#10b981', description: 'Test', label: 'Round Trip' },
        },
        {
          id: '2',
          type: 'colored',
          position: { x: 789, y: 101 },
          data: { title: 'Second', color: '#f59e0b', description: 'Another', label: 'Second' },
        },
      ];
      const originalEdges: Edge[] = [
        { id: 'e1-2', source: '1', target: '2' },
      ];

      const yaml = FileOperations.serialize(originalNodes, originalEdges);
      const { nodes, edges } = FileOperations.deserialize(yaml);

      expect(nodes).toHaveLength(2);
      expect(nodes[0].id).toBe('1');
      expect(nodes[0].position.x).toBe(123);
      expect(nodes[0].data.title).toBe('Round Trip');
      expect(nodes[1].id).toBe('2');
      expect(edges).toHaveLength(1);
      expect(edges[0].id).toBe('e1-2');
    });
  });
});

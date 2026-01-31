import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGraphModel } from './useGraphModel';
import { Connection } from 'reactflow';

describe('useGraphModel', () => {
  describe('Initial State', () => {
    it('should initialize with default nodes and edges', () => {
      const { result } = renderHook(() => useGraphModel());

      expect(result.current.nodes).toHaveLength(3); // 3 initial nodes
      expect(result.current.edges).toHaveLength(2); // 2 initial edges
    });

    it('should have initial nodes with correct structure', () => {
      const { result } = renderHook(() => useGraphModel());

      const firstNode = result.current.nodes[0];
      expect(firstNode).toHaveProperty('id');
      expect(firstNode).toHaveProperty('type', 'colored');
      expect(firstNode).toHaveProperty('position');
      expect(firstNode).toHaveProperty('data');
      expect(firstNode.data).toHaveProperty('title');
      expect(firstNode.data).toHaveProperty('color');
      expect(firstNode.data).toHaveProperty('description');
    });

    it('should initialize history system', () => {
      const { result } = renderHook(() => useGraphModel());

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });

    it('should provide all required ReactFlow handlers', () => {
      const { result } = renderHook(() => useGraphModel());

      expect(typeof result.current.onNodesChange).toBe('function');
      expect(typeof result.current.onEdgesChange).toBe('function');
      expect(typeof result.current.onConnect).toBe('function');
      expect(typeof result.current.onNodeDragStop).toBe('function');
    });

    it('should provide all graph operations', () => {
      const { result } = renderHook(() => useGraphModel());

      expect(typeof result.current.createNode).toBe('function');
      expect(typeof result.current.duplicateNode).toBe('function');
      expect(typeof result.current.deleteNode).toBe('function');
      expect(typeof result.current.updateNodeData).toBe('function');
    });
  });

  describe('Node Creation', () => {
    it('should create a new node with default values', () => {
      const { result } = renderHook(() => useGraphModel());

      const initialNodeCount = result.current.nodes.length;

      let newNode;
      act(() => {
        newNode = result.current.createNode();
      });

      expect(result.current.nodes).toHaveLength(initialNodeCount + 1);
      expect(newNode).toBeDefined();
      expect(newNode?.data.title).toBe('New Node');
      expect(newNode?.data.color).toBe('#8b5cf6');
      expect(newNode?.type).toBe('colored');
    });

    it('should create nodes with unique IDs', () => {
      const { result } = renderHook(() => useGraphModel());

      let node1, node2;
      act(() => {
        node1 = result.current.createNode();
        node2 = result.current.createNode();
      });

      expect(node1?.id).not.toBe(node2?.id);
    });

    it('should create nodes at different positions', () => {
      const { result } = renderHook(() => useGraphModel());

      let node1, node2;
      act(() => {
        node1 = result.current.createNode();
        node2 = result.current.createNode();
      });

      // Positions should be randomized (very unlikely to be exactly the same)
      const samePosition = 
        node1?.position.x === node2?.position.x && 
        node1?.position.y === node2?.position.y;
      
      expect(samePosition).toBe(false);
    });

    it('should capture snapshot after creating node', () => {
      const { result } = renderHook(() => useGraphModel());

      act(() => {
        result.current.createNode();
      });

      expect(result.current.canUndo).toBe(true);
    });

    it('should allow undoing node creation', () => {
      const { result } = renderHook(() => useGraphModel());

      const initialNodeCount = result.current.nodes.length;

      act(() => {
        result.current.createNode();
      });

      expect(result.current.nodes).toHaveLength(initialNodeCount + 1);

      act(() => {
        result.current.undo();
      });

      expect(result.current.nodes).toHaveLength(initialNodeCount);
    });
  });

  describe('Node Duplication', () => {
    it('should duplicate an existing node', () => {
      const { result } = renderHook(() => useGraphModel());

      const originalNode = result.current.nodes[0];
      const initialNodeCount = result.current.nodes.length;

      let duplicatedNode;
      act(() => {
        duplicatedNode = result.current.duplicateNode(originalNode.id);
      });

      expect(result.current.nodes).toHaveLength(initialNodeCount + 1);
      expect(duplicatedNode).toBeDefined();
      expect(duplicatedNode?.data.title).toContain('Copy');
      expect(duplicatedNode?.data.color).toBe(originalNode.data.color);
    });

    it('should create duplicate with offset position', () => {
      const { result } = renderHook(() => useGraphModel());

      const originalNode = result.current.nodes[0];

      let duplicatedNode;
      act(() => {
        duplicatedNode = result.current.duplicateNode(originalNode.id);
      });

      expect(duplicatedNode?.position.x).toBe(originalNode.position.x + 50);
      expect(duplicatedNode?.position.y).toBe(originalNode.position.y + 50);
    });

    it('should return null for non-existent node ID', () => {
      const { result } = renderHook(() => useGraphModel());

      let duplicatedNode;
      act(() => {
        duplicatedNode = result.current.duplicateNode('non-existent-id');
      });

      expect(duplicatedNode).toBeNull();
    });

    it('should capture snapshot after duplicating node', () => {
      const { result } = renderHook(() => useGraphModel());

      const originalNode = result.current.nodes[0];

      act(() => {
        result.current.duplicateNode(originalNode.id);
      });

      expect(result.current.canUndo).toBe(true);
    });

    it('should allow undoing node duplication', () => {
      const { result } = renderHook(() => useGraphModel());

      const originalNode = result.current.nodes[0];
      const initialNodeCount = result.current.nodes.length;

      act(() => {
        result.current.duplicateNode(originalNode.id);
      });

      expect(result.current.nodes).toHaveLength(initialNodeCount + 1);

      act(() => {
        result.current.undo();
      });

      expect(result.current.nodes).toHaveLength(initialNodeCount);
    });
  });

  describe('Node Deletion', () => {
    it('should delete a node by ID', () => {
      const { result } = renderHook(() => useGraphModel());

      const nodeToDelete = result.current.nodes[0];
      const initialNodeCount = result.current.nodes.length;

      act(() => {
        result.current.deleteNode(nodeToDelete.id);
      });

      expect(result.current.nodes).toHaveLength(initialNodeCount - 1);
      expect(result.current.nodes.find(n => n.id === nodeToDelete.id)).toBeUndefined();
    });

    it('should delete all edges connected to deleted node', () => {
      const { result } = renderHook(() => useGraphModel());

      // Node '1' is connected to nodes '2' and '3'
      const nodeToDelete = result.current.nodes.find(n => n.id === '1');
      expect(nodeToDelete).toBeDefined();

      const initialEdgeCount = result.current.edges.length;
      const connectedEdges = result.current.edges.filter(
        e => e.source === nodeToDelete!.id || e.target === nodeToDelete!.id
      );

      act(() => {
        result.current.deleteNode(nodeToDelete!.id);
      });

      expect(result.current.edges).toHaveLength(initialEdgeCount - connectedEdges.length);
    });

    it('should handle deletion of non-existent node gracefully', () => {
      const { result } = renderHook(() => useGraphModel());

      const initialNodeCount = result.current.nodes.length;

      act(() => {
        result.current.deleteNode('non-existent-id');
      });

      expect(result.current.nodes).toHaveLength(initialNodeCount);
    });

    it('should capture snapshot after deleting node', () => {
      const { result } = renderHook(() => useGraphModel());

      const nodeToDelete = result.current.nodes[0];

      act(() => {
        result.current.deleteNode(nodeToDelete.id);
      });

      expect(result.current.canUndo).toBe(true);
    });

    it('should allow undoing node deletion', () => {
      const { result } = renderHook(() => useGraphModel());

      const nodeToDelete = result.current.nodes[0];
      const initialNodeCount = result.current.nodes.length;

      act(() => {
        result.current.deleteNode(nodeToDelete.id);
      });

      expect(result.current.nodes).toHaveLength(initialNodeCount - 1);

      act(() => {
        result.current.undo();
      });

      expect(result.current.nodes).toHaveLength(initialNodeCount);
      expect(result.current.nodes.find(n => n.id === nodeToDelete.id)).toBeDefined();
    });
  });

  describe('Node Data Update', () => {
    it('should update node data', () => {
      const { result } = renderHook(() => useGraphModel());

      const nodeToUpdate = result.current.nodes[0];
      const newData = {
        title: 'Updated Title',
        color: '#ff0000',
        description: 'Updated description',
      };

      act(() => {
        result.current.updateNodeData(nodeToUpdate.id, newData);
      });

      const updatedNode = result.current.nodes.find(n => n.id === nodeToUpdate.id);
      expect(updatedNode?.data.title).toBe('Updated Title');
      expect(updatedNode?.data.color).toBe('#ff0000');
      expect(updatedNode?.data.description).toBe('Updated description');
    });

    it('should update label based on title', () => {
      const { result } = renderHook(() => useGraphModel());

      const nodeToUpdate = result.current.nodes[0];

      act(() => {
        result.current.updateNodeData(nodeToUpdate.id, {
          title: 'New Title',
          color: '#000000',
          description: '',
        });
      });

      const updatedNode = result.current.nodes.find(n => n.id === nodeToUpdate.id);
      expect(updatedNode?.data.label).toBe('New Title');
    });

    it('should add ellipsis to label when description is present', () => {
      const { result } = renderHook(() => useGraphModel());

      const nodeToUpdate = result.current.nodes[0];

      act(() => {
        result.current.updateNodeData(nodeToUpdate.id, {
          title: 'Title',
          color: '#000000',
          description: 'Some description',
        });
      });

      const updatedNode = result.current.nodes.find(n => n.id === nodeToUpdate.id);
      expect(updatedNode?.data.label).toBe('Title(...)');
    });

    it('should not capture snapshot on update (caller responsibility)', () => {
      const { result } = renderHook(() => useGraphModel());

      const nodeToUpdate = result.current.nodes[0];

      act(() => {
        result.current.updateNodeData(nodeToUpdate.id, {
          title: 'Updated',
          color: '#000000',
          description: '',
        });
      });

      // canUndo should still be false (no snapshot captured)
      expect(result.current.canUndo).toBe(false);
    });

    it('should handle update of non-existent node gracefully', () => {
      const { result } = renderHook(() => useGraphModel());

      const initialNodeCount = result.current.nodes.length;

      act(() => {
        result.current.updateNodeData('non-existent-id', {
          title: 'Test',
          color: '#000000',
          description: '',
        });
      });

      expect(result.current.nodes).toHaveLength(initialNodeCount);
    });
  });

  describe('Edge Creation', () => {
    it('should create connection between nodes', () => {
      const { result } = renderHook(() => useGraphModel());

      const initialEdgeCount = result.current.edges.length;
      const connection: Connection = {
        source: '2',
        target: '3',
        sourceHandle: null,
        targetHandle: null,
      };

      act(() => {
        result.current.onConnect(connection);
      });

      expect(result.current.edges.length).toBeGreaterThan(initialEdgeCount);
    });

    it('should capture snapshot after creating connection', () => {
      const { result } = renderHook(() => useGraphModel());

      const connection: Connection = {
        source: '2',
        target: '3',
        sourceHandle: null,
        targetHandle: null,
      };

      act(() => {
        result.current.onConnect(connection);
      });

      expect(result.current.canUndo).toBe(true);
    });

    it('should allow undoing connection creation', () => {
      const { result } = renderHook(() => useGraphModel());

      const initialEdgeCount = result.current.edges.length;
      const connection: Connection = {
        source: '2',
        target: '3',
        sourceHandle: null,
        targetHandle: null,
      };

      act(() => {
        result.current.onConnect(connection);
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.edges).toHaveLength(initialEdgeCount);
    });
  });

  describe('Undo/Redo Integration', () => {
    it('should undo multiple operations in sequence', () => {
      const { result } = renderHook(() => useGraphModel());

      const initialState = {
        nodeCount: result.current.nodes.length,
        edgeCount: result.current.edges.length,
      };

      // Create node
      act(() => {
        result.current.createNode();
      });

      // Delete a node
      act(() => {
        result.current.deleteNode(result.current.nodes[0].id);
      });

      // Create another node
      act(() => {
        result.current.createNode();
      });

      // Undo all operations
      act(() => {
        result.current.undo();
        result.current.undo();
        result.current.undo();
      });

      expect(result.current.nodes).toHaveLength(initialState.nodeCount);
      expect(result.current.edges).toHaveLength(initialState.edgeCount);
    });

    it('should redo multiple operations in sequence', () => {
      const { result } = renderHook(() => useGraphModel());

      // Create two nodes
      act(() => {
        result.current.createNode();
        result.current.createNode();
      });

      const stateAfterCreation = {
        nodeCount: result.current.nodes.length,
        edgeCount: result.current.edges.length,
      };

      // Undo both
      act(() => {
        result.current.undo();
        result.current.undo();
      });

      // Redo both
      act(() => {
        result.current.redo();
        result.current.redo();
      });

      expect(result.current.nodes).toHaveLength(stateAfterCreation.nodeCount);
    });

    it('should handle node drag stop by capturing snapshot', () => {
      const { result } = renderHook(() => useGraphModel());

      act(() => {
        result.current.onNodeDragStop();
      });

      expect(result.current.canUndo).toBe(true);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle create, update, and delete in sequence', () => {
      const { result } = renderHook(() => useGraphModel());

      let createdNode;
      
      // Create node
      act(() => {
        createdNode = result.current.createNode();
      });

      expect(createdNode).toBeDefined();

      // Update the node
      act(() => {
        result.current.updateNodeData(createdNode!.id, {
          title: 'Updated Node',
          color: '#00ff00',
          description: 'Test',
        });
        result.current.captureSnapshot();
      });

      const updatedNode = result.current.nodes.find(n => n.id === createdNode!.id);
      expect(updatedNode?.data.title).toBe('Updated Node');

      // Delete the node
      act(() => {
        result.current.deleteNode(createdNode!.id);
      });

      expect(result.current.nodes.find(n => n.id === createdNode!.id)).toBeUndefined();

      // Undo all operations
      act(() => {
        result.current.undo(); // Undo delete
        result.current.undo(); // Undo update
        result.current.undo(); // Undo create
      });

      expect(result.current.nodes.find(n => n.id === createdNode!.id)).toBeUndefined();
    });

    it('should maintain graph integrity after multiple operations', () => {
      const { result } = renderHook(() => useGraphModel());

      // Perform various operations
      act(() => {
        const node1 = result.current.createNode();
        const node2 = result.current.createNode();
        
        result.current.duplicateNode(result.current.nodes[0].id);
        result.current.deleteNode(result.current.nodes[1].id);
        
        result.current.onConnect({
          source: node1!.id,
          target: node2!.id,
          sourceHandle: null,
          targetHandle: null,
        });
      });

      // All nodes should have unique IDs
      const ids = result.current.nodes.map(n => n.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);

      // All edges should reference existing nodes
      result.current.edges.forEach(edge => {
        expect(result.current.nodes.find(n => n.id === edge.source)).toBeDefined();
        expect(result.current.nodes.find(n => n.id === edge.target)).toBeDefined();
      });
    });
  });

  describe('Manual Snapshot Capture', () => {
    it('should allow manual snapshot capture', () => {
      const { result } = renderHook(() => useGraphModel());

      // Update without auto-capture
      act(() => {
        result.current.updateNodeData(result.current.nodes[0].id, {
          title: 'Manual Update',
          color: '#000000',
          description: '',
        });
      });

      expect(result.current.canUndo).toBe(false);

      // Manually capture
      act(() => {
        result.current.captureSnapshot();
      });

      expect(result.current.canUndo).toBe(true);
    });
  });
});

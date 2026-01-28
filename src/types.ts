// Type definitions for the Mind node graph editor

/**
 * Data stored in each node
 * Similar to a C++ struct or Python dataclass
 */
export interface NodeData {
  title: string;        // Displayed on the node and in editor
  color: string;        // Node background color (hex or CSS color)
  description: string;  // Detailed content, editable in side panel
}

/**
 * Note: React Flow has its own Node type that we'll use,
 * which includes: id, position, data (our NodeData), type, etc.
 */

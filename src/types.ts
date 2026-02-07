// Type definitions for the Mind node graph editor

/**
 * Data stored in each node
 * This is what gets persisted to files and edited by users
 * Similar to a C++ struct or Python dataclass
 */
export interface NodeData {
  title: string;        // Displayed on the node and in editor
  color: string;        // Node background color (hex or CSS color)
  description: string;  // Detailed content, editable in side panel
}

/**
 * Compute the display label for a node
 * Label shows title with (...) indicator if description exists
 * This is derived data - always computed on-the-fly, never stored
 */
export function getNodeLabel(data: NodeData): string {
  return data.title + (data.description.length > 0 ? '(...)' : '');
}

/**
 * Note: React Flow has its own Node type that we'll use,
 * which includes: id, position, data (our NodeData), type, etc.
 */

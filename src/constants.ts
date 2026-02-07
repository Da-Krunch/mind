/**
 * Application-wide constants
 * 
 * Centralizes magic numbers and strings to make them easier to maintain
 * and understand their purpose.
 */

// Node configuration
export const DEFAULT_NODE_TITLE = 'New Node';
export const DEFAULT_NODE_COLOR = '#8b5cf6';  // Purple
export const DEFAULT_NODE_DESCRIPTION = '';

// Node positioning
export const RANDOM_POSITION_RANGE = 400;  // Range for random x/y placement
export const RANDOM_POSITION_OFFSET = 100;  // Minimum offset from edge
export const DUPLICATE_NODE_OFFSET = 50;    // Offset when duplicating a node

// History configuration
export const HISTORY_MAX_STEPS = 16;  // Maximum undo/redo steps

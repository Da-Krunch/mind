import { Node, Edge } from 'reactflow';
import * as yaml from 'js-yaml';
import { NodeData, getNodeLabel } from '../types';

/**
 * Current file format version
 * Increment when making breaking changes to the format
 */
export const FILE_FORMAT_VERSION = 1;

/**
 * Structure of the saved file
 */
export interface MindFileFormat {
  version: number;
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: {
      title: string;
      color: string;
      description: string;
      label?: string;
    };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    type?: string;
  }>;
}

/**
 * FileOperations - Pure functions for saving and loading graph state
 * 
 * Uses the File System Access API when available for seamless file overwriting.
 * Falls back to download links for browsers that don't support it.
 */
export class FileOperations {
  /**
   * Check if File System Access API is available
   */
  static isFileSystemAccessSupported(): boolean {
    return 'showSaveFilePicker' in window && 'showOpenFilePicker' in window;
  }

  /**
   * Convert nodes and edges to YAML string
   */
  static serialize(nodes: Node<NodeData>[], edges: Edge[]): string {
    const fileData: MindFileFormat = {
      version: FILE_FORMAT_VERSION,
      nodes: nodes.map(node => {
        const data = node.data as NodeData;
        return {
          id: node.id,
          type: node.type || 'colored',
          position: node.position,
          data: {
            title: data.title,
            color: data.color,
            description: data.description,
            label: getNodeLabel(data),  // Compute label on-the-fly
          },
        };
      }),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
      })),
    };

    return yaml.dump(fileData, {
      indent: 2,
      lineWidth: 120,
      noRefs: true,
    });
  }

  /**
   * Parse YAML string into nodes and edges
   * Throws error if version is incompatible
   */
  static deserialize(yamlString: string): { nodes: Node<NodeData>[]; edges: Edge[] } {
    const fileData = yaml.load(yamlString) as MindFileFormat;

    // Version check
    if (!fileData.version) {
      throw new Error('File format version missing. This may be an old or corrupted file.');
    }
    
    if (fileData.version > FILE_FORMAT_VERSION) {
      throw new Error(
        `File format version ${fileData.version} is newer than supported version ${FILE_FORMAT_VERSION}. ` +
        'Please update the application.'
      );
    }

    // Convert to React Flow format (label is ignored from file, computed on-the-fly)
    const nodes: Node<NodeData>[] = fileData.nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: {
        title: node.data.title,
        color: node.data.color,
        description: node.data.description,
      },
    }));

    const edges: Edge[] = fileData.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
    }));

    return { nodes, edges };
  }

  /**
   * Save content to a file handle (File System Access API)
   * Returns the file handle for future saves
   */
  static async saveToFileHandle(
    content: string,
    fileHandle?: FileSystemFileHandle
  ): Promise<FileSystemFileHandle> {
    // Get existing handle or prompt for new one
    const handle: FileSystemFileHandle = fileHandle ?? await (window as any).showSaveFilePicker({
      suggestedName: 'mind-graph.yaml',
      types: [
        {
          description: 'YAML Files',
          accept: { 'text/yaml': ['.yaml', '.yml'] },
        },
      ],
    });

    // Write to the file
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();

    return handle;
  }

  /**
   * Load file using File System Access API
   * Returns content, filename, and file handle for future saves
   */
  static async loadFromFileHandle(): Promise<{
    content: string;
    filename: string;
    fileHandle: FileSystemFileHandle;
  }> {
    const [fileHandle] = await (window as any).showOpenFilePicker({
      types: [
        {
          description: 'YAML Files',
          accept: { 'text/yaml': ['.yaml', '.yml'] },
        },
      ],
      multiple: false,
    });

    const file = await fileHandle.getFile();
    const content = await file.text();

    return {
      content,
      filename: file.name,
      fileHandle,
    };
  }

  /**
   * Download YAML content as a file (fallback for unsupported browsers)
   */
  static download(content: string, filename: string = 'mind-graph.yaml'): void {
    const blob = new Blob([content], { type: 'text/yaml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Prompt user to select and load a file (fallback for unsupported browsers)
   * Returns a promise that resolves with the file content and filename
   */
  static async upload(): Promise<{ content: string; filename: string }> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.yaml,.yml';
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          reject(new Error('No file selected'));
          return;
        }

        try {
          const text = await file.text();
          resolve({ content: text, filename: file.name });
        } catch (error) {
          reject(error);
        }
      };

      input.oncancel = () => {
        reject(new Error('File selection cancelled'));
      };

      document.body.appendChild(input);
      input.click();
      document.body.removeChild(input);
    });
  }
}

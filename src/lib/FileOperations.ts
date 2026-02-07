import { DocumentModel, HierarchicalNode } from './DocumentModel';

/**
 * Current file format version
 */
export const FILE_FORMAT_VERSION = 1;

/**
 * Structure of the saved file (JSON format)
 */
export interface MindFileFormat {
  version: 1;
  nodes: HierarchicalNode[];
}

/**
 * FileOperations - Pure functions for saving and loading document state
 * 
 * Uses JSON format for simple, native serialization.
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
   * Serialize a DocumentModel to JSON string
   */
  static serialize(document: DocumentModel): string {
    const fileData: MindFileFormat = {
      version: FILE_FORMAT_VERSION,
      nodes: document.toJSON(),
    };

    return JSON.stringify(fileData, null, 2);
  }

  /**
   * Deserialize JSON string into a DocumentModel
   */
  static deserialize(jsonString: string): DocumentModel {
    const fileData = JSON.parse(jsonString) as MindFileFormat;

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

    return DocumentModel.fromJSON(fileData.nodes);
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
      suggestedName: 'mind-graph.json',
      types: [
        {
          description: 'Mind Graph Files',
          accept: { 'application/json': ['.json'] },
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
          description: 'Mind Graph Files',
          accept: { 'application/json': ['.json'] },
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
   * Download JSON content as a file (fallback for unsupported browsers)
   */
  static download(content: string, filename: string = 'mind-graph.json'): void {
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
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
      input.accept = '.json';
      
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

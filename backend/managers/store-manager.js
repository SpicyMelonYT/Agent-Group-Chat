import { Manager } from "../core/index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class StoreManager extends Manager {
  constructor() {
    super();
    this.basePath = path.join(__dirname, '../../data'); // Store data in agent-group-chat/data
    this.fileWatchers = new Map(); // Map<filePath, watcherId>
  }

  async init() {
    // Ensure the data directory exists
    await this.ensureDirectoryExists(this.basePath);
    console.log('StoreManager initialized with base path:', this.basePath);
  }

  /**
   * Ensure a directory exists, creating it if necessary
   * @param {string} dirPath
   */
  async ensureDirectoryExists(dirPath) {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Resolve a file path relative to the base directory
   * @param {string} filePath
   * @returns {string}
   */
  resolvePath(filePath) {
    // Prevent directory traversal attacks
    const resolved = path.resolve(this.basePath, filePath);
    if (!resolved.startsWith(this.basePath)) {
      throw new Error('Access denied: Path outside of allowed directory');
    }
    return resolved;
  }

  // ===== TEXT FILE OPERATIONS =====

  /**
   * Read a text file
   * @param {string} filePath - Relative path to the file
   * @param {string} encoding - Text encoding (default: 'utf8')
   * @returns {Promise<string>}
   */
  async readText(filePath, encoding = 'utf8') {
    try {
      const fullPath = this.resolvePath(filePath);
      return await fs.promises.readFile(fullPath, encoding);
    } catch (error) {
      throw new Error(`Failed to read text file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Write a text file
   * @param {string} filePath - Relative path to the file
   * @param {string} content - Text content to write
   * @param {string} encoding - Text encoding (default: 'utf8')
   */
  async writeText(filePath, content, encoding = 'utf8') {
    try {
      const fullPath = this.resolvePath(filePath);
      await this.ensureDirectoryExists(path.dirname(fullPath));
      await fs.promises.writeFile(fullPath, content, encoding);
    } catch (error) {
      throw new Error(`Failed to write text file ${filePath}: ${error.message}`);
    }
  }

  // ===== JSON FILE OPERATIONS =====

  /**
   * Read and parse a JSON file
   * @param {string} filePath - Relative path to the JSON file
   * @returns {Promise<any>}
   */
  async readJSON(filePath) {
    const content = await this.readText(filePath);
    try {
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to parse JSON file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Write an object as JSON to a file
   * @param {string} filePath - Relative path to the JSON file
   * @param {any} data - Data to serialize as JSON
   * @param {number} indent - JSON indentation (default: 2)
   */
  async writeJSON(filePath, data, indent = 2) {
    const content = JSON.stringify(data, null, indent);
    await this.writeText(filePath, content);

    // Notify any watchers of this file change
    await this.notifyFileWatchers('update', filePath, data);
  }


  // ===== FILE SYSTEM OPERATIONS =====

  /**
   * Move/rename a file or directory
   * @param {string} fromPath - Source path
   * @param {string} toPath - Destination path
   */
  async move(fromPath, toPath) {
    try {
      const fullFromPath = this.resolvePath(fromPath);
      const fullToPath = this.resolvePath(toPath);
      await this.ensureDirectoryExists(path.dirname(fullToPath));
      await fs.promises.rename(fullFromPath, fullToPath);
    } catch (error) {
      throw new Error(`Failed to move ${fromPath} to ${toPath}: ${error.message}`);
    }
  }

  /**
   * Copy a file
   * @param {string} fromPath - Source path
   * @param {string} toPath - Destination path
   */
  async copy(fromPath, toPath) {
    try {
      const fullFromPath = this.resolvePath(fromPath);
      const fullToPath = this.resolvePath(toPath);
      await this.ensureDirectoryExists(path.dirname(fullToPath));
      await fs.promises.copyFile(fullFromPath, fullToPath);
    } catch (error) {
      throw new Error(`Failed to copy ${fromPath} to ${toPath}: ${error.message}`);
    }
  }

  /**
   * Delete a file or directory
   * @param {string} filePath - Path to delete
   */
  async delete(filePath) {
    try {
      const fullPath = this.resolvePath(filePath);
      const stat = await fs.promises.stat(fullPath);

      if (stat.isDirectory()) {
        await fs.promises.rmdir(fullPath, { recursive: true });
      } else {
        await fs.promises.unlink(fullPath);
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw new Error(`Failed to delete ${filePath}: ${error.message}`);
      }
    }
  }

  /**
   * List contents of a directory
   * @param {string} dirPath - Directory path to list
   * @returns {Promise<Array<{name: string, type: 'file'|'directory', size?: number}>>}
   */
  async list(dirPath = '') {
    try {
      const fullPath = this.resolvePath(dirPath);
      const entries = await fs.promises.readdir(fullPath, { withFileTypes: true });

      const results = [];
      for (const entry of entries) {
        const entryPath = path.join(fullPath, entry.name);
        let size;

        try {
          if (entry.isFile()) {
            const stat = await fs.promises.stat(entryPath);
            size = stat.size;
          }
        } catch (error) {
          // Ignore stat errors for individual files
        }

        results.push({
          name: entry.name,
          type: entry.isDirectory() ? 'directory' : 'file',
          size
        });
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to list directory ${dirPath}: ${error.message}`);
    }
  }

  /**
   * Check if a file or directory exists
   * @param {string} filePath - Path to check
   * @returns {Promise<boolean>}
   */
  async exists(filePath) {
    try {
      const fullPath = this.resolvePath(filePath);
      await fs.promises.access(fullPath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file or directory statistics
   * @param {string} filePath - Path to get stats for
   * @returns {Promise<{size: number, created: Date, modified: Date, type: 'file'|'directory'}>}
   */
  async stats(filePath) {
    try {
      const fullPath = this.resolvePath(filePath);
      const stat = await fs.promises.stat(fullPath);

      return {
        size: stat.size,
        created: stat.birthtime,
        modified: stat.mtime,
        type: stat.isDirectory() ? 'directory' : 'file'
      };
    } catch (error) {
      throw new Error(`Failed to get stats for ${filePath}: ${error.message}`);
    }
  }

  /**
   * Define preload API configuration for the store manager
   */
  initPreload() {
    return {
      name: 'StoreManager',
      api: {
        // Text file operations
        readText: { channel: 'StoreManager:readText' },
        writeText: { channel: 'StoreManager:writeText' },

        // JSON file operations
        readJSON: { channel: 'StoreManager:readJSON' },
        writeJSON: { channel: 'StoreManager:writeJSON' },


        // File system operations
        move: { channel: 'StoreManager:move' },
        copy: { channel: 'StoreManager:copy' },
        delete: { channel: 'StoreManager:delete' },
        list: { channel: 'StoreManager:list' },
        exists: { channel: 'StoreManager:exists' },
        stats: { channel: 'StoreManager:stats' },

        // File watching system
        watchFile: { channel: 'StoreManager:watchFile' },
        unwatchFile: { channel: 'StoreManager:unwatchFile' },

        // Archive system
        createArchive: { channel: 'StoreManager:createArchive' },
        deleteArchive: { channel: 'StoreManager:deleteArchive' },
        listArchives: { channel: 'StoreManager:listArchives' },
        archiveExists: { channel: 'StoreManager:archiveExists' },

        // Entry system
        createEntry: { channel: 'StoreManager:createEntry' },
        deleteEntry: { channel: 'StoreManager:deleteEntry' },
        listEntries: { channel: 'StoreManager:listEntries' },
        entryExists: { channel: 'StoreManager:entryExists' },

        // Entry data operations
        storeEntryData: { channel: 'StoreManager:storeEntryData' },
        storeEntryJSON: { channel: 'StoreManager:storeEntryJSON' },
        getEntryData: { channel: 'StoreManager:getEntryData' },
        getEntryJSON: { channel: 'StoreManager:getEntryJSON' },
        listEntryData: { channel: 'StoreManager:listEntryData' },
        deleteEntryData: { channel: 'StoreManager:deleteEntryData' }
      }
    };
  }

  /**
   * Register a file watcher from the frontend
   * @param {string} filePath - File path to watch
   * @param {string} watcherId - Unique ID for this watcher
   */
  async watchFile(filePath, watcherId) {
    this.fileWatchers.set(filePath, watcherId);
  }

  /**
   * Unregister a file watcher
   * @param {string} filePath - File path to stop watching
   */
  async unwatchFile(filePath) {
    this.fileWatchers.delete(filePath);
  }

  /**
   * Notify frontend watchers about file changes (async watchers run in parallel)
   * @param {string} action - Action performed (create, update, delete, move)
   * @param {string} filePath - File path that changed
   * @param {any} data - Additional data
   */
  async notifyFileWatchers(action, filePath, data = null) {
    if (!this.fileWatchers.has(filePath)) {
      return; // No watchers for this file
    }

    const watcherId = this.fileWatchers.get(filePath);

    if (this.app && this.app.mainWindow) {
      try {
        // Send notification to frontend watcher (fire-and-forget, but watcher can be async)
        this.app.mainWindow.webContents.send('storeWatcher:' + watcherId, {
          action,
          filePath,
          data,
          timestamp: new Date()
        });
      } catch (error) {
        console.error(`Error notifying file watcher for ${filePath}:`, error);
      }
    }
  }

  // ===== ARCHIVE SYSTEM =====

  /**
   * Create a new archive (collection folder)
   * @param {string} archiveName - Name of the archive
   */
  async createArchive(archiveName) {
    try {
      const archivePath = `archives/${archiveName}`;
      await this.ensureDirectoryExists(this.resolvePath(archivePath));
    } catch (error) {
      throw new Error(`Failed to create archive ${archiveName}: ${error.message}`);
    }
  }

  /**
   * Delete an entire archive and all its entries
   * @param {string} archiveName - Name of the archive to delete
   */
  async deleteArchive(archiveName) {
    try {
      const archivePath = `archives/${archiveName}`;
      await this.delete(archivePath);
    } catch (error) {
      throw new Error(`Failed to delete archive ${archiveName}: ${error.message}`);
    }
  }

  /**
   * List all archives
   * @returns {Promise<Array<{name: string, type: 'directory'}>>}
   */
  async listArchives() {
    try {
      return await this.list('archives');
    } catch (error) {
      throw new Error(`Failed to list archives: ${error.message}`);
    }
  }

  /**
   * Check if an archive exists
   * @param {string} archiveName - Name of the archive
   * @returns {Promise<boolean>}
   */
  async archiveExists(archiveName) {
    try {
      return await this.exists(`archives/${archiveName}`);
    } catch (error) {
      return false;
    }
  }

  // ===== ENTRY SYSTEM =====

  /**
   * Create a new entry in an archive with auto-generated UUID
   * @param {string} archiveName - Name of the archive
   * @returns {Promise<string>} The UUID of the created entry
   */
  async createEntry(archiveName) {
    try {
      const entryId = randomUUID();
      const entryPath = `archives/${archiveName}/${entryId}`;
      await this.ensureDirectoryExists(this.resolvePath(entryPath));
      return entryId;
    } catch (error) {
      throw new Error(`Failed to create entry in archive ${archiveName}: ${error.message}`);
    }
  }

  /**
   * Delete an entry from an archive
   * @param {string} archiveName - Name of the archive
   * @param {string} entryId - UUID of the entry to delete
   */
  async deleteEntry(archiveName, entryId) {
    try {
      const entryPath = `archives/${archiveName}/${entryId}`;
      await this.delete(entryPath);
    } catch (error) {
      throw new Error(`Failed to delete entry ${entryId} from archive ${archiveName}: ${error.message}`);
    }
  }

  /**
   * List all entries in an archive
   * @param {string} archiveName - Name of the archive
   * @returns {Promise<Array<{id: string, path: string, type: 'directory'}>>}
   */
  async listEntries(archiveName) {
    try {
      const entries = await this.list(`archives/${archiveName}`);
      return entries.map(entry => ({
        id: entry.name,
        path: `archives/${archiveName}/${entry.name}`,
        type: entry.type
      }));
    } catch (error) {
      throw new Error(`Failed to list entries in archive ${archiveName}: ${error.message}`);
    }
  }

  /**
   * Check if an entry exists in an archive
   * @param {string} archiveName - Name of the archive
   * @param {string} entryId - UUID of the entry
   * @returns {Promise<boolean>}
   */
  async entryExists(archiveName, entryId) {
    try {
      return await this.exists(`archives/${archiveName}/${entryId}`);
    } catch (error) {
      return false;
    }
  }

  // ===== ENTRY DATA OPERATIONS =====

  /**
   * Store data in an entry (creates necessary directories)
   * @param {string} archiveName - Name of the archive
   * @param {string} entryId - UUID of the entry
   * @param {string} dataPath - Relative path within the entry (e.g., 'profile.json')
   * @param {string} content - Text content to store
   */
  async storeEntryData(archiveName, entryId, dataPath, content) {
    try {
      const fullPath = `archives/${archiveName}/${entryId}/${dataPath}`;
      await this.writeText(fullPath, content);
    } catch (error) {
      throw new Error(`Failed to store data in entry ${entryId}: ${error.message}`);
    }
  }

  /**
   * Store JSON data in an entry
   * @param {string} archiveName - Name of the archive
   * @param {string} entryId - UUID of the entry
   * @param {string} dataPath - Relative path within the entry (e.g., 'profile.json')
   * @param {any} data - Data to serialize as JSON
   */
  async storeEntryJSON(archiveName, entryId, dataPath, data) {
    try {
      const fullPath = `archives/${archiveName}/${entryId}/${dataPath}`;
      await this.writeJSON(fullPath, data);
    } catch (error) {
      throw new Error(`Failed to store JSON data in entry ${entryId}: ${error.message}`);
    }
  }

  /**
   * Retrieve data from an entry
   * @param {string} archiveName - Name of the archive
   * @param {string} entryId - UUID of the entry
   * @param {string} dataPath - Relative path within the entry
   * @returns {Promise<string>}
   */
  async getEntryData(archiveName, entryId, dataPath) {
    try {
      const fullPath = `archives/${archiveName}/${entryId}/${dataPath}`;
      return await this.readText(fullPath);
    } catch (error) {
      throw new Error(`Failed to get data from entry ${entryId}: ${error.message}`);
    }
  }

  /**
   * Retrieve JSON data from an entry
   * @param {string} archiveName - Name of the archive
   * @param {string} entryId - UUID of the entry
   * @param {string} dataPath - Relative path within the entry
   * @returns {Promise<any>}
   */
  async getEntryJSON(archiveName, entryId, dataPath) {
    try {
      const fullPath = `archives/${archiveName}/${entryId}/${dataPath}`;
      return await this.readJSON(fullPath);
    } catch (error) {
      throw new Error(`Failed to get JSON data from entry ${entryId}: ${error.message}`);
    }
  }

  /**
   * List all data files in an entry
   * @param {string} archiveName - Name of the archive
   * @param {string} entryId - UUID of the entry
   * @param {string} subPath - Optional subpath within the entry (default: root)
   * @returns {Promise<Array<{name: string, type: 'file'|'directory', size?: number}>>}
   */
  async listEntryData(archiveName, entryId, subPath = '') {
    try {
      const entryPath = `archives/${archiveName}/${entryId}`;
      const fullPath = subPath ? `${entryPath}/${subPath}` : entryPath;
      return await this.list(fullPath);
    } catch (error) {
      throw new Error(`Failed to list data in entry ${entryId}: ${error.message}`);
    }
  }

  /**
   * Delete data from an entry
   * @param {string} archiveName - Name of the archive
   * @param {string} entryId - UUID of the entry
   * @param {string} dataPath - Relative path within the entry to delete
   */
  async deleteEntryData(archiveName, entryId, dataPath) {
    try {
      const fullPath = `archives/${archiveName}/${entryId}/${dataPath}`;
      await this.delete(fullPath);
    } catch (error) {
      throw new Error(`Failed to delete data from entry ${entryId}: ${error.message}`);
    }
  }
}

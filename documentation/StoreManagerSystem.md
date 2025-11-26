# Store Manager System Documentation

## Overview
The StoreManager is a comprehensive data persistence and state management system that provides secure file system operations, data organization structures, and real-time file watching capabilities. It serves as the primary interface for all data storage and retrieval operations in the Electron application, ensuring secure access to the user's data directory while providing both simple file operations and complex data management features.

## Key Terms and Concepts

### Data Persistence
- **UserData Directory**: Electron's secure application data storage location
- **Path Resolution**: Safe path handling to prevent directory traversal attacks
- **File Operations**: Basic CRUD operations for text and JSON files
- **Directory Management**: Creating, listing, and managing directory structures

### Data Organization
- **Archives**: Top-level data collections (equivalent to databases)
- **Entries**: Individual data records within archives (equivalent to database records)
- **Entry Data**: Files and data stored within entries
- **UUID-based**: Entries use cryptographically secure UUIDs for uniqueness

### File Watching
- **Real-time Monitoring**: Automatic detection of file system changes
- **IPC Notifications**: Frontend receives change notifications
- **Async Callbacks**: Support for asynchronous change handlers
- **Resource Management**: Proper cleanup of watchers

## Architecture Overview

### Storage Location
```
UserData/App/
├── archives/           # Data archives (collections)
│   ├── archive1/       # Individual archive
│   │   ├── entry1/     # Data entry (UUID)
│   │   │   ├── data.json
│   │   │   └── metadata.json
│   │   └── entry2/
│   └── archive2/
├── config.json         # Application configuration
├── window-config.json  # Window state persistence
└── [other-files]       # Additional application data
```

### Security Model

#### Path Security
```javascript
resolvePath(filePath) {
  const resolved = path.resolve(this.basePath, filePath);
  if (!resolved.startsWith(this.basePath)) {
    throw new Error('Access denied: Path outside of allowed directory');
  }
  return resolved;
}
```

#### Directory Containment
- **Sandboxed Storage**: All operations confined to `UserData/App/` directory
- **Path Validation**: Prevents access to parent directories or other applications' data
- **Input Sanitization**: File paths are normalized and validated

## Core File Operations

### Text File Operations

#### Reading Text Files
```javascript
// Backend method
async readText(filePath, encoding = 'utf8') {
  const fullPath = this.resolvePath(filePath);
  return await fs.promises.readFile(fullPath, encoding);
}

// Frontend usage
const content = await window.storeAPI.readText('config.txt');
```

#### Writing Text Files
```javascript
// Backend method
async writeText(filePath, content, encoding = 'utf8') {
  const fullPath = this.resolvePath(filePath);
  await this.ensureDirectoryExists(path.dirname(fullPath));
  await fs.promises.writeFile(fullPath, content, encoding);
}

// Frontend usage
await window.storeAPI.writeText('log.txt', 'Application started');
```

### JSON File Operations

#### Reading JSON Files
```javascript
// Backend method
async readJSON(filePath) {
  const content = await this.readText(filePath);
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to parse JSON file ${filePath}: ${error.message}`);
  }
}

// Frontend usage
const config = await window.storeAPI.readJSON('config.json');
```

#### Writing JSON Files
```javascript
// Backend method
async writeJSON(filePath, data, indent = 2) {
  const content = JSON.stringify(data, null, indent);
  await this.writeText(filePath, content);

  // Notify watchers of the change
  await this.notifyFileWatchers('update', filePath, data);
}

// Frontend usage
await window.storeAPI.writeJSON('settings.json', {
  theme: 'dark',
  language: 'en'
});
```

## File System Operations

### Directory and File Management

#### Listing Directory Contents
```javascript
async list(dirPath = '') {
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
      // Ignore stat errors
    }

    results.push({
      name: entry.name,
      type: entry.isDirectory() ? 'directory' : 'file',
      size
    });
  }

  return results;
}

// Frontend usage
const files = await window.storeAPI.list('documents');
```

#### File/Directory Existence Checks
```javascript
async exists(filePath) {
  try {
    const fullPath = this.resolvePath(filePath);
    await fs.promises.access(fullPath);
    return true;
  } catch (error) {
    return false;
  }
}

// Frontend usage
const configExists = await window.storeAPI.exists('config.json');
```

#### File Statistics
```javascript
async stats(filePath) {
  const fullPath = this.resolvePath(filePath);
  const stat = await fs.promises.stat(fullPath);

  return {
    size: stat.size,
    created: stat.birthtime,
    modified: stat.mtime,
    type: stat.isDirectory() ? 'directory' : 'file'
  };
}

// Frontend usage
const fileInfo = await window.storeAPI.stats('large-file.dat');
```

#### File Operations (Move, Copy, Delete)
```javascript
// Move/rename files
await window.storeAPI.move('old-name.txt', 'new-name.txt');

// Copy files
await window.storeAPI.copy('source.txt', 'backup.txt');

// Delete files/directories
await window.storeAPI.delete('temp-file.txt');
```

## Archive System

### Archive Management
Archives provide a high-level organizational structure for data, similar to database tables or collections.

#### Creating Archives
```javascript
async createArchive(archiveName) {
  const archivePath = `archives/${archiveName}`;
  await this.ensureDirectoryExists(this.resolvePath(archivePath));
}

// Frontend usage
await window.storeAPI.createArchive('users');
await window.storeAPI.createArchive('projects');
```

#### Archive Operations
```javascript
// List all archives
const archives = await window.storeAPI.listArchives();

// Check if archive exists
const exists = await window.storeAPI.archiveExists('users');

// Delete archive (removes all entries)
await window.storeAPI.deleteArchive('old-data');
```

## Entry System

### Entry Management
Entries are individual data records within archives, identified by UUIDs for uniqueness and collision resistance.

#### Creating Entries
```javascript
async createEntry(archiveName) {
  const entryId = randomUUID();  // Cryptographically secure UUID
  const entryPath = `archives/${archiveName}/${entryId}`;
  await this.ensureDirectoryExists(this.resolvePath(entryPath));
  return entryId;
}

// Frontend usage
const userId = await window.storeAPI.createEntry('users');
console.log('Created user with ID:', userId);
// Output: Created user with ID: 550e8400-e29b-41d4-a716-446655440000
```

#### Entry Operations
```javascript
// List entries in an archive
const entries = await window.storeAPI.listEntries('users');

// Check if entry exists
const exists = await window.storeAPI.entryExists('users', userId);

// Delete entry
await window.storeAPI.deleteEntry('users', userId);
```

### Entry Data Operations

#### Storing Data in Entries
```javascript
// Store text data
await window.storeAPI.storeEntryData('users', userId, 'bio.txt', 'Software developer...');

// Store JSON data
await window.storeAPI.storeEntryJSON('users', userId, 'profile.json', {
  name: 'John Doe',
  email: 'john@example.com',
  role: 'developer'
});

// Store additional files
await window.storeAPI.storeEntryJSON('users', userId, 'preferences.json', {
  theme: 'dark',
  notifications: true
});
```

#### Retrieving Entry Data
```javascript
// Get text data
const bio = await window.storeAPI.getEntryData('users', userId, 'bio.txt');

// Get JSON data
const profile = await window.storeAPI.getEntryJSON('users', userId, 'profile.json');
const preferences = await window.storeAPI.getEntryJSON('users', userId, 'preferences.json');
```

#### Managing Entry Contents
```javascript
// List all data files in an entry
const files = await window.storeAPI.listEntryData('users', userId);

// List files in a subdirectory
const images = await window.storeAPI.listEntryData('users', userId, 'photos');

// Delete specific data
await window.storeAPI.deleteEntryData('users', userId, 'old-file.json');
```

## File Watching System

### Real-time File Monitoring

#### Backend File Watching
```javascript
// Track active watchers
this.fileWatchers = new Map(); // Map<filePath, watcherId>

// Register a watcher
async watchFile(filePath, watcherId) {
  this.fileWatchers.set(filePath, watcherId);
}

// Unregister a watcher
async unwatchFile(filePath) {
  this.fileWatchers.delete(filePath);
}

// Notify frontend watchers
async notifyFileWatchers(action, filePath, data = null) {
  if (!this.fileWatchers.has(filePath)) return;

  const watcherId = this.fileWatchers.get(filePath);
  if (this.app && this.app.mainWindow) {
    this.app.mainWindow.webContents.send('storeWatcher:' + watcherId, {
      action,      // 'create', 'update', 'delete', 'move'
      filePath,    // Relative path that changed
      data,        // New data (for updates)
      timestamp: new Date()
    });
  }
}
```

#### Frontend File Watching
```javascript
// Watch a file for changes
const unwatch = await window.storeAPI.watchFile('config.json', async (changeData) => {
  console.log('Config changed:', changeData.action);
  // Handle the change
  if (changeData.action === 'update') {
    // Reload configuration
    const newConfig = await window.storeAPI.readJSON('config.json');
    updateUIWithConfig(newConfig);
  }
});

// Later, stop watching
unwatch();
```

### Watcher Implementation Details

#### IPC Channel Pattern
- **Registration**: `StoreManager:watchFile` / `StoreManager:unwatchFile`
- **Notifications**: `storeWatcher:${watcherId}` (dynamic channels)
- **Cleanup**: Automatic cleanup on section changes

#### Async Callback Support
```javascript
// Preload script enhancement for file watching
if (managerConfig.api.watchFile && managerConfig.api.unwatchFile) {
  managerAPIs.watchFile = async (filePath, asyncCallback) => {
    const watcherId = `watcher_${Date.now()}_${watcherCounter}`;

    // Register with backend
    await managerAPIs.watchFile(filePath, watcherId);

    // Set up IPC listener
    const listener = async (event, changeData) => {
      try {
        await asyncCallback(changeData);
      } catch (error) {
        console.error('Error in file watcher callback:', error);
      }
    };

    ipcRenderer.on(`storeWatcher:${watcherId}`, listener);
    activeWatchers.set(watcherId, { filePath, listener });

    // Return cleanup function
    return () => {
      ipcRenderer.removeListener(`storeWatcher:${watcherId}`, listener);
      activeWatchers.delete(watcherId);
      managerAPIs.unwatchFile(filePath).catch(console.error);
    };
  };
}
```

## Data Organization Patterns

### User Data Management
```javascript
// Create user archive
await window.storeAPI.createArchive('users');

// Create a new user
const userId = await window.storeAPI.createEntry('users');

// Store user profile
await window.storeAPI.storeEntryJSON('users', userId, 'profile.json', {
  name: 'John Doe',
  email: 'john@example.com',
  created: new Date().toISOString()
});

// Store user preferences
await window.storeAPI.storeEntryJSON('users', userId, 'preferences.json', {
  theme: 'dark',
  language: 'en',
  notifications: true
});

// Store user avatar (as data URL or reference)
await window.storeAPI.storeEntryData('users', userId, 'avatar.txt', avatarDataURL);
```

### Project/Document Management
```javascript
// Create projects archive
await window.storeAPI.createArchive('projects');

// Create a new project
const projectId = await window.storeAPI.createEntry('projects');

// Store project metadata
await window.storeAPI.storeEntryJSON('projects', projectId, 'metadata.json', {
  name: 'My Project',
  description: 'A sample project',
  created: new Date().toISOString(),
  tags: ['sample', 'demo']
});

// Store project files
await window.storeAPI.storeEntryData('projects', projectId, 'document.md', markdownContent);
await window.storeAPI.storeEntryJSON('projects', projectId, 'config.json', projectConfig);

// Store project assets in subdirectories
await window.storeAPI.storeEntryData('projects', projectId, 'assets/logo.png', logoData);
await window.storeAPI.storeEntryData('projects', projectId, 'assets/styles.css', cssContent);
```

### Configuration Management
```javascript
// Application configuration
await window.storeAPI.writeJSON('app-config.json', {
  version: '1.0.0',
  theme: 'system',
  autoSave: true,
  maxRecentFiles: 10
});

// User-specific settings
await window.storeAPI.writeJSON('user-settings.json', {
  name: 'John Doe',
  email: 'john@example.com',
  preferences: {
    startup: 'welcome',
    backups: true,
    analytics: false
  }
});
```

## Performance Considerations

### Batching Operations
```javascript
// Instead of multiple individual calls
await window.storeAPI.storeEntryJSON('users', userId, 'profile.json', profile);
await window.storeAPI.storeEntryJSON('users', userId, 'settings.json', settings);
await window.storeAPI.storeEntryJSON('users', userId, 'permissions.json', permissions);

// Consider batch operations for related data
const userData = { profile, settings, permissions };
await window.storeAPI.storeEntryJSON('users', userId, 'user-data.json', userData);
```

### Caching Strategies
```javascript
class DataCache {
  constructor() {
    this.cache = new Map();
    this.maxAge = 5 * 60 * 1000; // 5 minutes
  }

  async get(key) {
    if (this.cache.has(key)) {
      const { data, timestamp } = this.cache.get(key);
      if (Date.now() - timestamp < this.maxAge) {
        return data;
      }
      this.cache.delete(key);
    }

    const data = await window.storeAPI.readJSON(key);
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  invalidate(key) {
    this.cache.delete(key);
  }
}
```

### File Watching Optimization
```javascript
// Watch frequently accessed files
const configWatcher = await window.storeAPI.watchFile('config.json', (change) => {
  if (change.action === 'update') {
    // Invalidate related caches
    configCache.invalidate('config.json');
    // Reload UI state
    loadApplicationConfig();
  }
});

// Clean up watchers when not needed
// (automatic cleanup on section changes)
```

## Error Handling

### File Operation Errors
```javascript
try {
  const data = await window.storeAPI.readJSON('config.json');
  // Process data
} catch (error) {
  console.error('Failed to load configuration:', error.message);
  // Use default configuration
  const data = getDefaultConfig();
}
```

### Path Security Errors
```javascript
try {
  // This will throw an error due to path traversal attempt
  await window.storeAPI.readText('../../../etc/passwd');
} catch (error) {
  console.error('Access denied:', error.message);
  // Error: Access denied: Path outside of allowed directory
}
```

### Watcher Errors
```javascript
const unwatch = await window.storeAPI.watchFile('data.json', async (change) => {
  try {
    await handleDataChange(change);
  } catch (error) {
    console.error('Error handling file change:', error);
    // Continue watching despite errors
  }
});
```

## Migration and Data Integrity

### Data Backup
```javascript
async function backupArchive(archiveName) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `${archiveName}-backup-${timestamp}`;

  // Create backup archive
  await window.storeAPI.createArchive(backupName);

  // Copy all entries
  const entries = await window.storeAPI.listEntries(archiveName);
  for (const entry of entries) {
    const entryId = await window.storeAPI.createEntry(backupName);

    // Copy all data files
    const dataFiles = await window.storeAPI.listEntryData(archiveName, entry.id);
    for (const file of dataFiles) {
      if (file.type === 'file') {
        const content = await window.storeAPI.getEntryData(archiveName, entry.id, file.name);
        await window.storeAPI.storeEntryData(backupName, entryId, file.name, content);
      }
    }
  }

  return backupName;
}
```

### Data Validation
```javascript
async function validateEntry(archiveName, entryId) {
  try {
    // Check if entry exists
    const exists = await window.storeAPI.entryExists(archiveName, entryId);
    if (!exists) return { valid: false, reason: 'Entry does not exist' };

    // Validate required files
    const requiredFiles = ['profile.json', 'metadata.json'];
    for (const file of requiredFiles) {
      const exists = await window.storeAPI.exists(`${archiveName}/${entryId}/${file}`);
      if (!exists) {
        return { valid: false, reason: `Missing required file: ${file}` };
      }
    }

    // Validate JSON structure
    const profile = await window.storeAPI.getEntryJSON(archiveName, entryId, 'profile.json');
    if (!profile.name || !profile.email) {
      return { valid: false, reason: 'Invalid profile structure' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, reason: error.message };
  }
}
```

## Best Practices

### Data Organization
- **Use Archives**: Group related data into archives
- **UUID Entries**: Use auto-generated UUIDs for data records
- **Structured Storage**: Store related data together in entries
- **Naming Conventions**: Use consistent file naming patterns

### Performance
- **Batch Operations**: Group related file operations
- **Caching**: Cache frequently accessed data
- **Lazy Loading**: Load data only when needed
- **Watcher Cleanup**: Remove unused file watchers

### Error Handling
- **Graceful Degradation**: Handle file operation failures
- **User Feedback**: Provide clear error messages
- **Data Recovery**: Implement backup and restore mechanisms
- **Validation**: Validate data before storage

### Security
- **Path Validation**: Never trust user-provided paths
- **Access Control**: Implement application-level permissions
- **Input Sanitization**: Validate and sanitize all inputs
- **Error Information**: Don't expose sensitive path information

## Integration Examples

### Settings Management
```javascript
class SettingsManager {
  constructor() {
    this.settings = null;
    this.watcherCleanup = null;
  }

  async load() {
    try {
      this.settings = await window.storeAPI.readJSON('settings.json');
    } catch (error) {
      // Use defaults
      this.settings = getDefaultSettings();
      await this.save();
    }

    // Watch for changes
    this.watcherCleanup = await window.storeAPI.watchFile('settings.json', (change) => {
      if (change.action === 'update') {
        this.load(); // Reload settings
      }
    });
  }

  async save() {
    await window.storeAPI.writeJSON('settings.json', this.settings);
  }

  get(key) {
    return this.settings[key];
  }

  set(key, value) {
    this.settings[key] = value;
    this.save();
  }

  destroy() {
    if (this.watcherCleanup) {
      this.watcherCleanup();
    }
  }
}
```

### User Data Management
```javascript
class UserManager {
  constructor() {
    this.currentUser = null;
    this.users = new Map();
  }

  async createUser(userData) {
    const userId = await window.storeAPI.createEntry('users');
    await window.storeAPI.storeEntryJSON('users', userId, 'profile.json', {
      ...userData,
      id: userId,
      created: new Date().toISOString()
    });
    return userId;
  }

  async loadUser(userId) {
    if (this.users.has(userId)) {
      return this.users.get(userId);
    }

    const profile = await window.storeAPI.getEntryJSON('users', userId, 'profile.json');
    this.users.set(userId, profile);
    return profile;
  }

  async updateUser(userId, updates) {
    const user = await this.loadUser(userId);
    const updatedUser = { ...user, ...updates };
    await window.storeAPI.storeEntryJSON('users', userId, 'profile.json', updatedUser);
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async deleteUser(userId) {
    await window.storeAPI.deleteEntry('users', userId);
    this.users.delete(userId);
  }

  async listUsers() {
    const entries = await window.storeAPI.listEntries('users');
    const users = [];
    for (const entry of entries) {
      users.push(await this.loadUser(entry.id));
    }
    return users;
  }
}
```

This comprehensive StoreManager system provides robust data persistence, organization, and real-time synchronization capabilities essential for modern desktop applications.

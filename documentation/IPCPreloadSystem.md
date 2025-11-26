# IPC Preload System Documentation

## Overview
The IPC (Inter-Process Communication) preload system provides secure, type-safe communication between Electron's main process (backend) and renderer processes (frontend). It uses Electron's `contextBridge` and `ipcRenderer`/`ipcMain` APIs to expose backend functionality to frontend code while maintaining security boundaries and preventing code injection attacks.

## Key Terms and Concepts

### IPC (Inter-Process Communication)
- **Main Process**: Node.js environment running backend managers
- **Renderer Process**: Browser-like environment running frontend code
- **IPC Channels**: Named communication channels for message passing
- **Context Bridge**: Secure API exposure mechanism

### Preload Scripts
- **Preload Script**: Code that runs before web content loads in renderer
- **Context Isolation**: Security feature preventing direct process access
- **API Exposure**: Controlled exposure of backend functionality
- **Security Boundary**: Prevents renderer access to Node.js APIs

### IPC Patterns
- **Invoke/Handle**: Asynchronous request-response communication
- **Send/On**: One-way event-based communication
- **Sync**: Synchronous communication (limited use)

## Architecture Overview

### Security Model

#### Context Isolation
- **Enabled by Default**: `webPreferences: { contextIsolation: true }`
- **Security Boundary**: Prevents `window` object pollution
- **API Scoping**: Only explicitly exposed APIs available
- **Node Integration**: Disabled (`nodeIntegration: false`)

#### Attack Prevention
- **Code Injection**: Context isolation prevents script injection
- **Prototype Pollution**: Isolated global scope
- **Direct Access**: No direct Node.js API access from renderer
- **Path Traversal**: Backend validates all file operations

### IPC Flow Architecture

#### 1. API Definition (Backend)
Managers define their IPC interfaces through `initPreload()` methods:

```javascript
// backend/managers/store-manager.js
initPreload() {
  return {
    name: 'StoreManager',
    api: {
      readText: { channel: 'StoreManager:readText' },
      writeText: { channel: 'StoreManager:writeText' },
      readJSON: { channel: 'StoreManager:readJSON' },
      // ... more methods
    }
  };
}
```

#### 2. API Collection (Main Process)
```javascript
// backend/main.js
function registerIpcHandlers() {
  mainApp.collectPreloadAPIs();

  for (const managerAPI of mainApp.preloadAPIs) {
    for (const [methodName, config] of Object.entries(managerAPI.api)) {
      ipcMain.handle(config.channel, async (event, ...args) => {
        const manager = mainApp.managers.find(m => m.constructor.name === managerAPI.name);
        if (manager && typeof manager[methodName] === 'function') {
          return await manager[methodName](...args);
        }
        throw new Error(`Method ${methodName} not found on manager ${managerAPI.name}`);
      });
    }
  }
}
```

#### 3. API Exposure (Preload Script)
```javascript
// backend/preload.cjs
const managerAPIConfigs = ipcRenderer.sendSync('get-manager-api-configs');

for (const managerConfig of managerAPIConfigs) {
  const managerAPIs = {};
  for (const [apiName, config] of Object.entries(managerConfig.api)) {
    if (config.channel) {
      managerAPIs[apiName] = async (...args) => {
        return await ipcRenderer.invoke(config.channel, ...args);
      };
    }
  }

  const apiName = managerConfig.name.toLowerCase().replace('manager', '') + 'API';
  contextBridge.exposeInMainWorld(apiName, managerAPIs);
}
```

#### 4. API Usage (Renderer Process)
```javascript
// frontend code
const data = await window.storeAPI.readJSON('config.json');
const sections = await window.sectionAPI.listSections();
```

## IPC Communication Patterns

### Synchronous IPC

#### Main Process Handler
```javascript
// Synchronous handler for immediate responses
ipcMain.on('get-manager-api-configs', (event) => {
  try {
    event.returnValue = mainApp.preloadAPIs || [];
  } catch (error) {
    console.error('Failed to send manager API configs:', error);
    event.returnValue = [];
  }
});
```

#### Renderer Process Call
```javascript
// Synchronous call in preload script
const configs = ipcRenderer.sendSync('get-manager-api-configs');
```

### Asynchronous IPC (Invoke/Handle)

#### Backend Handler Registration
```javascript
ipcMain.handle('StoreManager:readJSON', async (event, filePath) => {
  const storeManager = mainApp.managers.find(m => m.constructor.name === 'StoreManager');
  return await storeManager.readJSON(filePath);
});
```

#### Frontend API Call
```javascript
try {
  const data = await window.storeAPI.readJSON('config.json');
  console.log('Data loaded:', data);
} catch (error) {
  console.error('Failed to load data:', error);
}
```

### Event-Based IPC (Send/On)

#### Event Emission (Backend)
```javascript
// backend/managers/store-manager.js
async notifyFileWatchers(action, filePath, data = null) {
  if (this.app.mainWindow) {
    this.app.mainWindow.webContents.send('storeWatcher:' + watcherId, {
      action,
      filePath,
      data,
      timestamp: new Date()
    });
  }
}
```

#### Event Listening (Frontend)
```javascript
// Enhanced preload script with event support
if (config.type === 'eventListener') {
  managerAPIs[apiName] = (callback) => {
    const listener = (event, ...args) => callback(...args);
    ipcRenderer.on(config.eventChannel, listener);
    return () => ipcRenderer.removeListener(config.eventChannel, listener);
  };
}
```

## Preload Script Architecture

### Core Electron APIs Exposure

```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
});
```

### Manager API Generation

#### Dynamic API Creation
```javascript
for (const managerConfig of managerAPIConfigs) {
  const managerAPIs = {};

  for (const [apiName, config] of Object.entries(managerConfig.api)) {
    if (config.type === 'eventListener') {
      // Event listener pattern
      managerAPIs[apiName] = (callback) => {
        const listener = (event, ...args) => callback(...args);
        ipcRenderer.on(config.eventChannel, listener);
        return () => ipcRenderer.removeListener(config.eventChannel, listener);
      };
    } else if (config.channel) {
      // Async invoke pattern
      managerAPIs[apiName] = async (...args) => {
        return await ipcRenderer.invoke(config.channel, ...args);
      };
    } else {
      // Direct data exposure
      managerAPIs[apiName] = config;
    }
  }

  // Naming convention: ManagerName -> managerNameAPI
  const apiName = managerConfig.name.toLowerCase().replace('manager', '') + 'API';
  contextBridge.exposeInMainWorld(apiName, managerAPIs);
}
```

#### File Watching Integration
```javascript
// Advanced file watching with async callbacks
if (managerConfig.api.watchFile && managerConfig.api.unwatchFile) {
  managerAPIs.watchFile = async (filePath, asyncCallback) => {
    const watcherId = `watcher_${Date.now()}_${watcherCounter}`;

    await managerAPIs.watchFile(filePath, watcherId);

    const listener = async (event, changeData) => {
      try {
        await asyncCallback(changeData);
      } catch (error) {
        console.error(`Error in file watcher callback:`, error);
      }
    };

    ipcRenderer.on(`storeWatcher:${watcherId}`, listener);
    activeWatchers.set(watcherId, { filePath, listener });

    return () => {
      ipcRenderer.removeListener(`storeWatcher:${watcherId}`, listener);
      activeWatchers.delete(watcherId);
      managerAPIs.unwatchFile(filePath).catch(console.error);
    };
  };
}
```

## API Configuration Patterns

### Method Types

#### Synchronous Methods
```javascript
api: {
  getVersion: { channel: 'App:getVersion' }  // Simple data return
}
```

#### Asynchronous Methods
```javascript
api: {
  readFile: { channel: 'StoreManager:readFile' },     // File operations
  saveData: { channel: 'StoreManager:saveData' },     // Data persistence
  processData: { channel: 'DataManager:processData' } // Data processing
}
```

#### Event Listeners
```javascript
api: {
  onFileChange: {
    type: 'eventListener',
    eventChannel: 'StoreManager:fileChanged'
  }
}
```

#### Data Properties
```javascript
api: {
  appVersion: '1.0.0',                    // Static data
  platform: process.platform,             // Dynamic data
  config: { key: 'value' }               // Configuration objects
}
```

### Channel Naming Convention

#### Pattern: `ManagerName:methodName`
- **StoreManager:readText** - File reading operations
- **WindowManager:getPosition** - Window state queries
- **SectionManager:switchToSection** - Navigation operations

#### Benefits
- **Namespace Isolation**: Prevents channel name conflicts
- **Manager Association**: Clear ownership of IPC methods
- **Debugging**: Easy identification of message sources

## Error Handling and Security

### IPC Error Handling

#### Backend Error Handling
```javascript
ipcMain.handle('StoreManager:readJSON', async (event, filePath) => {
  try {
    const storeManager = mainApp.managers.find(m => m.constructor.name === 'StoreManager');
    return await storeManager.readJSON(filePath);
  } catch (error) {
    // Log error securely (don't expose internal details)
    console.error('StoreManager readJSON error:', error);
    // Return sanitized error
    throw new Error('Failed to read JSON file');
  }
});
```

#### Frontend Error Handling
```javascript
try {
  const data = await window.storeAPI.readJSON(filePath);
  return data;
} catch (error) {
  console.error('IPC call failed:', error.message);
  // Handle error gracefully - show user message, retry, etc.
  throw new Error('Unable to load data. Please try again.');
}
```

### Security Validation

#### Path Security
```javascript
// backend/managers/store-manager.js
resolvePath(filePath) {
  const resolved = path.resolve(this.basePath, filePath);
  if (!resolved.startsWith(this.basePath)) {
    throw new Error('Access denied: Path outside of allowed directory');
  }
  return resolved;
}
```

#### Input Validation
```javascript
ipcMain.handle('StoreManager:readJSON', async (event, filePath) => {
  // Validate input
  if (typeof filePath !== 'string' || filePath.length === 0) {
    throw new Error('Invalid file path');
  }

  // Sanitize path
  const safePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');

  // Proceed with validated input
  return await storeManager.readJSON(safePath);
});
```

## Performance Optimization

### IPC Call Batching
```javascript
// Instead of multiple calls
const data1 = await window.storeAPI.readJSON('file1.json');
const data2 = await window.storeAPI.readJSON('file2.json');

// Batch into single call
const batchData = await window.storeAPI.readMultipleJSON(['file1.json', 'file2.json']);
```

### Caching Strategies
```javascript
class CachedAPI {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async getData(key) {
    if (this.cache.has(key)) {
      const { data, timestamp } = this.cache.get(key);
      if (Date.now() - timestamp < this.cacheTimeout) {
        return data;
      }
    }

    const data = await window.storeAPI.readJSON(key);
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }
}
```

### Connection Pooling
```javascript
// For high-frequency IPC calls
class IPCConnectionPool {
  constructor() {
    this.connections = new Map();
    this.maxConnections = 10;
  }

  async getConnection(managerName) {
    if (!this.connections.has(managerName)) {
      // Create new IPC connection
      this.connections.set(managerName, this.createConnection(managerName));
    }
    return this.connections.get(managerName);
  }
}
```

## Debugging and Monitoring

### IPC Logging

#### Backend Logging
```javascript
ipcMain.handle('StoreManager:readJSON', async (event, filePath) => {
  console.log(`IPC: StoreManager.readJSON called with: ${filePath}`);

  try {
    const result = await storeManager.readJSON(filePath);
    console.log(`IPC: StoreManager.readJSON success for: ${filePath}`);
    return result;
  } catch (error) {
    console.error(`IPC: StoreManager.readJSON failed for: ${filePath}`, error);
    throw error;
  }
});
```

#### Frontend Logging
```javascript
const originalInvoke = ipcRenderer.invoke;
ipcRenderer.invoke = async (channel, ...args) => {
  console.log(`IPC Call: ${channel}`, args);
  try {
    const result = await originalInvoke(channel, ...args);
    console.log(`IPC Result: ${channel}`, result);
    return result;
  } catch (error) {
    console.error(`IPC Error: ${channel}`, error);
    throw error;
  }
};
```

### IPC Monitoring Tools

#### Development IPC Inspector
```javascript
if (process.env.NODE_ENV === 'development') {
  // Log all IPC calls
  const originalHandle = ipcMain.handle;
  ipcMain.handle = (channel, handler) => {
    console.log(`Registering IPC handler: ${channel}`);
    return originalHandle(channel, async (event, ...args) => {
      console.log(`IPC Call: ${channel}`, args);
      const result = await handler(event, ...args);
      console.log(`IPC Result: ${channel}`, result);
      return result;
    });
  };
}
```

#### Performance Monitoring
```javascript
class IPCCallTimer {
  static async timeCall(channel, ipcCall) {
    const start = performance.now();
    try {
      const result = await ipcCall();
      const duration = performance.now() - start;
      console.log(`IPC ${channel} took ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`IPC ${channel} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }
}
```

## Best Practices

### API Design
- **Consistent Naming**: Use clear, descriptive method names
- **Type Safety**: Validate inputs and outputs
- **Error Handling**: Provide meaningful error messages
- **Documentation**: Document all IPC methods and parameters

### Security
- **Input Validation**: Always validate IPC call parameters
- **Path Security**: Prevent directory traversal attacks
- **Rate Limiting**: Implement rate limiting for expensive operations
- **Access Control**: Check permissions before sensitive operations

### Performance
- **Minimize Calls**: Batch operations where possible
- **Caching**: Cache frequently accessed data
- **Async Operations**: Use async/await for all IPC calls
- **Resource Management**: Clean up event listeners and watchers

### Development
- **Logging**: Enable IPC logging in development
- **Error Boundaries**: Handle IPC failures gracefully
- **Testing**: Test IPC calls in isolation
- **Documentation**: Keep API documentation current

## Common Patterns and Anti-Patterns

### Good Patterns

#### Typed API Interfaces
```javascript
// Define interfaces for type safety
interface StoreAPI {
  readJSON(path: string): Promise<any>;
  writeJSON(path: string, data: any): Promise<void>;
  exists(path: string): Promise<boolean>;
}

// Usage with type checking
const data: any = await window.storeAPI.readJSON('config.json');
```

#### Request Batching
```javascript
// Batch multiple related operations
const results = await window.batchAPI.executeBatch([
  { method: 'readJSON', params: ['file1.json'] },
  { method: 'readJSON', params: ['file2.json'] },
  { method: 'exists', params: ['file3.json'] }
]);
```

### Anti-Patterns

#### Synchronous IPC Abuse
```javascript
// DON'T: Block renderer with sync IPC
const result = ipcRenderer.sendSync('expensive-operation');

// DO: Use async IPC
const result = await window.api.expensiveOperation();
```

#### Direct Node.js Access
```javascript
// DON'T: Try to access Node.js directly
const fs = require('fs'); // This won't work with context isolation

// DO: Use exposed IPC APIs
const data = await window.storeAPI.readText('file.txt');
```

#### Large Data Transfers
```javascript
// DON'T: Send large objects over IPC
const hugeData = await window.api.getMassiveDataset();

// DO: Stream or paginate data
const page1 = await window.api.getDataPage(1, 100);
const page2 = await window.api.getDataPage(2, 100);
```

## Migration and Versioning

### API Versioning
```javascript
// Versioned API exposure
contextBridge.exposeInMainWorld('storeAPI', {
  v1: { /* version 1 methods */ },
  v2: { /* version 2 methods */ },
  // Current version
  readJSON: async (path) => { /* implementation */ }
});
```

### Backward Compatibility
```javascript
// Maintain old method signatures while adding new ones
initPreload() {
  return {
    name: 'StoreManager',
    api: {
      // Legacy method (deprecated)
      loadData: { channel: 'StoreManager:readJSON' },
      // New preferred method
      readJSON: { channel: 'StoreManager:readJSON' },
      // Additional new methods
      writeJSON: { channel: 'StoreManager:writeJSON' }
    }
  };
}
```

## Testing IPC Communications

### Unit Testing Managers
```javascript
describe('StoreManager IPC', () => {
  test('readJSON handles valid paths', async () => {
    const manager = new StoreManager();
    const result = await manager.readJSON('test.json');
    expect(result).toBeDefined();
  });

  test('readJSON rejects invalid paths', async () => {
    const manager = new StoreManager();
    await expect(manager.readJSON('../../../etc/passwd')).rejects.toThrow('Access denied');
  });
});
```

### Integration Testing
```javascript
describe('IPC Integration', () => {
  test('frontend can call backend methods', async () => {
    // Simulate IPC call
    const result = await window.storeAPI.readJSON('config.json');
    expect(result).toHaveProperty('version');
  });

  test('error handling works', async () => {
    await expect(window.storeAPI.readJSON('nonexistent.json')).rejects.toThrow();
  });
});
```

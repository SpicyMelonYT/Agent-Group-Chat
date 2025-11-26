# Backend and Frontend Separation Documentation

## Overview
This Electron application implements a strict separation between backend (main process) and frontend (renderer process) responsibilities, with secure inter-process communication (IPC) enabling controlled interaction between the two environments.

## Key Terms and Concepts

### Process Separation
- **Main Process (Backend)**: Node.js environment with full system access, manages application lifecycle
- **Renderer Process (Frontend)**: Browser-like environment (Chromium), handles UI and user interactions
- **IPC (Inter-Process Communication)**: Secure communication bridge between processes
- **Context Isolation**: Security measure preventing direct access between processes

### Architecture Layers
- **Backend Managers**: Handle system operations, file I/O, window management
- **Frontend Managers**: Handle UI logic, event handling, state management
- **Sections**: Modular UI components loaded dynamically
- **Preload Scripts**: Secure API exposure mechanism

## Backend (Main Process) Responsibilities

### Core Functions
- **Application Lifecycle**: Startup, window creation, shutdown handling
- **System Integration**: File system access, native OS features
- **Security**: Secure data operations, path validation
- **Process Management**: Window management, IPC coordination

### Backend Managers

#### StoreManager
**Location**: `backend/managers/store-manager.js`
**Responsibilities**:
- File system operations (read, write, delete, move, copy)
- JSON data serialization/deserialization
- Directory management and traversal
- File watching and change notifications
- Archive and entry system for data organization

**Key Methods**:
- `readText()`, `writeText()` - Text file operations
- `readJSON()`, `writeJSON()` - JSON file operations
- `list()`, `exists()`, `stats()` - File system queries
- `createArchive()`, `createEntry()` - Data organization
- `watchFile()`, `notifyFileWatchers()` - File monitoring

#### WindowManager
**Location**: `backend/managers/window-manager.js`
**Responsibilities**:
- Electron window state persistence
- Window positioning and sizing
- State restoration on application restart

#### SectionManager
**Location**: `backend/managers/section-manager.js`
**Responsibilities**:
- Dynamic section loading and switching
- HTML file validation and loading
- Section discovery and enumeration

## Frontend (Renderer Process) Responsibilities

### Core Functions
- **User Interface**: HTML rendering, CSS styling, DOM manipulation
- **User Interactions**: Event handling, form processing
- **State Management**: UI state, component lifecycle
- **Navigation**: Section switching coordination

### Frontend Architecture

#### Section System
**Base Class**: `frontend/core/section.js`
**Purpose**: Container for related UI functionality and managers

**Key Features**:
- Manager lifecycle management
- Logging integration
- Global references (`window.section`, `window.logger`)

#### Manager System
**Base Class**: `frontend/core/manager.js`
**Initialization Pattern**:
1. `initGlobalVariables()` - Set up global state
2. `initElementReferences()` - Cache DOM element references
3. `initEventListeners()` - Attach event handlers
4. `initStates()` - Initialize component state

#### Section Manager (Frontend)
**Location**: `frontend/managers/section-manager.js`
**Responsibilities**:
- Client-side navigation coordination
- Section existence validation
- IPC communication with backend SectionManager

## Communication Architecture

### IPC Flow Overview

#### API Definition
Backend managers define their IPC interfaces through `initPreload()` methods:

```javascript
initPreload() {
  return {
    name: 'StoreManager',
    api: {
      readText: { channel: 'StoreManager:readText' },
      writeText: { channel: 'StoreManager:writeText' },
      // ... more methods
    }
  };
}
```

#### IPC Handler Registration
**Location**: `backend/main.js`
- Dynamically registers IPC handlers based on manager APIs
- Creates secure channels for each method
- Handles method routing and error management

#### Preload Script Exposure
**Location**: `backend/preload.cjs`
- Uses `contextBridge.exposeInMainWorld()` for secure API exposure
- Converts IPC channels to callable methods
- Supports both synchronous and asynchronous operations
- Handles event listener patterns for real-time communication

#### Frontend API Usage
Frontend code accesses backend APIs through global objects:

```javascript
// Store operations
const data = await window.storeAPI.readJSON('config.json');

// Section navigation
const success = await window.sectionAPI.switchToSection('main');

// Event listeners
const cleanup = window.someAPI.onEvent(callback);
```

### Security Model

#### Context Isolation
- Prevents direct script access between processes
- Requires explicit API exposure through preload scripts
- Eliminates prototype pollution risks

#### Path Security
- Backend validates all file paths
- Prevents directory traversal attacks
- Sandboxed file operations within designated directories

#### API Scoping
- Each manager exposes only necessary methods
- Methods are explicitly defined in preload configuration
- No arbitrary code execution capabilities

## Data Flow Patterns

### File Operations Flow
1. **Frontend Request**: `window.storeAPI.readJSON('data.json')`
2. **IPC Call**: Routed through preload script to main process
3. **Backend Processing**: StoreManager validates path and reads file
4. **Response**: Data returned through IPC channel to frontend
5. **Frontend Handling**: UI updates with received data

### Section Navigation Flow
1. **User Action**: Click navigation button
2. **Frontend Logic**: `sectionManager.navigateTo('newSection')`
3. **Validation**: Check if section exists via IPC
4. **Backend Switch**: SectionManager loads new HTML file
5. **UI Update**: Browser window displays new section
6. **Re-initialization**: New section's managers initialize

### Real-time Updates Flow
1. **File Watcher**: Backend monitors file system changes
2. **Change Detection**: StoreManager detects modifications
3. **IPC Notification**: Sends change events to frontend
4. **Frontend Response**: Updates UI based on change notifications
5. **State Synchronization**: Maintains data consistency

## State Management

### Backend State
- **Persistent Data**: Stored in userData directory
- **Window State**: Position, size, and other window properties
- **Application Settings**: Configuration and preferences

### Frontend State
- **UI State**: Current section, component states
- **User Data**: Cached information for performance
- **Navigation History**: Section transition tracking

### State Synchronization
- **IPC Events**: Real-time updates between processes
- **File Watching**: Automatic UI updates on data changes
- **State Restoration**: Window state recovery on restart

## Error Handling and Logging

### Backend Error Handling
- **File Operations**: Path validation, permission checks
- **IPC Errors**: Handler registration failures, method routing issues
- **System Errors**: OS-level operation failures

### Frontend Error Handling
- **IPC Failures**: Network-like error handling for API calls
- **UI Errors**: DOM manipulation and event handling errors
- **State Errors**: Component initialization failures

### Logging Integration
- **Backend Logging**: Console-based logging with timestamps
- **Frontend Logging**: Integrated logger with tagging system
- **IPC Logging**: Communication event logging

## Development vs Production

### Development Mode
- **Hot Reloading**: Automatic restarts and reloads
- **DevTools**: Enabled for debugging
- **Security Warnings**: Suppressed for development convenience
- **Enhanced Logging**: Additional debug information

### Production Mode
- **Optimized Builds**: Minified and packaged distributions
- **Security Hardening**: Full context isolation enforcement
- **Error Boundaries**: Graceful error handling
- **Performance Optimization**: Efficient IPC usage

## Architecture Benefits

### Security
- **Process Isolation**: Backend cannot be compromised through frontend
- **API Scoping**: Only explicitly exposed methods available
- **Path Validation**: Prevents unauthorized file access

### Maintainability
- **Clear Separation**: Backend and frontend concerns are distinct
- **Modular Design**: Managers encapsulate related functionality
- **Testability**: Each layer can be tested independently

### Performance
- **Efficient IPC**: Minimal data transfer between processes
- **Lazy Loading**: Sections loaded only when needed
- **Caching**: Frontend can cache frequently accessed data

### Scalability
- **Manager Pattern**: Easy to add new functionality
- **Section System**: Modular UI organization
- **IPC Abstraction**: Communication layer handles complexity

## Best Practices

### Backend Development
- **Validate All Inputs**: Never trust data from renderer processes
- **Path Security**: Always validate and resolve file paths
- **Error Handling**: Provide meaningful error messages
- **Resource Management**: Clean up watchers and handlers

### Frontend Development
- **Async/Await**: Use async patterns for IPC calls
- **Error Boundaries**: Handle IPC failures gracefully
- **State Management**: Keep UI state synchronized with backend
- **Performance**: Cache data and minimize IPC calls

### IPC Design
- **Channel Naming**: Use consistent naming conventions
- **Method Grouping**: Group related methods in managers
- **Event Patterns**: Use appropriate sync/async patterns
- **Security First**: Expose minimum necessary APIs

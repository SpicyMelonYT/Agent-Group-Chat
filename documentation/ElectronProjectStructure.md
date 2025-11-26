# Electron Project Structure Documentation

## Overview
This project is an Electron desktop application that implements a modular architecture with clear separation between backend (main process) and frontend (renderer process) components. The application uses a manager-based system for organizing functionality and supports hot reloading during development.

## Key Terms and Concepts

### Electron Architecture
- **Main Process**: Runs Node.js, manages application lifecycle, creates windows, and handles system-level operations
- **Renderer Process**: Runs in browser-like environment, handles UI rendering and user interactions
- **IPC (Inter-Process Communication)**: Secure communication channel between main and renderer processes
- **Context Bridge**: Secure way to expose main process APIs to renderer processes

### Project Structure
```
agent-group-chat/
├── backend/           # Main process code
│   ├── main.js       # Application entry point
│   ├── app.js        # Main application class
│   ├── core/         # Core backend classes
│   ├── managers/     # Backend managers
│   └── preload.cjs   # IPC preload script
├── frontend/         # Renderer process code
│   ├── sections/     # UI sections/pages
│   ├── managers/     # Frontend managers
│   ├── components/   # Reusable UI components
│   └── core/         # Core frontend classes
└── package.json      # Project configuration
```

## Main Process (Backend)

### Entry Point: `backend/main.js`
- **Purpose**: Initializes the Electron application, creates windows, and sets up IPC handlers
- **Key Functions**:
  - `createWindow()`: Creates and configures the main BrowserWindow
  - `registerIpcHandlers()`: Dynamically registers IPC handlers based on manager APIs
  - Window management and lifecycle handling

### Main Application: `backend/app.js`
- **Purpose**: Extends base `App` class, manages all backend managers
- **Managers Added**:
  - `StoreManager`: Data persistence
  - `WindowManager`: Window state management
  - `SectionManager`: Section coordination

### Base App Class: `backend/core/app.js`
- **Purpose**: Base application class that manages a collection of managers
- **Key Features**:
  - Manager registration and initialization
  - Preload API collection for IPC
  - Main window reference management

## Renderer Process (Frontend)

### HTML Entry: `frontend/sections/main/index.html`
- **Purpose**: Main HTML file loaded by the BrowserWindow
- **Features**: Simple HTML structure with script import

### Section System: `frontend/sections/main/index.js`
- **Purpose**: Entry point for each UI section
- **Structure**: Extends base `Section` class, manages section-specific managers

## IPC Communication System

### Preload Script: `backend/preload.cjs`
- **Purpose**: Securely exposes main process APIs to renderer processes using contextBridge
- **Key Features**:
  - Dynamic API exposure based on manager configurations
  - Event listener support for real-time communication
  - File watching capabilities for development

### IPC Flow
1. Managers define their API configurations in `initPreload()` methods
2. Main process collects these configurations via `collectPreloadAPIs()`
3. Preload script exposes APIs using `contextBridge.exposeInMainWorld()`
4. Renderer processes can call these APIs like `window.storeAPI.getData()`

## Development vs Production

### Development Mode (`--dev` flag)
- Enables DevTools
- Enables hot reloading for frontend files
- Additional debugging features

### Production Mode
- Optimized builds using electron-builder
- Window state persistence
- Secure IPC communication only

## Build Configuration

### package.json Scripts
- `npm start`: Start in production mode
- `npm run dev`: Start in development mode with DevTools
- `npm run watch`: Run custom watch script for development
- `npm run build`: Build distributable packages

### Build Settings
- Uses electron-builder for packaging
- Configured for Windows NSIS installer
- Includes backend and frontend directories in build

## Application Lifecycle

1. **App Ready**: `app.whenReady()` triggered
2. **Manager Initialization**: All managers initialized in dependency order
3. **IPC Setup**: Handlers registered, preload APIs collected
4. **Window Creation**: Main window created with preload script
5. **UI Loading**: Frontend sections load and initialize their managers
6. **IPC Communication**: Secure communication established between processes

## Key Architecture Patterns

- **Manager Pattern**: Modular functionality organization
- **Event-Driven**: IPC-based communication between processes
- **Separation of Concerns**: Clear backend/frontend boundaries
- **Hot Reloading**: Development-time file watching and reloading
- **State Management**: Persistent window and application state

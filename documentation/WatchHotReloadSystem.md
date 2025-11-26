# Watch/Hot Reload System Documentation

## Overview
This project implements a comprehensive hot reloading system for Electron development, combining custom backend file watching with frontend hot reloading. The system enables rapid development by automatically restarting or reloading the application when files change.

## Key Terms and Concepts

### Hot Reloading
- **Backend Hot Reload**: Automatic restart of Electron main process when backend files change
- **Frontend Hot Reload**: Automatic refresh of renderer process when frontend files change
- **File Watching**: Monitoring filesystem for changes using chokidar
- **Process Management**: Spawning and managing Electron processes during development

### Development Scripts
- `npm run watch`: Runs the custom hot reload watcher
- `npm run dev`: Runs Electron with `--dev` flag enabling DevTools and electron-reload

## Architecture Components

### Custom Watch Script: `backend/watch.js`

#### HotReloadWatcher Class
- **Purpose**: Manages Electron process lifecycle and file watching during development
- **Key Features**:
  - Spawns and monitors Electron processes
  - Restarts process on backend file changes with debouncing
  - Prevents multiple concurrent restart operations
  - Handles graceful shutdown signals

#### File Watching Configuration
```javascript
this.backendWatchPatterns = [
  'backend/**/*.js',
  'backend/**/*.json',
  '!backend/preload.cjs',  // Excluded from watching
  '!backend/watch.js'      // Excluded from watching
];
```

#### Process Management
- **Electron Spawning**: Uses Node.js `spawn()` to start Electron processes
- **Environment Variables**: Sets `NODE_ENV: 'development'` and disables security warnings
- **Arguments**: Passes `--dev` and `--trace-warnings` flags
- **Restart Protection**: `isPendingRestart` flag prevents multiple concurrent restart operations

### Electron-Reload Integration

#### Configuration in `backend/main.js`
```javascript
if (process.argv.includes("--dev")) {
  const electronReload = require("electron-reload");
  const frontendPath = path.join(__dirname, "../frontend");
  electronReload(frontendPath, {
    electron: require("electron"),
    hardResetMethod: "exit",
    forceHardReset: false,
  });
}
```

#### Frontend Path Watching
- **Target Directory**: `../frontend` (relative to backend)
- **Reset Method**: Process exit (hard reset)
- **Force Hard Reset**: Disabled for smoother reloading

## Development Workflow

### Starting Development Mode

#### Option 1: Custom Watcher (`npm run watch`)
1. Runs `node backend/watch.js`
2. Sets up file watchers for backend files
3. Spawns Electron process with development flags
4. Monitors for file changes and process restarts

#### Option 2: Direct Dev Mode (`npm run dev`)
1. Runs `electron . --dev`
2. Enables DevTools automatically
3. Activates electron-reload for frontend changes
4. Requires manual restart for backend changes

### File Change Handling

#### Backend Files (`backend/**/*.js`, `backend/**/*.json`)
- **Trigger**: File modification, creation, or deletion
- **Action**: Restart entire Electron process
- **Debounce**: 100ms delay to prevent rapid consecutive restarts
- **Protection**: `isPendingRestart` flag prevents overlapping restart operations
- **Excluded Files**:
  - `preload.cjs`: Requires process restart anyway
  - `watch.js`: Avoids self-restart loops

#### Frontend Files (All files in `frontend/`)
- **Trigger**: Any file changes in frontend directory
- **Action**: Browser window reload via electron-reload
- **Method**: Hard reset (process exit) for clean state

## Dependencies and Libraries

### Core Dependencies
- **chokidar**: High-performance file watching library
- **electron-reload**: Frontend hot reloading for Electron

### Development Dependencies
- Listed in `package.json` devDependencies
- Only active during development (`--dev` flag)

## Process Lifecycle Management

### Startup Sequence
1. **Watcher Initialization**: File watchers set up first
2. **Electron Spawn**: Process started with development environment
3. **Monitoring**: Process events and file changes watched
4. **Graceful Shutdown**: SIGINT/SIGTERM handling

### Error Handling
- **Process Errors**: Logged with error indicators
- **Watcher Errors**: File watching failures handled gracefully
- **Restart Failures**: Attempts continue despite individual failures

## Configuration Options

### Chokidar Watcher Settings
```javascript
{
  ignoreInitial: true,        // Don't trigger on startup
  awaitWriteFinish: {
    stabilityThreshold: 100, // Wait for file operations to complete
    pollInterval: 50         // Polling interval for stability check
  }
}
```

### Electron Process Environment
```javascript
const env = {
  ...process.env,
  NODE_ENV: 'development',
  ELECTRON_DISABLE_SECURITY_WARNINGS: '1'
};
```

## Logging and Feedback

### Console Output Format
```
[timestamp] emoji message
```
- **ℹ️**: General information
- **✅**: Success messages
- **❌**: Error messages
- **🚀**: Startup messages

### Development Notifications
- File watching status
- Process lifecycle events
- Change detection confirmations
- Shutdown confirmations

## Performance Considerations

### Debouncing
- **Backend Restarts**: 100ms debounce prevents excessive restarts
- **File Stability**: 100ms stability threshold ensures complete file writes
- **Overlapping Protection**: `isPendingRestart` flag prevents multiple concurrent restart operations

### Resource Management
- **Process Cleanup**: Proper termination of old processes before spawning new ones
- **Watcher Cleanup**: File watchers managed throughout lifecycle
- **Memory Management**: Single watcher instance prevents resource leaks

## Integration Points

### With Electron Main Process
- **DevTools**: Automatically opened in development mode
- **Security Warnings**: Suppressed for development convenience
- **Process Arguments**: `--dev` flag enables development features

### With Build System
- **Production Exclusion**: Hot reload only active in development
- **Build Scripts**: Separate `watch` and `dev` commands for different workflows
- **Distribution**: electron-builder excludes development dependencies

## Troubleshooting

### Common Issues
- **Port Conflicts**: Ensure no other Electron instances running
- **File Permission Errors**: Check directory access for watching
- **Process Hanging**: Manual kill may be needed for stuck processes

### Debug Information
- **Process IDs**: Logged for manual process management
- **File Paths**: Absolute paths shown for change events
- **Timing**: Timestamps for all operations
- **Error Details**: Full error messages with stack traces

## Best Practices

### Development Workflow
1. Use `npm run watch` for full hot reloading experience
2. Use `npm run dev` for quick testing with DevTools
3. Keep DevTools open for real-time console output
4. Monitor terminal for file change notifications

### File Organization
- Keep frequently changing files in watched directories
- Exclude generated files from watching
- Use `.gitignore` patterns for watcher exclusions

### Process Management
- Allow proper shutdown time between restarts
- Monitor system resources during development
- Clean up processes when switching workflows

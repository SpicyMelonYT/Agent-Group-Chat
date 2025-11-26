# Window Manager System Documentation

## Overview
The WindowManager is a comprehensive Electron window lifecycle and state management system that handles window positioning, sizing, state persistence, and cross-platform window behavior. It provides automatic state saving and restoration, ensuring users' window preferences are maintained across application sessions while providing programmatic control over window behavior.

## Key Terms and Concepts

### Window State
- **Bounds**: Window position (x, y) and size (width, height)
- **Window States**: maximized, minimized, fullscreen, normal
- **Display Bounds**: Screen coordinates and dimensions
- **State Persistence**: Automatic saving and restoration of window state

### Window Lifecycle
- **Creation**: Initial window setup with default or saved state
- **Event Handling**: Responding to user interactions and system events
- **State Tracking**: Monitoring and saving state changes
- **Restoration**: Applying saved state on application restart

### Cross-Platform Considerations
- **Platform Differences**: macOS, Windows, Linux window behavior variations
- **Display Management**: Multi-monitor support and display changes
- **System Integration**: Native window manager integration

## Architecture Overview

### State Persistence Structure
```
UserData/App/
└── window-config.json          # Window state configuration
   {
     "x": 100,                   # Window x position (null = center)
     "y": 100,                   # Window y position (null = center)
     "width": 1200,             # Window width
     "height": 800,             # Window height
     "maximized": false,        # Window maximization state
     "fullscreen": false,       # Fullscreen state
     "minimized": false         # Minimization state
   }
```

### Initialization Flow

#### Manager Initialization
```javascript
async init() {
  // Get StoreManager dependency
  const storeManager = this.app.managers.find(m => m.constructor.name === 'StoreManager');

  // Initialize configuration
  await this.initializeConfig();

  // Mark as initialized
  this.isInitialized = true;
}
```

#### Configuration Loading
```javascript
async initializeConfig() {
  try {
    // Load existing configuration
    this.config = await this.storeManager.readJSON(this.configFile);
  } catch (error) {
    // Create default configuration
    this.config = {
      x: null,      // null = center on screen
      y: null,      // null = center on screen
      width: 1200,  // Default width
      height: 800,  // Default height
      maximized: false,
      fullscreen: false,
      minimized: false
    };

    // Save default config
    await this.storeManager.writeJSON(this.configFile, this.config);
  }
}
```

## Window Event Handling

### Event Listener Setup
```javascript
setupWindowListeners() {
  const window = this.app.mainWindow;

  // Position and size change tracking
  window.on('move', () => {
    if (!this.isApplyingState && !window.isMaximized() && !window.isFullScreen()) {
      this.saveCurrentState();
    }
  });

  window.on('resize', () => {
    if (!this.isApplyingState && !window.isMaximized() && !window.isFullScreen()) {
      this.saveCurrentState();
    }
  });

  // State change tracking
  window.on('maximize', () => {
    if (!this.isApplyingState) {
      this.config.maximized = true;
      this.config.fullscreen = false;
      this.saveConfig();
    }
  });

  // ... additional event handlers
}
```

### State Preservation Logic

#### Position and Size Saving
```javascript
async saveCurrentState() {
  const window = this.app.mainWindow;
  const bounds = window.getBounds();

  // Only save position/size for normal windows
  if (!window.isMaximized() && !window.isFullScreen()) {
    this.config.x = bounds.x;
    this.config.y = bounds.y;
    this.config.width = bounds.width;
    this.config.height = bounds.height;
  }

  // Always save state flags
  this.config.maximized = window.isMaximized();
  this.config.fullscreen = window.isFullScreen();
  this.config.minimized = window.isMinimized();

  await this.saveConfig();
}
```

#### Configuration Persistence
```javascript
async saveConfig() {
  try {
    await this.storeManager.writeJSON(this.configFile, this.config);
  } catch (error) {
    console.error('Failed to save window config:', error);
  }
}
```

## State Restoration

### Saved State Application
```javascript
async applySavedState() {
  const window = this.app.mainWindow;

  try {
    this.isApplyingState = true;  // Prevent event listeners during restoration

    // Validate saved position is on a valid display
    const displays = screen.getAllDisplays();
    let positionValid = false;

    if (this.config.x !== null && this.config.y !== null) {
      // Check if position is within any display bounds
      for (const display of displays) {
        const bounds = display.bounds;
        if (this.config.x >= bounds.x &&
            this.config.x < bounds.x + bounds.width &&
            this.config.y >= bounds.y &&
            this.config.y < bounds.y + bounds.height) {
          positionValid = true;
          break;
        }
      }

      if (positionValid) {
        // Apply saved position and size
        window.setBounds({
          x: this.config.x,
          y: this.config.y,
          width: this.config.width,
          height: this.config.height
        });
      } else {
        // Position is off-screen, center instead
        window.center();
        window.setSize(this.config.width, this.config.height);
      }
    } else {
      // No saved position, center the window
      window.center();
      window.setSize(this.config.width, this.config.height);
    }

    // Apply window states with delay for proper sequencing
    if (this.config.maximized && !this.config.fullscreen) {
      setTimeout(() => {
        window.maximize();
        this.isApplyingState = false;
      }, 100);
    } else if (this.config.fullscreen) {
      setTimeout(() => {
        window.setFullScreen(true);
        this.isApplyingState = false;
      }, 100);
    } else if (this.config.minimized) {
      setTimeout(() => {
        window.minimize();
        this.isApplyingState = false;
      }, 100);
    } else {
      this.isApplyingState = false;
    }

  } catch (error) {
    this.isApplyingState = false;
    console.error('Failed to apply saved window state:', error);
  }
}
```

### Display Validation
- **Multi-Monitor Support**: Checks all connected displays
- **Bounds Checking**: Ensures window position is visible
- **Fallback Behavior**: Centers window if position is invalid
- **Platform Handling**: Accounts for different OS behaviors

## Window State API

### State Getters

#### Position and Size Queries
```javascript
// Get current window position
getPosition() {
  if (!this.app || !this.app.mainWindow) return null;
  const bounds = this.app.mainWindow.getBounds();
  return { x: bounds.x, y: bounds.y };
}

// Get current window size
getSize() {
  if (!this.app || !this.app.mainWindow) return null;
  const bounds = this.app.mainWindow.getBounds();
  return { width: bounds.width, height: bounds.height };
}
```

#### State Queries
```javascript
// Check window states
isMaximized() {
  if (!this.app || !this.app.mainWindow) return false;
  return this.app.mainWindow.isMaximized();
}

isFullscreen() {
  if (!this.app || !this.app.mainWindow) return false;
  return this.app.mainWindow.isFullScreen();
}

isMinimized() {
  if (!this.app || !this.app.mainWindow) return false;
  return this.app.mainWindow.isMinimized();
}
```

#### Composite State
```javascript
getWindowState() {
  return {
    position: this.getPosition(),
    size: this.getSize(),
    maximized: this.isMaximized(),
    fullscreen: this.isFullscreen(),
    minimized: this.isMinimized()
  };
}
```

### State Setters

#### Position and Size Control
```javascript
// Set window position
setPosition(x, y) {
  if (!this.app || !this.app.mainWindow) return;
  this.app.mainWindow.setPosition(x, y);
  // State auto-saved by event listeners
}

// Set window size
setSize(width, height) {
  if (!this.app || !this.app.mainWindow) return;
  this.app.mainWindow.setSize(width, height);
  // State auto-saved by event listeners
}
```

#### State Control
```javascript
// Window state management
maximize() {
  if (!this.app || !this.app.mainWindow) return;
  this.app.mainWindow.maximize();
}

unmaximize() {
  if (!this.app || !this.app.mainWindow) return;
  this.app.mainWindow.unmaximize();
}

toggleFullscreen() {
  if (!this.app || !this.app.mainWindow) return;
  const isFullscreen = this.app.mainWindow.isFullScreen();
  this.app.mainWindow.setFullScreen(!isFullscreen);
}

setFullscreen(fullscreen) {
  if (!this.app || !this.app.mainWindow) return;
  this.app.mainWindow.setFullScreen(fullscreen);
}

minimize() {
  if (!this.app || !this.app.mainWindow) return;
  this.app.mainWindow.minimize();
}

restore() {
  if (!this.app || !this.app.mainWindow) return;
  this.app.mainWindow.restore();
}

center() {
  if (!this.app || !this.app.mainWindow) return;
  this.app.mainWindow.center();
}
```

## Frontend Integration

### IPC API Exposure
```javascript
initPreload() {
  return {
    name: 'WindowManager',
    api: {
      // Window state getters
      getPosition: { channel: 'WindowManager:getPosition' },
      getSize: { channel: 'WindowManager:getSize' },
      isMaximized: { channel: 'WindowManager:isMaximized' },
      isFullscreen: { channel: 'WindowManager:isFullscreen' },
      isMinimized: { channel: 'WindowManager:isMinimized' },
      getWindowState: { channel: 'WindowManager:getWindowState' },

      // Window state setters
      setPosition: { channel: 'WindowManager:setPosition' },
      setSize: { channel: 'WindowManager:setSize' },
      maximize: { channel: 'WindowManager:maximize' },
      unmaximize: { channel: 'WindowManager:unmaximize' },
      toggleFullscreen: { channel: 'WindowManager:toggleFullscreen' },
      setFullscreen: { channel: 'WindowManager:setFullscreen' },
      minimize: { channel: 'WindowManager:minimize' },
      restore: { channel: 'WindowManager:restore' },
      center: { channel: 'WindowManager:center' },

      // Configuration management
      applySavedState: { channel: 'WindowManager:applySavedState' },
      saveCurrentState: { channel: 'WindowManager:saveCurrentState' }
    }
  };
}
```

### Frontend Usage Examples
```javascript
// Get current window state
const windowState = await window.windowAPI.getWindowState();
console.log('Window position:', windowState.position);
console.log('Window size:', windowState.size);
console.log('Is maximized:', windowState.maximized);

// Control window programmatically
await window.windowAPI.maximize();
await window.windowAPI.setSize(800, 600);
await window.windowAPI.center();

// Create window controls UI
class WindowControls extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <button id="minimize">−</button>
      <button id="maximize">□</button>
      <button id="close">×</button>
    `;

    this.querySelector('#minimize').onclick = () => window.windowAPI.minimize();
    this.querySelector('#maximize').onclick = async () => {
      const isMaximized = await window.windowAPI.isMaximized();
      if (isMaximized) {
        await window.windowAPI.unmaximize();
      } else {
        await window.windowAPI.maximize();
      }
    };
    this.querySelector('#close').onclick = () => window.close();
  }
}
```

## Cross-Platform Behavior

### Windows-Specific Behavior
- **Taskbar Integration**: Minimize to taskbar, restore from taskbar
- **Window Controls**: Standard minimize/maximize/close buttons
- **Snapping**: Windows 10/11 snap-to-edge behavior
- **Aero Snap**: Double-click title bar to maximize

### macOS-Specific Behavior
- **Traffic Light Controls**: Red, yellow, green button behavior
- **Full Screen**: Green button toggles fullscreen mode
- **Title Bar**: Integrated title bar and controls
- **Mission Control**: Window management integration

### Linux-Specific Behavior
- **Window Managers**: Integration with various window managers (GNOME, KDE, etc.)
- **Decoration Handling**: Client-side vs server-side decorations
- **Focus Behavior**: Different focus stealing prevention

## Error Handling and Edge Cases

### Window Creation Failures
```javascript
// Handle cases where window creation fails
async applySavedState() {
  if (!this.app || !this.app.mainWindow || !this.isInitialized) {
    console.warn('Cannot apply saved state: window not available');
    return;
  }

  try {
    // State application logic
  } catch (error) {
    console.error('Failed to apply saved window state:', error);
    // Continue with default behavior
    this.app.mainWindow.center();
    this.app.mainWindow.setSize(this.config.width, this.config.height);
  }
}
```

### Display Changes
```javascript
// Handle display disconnection/reconnection
window.on('moved', () => {
  // Validate position is still valid
  const displays = screen.getAllDisplays();
  const positionValid = this.validatePosition(this.config.x, this.config.y, displays);

  if (!positionValid) {
    // Move window to primary display
    this.app.mainWindow.center();
    this.saveCurrentState();
  }
});
```

### State Conflicts
```javascript
// Prevent conflicting states
window.on('maximize', () => {
  if (!this.isApplyingState) {
    this.config.maximized = true;
    this.config.fullscreen = false;  // Cannot be both maximized and fullscreen
    this.config.minimized = false;   // Cannot be both maximized and minimized
    this.saveConfig();
  }
});
```

## Performance Considerations

### Event Listener Optimization
- **Conditional Saving**: Only save state when not applying state
- **State Filtering**: Don't save position/size for maximized/fullscreen windows
- **Debouncing**: Natural debouncing through event frequency
- **Async Operations**: Non-blocking state persistence

### Memory Management
- **Reference Holding**: Minimal object references
- **Event Cleanup**: Automatic cleanup on manager destruction
- **State Caching**: In-memory state cache with file persistence
- **Resource Efficiency**: Lightweight event handling

### Startup Performance
- **Lazy Initialization**: State applied after window creation
- **Delayed Operations**: State application uses setTimeout for sequencing
- **Validation Efficiency**: Quick display bounds checking
- **Fallback Speed**: Fast fallback to default positioning

## Testing and Debugging

### Unit Testing Window State
```javascript
describe('WindowManager', () => {
  let windowManager;
  let mockApp;
  let mockWindow;

  beforeEach(() => {
    mockWindow = {
      getBounds: jest.fn(),
      setBounds: jest.fn(),
      center: jest.fn(),
      setSize: jest.fn(),
      maximize: jest.fn(),
      unmaximize: jest.fn(),
      isMaximized: jest.fn(),
      isFullScreen: jest.fn(),
      isMinimized: jest.fn(),
      setFullScreen: jest.fn(),
      minimize: jest.fn(),
      restore: jest.fn()
    };

    mockApp = {
      mainWindow: mockWindow,
      managers: [{ constructor: { name: 'StoreManager' } }]
    };

    windowManager = new WindowManager();
    windowManager.app = mockApp;
  });

  test('getPosition returns window bounds', () => {
    mockWindow.getBounds.mockReturnValue({ x: 100, y: 200, width: 800, height: 600 });
    const position = windowManager.getPosition();
    expect(position).toEqual({ x: 100, y: 200 });
  });

  test('setPosition calls window API', () => {
    windowManager.setPosition(150, 250);
    expect(mockWindow.setPosition).toHaveBeenCalledWith(150, 250);
  });
});
```

### Integration Testing
```javascript
describe('Window State Persistence', () => {
  test('window state saves on resize', async () => {
    // Mock resize event
    mockWindow.isMaximized.mockReturnValue(false);
    mockWindow.isFullScreen.mockReturnValue(false);
    mockWindow.getBounds.mockReturnValue({ x: 50, y: 50, width: 1000, height: 700 });

    // Trigger state saving
    await windowManager.saveCurrentState();

    // Verify configuration was updated
    expect(windowManager.config.width).toBe(1000);
    expect(windowManager.config.height).toBe(700);
  });

  test('saved state restores on application start', async () => {
    // Set up saved configuration
    windowManager.config = {
      x: 100, y: 100, width: 1200, height: 800,
      maximized: false, fullscreen: false, minimized: false
    };
    windowManager.isInitialized = true;

    // Apply saved state
    await windowManager.applySavedState();

    // Verify window positioning
    expect(mockWindow.setBounds).toHaveBeenCalledWith({
      x: 100, y: 100, width: 1200, height: 800
    });
  });
});
```

## Best Practices

### State Management
- **Automatic Persistence**: Enable event-driven state saving
- **Validation**: Always validate positions and states
- **Cross-Platform**: Account for platform-specific behaviors
- **User Experience**: Preserve user window preferences

### Error Handling
- **Graceful Degradation**: Fall back to defaults on errors
- **User Feedback**: Don't interrupt user workflow with errors
- **Logging**: Log state operations for debugging
- **Recovery**: Provide mechanisms to reset window state

### Performance
- **Efficient Events**: Minimize event listener overhead
- **Smart Saving**: Only save relevant state changes
- **Async Operations**: Non-blocking state persistence
- **Resource Aware**: Clean up resources properly

### User Experience
- **Consistent Behavior**: Maintain window behavior across sessions
- **Platform Conventions**: Follow platform-specific UI patterns
- **Accessibility**: Ensure window controls are accessible
- **Responsiveness**: Immediate UI response to state changes

## Integration Examples

### Custom Title Bar Implementation
```javascript
class CustomTitleBar extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="title-bar">
        <div class="title">My Application</div>
        <div class="controls">
          <button class="minimize">−</button>
          <button class="maximize">□</button>
          <button class="close">×</button>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  async setupEventListeners() {
    const minimizeBtn = this.querySelector('.minimize');
    const maximizeBtn = this.querySelector('.maximize');
    const closeBtn = this.querySelector('.close');

    minimizeBtn.addEventListener('click', () => window.windowAPI.minimize());

    maximizeBtn.addEventListener('click', async () => {
      const isMaximized = await window.windowAPI.isMaximized();
      if (isMaximized) {
        await window.windowAPI.unmaximize();
        maximizeBtn.textContent = '□';
      } else {
        await window.windowAPI.maximize();
        maximizeBtn.textContent = '❐';
      }
    });

    closeBtn.addEventListener('click', () => window.close());
  }
}
```

### Window State Monitoring
```javascript
class WindowStateMonitor {
  constructor() {
    this.currentState = {};
    this.watchers = [];
  }

  async startMonitoring() {
    // Initial state
    this.currentState = await window.windowAPI.getWindowState();

    // Set up periodic monitoring
    setInterval(async () => {
      const newState = await window.windowAPI.getWindowState();
      if (this.hasStateChanged(this.currentState, newState)) {
        this.notifyWatchers(newState, this.currentState);
        this.currentState = newState;
      }
    }, 100); // Check every 100ms
  }

  hasStateChanged(oldState, newState) {
    return JSON.stringify(oldState) !== JSON.stringify(newState);
  }

  addWatcher(callback) {
    this.watchers.push(callback);
  }

  notifyWatchers(newState, oldState) {
    this.watchers.forEach(callback => {
      try {
        callback(newState, oldState);
      } catch (error) {
        console.error('Window state watcher error:', error);
      }
    });
  }
}
```

This comprehensive WindowManager system ensures consistent, reliable window behavior across platforms while providing developers with full programmatic control over window lifecycle and state management.

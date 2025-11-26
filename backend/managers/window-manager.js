import { Manager } from "../core/index.js";
import { app, screen } from "electron";

export class WindowManager extends Manager {
  constructor() {
    super();
    this.configFile = 'window-config.json';
    this.config = null;
    this.isInitialized = false;
    this.isApplyingState = false; // Flag to prevent event listeners during state application
  }

  async init() {
    try {
      console.log('WindowManager: Starting initialization...');

      // Ensure we have access to the StoreManager
      if (!this.app) {
        throw new Error('WindowManager requires an app instance');
      }

      console.log('WindowManager: App instance found');

      // Get the StoreManager instance
      const storeManager = this.app.managers.find(m => m.constructor.name === 'StoreManager');
      if (!storeManager) {
        throw new Error('WindowManager requires StoreManager to be initialized first');
      }

      console.log('WindowManager: StoreManager found');
      this.storeManager = storeManager;

    // Initialize window configuration
    console.log('WindowManager: Initializing config...');
    await this.initializeConfig();

    // Note: setupWindowListeners() will be called later after window is created
    console.log('WindowManager: Config initialized, waiting for window creation...');

      this.isInitialized = true;
      console.log('WindowManager: Initialization complete');
    } catch (error) {
      console.error('WindowManager: Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Initialize window configuration with defaults
   */
  async initializeConfig() {
    try {
      // Try to load existing config
      this.config = await this.storeManager.readJSON(this.configFile);
      console.log('Loaded existing window config:', this.config);
    } catch (error) {
      // Create default config if it doesn't exist
      this.config = {
        x: null, // null = center
        y: null, // null = center
        width: 1200,
        height: 800,
        maximized: false,
        fullscreen: false,
        minimized: false
      };

      // Save default config
      await this.storeManager.writeJSON(this.configFile, this.config);
      console.log('Created default window config:', this.config);
    }
  }

  /**
   * Set up window event listeners for auto-saving state changes
   * This should be called after the window is created
   */
  setupWindowListeners() {
    console.log('WindowManager: Setting up window event listeners...');

    if (!this.app || !this.app.mainWindow) {
      console.warn('WindowManager: No main window available for event listeners');
      return;
    }

    console.log('WindowManager: Main window found, attaching listeners...');

    const window = this.app.mainWindow;

    // Save position and size when window is moved or resized
    window.on('move', () => {
      console.log('WindowManager: Window moved event');
      if (!this.isApplyingState && !window.isMaximized() && !window.isFullScreen()) {
        this.saveCurrentState();
      }
    });

    window.on('resize', () => {
      console.log('WindowManager: Window resized event');
      if (!this.isApplyingState && !window.isMaximized() && !window.isFullScreen()) {
        this.saveCurrentState();
      }
    });

    // Save state when maximized/minimized/fullscreen changes
    window.on('maximize', () => {
      console.log('WindowManager: Window maximized event');
      if (!this.isApplyingState) {
        this.config.maximized = true;
        this.config.fullscreen = false;
        this.saveConfig();
      }
    });

    window.on('unmaximize', () => {
      console.log('WindowManager: Window unmaximized event');
      if (!this.isApplyingState) {
        this.config.maximized = false;
        this.saveConfig();
      }
    });

    window.on('enter-full-screen', () => {
      console.log('WindowManager: Window entered fullscreen event');
      if (!this.isApplyingState) {
        this.config.fullscreen = true;
        this.config.maximized = false;
        this.saveConfig();
      }
    });

    window.on('leave-full-screen', () => {
      console.log('WindowManager: Window left fullscreen event');
      if (!this.isApplyingState) {
        this.config.fullscreen = false;
        this.saveConfig();
      }
    });

    window.on('minimize', () => {
      console.log('WindowManager: Window minimized event');
      if (!this.isApplyingState) {
        this.config.minimized = true;
        this.saveConfig();
      }
    });

    window.on('restore', () => {
      console.log('WindowManager: Window restored event');
      if (!this.isApplyingState) {
        this.config.minimized = false;
        this.saveConfig();
      }
    });
  }

  /**
   * Save the current window state to config
   */
  async saveCurrentState() {
    if (!this.app || !this.app.mainWindow) return;

    const window = this.app.mainWindow;
    const bounds = window.getBounds();

    // Only save position/size if not maximized or fullscreen
    if (!window.isMaximized() && !window.isFullScreen()) {
      this.config.x = bounds.x;
      this.config.y = bounds.y;
      this.config.width = bounds.width;
      this.config.height = bounds.height;
    }

    this.config.maximized = window.isMaximized();
    this.config.fullscreen = window.isFullScreen();
    this.config.minimized = window.isMinimized();

    await this.saveConfig();
  }

  /**
   * Save config to file
   */
  async saveConfig() {
    console.log('Saving window config:', this.config);
    try {
      await this.storeManager.writeJSON(this.configFile, this.config);
    } catch (error) {
      console.error('Failed to save window config:', error);
    }
  }

  /**
   * Apply saved window state to the current window
   */
  async applySavedState() {
    if (!this.app || !this.app.mainWindow || !this.isInitialized) {
      console.warn('WindowManager: Cannot apply saved state - not initialized or no window');
      return;
    }

    const window = this.app.mainWindow;

    try {
      console.log('WindowManager: Applying saved state:', this.config);

      // Set flag to prevent event listeners from saving during state application
      this.isApplyingState = true;

      // Validate position is reasonable (not off-screen)
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
          console.log('WindowManager: Setting bounds to saved position');
          window.setBounds({
            x: this.config.x,
            y: this.config.y,
            width: this.config.width,
            height: this.config.height
          });
        } else {
          console.log('WindowManager: Saved position is off-screen, centering instead');
          window.center();
          window.setSize(this.config.width, this.config.height);
        }
      } else {
        console.log('WindowManager: No saved position, centering window');
        window.center();
        window.setSize(this.config.width, this.config.height);
      }

      // Apply window states (maximize after positioning to avoid conflicts)
      if (this.config.maximized && !this.config.fullscreen) {
        console.log('WindowManager: Maximizing window');
        // Small delay to ensure positioning is complete
        setTimeout(() => {
          window.maximize();
          this.isApplyingState = false;
          console.log('WindowManager: State application complete');
        }, 100);
      } else if (this.config.fullscreen) {
        console.log('WindowManager: Setting fullscreen');
        setTimeout(() => {
          window.setFullScreen(true);
          this.isApplyingState = false;
          console.log('WindowManager: State application complete');
        }, 100);
      } else if (this.config.minimized) {
        console.log('WindowManager: Minimizing window');
        setTimeout(() => {
          window.minimize();
          this.isApplyingState = false;
          console.log('WindowManager: State application complete');
        }, 100);
      } else {
        // No special state to apply
        this.isApplyingState = false;
        console.log('WindowManager: State application complete');
      }

    } catch (error) {
      this.isApplyingState = false;
      console.error('WindowManager: Failed to apply saved window state:', error);
    }
  }

  // ===== WINDOW STATE GETTERS =====

  /**
   * Get current window position
   * @returns {Object} {x, y}
   */
  getPosition() {
    if (!this.app || !this.app.mainWindow) return null;
    const bounds = this.app.mainWindow.getBounds();
    return { x: bounds.x, y: bounds.y };
  }

  /**
   * Get current window size
   * @returns {Object} {width, height}
   */
  getSize() {
    if (!this.app || !this.app.mainWindow) return null;
    const bounds = this.app.mainWindow.getBounds();
    return { width: bounds.width, height: bounds.height };
  }

  /**
   * Check if window is maximized
   * @returns {boolean}
   */
  isMaximized() {
    if (!this.app || !this.app.mainWindow) return false;
    return this.app.mainWindow.isMaximized();
  }

  /**
   * Check if window is fullscreen
   * @returns {boolean}
   */
  isFullscreen() {
    if (!this.app || !this.app.mainWindow) return false;
    return this.app.mainWindow.isFullScreen();
  }

  /**
   * Check if window is minimized
   * @returns {boolean}
   */
  isMinimized() {
    if (!this.app || !this.app.mainWindow) return false;
    return this.app.mainWindow.isMinimized();
  }

  /**
   * Get all window state information
   * @returns {Object}
   */
  getWindowState() {
    return {
      position: this.getPosition(),
      size: this.getSize(),
      maximized: this.isMaximized(),
      fullscreen: this.isFullscreen(),
      minimized: this.isMinimized()
    };
  }

  // ===== WINDOW STATE SETTERS =====

  /**
   * Set window position
   * @param {number} x
   * @param {number} y
   */
  setPosition(x, y) {
    if (!this.app || !this.app.mainWindow) return;
    this.app.mainWindow.setPosition(x, y);
    // State will be auto-saved by event listeners
  }

  /**
   * Set window size
   * @param {number} width
   * @param {number} height
   */
  setSize(width, height) {
    if (!this.app || !this.app.mainWindow) return;
    this.app.mainWindow.setSize(width, height);
    // State will be auto-saved by event listeners
  }

  /**
   * Maximize the window
   */
  maximize() {
    if (!this.app || !this.app.mainWindow) return;
    this.app.mainWindow.maximize();
    // State will be auto-saved by event listeners
  }

  /**
   * Unmaximize the window
   */
  unmaximize() {
    if (!this.app || !this.app.mainWindow) return;
    this.app.mainWindow.unmaximize();
    // State will be auto-saved by event listeners
  }

  /**
   * Toggle fullscreen mode
   */
  toggleFullscreen() {
    if (!this.app || !this.app.mainWindow) return;
    const isFullscreen = this.app.mainWindow.isFullScreen();
    this.app.mainWindow.setFullScreen(!isFullscreen);
    // State will be auto-saved by event listeners
  }

  /**
   * Set fullscreen mode
   * @param {boolean} fullscreen
   */
  setFullscreen(fullscreen) {
    if (!this.app || !this.app.mainWindow) return;
    this.app.mainWindow.setFullScreen(fullscreen);
    // State will be auto-saved by event listeners
  }

  /**
   * Minimize the window
   */
  minimize() {
    if (!this.app || !this.app.mainWindow) return;
    this.app.mainWindow.minimize();
    // State will be auto-saved by event listeners
  }

  /**
   * Restore the window (unminimize)
   */
  restore() {
    if (!this.app || !this.app.mainWindow) return;
    this.app.mainWindow.restore();
    // State will be auto-saved by event listeners
  }

  /**
   * Center the window on screen
   */
  center() {
    if (!this.app || !this.app.mainWindow) return;
    this.app.mainWindow.center();
    // State will be auto-saved by event listeners
  }

  /**
   * Define preload API configuration for the window manager
   */
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
}

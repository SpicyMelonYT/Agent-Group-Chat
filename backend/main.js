import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { MainApp } from "./app.js";

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Keep a global reference of the window object
let mainWindow;

// Create the main application instance
const mainApp = new MainApp();

/**
 * Register IPC handlers based on manager preload APIs
 */
function registerIpcHandlers() {
  console.log('Main: Collecting preload APIs from managers...');
  // Collect preload APIs from all managers
  mainApp.collectPreloadAPIs();

  console.log('Main: Registering IPC handlers...');
  // Register IPC handlers for each manager's API
  for (const managerAPI of mainApp.preloadAPIs) {
    console.log(`Main: Processing API for ${managerAPI.name}...`);
    for (const [methodName, config] of Object.entries(managerAPI.api)) {
      if (config && typeof config === 'object' && config.channel) {
        console.log(`Main: Registering handler for ${config.channel} -> ${managerAPI.name}.${methodName}`);
        // Register the IPC handler for this channel
        ipcMain.handle(config.channel, async (event, ...args) => {
          // Find the manager and call the appropriate method
          const manager = mainApp.managers.find(m => m.constructor.name === managerAPI.name);
          if (manager && typeof manager[methodName] === 'function') {
            console.log(`Main: Calling ${managerAPI.name}.${methodName} with args:`, args);
            return await manager[methodName](...args);
          }
          throw new Error(`Method ${methodName} not found on manager ${managerAPI.name}`);
        });
      }
    }
  }

  console.log('Main: IPC handlers registered successfully');
}

function createWindow(savedConfig = null) {
  // Prepare window options based on saved config
  const windowOptions = {
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
  };

  // Apply saved configuration if available
  if (savedConfig) {
    console.log('Main: Creating window with saved config:', savedConfig);

    // Set size (always apply)
    windowOptions.width = savedConfig.width || 1200;
    windowOptions.height = savedConfig.height || 800;

    // Set position only if it's valid and on-screen
    if (savedConfig.x !== null && savedConfig.y !== null) {
      // Quick validation - check if position is reasonable
      if (savedConfig.x >= -10000 && savedConfig.x <= 10000 &&
          savedConfig.y >= -10000 && savedConfig.y <= 10000) {
        windowOptions.x = savedConfig.x;
        windowOptions.y = savedConfig.y;
        console.log('Main: Using saved position:', savedConfig.x, savedConfig.y);
      } else {
        console.log('Main: Saved position seems invalid, centering window');
      }
    }

    // Don't set maximized/minimized/fullscreen in constructor
    // These will be applied after window creation to avoid conflicts
  } else {
    // Default size if no saved config
    windowOptions.width = 1200;
    windowOptions.height = 800;
    console.log('Main: Creating window with default size');
  }

  // Create the browser window
  mainWindow = new BrowserWindow(windowOptions);

  // Load the main HTML file
  mainWindow.loadFile(
    path.join(__dirname, "../frontend/sections/main/index.html")
  );

  // Apply state-based options after window is created
  if (savedConfig) {
    // Apply states that can't be set in constructor
    if (savedConfig.maximized && !savedConfig.fullscreen) {
      console.log('Main: Maximizing window after creation');
      mainWindow.maximize();
    }

    if (savedConfig.fullscreen) {
      console.log('Main: Setting fullscreen after creation');
      mainWindow.setFullScreen(true);
    }

    if (savedConfig.minimized) {
      console.log('Main: Minimizing window after creation');
      mainWindow.minimize();
    }
  }

  // Open DevTools in development
  if (process.argv.includes("--dev")) {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  console.log('Main: Electron app ready, starting initialization...');

  // Initialize managers before creating the window
  console.log('Main: Initializing managers...');
  await mainApp.init();

  // Register IPC handlers for all managers
  console.log('Main: Registering IPC handlers...');
  registerIpcHandlers();

  // Register a special IPC handler for preload script to get API configs
  ipcMain.on('get-manager-api-configs', (event) => {
    try {
      console.log('Main: Sending manager API configs to preload');
      event.returnValue = mainApp.preloadAPIs || [];
    } catch (error) {
      console.error('Main: Failed to send manager API configs:', error);
      event.returnValue = [];
    }
  });

  // Get saved window config from WindowManager before creating window
  console.log('Main: Getting saved window config...');
  const windowManager = mainApp.managers.find(m => m.constructor.name === 'WindowManager');
  let savedConfig = null;

  if (windowManager && windowManager.config) {
    savedConfig = windowManager.config;
    console.log('Main: Using saved window config:', savedConfig);
  } else {
    console.log('Main: No saved window config found, using defaults');
  }

  // Create the main window with saved config
  console.log('Main: Creating window...');
  createWindow(savedConfig);

  // Set the main window reference in the app for managers to use
  mainApp.setMainWindow(mainWindow);

  // Set up window event listeners now that window exists
  console.log('Main: Setting up window event listeners...');
  if (windowManager) {
    console.log('Main: WindowManager found, setting up listeners...');
    windowManager.setupWindowListeners();
  } else {
    console.error('Main: WindowManager not found!');
  }

  app.on("activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Handle hot reload signal from watch process
process.on('SIGUSR1', () => {
  if (mainWindow) {
    console.log('🔄 Hot reload triggered - reloading window...');
    mainWindow.reload();
  }
});

// Quit when all windows are closed, except on macOS
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

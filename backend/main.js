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

function createWindow(windowManager = null) {
  // Prepare window options; keep window hidden until state is applied
  const windowOptions = {
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
  };

  // Create the browser window
  mainWindow = new BrowserWindow(windowOptions);

  // Load the main HTML file
  mainWindow.loadFile(
    path.join(__dirname, "../frontend/sections/main/index.html")
  );

  // Apply saved state before showing the window to avoid flicker
  mainWindow.once("ready-to-show", async () => {
    if (windowManager) {
      console.log('Main: Applying saved window state before showing...');
      await windowManager.applySavedState();
    }

    mainWindow.show();

    // Open DevTools in development
    if (process.argv.includes("--dev")) {
      mainWindow.webContents.openDevTools();
    }
  });

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

  // Get WindowManager reference
  console.log('Main: Getting WindowManager instance...');
  const windowManager = mainApp.managers.find(m => m.constructor.name === 'WindowManager');

  // Create the main window (state will be applied before showing)
  console.log('Main: Creating window...');
  createWindow(windowManager);

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
      createWindow(windowManager);
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

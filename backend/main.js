import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { MainApp } from "./app.js";
import { Logger } from "./core/logging.js";

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Keep a global reference of the window object
let mainWindow;

// Create the main application instance
const mainApp = new MainApp();

// Create logger instance for main process
const logger = new Logger();

// Make logger globally available for backend code
global.logger = logger;

/**
 * Register IPC handlers based on manager preload APIs
 */
function registerIpcHandlers() {
  // Collect preload APIs from all managers
  mainApp.collectPreloadAPIs();

  // Register IPC handlers for each manager's API
  for (const managerAPI of mainApp.preloadAPIs) {
    for (const [methodName, config] of Object.entries(managerAPI.api)) {
      if (config && typeof config === 'object' && config.channel) {
        // Register the IPC handler for this channel
        ipcMain.handle(config.channel, async (event, ...args) => {
          // Find the manager and call the appropriate method
          const manager = mainApp.managers.find(m => m.constructor.name === managerAPI.name);
          if (manager && typeof manager[methodName] === 'function') {
            return await manager[methodName](...args);
          }
          throw new Error(`Method ${methodName} not found on manager ${managerAPI.name}`);
        });
      }
    }
  }
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

// Configure electron-reload for frontend hot reloading (development only)
if (process.argv.includes("--dev")) {
  try {
    const electronReload = require("electron-reload");
    const frontendPath = path.join(__dirname, "../frontend");
    electronReload(frontendPath, {
      hardResetMethod: "exit",
      forceHardReset: false,
    });
    logger.log({
      tags: "main|dev|hot-reload",
      color1: "cyan"
    }, "Frontend hot reloading enabled for development");
  } catch (error) {
    logger.warn({
      tags: "main|dev|hot-reload|error",
      color1: "yellow",
      color2: "orange"
    }, `Hot reloading not available: ${error?.message || error}`);
  }
}

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  // Initialize managers before creating the window
  await mainApp.init();

  // Register IPC handlers for all managers
  registerIpcHandlers();

  // Register a special IPC handler for preload script to get API configs
  ipcMain.on('get-manager-api-configs', (event) => {
    try {
      event.returnValue = mainApp.preloadAPIs || [];
    } catch (error) {
      logger.error({
        tags: "main|ipc|preload|error",
        color1: "red",
        color2: "orange"
      }, "Failed to send manager API configs:", error);
      event.returnValue = [];
    }
  });

  // Get WindowManager reference
  const windowManager = mainApp.managers.find(m => m.constructor.name === 'WindowManager');

  // Create the main window (state will be applied before showing)
  createWindow(windowManager);

  // Set the main window reference in the app for managers to use
  mainApp.setMainWindow(mainWindow);

  // Set up window event listeners now that window exists
  if (windowManager) {
    windowManager.setupWindowListeners();
  } else {
    logger.error({
      tags: "main|window|manager|error",
      color1: "red",
      color2: "orange",
      includeSource: true
    }, "WindowManager not found!");
  }

  app.on("activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(windowManager);
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

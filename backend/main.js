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
 * Register IPC handlers for all manager endpoints
 */
function registerIpcHandlers() {
  const endpoints = mainApp.getIpcEndpoints();

  // Special handler for preload to get endpoints
  ipcMain.handle('getIpcEndpoints', () => {
    return endpoints;
  });

  for (const [endpointName, config] of Object.entries(endpoints)) {
    const { type, handler } = config;

    switch (type) {
      case 'invoke':
        // Frontend calls backend, returns result
        ipcMain.handle(endpointName, async (event, ...args) => {
          return await handler(...args);
        });
        break;

      case 'handle':
        // Frontend calls backend, no return
        ipcMain.on(endpointName, async (event, ...args) => {
          await handler(...args);
        });
        break;

      case 'send':
        // Backend sends to frontend - this will be handled by managers directly
        // They can use mainWindow.webContents.send(config.channel, data)
        break;

      case 'request':
        // Backend requests from frontend - this will be handled by managers directly
        // They can use mainWindow.webContents.send(config.channel, data) and listen for response
        break;
    }
  }
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  // Load the main HTML file
  mainWindow.loadFile(
    path.join(__dirname, "../frontend/sections/main/index.html")
  );

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
  // Initialize managers before creating the window
  await mainApp.init();

  // Register IPC handlers for all managers
  registerIpcHandlers();

  // Create the main window
  createWindow();

  // Set the main window reference in the app for managers to use
  mainApp.setMainWindow(mainWindow);

  app.on("activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

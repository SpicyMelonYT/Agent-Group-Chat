const { contextBridge, ipcRenderer } = require("electron");

// Get the manager-defined API configurations from the main process
const managerAPIConfigs = ipcRenderer.sendSync("get-manager-api-configs");

// Expose core Electron APIs
contextBridge.exposeInMainWorld("electronAPI", {
  // Core Electron APIs
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
});

// Store active file watchers
const activeWatchers = new Map();

// Expose each manager's API with nicer naming
for (const managerConfig of managerAPIConfigs) {
  if (managerConfig && managerConfig.name && managerConfig.api) {
    // Create the API functions for this manager
    const managerAPIs = {};
    for (const [apiName, config] of Object.entries(managerConfig.api)) {
      if (config && typeof config === "object") {
        if (config.type === "eventListener") {
          // Create an event listener function
          managerAPIs[apiName] = (callback) => {
            const listener = (event, ...args) => callback(...args);
            ipcRenderer.on(config.eventChannel, listener);
            // Return cleanup function
            return () =>
              ipcRenderer.removeListener(config.eventChannel, listener);
          };
        } else if (config.channel) {
          // Create a function that calls ipcRenderer.invoke with the specified channel
          managerAPIs[apiName] = async (...args) => {
            return await ipcRenderer.invoke(config.channel, ...args);
          };
        } else {
          // Expose data directly (not an IPC function)
          managerAPIs[apiName] = config;
        }
      } else {
        // Expose data directly (not an IPC function)
        managerAPIs[apiName] = config;
      }
    }

    // Add file watching functions for managers that support it
    if (managerConfig.api.watchFile && managerConfig.api.unwatchFile) {
      // Generate unique watcher ID
      let watcherCounter = 0;

      managerAPIs.watchFile = async (filePath, asyncCallback) => {
        watcherCounter++;
        const watcherId = `watcher_${Date.now()}_${watcherCounter}`;

        // Register the watcher with the backend
        await managerAPIs.watchFile(filePath, watcherId);

        // Set up listener for watcher events
        const listener = async (event, changeData) => {
          try {
            // Call the frontend's async callback
            await asyncCallback(changeData);
          } catch (error) {
            console.error(
              `Error in file watcher callback for ${filePath}:`,
              error
            );
          }
        };

        ipcRenderer.on(`storeWatcher:${watcherId}`, listener);
        activeWatchers.set(watcherId, { filePath, listener });

        // Return cleanup function
        return () => {
          ipcRenderer.removeListener(`storeWatcher:${watcherId}`, listener);
          activeWatchers.delete(watcherId);
          // Also notify backend to unwatch
          managerAPIs.unwatchFile(filePath).catch(console.error);
        };
      };
    }

    // Expose this manager's API with nicer naming (lowercase + API suffix)
    const apiName =
      managerConfig.name.toLowerCase().replace("manager", "") + "API";
    contextBridge.exposeInMainWorld(apiName, managerAPIs);
  }
}

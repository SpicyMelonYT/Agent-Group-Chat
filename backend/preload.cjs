const { contextBridge, ipcRenderer } = require('electron');

/**
 * Get IPC endpoints from the main process
 */
async function getIpcEndpoints() {
  try {
    return await ipcRenderer.invoke('getIpcEndpoints');
  } catch (error) {
    console.error('Failed to get IPC endpoints:', error);
    return {};
  }
}

/**
 * Build the manager API object dynamically from IPC endpoints
 */
function buildManagerAPI(endpoints) {
  const managerAPI = {};

  for (const [endpointName, config] of Object.entries(endpoints)) {
    const { type, managerName, endpointName: methodName } = config;

    // Create manager namespace if it doesn't exist
    if (!managerAPI[managerName]) {
      managerAPI[managerName] = {};
    }

    // Add the endpoint based on its type
    switch (type) {
      case 'invoke':
        // Frontend calls backend, returns result
        managerAPI[managerName][methodName] = async (...args) => {
          return await ipcRenderer.invoke(endpointName, ...args);
        };
        break;

      case 'handle':
        // Frontend calls backend, no return
        managerAPI[managerName][methodName] = (...args) => {
          ipcRenderer.send(endpointName, ...args);
        };
        break;

      case 'send':
        // Backend sends to frontend - expose listener registration
        managerAPI[managerName][`on${methodName.charAt(0).toUpperCase() + methodName.slice(1)}`] = (callback) => {
          ipcRenderer.on(config.channel || endpointName, (event, ...args) => {
            callback(...args);
          });
        };
        break;

      case 'request':
        // Backend requests from frontend - expose response sender
        managerAPI[managerName][methodName] = (data) => {
          ipcRenderer.send(config.channel || endpointName, data);
        };
        break;
    }
  }

  return managerAPI;
}

// Initialize the preload API
(async () => {
  const endpoints = await getIpcEndpoints();
  const managerAPI = buildManagerAPI(endpoints);

  // Expose the dynamically built manager API
  contextBridge.exposeInMainWorld('managers', managerAPI);

  // Expose a simple API for the application
  contextBridge.exposeInMainWorld('appAPI', {
    // Platform information
    platform: process.platform,

    // Version information
    versions: {
      node: process.versions.node,
      chrome: process.versions.chrome,
      electron: process.versions.electron
    }
  });
})();

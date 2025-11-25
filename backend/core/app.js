import { Manager } from "./manager.js";

/**
 * Base application class that manages managers.
 */
export class App {
  constructor() {
    /** @type {Manager[]} */
    this.managers = [];
    /** @type {import('electron').BrowserWindow} */
    this.mainWindow = null;
  }

  /**
   * Add a manager to the application.
   * @param {Manager} manager
   * @returns {Manager}
   */
  addManager(manager) {
    this.managers.push(manager);
    manager.app = this;
    return manager;
  }

  /**
   * Remove a manager from the application.
   * @param {Manager} manager
   * @returns {Manager}
   */
  removeManager(manager) {
    this.managers = this.managers.filter((m) => m !== manager);
    manager.app = null;
    return manager;
  }

  /**
   * Initialize all managers.
   * @returns {Promise<void>}
   */
  async initManagers() {
    for (const manager of this.managers) {
      await manager.init();
    }
  }

  /**
   * Set the main window reference for IPC communication
   * @param {import('electron').BrowserWindow} window
   */
  setMainWindow(window) {
    this.mainWindow = window;
  }

  /**
   * Get all IPC endpoints from all managers.
   * @returns {Object} Consolidated IPC endpoints
   */
  getIpcEndpoints() {
    const allEndpoints = {};

    for (const manager of this.managers) {
      const managerEndpoints = manager.getIpcEndpoints();

      // Merge endpoints, with manager name as prefix to avoid conflicts
      const managerName = manager.constructor.name;
      for (const [endpointName, config] of Object.entries(managerEndpoints)) {
        const fullEndpointName = `${managerName}:${endpointName}`;
        allEndpoints[fullEndpointName] = {
          ...config,
          manager: manager,
          managerName: managerName,
          endpointName: endpointName
        };
      }
    }

    return allEndpoints;
  }

  /**
   * Initialize the application.
   * Override this method in subclasses to add managers and call initManagers.
   * @returns {Promise<void>}
   */
  async init() {
    // Override in subclass
  }
}

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
    /** @type {Object[]} */
    this.preloadAPIs = [];
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
   * Collect preload APIs from all initialized managers.
   */
  collectPreloadAPIs() {
    console.log('App: Collecting preload APIs...');
    this.preloadAPIs = [];

    for (const manager of this.managers) {
      try {
        console.log(`App: Processing manager ${manager.constructor.name}...`);
        if (typeof manager.initPreload === 'function') {
          const managerAPIConfig = manager.initPreload();
          if (
            managerAPIConfig &&
            typeof managerAPIConfig === 'object' &&
            managerAPIConfig.name &&
            managerAPIConfig.api
          ) {
            // Add manager API config to the array
            this.preloadAPIs.push(managerAPIConfig);
            console.log(
              `App: Collected preload API config from ${manager.constructor.name}: ${
                managerAPIConfig.name
              } with api: ${Object.keys(managerAPIConfig.api).join(', ')}`
            );
          } else {
            console.warn(`App: Invalid preload API config from ${manager.constructor.name}`);
          }
        } else {
          console.warn(`App: Manager ${manager.constructor.name} has no initPreload method`);
        }
      } catch (error) {
        console.error(
          `App: Failed to collect preload APIs from ${manager.constructor.name}:`,
          error
        );
      }
    }

    console.log(`App: Collected ${this.preloadAPIs.length} preload API configs`);
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

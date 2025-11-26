import { Manager } from "./manager.js";
import { Logger } from "./logging.js";

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
    /** @type {Logger} */
    this.logger = new Logger();
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
    this.logger.log({
      tags: "app|core|preload|api",
      color: "cyan",
      includeSource: true
    }, "Collecting preload APIs");
    this.preloadAPIs = [];

    for (const manager of this.managers) {
      try {
        this.logger.log({
          tags: "app|core|manager|preload",
          color: "blue"
        }, `Processing manager ${manager.constructor.name}`);
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
            this.logger.log({
              tags: "app|core|preload|api|success",
              color: "green"
            }, `Collected preload API config from ${manager.constructor.name}: ${
              managerAPIConfig.name
            } with api: ${Object.keys(managerAPIConfig.api).join(', ')}`);
          } else {
            this.logger.warn({
              tags: "app|core|preload|api|warning",
              color1: "yellow",
              color2: "orange"
            }, `Invalid preload API config from ${manager.constructor.name}`);
          }
        } else {
          this.logger.warn({
            tags: "app|core|preload|api|warning",
            color1: "yellow",
            color2: "orange"
          }, `Manager ${manager.constructor.name} has no initPreload method`);
        }
      } catch (error) {
        this.logger.error({
          tags: "app|core|preload|api|error",
          color1: "red",
          color2: "orange",
          includeSource: true
        }, `Failed to collect preload APIs from ${manager.constructor.name}:`, error);
      }
    }

    this.logger.log({
      tags: "app|core|preload|api|complete",
      color: "green"
    }, `Collected ${this.preloadAPIs.length} preload API configs`);
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

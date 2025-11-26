import { App } from "./core/app.js";
import { StoreManager } from "./managers/store-manager.js";
import { WindowManager } from "./managers/window-manager.js";

/**
 * Main application class that extends the base App and adds specific managers.
 */
export class MainApp extends App {
  constructor() {
    super();
  }

  /**
   * Initialize the application by adding managers and calling initManagers.
   * @returns {Promise<void>}
   */
  async init() {
    console.log('MainApp: Starting initialization...');

    // Add managers to the application (order matters - dependencies first)
    console.log('MainApp: Adding StoreManager...');
    this.addManager(new StoreManager());

    console.log('MainApp: Adding WindowManager...');
    this.addManager(new WindowManager());

    // Initialize all managers
    console.log('MainApp: Initializing all managers...');
    await this.initManagers();

    console.log('MainApp: Initialization complete');
  }
}

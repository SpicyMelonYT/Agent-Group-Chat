import { App } from "./core/app.js";
import { StoreManager } from "./managers/store-manager.js";

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
    // Add managers to the application
    this.addManager(new StoreManager());

    // Initialize all managers
    await this.initManagers();
  }
}

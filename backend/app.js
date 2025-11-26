import { App, Logger } from "./core/index.js";
import { StoreManager } from "./managers/store-manager.js";
import { WindowManager } from "./managers/window-manager.js";
import { SectionManager } from "./managers/section-manager.js";

/**
 * Main application class that extends the base App and adds specific managers.
 */
export class MainApp extends App {
  constructor() {
    super();
    this.logger = new Logger();
    // Make logger globally available for backend code
    global.logger = this.logger;
  }

  /**
   * Initialize the application by adding managers and calling initManagers.
   * @returns {Promise<void>}
   */
  async init() {
    this.logger.log(
      {
        tags: "app|main|init",
        color1: "cyan",
        includeSource: true,
      },
      "MainApp starting initialization"
    );

    // Add managers to the application (order matters - dependencies first)
    this.logger.log(
      {
        tags: "app|main|manager",
        color1: "blue",
      },
      "Adding StoreManager"
    );
    this.addManager(new StoreManager());

    this.logger.log(
      {
        tags: "app|main|manager",
        color1: "blue",
      },
      "Adding WindowManager"
    );
    this.addManager(new WindowManager());

    this.logger.log(
      {
        tags: "app|main|manager",
        color1: "blue",
      },
      "Adding SectionManager"
    );
    this.addManager(new SectionManager());

    // Initialize all managers
    this.logger.log(
      {
        tags: "app|main|manager|init",
        color1: "yellow",
      },
      "Initializing all managers"
    );
    await this.initManagers();

    this.logger.log(
      {
        tags: "app|main|init|success",
        color1: "green",
      },
      "MainApp initialization complete"
    );
  }
}

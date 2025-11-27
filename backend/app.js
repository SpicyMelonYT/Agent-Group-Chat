// Test comment for tag grouping
import { App, Logger } from "./core/index.js";
import { StoreManager } from "./managers/store-manager.js";
import { WindowManager } from "./managers/window-manager.js";
import { SectionManager } from "./managers/section-manager.js";
import { ComponentManager } from "./managers/component-manager.js";
import { NodeLlamaCppManager } from "./managers/node-llama-cpp-manager.js";

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
    global.logger.log(
      {
        tags: "app|main|init",
        color1: "cyan",
        includeSource: true,
      },
      "MainApp starting initialization"
    );

    // Add managers to the application (order matters - dependencies first)
    global.logger.log(
      {
        tags: "app|main|manager",
        color1: "blue",
      },
      "Adding All Managers..."
    );

    global.logger.log(
      {
        tags: "app|main|manager",
        color1: "blue",
        showTag: false,
      },
      "Adding StoreManager"
    );
    this.addManager(new StoreManager());

    global.logger.log(
      {
        tags: "app|main|manager",
        color1: "blue",
        showTag: false,
      },
      "Adding WindowManager"
    );
    this.addManager(new WindowManager());

    global.logger.log(
      {
        tags: "app|main|manager",
        color1: "blue",
        showTag: false,
      },
      "Adding SectionManager"
    );
    this.addManager(new SectionManager());

    global.logger.log(
      {
        tags: "app|main|manager",
        color1: "blue",
        showTag: false,
      },
      "Adding ComponentManager"
    );
    this.addManager(new ComponentManager());

    global.logger.log(
      {
        tags: "app|main|manager",
        color1: "blue",
        showTag: false,
      },
      "Adding NodeLlamaCppManager"
    );
    this.addManager(new NodeLlamaCppManager());

    // Initialize all managers
    global.logger.log(
      {
        tags: "app|main|manager|init",
        color1: "yellow",
      },
      "Initializing all managers"
    );
    await this.initManagers();

    global.logger.log(
      {
        tags: "app|main|init|success",
        color1: "green",
      },
      "MainApp initialization complete"
    );
  }
}

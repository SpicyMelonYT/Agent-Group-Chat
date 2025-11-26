import { Logger } from "./logger.js";
import { Manager } from "./manager.js";

export class Section {
  constructor() {
    this.managers = [];
    this.logger = new Logger();
    window.logger = this.logger;
    window.section = this;

    this.logger.log(
      {
        tags: "section",
        color1: "lime",
        includeSource: true,
        sourceDepth: 1,
        sourcePosition: "start",
      },
      `Section created: ${this.constructor.name}`
    );
  }

  /**
   * Adds a manager to the section.
   * @param {Manager} manager - The manager to add.
   * @returns {Manager} The added manager.
   */
  addManager(manager) {
    this.managers.push(manager);
    manager.section = this;
    return manager;
  }

  removeManager(manager) {
    this.managers = this.managers.filter((m) => m !== manager);
    manager.app = null;
    return manager;
  }

  async init() {
    this.logger.log(
      { tags: "section|manager", color: "cyan" },
      `Initializing managers...`
    );
    for (const manager of this.managers) {
      try {
        await manager.init();
        this.logger.log(
          { tags: "section|manager" },
          `[${manager.constructor.name}] initialized`
        );
      } catch (error) {
        this.logger.error(
          { tags: "section", color1: "red" },
          `Error initializing manager: ${manager.constructor.name}`,
          error
        );
      }
    }
  }
}

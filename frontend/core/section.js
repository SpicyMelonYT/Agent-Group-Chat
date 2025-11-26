import { Logger } from "./logger.js";

export class Section {
  constructor() {
    this.managers = [];
    this.logger = new Logger();
    window.logger = this.logger;
    window.section = this;

    this.logger.log(
      { tags: "section", color1: "lime" },
      `Section created: ${this.constructor.name}`
    );
  }

  addManager(manager) {
    this.managers.push(manager);
    manager.app = this;
    return manager;
  }

  removeManager(manager) {
    this.managers = this.managers.filter((m) => m !== manager);
    manager.app = null;
    return manager;
  }

  async init() {
    for (const manager of this.managers) {
      await manager.init();
    }
  }
}

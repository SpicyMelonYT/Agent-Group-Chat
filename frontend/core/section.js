import { Logger } from "./logger.js";

export class Section {
  constructor() {
    this.logger = new Logger();
    this.managers = [];
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

import { Section } from "./section.js";

export class Manager {
  constructor() {
    /** @type {Section} */
    this.section = null;
  }

  async init() {
    await this.initGlobalVariables();
    await this.initElementReferences();
    await this.initEventListeners();
    await this.initStates();
  }

  /**
   * Override this method in the subclass to initialize global variables.
   */
  async initGlobalVariables() {}

  /**
   * Override this method in the subclass to initialize element references.
   */
  async initElementReferences() {}

  /**
   * Override this method in the subclass to initialize event listeners.
   */
  async initEventListeners() {}

  /**
   * Override this method in the subclass to initialize states.
   */
  async initStates() {}
}

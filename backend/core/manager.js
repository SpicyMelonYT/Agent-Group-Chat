import { App } from "./app.js";

export class Manager {
  constructor() {
    /** @type {App} */
    this.app = null;
  }

  async init() {
    // Override this method in the subclass to initialize the manager.
  }

  /**
   * Define preload API configuration for this manager.
   * Override this method in subclasses to return API configuration for the preload script.
   *
   * @returns {Object} Preload API configuration
   */
  initPreload() {
    return {
      name: this.constructor.name,
      api: {
        // Example format:
        // 'methodName': {
        //   channel: 'ipc-channel-name', // for invoke/handle
        //   type: 'eventListener', eventChannel: 'event-channel' // for events
        // }
      },
    };
  }
}

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
   * Define IPC endpoints for this manager.
   * Override this method in subclasses to return IPC endpoint definitions.
   *
   * Supported endpoint types:
   * - 'invoke': Frontend calls backend, backend returns result (async)
   * - 'handle': Frontend calls backend, backend handles without return
   * - 'send': Backend sends to frontend (no response expected)
   * - 'request': Backend requests data from frontend (waits for response)
   *
   * @returns {Object} IPC endpoint definitions
   */
  getIpcEndpoints() {
    return {
      // Example format:
      // 'endpointName': {
      //   type: 'invoke', // 'invoke' | 'handle' | 'send' | 'request'
      //   handler: this.myHandlerMethod.bind(this) // for invoke/handle
      //   channel: 'channelName' // for send/request
      // }
    };
  }
}

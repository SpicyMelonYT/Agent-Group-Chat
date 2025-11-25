import { Manager } from "../core/index.js";

export class StoreManager extends Manager {
  constructor() {
    super();
    this.store = new Map(); // Simple in-memory store for demonstration
  }

  async init() {
    // Initialize the store manager
    console.log('StoreManager initialized');
  }

  /**
   * Define IPC endpoints for the store manager
   */
  getIpcEndpoints() {
    return {
      // Frontend calls backend, returns result (async)
      'get': {
        type: 'invoke',
        handler: this.getValue.bind(this)
      },

      // Frontend calls backend, no return
      'set': {
        type: 'handle',
        handler: this.setValue.bind(this)
      },

      // Backend sends notifications to frontend
      'notify': {
        type: 'send',
        channel: 'storeNotification'
      },

      // Backend can request data from frontend
      'requestUserConfirmation': {
        type: 'request',
        channel: 'storeUserConfirmation'
      }
    };
  }

  /**
   * Get a value from the store
   * @param {string} key
   * @returns {any}
   */
  async getValue(key) {
    console.log(`Getting value for key: ${key}`);
    return this.store.get(key);
  }

  /**
   * Set a value in the store
   * @param {string} key
   * @param {any} value
   */
  async setValue(key, value) {
    console.log(`Setting value for key: ${key}`, value);
    this.store.set(key, value);

    // Send notification to frontend when a value is set
    if (this.app && this.app.mainWindow) {
      this.app.mainWindow.webContents.send('storeNotification', {
        action: 'set',
        key,
        value
      });
    }
  }

  /**
   * Example method to demonstrate backend-initiated communication
   */
  notifyFrontend(message) {
    if (this.app && this.app.mainWindow) {
      this.app.mainWindow.webContents.send('storeNotification', {
        action: 'notification',
        message
      });
    }
  }
}

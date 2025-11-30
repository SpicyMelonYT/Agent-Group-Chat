/**
 * Chat Settings Modal Component
 *
 * A modal component for chat settings that appears when the settings button is clicked.
 *
 * Usage Examples:
 *
 * // Basic usage (automatically managed by chat manager)
 * <chat-settings-modal></chat-settings-modal>
 *
 * // Programmatic control
 * const settingsModal = document.querySelector('chat-settings-modal');
 * settingsModal.open();  // Show settings
 * settingsModal.close(); // Hide settings
 *
 * Events:
 * - open: Fired when modal opens
 * - close: Fired when modal closes
 */
export class ChatSettingsModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          top: 0;
          left: 0;
          z-index: 100; /* Below loading overlay (10000) */
          display: none;
        }

        :host([open]) {
          display: block;
        }
      </style>

      <agc-modal id="settings-modal" width="500px" height="auto" backdrop-darken backdrop-blur>
        <div style="padding: 24px;">
          <h2 style="margin: 0 0 20px 0; color: #333; font-size: 24px;">Chat Settings</h2>

          <div style="display: flex; flex-direction: column; gap: 20px;">
            <!-- Model Settings -->
            <div style="border: 1px solid #ddd; border-radius: 8px; padding: 16px;">
              <h3 style="margin: 0 0 12px 0; color: #555; font-size: 16px;">Model Settings</h3>

              <div style="display: flex; flex-direction: column; gap: 12px;">
                <div>
                  <label style="display: block; margin-bottom: 4px; font-weight: 500; color: #333;">
                    Current Model
                  </label>
                  <div style="padding: 8px 12px; background: #f5f5f5; border-radius: 4px; color: #666;">
                    No model loaded
                  </div>
                </div>

                <div>
                  <label style="display: block; margin-bottom: 4px; font-weight: 500; color: #333;">
                    Load Model
                  </label>
                  <div style="display: flex; gap: 8px;">
                    <agc-button id="load-model-btn">Load Model</agc-button>
                    <agc-button id="unload-model-btn" disabled>Unload Model</agc-button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Chat Settings -->
            <div style="border: 1px solid #ddd; border-radius: 8px; padding: 16px;">
              <h3 style="margin: 0 0 12px 0; color: #555; font-size: 16px;">Chat Settings</h3>

              <div style="display: flex; flex-direction: column; gap: 12px;">
                <div>
                  <label style="display: block; margin-bottom: 4px; font-weight: 500; color: #333;">
                    Message History
                  </label>
                  <div style="display: flex; gap: 8px;">
                    <agc-button id="clear-history-btn">Clear History</agc-button>
                    <agc-button id="export-chat-btn">Export Chat</agc-button>
                  </div>
                </div>
              </div>
            </div>

            <!-- System Information -->
            <div style="border: 1px solid #ddd; border-radius: 8px; padding: 16px;">
              <h3 style="margin: 0 0 12px 0; color: #555; font-size: 16px;">System Information</h3>

              <div style="display: flex; flex-direction: column; gap: 8px;">
                <div style="font-size: 14px; color: #666;">
                  <strong>Llama.cpp:</strong> <span id="llama-status">Not initialized</span>
                </div>
                <div style="font-size: 14px; color: #666;">
                  <strong>VRAM:</strong> <span id="vram-info">Unknown</span>
                </div>
                <div style="font-size: 14px; color: #666;">
                  <strong>GPU:</strong> <span id="gpu-info">Unknown</span>
                </div>
              </div>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee;">
            <agc-button id="close-settings-btn">Close</agc-button>
          </div>
        </div>
      </agc-modal>
    `;

    this.setupEventListeners();
  }

  setupEventListeners() {
    const modal = this.shadowRoot.querySelector('#settings-modal');
    const closeBtn = this.shadowRoot.querySelector('#close-settings-btn');
    const loadModelBtn = this.shadowRoot.querySelector('#load-model-btn');
    const unloadModelBtn = this.shadowRoot.querySelector('#unload-model-btn');
    const clearHistoryBtn = this.shadowRoot.querySelector('#clear-history-btn');
    const exportChatBtn = this.shadowRoot.querySelector('#export-chat-btn');

    // Close button
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.close();
      });
    }

    // Load model button (placeholder for now)
    if (loadModelBtn) {
      loadModelBtn.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('load-model-request', {
          bubbles: true,
          composed: true
        }));
      });
    }

    // Unload model button (placeholder for now)
    if (unloadModelBtn) {
      unloadModelBtn.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('unload-model-request', {
          bubbles: true,
          composed: true
        }));
      });
    }

    // Clear history button
    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('clear-history-request', {
          bubbles: true,
          composed: true
        }));
      });
    }

    // Export chat button
    if (exportChatBtn) {
      exportChatBtn.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('export-chat-request', {
          bubbles: true,
          composed: true
        }));
      });
    }

    // Modal events
    if (modal) {
      modal.addEventListener('close', () => {
        this.dispatchEvent(new CustomEvent('close', {
          bubbles: true,
          composed: true
        }));
      });
    }
  }

  /**
   * Open the settings modal
   */
  open() {
    // Show the wrapper first
    this.setAttribute('open', '');

    const modal = this.shadowRoot?.querySelector('#settings-modal');
    if (modal) {
      // Use attribute-based control instead of method calls
      modal.setAttribute('open', '');
      this.dispatchEvent(new CustomEvent('open', {
        bubbles: true,
        composed: true
      }));
    }
  }

  /**
   * Close the settings modal
   */
  close() {
    const modal = this.shadowRoot?.querySelector('#settings-modal');
    if (modal) {
      // Use attribute-based control instead of method calls
      modal.removeAttribute('open');
    }

    // Hide the wrapper after modal closes
    this.removeAttribute('open');
  }

  /**
   * Update the model status display
   * @param {string} status - Status text to display
   */
  setModelStatus(status) {
    const statusEl = this.shadowRoot?.querySelector('#llama-status');
    if (statusEl) {
      statusEl.textContent = status;
    }
  }

  /**
   * Update the VRAM information display
   * @param {string} info - VRAM info to display
   */
  setVramInfo(info) {
    const vramEl = this.shadowRoot?.querySelector('#vram-info');
    if (vramEl) {
      vramEl.textContent = info;
    }
  }

  /**
   * Update the GPU information display
   * @param {string} info - GPU info to display
   */
  setGpuInfo(info) {
    const gpuEl = this.shadowRoot?.querySelector('#gpu-info');
    if (gpuEl) {
      gpuEl.textContent = info;
    }
  }
}

// Register the custom element
customElements.define("chat-settings-modal", ChatSettingsModal);

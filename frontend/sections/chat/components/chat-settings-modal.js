/**
 * Chat Settings Modal Component
 * 
 * A modal component for managing chat settings including:
 * - Model selection and loading
 * - Context configuration (allocation size, min/max context size)
 * - Chat history management
 * - System information display
 * 
 * Events:
 * - browse-model-request: Dispatched when browse button is clicked
 * - load-model-request: Dispatched when load model button is clicked (detail: { modelPath, contextAllocationSize, minContextSize, maxContextSize })
 * - unload-model-request: Dispatched when unload model button is clicked
 * - clear-history-request: Dispatched when clear history button is clicked
 * - export-chat-request: Dispatched when export chat button is clicked
 * - open: Dispatched when modal opens
 * - close: Dispatched when modal closes
 */
class ChatSettingsModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.listenersSetup = false;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    
    // Ensure progress bar is hidden by default
    const progressContainer = this.shadowRoot?.querySelector("#model-progress");
    if (progressContainer) {
      progressContainer.hidden = true;
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
        }

        :host([open]) {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .model-progress {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 12px;
          background: var(--bg-secondary, #1e1e1e);
          border: 1px solid var(--border-color, #2a2a2a);
          border-radius: 4px;
          margin-top: 8px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .model-progress:not([hidden]) {
          opacity: 1;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: var(--text-secondary, #cccccc);
        }

        .progress-bar {
          width: 100%;
          height: 6px;
          background: var(--bg-primary, #121212);
          border-radius: 3px;
          overflow: hidden;
          box-sizing: border-box;
        }

        .progress-bar-fill {
          display: block;
          width: 0%;
          height: 100%;
          background: linear-gradient(90deg, #4a9eff, #6bb6ff);
          border-radius: 3px;
          box-sizing: border-box;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          align-items: start;
        }

        @media (max-width: 900px) {
          .settings-grid {
            grid-template-columns: 1fr;
          }
        }

        .settings-column {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
      </style>

      <agc-modal id="settings-modal" width="900px">
        <div style="padding: 24px;">
          <h2 style="margin: 0 0 20px 0; color: var(--text-primary, #e0e0e0); font-size: 24px;">Chat Settings</h2>

          <div class="settings-grid">
            <!-- Left Column: Model Settings -->
            <div class="settings-column">
              <div style="border: 1px solid var(--border-color, #2a2a2a); border-radius: 8px; padding: 16px; background: var(--bg-primary, #121212);">
                <h3 style="margin: 0 0 12px 0; color: var(--text-secondary, #cccccc); font-size: 16px;">Model Settings</h3>

                <div style="display: flex; flex-direction: column; gap: 12px;">
                  <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500; color: var(--text-primary, #e0e0e0);">
                      Current Model
                    </label>
                    <div style="padding: 8px 12px; background: var(--bg-secondary, #1e1e1e); border-radius: 4px; color: var(--text-secondary, #cccccc);">
                      No model loaded
                    </div>
                  </div>

                  <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500; color: var(--text-primary, #e0e0e0);">
                      Model Path
                    </label>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                      <agc-input
                        id="model-path-input"
                        type="text"
                        placeholder="Select a .gguf model file..."
                        color1="hsl(0, 0%, 12%)"
                        color2="hsl(0, 0%, 20%)"
                        color3="hsl(200, 100%, 50%)"
                        radius="normal"
                        readonly
                        style="font-family: monospace; font-size: 12px;"
                      ></agc-input>
                      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <agc-button id="browse-model-btn">Browse...</agc-button>
                        <agc-button id="load-model-btn">Load Model</agc-button>
                        <agc-button id="unload-model-btn" disabled>Unload Model</agc-button>
                      </div>
                      <div class="model-progress" id="model-progress" hidden>
                        <div class="progress-header">
                          <span id="model-progress-label">Preparing load...</span>
                          <span id="model-progress-percent">0%</span>
                        </div>
                        <div class="progress-bar">
                          <div class="progress-bar-fill" id="model-progress-fill"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style="display: block; margin-bottom: 8px; font-weight: 500; color: var(--text-primary, #e0e0e0);">
                      Context Settings
                    </label>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                      <div>
                        <label style="display: block; margin-bottom: 4px; font-size: 13px; color: var(--text-secondary, #cccccc);">
                          Context Allocation Size
                        </label>
                        <agc-input
                          id="context-allocation-size-input"
                          type="number"
                          min="0"
                          step="1000"
                          color1="hsl(0, 0%, 12%)"
                          color2="hsl(0, 0%, 20%)"
                          color3="hsl(200, 100%, 50%)"
                          radius="normal"
                        ></agc-input>
                        <div style="font-size: 11px; color: var(--text-secondary, #999); margin-top: 2px;">
                          Memory reserved for context in VRAM (default: 32000)
                        </div>
                      </div>
                      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div>
                          <label style="display: block; margin-bottom: 4px; font-size: 13px; color: var(--text-secondary, #cccccc);">
                            Min Context Size
                          </label>
                          <agc-input
                            id="min-context-size-input"
                            type="number"
                            min="0"
                            step="1000"
                            color1="hsl(0, 0%, 12%)"
                            color2="hsl(0, 0%, 20%)"
                            color3="hsl(200, 100%, 50%)"
                            radius="normal"
                          ></agc-input>
                        </div>
                        <div>
                          <label style="display: block; margin-bottom: 4px; font-size: 13px; color: var(--text-secondary, #cccccc);">
                            Max Context Size
                          </label>
                          <agc-input
                            id="max-context-size-input"
                            type="number"
                            min="0"
                            step="1000"
                            color1="hsl(0, 0%, 12%)"
                            color2="hsl(0, 0%, 20%)"
                            color3="hsl(200, 100%, 50%)"
                            radius="normal"
                          ></agc-input>
                        </div>
                      </div>
                      <div style="font-size: 11px; color: var(--text-secondary, #999);">
                        Context size range (default: 16000 - 48000)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column: Chat Settings & System Information -->
            <div class="settings-column">
              <!-- Chat Settings -->
              <div style="border: 1px solid var(--border-color, #2a2a2a); border-radius: 8px; padding: 16px; background: var(--bg-primary, #121212);">
                <h3 style="margin: 0 0 12px 0; color: var(--text-secondary, #cccccc); font-size: 16px;">Chat Settings</h3>

                <div style="display: flex; flex-direction: column; gap: 12px;">
                  <div>
                    <label style="display: block; margin-bottom: 4px; font-weight: 500; color: var(--text-primary, #e0e0e0);">
                      Message History
                    </label>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                      <agc-button id="clear-history-btn">Clear History</agc-button>
                      <agc-button id="export-chat-btn">Export Chat</agc-button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- System Information -->
              <div style="border: 1px solid var(--border-color, #2a2a2a); border-radius: 8px; padding: 16px; background: var(--bg-primary, #121212);">
                <h3 style="margin: 0 0 12px 0; color: var(--text-secondary, #cccccc); font-size: 16px;">System Information</h3>

                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <div style="font-size: 14px; color: var(--text-secondary, #cccccc);">
                    <strong style="color: var(--text-primary, #e0e0e0);">Llama.cpp:</strong> <span id="llama-status">Not initialized</span>
                  </div>
                  <div style="font-size: 14px; color: var(--text-secondary, #cccccc);">
                    <strong style="color: var(--text-primary, #e0e0e0);">VRAM:</strong> <span id="vram-info">Unknown</span>
                  </div>
                  <div style="font-size: 14px; color: var(--text-primary, #e0e0e0);">
                    <strong style="color: var(--text-secondary, #cccccc);">GPU:</strong> <span id="gpu-info">Unknown</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-color, #2a2a2a);">
            <agc-button id="close-settings-btn">Close</agc-button>
          </div>
        </div>
      </agc-modal>
    `;
  }

  setupEventListeners() {
    // Prevent duplicate event listener setup
    if (this.listenersSetup) {
      return;
    }
    this.listenersSetup = true;

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

    // Browse model button
    if (this.shadowRoot.querySelector('#browse-model-btn')) {
      this.shadowRoot.querySelector('#browse-model-btn').addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('browse-model-request', {
          bubbles: false,
          composed: true
        }));
      });
    }

    // Load model button
    if (loadModelBtn) {
      loadModelBtn.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('load-model-request', {
          bubbles: false,
          composed: true,
          detail: {
            modelPath: this.getModelPath(),
            contextAllocationSize: this.getContextAllocationSize(),
            minContextSize: this.getMinContextSize(),
            maxContextSize: this.getMaxContextSize(),
          }
        }));
      });
    }

    // Unload model button
    if (unloadModelBtn) {
      unloadModelBtn.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('unload-model-request', {
          bubbles: false,
          composed: true
        }));
      });
    }

    // Clear history button
    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('clear-history-request', {
          bubbles: false,
          composed: true
        }));
      });
    }

    // Export chat button
    if (exportChatBtn) {
      exportChatBtn.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('export-chat-request', {
          bubbles: false,
          composed: true
        }));
      });
    }

    // Modal events - handle backdrop clicks and other modal close events
    if (modal) {
      modal.addEventListener('close', () => {
        // When modal closes via backdrop click or other internal means,
        // ensure our wrapper state is consistent
        this.removeAttribute('open');
        this.dispatchEvent(new CustomEvent('close', {
          bubbles: false,
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
      // Use the modal's open method for proper event handling
      modal.setAttribute('open', '');
      
      // Ensure progress bar is hidden when modal opens
      this.hideProgress();
      
      this.dispatchEvent(new CustomEvent('open', {
        bubbles: false,
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
      // Use the modal's close method to ensure proper event dispatching
      modal.removeAttribute('open');
    }

    // Hide the wrapper - the modal event listener will handle this
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

    // Update button states based on model status
    this.updateButtonStates(status);
  }

  /**
   * Update button states based on model status
   * @param {string} status - Current model status
   */
  updateButtonStates(status) {
    const loadBtn = this.shadowRoot?.querySelector('#load-model-btn');
    const unloadBtn = this.shadowRoot?.querySelector('#unload-model-btn');
    const normalized = (status || "").toLowerCase();

    // Check if model is actually loaded (not "no model loaded" or "unloaded")
    const isModelLoaded = normalized === "model loaded" || 
                         normalized === "loaded" ||
                         (normalized.includes("loaded") && 
                          !normalized.includes("no model") && 
                          !normalized.includes("unloaded") &&
                          !normalized.includes("failed"));

    if (isModelLoaded) {
      // Model is loaded - enable unload, disable load
      if (loadBtn) loadBtn.setAttribute('disabled', '');
      if (unloadBtn) unloadBtn.removeAttribute('disabled');
    } else {
      // Model is not loaded - enable load, disable unload
      if (loadBtn) loadBtn.removeAttribute('disabled');
      if (unloadBtn) unloadBtn.setAttribute('disabled', '');
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

  /**
   * Set the modal data from config
   * @param {Object} config - Configuration data
   */
  setConfigData(config = {}) {
    if (config.modelPath) {
      this.setModelPath(config.modelPath);
    }
    // Always set context settings - use config values or defaults
    this.setContextAllocationSize(
      typeof config.contextAllocationSize === "number" 
        ? config.contextAllocationSize 
        : 32000
    );
    this.setMinContextSize(
      typeof config.minContextSize === "number" 
        ? config.minContextSize 
        : 16000
    );
    this.setMaxContextSize(
      typeof config.maxContextSize === "number" 
        ? config.maxContextSize 
        : 48000
    );
  }

  /**
   * Apply backend model state payload
   * @param {Object} state - Backend state
   */
  applyModelState(state = {}) {
    if (state.modelPath) {
      this.setModelPath(state.modelPath);
    }

    if (typeof state.statusLabel === "string") {
      this.setModelStatus(state.statusLabel);
    } else if (typeof state.status === "string") {
      this.setModelStatus(state.status);
    }
  }

  /**
   * Get the current modal data for saving to config
   * @returns {Object} Configuration data
   */
  getConfigData() {
    return {
      modelPath: this.getModelPath(),
      contextAllocationSize: this.getContextAllocationSize(),
      minContextSize: this.getMinContextSize(),
      maxContextSize: this.getMaxContextSize(),
    };
  }

  /**
   * Set the model path in the input field
   * @param {string} path - Model file path
   */
  setModelPath(path) {
    const inputEl = this.shadowRoot?.querySelector('#model-path-input');
    if (inputEl && typeof inputEl.setValue === 'function') {
      inputEl.setValue(path || '');
    }
  }

  /**
   * Get the model path from the input field
   * @returns {string} Model file path
   */
  getModelPath() {
    const inputEl = this.shadowRoot?.querySelector('#model-path-input');
    if (inputEl && typeof inputEl.getValue === 'function') {
      return inputEl.getValue() || '';
    }
    return '';
  }

  /**
   * Set the context allocation size
   * @param {number} size - Allocation size
   */
  setContextAllocationSize(size) {
    const inputEl = this.shadowRoot?.querySelector('#context-allocation-size-input');
    if (inputEl && typeof inputEl.setValue === 'function') {
      inputEl.setValue(String(size || 32000));
    }
  }

  /**
   * Get the context allocation size
   * @returns {number} Allocation size
   */
  getContextAllocationSize() {
    const inputEl = this.shadowRoot?.querySelector('#context-allocation-size-input');
    if (inputEl && typeof inputEl.getValue === 'function') {
      return parseInt(inputEl.getValue()) || 32000;
    }
    return 32000;
  }

  /**
   * Set the minimum context size
   * @param {number} size - Minimum context size
   */
  setMinContextSize(size) {
    const inputEl = this.shadowRoot?.querySelector('#min-context-size-input');
    if (inputEl && typeof inputEl.setValue === 'function') {
      inputEl.setValue(String(size || 16000));
    }
  }

  /**
   * Get the minimum context size
   * @returns {number} Minimum context size
   */
  getMinContextSize() {
    const inputEl = this.shadowRoot?.querySelector('#min-context-size-input');
    if (inputEl && typeof inputEl.getValue === 'function') {
      return parseInt(inputEl.getValue()) || 16000;
    }
    return 16000;
  }

  /**
   * Set the maximum context size
   * @param {number} size - Maximum context size
   */
  setMaxContextSize(size) {
    const inputEl = this.shadowRoot?.querySelector('#max-context-size-input');
    if (inputEl && typeof inputEl.setValue === 'function') {
      inputEl.setValue(String(size || 48000));
    }
  }

  /**
   * Get the maximum context size
   * @returns {number} Maximum context size
   */
  getMaxContextSize() {
    const inputEl = this.shadowRoot?.querySelector('#max-context-size-input');
    if (inputEl && typeof inputEl.getValue === 'function') {
      return parseInt(inputEl.getValue()) || 48000;
    }
    return 48000;
  }

  /**
   * Get the current model status display text
   * @returns {string} Current model status
   */
  getModelStatus() {
    const statusEl = this.shadowRoot?.querySelector('#llama-status');
    return statusEl ? statusEl.textContent : 'Not initialized';
  }

  /**
   * Show the model loading progress UI
   * @param {string} label - Optional label text
   */
  showProgress(label = "Loading model...") {
    const container = this.shadowRoot?.querySelector("#model-progress");
    const labelEl = this.shadowRoot?.querySelector("#model-progress-label");
    const percentEl = this.shadowRoot?.querySelector("#model-progress-percent");
    const loadBtn = this.shadowRoot?.querySelector('#load-model-btn');
    const unloadBtn = this.shadowRoot?.querySelector('#unload-model-btn');

    if (container) {
      container.hidden = false;
      container.style.opacity = "1";
    }
    if (labelEl) {
      labelEl.textContent = label;
    }
    if (percentEl) {
      percentEl.textContent = "0%";
    }
    this.updateProgressFill(0);

    if (loadBtn) loadBtn.setAttribute("disabled", "");
    if (unloadBtn) unloadBtn.setAttribute("disabled", "");
  }

  /**
   * Update the progress indicator
   * @param {number} percentage - Progress percentage (0-100)
   * @param {string} label - Optional label text
   */
  updateProgress(percentage, label) {
    const container = this.shadowRoot?.querySelector("#model-progress");
    if (container && container.hidden) {
      container.hidden = false;
      container.style.opacity = "1";
    }

    if (typeof label === "string") {
      const labelEl = this.shadowRoot?.querySelector("#model-progress-label");
      if (labelEl) {
        labelEl.textContent = label;
      }
    }

    const clamped = Math.max(0, Math.min(100, Math.round(percentage || 0)));
    const percentEl = this.shadowRoot?.querySelector("#model-progress-percent");
    if (percentEl) {
      percentEl.textContent = `${clamped}%`;
    }
    this.updateProgressFill(clamped);
  }

  /**
   * Hide the progress UI
   * @param {string} statusLabel - Optional status label to set after hiding
   */
  hideProgress(statusLabel) {
    const container = this.shadowRoot?.querySelector("#model-progress");
    if (container) {
      container.hidden = true;
      container.style.opacity = "0";
    }

    // Reset progress to 0 when hiding
    this.updateProgressFill(0);
    const percentEl = this.shadowRoot?.querySelector("#model-progress-percent");
    if (percentEl) {
      percentEl.textContent = "0%";
    }

    // Only update button states if a status is provided
    // Otherwise, button states should be set by applyModelState
    if (typeof statusLabel === "string") {
      this.setModelStatus(statusLabel);
    }
  }

  /**
   * Update progress bar fill width instantly
   * @param {number} percentage - Progress percentage (0-100)
   */
  updateProgressFill(percentage) {
    const fill = this.shadowRoot?.querySelector("#model-progress-fill");
    if (fill) {
      // Match chat-interface approach: clamp and round, then set directly
      const clamped = Math.max(0, Math.min(100, Math.round(percentage || 0)));
      fill.style.width = `${clamped}%`;
    }
  }
}

// Register the custom element
customElements.define("chat-settings-modal", ChatSettingsModal);

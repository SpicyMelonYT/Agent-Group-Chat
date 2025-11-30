/**
 * AGC Modal Component
 *
 * A simple modal component with backdrop and configurable panel sizing.
 *
 * Attributes:
 * - open: Controls modal visibility (boolean attribute)
 * - width: Modal panel width (CSS length value, default: "400px")
 * - height: Modal panel height (CSS length value, default: "auto")
 * - backdrop-darken: Controls background darkening (boolean attribute)
 * - backdrop-blur: Controls background blur effect (boolean attribute)
 *
 * Usage Examples:
 *
 * // Basic usage
 * <agc-modal id="my-modal">
 *   <h2>Modal Title</h2>
 *   <p>Modal content goes here</p>
 * </agc-modal>
 *
 * // Programmatic control
 * const modal = document.getElementById('my-modal');
 * modal.open();  // Show modal
 * modal.close(); // Hide modal
 *
 * // With custom sizing and backdrop
 * <agc-modal width="600px" height="400px" backdrop-darken backdrop-blur>
 *   <div>Custom sized modal content</div>
 * </agc-modal>
 *
 * // Event handling
 * modal.addEventListener('open', () => {
 *   console.log('Modal opened');
 * });
 * modal.addEventListener('close', () => {
 *   console.log('Modal closed');
 * });
 *
 * Methods:
 * - open(): Show the modal
 * - close(): Hide the modal
 * - isOpen(): Check if modal is visible
 *
 * Styling:
 * - Fixed positioning with backdrop covering full viewport
 * - Centered modal panel with configurable width/height
 * - Backdrop with optional darkening and blur effects
 * - High z-index (1000) for overlay behavior
 * - Smooth transitions for show/hide
 * - Click on backdrop closes modal
 *
 * Events:
 * - open: Fired when modal becomes visible
 * - close: Fired when modal becomes hidden
 */
export class AGCModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  static get observedAttributes() {
    return ["open", "width", "height", "backdrop-darken", "backdrop-blur"];
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    // Ensure modal starts closed by default (unless open attribute is explicitly set)
    if (!this.hasAttribute("open")) {
      this.removeAttribute("open");
    }
    this.updateVisibility();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      if (name === "open") {
        // Handle visibility change
        this.updateVisibility();
      }
      this.updateStyles();
    }
  }

  get open() {
    return this.hasAttribute("open");
  }

  set open(value) {
    if (value) {
      this.setAttribute("open", "");
    } else {
      this.removeAttribute("open");
    }
  }

  updateVisibility() {
    // Explicitly set display based on open attribute
    const hasOpen = this.hasAttribute("open");
    if (hasOpen) {
      this.style.display = "flex";
    } else {
      this.style.display = "none";
    }
  }

  get width() {
    return this.getAttribute("width") || "400px";
  }

  set width(value) {
    this.setAttribute("width", value);
  }

  get height() {
    return this.getAttribute("height") || "auto";
  }

  set height(value) {
    this.setAttribute("height", value);
  }

  get backdropDarken() {
    return this.hasAttribute("backdrop-darken");
  }

  set backdropDarken(value) {
    if (value) {
      this.setAttribute("backdrop-darken", "");
    } else {
      this.removeAttribute("backdrop-darken");
    }
  }

  get backdropBlur() {
    return this.hasAttribute("backdrop-blur");
  }

  set backdropBlur(value) {
    if (value) {
      this.setAttribute("backdrop-blur", "");
    } else {
      this.removeAttribute("backdrop-blur");
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          opacity: 1;
          visibility: visible;
          transition: opacity 0.2s ease;
          pointer-events: auto;
        }

        .backdrop {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0);
          transition: background 0.2s ease;
        }

        :host([backdrop-darken]) .backdrop {
          background: rgba(0, 0, 0, 0.5);
        }

        :host([backdrop-blur]) .backdrop {
          backdrop-filter: blur(4px);
        }

        :host([backdrop-darken][backdrop-blur]) .backdrop {
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(4px);
        }

        .panel {
          position: relative;
          background: var(--bg-secondary, #1e1e1e);
          border: 1px solid var(--border-color, #2a2a2a);
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
          /* Dynamic sizing via CSS variables */
          --modal-width: 400px;
          --modal-height: auto;
          width: var(--modal-width);
          height: var(--modal-height);
          max-width: 90vw;
          max-height: 90vh;
          overflow: auto;
          z-index: 1;
        }

        /* Custom scrollbar styling for dark theme */
        .panel::-webkit-scrollbar {
          width: 6px;
        }

        .panel::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }

        .panel::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        .panel::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      </style>

      <div class="backdrop"></div>
      <div class="panel">
        <slot></slot>
      </div>
    `;
  }

  updateStyles() {
    if (!this.shadowRoot) return;

    const panel = this.shadowRoot.querySelector(".panel");
    if (panel) {
      panel.style.setProperty("--modal-width", this.width);
      panel.style.setProperty("--modal-height", this.height);
    }
  }

  setupEventListeners() {
    const backdrop = this.shadowRoot.querySelector(".backdrop");

    // Close modal when clicking on backdrop
    backdrop.addEventListener("click", () => {
      this.close();
    });
  }

  /**
   * Show the modal
   */
  open() {
    // Directly set attribute instead of using setter
    this.setAttribute("open", "");
    this.dispatchEvent(
      new CustomEvent("open", {
        bubbles: false,
        composed: true,
      })
    );
  }

  /**
   * Hide the modal
   */
  close() {
    // Directly remove attribute instead of using setter
    this.removeAttribute("open");
    this.dispatchEvent(
      new CustomEvent("close", {
        bubbles: false,
        composed: true,
      })
    );
  }

  /**
   * Check if the modal is currently open
   * @returns {boolean} True if modal is visible
   */
  isOpen() {
    return this.open;
  }
}

// Register the custom element
customElements.define("agc-modal", AGCModal);

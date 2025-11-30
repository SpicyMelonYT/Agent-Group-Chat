/**
 * AGC Loading Overlay Component
 *
 * A full-screen loading overlay with spinner animation.
 *
 * Attributes:
 * - hidden: Controls overlay visibility (boolean attribute)
 *
 * Usage Examples:
 *
 * // Basic usage (starts visible)
 * <agc-loading-overlay></agc-loading-overlay>
 *
 * // Hide overlay
 * <agc-loading-overlay hidden></agc-loading-overlay>
 *
 * // Programmatic control
 * const overlay = document.querySelector('agc-loading-overlay');
 * overlay.show();  // Make visible
 * overlay.hide();  // Make hidden
 *
 * Methods:
 * - setVisible(visible): Set visibility state
 * - isVisible(): Check if overlay is visible
 *
 * Styling:
 * - Full-screen dark overlay with blur effect
 * - Centered spinning loader animation
 * - Smooth fade transitions
 * - High z-index to cover all content
 */
export class AGCLoadingOverlay extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  static get observedAttributes() {
    return ["hidden"];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "hidden") {
      this.updateVisibility();
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
          background: #000000;
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          opacity: 1;
          visibility: visible;
          transition: opacity 0.3s ease, visibility 0.3s ease;
          pointer-events: auto;
        }

        :host([hidden]) {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          background: rgba(0, 0, 0, 0);
        }

        .loader-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .spinner {
          width: 60px;
          height: 60px;
          border: 5px solid rgba(255, 255, 255, 0.2);
          border-top: 5px solid #ffffff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .loading-text {
          color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 16px;
          font-weight: 500;
          margin: 0;
          opacity: 0.9;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Hide when not visible */
        :host([hidden]) .loader-container {
          display: none;
        }
      </style>

      <div class="loader-container">
        <div class="spinner"></div>
        <p class="loading-text">Loading...</p>
      </div>
    `;
  }

  updateVisibility() {
    // The CSS transitions handle the visibility changes
    // This method exists for potential future enhancements
  }

  /**
   * Show the overlay (remove hidden attribute)
   */
  show() {
    this.removeAttribute("hidden");
  }

  /**
   * Hide the overlay (add hidden attribute)
   */
  hide() {
    this.setAttribute("hidden", "");
  }

  /**
   * Check if the overlay is currently visible
   * @returns {boolean} True if visible (not hidden)
   */
  isVisible() {
    return !this.hasAttribute("hidden");
  }
}

// Register the custom element
customElements.define("agc-loading-overlay", AGCLoadingOverlay);

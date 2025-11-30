/**
 * Chat Header Component
 *
 * A header component for the chat section with back navigation and title.
 *
 * Usage Examples:
 *
 * // Basic usage
 * <chat-header title="Chat"></chat-header>
 *
 * // Event handling
 * const chatHeader = document.querySelector('chat-header');
 * chatHeader.addEventListener('back-to-main', () => {
 *   // Handle navigation back to main
 * });
 *
 * Attributes:
 * - title: The title to display in the header (default: "Chat")
 *
 * Events:
 * - back-to-main: Fired when back button is clicked
 */
export class ChatHeader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  static get observedAttributes() {
    return ["title"];
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "title") {
      this.updateTitle();
    }
  }

  render() {
    const title = this.getAttribute("title") || "Chat";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          background-color: var(--bg-secondary, #1e1e1e);
          border-bottom: 1px solid var(--border-color, #2a2a2a);
          flex-shrink: 0;
        }

        .header {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 15px;
          min-height: 48px;
        }

        .title {
          font-size: 24px;
          font-weight: 600;
          color: var(--text-primary, #e0e0e0);
          margin: 0;
          text-align: center;
        }

        .back-button {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
        }

        /* Future settings button placeholder */
        .settings-button {
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
        }
      </style>

      <div class="header">
        <div class="back-button">
          <agc-button>← Back to Main</agc-button>
        </div>

        <h1 class="title">${title}</h1>

        <!-- Future settings button placeholder -->
        <!-- <div class="settings-button">
          <agc-button>⚙️ Settings</agc-button>
        </div> -->
      </div>
    `;
  }

  setupEventListeners() {
    const backButton = this.shadowRoot.querySelector('.back-button agc-button');
    if (backButton) {
      backButton.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('back-to-main', {
          bubbles: true,
          composed: true
        }));
      });
    }
  }

  updateTitle() {
    const titleElement = this.shadowRoot.querySelector('.title');
    if (titleElement) {
      titleElement.textContent = this.getAttribute("title") || "Chat";
    }
  }

  /**
   * Set the header title
   * @param {string} title - The title to display
   */
  setTitle(title) {
    this.setAttribute("title", title);
  }

  /**
   * Get the current title
   * @returns {string} The current title
   */
  getTitle() {
    return this.getAttribute("title") || "Chat";
  }
}

// Register the custom element
customElements.define("chat-header", ChatHeader);

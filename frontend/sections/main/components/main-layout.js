/**
 * Main Layout Component
 *
 * The main page layout component that provides structure for the main section.
 *
 * Usage Examples:
 *
 * // Basic usage
 * <main-layout>
 *   <section-grid>
 *     <section-card section-name="chat" section-title="Chat"></section-card>
 *   </section-grid>
 * </main-layout>
 *
 * Events:
 * - navigate: Fired when navigation is requested (detail: { sectionName, sectionTitle })
 *   - This event is forwarded from child components
 */
export class MainLayout extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
        }

        .container {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 40px;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
        }

        .header {
          margin-bottom: 40px;
        }

        .title {
          font-size: 32px;
          font-weight: 700;
          color: var(--text-primary, #e0e0e0);
          margin: 0 0 8px 0;
        }

        .subtitle {
          font-size: 16px;
          color: var(--text-secondary, #a0a0a0);
          margin: 0;
        }

        .content {
          flex: 1;
        }
      </style>
      <div class="container">
        <div class="header">
          <h1 class="title">Agent Group Chat</h1>
          <p class="subtitle">Select a section to get started</p>
        </div>
        <div class="content">
          <slot></slot>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    // Listen for navigate events from child components
    // Since events don't bubble, we listen on the component itself
    // and forward from child components
    this._handleNavigate = (e) => {
      // Forward the event but ensure it doesn't bubble or compose
      this.dispatchEvent(
        new CustomEvent("navigate", {
          bubbles: false,
          composed: false,
          detail: e.detail,
        })
      );
    };

    // Listen for navigate events from section-grid
    const slot = this.shadowRoot.querySelector("slot");
    if (slot) {
      slot.addEventListener("slotchange", () => {
        // Re-attach listeners when content changes
        const grid = this.querySelector("section-grid");
        if (grid) {
          grid.removeEventListener("navigate", this._handleNavigate);
          grid.addEventListener("navigate", this._handleNavigate);
        }
      });

      // Initial attachment
      const grid = this.querySelector("section-grid");
      if (grid) {
        grid.addEventListener("navigate", this._handleNavigate);
      }
    }
  }
}

// Register the custom element
customElements.define("main-layout", MainLayout);


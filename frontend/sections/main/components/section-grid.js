/**
 * Section Grid Component
 *
 * A grid container for displaying section cards in a responsive layout.
 *
 * Attributes:
 * - columns: Number of columns (default: auto, responsive)
 *
 * Usage Examples:
 *
 * // Basic usage
 * <section-grid>
 *   <section-card section-name="chat" section-title="Chat"></section-card>
 *   <section-card section-name="settings" section-title="Settings"></section-card>
 * </section-grid>
 *
 * // With custom columns
 * <section-grid columns="3">
 *   <section-card section-name="chat" section-title="Chat"></section-card>
 * </section-grid>
 *
 * // Event handling
 * const grid = document.querySelector('section-grid');
 * grid.addEventListener('navigate', (e) => {
 *   console.log('Navigate to:', e.detail.sectionName);
 * });
 *
 * Events:
 * - navigate: Fired when a child section-card is clicked (detail: { sectionName, sectionTitle })
 *   - This event is forwarded from child section-card components
 */
export class SectionGrid extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  static get observedAttributes() {
    return ["columns"];
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  attributeChangedCallback() {
    if (this.shadowRoot) {
      this.render();
    }
  }

  get columns() {
    return this.getAttribute("columns") || "auto";
  }

  render() {
    const gridTemplateColumns =
      this.columns === "auto"
        ? "repeat(auto-fill, minmax(250px, 1fr))"
        : `repeat(${this.columns}, 1fr)`;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .grid {
          display: grid;
          grid-template-columns: ${gridTemplateColumns};
          gap: 20px;
          width: 100%;
        }
      </style>
      <div class="grid">
        <slot></slot>
      </div>
    `;
  }

  setupEventListeners() {
    // Listen for navigate events from child section-card components
    // Since events don't bubble, we need to listen on each child directly
    const slot = this.shadowRoot.querySelector("slot");
    
    // Function to attach listeners to cards
    const attachListeners = () => {
      const cards = this.querySelectorAll("section-card");
      cards.forEach((card) => {
        // Remove existing listener if any (to prevent duplicates)
        card.removeEventListener("navigate", this._handleCardNavigate);
        // Add listener
        card.addEventListener("navigate", this._handleCardNavigate);
      });
    };

    // Handle card navigate events
    this._handleCardNavigate = (e) => {
      // Forward the event but ensure it doesn't bubble or compose
      this.dispatchEvent(
        new CustomEvent("navigate", {
          bubbles: false,
          composed: false,
          detail: e.detail,
        })
      );
    };

    // Listen for slot changes (when children are added/removed)
    if (slot) {
      slot.addEventListener("slotchange", attachListeners);
    }

    // Initial attachment
    attachListeners();
  }
}

// Register the custom element
customElements.define("section-grid", SectionGrid);


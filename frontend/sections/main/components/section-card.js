/**
 * Section Card Component
 *
 * A card component for displaying and navigating to sections.
 *
 * Attributes:
 * - section-name: Name of the section (e.g., "main", "chat")
 * - section-title: Display title for the section
 * - section-description: Optional description text
 *
 * Usage Examples:
 *
 * // Basic usage
 * <section-card section-name="chat" section-title="Chat"></section-card>
 *
 * // With description
 * <section-card 
 *   section-name="settings" 
 *   section-title="Settings"
 *   section-description="Configure application settings">
 * </section-card>
 *
 * // Event handling
 * const card = document.querySelector('section-card');
 * card.addEventListener('navigate', (e) => {
 *   console.log('Navigate to:', e.detail.sectionName);
 * });
 *
 * Events:
 * - navigate: Fired when card is clicked (detail: { sectionName, sectionTitle })
 */
export class SectionCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  static get observedAttributes() {
    return ["section-name", "section-title", "section-description"];
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

  get sectionName() {
    return this.getAttribute("section-name") || "";
  }

  get sectionTitle() {
    return this.getAttribute("section-title") || this.sectionName;
  }

  get sectionDescription() {
    return this.getAttribute("section-description") || "";
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .card {
          background-color: var(--card-bg, #1e1e1e);
          border: 1px solid var(--card-border, #2a2a2a);
          border-radius: 8px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .card:hover {
          background-color: var(--card-bg-hover, #252525);
          border-color: var(--card-border-hover, #353535);
          transform: translateY(-2px);
        }

        .card:active {
          transform: translateY(0);
        }

        .title {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary, #e0e0e0);
          margin: 0 0 8px 0;
        }

        .description {
          font-size: 14px;
          color: var(--text-secondary, #a0a0a0);
          margin: 0;
          flex: 1;
        }
      </style>
      <div class="card">
        <div class="title">${this.sectionTitle}</div>
        ${this.sectionDescription ? `<div class="description">${this.sectionDescription}</div>` : ''}
      </div>
    `;
  }

  setupEventListeners() {
    const card = this.shadowRoot.querySelector(".card");
    card.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("navigate", {
          bubbles: false,
          composed: false,
          detail: {
            sectionName: this.sectionName,
            sectionTitle: this.sectionTitle,
          },
        })
      );
    });
  }
}

// Register the custom element
customElements.define("section-card", SectionCard);


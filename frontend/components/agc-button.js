/**
 * AGC Button Component
 *
 * A minimalistic dark mode button component with hover, pressed, and disabled states.
 *
 * Attributes:
 * - disabled: Disables the button (boolean attribute)
 *
 * Usage Examples:
 *
 * // Basic usage
 * <agc-button>Click Me</agc-button>
 *
 * // Disabled button
 * <agc-button disabled>Disabled</agc-button>
 *
 * // Event handling
 * const button = document.querySelector('agc-button');
 * button.addEventListener('click', (e) => {
 *   console.log('Button clicked');
 * });
 *
 * Methods:
 * - setDisabled(disabled): Set disabled state
 * - isDisabled(): Check if button is disabled
 *
 * Styling:
 * - Dark mode minimalistic design
 * - Background and border colors change on hover/pressed states
 * - Disabled state uses 0.5 opacity
 */
export class AGCButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  static get observedAttributes() {
    return ["disabled"];
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "disabled") {
      this.updateDisabledState();
    }
  }

  get disabled() {
    return this.hasAttribute("disabled");
  }

  set disabled(value) {
    if (value) {
      this.setAttribute("disabled", "");
    } else {
      this.removeAttribute("disabled");
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }

        button {
          background-color: #2a2a2a;
          border: 1px solid #404040;
          color: #e0e0e0;
          padding: 8px 16px;
          font-size: 14px;
          font-family: inherit;
          cursor: pointer;
          border-radius: 4px;
          transition: background-color 0.15s ease, border-color 0.15s ease;
          outline: none;
          user-select: none;
        }

        button:hover:not(:disabled) {
          background-color: #353535;
          border-color: #505050;
        }

        button:active:not(:disabled) {
          background-color: #1f1f1f;
          border-color: #2a2a2a;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      </style>
      <button>
        <slot></slot>
      </button>
    `;
  }

  setupEventListeners() {
    const button = this.shadowRoot.querySelector("button");
    
    // Forward click events to host element
    button.addEventListener("click", (e) => {
      if (!this.disabled) {
        // Stop the native click event from bubbling up
        e.stopPropagation();
        // Create a new event that does not bubble
        const clickEvent = new CustomEvent("click", {
          bubbles: false,
          cancelable: true,
          composed: true,
        });
        this.dispatchEvent(clickEvent);
      } else {
        e.preventDefault();
        e.stopPropagation();
      }
    });

    // Prevent clicks when disabled
    button.addEventListener("mousedown", (e) => {
      if (this.disabled) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
  }

  updateDisabledState() {
    const button = this.shadowRoot.querySelector("button");
    if (button) {
      button.disabled = this.disabled;
    }
  }

  // Public methods
  setDisabled(disabled) {
    this.disabled = disabled;
  }

  isDisabled() {
    return this.disabled;
  }
}

// Register the custom element
customElements.define("agc-button", AGCButton);


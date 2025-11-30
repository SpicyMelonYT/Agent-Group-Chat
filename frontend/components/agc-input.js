/**
 * AGC Input Component
 *
 * A customizable input component with advanced styling, validation, and interaction effects.
 *
 * Attributes:
 * - color1: Background color in HSL format (default: "hsl(0, 0%, 100%)") - used for background
 * - color2: Border color (defaults to 20% brighter than color1 brightness if not set)
 * - color3: Focus/highlight color in HSL format (default: "hsl(200, 100%, 50%)")
 * - radius: Border radius - "normal" (6px), "full" (9999px), "none" (0px), or any CSS length value (e.g., "8px", "12px")
 * - borderwidth: Border width in CSS length value (default: "2px")
 * - placeholder: Placeholder text
 * - value: Input value
 * - type: Input type - "text", "password", "email", "number", "tel", "url", "search" (default: "text")
 * - maxlength: Maximum character length
 * - minlength: Minimum character length
 * - pattern: Validation pattern (regex)
 * - required: Required field (boolean attribute)
 * - disabled: Disabled state (boolean attribute)
 * - readonly: Read-only state (boolean attribute)
 * - label: Associated label text (sets aria-label)
 * - describedby: ID of element that describes this input (sets aria-describedby)
 * - autocomplete: Autocomplete attribute for better UX
 * - step: Step value for number inputs
 * - min: Minimum value for number inputs
 * - max: Maximum value for number inputs
 *
 * Usage Examples:
 *
 * // Basic text input
 * <agc-input placeholder="Enter your name"></agc-input>
 *
 * // Email input with validation
 * <agc-input type="email" placeholder="email@example.com" required></agc-input>
 *
 * // Password input
 * <agc-input type="password" placeholder="Enter password"></agc-input>
 *
 * // Number input with constraints
 * <agc-input type="number" min="0" max="100" step="5" placeholder="Age"></agc-input>
 *
 * // Custom styling
 * <agc-input
 *   color1="hsl(220, 20%, 98%)"
 *   color2="hsl(220, 20%, 85%)"
 *   color3="hsl(220, 70%, 50%)"
 *   radius="full"
 *   placeholder="Custom styled input">
 * </agc-input>
 *
 * // With accessibility features
 * <agc-input
 *   label="Search Query"
 *   describedby="search-help"
 *   autocomplete="off"
 *   type="search"
 *   required>
 * </agc-input>
 * <div id="search-help">Enter your search terms</div>
 *
 * Methods:
 * - getValue(): Get current input value
 * - setValue(value): Set input value
 * - focus(): Focus the input
 * - blur(): Remove focus from input
 * - isValid(): Check if input passes validation (returns boolean)
 * - setCustomValidity(message): Set custom validation message
 *
 * Styling:
 * - Height: Fixed at 36px for consistent appearance
 * - Border: Configurable width (default 2px) solid using color2 color (changes to color3 on focus)
 * - Focus ring: Subtle glow effect using color3 color
 * - Invalid state: Red-tinted border and background
 * - Disabled state: Reduced opacity, no pointer events
 *
 * States:
 * - Default: Base styling with color2 border
 * - Focus: color3 border with focus ring glow
 * - Invalid: Red border and subtle red background tint
 * - Disabled: Reduced opacity, no interactions
 *
 * Events:
 * - change: Fired on every input change (more frequent than native change)
 * - open: Fired on focus
 * - close: Fired on blur
 * - submit: Fired when Enter is pressed
 */
export class AGCInput extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._customValidity = "";
  }

  static get observedAttributes() {
    return [
      "color1",
      "color2",
      "color3",
      "radius",
      "borderwidth",
      "placeholder",
      "value",
      "type",
      "maxlength",
      "minlength",
      "pattern",
      "required",
      "disabled",
      "readonly",
      "label",
      "describedby",
      "autocomplete",
      "step",
      "min",
      "max",
    ];
  }

  connectedCallback() {
    this.render();
    this.updateStyles();
    this.updateInputAttributes();
    this.setupEventListeners();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      if (name === "value") {
        // Avoid heavy updates during typing; just sync the DOM value
        this.updateValue();
      } else {
        this.updateStyles();
        this.updateInputAttributes();
      }
    }
  }

  get color1() {
    return this.getAttribute("color1") || "hsl(0, 0%, 10%)";
  }

  get color2() {
    return this.getAttribute("color2") || this.calculateColor2Color();
  }

  get color3() {
    return this.getAttribute("color3") || "hsl(200, 100%, 50%)";
  }

  get radius() {
    const radius = this.getAttribute("radius") || "normal";

    // Check if it's a CSS length value (ends with px, em, rem, vh, vw, etc.)
    if (radius.match(/^\d+(\.\d+)?(px|em|rem|vh|vw|vmin|vmax|%)$/)) {
      return radius;
    }

    // Otherwise use predefined modes
    switch (radius) {
      case "full":
        return "9999px";
      case "none":
        return "0px";
      default:
        return "8px"; // Match agc-textarea default
    }
  }

  get borderwidth() {
    return this.getAttribute("borderwidth") || "2px";
  }

  get placeholder() {
    return this.getAttribute("placeholder") || "";
  }

  get value() {
    const live = this.shadowRoot?.querySelector(".input");
    if (live) return live.value;
    const attr = this.getAttribute("value");
    return attr != null ? attr : "";
  }

  set value(newValue) {
    this.setAttribute("value", newValue);
  }

  get type() {
    const type = this.getAttribute("type") || "text";
    const validTypes = ["text", "password", "email", "number", "tel", "url", "search"];
    return validTypes.includes(type) ? type : "text";
  }

  get maxlength() {
    const max = this.getAttribute("maxlength");
    return max ? parseInt(max) : null;
  }

  get minlength() {
    const min = this.getAttribute("minlength");
    return min ? parseInt(min) : null;
  }

  get pattern() {
    return this.getAttribute("pattern") || "";
  }

  get required() {
    return this.hasAttribute("required");
  }

  get disabled() {
    return this.hasAttribute("disabled");
  }

  get readonly() {
    return this.hasAttribute("readonly");
  }

  get label() {
    return this.getAttribute("label") || "";
  }

  get describedby() {
    return this.getAttribute("describedby") || "";
  }

  get autocomplete() {
    return this.getAttribute("autocomplete") || "";
  }

  get step() {
    return this.getAttribute("step") || "";
  }

  get min() {
    return this.getAttribute("min") || "";
  }

  get max() {
    return this.getAttribute("max") || "";
  }

  calculateColor2Color() {
    // Parse HSL and make it 20% brighter by adding 20% to current brightness
    const hslMatch = this.color1.match(
      /hsl\((\d+),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%\)/
    );
    if (hslMatch) {
      const h = hslMatch[1];
      const s = hslMatch[2];
      let l = parseInt(hslMatch[3]);
      l = Math.min(100, l + 20); // Add 20% brightness
      return `hsl(${h}, ${s}%, ${Math.round(l)}%)`;
    }
    return this.color1;
  }

  calculateFocusRingColor() {
    // Create a semi-transparent version of color3 color for focus ring
    const hslMatch = this.color3.match(
      /hsl\((\d+),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%\)/
    );
    if (hslMatch) {
      const h = hslMatch[1];
      const s = hslMatch[2];
      const l = hslMatch[3];
      return `hsl(${h}, ${s}%, ${l}%, 0.3)`;
    }
    return "hsl(200, 100%, 50%, 0.3)";
  }

  calculateInvalidColor() {
    return "hsl(0, 100%, 50%)"; // Red for invalid state
  }

  calculateInvalidBackground() {
    // Calculate invalid background based on color1 - darker for dark theme, lighter for light theme
    const hslMatch = this.color1.match(
      /hsl\((\d+),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%\)/
    );
    if (hslMatch) {
      const l = parseInt(hslMatch[3]);
      // For dark backgrounds (lightness < 50), use a darker red tint
      // For light backgrounds (lightness >= 50), use a lighter red tint
      if (l < 50) {
        // Dark theme: use a darker red background that's slightly lighter than the base
        return `hsl(0, 60%, ${Math.min(20, l + 5)}%)`;
      } else {
        // Light theme: use a light red background
        return "hsl(0, 100%, 97%)";
      }
    }
    return "hsl(0, 100%, 97%)";
  }

  calculateInvalidTextColor() {
    // Ensure text is readable in invalid state
    const hslMatch = this.color1.match(
      /hsl\((\d+),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%\)/
    );
    if (hslMatch) {
      const l = parseInt(hslMatch[3]);
      // For dark backgrounds, use light text; for light backgrounds, use dark text
      return l < 50 ? "hsl(0, 0%, 95%)" : "hsl(0, 0%, 10%)";
    }
    return "hsl(0, 0%, 95%)";
  }

  calculateReadonlyBackground() {
    // Calculate readonly background based on color1
    const hslMatch = this.color1.match(
      /hsl\((\d+),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%\)/
    );
    if (hslMatch) {
      const l = parseInt(hslMatch[3]);
      // For dark backgrounds, use slightly lighter; for light backgrounds, use slightly darker
      if (l < 50) {
        return `hsl(0, 0%, ${Math.min(18, l + 3)}%)`;
      } else {
        return "hsl(0, 0%, 96%)";
      }
    }
    return "hsl(0, 0%, 96%)";
  }

  calculateTextColor() {
    // Choose readable text color based on color1 background lightness
    const hslMatch = this.color1.match(
      /hsl\((\d+),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%\)/
    );
    if (hslMatch) {
      const l = parseInt(hslMatch[3]);
      return l >= 50 ? "hsl(0, 0%, 10%)" : "hsl(0, 0%, 95%)";
    }
    return "hsl(0, 0%, 95%)";
  }

  calculatePlaceholderColor() {
    // Slightly muted placeholder color based on background
    const hslMatch = this.color1.match(
      /hsl\((\d+),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%\)/
    );
    if (hslMatch) {
      const l = parseInt(hslMatch[3]);
      return l >= 50 ? "hsl(0, 0%, 45%)" : "hsl(0, 0%, 70%)";
    }
    return "hsl(0, 0%, 60%)";
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          /* Dynamic variables with sensible defaults */
          --agc-input-radius: 8px;
          --agc-input-borderwidth: 2px;
          --agc-input-color1: hsl(0, 0%, 100%);
          --agc-input-color2: hsl(0, 0%, 85%);
          --agc-input-text: hsl(0, 0%, 10%);
          --agc-input-placeholder: hsl(0, 0%, 60%);
          --agc-input-color3: hsl(200, 100%, 50%);
          --agc-input-disabled-opacity: 0.6;
          --agc-input-invalid-border: hsl(0, 100%, 50%);
          --agc-input-invalid-background: hsl(0, 100%, 97%);
          --agc-input-invalid-text: hsl(0, 0%, 10%);
          --agc-input-readonly-background: hsl(0, 0%, 96%);
        }

        :host([disabled]) {
          opacity: 0.6;
        }

        .input-container {
          position: relative;
          display: flex;
          width: 100%;
        }

        .input {
          position: relative;
          display: block;
          height: 36px;
          padding: 0 12px;
          border: var(--agc-input-borderwidth) solid;
          border-radius: var(--agc-input-radius);
          background-color: var(--agc-input-color1);
          border-color: var(--agc-input-color2);
          color: var(--agc-input-text);
          font-family: inherit;
          font-size: 14px;
          font-weight: 400;
          outline: none;
          transition: border-color 0.15s ease, background-color 0.15s ease;
          box-sizing: border-box;
          width: 100%;
          min-width: 0;
        }

        .input::placeholder {
          color: var(--agc-input-placeholder);
          opacity: 1;
        }

        .input:focus {
          border-color: var(--agc-input-color3);
        }

        .input:disabled {
          opacity: var(--agc-input-disabled-opacity);
          cursor: not-allowed;
          pointer-events: none;
        }

        :host([disabled]) .input {
          opacity: var(--agc-input-disabled-opacity);
        }

        .input:disabled::placeholder {
          color: var(--agc-input-placeholder);
          opacity: 1;
        }

        .input[readonly] {
          background-color: var(--agc-input-readonly-background);
          cursor: default;
        }

        /* Invalid state styling */
        .input:invalid:not(:placeholder-shown) {
          border-color: var(--agc-input-invalid-border);
          background-color: var(--agc-input-invalid-background);
          color: var(--agc-input-invalid-text);
        }

        /* Hide number input spinners for webkit browsers */
        .input[type="number"]::-webkit-outer-spin-button,
        .input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .input[type="number"] {
          -moz-appearance: textfield; /* Firefox */
        }

        /* Search input styling */
        .input[type="search"]::-webkit-search-decoration,
        .input[type="search"]::-webkit-search-cancel-button,
        .input[type="search"]::-webkit-search-results-button,
        .input[type="search"]::-webkit-search-results-decoration {
          -webkit-appearance: none;
        }
      </style>

      <div class="input-container">
        <input
          class="input"
          type="${this.type}"
          placeholder="${this.placeholder}"
          value="${this.value}"
          ${this.maxlength ? `maxlength="${this.maxlength}"` : ""}
          ${this.minlength ? `minlength="${this.minlength}"` : ""}
          ${this.pattern ? `pattern="${this.pattern}"` : ""}
          ${this.required ? "required" : ""}
          ${this.disabled ? "disabled" : ""}
          ${this.readonly ? "readonly" : ""}
          ${this.label ? `aria-label="${this.label}"` : ""}
          ${this.describedby ? `aria-describedby="${this.describedby}"` : ""}
          ${`aria-invalid="${!this.isValid()}"`}
          ${`aria-required="${this.required}"`}
          ${this.autocomplete ? `autocomplete="${this.autocomplete}"` : ""}
          ${this.step ? `step="${this.step}"` : ""}
          ${this.min ? `min="${this.min}"` : ""}
          ${this.max ? `max="${this.max}"` : ""}
        />
      </div>
    `;
  }

  updateStyles() {
    if (!this.shadowRoot) return;

    // Update CSS variables only
    const setVar = (name, value) => this.style.setProperty(name, value);
    setVar("--agc-input-radius", this.radius);
    setVar("--agc-input-borderwidth", this.borderwidth);
    setVar("--agc-input-color1", this.color1);
    setVar("--agc-input-color2", this.color2);
    setVar("--agc-input-text", this.calculateTextColor());
    setVar("--agc-input-placeholder", this.calculatePlaceholderColor());
    setVar("--agc-input-color3", this.color3);
    setVar("--agc-input-disabled-opacity", "0.6");
    setVar("--agc-input-invalid-border", this.calculateInvalidColor());
    setVar("--agc-input-invalid-background", this.calculateInvalidBackground());
    setVar("--agc-input-invalid-text", this.calculateInvalidTextColor());
    setVar("--agc-input-readonly-background", this.calculateReadonlyBackground());
  }

  updateValue() {
    const input = this.shadowRoot?.querySelector(".input");
    if (!input) return;
    // Read the attribute directly instead of the getter, because the getter
    // returns the live input.value when present, which prevents syncing
    // when the attribute changes.
    const attrValue = this.getAttribute("value") ?? "";
    if (input.value !== attrValue) {
      input.value = attrValue;
    }
  }

  updateInputAttributes() {
    const input = this.shadowRoot?.querySelector(".input");
    if (!input) return;

    // Update basic attributes
    input.placeholder = this.placeholder;
    input.type = this.type;
    input.required = this.required;
    input.disabled = this.disabled;
    input.readOnly = this.readonly;

    // Update length constraints
    if (this.maxlength !== null && !Number.isNaN(this.maxlength)) {
      input.maxLength = this.maxlength;
    } else {
      input.removeAttribute("maxlength");
    }

    if (this.minlength !== null && !Number.isNaN(this.minlength)) {
      input.minLength = this.minlength;
    } else {
      input.removeAttribute("minlength");
    }

    // Update pattern
    if (this.pattern) {
      input.pattern = this.pattern;
    } else {
      input.removeAttribute("pattern");
    }

    // Update number input constraints
    if (this.step) {
      input.step = this.step;
    } else {
      input.removeAttribute("step");
    }

    if (this.min) {
      input.min = this.min;
    } else {
      input.removeAttribute("min");
    }

    if (this.max) {
      input.max = this.max;
    } else {
      input.removeAttribute("max");
    }

    // Update accessibility attributes
    if (this.label) {
      input.setAttribute("aria-label", this.label);
    } else {
      input.removeAttribute("aria-label");
    }

    if (this.describedby) {
      input.setAttribute("aria-describedby", this.describedby);
    } else {
      input.removeAttribute("aria-describedby");
    }

    input.setAttribute("aria-invalid", (!this.isValid()).toString());
    input.setAttribute("aria-required", this.required.toString());

    if (this.autocomplete) {
      input.setAttribute("autocomplete", this.autocomplete);
    } else {
      input.removeAttribute("autocomplete");
    }
  }

  setupEventListeners() {
    const input = this.shadowRoot?.querySelector(".input");
    if (!input) return;

    // Handle input changes
    input.addEventListener("input", (e) => {
      // Do not write back to attribute here to avoid re-renders during typing
      this.dispatchEvent(
        new CustomEvent("change", {
          bubbles: true,
          composed: true,
          detail: { value: e.target.value, originalEvent: e },
        })
      );
    });

    // Handle focus
    input.addEventListener("focus", (e) => {
      this.dispatchEvent(
        new CustomEvent("open", {
          bubbles: true,
          composed: true,
          detail: { originalEvent: e },
        })
      );
    });

    // Handle blur
    input.addEventListener("blur", (e) => {
      const isValid = this.isValid();
      this.dispatchEvent(
        new CustomEvent("close", {
          bubbles: false, // Don't bubble to prevent interfering with parent components like modals
          composed: true,
          detail: {
            value: input.value,
            isValid: isValid,
            validationMessage:
              input.validationMessage || this._customValidity,
            originalEvent: e,
          },
        })
      );
    });

    // Handle submit on Enter
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.dispatchEvent(
          new CustomEvent("submit", {
            bubbles: true,
            composed: true,
            detail: { value: input.value, originalEvent: e },
          })
        );
      }
    });
  }

  // Public methods
  getValue() {
    const input = this.shadowRoot?.querySelector(".input");
    return input ? input.value : this.value;
  }

  setValue(value) {
    this.value = value;
    this.updateValue();
  }

  focus() {
    const input = this.shadowRoot?.querySelector(".input");
    if (input) {
      input.focus();
    }
  }

  blur() {
    const input = this.shadowRoot?.querySelector(".input");
    if (input) {
      input.blur();
    }
  }

  isValid() {
    const input = this.shadowRoot?.querySelector(".input");
    if (!input) return true;

    // Check HTML5 validation
    const isValidHTML5 = input.checkValidity();

    // Check custom validity
    const hasCustomValidity = this._customValidity.length > 0;

    return isValidHTML5 && !hasCustomValidity;
  }

  setCustomValidity(message) {
    this._customValidity = message || "";
    const input = this.shadowRoot?.querySelector(".input");
    if (input) {
      input.setCustomValidity(message || "");
    }
  }

  setDisabled() {
    this.setAttribute("disabled", "");
    this.updateInputAttributes();
  }

  setEnabled() {
    this.removeAttribute("disabled");
    this.updateInputAttributes();
  }

  isDisabled() {
    return this.hasAttribute("disabled");
  }
}

// Register the custom element
customElements.define("agc-input", AGCInput);

/**
 * AGC Textarea Component
 *
 * A customizable textarea component with advanced styling and interaction effects.
 *
 * Attributes:
 * - color1: Background color in HSL format (default: "hsl(0, 0%, 100%)") - used for background
 * - color2: Border color (defaults to 20% brighter than color1 brightness if not set)
 * - color3: Focus/highlight color in HSL format (default: "hsl(200, 100%, 50%)")
 * - radius: Border radius - "normal" (8px), "full" (9999px), "none" (0px), or any CSS length value (e.g., "12px", "16px")
 * - borderwidth: Border width in CSS length value (default: "2px")
 * - placeholder: Placeholder text
 * - value: Initial textarea value
 * - maxlength: Maximum character length
 * - minlength: Minimum character length
 * - rows: Number of visible text lines (default: 3)
 * - cols: Number of visible text columns
 * - wrap: Word wrapping behavior - "soft", "hard", or "off" (default: "soft")
 * - required: Required field (boolean attribute)
 * - disabled: Disabled state (boolean attribute)
 * - readonly: Read-only state (boolean attribute)
 * - label: Associated label text (sets aria-label)
 * - describedby: ID of element that describes this textarea (sets aria-describedby)
 * - autocomplete: Autocomplete attribute for better UX
 *
 * Usage Examples:
 *
 * // Basic textarea
 * <agc-textarea placeholder="Enter your message"></agc-textarea>
 *
 * // Textarea with custom sizing
 * <agc-textarea rows="5" cols="50" placeholder="Long message"></agc-textarea>
 *
 * // Textarea with custom styling
 * <agc-textarea
 *   color1="hsl(220, 20%, 98%)"
 *   color2="hsl(220, 20%, 85%)"
 *   color3="hsl(220, 70%, 50%)"
 *   radius="full"
 *   rows="4"
 *   placeholder="Custom styled textarea">
 * </agc-textarea>
 *
 * // With accessibility features
 * <agc-textarea
 *   label="Message Content"
 *   describedby="message-help"
 *   autocomplete="off"
 *   required
 *   rows="6">
 * </agc-textarea>
 * <div id="message-help">Please provide details about your request</div>
 *
 * Methods:
 * - getValue(): Get current textarea value
 * - setValue(value): Set textarea value
 * - focus(): Focus the textarea
 * - blur(): Remove focus from textarea
 * - isValid(): Check if textarea passes validation (returns boolean)
 * - setCustomValidity(message): Set custom validation message
 *
 * Styling:
 * - Default height: Calculated from rows (35px per row + padding)
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
 * - submit: Fired when Ctrl+Enter or Cmd+Enter is pressed
 */
export class AGCTextarea extends HTMLElement {
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
      "maxlength",
      "minlength",
      "minrows",
      "maxrows",
      "rows",
      "cols",
      "wrap",
      "required",
      "disabled",
      "readonly",
      "label",
      "describedby",
      "autocomplete",
    ];
  }

  connectedCallback() {
    this.render();
    this.updateStyles();
    this.updateTextareaAttributes();
    this.setupEventListeners();
    // Auto-size after initial render
    this.autoResize();
    // Recalculate after fonts/layout settle
    requestAnimationFrame(() => this.autoResize());
    // Adjust on window resize (line wrapping may change)
    this._onWindowResize = () => this.autoResize();
    window.addEventListener("resize", this._onWindowResize);
  }

  disconnectedCallback() {
    if (this._onWindowResize) {
      window.removeEventListener("resize", this._onWindowResize);
      this._onWindowResize = null;
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      if (name === "value") {
        // Avoid heavy updates during typing; just sync the DOM value
        this.updateValue();
      } else {
        this.updateStyles();
        this.updateTextareaAttributes();
      }
    }
  }

  get color1() {
    return this.getAttribute("color1") || "hsl(0, 0%, 10%)";
  }

  get color2() {
    return this.getAttribute("color2") || this.calculatecolor2Color();
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
        return "8px";
    }
  }

  get borderwidth() {
    return this.getAttribute("borderwidth") || "2px";
  }

  get placeholder() {
    return this.getAttribute("placeholder") || "";
  }

  get value() {
    const live = this.shadowRoot?.querySelector(".textarea");
    if (live) return live.value;
    const attr = this.getAttribute("value");
    return attr != null ? attr : "";
  }

  set value(newValue) {
    this.setAttribute("value", newValue);
  }

  get maxlength() {
    const max = this.getAttribute("maxlength");
    return max ? parseInt(max) : null;
  }

  get minlength() {
    const min = this.getAttribute("minlength");
    return min ? parseInt(min) : null;
  }

  get minRows() {
    const val = this.getAttribute("minrows");
    const parsed = val ? parseInt(val) : 2;
    if (Number.isNaN(parsed) || parsed < 1) return 2;
    return parsed;
  }

  get maxRows() {
    const val = this.getAttribute("maxrows");
    const parsed = val ? parseInt(val) : 9;
    if (Number.isNaN(parsed)) return Math.max(this.minRows, 9);
    return Math.max(this.minRows, parsed);
  }

  get rows() {
    const rows = this.getAttribute("rows");
    return rows ? parseInt(rows) : this.minRows;
  }

  get cols() {
    const cols = this.getAttribute("cols");
    return cols ? parseInt(cols) : null;
  }

  get wrap() {
    return this.getAttribute("wrap") || "soft";
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

  calculatecolor2Color() {
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
    return "hsl(0, 100%, 97%)"; // Light red background tint
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
          --agc-textarea-radius: 8px;
          --agc-textarea-borderwidth: 2px;
          --agc-textarea-color1: hsl(0, 0%, 100%);
          --agc-textarea-color2: hsl(0, 0%, 85%);
          --agc-textarea-text: hsl(0, 0%, 10%);
          --agc-textarea-placeholder: hsl(0, 0%, 60%);
          --agc-textarea-color3: hsl(200, 100%, 50%);
          --agc-textarea-disabled-opacity: 0.6;
        }

        :host([disabled]) {
          opacity: 0.6;
        }

        .textarea-container {
          position: relative;
          display: flex;
          width: 100%;
        }

        .textarea {
          position: relative;
          display: block;
          min-height: 35px;
          padding: 8px 12px;
          border: var(--agc-textarea-borderwidth) solid;
          border-radius: var(--agc-textarea-radius);
          background-color: var(--agc-textarea-color1);
          border-color: var(--agc-textarea-color2);
          color: var(--agc-textarea-text);
          font-family: inherit;
          font-size: 14px;
          font-weight: 400;
          outline: none;
          transition: border-color 0.15s ease, background-color 0.15s ease;
          box-sizing: border-box;
          width: 100%;
          min-width: 0;
          resize: none;
          overflow-wrap: break-word;
          word-wrap: break-word;
        }

        .textarea::placeholder {
          color: var(--agc-textarea-placeholder);
          opacity: 1;
        }

        .textarea:focus {
          border-color: var(--agc-textarea-color3);
        }

        .textarea:disabled {
          opacity: var(--agc-textarea-disabled-opacity);
          cursor: not-allowed;
          pointer-events: none;
        }

        :host([disabled]) .textarea {
          opacity: var(--agc-textarea-disabled-opacity);
        }

        .textarea:disabled::placeholder {
          color: var(--agc-textarea-placeholder);
          opacity: 1;
        }

        .textarea[readonly] {
          background-color: hsl(0, 0%, 96%);
          cursor: default;
        }

        /* Character counter */
        .char-counter {
          position: absolute;
          bottom: 4px;
          right: 8px;
          font-size: 11px;
          color: var(--agc-textarea-placeholder);
          pointer-events: none;
          opacity: 0.7;
        }

        /* Custom scrollbar styling */
        .textarea::-webkit-scrollbar {
          width: 9px;
        }

        .textarea::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }

        .textarea::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }

        .textarea::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }

        /* Hide scrollbar corner */
        .textarea::-webkit-scrollbar-corner {
          display: none;
        }
      </style>
      <div class="textarea-container">
        <textarea
          class="textarea"
          placeholder="${this.placeholder}"
          value="${this.value}"
          ${this.maxlength ? `maxlength="${this.maxlength}"` : ""}
          ${this.minlength ? `minlength="${this.minlength}"` : ""}
          rows="${this.rows}"
          ${this.cols ? `cols="${this.cols}"` : ""}
          wrap="${this.wrap}"
          ${this.required ? "required" : ""}
          ${this.disabled ? "disabled" : ""}
          ${this.readonly ? "readonly" : ""}
          ${this.label ? `aria-label="${this.label}"` : ""}
          ${this.describedby ? `aria-describedby="${this.describedby}"` : ""}
          ${`aria-invalid="${!this.isValid()}"`}
          ${`aria-required="${this.required}"`}
          ${this.autocomplete ? `autocomplete="${this.autocomplete}"` : ""}
        ></textarea>
        ${
          this.maxlength
            ? `<div class="char-counter"><span class="current">0</span>/<span class="max">${this.maxlength}</span></div>`
            : ""
        }
      </div>
    `;
  }

  updateStyles() {
    if (!this.shadowRoot) return;

    // Update CSS variables only
    const setVar = (name, value) => this.style.setProperty(name, value);
    setVar("--agc-textarea-radius", this.radius);
    setVar("--agc-textarea-borderwidth", this.borderwidth);
    setVar("--agc-textarea-color1", this.color1);
    setVar("--agc-textarea-color2", this.color2);
    setVar("--agc-textarea-text", this.calculateTextColor());
    setVar("--agc-textarea-placeholder", this.calculatePlaceholderColor());
    setVar("--agc-textarea-color3", this.color3);
    setVar("--agc-textarea-disabled-opacity", "0.6");
  }

  updateValue() {
    const textarea = this.shadowRoot?.querySelector(".textarea");
    if (!textarea) return;
    // Read the attribute directly instead of the getter, because the getter
    // returns the live textarea.value when present, which prevents syncing
    // when the attribute changes.
    const attrValue = this.getAttribute("value") ?? "";
    if (textarea.value !== attrValue) {
      textarea.value = attrValue;
      this.updateCharCounter();
      this.autoResize();
    }
  }

  updateTextareaAttributes() {
    const textarea = this.shadowRoot?.querySelector(".textarea");
    if (!textarea) return;

    // Update basic attributes
    textarea.placeholder = this.placeholder;
    textarea.rows = this.rows;
    if (this.cols !== null && !Number.isNaN(this.cols)) {
      textarea.cols = this.cols;
    } else {
      textarea.removeAttribute("cols");
    }
    textarea.wrap = this.wrap;
    textarea.required = this.required;
    textarea.disabled = this.disabled;
    textarea.readOnly = this.readonly;

    // Update length constraints
    if (this.maxlength !== null && !Number.isNaN(this.maxlength)) {
      textarea.maxLength = this.maxlength;
    } else {
      textarea.removeAttribute("maxlength");
    }

    if (this.minlength !== null && !Number.isNaN(this.minlength)) {
      textarea.minLength = this.minlength;
    } else {
      textarea.removeAttribute("minlength");
    }

    // Update accessibility attributes
    if (this.label) {
      textarea.setAttribute("aria-label", this.label);
    } else {
      textarea.removeAttribute("aria-label");
    }

    if (this.describedby) {
      textarea.setAttribute("aria-describedby", this.describedby);
    } else {
      textarea.removeAttribute("aria-describedby");
    }

    textarea.setAttribute("aria-invalid", (!this.isValid()).toString());
    textarea.setAttribute("aria-required", this.required.toString());

    if (this.autocomplete) {
      textarea.setAttribute("autocomplete", this.autocomplete);
    } else {
      textarea.removeAttribute("autocomplete");
    }

    // Update character counter
    this.updateCharCounter();
    this.autoResize();
  }

  updateCharCounter() {
    if (!this.maxlength) return;

    const textarea = this.shadowRoot?.querySelector(".textarea");
    const counter = this.shadowRoot?.querySelector(".current");
    if (textarea && counter) {
      counter.textContent = textarea.value.length;
    }
  }

  setupEventListeners() {
    const textarea = this.shadowRoot?.querySelector(".textarea");
    if (!textarea) return;

    // Handle input changes
    textarea.addEventListener("input", (e) => {
      // Do not write back to attribute here to avoid re-renders during typing
      this.updateCharCounter();
      this.autoResize();
      this.dispatchEvent(
        new CustomEvent("change", {
          bubbles: true,
          composed: true,
          detail: { value: e.target.value, originalEvent: e },
        })
      );
    });

    // Handle focus
    textarea.addEventListener("focus", (e) => {
      this.dispatchEvent(
        new CustomEvent("open", {
          bubbles: true,
          composed: true,
          detail: { originalEvent: e },
        })
      );
    });

    // Handle blur without invalid styling
    textarea.addEventListener("blur", (e) => {
      const isValid = this.isValid();
      this.dispatchEvent(
        new CustomEvent("close", {
          bubbles: true,
          composed: true,
          detail: {
            value: textarea.value,
            isValid: isValid,
            validationMessage:
              textarea.validationMessage || this._customValidity,
            originalEvent: e,
          },
        })
      );
    });

    // Handle submit on Ctrl+Enter or Cmd+Enter
    textarea.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        this.dispatchEvent(
          new CustomEvent("submit", {
            bubbles: true,
            composed: true,
            detail: { value: textarea.value, originalEvent: e },
          })
        );
      }
    });
  }

  // Calculate and apply height based on content, clamped between minRows and maxRows
  autoResize() {
    const textarea = this.shadowRoot?.querySelector(".textarea");
    if (!textarea) return;

    // Temporarily reset height to measure content height accurately
    textarea.style.height = "auto";

    const computed = window.getComputedStyle(textarea);
    const parsePx = (v) => (v ? parseFloat(v) : 0);
    const paddingY =
      parsePx(computed.paddingTop) + parsePx(computed.paddingBottom);
    const borderY =
      parsePx(computed.borderTopWidth) + parsePx(computed.borderBottomWidth);
    const lineHeight = this._getLineHeightPx(computed);

    const minHeight = this.minRows * lineHeight + paddingY + borderY;
    const maxHeight = this.maxRows * lineHeight + paddingY + borderY;

    // scrollHeight includes padding but not borders
    const contentHeight = textarea.scrollHeight + borderY; // normalize to include borders for clamping

    const clamped = Math.max(minHeight, Math.min(contentHeight, maxHeight));
    textarea.style.height = `${clamped}px`;
    textarea.style.overflowY = contentHeight > maxHeight ? "auto" : "hidden";
  }

  _getLineHeightPx(computed) {
    const lh = computed.lineHeight;
    if (lh && lh !== "normal") {
      const v = parseFloat(lh);
      if (!Number.isNaN(v)) return v;
    }
    const fs = parseFloat(computed.fontSize) || 14;
    // Approximate "normal" line-height
    return Math.round(fs * 1.35);
  }

  // Public methods
  getValue() {
    const textarea = this.shadowRoot?.querySelector(".textarea");
    return textarea ? textarea.value : this.value;
  }

  setValue(value) {
    this.value = value;
    this.updateValue();
  }

  focus() {
    const textarea = this.shadowRoot?.querySelector(".textarea");
    if (textarea) {
      textarea.focus();
    }
  }

  blur() {
    const textarea = this.shadowRoot?.querySelector(".textarea");
    if (textarea) {
      textarea.blur();
    }
  }

  isValid() {
    const textarea = this.shadowRoot?.querySelector(".textarea");
    if (!textarea) return true;

    // Check HTML5 validation
    const isValidHTML5 = textarea.checkValidity();

    // Check custom validity
    const hasCustomValidity = this._customValidity.length > 0;

    return isValidHTML5 && !hasCustomValidity;
  }

  setCustomValidity(message) {
    this._customValidity = message || "";
    const textarea = this.shadowRoot?.querySelector(".textarea");
    if (textarea) {
      textarea.setCustomValidity(message || "");
    }
  }

  // Public methods
  setDisabled() {
    this.setAttribute("disabled", "");
    this.updateTextareaAttributes();
  }

  setEnabled() {
    this.removeAttribute("disabled");
    this.updateTextareaAttributes();
  }

  isDisabled() {
    return this.hasAttribute("disabled");
  }
}

// Register the custom element
customElements.define("agc-textarea", AGCTextarea);

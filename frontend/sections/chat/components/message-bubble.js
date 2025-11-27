/**
 * Message Bubble Component
 *
 * A component for displaying individual chat messages or message sections.
 *
 * Attributes:
 * - sender: Message sender (e.g., "user", "assistant", "system")
 * - section-type: Type of section ("thinking", "commentary", "function-call", "response", or empty for regular)
 * - timestamp: Optional timestamp string
 * - content: Message content text
 * - collapsed: Boolean attribute - if present, section is collapsed (default: true for thinking/commentary/function-call)
 *
 * Usage Examples:
 *
 * // Basic user message
 * <message-bubble sender="user" content="Hello, how are you?"></message-bubble>
 *
 * // Assistant response section
 * <message-bubble 
 *   sender="assistant" 
 *   section-type="response"
 *   content="I'm doing well, thank you!"
 *   timestamp="12:34 PM">
 * </message-bubble>
 *
 * // Collapsible thinking section
 * <message-bubble 
 *   sender="assistant" 
 *   section-type="thinking"
 *   content="Let me think about this..."
 *   timestamp="12:34 PM"
 *   collapsed>
 * </message-bubble>
 *
 * Styling:
 * - Different styling for user vs assistant messages
 * - User messages align right, assistant messages align left
 * - Collapsible sections for thinking, commentary, and function-call
 * - Icons for different section types
 * - Dark mode minimalistic design
 */
export class MessageBubble extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  static get observedAttributes() {
    return ["sender", "section-type", "timestamp", "content", "collapsed"];
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  attributeChangedCallback() {
    if (this.shadowRoot) {
      this.render();
      this.setupEventListeners();
    }
  }

  get sender() {
    return this.getAttribute("sender") || "user";
  }

  get sectionType() {
    return this.getAttribute("section-type") || "";
  }

  get timestamp() {
    return this.getAttribute("timestamp") || "";
  }

  get content() {
    return this.getAttribute("content") || "";
  }

  get collapsed() {
    // Default to collapsed for thinking, commentary, and function-call sections
    if (this.hasAttribute("collapsed")) {
      const value = this.getAttribute("collapsed");
      // If attribute exists and is explicitly "false", return false (expanded)
      if (value === "false") {
        return false;
      }
      // Otherwise, attribute exists (even if empty), return true (collapsed)
      return true;
    }
    // If attribute doesn't exist, default to collapsed for collapsible types
    const collapsibleTypes = ["thinking", "commentary", "function-call"];
    return collapsibleTypes.includes(this.sectionType);
  }

  getIcon() {
    switch (this.sectionType) {
      case "thinking":
        return "💭"; // Thinking icon
      case "commentary":
        return "💬"; // Commentary icon
      case "function-call":
        return "⚙️"; // Function call icon
      default:
        return "";
    }
  }

  getSectionLabel() {
    switch (this.sectionType) {
      case "thinking":
        return "Thinking";
      case "commentary":
        return "Commentary";
      case "function-call":
        return "Function Call";
      default:
        return "";
    }
  }

  isCollapsible() {
    return ["thinking", "commentary", "function-call"].includes(this.sectionType);
  }

  render() {
    const isUser = this.sender === "user";
    const isSystem = this.sender === "system";
    const isCollapsible = this.isCollapsible();
    const isCollapsed = this.collapsed && isCollapsible;
    const icon = this.getIcon();
    const sectionLabel = this.getSectionLabel();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          margin-bottom: 4px;
        }

        .message-wrapper {
          display: flex;
          flex-direction: column;
          align-items: ${isUser ? "flex-end" : "flex-start"};
          width: 100%;
        }

        .message-bubble {
          max-width: 70%;
          padding: 8px 12px;
          border-radius: 8px;
          word-wrap: break-word;
          position: relative;
        }

        .message-bubble.user {
          background-color: var(--message-user-bg, #2a5c8f);
          color: var(--message-user-text, #e0e0e0);
          border-bottom-right-radius: 4px;
          padding: 8px 12px;
        }

        .message-bubble.assistant {
          background-color: var(--message-assistant-bg, #2a2a2a);
          color: var(--message-assistant-text, #e0e0e0);
          border: 1px solid var(--message-assistant-border, #353535);
          border-bottom-left-radius: 4px;
          padding: 8px;
        }

        .message-bubble.system {
          background-color: var(--message-system-bg, #1a1a1a);
          color: var(--message-system-text, #888888);
          border: 1px solid var(--message-system-border, #2a2a2a);
          border-radius: 8px;
          max-width: 100%;
          text-align: center;
          font-style: italic;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          user-select: none;
          margin-bottom: 0;
        }

        .section-header:not(.collapsed) {
          margin-bottom: 10px;
        }

        .section-icon {
          font-size: 16px;
        }

        .section-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--message-section-label-color, #b0b0b0);
        }

        .collapse-indicator {
          margin-left: auto;
          font-size: 12px;
          color: var(--message-section-label-color, #888888);
          transition: transform 0.2s ease;
        }

        .section-header.collapsed .collapse-indicator {
          transform: rotate(-90deg);
        }

        .message-content {
          margin: 0;
          font-size: 14px;
          line-height: 1.3;
          white-space: normal;
        }

        .message-content.collapsed {
          display: none;
        }

        /* Styling for content inside collapsible sections */
        :host([section-type="thinking"]) .message-content:not(.collapsed),
        :host([section-type="commentary"]) .message-content:not(.collapsed),
        :host([section-type="function-call"]) .message-content:not(.collapsed) {
          background-color: rgba(0, 0, 0, 0.35);
          padding: 8px 10px;
          border-radius: 4px;
          opacity: 0.8;
        }

        .message-timestamp {
          font-size: 11px;
          color: var(--message-timestamp-color, #666666);
          margin-top: 2px;
          padding: 0 4px;
        }
      </style>
      <div class="message-wrapper">
        <div class="message-bubble ${this.sender}">
          ${
            isCollapsible
              ? `
            <div class="section-header ${isCollapsed ? "collapsed" : ""}">
              <span class="section-icon">${icon}</span>
              <span class="section-label">${sectionLabel}</span>
              <span class="collapse-indicator">▼</span>
            </div>
          `
              : ""
          }
          <div class="message-content ${isCollapsed ? "collapsed" : ""}">
            ${this.content}
          </div>
        </div>
        ${this.timestamp ? `<div class="message-timestamp">${this.timestamp}</div>` : ""}
      </div>
    `;
  }

  setupEventListeners() {
    if (!this.isCollapsible()) return;

    const header = this.shadowRoot.querySelector(".section-header");
    if (header) {
      // Remove existing listener to prevent duplicates
      if (this._toggleCollapse) {
        header.removeEventListener("click", this._toggleCollapse);
      }
      // Add new listener
      this._toggleCollapse = () => {
        const currentlyCollapsed = this.collapsed;
        if (currentlyCollapsed) {
          // Expand: set to false
          this.setAttribute("collapsed", "false");
        } else {
          // Collapse: set to empty string (or remove, but empty string is clearer)
          this.setAttribute("collapsed", "");
        }
      };
      header.addEventListener("click", this._toggleCollapse);
    }
  }
}

// Register the custom element
customElements.define("message-bubble", MessageBubble);


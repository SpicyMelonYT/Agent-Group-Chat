/**
 * Chat Message Component
 *
 * A component for displaying individual chat messages. The root element is a container
 * with no styling - it contains individual section bubbles that have backgrounds and borders.
 *
 * Attributes:
 * - sender: Message sender (e.g., "user", "assistant", "system")
 * - timestamp: Optional timestamp string (for user messages - applied to the section)
 * - content: Message content text (for user messages)
 *
 * For assistant messages with multiple sections, use the API methods:
 * - addSection(sectionType, timestamp): Add a new section
 * - updateSectionContent(sectionIndex, content): Update content of a section
 * - updateSectionContentByType(sectionType, content): Update content by section type (updates first matching section)
 *
 * Usage Examples:
 *
 * // Basic user message
 * <chat-message sender="user" content="Hello, how are you?"></chat-message>
 *
 * // Assistant message with streaming sections (programmatic)
 * const message = document.createElement('chat-message');
 * message.setAttribute('sender', 'assistant');
 * message.addSection('thinking', '12:00 PM');
 * message.updateSectionContent(0, 'Let me think...');
 * message.addSection('response', '12:00 PM');
 * message.updateSectionContent(1, 'Here is my response');
 *
 * Styling:
 * - Root element has no background/border - just a container
 * - Each section is its own bubble with background/border
 * - User sections: blue background, right-aligned
 * - Assistant sections: gray background, left-aligned
 * - Collapsible sections for thinking, commentary, and function-call
 * - Icons for different section types
 * - Dark mode minimalistic design
 */
export class ChatMessage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._sections = []; // Track sections internally
    this._isInitialized = false;
  }

  static get observedAttributes() {
    return ["sender", "timestamp", "content"];
  }

  connectedCallback() {
    if (!this._isInitialized) {
      this.initialize();
      this._isInitialized = true;
      // Dispatch event to notify that component is ready
      this.dispatchEvent(new CustomEvent("chat-message-ready", { bubbles: true, composed: true }));
    }
  }

  attributeChangedCallback(name) {
    if (this._isInitialized && this.shadowRoot) {
      // Handle attribute changes for simple messages (user/system)
      if (this.sender === "user" || this.sender === "system") {
        this.renderSimpleMessage();
      }
    }
  }

  get sender() {
    return this.getAttribute("sender") || "user";
  }

  get timestamp() {
    return this.getAttribute("timestamp") || "";
  }

  get content() {
    return this.getAttribute("content") || "";
  }

  initialize() {
    const isUser = this.sender === "user";
    const isSystem = this.sender === "system";
    const isAssistant = this.sender === "assistant";

    // For assistant messages, create structure for multiple sections
    // For user/system, render simple message with one section
    if (isAssistant) {
      this.renderAssistantStructure();
    } else {
      this.renderSimpleMessage();
    }
  }

  renderAssistantStructure() {
    const isUser = false; // Always false for assistant
    const isSystem = false;

    this.shadowRoot.innerHTML = `
      <style>
        ${this.getStyles(isUser, isSystem)}
      </style>
      <div class="message-wrapper">
        <div class="sections-container"></div>
      </div>
    `;
  }

  renderSimpleMessage() {
    const isUser = this.sender === "user";
    const isSystem = this.sender === "system";
    const content = this.content;
    const timestamp = this.timestamp;

    // For user/system messages, create a single section
    // We'll use "response" as the section type for user/system messages
    const sectionType = isSystem ? "system" : "response";
    
    this.shadowRoot.innerHTML = `
      <style>
        ${this.getStyles(isUser, isSystem)}
      </style>
      <div class="message-wrapper">
        <div class="sections-container"></div>
      </div>
    `;

    // After rendering, add the single section
    // Use setTimeout to ensure shadowRoot is ready
    setTimeout(() => {
      const sectionIndex = this.addSection(sectionType, timestamp);
      if (sectionIndex >= 0) {
        this.updateSectionContent(sectionIndex, content);
      }
    }, 0);
  }

  getStyles(isUser, isSystem) {
    return `
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

        .sections-container {
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-width: calc(100% - 300px);
        }

        .section-wrapper {
          display: flex;
          flex-direction: column;
          align-items: ${isUser ? "flex-end" : "flex-start"};
        }

        .section {
          display: flex;
          flex-direction: column;
          padding: 8px 12px;
          border-radius: 8px;
          word-wrap: break-word;
          position: relative;
          max-width: 70%;
          width: fit-content;
          min-width: fit-content;
        }

        .section.user,
        .section.response {
          background-color: var(--message-user-bg, #2a5c8f);
          color: var(--message-user-text, #e0e0e0);
          border-bottom-right-radius: 4px;
        }

        .section.assistant {
          background-color: var(--message-assistant-bg, #2a2a2a);
          color: var(--message-assistant-text, #e0e0e0);
          border: 1px solid var(--message-assistant-border, #353535);
          border-bottom-left-radius: 4px;
          padding: 8px;
        }

        .section.system {
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
          flex-shrink: 0;
          min-width: fit-content;
        }

        .section-header:not(.collapsed) {
          margin-bottom: 10px;
        }

        .section-header.collapsed {
          margin-bottom: 0;
        }

        .section-icon {
          font-size: 16px;
        }

        .section-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--message-section-label-color, #b0b0b0);
          white-space: nowrap;
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

        .section-content {
          margin: 0;
          font-size: 14px;
          line-height: 1.3;
          white-space: normal;
        }

        .section-content.collapsed {
          display: none;
        }

        /* Styling for content inside collapsible sections */
        .section[data-section-type="thinking"] .section-content:not(.collapsed),
        .section[data-section-type="commentary"] .section-content:not(.collapsed),
        .section[data-section-type="function-call"] .section-content:not(.collapsed) {
          background-color: rgba(0, 0, 0, 0.35);
          padding: 8px 10px;
          border-radius: 4px;
          opacity: 0.8;
        }

        .section-timestamp {
          font-size: 11px;
          color: var(--message-timestamp-color, #666666);
          margin-top: 2px;
          padding: 0 4px;
          white-space: nowrap;
        }
      `;
  }

  getIcon(sectionType) {
    switch (sectionType) {
      case "thinking":
        return "💭";
      case "commentary":
        return "💬";
      case "function-call":
        return "⚙️";
      default:
        return "";
    }
  }

  getSectionLabel(sectionType) {
    switch (sectionType) {
      case "thinking":
        return "Thinking";
      case "commentary":
        return "Commentary";
      case "function-call":
        return "Function Call";
      case "response":
        return "";
      case "system":
        return "";
      default:
        return "";
    }
  }

  isCollapsible(sectionType) {
    return ["thinking", "commentary", "function-call"].includes(sectionType);
  }

  /**
   * Add a new section to a message
   * @param {string} sectionType - Type of section ("thinking", "commentary", "function-call", "response", "system", "user")
   * @param {string} timestamp - Optional timestamp string
   * @returns {number} Index of the newly added section
   */
  addSection(sectionType, timestamp = "") {
    const sectionsContainer = this.shadowRoot?.querySelector(".sections-container");
    if (!sectionsContainer) {
      console.error("Sections container not found. Component may not be initialized.");
      return -1;
    }

    const sectionIndex = this._sections.length;
    const isCollapsible = this.isCollapsible(sectionType);
    const icon = this.getIcon(sectionType);
    const sectionLabel = this.getSectionLabel(sectionType);

    // Determine the CSS class for styling based on sender and section type
    let sectionClass = sectionType;
    // For user messages, use "user" class; for assistant, use section type or "assistant"
    if (this.sender === "user" && sectionType === "response") {
      sectionClass = "user";
    } else if (this.sender === "assistant") {
      sectionClass = "assistant";
    }

    // Create section wrapper to contain section and timestamp
    const sectionWrapper = document.createElement("div");
    sectionWrapper.className = "section-wrapper";

    // Create section element
    const section = document.createElement("div");
    section.className = `section ${sectionClass}`;
    section.setAttribute("data-section-type", sectionType);
    section.setAttribute("data-section-index", sectionIndex.toString());

    // Create section content
    const sectionContent = document.createElement("div");
    sectionContent.className = `section-content ${isCollapsible ? "collapsed" : ""}`;
    sectionContent.textContent = ""; // Start empty for streaming

    // Create timestamp element (outside the section bubble)
    const timestampEl = document.createElement("div");
    timestampEl.className = "section-timestamp";
    timestampEl.textContent = timestamp || "";
    if (!timestamp) {
      timestampEl.style.display = "none";
    }

    // If collapsible, add header
    if (isCollapsible) {
      const header = document.createElement("div");
      header.className = "section-header collapsed";
      header.innerHTML = `
        <span class="section-icon">${icon}</span>
        <span class="section-label">${sectionLabel}</span>
        <span class="collapse-indicator">▼</span>
      `;

      // Add click handler for collapse/expand
      const toggleHandler = () => {
        const isCollapsed = header.classList.contains("collapsed");
        if (isCollapsed) {
          header.classList.remove("collapsed");
          sectionContent.classList.remove("collapsed");
        } else {
          header.classList.add("collapsed");
          sectionContent.classList.add("collapsed");
        }
      };
      header.addEventListener("click", toggleHandler);

      section.appendChild(header);
    }

    section.appendChild(sectionContent);
    
    // Add section and timestamp to wrapper (timestamp outside the bubble)
    sectionWrapper.appendChild(section);
    sectionWrapper.appendChild(timestampEl);

    sectionsContainer.appendChild(sectionWrapper);

    // Store section data
    this._sections.push({
      type: sectionType,
      timestamp: timestamp,
      element: section,
      wrapperElement: sectionWrapper,
      contentElement: sectionContent,
      timestampElement: timestampEl,
      headerElement: isCollapsible ? section.querySelector(".section-header") : null,
    });

    return sectionIndex;
  }

  /**
   * Update the content of a section by index
   * @param {number} sectionIndex - Index of the section to update
   * @param {string} content - New content text
   */
  updateSectionContent(sectionIndex, content) {
    if (sectionIndex < 0 || sectionIndex >= this._sections.length) {
      console.warn(`Section index ${sectionIndex} is out of range`);
      return;
    }

    const section = this._sections[sectionIndex];
    if (section && section.contentElement) {
      section.contentElement.textContent = content;
    }
  }

  /**
   * Update the content of a section by type (updates first matching section)
   * @param {string} sectionType - Type of section to update
   * @param {string} content - New content text
   * @returns {boolean} True if section was found and updated
   */
  updateSectionContentByType(sectionType, content) {
    const sectionIndex = this._sections.findIndex((s) => s.type === sectionType);
    if (sectionIndex === -1) {
      return false;
    }
    this.updateSectionContent(sectionIndex, content);
    return true;
  }

  /**
   * Append content to a section (useful for streaming)
   * @param {number} sectionIndex - Index of the section
   * @param {string} additionalContent - Content to append
   */
  appendSectionContent(sectionIndex, additionalContent) {
    if (sectionIndex < 0 || sectionIndex >= this._sections.length) {
      console.warn(`Section index ${sectionIndex} is out of range`);
      return;
    }

    const section = this._sections[sectionIndex];
    if (section && section.contentElement) {
      section.contentElement.textContent += additionalContent;
    }
  }

  /**
   * Append content to a section by type
   * @param {string} sectionType - Type of section
   * @param {string} additionalContent - Content to append
   * @returns {boolean} True if section was found and updated
   */
  appendSectionContentByType(sectionType, additionalContent) {
    const sectionIndex = this._sections.findIndex((s) => s.type === sectionType);
    if (sectionIndex === -1) {
      return false;
    }
    this.appendSectionContent(sectionIndex, additionalContent);
    return true;
  }
}

// Register the custom element
customElements.define("chat-message", ChatMessage);

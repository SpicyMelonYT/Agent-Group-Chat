/**
 * Chat Message Component
 *
 * A component for displaying individual chat messages. The root element is a container
 * with no styling - it contains individual segment bubbles that have backgrounds and borders.
 *
 * Attributes:
 * - sender: Message sender (e.g., "user", "assistant", "system")
 * - timestamp: Optional timestamp string (for user messages - applied to the segment)
 * - content: Message content text (for user messages)
 *
 * For assistant messages with multiple segments, use the API methods:
 * - addSegment(segmentType, timestamp): Add a new segment
 * - updateSegmentContent(segmentIndex, content): Update content of a segment
 * - updateSegmentContentByType(segmentType, content): Update content by segment type (updates first matching segment)
 *
 * Usage Examples:
 *
 * // Basic user message
 * <chat-message sender="user" content="Hello, how are you?"></chat-message>
 *
 * // Assistant message with streaming segments (programmatic)
 * const message = document.createElement('chat-message');
 * message.setAttribute('sender', 'assistant');
 * message.addSegment('thinking', '12:00 PM');
 * message.updateSegmentContent(0, 'Let me think...');
 * message.addSegment('response', '12:00 PM');
 * message.updateSegmentContent(1, 'Here is my response');
 *
 * Styling:
 * - Root element has no background/border - just a container
 * - Each segment is its own bubble with background/border
 * - User segments: blue background, right-aligned
 * - Assistant segments: gray background, left-aligned
 * - Collapsible segments for thinking, commentary, and function-call
 * - Icons for different segment types
 * - Dark mode minimalistic design
 */
export class ChatMessage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._segments = []; // Track segments internally
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

    // For assistant messages, create structure for multiple segments
    // For user/system, render simple message with one segment
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
        <div class="segments-container"></div>
      </div>
    `;
  }

  renderSimpleMessage() {
    const isUser = this.sender === "user";
    const isSystem = this.sender === "system";
    const content = this.content;
    const timestamp = this.timestamp;

    // For user/system messages, create a single segment
    // We'll use "response" as the segment type for user/system messages
    const segmentType = isSystem ? "system" : "response";
    
    this.shadowRoot.innerHTML = `
      <style>
        ${this.getStyles(isUser, isSystem)}
      </style>
      <div class="message-wrapper">
        <div class="segments-container"></div>
      </div>
    `;

    // After rendering, add the single segment
    // Use setTimeout to ensure shadowRoot is ready
    setTimeout(() => {
      const segmentIndex = this.addSegment(segmentType, timestamp);
      if (segmentIndex >= 0) {
        this.updateSegmentContent(segmentIndex, content);
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

        .segments-container {
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-width: calc(100% - 300px);
        }

        .segment-wrapper {
          display: flex;
          flex-direction: column;
          align-items: ${isUser ? "flex-end" : "flex-start"};
        }

        .segment {
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

        .segment.user,
        .segment.response {
          background-color: var(--message-user-bg, #2a5c8f);
          color: var(--message-user-text, #e0e0e0);
          border-bottom-right-radius: 4px;
        }

        .segment.assistant {
          background-color: var(--message-assistant-bg, #2a2a2a);
          color: var(--message-assistant-text, #e0e0e0);
          border: 1px solid var(--message-assistant-border, #353535);
          border-bottom-left-radius: 4px;
          padding: 8px;
        }

        .segment.system {
          background-color: var(--message-system-bg, #1a1a1a);
          color: var(--message-system-text, #888888);
          border: 1px solid var(--message-system-border, #2a2a2a);
          border-radius: 8px;
          max-width: 100%;
          text-align: center;
          font-style: italic;
        }

        .segment-header {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          user-select: none;
          margin-bottom: 0;
          flex-shrink: 0;
          min-width: fit-content;
        }

        .segment-header:not(.collapsed) {
          margin-bottom: 10px;
        }

        .segment-header.collapsed {
          margin-bottom: 0;
        }

        .segment-icon {
          font-size: 16px;
        }

        .segment-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--message-segment-label-color, #b0b0b0);
          white-space: nowrap;
        }

        .collapse-indicator {
          margin-left: auto;
          font-size: 12px;
          color: var(--message-segment-label-color, #888888);
          transition: transform 0.2s ease;
        }

        .segment-header.collapsed .collapse-indicator {
          transform: rotate(-90deg);
        }

        .segment-content {
          margin: 0;
          font-size: 14px;
          line-height: 1.3;
          white-space: normal;
        }

        .segment-content.collapsed {
          display: none;
        }

        /* Remove top margin from first paragraph and bottom margin from last paragraph */
        .segment-content > p:first-child {
          margin-top: 0;
        }

        .segment-content > p:last-child {
          margin-bottom: 0;
        }

        /* If there's only one paragraph, remove both margins */
        .segment-content > p:only-child {
          margin-top: 0;
          margin-bottom: 0;
        }

        /* Styling for content inside collapsible segments */
        .segment[data-segment-type="thinking"] .segment-content:not(.collapsed),
        .segment[data-segment-type="commentary"] .segment-content:not(.collapsed),
        .segment[data-segment-type="function-call"] .segment-content:not(.collapsed) {
          background-color: rgba(0, 0, 0, 0.35);
          padding: 8px 10px;
          border-radius: 4px;
          opacity: 0.8;
        }

        .segment-timestamp {
          font-size: 11px;
          color: var(--message-timestamp-color, #666666);
          margin-top: 2px;
          padding: 0 4px;
          white-space: nowrap;
        }
      `;
  }

  getIcon(segmentType) {
    switch (segmentType) {
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

  getSegmentLabel(segmentType) {
    switch (segmentType) {
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

  isCollapsible(segmentType) {
    return ["thinking", "commentary", "function-call"].includes(segmentType);
  }

  /**
   * Add a new segment to a message
   * @param {string} segmentType - Type of segment ("thinking", "commentary", "function-call", "response", "system", "user")
   * @param {string} timestamp - Optional timestamp string
   * @returns {number} Index of the newly added segment
   */
  addSegment(segmentType, timestamp = "") {
    const segmentsContainer = this.shadowRoot?.querySelector(".segments-container");
    if (!segmentsContainer) {
      console.error("Segments container not found. Component may not be initialized.");
      return -1;
    }

    const segmentIndex = this._segments.length;
    const isCollapsible = this.isCollapsible(segmentType);
    const icon = this.getIcon(segmentType);
    const segmentLabel = this.getSegmentLabel(segmentType);

    // Determine the CSS class for styling based on sender and segment type
    let segmentClass = segmentType;
    // For user messages, use "user" class; for assistant, use segment type or "assistant"
    if (this.sender === "user" && segmentType === "response") {
      segmentClass = "user";
    } else if (this.sender === "assistant") {
      segmentClass = "assistant";
    }

    // Create segment wrapper to contain segment and timestamp
    const segmentWrapper = document.createElement("div");
    segmentWrapper.className = "segment-wrapper";

    // Create segment element
    const segment = document.createElement("div");
    segment.className = `segment ${segmentClass}`;
    segment.setAttribute("data-segment-type", segmentType);
    segment.setAttribute("data-segment-index", segmentIndex.toString());

    // Create segment content
    const segmentContent = document.createElement("div");
    segmentContent.className = `segment-content ${isCollapsible ? "collapsed" : ""}`;
    segmentContent.textContent = ""; // Start empty for streaming

    // Create timestamp element (outside the segment bubble)
    const timestampEl = document.createElement("div");
    timestampEl.className = "segment-timestamp";
    timestampEl.textContent = timestamp || "";
    if (!timestamp) {
      timestampEl.style.display = "none";
    }

    // If collapsible, add header
    if (isCollapsible) {
      const header = document.createElement("div");
      header.className = "segment-header collapsed";
      header.innerHTML = `
        <span class="segment-icon">${icon}</span>
        <span class="segment-label">${segmentLabel}</span>
        <span class="collapse-indicator">▼</span>
      `;

      // Add click handler for collapse/expand
      const toggleHandler = () => {
        const isCollapsed = header.classList.contains("collapsed");
        if (isCollapsed) {
          header.classList.remove("collapsed");
          segmentContent.classList.remove("collapsed");
        } else {
          header.classList.add("collapsed");
          segmentContent.classList.add("collapsed");
        }
      };
      header.addEventListener("click", toggleHandler);

      segment.appendChild(header);
    }

    segment.appendChild(segmentContent);
    
    // Add segment and timestamp to wrapper (timestamp outside the bubble)
    segmentWrapper.appendChild(segment);
    segmentWrapper.appendChild(timestampEl);

    segmentsContainer.appendChild(segmentWrapper);

    // Store segment data
    this._segments.push({
      type: segmentType,
      timestamp: timestamp,
      element: segment,
      wrapperElement: segmentWrapper,
      contentElement: segmentContent,
      timestampElement: timestampEl,
      headerElement: isCollapsible ? segment.querySelector(".segment-header") : null,
      rawContent: "", // Store raw markdown content for streaming
    });

    return segmentIndex;
  }

  /**
   * Update the content of a segment by index
   * @param {number} segmentIndex - Index of the segment to update
   * @param {string} content - New content text (markdown will be parsed)
   */
  updateSegmentContent(segmentIndex, content) {
    if (segmentIndex < 0 || segmentIndex >= this._segments.length) {
      console.warn(`Segment index ${segmentIndex} is out of range`);
      return;
    }

    const segment = this._segments[segmentIndex];
    if (segment && segment.contentElement) {
      // Store raw content for streaming support
      segment.rawContent = content || "";
      
      // Parse markdown if markdown manager is available
      if (window.markdownManager) {
        const html = window.markdownManager.parse(segment.rawContent);
        segment.contentElement.innerHTML = html;
        this._trimSegmentSpacing(segment.contentElement);
      } else {
        // Fallback to plain text if markdown manager not available
        segment.contentElement.textContent = segment.rawContent;
      }
    }
  }

  /**
   * Update the content of a segment by type (updates first matching segment)
   * @param {string} segmentType - Type of segment to update
   * @param {string} content - New content text
   * @returns {boolean} True if segment was found and updated
   */
  updateSegmentContentByType(segmentType, content) {
    const segmentIndex = this._segments.findIndex((s) => s.type === segmentType);
    if (segmentIndex === -1) {
      return false;
    }
    this.updateSegmentContent(segmentIndex, content);
    return true;
  }

  /**
   * Append content to a segment (useful for streaming)
   * @param {number} segmentIndex - Index of the segment
   * @param {string} additionalContent - Content to append (markdown will be parsed)
   */
  appendSegmentContent(segmentIndex, additionalContent) {
    if (segmentIndex < 0 || segmentIndex >= this._segments.length) {
      console.warn(`Segment index ${segmentIndex} is out of range`);
      return;
    }

    const segment = this._segments[segmentIndex];
    if (segment && segment.contentElement) {
      // Append to raw content and re-parse (necessary for proper markdown parsing)
      segment.rawContent = (segment.rawContent || "") + additionalContent;
      
      // Parse markdown if markdown manager is available
      if (window.markdownManager) {
        const html = window.markdownManager.parse(segment.rawContent);
        segment.contentElement.innerHTML = html;
        this._trimSegmentSpacing(segment.contentElement);
      } else {
        // Fallback to plain text if markdown manager not available
        segment.contentElement.textContent = segment.rawContent;
      }
    }
  }

  /**
   * Append content to a segment by type
   * @param {string} segmentType - Type of segment
   * @param {string} additionalContent - Content to append
   * @returns {boolean} True if segment was found and updated
   */
  appendSegmentContentByType(segmentType, additionalContent) {
    const segmentIndex = this._segments.findIndex((s) => s.type === segmentType);
    if (segmentIndex === -1) {
      return false;
    }
    this.appendSegmentContent(segmentIndex, additionalContent);
    return true;
  }

  /**
   * Remove leading/trailing margins from the first and last rendered elements
   * inside a segment. This keeps the visual padding consistent regardless of
   * the markdown structure (paragraphs, lists, blockquotes, etc).
   * @param {HTMLElement} container
   */
  _trimSegmentSpacing(container) {
    if (!container) return;

    const firstElement = this._findEdgeElement(container, true);
    const lastElement = this._findEdgeElement(container, false);

    if (firstElement) {
      firstElement.style.marginTop = "0px";
    }

    if (lastElement) {
      lastElement.style.marginBottom = "0px";
    }
  }

  /**
   * Find the first or last meaningful descendant element (depth-first).
   * Text nodes with only whitespace are ignored.
   * @param {Node} node
   * @param {boolean} searchForward - true to search from start, false from end
   * @returns {HTMLElement|null}
   */
  _findEdgeElement(node, searchForward = true) {
    if (!node || !node.childNodes || !node.childNodes.length) {
      return null;
    }

    const children = Array.from(node.childNodes);
    const iterable = searchForward ? children : children.reverse();

    for (const child of iterable) {
      if (child.nodeType === Node.TEXT_NODE) {
        if (child.textContent && child.textContent.trim().length > 0) {
          // Text node with content - no margin to trim
          return null;
        }
        continue;
      }

      if (child.nodeType === Node.ELEMENT_NODE) {
        // If this element has children, drill down to find the actual edge element
        const deeper = this._findEdgeElement(child, searchForward);
        return (deeper || child);
      }
    }

    return null;
  }
}

// Register the custom element
customElements.define("chat-message", ChatMessage);

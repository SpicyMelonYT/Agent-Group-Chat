/**
 * Message Bubble Component
 *
 * A component for displaying individual chat messages.
 *
 * Attributes:
 * - sender: Message sender (e.g., "user", "assistant", "system")
 * - timestamp: Optional timestamp string
 * - content: Message content text
 *
 * Usage Examples:
 *
 * // Basic usage
 * <message-bubble sender="user" content="Hello, how are you?"></message-bubble>
 *
 * // With timestamp
 * <message-bubble 
 *   sender="assistant" 
 *   content="I'm doing well, thank you!"
 *   timestamp="12:34 PM">
 * </message-bubble>
 *
 * Styling:
 * - Different styling for user vs assistant messages
 * - User messages align right, assistant messages align left
 * - Dark mode minimalistic design
 */
export class MessageBubble extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  static get observedAttributes() {
    return ["sender", "timestamp", "content"];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    if (this.shadowRoot) {
      this.render();
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

  render() {
    const isUser = this.sender === "user";
    const isSystem = this.sender === "system";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          margin-bottom: 16px;
        }

        .message-wrapper {
          display: flex;
          flex-direction: column;
          align-items: ${isUser ? "flex-end" : "flex-start"};
          width: 100%;
        }

        .message-bubble {
          max-width: 70%;
          padding: 12px 16px;
          border-radius: 12px;
          word-wrap: break-word;
          position: relative;
        }

        .message-bubble.user {
          background-color: var(--message-user-bg, #2a5c8f);
          color: var(--message-user-text, #e0e0e0);
          border-bottom-right-radius: 4px;
        }

        .message-bubble.assistant {
          background-color: var(--message-assistant-bg, #2a2a2a);
          color: var(--message-assistant-text, #e0e0e0);
          border: 1px solid var(--message-assistant-border, #353535);
          border-bottom-left-radius: 4px;
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

        .message-content {
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
          white-space: pre-wrap;
        }

        .message-timestamp {
          font-size: 11px;
          color: var(--message-timestamp-color, #666666);
          margin-top: 4px;
          padding: 0 4px;
        }
      </style>
      <div class="message-wrapper">
        <div class="message-bubble ${this.sender}">
          <div class="message-content">${this.content}</div>
        </div>
        ${this.timestamp ? `<div class="message-timestamp">${this.timestamp}</div>` : ''}
      </div>
    `;
  }
}

// Register the custom element
customElements.define("message-bubble", MessageBubble);


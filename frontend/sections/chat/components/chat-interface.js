/**
 * Chat Interface Component
 *
 * The main chat interface component that contains the message list and input area.
 *
 * Usage Examples:
 *
 * // Basic usage
 * <chat-interface></chat-interface>
 *
 * // Event handling
 * const chatInterface = document.querySelector('chat-interface');
 * chatInterface.addEventListener('message-send', (e) => {
 *   console.log('Message to send:', e.detail.message);
 * });
 *
 * chatInterface.addEventListener('message-change', (e) => {
 *   console.log('Message changed:', e.detail.value);
 * });
 *
 * Methods:
 * - addMessage(sender, content, timestamp, sectionType): Add a message to the chat
 * - addMessageSection(sectionType, content, timestamp): Add a message section (for multi-section AI responses)
 * - clearMessages(): Clear all messages
 * - setInputValue(value): Set the input textarea value
 * - getInputValue(): Get the current input value
 * - focusInput(): Focus the input textarea
 *
 * Events:
 * - message-send: Fired when send button is clicked or Ctrl+Enter is pressed (detail: { message })
 * - message-change: Fired when textarea value changes (detail: { value })
 */
export class ChatInterface extends HTMLElement {
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

        .chat-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
        }

        .input-container {
          display: flex;
          gap: 12px;
          padding: 16px 20px;
          border-top: 1px solid var(--border-color, #2a2a2a);
          background-color: var(--input-container-bg, #1a1a1a);
        }

        .input-wrapper {
          flex: 1;
        }

        .send-button-wrapper {
          display: flex;
          align-items: flex-end;
        }

        /* Custom scrollbar styling */
        .messages-container::-webkit-scrollbar {
          width: 8px;
        }

        .messages-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }

        .messages-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }

        .messages-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      </style>
      <div class="chat-container">
        <div class="messages-container" id="messages-container">
        </div>
        <div class="input-container">
          <div class="input-wrapper">
            <agc-textarea
              id="chat-input"
              placeholder="Type your message..."
              rows="1"
              minrows="1"
              maxrows="5"
              color1="hsl(0, 0%, 12%)"
              radius="normal"
            ></agc-textarea>
          </div>
          <div class="send-button-wrapper">
            <agc-button id="send-button">Send</agc-button>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    const textarea = this.shadowRoot.querySelector("#chat-input");
    const sendButton = this.shadowRoot.querySelector("#send-button");

    if (!textarea || !sendButton) return;

    // Listen for textarea change events
    textarea.addEventListener("change", (e) => {
      this.dispatchEvent(
        new CustomEvent("message-change", {
          bubbles: false,
          composed: false,
          detail: {
            value: e.detail.value,
          },
        })
      );
    });

    // Listen for textarea submit events (Ctrl+Enter)
    textarea.addEventListener("submit", (e) => {
      const message = e.detail.value.trim();
      if (message) {
        this.dispatchEvent(
          new CustomEvent("message-send", {
            bubbles: false,
            composed: false,
            detail: {
              message: message,
            },
          })
        );
        // Clear input after sending
        textarea.setValue("");
      }
    });

    // Listen for send button clicks
    sendButton.addEventListener("click", () => {
      const message = textarea.getValue().trim();
      if (message) {
        this.dispatchEvent(
          new CustomEvent("message-send", {
            bubbles: false,
            composed: false,
            detail: {
              message: message,
            },
          })
        );
        // Clear input after sending
        textarea.setValue("");
      }
    });
  }

  // Public methods
  /**
   * Add a message to the chat
   * @param {string} sender - Message sender ("user", "assistant", "system")
   * @param {string} content - Message content
   * @param {string} timestamp - Optional timestamp string
   * @param {string} sectionType - Optional section type ("thinking", "commentary", "function-call", "response")
   */
  addMessage(sender, content, timestamp = "", sectionType = "") {
    const messageBubble = document.createElement("message-bubble");
    messageBubble.setAttribute("sender", sender);
    messageBubble.setAttribute("content", content);
    if (timestamp) {
      messageBubble.setAttribute("timestamp", timestamp);
    }
    if (sectionType) {
      messageBubble.setAttribute("section-type", sectionType);
    }

    const messagesContainer = this.shadowRoot.querySelector(
      ".messages-container"
    );
    if (messagesContainer) {
      messagesContainer.appendChild(messageBubble);
      // Scroll to bottom
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  /**
   * Add a message section (for multi-section AI responses)
   * @param {string} sectionType - Section type ("thinking", "commentary", "function-call", "response")
   * @param {string} content - Section content
   * @param {string} timestamp - Optional timestamp string
   */
  addMessageSection(sectionType, content, timestamp = "") {
    this.addMessage("assistant", content, timestamp, sectionType);
  }

  clearMessages() {
    const messagesContainer = this.shadowRoot.querySelector(
      ".messages-container"
    );
    if (messagesContainer) {
      // Remove all message-bubble elements
      const messages = messagesContainer.querySelectorAll("message-bubble");
      messages.forEach((msg) => msg.remove());
    }
  }

  setInputValue(value) {
    const textarea = this.shadowRoot.querySelector("#chat-input");
    if (textarea) {
      textarea.setValue(value);
    }
  }

  getInputValue() {
    const textarea = this.shadowRoot.querySelector("#chat-input");
    return textarea ? textarea.getValue() : "";
  }

  focusInput() {
    const textarea = this.shadowRoot.querySelector("#chat-input");
    if (textarea) {
      textarea.focus();
    }
  }
}

// Register the custom element
customElements.define("chat-interface", ChatInterface);


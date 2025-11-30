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
 * chatInterface.addEventListener('send-message', (e) => {
 *   console.log('Message to send:', e.detail.inputValue);
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
 * - clearInput(): Clear the input textarea
 *
 * Events:
 * - send-message: Fired when send button is clicked or Ctrl+Enter is pressed (detail: { inputValue })
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
          gap: 15px;
          padding: 15px;
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
              maxrows="9"
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
        this.dispatchEvent(
        new CustomEvent("send-message", {
            bubbles: false,
            composed: false,
            detail: {
            inputValue: e.detail.value,
            },
          })
        );
    });

    // Listen for send button clicks
    sendButton.addEventListener("click", () => {
        this.dispatchEvent(
        new CustomEvent("send-message", {
            bubbles: false,
            composed: false,
            detail: {
            inputValue: textarea.getValue(),
            },
          })
        );
    });
  }

  // Public methods
  /**
   * Add a message to the chat
   * @param {string} sender - Message sender ("user", "assistant", "system")
   * @param {string} content - Message content (for user/system messages, or initial content for assistant)
   * @param {string} timestamp - Optional timestamp string
   * @returns {HTMLElement} The created chat-message element
   */
  addMessage(sender, content = "", timestamp = "") {
    const messageBubble = document.createElement("chat-message");
    messageBubble.setAttribute("sender", sender);
    
    if (sender === "assistant") {
      // For assistant messages, create empty bubble (segments will be added via API)
      // If content is provided, add it as a response segment
      if (content) {
        // Wait for component to initialize, then add segment
        const addContent = () => {
          const segmentIndex = messageBubble.addSegment("response", timestamp);
          messageBubble.updateSegmentContent(segmentIndex, content);
        };
        
        if (messageBubble.shadowRoot && messageBubble.shadowRoot.querySelector(".segments-container")) {
          addContent();
        } else {
          messageBubble.addEventListener("chat-message-ready", addContent, { once: true });
        }
      }
    } else {
      // For user/system messages, set content and timestamp directly
      messageBubble.setAttribute("content", content);
      if (timestamp) {
        messageBubble.setAttribute("timestamp", timestamp);
      }
    }

    const messagesContainer = this.shadowRoot.querySelector(
      ".messages-container"
    );
    if (messagesContainer) {
      messagesContainer.appendChild(messageBubble);
      // Scroll to bottom
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    return messageBubble;
  }

  /**
   * Create a new assistant message bubble (for multi-section responses)
   * @returns {HTMLElement} The created chat-message element
   */
  createAssistantMessage() {
    return this.addMessage("assistant");
  }

  clearMessages() {
    const messagesContainer = this.shadowRoot.querySelector(
      ".messages-container"
    );
    if (messagesContainer) {
      // Remove all chat-message elements
      const messages = messagesContainer.querySelectorAll("chat-message");
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

  clearInput() {
    const textarea = this.shadowRoot.querySelector("#chat-input");
    if (textarea) {
      textarea.setValue("");
    }
  }
}

// Register the custom element
customElements.define("chat-interface", ChatInterface);


import { Manager } from "../../../core/index.js";

export class ChatManager extends Manager {
  async initElementReferences() {
    // Get component references
    this.chatInterface = document.querySelector("chat-interface");
  }

  async initEventListeners() {
    if (!this.chatInterface) {
      window.logger.error(
        {
          tags: "chat|manager|error",
          color1: "red",
        },
        "Chat interface component not found"
      );
      return;
    }

    // Listen for message-send events
    this.chatInterface.addEventListener("message-send", (e) => {
      this.handleMessageSend(e.detail.message);
    });

    // Listen for message-change events
    this.chatInterface.addEventListener("message-change", (e) => {
      this.handleMessageChange(e.detail.value);
    });
  }

  async initStates() {
    // Add placeholder messages for testing
    this.addPlaceholderMessages();
  }

  /**
   * Handle message send event
   * @param {string} message - The message to send
   */
  handleMessageSend(message) {
    window.logger.log(
      {
        tags: "chat|manager|send",
        color1: "cyan",
      },
      `Message send requested: "${message}"`
    );

    // TODO: Integrate with NodeLlamaCppManager to generate response
    // For now, just add the user message and a placeholder response
    if (this.chatInterface) {
      this.chatInterface.addMessage("user", message);
      
      // Placeholder response
      setTimeout(() => {
        this.chatInterface.addMessage(
          "assistant",
          "This is a placeholder response. NodeLlamaCppManager integration coming soon."
        );
      }, 500);
    }
  }

  /**
   * Handle message change event
   * @param {string} value - The current input value
   */
  handleMessageChange(value) {
    // Log for debugging (can be removed or filtered later)
    // window.logger.log(
    //   {
    //     tags: "chat|manager|change",
    //     color1: "grey",
    //     showTag: false,
    //   },
    //   `Input changed: "${value}"`
    // );
  }

  /**
   * Add placeholder messages for testing the UI
   */
  addPlaceholderMessages() {
    if (!this.chatInterface) return;

    const placeholderMessages = [
      {
        sender: "assistant",
        content: "Hello! I'm ready to chat. How can I help you today?",
        timestamp: "12:00 PM",
      },
      {
        sender: "user",
        content: "Hi there! This is a test message.",
        timestamp: "12:01 PM",
      },
      {
        sender: "assistant",
        content:
          "Great! I can see your message. The chat interface is working correctly.",
        timestamp: "12:01 PM",
      },
    ];

    placeholderMessages.forEach((msg) => {
      this.chatInterface.addMessage(msg.sender, msg.content, msg.timestamp);
    });
  }
}


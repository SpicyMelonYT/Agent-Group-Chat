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

    // Example user message
    this.chatInterface.addMessage(
      "user",
      "Can you help me understand how this chat system works?",
      "12:00 PM"
    );

    // Example AI response with multiple segments - all in ONE message bubble
    // This demonstrates the timeline of generation: thinking → commentary → function-call → thinking → response
    const assistantBubble = this.chatInterface.createAssistantMessage();
    
    // Wait for component to be connected and initialized
    const addSegments = () => {
      // Add segments one by one with delays to simulate streaming
      setTimeout(() => {
        const segmentIndex = assistantBubble.addSegment("thinking", "12:00 PM");
        assistantBubble.updateSegmentContent(
          segmentIndex,
          "The user is asking about how the chat system works. I should explain the component-based architecture, the event system, and how messages are structured. Let me think about the best way to explain this clearly."
        );
      }, 100);

      setTimeout(() => {
        const segmentIndex = assistantBubble.addSegment("commentary", "12:00 PM");
        assistantBubble.updateSegmentContent(
          segmentIndex,
          "This is a good opportunity to demonstrate the multi-segment response system. The user will be able to see how different parts of the AI's process are broken down into separate, collapsible segments."
        );
      }, 300);

      setTimeout(() => {
        const segmentIndex = assistantBubble.addSegment("function-call", "12:00 PM");
        assistantBubble.updateSegmentContent(
          segmentIndex,
          '{\n  "function": "getSystemInfo",\n  "arguments": {\n    "component": "chat-interface",\n    "details": true\n  }\n}'
        );
      }, 500);

      setTimeout(() => {
        const segmentIndex = assistantBubble.addSegment("thinking", "12:00 PM");
        assistantBubble.updateSegmentContent(
          segmentIndex,
          "Now I have all the information I need. I should provide a clear, structured explanation that covers the main components and how they work together."
        );
      }, 700);

      setTimeout(() => {
        const segmentIndex = assistantBubble.addSegment("response", "12:00 PM");
        assistantBubble.updateSegmentContent(
          segmentIndex,
          "The chat system is built using a component-based architecture with Web Components. Here's how it works:\n\n1. **Chat Messages**: Each message is displayed in a `chat-message` component that supports different segment types (thinking, commentary, function calls, and regular responses).\n\n2. **Chat Interface**: The main `chat-interface` component manages the message list and input area, dispatching custom events for message sending and changes.\n\n3. **Chat Manager**: The `ChatManager` hooks into the chat interface events and manages the chat state, eventually integrating with the backend LLM manager.\n\n4. **Multi-Segment Responses**: AI responses can be broken down into multiple segments, each with its own timestamp and collapsible content for thinking/commentary/function-call segments."
        );
      }, 900);
    };

    // Wait for the component to be ready
    if (assistantBubble.shadowRoot && assistantBubble.shadowRoot.querySelector(".segments-container")) {
      addSegments();
    } else {
      assistantBubble.addEventListener("chat-message-ready", addSegments, { once: true });
      // Fallback: try after a short delay
      setTimeout(() => {
        if (assistantBubble.shadowRoot && assistantBubble.shadowRoot.querySelector(".segments-container")) {
          addSegments();
        }
      }, 50);
    }
  }
}


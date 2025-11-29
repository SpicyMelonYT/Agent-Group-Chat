import { Manager } from "../../../core/index.js";

export class ChatManager extends Manager {
  async initElementReferences() {
    // Get component references by ID
    this.chatInterface = document.getElementById("chat-interface");
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

    // Listen for send-message events
    this.chatInterface.addEventListener("send-message", (e) => {
      const message = e.detail.inputValue.trim();
      if (message) {
        this.handleMessageSend(message);
        // Clear the input after sending
        this.chatInterface.clearInput();
      }
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
   * @param {string} message - The trimmed message to send
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
        const segmentIndex = assistantBubble.addSegment(
          "commentary",
          "12:00 PM"
        );
        assistantBubble.updateSegmentContent(
          segmentIndex,
          'This is a good opportunity to demonstrate the multi-segment response system. The user will be able to see how different parts of the AI\'s process are broken down into separate, collapsible segments.\n\n---\n\nKey features to highlight:\n\n- **Component-based architecture**: Each segment is independently rendered\n- **Collapsible sections**: Thinking and commentary can be expanded/collapsed\n- **Streaming support**: Content updates in real-time as it\'s generated\n- **Markdown rendering**: Rich text formatting with code blocks and lists\n\nHere\'s an example of how segments are created:\n\n```javascript\nconst segmentIndex = assistantBubble.addSegment("commentary", "12:00 PM");\nassistantBubble.updateSegmentContent(\n  segmentIndex,\n  "This is the commentary content..."\n);\n```'
        );
      }, 300);

      setTimeout(() => {
        const segmentIndex = assistantBubble.addSegment(
          "function-call",
          "12:00 PM"
        );
        assistantBubble.updateSegmentContent(
          segmentIndex,
          '```json\n{\n  "function": "getSystemInfo",\n  "arguments": {\n    "component": "chat-interface",\n    "details": true\n  }\n}\n```'
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
          'The chat system is built using a component-based architecture with Web Components. Here\'s how it works:\n\n1. **Chat Messages**: Each message is displayed in a `chat-message` component that supports different segment types (thinking, commentary, function calls, and regular responses).\n\n2. **Chat Interface**: The main `chat-interface` component manages the message list and input area, dispatching custom events for message sending and changes.\n\n3. **Chat Manager**: The `ChatManager` hooks into the chat interface events and manages the chat state, eventually integrating with the backend LLM manager.\n\n4. **Multi-Segment Responses**: AI responses can be broken down into multiple segments, each with its own timestamp and collapsible content for thinking/commentary/function-call segments.\n\nHere\'s an example of the component structure:\n\n```js\nexport class ChatMessage extends HTMLElement {\n  addSegment(segmentType, timestamp) {\n    // Creates a new segment in the message\n    return segmentIndex;\n  }\n  \n  updateSegmentContent(index, content) {\n    // Updates segment content with markdown parsing\n  }\n}\n```\n\nAnd here\'s the segment data structure:\n\n```json\n{\n  "type": "response",\n  "timestamp": "12:00 PM",\n  "content": "The actual message content...",\n  "element": "<div class=\'segment\'>...</div>",\n  "rawContent": "Original markdown text"\n}\n```\n\nAdditional technical details:\n\n19. **IPC Integration**: The ChatManager communicates with backend processes through Electron\'s IPC system, enabling secure data exchange between frontend and backend components.\n\n20. **File System Integration**: Chat conversations can be persisted to the file system using the StoreManager, with automatic backup and version control capabilities.\n\n21. **Plugin Architecture**: The system supports extensible plugins for additional chat features, custom message types, and third-party integrations.\n\n22. **Performance Monitoring**: Built-in performance tracking measures response times, memory usage, and rendering performance for optimization.\n\n23. **Security Layer**: All user inputs are sanitized and validated before processing, with Content Security Policy (CSP) headers protecting against XSS attacks.\n\n24. **Offline Support**: The chat interface gracefully handles network interruptions and provides offline messaging capabilities when appropriate.\n\n25. **Voice Integration**: Support for voice input and text-to-speech output, with accessibility features for users with different interaction preferences.\n\n26. **Collaboration Features**: Multi-user chat support with real-time synchronization, user presence indicators, and collaborative editing capabilities.\n\n27. **Analytics Integration**: Comprehensive usage analytics and user behavior tracking to improve the chat experience over time.\n\n28. **Custom Themes**: Extensive theming system allowing users to customize colors, fonts, layouts, and visual elements to their preferences.\n\n29. **Keyboard Shortcuts**: Full keyboard navigation support with customizable shortcuts for power users and accessibility compliance.\n\n30. **Export Capabilities**: Users can export conversations in various formats (PDF, HTML, JSON) for archiving or sharing purposes.\n\n31. **Search Functionality**: Advanced search and filtering capabilities across conversation history with full-text search and metadata filtering.\n\n32. **Notification System**: Smart notifications for new messages, mentions, and important updates with customizable alert preferences.\n\n33. **Backup and Recovery**: Automatic backup systems with point-in-time recovery options to prevent data loss.\n\nThe system is designed to be both powerful and flexible, supporting everything from simple chat interactions to complex multi-agent conversations with rich formatting \n```js \nawdawd\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\nawdawd``` and real-time collaboration features.'
        );
      }, 900);
    };

    // Wait for the component to be ready
    if (
      assistantBubble.shadowRoot &&
      assistantBubble.shadowRoot.querySelector(".segments-container")
    ) {
      addSegments();
    } else {
      assistantBubble.addEventListener("chat-message-ready", addSegments, {
        once: true,
      });
      // Fallback: try after a short delay
      setTimeout(() => {
        if (
          assistantBubble.shadowRoot &&
          assistantBubble.shadowRoot.querySelector(".segments-container")
        ) {
          addSegments();
        }
      }, 50);
    }
  }
}

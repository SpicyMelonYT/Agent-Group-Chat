import { Manager } from "../../../core/index.js";

export class ChatManager extends Manager {
  constructor() {
    super();
    this.configFile = "chat-config.json";
    this.config = null;
    this.eventListenersSetup = false;
    this.dialogOpening = false;
    this.modelLoading = false;
    this.modelUnloading = false;
    this.modelState = {
      isModelLoaded: false,
      modelPath: null,
      status: "uninitialized",
    };
    this.modelProgressUnsub = null;
    this.chatChunkUnsub = null;
    this.messages = []; // Track conversation history
    this.currentAssistantMessage = null; // Reference to currently streaming assistant message
  }

  async initElementReferences() {
    // Get component references by ID
    this.chatInterface = document.getElementById("chat-interface");
    this.chatHeader = document.querySelector("chat-header");
    this.chatSettingsModal = document.getElementById("chat-settings-modal");

    // Get loading overlay from HTML
    this.loadingOverlay = document.getElementById("loading-overlay");
  }

  async initEventListeners() {
    // Prevent duplicate event listener setup
    if (this.eventListenersSetup) {
      return;
    }
    this.eventListenersSetup = true;

    if (!this.chatInterface) {
      window.logger.error(
        {
          tags: "chat|manager|error",
          color1: "red",
          includeSource: true,
        },
        "Chat interface component not found"
      );
      return;
    }

    // Listen for send-message events
    this.chatInterface.addEventListener("send-message", async (e) => {
      const message = e.detail.inputValue.trim();
      if (message) {
        const ready = await this.ensureModelLoaded();
        if (!ready) {
          window.logger.warn(
            {
              tags: "chat|manager|load|required",
              color1: "yellow",
              includeSource: true,
            },
            "Cannot send message until a model is loaded. Please load a model in settings."
          );
          return;
        }
        this.handleMessageSend(message);
        this.chatInterface.clearInput();
      }
    });

    // Listen for message-change events
    this.chatInterface.addEventListener("message-change", (e) => {
      this.handleMessageChange(e.detail.value);
    });

    // Listen for back-to-main events from chat header
    if (this.chatHeader) {
      this.chatHeader.addEventListener("back-to-main", () => {
        this.goBackToMain();
      });

      // Listen for open-settings events from chat header
      this.chatHeader.addEventListener("open-settings", () => {
        this.openSettingsModal();
      });
    }

    // Listen for settings modal events
    if (this.chatSettingsModal) {
      // Browse model file request
      this.chatSettingsModal.addEventListener("browse-model-request", () => {
        this.handleBrowseModelRequest();
      });

      // Load model request
      this.chatSettingsModal.addEventListener("load-model-request", (e) => {
        this.handleLoadModelRequest(
          e.detail.modelPath,
          e.detail.contextAllocationSize,
          e.detail.minContextSize,
          e.detail.maxContextSize
        );
      });

      // Unload model request
      this.chatSettingsModal.addEventListener("unload-model-request", () => {
        this.handleUnloadModelRequest();
      });

      // Clear history request
      this.chatSettingsModal.addEventListener("clear-history-request", () => {
        this.handleClearHistoryRequest();
      });

      // Export chat request
      this.chatSettingsModal.addEventListener("export-chat-request", () => {
        this.handleExportChatRequest();
      });
    }
  }

  async initStates() {
    // Wait for loading overlay effect
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Hide loading overlay and initialize chat
    if (this.loadingOverlay) {
      this.loadingOverlay.hide();
    }

    // Initialize chat config
    await this.initializeChatConfig();

    if (this.chatSettingsModal && this.config) {
      this.chatSettingsModal.setConfigData(this.config);
    }

    // Sync model state from backend and start listening for progress events
    await this.syncModelStateFromBackend();
    this.setupModelProgressListener();
    this.setupChatChunkListener();

    // Start with clean slate - no placeholder messages
    // this.addPlaceholderMessages();
  }

  /**
   * Get current timestamp in readable format
   * @returns {string} Formatted timestamp like "12:34 PM"
   */
  getCurrentTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  /**
   * Handle message send event
   * @param {string} message - The trimmed message to send
   */
  async handleMessageSend(message) {
    // First, add the user message to the chat interface
    if (!this.chatInterface) {
      window.logger.error(
        {
          tags: "chat|manager|error",
          color1: "red",
          includeSource: true,
        },
        "Chat interface not available for adding user message"
      );
      return;
    }

    // Get current timestamp for the user message
    const timestamp = this.getCurrentTimestamp();

    try {
      this.chatInterface.addMessage("user", message, timestamp);

      // Add user message to conversation history (llama format)
      this.messages.push({
        type: "user",
        text: message,
      });
    } catch (error) {
      window.logger.error(
        {
          tags: "chat|manager|error",
          color1: "red",
          includeSource: true,
        },
        `Failed to add user message to chat interface: ${error.message}`
      );
      return;
    }

    // Log successful message addition
    window.logger.log(
      {
        tags: "chat|manager|send",
        color1: "cyan",
      },
      `User message added: "${message}"`
    );

    // Create empty assistant message for streaming
    let assistantMessage;
    try {
      assistantMessage = this.chatInterface.createAssistantMessage();
      // Store reference for streaming chunks
      this.currentAssistantMessage = assistantMessage;
    } catch (error) {
      window.logger.error(
        {
          tags: "chat|manager|error",
          color1: "red",
          includeSource: true,
        },
        `Failed to create assistant message: ${error.message}`
      );
      return;
    }

    // Start streaming chat generation
    try {
      await window.nodellamacppAPI.startStreamingChat(this.messages);
    } catch (error) {
      window.logger.error(
        {
          tags: "chat|manager|streaming|error",
          color1: "red",
          includeSource: true,
        },
        `Failed to start streaming chat: ${error.message}`
      );
    }
  }

  /**
   * Handle message change event
   * @param {string} value - The current input value
   */
  handleMessageChange(value) {}

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

  /**
   * Navigate back to the main section
   */
  async goBackToMain() {
    // Hide loading overlay if it's still visible
    if (this.loadingOverlay) {
      this.loadingOverlay.hide();
    }

    const success = await this.section.sectionManager.navigateTo("main");
    if (success) {
      console.log("Successfully navigated to main");
    } else {
      console.error("Failed to navigate to main");
    }
  }

  /**
   * Open the settings modal
   */
  async openSettingsModal() {
    if (this.chatSettingsModal) {
      // Sync latest state from backend before opening
      await this.syncModelStateFromBackend();

      // Apply the synced state to the modal
      const statusLabel = this.formatStatusLabel(
        this.modelState.status,
        this.modelState.isModelLoaded
      );
      this.chatSettingsModal.applyModelState({
        modelPath: this.modelState.modelPath || this.config?.modelPath,
        statusLabel,
      });

      // Populate config data including context settings
      if (this.config) {
        this.chatSettingsModal.setConfigData(this.config);
      }

      // Open the modal (this will also hide progress bar)
      this.chatSettingsModal.open();
    } else {
      window.logger.error(
        {
          tags: "chat|manager|error",
          color1: "red",
          includeSource: true,
        },
        "Chat settings modal not found"
      );
    }
  }

  /**
   * Initialize chat configuration
   */
  async initializeChatConfig() {
    try {
      // Try to load existing config
      this.config = await window.storeAPI.readJSON(this.configFile);
    } catch (error) {
      // Create default config if it doesn't exist
      this.config = {
        modelPath: "",
        vramInfo: "Unknown",
        gpuInfo: "Unknown",
        contextAllocationSize: 32000,
        minContextSize: 16000,
        maxContextSize: 48000,
      };

      // Save default config
      await this.saveChatConfig();
    }
  }

  /**
   * Save chat configuration
   */
  async saveChatConfig() {
    try {
      await window.storeAPI.writeJSON(this.configFile, this.config);
    } catch (error) {
      window.logger.error(
        {
          tags: "chat|config|error",
          color1: "red",
          color2: "orange",
        },
        "Failed to save chat config:",
        error
      );
    }
  }

  /**
   * Update chat config and save
   * @param {Object} updates - Config updates to apply
   */
  async updateChatConfig(updates) {
    this.config = { ...this.config, ...updates };
    await this.saveChatConfig();
  }

  /**
   * Handle browse model file request
   */
  async handleBrowseModelRequest() {
    // Prevent multiple dialogs from opening simultaneously
    if (this.dialogOpening) {
      return;
    }
    this.dialogOpening = true;

    try {
      window.logger.log(
        {
          tags: "chat|settings|browse",
          color1: "blue",
        },
        "Opening file dialog for GGUF model selection"
      );

      // Show file open dialog filtered to GGUF files
      const filePaths = await window.storeAPI.showOpenDialog({
        filters: [{ name: "GGUF Files", extensions: ["gguf"] }],
        defaultPath: this.config?.modelPath || undefined,
        multiSelections: false,
      });

      if (filePaths && filePaths.length > 0) {
        const selectedPath = filePaths[0];

        // Update the modal with the selected path
        if (this.chatSettingsModal) {
          this.chatSettingsModal.setModelPath(selectedPath);
          // Save to config
          await this.updateChatConfig({ modelPath: selectedPath });
        }
        this.modelState.modelPath = selectedPath;

        window.logger.log(
          {
            tags: "chat|settings|browse|success",
            color1: "green",
          },
          "Model file selected:",
          selectedPath
        );
      } else {
        window.logger.log(
          {
            tags: "chat|settings|browse|cancelled",
            color1: "yellow",
          },
          "File selection cancelled by user"
        );
      }
    } catch (error) {
      window.logger.error(
        {
          tags: "chat|settings|browse|error",
          color1: "red",
        },
        "Failed to browse model file:",
        error
      );
    } finally {
      // Reset the flag after dialog operation completes
      this.dialogOpening = false;
    }
  }

  /**
   * Handle load model request
   * @param {string} modelPath - Path to the model file
   * @param {number} contextAllocationSize - Context allocation size for VRAM
   * @param {number} minContextSize - Minimum context size
   * @param {number} maxContextSize - Maximum context size
   */
  async handleLoadModelRequest(
    modelPath,
    contextAllocationSize = null,
    minContextSize = null,
    maxContextSize = null
  ) {
    if (this.modelLoading) {
      return false;
    }
    this.modelLoading = true;

    // Use provided values or fall back to config defaults
    const resolvedPath = (modelPath || this.config?.modelPath || "").trim();
    const allocationSize =
      contextAllocationSize ?? this.config?.contextAllocationSize ?? 32000;
    const minSize = minContextSize ?? this.config?.minContextSize ?? 16000;
    let maxSize = maxContextSize ?? this.config?.maxContextSize ?? 48000;

    // Ensure max >= min
    if (maxSize < minSize) {
      window.logger.warn(
        {
          tags: "chat|settings|load|warning",
          color1: "yellow",
          includeSource: true,
        },
        `Max context size (${maxSize}) is less than min (${minSize}). Using min as max.`
      );
      maxSize = minSize;
    }

    if (!resolvedPath) {
      window.logger.warn(
        {
          tags: "chat|settings|load|warning",
          color1: "yellow",
          includeSource: true,
        },
        "No model path available. Please choose a GGUF file first."
      );
      this.modelLoading = false;
      this.openSettingsModal();
      return false;
    }

    if (!window.nodellamacppAPI?.loadModel) {
      window.logger.error(
        {
          tags: "chat|settings|load|error",
          color1: "red",
        },
        "nodellamacppAPI.loadModel is not available in the preload bridge."
      );
      this.modelLoading = false;
      return false;
    }

    window.logger.log(
      {
        tags: "chat|settings|load",
        color1: "blue",
      },
      "Loading model:",
      resolvedPath,
      `(allocation: ${allocationSize}, context: ${minSize}-${maxSize})`
    );

    this.showModelProgressIndicators("Loading model...");

    // Yield control to allow UI to update before starting the async operation
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      // Prepare model config with context allocation size
      const modelConfig = {};
      if (allocationSize != null && allocationSize > 0) {
        modelConfig.gpuLayers = {
          fitContext: { contextSize: allocationSize },
        };
        modelConfig.defaultContextFlashAttention = true;
      }

      // Prepare context config with max context size
      const contextConfig = {
        contextSize: maxSize > 0 ? maxSize : "auto",
      };

      await window.nodellamacppAPI.loadModel(
        resolvedPath,
        modelConfig,
        contextConfig,
        {} // sessionConfig
      );

      // Save config with all settings
      const configUpdate = {
        modelPath: resolvedPath,
        contextAllocationSize: allocationSize,
        minContextSize: minSize,
        maxContextSize: maxSize,
      };
      await this.updateChatConfig(configUpdate);

      await this.syncModelStateFromBackend();

      window.logger.log(
        {
          tags: "chat|settings|load|success",
          color1: "green",
        },
        "Model loaded successfully"
      );
      return true;
    } catch (error) {
      window.logger.error(
        {
          tags: "chat|settings|load|error",
          color1: "red",
        },
        "Failed to load model:",
        error
      );

      this.hideModelProgressIndicators("Load failed");
      return false;
    } finally {
      this.modelLoading = false;
    }
  }

  /**
   * Handle unload model request
   */
  async handleUnloadModelRequest() {
    // Prevent multiple unload operations
    if (this.modelUnloading) {
      return;
    }
    this.modelUnloading = true;

    if (!window.nodellamacppAPI?.unloadModel) {
      window.logger.error(
        {
          tags: "chat|settings|unload|error",
          color1: "red",
        },
        "nodellamacppAPI.unloadModel is not available in the preload bridge."
      );
      return;
    }

    this.showModelProgressIndicators("Unloading model...");

    try {
      window.logger.log(
        {
          tags: "chat|settings|unload",
          color1: "blue",
        },
        "Unloading model"
      );

      // Call backend to unload model
      const unloadResult = await window.nodellamacppAPI.unloadModel();

      if (unloadResult.success) {
        await this.syncModelStateFromBackend();
        this.hideModelProgressIndicators("Model unloaded");

        window.logger.log(
          {
            tags: "chat|settings|unload|success",
            color1: "green",
          },
          "Model unloaded successfully"
        );
      } else {
        // Handle unload errors
        const errorMsg = unloadResult.errors.join(", ");
        window.logger.error(
          {
            tags: "chat|settings|unload|error",
            color1: "red",
          },
          "Model unload failed:",
          errorMsg
        );

        this.hideModelProgressIndicators("Unload failed");
      }
    } catch (error) {
      window.logger.error(
        {
          tags: "chat|settings|unload|error",
          color1: "red",
        },
        "Failed to unload model:",
        error
      );
      this.hideModelProgressIndicators("Unload failed");
    } finally {
      // Reset the unloading flag
      this.modelUnloading = false;
    }
  }

  /**
   * Handle clear history request
   */
  async handleClearHistoryRequest() {
    try {
      window.logger.log(
        {
          tags: "chat|settings|clear",
          color1: "blue",
        },
        "Clearing chat history"
      );

      // Clear messages from interface
      if (this.chatInterface) {
        this.chatInterface.clearMessages();
      }

      // Clear our conversation history
      this.messages = [];

      window.logger.log(
        {
          tags: "chat|settings|clear|success",
          color1: "green",
        },
        "Chat history cleared"
      );
    } catch (error) {
      window.logger.error(
        {
          tags: "chat|settings|clear|error",
          color1: "red",
        },
        "Failed to clear chat history:",
        error
      );
    }
  }

  /**
   * Handle export chat request
   */
  async handleExportChatRequest() {
    try {
      window.logger.log(
        {
          tags: "chat|settings|export",
          color1: "blue",
        },
        "Exporting chat data"
      );

      // For now, just log - in real implementation would export to file
      window.logger.warn(
        {
          tags: "chat|settings|export|todo",
          color1: "yellow",
          includeSource: true,
        },
        "Chat export not yet implemented"
      );
    } catch (error) {
      window.logger.error(
        {
          tags: "chat|settings|export|error",
          color1: "red",
        },
        "Failed to export chat:",
        error
      );
    }
  }

  /**
   * Clean up the loading overlay
   */
  cleanupLoadingOverlay() {
    if (this.loadingOverlay && this.loadingOverlay.parentNode) {
      this.loadingOverlay.parentNode.removeChild(this.loadingOverlay);
      this.loadingOverlay = null;
    }
  }

  /**
   * Ensure a model is loaded before sending chat requests
   * @returns {Promise<boolean>} True if a model is ready
   */
  async ensureModelLoaded() {
    if (this.modelState?.isModelLoaded) {
      return true;
    }

    const path = this.config?.modelPath;
    if (!path) {
      window.logger.warn(
        {
          tags: "chat|manager|load|required",
          color1: "yellow",
          includeSource: true,
        },
        "No model path configured. Please choose a model in settings."
      );
      this.openSettingsModal();
      return false;
    }

    return await this.handleLoadModelRequest(path);
  }

  /**
   * Fetch model state from backend and update UI
   */
  async syncModelStateFromBackend() {
    if (!window.nodellamacppAPI?.getModelState) {
      return;
    }

    try {
      const state = await window.nodellamacppAPI.getModelState();
      if (state) {
        this.applyModelState({
          isModelLoaded: !!state.isModelLoaded,
          modelPath: state.modelPath,
          status: state.status || (state.isModelLoaded ? "loaded" : "unloaded"),
        });
      }
    } catch (error) {
      window.logger.error(
        {
          tags: "chat|manager|state|error",
          color1: "red",
        },
        "Failed to fetch model state from backend:",
        error
      );
    }
  }

  /**
   * Apply backend model state to UI + internal cache
   * @param {Object} state
   */
  applyModelState(state = {}) {
    const modelPath =
      state.modelPath ??
      this.modelState.modelPath ??
      this.config?.modelPath ??
      "";

    this.modelState = {
      isModelLoaded:
        typeof state.isModelLoaded === "boolean"
          ? state.isModelLoaded
          : this.modelState.isModelLoaded,
      modelPath,
      status: state.status || this.modelState.status,
    };

    const statusLabel = this.formatStatusLabel(
      this.modelState.status,
      this.modelState.isModelLoaded
    );

    if (this.chatSettingsModal) {
      if (modelPath) {
        this.chatSettingsModal.setModelPath(modelPath);
      }
      this.chatSettingsModal.applyModelState({
        modelPath,
        statusLabel,
      });
    }
  }

  /**
   * Human readable status label
   */
  formatStatusLabel(status, isLoaded) {
    const normalized = (status || "").toLowerCase();
    if (normalized === "loading") return "Loading model...";
    if (normalized === "completed" || normalized === "loaded")
      return "Model loaded";
    if (normalized === "unloaded") return "Model unloaded";
    if (normalized === "error" || normalized === "failed")
      return "Model load failed";
    if (isLoaded) return "Model loaded";
    return "No model loaded";
  }

  /**
   * Subscribe to backend load progress events
   */
  setupModelProgressListener() {
    if (!window.nodellamacppAPI?.onModelLoadProgress) {
      return;
    }

    if (typeof this.modelProgressUnsub === "function") {
      this.modelProgressUnsub();
      this.modelProgressUnsub = null;
    }

    this.modelProgressUnsub = window.nodellamacppAPI.onModelLoadProgress(
      (event) => this.handleModelProgressEvent(event)
    );
  }

  /**
   * Setup chat chunk streaming listener
   */
  setupChatChunkListener() {
    if (!window.nodellamacppAPI?.onChatChunk) {
      return;
    }

    if (typeof this.chatChunkUnsub === "function") {
      this.chatChunkUnsub();
      this.chatChunkUnsub = null;
    }

    this.chatChunkUnsub = window.nodellamacppAPI.onChatChunk((chunk) =>
      this.handleChatChunk(chunk)
    );
  }

  /**
   * Handle backend load/unload progress events
   * @param {Object} event
   */
  handleModelProgressEvent(event = {}) {
    const { status, percentage = 0, modelPath, error } = event;
    const normalized = (status || "").toLowerCase();

    if (normalized === "loading") {
      // Update progress indicators - they should already be shown from handleLoadModelRequest
      this.updateModelProgressIndicators(percentage);
      return;
    }

    if (normalized === "completed") {
      this.updateModelProgressIndicators(100);
      // Apply state immediately
      this.applyModelState({
        isModelLoaded: true,
        modelPath: modelPath || this.modelState.modelPath,
        status: "loaded",
      });
      // Small delay to ensure 100% is visible before hiding the progress bar
      setTimeout(() => {
        this.hideModelProgressIndicators("Model loaded");
      }, 300);
      return;
    }

    if (normalized === "unloaded") {
      this.updateModelProgressIndicators(0);
      this.hideModelProgressIndicators("Model unloaded");
      this.applyModelState({
        isModelLoaded: false,
        modelPath: null,
        status: "unloaded",
      });
      return;
    }

    if (normalized === "error") {
      const label = error ? `Load failed: ${error}` : "Model load failed";
      this.hideModelProgressIndicators(label);
      this.applyModelState({
        isModelLoaded: false,
        status: "error",
      });
    }
  }

  /**
   * Handle streaming chat response chunks
   * @param {Object} chunk - Chunk data from backend
   */
  handleChatChunk(chunk = {}) {
    const { text, isComplete, error } = chunk;

    // Handle different chunk types
    if (text && typeof text === 'object') {
      if (text.type === 'segment') {
        // Segment chunk: { type: "segment", segmentType: "thought", text: "...", segmentStartTime: "..." }
        this.handleSegmentChunk(text);
      } else if (text.tokens && Array.isArray(text.tokens)) {
        // Regular text chunk: { tokens: [...], text: "actual text" }
        this.handleTextChunk(text.text || '');
      }
    } else if (text && typeof text === 'string') {
      // Fallback for simple string chunks
      this.handleTextChunk(text);
    }

    if (error) {
      window.logger.error(
        {
          tags: "chat|chunk|error",
          color1: "red",
        },
        "Chat generation error:",
        error
      );
      return;
    }

    if (isComplete) {
      // Generation complete - clean up current message reference
      this.currentAssistantMessage = null;
      window.logger.log(
        {
          tags: "chat|chunk|complete",
          color1: "green",
        },
        "Chat generation completed"
      );
      return;
    }
  }

  /**
   * Handle segment start/end chunks
   * @param {Object} segmentData - Segment chunk data
   */
  handleSegmentChunk(segmentData) {
    const { segmentType, text, segmentStartTime, segmentEndTime } = segmentData;

    if (!this.currentAssistantMessage) return;

    // Map backend segment types to frontend segment types
    const mappedSegmentType = this.mapSegmentType(segmentType);

    if (segmentStartTime && !segmentEndTime) {
      // Segment start - create new segment
      const timestamp = segmentStartTime ? new Date(segmentStartTime).toLocaleTimeString() : "";
      this.currentAssistantMessage.addSegment(mappedSegmentType, timestamp);
      window.logger.log(
        {
          tags: "chat|chunk|segment|start",
          color1: "blue",
        },
        `Started ${mappedSegmentType} segment (backend: ${segmentType})`
      );
    } else if (segmentEndTime) {
      // Segment end - segment is complete, don't create new segment
      window.logger.log(
        {
          tags: "chat|chunk|segment|end",
          color1: "blue",
        },
        `Ended ${mappedSegmentType} segment (backend: ${segmentType})`
      );
    } else {
      // Segment content - append to current segment
      this.currentAssistantMessage.appendSegmentContentByType(mappedSegmentType, text);
    }
  }

  /**
   * Map backend segment types to frontend segment types
   * @param {string} backendType - Segment type from backend
   * @returns {string} Mapped segment type for frontend
   */
  mapSegmentType(backendType) {
    switch (backendType) {
      case "thought":
        return "thinking";
      case "commentary":
        return "commentary";
      case "function-call":
        return "function-call";
      default:
        return "response"; // Default to response for unknown types
    }
  }

  /**
   * Handle regular text chunks (final response)
   * @param {string} text - Text to append
   */
  handleTextChunk(text) {
    if (!text || !this.currentAssistantMessage) return;

    // Try to append to existing response segment, create one if it doesn't exist
    const appended = this.currentAssistantMessage.appendSegmentContentByType("response", text);
    if (!appended) {
      // No response segment exists, create one
      const timestamp = new Date().toLocaleTimeString();
      this.currentAssistantMessage.addSegment("response", timestamp);
      this.currentAssistantMessage.appendSegmentContentByType("response", text);
    }

    // Update conversation history
    const lastMessage = this.messages[this.messages.length - 1];
    if (lastMessage && lastMessage.type === "model") {
      lastMessage.response[0] += text;
    }
  }

  showModelProgressIndicators(label = "Loading model...") {
    if (this.chatSettingsModal) {
      this.chatSettingsModal.showProgress(label);
    }
    if (this.chatInterface) {
      this.chatInterface.showModelProgress(label);
    }
  }

  updateModelProgressIndicators(percentage, label) {
    if (this.chatSettingsModal) {
      this.chatSettingsModal.updateProgress(percentage, label);
    }
    if (this.chatInterface) {
      this.chatInterface.updateModelProgress(percentage, label);
    }
  }

  hideModelProgressIndicators(label) {
    if (this.chatSettingsModal) {
      this.chatSettingsModal.hideProgress(label);
    }
    if (this.chatInterface) {
      this.chatInterface.hideModelProgress(label);
    }
  }
}

import { Manager, Logger } from "../core/index.js";
import { getLlama, LlamaChatSession } from "node-llama-cpp";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class NodeLlamaCppManager extends Manager {
  constructor() {
    super();
    this.llama = null; // Llama instance (persistent)
    this.currentModel = null; // Currently loaded model
    this.currentContext = null; // Current model context
    this.currentSession = null; // Current chat session
    this.currentModelPath = null; // Track currently loaded model path
    this.lastModelStatus = "uninitialized";
    this.isInitialized = false;
  }

  async init() {
    try {
      global.logger.log(
        {
          tags: "llama|manager|init",
          color1: "blue",
          includeSource: true,
        },
        "NodeLlamaCppManager starting initialization"
      );

      // Initialize the Llama instance
      const llamaResult = await this.createLlamaInstance();
      if (!llamaResult.success) {
        throw new Error(
          `Failed to create Llama instance: ${llamaResult.errors.join(", ")}`
        );
      }

      this.isInitialized = true;

      global.logger.log(
        {
          tags: "llama|manager|init",
          color1: "green",
        },
        "NodeLlamaCppManager initialization complete"
      );
    } catch (error) {
      global.logger.error(
        {
          tags: "llama|manager|error",
          color1: "red",
          color2: "orange",
          includeSource: true,
        },
        "Failed to initialize NodeLlamaCppManager:",
        error
      );
      throw error;
    }
  }

  /**
   * Create the Llama instance
   * @param {Object} options - The options for creating the Llama instance
   * @returns {Object} The result of creating the Llama instance
   */
  async createLlamaInstance(options = {}) {
    const { logLevel = "error" } = options;
    const result = { success: false, errors: [] };

    // If Llama instance already exists, return success immediately
    if (this.llama != null) {
      result.success = true;
      return result;
    }

    try {
      global.logger.log(
        {
          tags: "llama|init",
          color1: "blue",
          includeSource: true,
        },
        "Creating Llama instance"
      );

      // Merge defaults with provided options, options take priority
      const llamaOptions = {
        logLevel,
        ...options,
      };

      this.llama = await getLlama(llamaOptions);

      global.logger.log(
        {
          tags: "llama|init|success",
          color1: "green",
        },
        "Llama instance created successfully"
      );

      result.success = true;
    } catch (error) {
      this.llama = null;
      result.errors.push(error.message || error.toString());

      global.logger.error(
        {
          tags: "llama|init|error",
          color1: "red",
          color2: "orange",
          includeSource: true,
        },
        "Failed to create Llama instance:",
        error
      );
    }

    return result;
  }

  /**
   * Dispose of the Llama instance
   * @returns {Object} The result of disposing the Llama instance
   */
  async disposeLlamaInstance() {
    const errors = [];

    try {
      if (this.llama != null) {
        global.logger.log(
          {
            tags: "llama|dispose",
            color1: "yellow",
          },
          "Disposing Llama instance"
        );

        await this.llama.dispose();
      }
    } catch (error) {
      errors.push(error.message || error.toString());
      global.logger.error(
        {
          tags: "llama|dispose|error",
          color1: "red",
          color2: "orange",
        },
        "Error disposing Llama instance:",
        error
      );
    }

    // Clean up internal state regardless of errors
    this.llama = null;

    return { success: errors.length === 0, errors };
  }

  /**
   * Get comprehensive diagnostics data from the Llama instance
   * @returns {Object} Diagnostics payload with all Llama instance data
   */
  async getLlamaDiagnostics() {
    const diagnostics = {
      basic: {},
      vram: null,
      gpu: null,
      swap: null,
      system: null,
      errors: [],
    };

    if (!this.llama) {
      diagnostics.errors.push("Llama instance is null");
      return diagnostics;
    }

    // Basic properties
    diagnostics.basic = {
      gpu: this.llama.gpu,
      supportsGpuOffloading: this.llama.supportsGpuOffloading,
      supportsMmap: this.llama.supportsMmap,
      cpuMathCores: this.llama.cpuMathCores,
      maxThreads: this.llama.maxThreads,
      logLevel: this.llama.logLevel,
      buildType: this.llama.buildType,
    };

    // VRAM State
    try {
      diagnostics.vram = await this.llama.getVramState();
    } catch (error) {
      diagnostics.errors.push(`VRAM state error: ${error.message}`);
    }

    // GPU Device Names
    try {
      diagnostics.gpu = await this.llama.getGpuDeviceNames();
    } catch (error) {
      diagnostics.errors.push(`GPU devices error: ${error.message}`);
    }

    // Swap State
    try {
      diagnostics.swap = await this.llama.getSwapState();
    } catch (error) {
      diagnostics.errors.push(`Swap state error: ${error.message}`);
    }

    // System Info
    diagnostics.system = this.llama.systemInfo;

    return diagnostics;
  }

  /**
   * Load a model with context and session
   * @param {string} modelPath - Path to the model file
   * @param {Object} modelConfig - Configuration for model loading
   * @param {Object} contextConfig - Configuration for context creation
   * @param {Object} sessionConfig - Configuration for session creation
   */
  async loadModel(
    modelPath,
    modelConfig = {},
    contextConfig = {},
    sessionConfig = {}
  ) {
    try {
      if (!this.llama) {
        throw new Error("Llama instance not initialized");
      }

      global.logger.log(
        {
          tags: "llama|model|load",
          color1: "blue",
        },
        `Loading model: ${modelPath}`
      );

      // Unload any existing model first
      await this.unloadModel();

      // Load the new model with progress reporting
      this.currentModel = await this.llama.loadModel({
        modelPath,
        onLoadProgress: (progress) => {
          const percentage = Math.round(progress * 100);
          // global.logger.log(
          //   {
          //     tags: "llama|model|load|progress",
          //     color1: "cyan",
          //   },
          //   `Model loading progress: ${percentage}%`
          // );

          // Emit progress event to frontend
          if (this.app && this.app.mainWindow) {
            this.app.mainWindow.webContents.send(
              "NodeLlamaCppManager:modelLoadProgress",
              {
                progress, // 0.0 to 1.0
                percentage, // 0 to 100
                modelPath,
                status: "loading",
              }
            );
          }
        },
        ...modelConfig,
      });

      // Emit completion event to frontend
      if (this.app && this.app.mainWindow) {
        this.app.mainWindow.webContents.send(
          "NodeLlamaCppManager:modelLoadProgress",
          {
            progress: 1.0,
            percentage: 100,
            modelPath,
            status: "completed",
          }
        );
      }

      // Create context
      this.currentContext = await this.currentModel.createContext(
        contextConfig
      );

      // Create session
      this.currentSession = new LlamaChatSession({
        contextSequence: this.currentContext.getSequence(),
        ...sessionConfig,
      });

      this.currentModelPath = modelPath;
      this.lastModelStatus = "loaded";

      global.logger.log(
        {
          tags: "llama|model|load|success",
          color1: "green",
        },
        `Model loaded successfully: ${path.basename(modelPath)}`
      );

      return { success: true, modelPath };
    } catch (error) {
      global.logger.error(
        {
          tags: "llama|model|load|error",
          color1: "red",
          color2: "orange",
        },
        `Failed to load model ${modelPath}:`,
        error
      );

      this.currentModelPath = null;
      this.lastModelStatus = "error";

      // Emit error event to frontend
      if (this.app && this.app.mainWindow) {
        this.app.mainWindow.webContents.send(
          "NodeLlamaCppManager:modelLoadProgress",
          {
            progress: 0,
            percentage: 0,
            modelPath,
            status: "error",
            error: error.message,
          }
        );
      }

      throw error;
    }
  }

  /**
   * Unload the current model, context, and session
   */
  async unloadModel() {
    const errors = [];

    try {
      if (this.currentModel != null) {
        global.logger.log(
          {
            tags: "llama|model|unload",
            color1: "yellow",
          },
          "Disposing current model"
        );
        await this.currentModel.dispose();
      }
    } catch (error) {
      const errorMsg = error.message || error.toString();
      errors.push(errorMsg);
      global.logger.error(
        {
          tags: "llama|model|unload|error",
          color1: "red",
          color2: "orange",
        },
        `Failed to dispose model: ${errorMsg}`
      );
    }

    // Clean up internal state regardless of errors (but keep llama instance)
    global.logger.log(
      {
        tags: "llama|model|unload",
        color1: "yellow",
      },
      "Cleaning up internal state"
    );

    this.currentModel = null;
    this.currentContext = null;
    this.currentSession = null;
    this.currentModelPath = null;

    const success = errors.length === 0;
    this.lastModelStatus = success ? "unloaded" : "error";

    // Notify frontend that model is unloaded
    if (this.app && this.app.mainWindow) {
      this.app.mainWindow.webContents.send(
        "NodeLlamaCppManager:modelLoadProgress",
        {
          progress: 0,
          percentage: 0,
          modelPath: null,
          status: success ? "unloaded" : "error",
          errors,
        }
      );
    }

    if (success) {
      global.logger.log(
        {
          tags: "llama|model|unload|success",
          color1: "green",
        },
        "Model unloaded successfully"
      );
    }

    return { success, errors };
  }

  /**
   * Define preload API configuration for the NodeLlamaCpp manager
   */
  initPreload() {
    return {
      name: "NodeLlamaCppManager",
      api: {
        loadModel: { channel: "NodeLlamaCppManager:loadModel" },
        unloadModel: { channel: "NodeLlamaCppManager:unloadModel" },
        getModelState: { channel: "NodeLlamaCppManager:getModelState" },
        // Event listener for model loading progress updates
        onModelLoadProgress: {
          type: "eventListener",
          eventChannel: "NodeLlamaCppManager:modelLoadProgress",
        },
        // TODO: Define IPC API methods for:
        // - Text generation
        // - Chat completion
        // - Streaming responses
      },
    };
  }

  /**
   * Get current model state for frontend synchronization
   */
  getModelState() {
    return {
      isInitialized: this.isInitialized,
      isModelLoaded: !!this.currentModel,
      hasContext: !!this.currentContext,
      hasSession: !!this.currentSession,
      modelPath: this.currentModelPath,
      status: this.lastModelStatus,
    };
  }

  // TODO: Add methods for:
  // - Text generation (single messages)
  // - Streaming text generation
  // - Chat completion with conversation history
}

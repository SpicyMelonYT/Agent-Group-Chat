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

      // Run temporary tests to verify Llama instance functionality
      {
        global.logger.setTagPattern("llama|test");
        await this.testLlamaInstance();
      }

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
      errors: []
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
      buildType: this.llama.buildType
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
   * Temporary test function to verify Llama instance functionality
   * TODO: Remove this function after development/testing is complete
   */
  async testLlamaInstance() {
    try {
      global.logger.log(
        {
          tags: "llama|test",
          color1: "cyan",
        },
        "=== Starting Llama Instance Tests ==="
      );

      // Get diagnostics data
      const diagnostics = await this.getLlamaDiagnostics();

      if (diagnostics.errors.includes("Llama instance is null")) {
        global.logger.error(
          {
            tags: "llama|test|error",
            color1: "red",
          },
          "Llama instance is null!"
        );
        return;
      }

      // Test 1: Basic properties
      global.logger.log(
        {
          tags: "llama|test|props",
          color1: "blue",
        },
        "Testing basic Llama properties..."
      );

      global.logger.log(
        {
          tags: "llama|test|props",
          color1: "blue",
          showTag: false,
        },
        `GPU Type: ${diagnostics.basic.gpu}`
      );

      global.logger.log(
        {
          tags: "llama|test|props",
          color1: "blue",
          showTag: false,
        },
        `Supports GPU Offloading: ${diagnostics.basic.supportsGpuOffloading}`
      );

      global.logger.log(
        {
          tags: "llama|test|props",
          color1: "blue",
          showTag: false,
        },
        `Supports mmap: ${diagnostics.basic.supportsMmap}`
      );

      global.logger.log(
        {
          tags: "llama|test|props",
          color1: "blue",
          showTag: false,
        },
        `CPU Math Cores: ${diagnostics.basic.cpuMathCores}`
      );

      global.logger.log(
        {
          tags: "llama|test|props",
          color1: "blue",
          showTag: false,
        },
        `Max Threads: ${diagnostics.basic.maxThreads}`
      );

      global.logger.log(
        {
          tags: "llama|test|props",
          color1: "blue",
          showTag: false,
        },
        `Log Level: ${diagnostics.basic.logLevel}`
      );

      global.logger.log(
        {
          tags: "llama|test|props",
          color1: "blue",
          showTag: false,
        },
        `Build Type: ${diagnostics.basic.buildType}`
      );

      // Test 2: VRAM State
      global.logger.log(
        {
          tags: "llama|test|vram",
          color1: "yellow",
        },
        "Testing VRAM state..."
      );

      if (diagnostics.vram) {
        global.logger.log(
          {
            tags: "llama|test|vram",
            color1: "yellow",
            showTag: false,
          },
          `VRAM - Total: ${diagnostics.vram.total} bytes, Used: ${diagnostics.vram.used} bytes, Free: ${diagnostics.vram.free} bytes`
        );
        global.logger.log(
          {
            tags: "llama|test|vram",
            color1: "yellow",
            showTag: false,
          },
          `Unified Memory: ${diagnostics.vram.unifiedSize} bytes`
        );
      } else {
        global.logger.error(
          {
            tags: "llama|test|vram|error",
            color1: "red",
          },
          "Failed to get VRAM state"
        );
      }

      // Test 3: GPU Device Names
      global.logger.log(
        {
          tags: "llama|test|gpu",
          color1: "magenta",
        },
        "Testing GPU device names..."
      );

      if (diagnostics.gpu) {
        global.logger.log(
          {
            tags: "llama|test|gpu",
            color1: "magenta",
            showTag: false,
          },
          `GPU Devices: ${diagnostics.gpu.join(", ") || "None detected"}`
        );
      } else {
        global.logger.error(
          {
            tags: "llama|test|gpu|error",
            color1: "red",
          },
          "Failed to get GPU device names"
        );
      }

      // Test 4: Swap State
      global.logger.log(
        {
          tags: "llama|test|swap",
          color1: "cyan",
        },
        "Testing swap memory state..."
      );

      if (diagnostics.swap) {
        global.logger.log(
          {
            tags: "llama|test|swap",
            color1: "cyan",
            showTag: false,
          },
          `Swap - Max: ${diagnostics.swap.maxSize} bytes, Allocated: ${diagnostics.swap.allocated} bytes, Used: ${diagnostics.swap.used} bytes`
        );
      } else {
        global.logger.error(
          {
            tags: "llama|test|swap|error",
            color1: "red",
          },
          "Failed to get swap state"
        );
      }

      // Test 5: System Info
      global.logger.log(
        {
          tags: "llama|test|system",
          color1: "green",
        },
        "System Info:",
        diagnostics.system
      );

      // Log any errors that occurred during diagnostics collection
      if (diagnostics.errors.length > 0) {
        global.logger.error(
          {
            tags: "llama|test|diagnostics|errors",
            color1: "orange",
          },
          "Diagnostics collection errors:",
          diagnostics.errors
        );
      }

      global.logger.log(
        {
          tags: "llama|test|success",
          color1: "green",
        },
        "=== Llama Instance Tests Complete ==="
      );

    } catch (error) {
      global.logger.error(
        {
          tags: "llama|test|error",
          color1: "red",
          color2: "orange",
        },
        "Llama instance test failed:",
        error
      );
    }
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

      // Load the new model
      this.currentModel = await this.llama.loadModel({
        modelPath,
        ...modelConfig,
      });

      // Create context
      this.currentContext = await this.currentModel.createContext(
        contextConfig
      );

      // Create session
      this.currentSession = new LlamaChatSession({
        contextSequence: this.currentContext.getSequence(),
        ...sessionConfig,
      });

      global.logger.log(
        {
          tags: "llama|model|load|success",
          color1: "green",
        },
        `Model loaded successfully: ${path.basename(modelPath)}`
      );
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
      throw error;
    }
  }

  /**
   * Unload the current model, context, and session
   */
  async unloadModel() {
    try {
      if (this.currentSession) {
        global.logger.log(
          {
            tags: "llama|model|unload",
            color1: "yellow",
          },
          "Disposing current chat session"
        );
        // Note: LlamaChatSession doesn't have a dispose method in the example
        // We'll set it to null and let garbage collection handle it
        this.currentSession = null;
      }

      if (this.currentContext) {
        global.logger.log(
          {
            tags: "llama|model|unload",
            color1: "yellow",
          },
          "Disposing current context"
        );
        await this.currentContext.dispose();
        this.currentContext = null;
      }

      if (this.currentModel) {
        global.logger.log(
          {
            tags: "llama|model|unload",
            color1: "yellow",
          },
          "Disposing current model"
        );
        await this.currentModel.dispose();
        this.currentModel = null;
      }

      global.logger.log(
        {
          tags: "llama|model|unload|success",
          color1: "green",
        },
        "Model unloaded successfully"
      );
    } catch (error) {
      global.logger.error(
        {
          tags: "llama|model|unload|error",
          color1: "red",
          color2: "orange",
        },
        "Error unloading model:",
        error
      );
      // Don't throw here - we want to continue even if disposal fails
    }
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
        // TODO: Define IPC API methods for:
        // - Text generation
        // - Chat completion
        // - Streaming responses
      },
    };
  }

  // TODO: Add methods for:
  // - Text generation (single messages)
  // - Streaming text generation
  // - Chat completion with conversation history
}

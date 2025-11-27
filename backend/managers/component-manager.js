import { Manager, Logger } from "../core/index.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ComponentManager extends Manager {
  constructor() {
    super();
    this.frontendPath = path.join(__dirname, "../../frontend");
  }

  async init() {
    try {
      global.logger.log(
        {
          tags: "component|manager|init",
          color1: "blue",
          includeSource: true,
        },
        "ComponentManager starting initialization"
      );

      // Verify frontend directory exists
      if (!fs.existsSync(this.frontendPath)) {
        throw new Error(`Frontend directory not found: ${this.frontendPath}`);
      }

      global.logger.log(
        {
          tags: "component|manager|init",
          color1: "green",
        },
        "ComponentManager initialization complete"
      );
    } catch (error) {
      global.logger.error(
        {
          tags: "component|manager|error",
          color1: "red",
          color2: "orange",
          includeSource: true,
        },
        "Failed to initialize ComponentManager:",
        error
      );
      throw error;
    }
  }

  /**
   * Get all JavaScript component files in a directory
   * @param {string} relativePath - Relative path from frontend directory (e.g., "components" or "sections/main/components")
   * @returns {Promise<Array<string>>} - Array of relative file paths
   */
  async getComponentFiles(relativePath) {
    try {
      global.logger.log(
        {
          tags: "component|manager|scan",
          color1: "cyan",
          includeSource: true,
        },
        `Scanning for component files in: ${relativePath}`
      );

      // Resolve the full path
      const fullPath = path.join(this.frontendPath, relativePath);

      // Check if directory exists
      if (!fs.existsSync(fullPath)) {
        global.logger.log(
          {
            tags: "component|manager|scan",
            color1: "yellow",
          },
          `Component directory does not exist: ${relativePath}`
        );
        return [];
      }

      if (!fs.statSync(fullPath).isDirectory()) {
        global.logger.error(
          {
            tags: "component|manager|scan|error",
            color1: "red",
          },
          `Path is not a directory: ${relativePath}`
        );
        return [];
      }

      // Read all files in the directory
      const entries = fs.readdirSync(fullPath, { withFileTypes: true });
      const componentFiles = [];

      for (const entry of entries) {
        // Only process .js files
        if (entry.isFile() && entry.name.endsWith(".js")) {
          // Return relative path from frontend directory
          const fileRelativePath = path.join(relativePath, entry.name);
          componentFiles.push(fileRelativePath);
        }
      }

      global.logger.log(
        {
          tags: "component|manager|scan|success",
          color1: "green",
        },
        `Found ${componentFiles.length} component file(s) in ${relativePath}`
      );

      return componentFiles.sort(); // Sort alphabetically for consistency
    } catch (error) {
      global.logger.error(
        {
          tags: "component|manager|scan|error",
          color1: "red",
          color2: "orange",
          includeSource: true,
        },
        `Failed to scan component files in ${relativePath}:`,
        error
      );
      return [];
    }
  }

  /**
   * Define preload API configuration for the component manager
   */
  initPreload() {
    return {
      name: "ComponentManager",
      api: {
        getComponentFiles: { channel: "ComponentManager:getComponentFiles" },
      },
    };
  }
}


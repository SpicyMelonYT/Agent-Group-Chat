import { Manager } from "../core/manager.js";

/**
 * Frontend Component Manager
 * Handles dynamic loading of components by communicating with the backend ComponentManager
 */
export class ComponentManager extends Manager {
  constructor(...pathSpecs) {
    super();
    this.loadedComponents = new Set(); // Track loaded component paths
    this.pathSpecs = pathSpecs; // Store path specs to load
  }

  async init() {
    // Process all path specs during initialization
    for (const pathSpec of this.pathSpecs) {
      await this.load(pathSpec);
    }
    
    // Call parent init after loading components
    await super.init();
  }

  /**
   * Load components from a directory
   * @param {string} pathSpec - Empty string "" for main components, or section name like "main" for section-specific components
   * @returns {Promise<Array<string>>} - Array of loaded component file paths
   */
  async load(pathSpec) {
    try {
      // Generate relative path based on pathSpec
      let relativePath;
      if (pathSpec === "") {
        // Empty string = main components
        relativePath = "components";
      } else {
        // Section name = section-specific components
        relativePath = `sections/${pathSpec}/components`;
      }

      window.logger.log(
        {
          tags: "component|manager|load",
          color1: "cyan",
          includeSource: true,
        },
        `Loading components from '${relativePath}' (pathSpec: '${pathSpec}')`
      );

      // Call backend ComponentManager to get component file paths
      const componentFiles = await window.componentAPI.getComponentFiles(
        relativePath
      );

      if (!componentFiles || componentFiles.length === 0) {
        window.logger.log(
          {
            tags: "component|manager|load",
            color1: "yellow",
          },
          `No component files found in '${relativePath}'`
        );
        return [];
      }

      // Log that we're importing components
      window.logger.log(
        {
          tags: "component|manager|import",
          color1: "blue",
        },
        `Importing ${componentFiles.length} component(s)...`
      );

      // Dynamically import each component file
      const loadedPaths = [];
      for (const filePath of componentFiles) {
        // Skip if already loaded
        if (this.loadedComponents.has(filePath)) {
          // Extract just the filename for cleaner output
          const fileName = filePath.split(/[/\\]/).pop();
          window.logger.log(
            {
              tags: "component|manager|import",
              showTag: false,
            },
            `${fileName} (already loaded, skipping)`
          );
          continue;
        }

        try {
          // Convert relative path to import path
          // filePath is relative to frontend/ directory
          // ComponentManager is at frontend/managers/, so we go up one level (../) then use the filePath
          const importPath = `../${filePath}`;

          // Extract just the filename for cleaner output
          const fileName = filePath.split(/[/\\]/).pop();

          // Dynamic import
          await import(importPath);

          // Mark as loaded
          this.loadedComponents.add(filePath);
          loadedPaths.push(filePath);

          // Log success without tag
          window.logger.log(
            {
              tags: "component|manager|import|success",
              color1: "lime",
              showTag: false,
            },
            fileName
          );
        } catch (importError) {
          const fileName = filePath.split(/[/\\]/).pop();
          window.logger.error(
            {
              tags: "component|manager|import|error",
              color1: "red",
              color2: "orange",
              includeSource: true,
            },
            `Failed to import component '${fileName}':`,
            importError
          );
        }
      }

      // Log summary without tag
      window.logger.log(
        {
          tags: "component|manager|load|success",
          color1: "lime",
          showTag: false,
        },
        `Loaded ${loadedPaths.length} component(s) from '${relativePath}'`
      );

      return loadedPaths;
    } catch (error) {
      window.logger.error(
        {
          tags: "component|manager|load|error",
          color1: "red",
          color2: "orange",
          includeSource: true,
        },
        `Error loading components (pathSpec: '${pathSpec}'):`,
        error
      );
      return [];
    }
  }

  /**
   * Check if a component path has been loaded
   * @param {string} filePath - Component file path
   * @returns {boolean}
   */
  isLoaded(filePath) {
    return this.loadedComponents.has(filePath);
  }

  /**
   * Get all loaded component paths
   * @returns {Array<string>}
   */
  getLoadedComponents() {
    return Array.from(this.loadedComponents);
  }
}


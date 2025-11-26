import { Manager } from "../core/manager.js";

/**
 * Frontend Section Manager
 * Handles client-side section navigation by communicating with the backend SectionManager
 */
export class SectionManager extends Manager {
  constructor() {
    super();
    this.currentSection = "main";
  }

  /**
   * Switch to a different section
   * @param {string} sectionName - Name of the section to switch to (e.g., 'main', 'auth', 'chat')
   * @returns {Promise<boolean>} - Success status
   */
  async switchToSection(sectionName) {
    try {
      console.log(
        `SectionManager: Requesting switch to section '${sectionName}'`
      );

      // Call backend SectionManager to switch sections
      const success = await window.sectionAPI.switchToSection(sectionName);

      if (success) {
        this.currentSection = sectionName;
        console.log(
          `SectionManager: Successfully switched to section '${sectionName}'`
        );
      } else {
        console.error(
          `SectionManager: Failed to switch to section '${sectionName}'`
        );
      }

      return success;
    } catch (error) {
      console.error(
        `SectionManager: Error switching to section '${sectionName}':`,
        error
      );
      return false;
    }
  }

  /**
   * Get the current section name
   * @returns {Promise<string>}
   */
  async getCurrentSection() {
    try {
      const section = await window.sectionAPI.getCurrentSection();
      this.currentSection = section;
      return section;
    } catch (error) {
      console.error("SectionManager: Error getting current section:", error);
      return this.currentSection;
    }
  }

  /**
   * List all available sections
   * @returns {Promise<Array<{name: string, hasIndexHtml: boolean}>>}
   */
  async listSections() {
    try {
      return await window.sectionAPI.listSections();
    } catch (error) {
      console.error("SectionManager: Error listing sections:", error);
      return [];
    }
  }

  /**
   * Check if a section exists
   * @param {string} sectionName
   * @returns {Promise<boolean>}
   */
  async sectionExists(sectionName) {
    try {
      return await window.sectionAPI.sectionExists(sectionName);
    } catch (error) {
      console.error(
        `SectionManager: Error checking if section '${sectionName}' exists:`,
        error
      );
      return false;
    }
  }

  /**
   * Navigate to a section with validation
   * @param {string} sectionName
   * @returns {Promise<boolean>}
   */
  async navigateTo(sectionName) {
    // Validate section exists before navigating
    const exists = await this.sectionExists(sectionName);
    if (!exists) {
      console.error(
        `SectionManager: Cannot navigate to '${sectionName}' - section does not exist`
      );
      return false;
    }

    return await this.switchToSection(sectionName);
  }

  /**
   * Go back to the main section (hub)
   * @returns {Promise<boolean>}
   */
  async goToMain() {
    return await this.navigateTo("main");
  }
}

// Export a singleton instance
export const sectionManager = new SectionManager();

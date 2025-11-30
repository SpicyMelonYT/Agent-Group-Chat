import { Manager } from "../../../core/index.js";

export class MainManager extends Manager {
  async initGlobalVariables() {
    // Section config is now handled by SectionManager
  }

  async initElementReferences() {
    // Get component references
    this.mainLayout = document.getElementById("main-layout");
    this.sectionGrid = document.getElementById("section-grid");

    // Get loading overlay from HTML
    this.loadingOverlay = document.getElementById("loading-overlay");
  }

  async initStates() {
    // Wait 1000ms for loading overlay effect
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check if we should auto-navigate to a different section
    if (
      this.section.sectionManager.sectionConfig &&
      this.section.sectionManager.sectionConfig.activeSection !== "main"
    ) {
      // Auto-navigate to stored section
      this.loadingOverlay.hide();
      await this.section.sectionManager.navigateTo(
        this.section.sectionManager.sectionConfig.activeSection
      );
      return; // Don't load sections if we're navigating away
    }

    // Stay on main section - hide loading overlay and load sections
    this.loadingOverlay.hide();
    await this.loadSections();
  }

  async initEventListeners() {
    // Listen for navigate events from components
    // Components dispatch events with bubbles: false, composed: false
    if (this.mainLayout) {
      this.mainLayout.addEventListener("navigate", async (e) => {
        const { sectionName } = e.detail;
        if (sectionName && sectionName !== "main") {
          // Hide loading overlay if it's still visible
          if (this.loadingOverlay) {
            this.loadingOverlay.hide();
          }
          // SectionManager will handle updating the config
          await this.section.sectionManager.navigateTo(sectionName);
        }
      });
    }
  }

  /**
   * Dynamically load sections and create section cards
   */
  async loadSections() {
    try {
      // Get all available sections
      const sections = await this.section.sectionManager.listSections();

      if (!this.sectionGrid) {
        window.logger.error(
          {
            tags: "main|manager|error",
            color1: "red",
            includeSource: true,
          },
          "Section grid not found"
        );
        return;
      }

      // Filter out the current section (main) and only show sections with index.html
      const availableSections = sections.filter(
        (section) => section.name !== "main" && section.hasIndexHtml
      );

      // Clear existing cards (if any)
      this.sectionGrid.innerHTML = "";

      // Create section cards dynamically
      for (const section of availableSections) {
        const card = document.createElement("section-card");
        card.setAttribute("section-name", section.name);
        card.setAttribute(
          "section-title",
          this.formatSectionTitle(section.name)
        );
        card.setAttribute(
          "section-description",
          this.getSectionDescription(section.name)
        );
        this.sectionGrid.appendChild(card);
      }

      window.logger.log(
        {
          tags: "main|manager|load",
          color1: "cyan",
        },
        `Loaded ${availableSections.length} section(s)`
      );
    } catch (error) {
      window.logger.error(
        {
          tags: "main|manager|error",
          color1: "red",
          color2: "orange",
          includeSource: true,
        },
        "Failed to load sections:",
        error
      );
    }
  }

  /**
   * Format section name into a display title
   * @param {string} sectionName - Raw section name
   * @returns {string} Formatted title
   */
  formatSectionTitle(sectionName) {
    // Convert "section-name" to "Section Name"
    return sectionName
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  /**
   * Get description for a section
   * @param {string} sectionName - Section name
   * @returns {string} Description text
   */
  getSectionDescription(sectionName) {
    // Default descriptions for known sections
    const descriptions = {
      test: "Test section for development and debugging",
      chat: "Chat with AI agents",
      settings: "Configure application settings",
    };

    return (
      descriptions[sectionName] ||
      `Navigate to the ${this.formatSectionTitle(sectionName)} section`
    );
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
}

import { Manager } from "../../../core/index.js";

export class TestManager extends Manager {
  async initElementReferences() {
    // Get DOM elements
    this.currentSectionSpan = document.getElementById("current-section");
    this.infoDisplay = document.getElementById("info-display");
  }

  async initStates() {
    // Update current section display
    await this.updateCurrentSection();

    // Run tests after a short delay
    setTimeout(() => this.runSectionTests(), 1000);
  }

  async initEventListeners() {
    // Make functions globally available for HTML buttons
    window.goBackToMain = this.goBackToMain.bind(this);
    window.showSectionInfo = this.showSectionInfo.bind(this);
  }

  // Global functions for HTML buttons
  async goBackToMain() {
    const success = await this.section.sectionManager.navigateTo("main");
    if (success) {
      console.log("Successfully navigated to main");
    } else {
      console.error("Failed to navigate to main");
    }
  }

  showSectionInfo() {
    const isVisible = this.infoDisplay.style.display !== "none";
    this.infoDisplay.style.display = isVisible ? "none" : "block";
  }

  // Helper function to update current section display
  async updateCurrentSection() {
    try {
      const currentSection = await this.section.sectionManager.getCurrentSection();
      if (this.currentSectionSpan) {
        this.currentSectionSpan.textContent = currentSection;
      }
    } catch (error) {
      console.error("Failed to get current section:", error);
    }
  }

  // Test some section manager functions
  async runSectionTests() {
    console.log("Running section manager tests...");

    try {
      // Test listing sections
      const sections = await this.section.sectionManager.listSections();
      console.log("Available sections:", sections);

      // Test section existence
      const mainExists = await this.section.sectionManager.sectionExists("main");
      const testExists = await this.section.sectionManager.sectionExists("test");
      const nonexistentExists = await this.section.sectionManager.sectionExists("nonexistent");

      console.log("Section existence checks:", {
        main: mainExists,
        test: testExists,
        nonexistent: nonexistentExists,
      });
    } catch (error) {
      console.error("Section tests failed:", error);
    }
  }
}

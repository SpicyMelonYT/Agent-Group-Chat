import { Manager } from "../../../core/index.js";
import { sectionManager } from "../../../managers/section-manager.js";

export class MainManager extends Manager {
  async initElementReferences() {
    // Get component references
    this.mainLayout = document.querySelector("main-layout");
  }

  async initEventListeners() {
    // Listen for navigate events from components
    // Components dispatch events with bubbles: false, composed: false
    // so we need to listen on the document or the component itself
    if (this.mainLayout) {
      this.mainLayout.addEventListener("navigate", async (e) => {
        const { sectionName } = e.detail;
        if (sectionName) {
          await this.section.sectionManager.navigateTo(sectionName);
        }
      });
    }

    // Also listen on document for any navigate events that might bubble
    // (though they shouldn't with our component design)
    document.addEventListener("navigate", async (e) => {
      const { sectionName } = e.detail;
      if (sectionName && sectionName !== "main") {
        await this.section.sectionManager.navigateTo(sectionName);
      }
    });
  }
}

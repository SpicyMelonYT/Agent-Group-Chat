import { Manager } from "../../../core/index.js";
import { sectionManager } from "../../../managers/section-manager.js";

export class MainManager extends Manager {
  async initElementReferences() {
    this.navButton = document.getElementById(
      'navigate-to-test-section-button'
    );
  }

  async initEventListeners() {
    if (this.navButton) {
      this.navButton.addEventListener("click", () => {
        this.section.sectionManager.navigateTo("test");
      });
    }
  }
}

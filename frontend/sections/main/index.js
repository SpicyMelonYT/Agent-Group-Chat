import { Section } from "../../core/section.js";
import { MainManager } from "./managers/main-manager.js";
import { SectionManager } from "../../managers/section-manager.js";

export class MainSection extends Section {
  constructor() {
    super();

    // Add Core Managers
    this.sectionManager = this.addManager(new SectionManager());

    // Add Section Specific Managers
    this.mainManager = this.addManager(new MainManager());
  }
}

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", async () => {
  let mainSection = new MainSection();
  await mainSection.init();
});

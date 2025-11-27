import { Section } from "../../core/section.js";

// Core Managers
import { SectionManager } from "../../managers/section-manager.js";
import { ComponentManager } from "../../managers/component-manager.js";

// Section Specific Managers
import { MainManager } from "./managers/main-manager.js";

export class MainSection extends Section {
  constructor() {
    super();

    // Add Core Managers
    this.sectionManager = this.addManager(new SectionManager());
    this.componentManager = this.addManager(new ComponentManager("", "main"));

    // Add Section Specific Managers
    this.mainManager = this.addManager(new MainManager());
  }
}

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", async () => {
  let mainSection = new MainSection();
  await mainSection.init();
});

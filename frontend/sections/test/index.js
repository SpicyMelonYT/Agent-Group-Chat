import { Section } from "../../core/section.js";

// Core Managers
import { SectionManager } from "../../managers/section-manager.js";
import { ComponentManager } from "../../managers/component-manager.js";

// Section Specific Managers
import { TestManager } from "./managers/test-manager.js";

export class TestSection extends Section {
  constructor() {
    super();

    // Add Core Managers
    this.sectionManager = this.addManager(new SectionManager());
    this.componentManager = this.addManager(new ComponentManager("", "test"));

    // Add Section Specific Managers
    this.testManager = this.addManager(new TestManager());
  }
}

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", async () => {
  let testSection = new TestSection();
  await testSection.init();
});

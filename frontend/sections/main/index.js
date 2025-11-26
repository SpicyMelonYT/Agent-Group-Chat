import { Section } from "../../core/section.js";
import { MainManager } from "./managers/main-manager.js";

export class MainSection extends Section {
  constructor() {
    super();

    this.mainManager = this.addManager(new MainManager());
  }
}

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", async () => {
  let mainSection = new MainSection();
  await mainSection.init();
});

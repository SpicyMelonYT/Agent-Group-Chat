import { Section } from "../../core/section.js";

export class MainSection extends Section {
  constructor() {
    super();
  }
}

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", async () => {
  let mainSection = new MainSection();
  await mainSection.init();
});

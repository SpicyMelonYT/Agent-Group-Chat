import { Section } from "../../core/section.js";

// Core Managers
import { SectionManager } from "../../managers/section-manager.js";
import { ComponentManager } from "../../managers/component-manager.js";
import { MarkdownManager } from "../../managers/markdown-manager.js";

// Section Specific Managers
import { ChatManager } from "./managers/chat-manager.js";

export class ChatSection extends Section {
  constructor() {
    super();

    // Add Core Managers
    this.sectionManager = this.addManager(new SectionManager());
    this.componentManager = this.addManager(
      new ComponentManager("", "chat")
    );
    this.markdownManager = this.addManager(new MarkdownManager());

    // Add Section Specific Managers
    this.chatManager = this.addManager(new ChatManager());
  }

  async init() {
    await super.init();
    // Make markdown manager globally accessible for components
    window.markdownManager = this.markdownManager;
  }
}

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", async () => {
  let chatSection = new ChatSection();
  await chatSection.init();
});


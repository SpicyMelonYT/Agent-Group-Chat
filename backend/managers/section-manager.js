import { Manager, Logger } from "../core/index.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class SectionManager extends Manager {
  constructor() {
    super();
    this.currentSection = 'main';
    this.sectionsPath = path.join(__dirname, '../../frontend/sections');
    this.logger = new Logger();
  }

  async init() {
    // Note: mainWindow may not be available yet during initialization
    // We'll check for it when actually switching sections
    this.logger.log({
      tags: "section|manager|init",
      color: "green",
      includeSource: true
    }, "SectionManager initialized");
  }

  /**
   * Switch to a different section by loading its HTML file
   * @param {string} sectionName - Name of the section folder (e.g., 'main', 'auth', 'chat')
   * @returns {Promise<boolean>} - Success status
   */
  async switchToSection(sectionName) {
    try {
      this.logger.log({
        tags: "section|manager|switch",
        color: "blue",
        includeSource: true
      }, `Switching to section '${sectionName}'`);

      // Check if main window is available
      if (!this.app || !this.app.mainWindow) {
        throw new Error('Main window not available for section switching');
      }

      // Validate section exists
      const sectionPath = path.join(this.sectionsPath, sectionName);
      const htmlFile = path.join(sectionPath, 'index.html');

      // Check if section directory and HTML file exist
      if (!fs.existsSync(sectionPath)) {
        throw new Error(`Section '${sectionName}' directory not found`);
      }

      if (!fs.existsSync(htmlFile)) {
        throw new Error(`Section '${sectionName}' index.html not found`);
      }

      // Load the section's HTML file
      await this.app.mainWindow.loadFile(htmlFile);

      this.currentSection = sectionName;
      this.logger.log({
        tags: "section|manager|switch|success",
        color: "green"
      }, `Successfully switched to section '${sectionName}'`);

      return true;
    } catch (error) {
      this.logger.error({
        tags: "section|manager|switch|error",
        color1: "red",
        color2: "orange",
        includeSource: true
      }, `Failed to switch to section '${sectionName}':`, error);
      return false;
    }
  }

  /**
   * Get the current section name
   * @returns {string}
   */
  getCurrentSection() {
    return this.currentSection;
  }

  /**
   * List all available sections
   * @returns {Promise<Array<{name: string, hasIndexHtml: boolean}>>}
   */
  async listSections() {
    try {
      const entries = fs.readdirSync(this.sectionsPath, { withFileTypes: true });
      const sections = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const sectionName = entry.name;
          const htmlFile = path.join(this.sectionsPath, sectionName, 'index.html');
          const hasIndexHtml = fs.existsSync(htmlFile);

          sections.push({
            name: sectionName,
            hasIndexHtml: hasIndexHtml
          });
        }
      }

      return sections;
    } catch (error) {
      this.logger.error({
        tags: "section|manager|list|error",
        color1: "red",
        color2: "orange"
      }, "Failed to list sections:", error);
      return [];
    }
  }

  /**
   * Check if a section exists and has an index.html file
   * @param {string} sectionName
   * @returns {Promise<boolean>}
   */
  async sectionExists(sectionName) {
    try {
      const sections = await this.listSections();
      const section = sections.find(s => s.name === sectionName);
      return section && section.hasIndexHtml;
    } catch (error) {
      return false;
    }
  }

  /**
   * Define preload API configuration for the section manager
   */
  initPreload() {
    return {
      name: 'SectionManager',
      api: {
        switchToSection: { channel: 'SectionManager:switchToSection' },
        getCurrentSection: { channel: 'SectionManager:getCurrentSection' },
        listSections: { channel: 'SectionManager:listSections' },
        sectionExists: { channel: 'SectionManager:sectionExists' }
      }
    };
  }
}

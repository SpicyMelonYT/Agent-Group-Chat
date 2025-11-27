import { Manager } from "../core/manager.js";

/**
 * Markdown Manager
 * 
 * Provides markdown parsing and sanitization functionality for the frontend.
 * This manager makes markdown parsing available globally throughout the application.
 * 
 * Usage:
 * ```javascript
 * const markdownManager = section.addManager(new MarkdownManager());
 * const html = markdownManager.parse("**bold** text");
 * ```
 */
export class MarkdownManager extends Manager {
  constructor() {
    super();
    this._marked = null;
    this._DOMPurify = null;
    this._isInitialized = false;
  }

  async initGlobalVariables() {
    if (this._isInitialized) return;
    
    try {
      // Calculate the correct path to node_modules
      // This file is at: frontend/managers/markdown-manager.js
      // node_modules is at: node_modules/ (project root)
      // So we need to go up two levels: ../../node_modules/
      
      // Get the current file's directory
      const currentFileUrl = import.meta.url;
      const currentDir = new URL('.', currentFileUrl).href;
      
      // Build paths to node_modules
      // marked.esm.js is at: node_modules/marked/lib/marked.esm.js
      // purify.es.mjs is at: node_modules/dompurify/dist/purify.es.mjs
      const markedPath = new URL('../../node_modules/marked/lib/marked.esm.js', currentDir).href;
      const dompurifyPath = new URL('../../node_modules/dompurify/dist/purify.es.mjs', currentDir).href;
      
      window.logger?.log(
        {
          tags: "markdown|manager|init|debug",
          color1: "cyan",
          showTag: false,
        },
        `Attempting to load marked from: ${markedPath}`
      );
      
      // Try to import marked
      let markedModule;
      try {
        markedModule = await import(markedPath);
      } catch (e1) {
        window.logger?.error(
          {
            tags: "markdown|manager|init|error",
            color1: "red",
            showTag: false,
          },
          `Failed to import marked from ${markedPath}: ${e1.message}`
        );
        throw new Error(`Failed to import marked: ${e1.message}`);
      }
      
      // Try to import DOMPurify
      let DOMPurifyModule;
      try {
        DOMPurifyModule = await import(dompurifyPath);
      } catch (e1) {
        window.logger?.error(
          {
            tags: "markdown|manager|init|error",
            color1: "red",
            showTag: false,
          },
          `Failed to import DOMPurify from ${dompurifyPath}: ${e1.message}`
        );
        throw new Error(`Failed to import DOMPurify: ${e1.message}`);
      }
      
      if (!markedModule || !DOMPurifyModule) {
        throw new Error("Could not load markdown libraries");
      }
      
      const { marked } = markedModule;
      const DOMPurify = DOMPurifyModule.default || DOMPurifyModule;
      
      // Configure marked options
      marked.setOptions({
        breaks: true, // Convert line breaks to <br>
        gfm: true, // GitHub Flavored Markdown
      });
      
      this._marked = marked;
      this._DOMPurify = DOMPurify;
      this._isInitialized = true;
      
      window.logger?.log(
        {
          tags: "markdown|manager|init",
          color1: "green",
        },
        "Markdown libraries loaded successfully"
      );
    } catch (error) {
      window.logger?.error(
        {
          tags: "markdown|manager|init|error",
          color1: "red",
        },
        `Failed to load markdown libraries: ${error.message}`
      );
      // Fallback: markdown parsing will not work, but component won't crash
      this._marked = null;
      this._DOMPurify = null;
    }
  }

  /**
   * Parse markdown text to HTML and sanitize it
   * @param {string} markdown - Markdown text to parse
   * @returns {string} Sanitized HTML string
   */
  parse(markdown) {
    if (!markdown || typeof markdown !== "string") {
      return "";
    }

    // If libraries aren't loaded, return plain text
    if (!this._marked || !this._DOMPurify) {
      return this._escapeHtml(markdown);
    }

    try {
      // Parse markdown to HTML
      const html = this._marked.parse(markdown);
      
      // Sanitize HTML to prevent XSS attacks
      const sanitized = this._DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
          "p", "br", "strong", "em", "u", "s", "code", "pre",
          "h1", "h2", "h3", "h4", "h5", "h6",
          "ul", "ol", "li",
          "blockquote",
          "a", "img",
          "table", "thead", "tbody", "tr", "th", "td",
          "hr"
        ],
        ALLOWED_ATTR: ["href", "title", "alt", "src"],
      });
      
      return sanitized;
    } catch (error) {
      window.logger?.error(
        {
          tags: "markdown|manager|error",
          color1: "red",
        },
        `Failed to parse markdown: ${error.message}`
      );
      // Return escaped text as fallback
      return this._escapeHtml(markdown);
    }
  }

  /**
   * Escape HTML characters (fallback when DOMPurify is not available)
   * @private
   */
  _escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Parse markdown and return as a DocumentFragment (for better DOM manipulation)
   * @param {string} markdown - Markdown text to parse
   * @returns {DocumentFragment} DocumentFragment containing parsed HTML
   */
  parseToFragment(markdown) {
    const html = this.parse(markdown);
    const template = document.createElement("template");
    template.innerHTML = html;
    return template.content;
  }

  /**
   * Check if a string contains markdown syntax
   * @param {string} text - Text to check
   * @returns {boolean} True if text appears to contain markdown
   */
  containsMarkdown(text) {
    if (!text || typeof text !== "string") {
      return false;
    }
    
    // Simple heuristic: check for common markdown patterns
    const markdownPatterns = [
      /#{1,6}\s/,           // Headers
      /\*\*.*?\*\*/,        // Bold
      /\*.*?\*/,            // Italic
      /`.*?`/,              // Inline code
      /```[\s\S]*?```/,      // Code blocks
      /\[.*?\]\(.*?\)/,     // Links
      /^\s*[-*+]\s/,        // Unordered lists
      /^\s*\d+\.\s/,        // Ordered lists
      /^>\s/,               // Blockquotes
    ];
    
    return markdownPatterns.some(pattern => pattern.test(text));
  }
}


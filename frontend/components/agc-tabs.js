/**
 * Tab View Component
 *
 * A simple tab content manager that shows one child at a time without visible UI elements.
 *
 * Attributes:
 * - index: Current active tab index (default: 0)
 *
 * Usage Examples:
 *
 * // Basic usage
 * <agc-tabs index="0">
 *   <div>Tab 1 Content</div>
 *   <div>Tab 2 Content</div>
 *   <div>Tab 3 Content</div>
 * </agc-tabs>
 *
 * // Programmatic control
 * const tabView = document.querySelector('agc-tabs');
 * tabView.setIndex(1); // Switch to second tab
 *
 * // Event handling
 * tabView.addEventListener('load', (e) => {
 *   console.log('Loaded tab', e.detail.index, e.detail.element);
 * });
 * tabView.addEventListener('unload', (e) => {
 *   console.log('Unloaded tab', e.detail.index, e.detail.element);
 * });
 *
 * Methods:
 * - setIndex(index): Set active tab by index
 * - getIndex(): Get current active index
 * - getActiveElement(): Get currently active element
 * - getTabCount(): Get total number of tabs
 *
 * Styling:
 * - Fills parent container (flex: 1)
 * - No visible elements, just content management
 * - Active tab has display: block, inactive tabs have display: none
 *
 * Events:
 * - load: Fired when a tab becomes active (detail: { index, element })
 * - unload: Fired when a tab becomes inactive (detail: { index, element })
 */
export class TabView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._currentIndex = 0;
  }

  static get observedAttributes() {
    return ["index"];
  }

  connectedCallback() {
    this.render();
    this.updateActiveTab();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "index") {
      const newIndex = parseInt(newValue) || 0;
      if (newIndex !== this._currentIndex) {
        this.switchToTab(newIndex);
      }
    }
  }

  get index() {
    return parseInt(this.getAttribute("index")) || 0;
  }

  set index(newIndex) {
    this.setAttribute("index", newIndex.toString());
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          flex: 1;
          width: 100%;
          height: 100%;
          position: relative;
        }

        .tabs-container {
          display: flex;
          flex: 1;
          width: 100%;
          height: 100%;
          position: relative;
        }

        ::slotted(*) {
          display: none;
          flex: 1;
          width: 100%;
          height: 100%;
        }

        /* Active tab uses column flex layout */
        ::slotted(.active) {
          display: flex;
          flex-direction: column;
        }
      </style>
      <div class="tabs-container">
        <slot></slot>
      </div>
    `;
  }

  switchToTab(newIndex) {
    const children = this.children;
    const totalTabs = children.length;

    // Validate index
    if (newIndex < 0 || newIndex >= totalTabs) {
      console.warn(`Invalid tab index: ${newIndex}. Must be between 0 and ${totalTabs - 1}`);
      return;
    }

    const oldIndex = this._currentIndex;
    const oldElement = children[oldIndex];
    const newElement = children[newIndex];

    // Dispatch unload event for old tab
    if (oldElement) {
      this.dispatchEvent(
        new CustomEvent("unload", {
          bubbles: false,
          composed: false,
          detail: {
            index: oldIndex,
            element: oldElement,
          },
        })
      );

      // Remove active class
      oldElement.classList.remove("active");
    }

    // Update current index
    this._currentIndex = newIndex;

    // Dispatch load event for new tab
    if (newElement) {
      this.dispatchEvent(
        new CustomEvent("load", {
          bubbles: false,
          composed: false,
          detail: {
            index: newIndex,
            element: newElement,
          },
        })
      );

      // Add active class
      newElement.classList.add("active");
    }
  }

  updateActiveTab() {
    const children = this.children;
    const targetIndex = this.index;

    // Clear all active classes
    Array.from(children).forEach((child) => {
      child.classList.remove("active");
    });

    // Set active class on target tab
    const activeChild = children[targetIndex];
    if (activeChild) {
      activeChild.classList.add("active");
      this._currentIndex = targetIndex;
    } else if (children.length > 0) {
      // If invalid index, default to first tab
      children[0].classList.add("active");
      this._currentIndex = 0;
    }
  }

  // Public methods
  setIndex(index) {
    this.index = index;
  }

  getIndex() {
    return this._currentIndex;
  }

  getActiveElement() {
    return this.children[this._currentIndex] || null;
  }

  getTabCount() {
    return this.children.length;
  }
}

// Register the custom element
customElements.define("agc-tabs", TabView);

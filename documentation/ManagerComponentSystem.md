# Manager and Component System Documentation

## Overview
The manager and component system provides a structured architecture for organizing application logic and UI components. It implements a hierarchical pattern where managers handle business logic and state management, while components provide reusable UI elements. The system supports both backend (main process) and frontend (renderer process) implementations with consistent patterns.

## Key Terms and Concepts

### Managers
- **Manager**: A class that encapsulates related functionality and business logic
- **Backend Manager**: Runs in Electron's main process, handles system operations
- **Frontend Manager**: Runs in renderer process, handles UI logic and DOM interactions
- **Manager Lifecycle**: Initialization, operation, and cleanup phases

### Components
- **Component**: Reusable UI element implemented as a custom HTML element
- **Web Component**: Uses Shadow DOM for style isolation and encapsulation
- **Custom Element**: Registered with `customElements.define()`
- **Component Lifecycle**: Connected, attribute changes, disconnected

### Inheritance Patterns
- **Base Classes**: `Manager` and `Component` provide common functionality
- **Extension Pattern**: Subclasses override methods to add specific behavior
- **Composition**: Managers can contain other managers or components

## Manager Architecture

### Backend Manager Base Class

#### Location: `backend/core/manager.js`

```javascript
export class Manager {
  constructor() {
    /** @type {App} */
    this.app = null;  // Reference to main application
  }

  async init() {
    // Override in subclasses for initialization logic
  }

  initPreload() {
    // Define IPC API configuration for secure frontend access
    return {
      name: this.constructor.name,
      api: {
        // IPC method definitions
      }
    };
  }
}
```

#### Key Features
- **App Reference**: Access to main application and other managers
- **IPC Integration**: Define secure APIs for frontend communication
- **Async Initialization**: Support for async setup operations
- **Dependency Injection**: App instance provides access to other managers

### Frontend Manager Base Class

#### Location: `frontend/core/manager.js`

```javascript
export class Manager {
  constructor() {
    /** @type {Section} */
    this.section = null;  // Reference to parent section
  }

  async init() {
    await this.initGlobalVariables();
    await this.initElementReferences();
    await this.initEventListeners();
    await this.initStates();
  }

  async initGlobalVariables() {}     // Override: Set up global state
  async initElementReferences() {}   // Override: Cache DOM elements
  async initEventListeners() {}      // Override: Attach event handlers
  async initStates() {}              // Override: Initialize component state
}
```

#### Initialization Pattern
1. **Global Variables**: Set up shared state and references
2. **Element References**: Cache DOM element references for performance
3. **Event Listeners**: Attach event handlers to DOM elements
4. **States**: Initialize component or manager state

### Manager Implementation Examples

#### Backend Manager: WindowManager

```javascript
export class WindowManager extends Manager {
  constructor() {
    super();
    this.configFile = 'window-config.json';
    this.config = null;
    this.isInitialized = false;
  }

  async init() {
    // Access other managers through app reference
    const storeManager = this.app.managers.find(m => m.constructor.name === 'StoreManager');

    // Initialize window configuration
    await this.initializeConfig();
    this.isInitialized = true;
  }

  initPreload() {
    return {
      name: 'WindowManager',
      api: {
        getPosition: { channel: 'WindowManager:getPosition' },
        setPosition: { channel: 'WindowManager:setPosition' },
        // ... more IPC methods
      }
    };
  }
}
```

#### Frontend Manager: MainManager

```javascript
export class MainManager extends Manager {
  async initElementReferences() {
    // Cache DOM element references
    this.navButton = document.getElementById('navigate-button');
  }

  async initEventListeners() {
    // Attach event handlers
    if (this.navButton) {
      this.navButton.addEventListener('click', () => {
        this.section.sectionManager.navigateTo('other-section');
      });
    }
  }

  async initStates() {
    // Initialize component state
    this.currentView = 'default';
  }
}
```

## Component Architecture

### Web Component Base Pattern

#### Location: `frontend/components/tabs.js`

```javascript
export class Tabs extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });  // Create shadow root
    this._currentIndex = 0;
  }

  static get observedAttributes() {
    return ['index'];  // Attributes to watch for changes
  }

  connectedCallback() {
    this.render();           // Create component DOM
    this.updateActiveTab();  // Apply initial state
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // Handle attribute changes
    if (name === 'index') {
      this.switchToTab(parseInt(newValue));
    }
  }

  render() {
    // Create component HTML and styles
    this.shadowRoot.innerHTML = `
      <style>
        /* Component styles */
      </style>
      <div class="tabs-container">
        <slot></slot>  <!-- Content projection slot -->
      </div>
    `;
  }
}

// Register custom element
customElements.define('tabs', Tabs);
```

### Component Features

#### Shadow DOM
- **Encapsulation**: Styles don't leak outside component
- **Isolation**: Component internals are private
- **Styling**: Component-scoped CSS rules

#### Attribute Observation
- **Reactive Updates**: Automatic re-rendering on attribute changes
- **Property Binding**: Declarative component configuration
- **State Synchronization**: Attribute changes trigger updates

#### Content Projection
- **Slots**: `<slot>` elements allow external content insertion
- **Named Slots**: Multiple insertion points with names
- **Fallback Content**: Default content when slot is empty

### Component Communication

#### Events
```javascript
// Dispatch custom events
this.dispatchEvent(new CustomEvent('load', {
  bubbles: false,
  composed: false,
  detail: { index, element }
}));

// Listen for component events
tabs.addEventListener('load', (e) => {
  console.log('Tab loaded:', e.detail.index);
});
```

#### Properties and Methods
```javascript
// Public API
class Tabs extends HTMLElement {
  setIndex(index) {
    this.index = index;  // Triggers attribute change
  }

  getIndex() {
    return this._currentIndex;
  }

  getActiveElement() {
    return this.children[this._currentIndex];
  }
}
```

## Manager-Component Integration

### Component Usage in Managers

```javascript
export class ContentManager extends Manager {
  async initElementReferences() {
    // Get component reference
    this.tabsComponent = document.querySelector('tabs');
  }

  async initEventListeners() {
    // Listen to component events
    this.tabsComponent.addEventListener('load', (e) => {
      this.handleTabChange(e.detail.index);
    });
  }

  async initStates() {
    // Initialize component state
    this.tabsComponent.setIndex(0);
  }

  handleTabChange(tabIndex) {
    // Respond to component state changes
    switch(tabIndex) {
      case 0:
        this.showHomeContent();
        break;
      case 1:
        this.showSettingsContent();
        break;
    }
  }
}
```

### Manager-Driven Components

```javascript
export class DataManager extends Manager {
  constructor() {
    super();
    this.data = [];
  }

  async loadData() {
    // Load data from backend
    this.data = await window.storeAPI.readJSON('data.json');
    this.updateComponents();
  }

  updateComponents() {
    // Update all data display components
    const dataComponents = document.querySelectorAll('data-display');
    dataComponents.forEach(component => {
      component.data = this.data;
    });
  }
}
```

## Inheritance and Extension Patterns

### Manager Inheritance

#### Base Manager Extension
```javascript
export class BaseServiceManager extends Manager {
  async init() {
    await super.init();
    // Common service initialization
    this.apiEndpoint = await this.getAPIEndpoint();
  }

  async getAPIEndpoint() {
    // Common API configuration
    return 'https://api.example.com';
  }
}

export class UserManager extends BaseServiceManager {
  async init() {
    await super.init();
    // User-specific initialization
    this.currentUser = await this.loadCurrentUser();
  }

  async loadCurrentUser() {
    // User-specific logic
    return await this.apiCall('/user/current');
  }
}
```

#### Mixin Pattern
```javascript
// Mixin for event handling
const EventMixin = {
  initEventListeners() {
    // Common event setup
    this.eventHandlers = new Map();
  },

  addEventHandler(element, event, handler) {
    element.addEventListener(event, handler);
    this.eventHandlers.set(handler, { element, event });
  },

  removeEventHandler(handler) {
    const { element, event } = this.eventHandlers.get(handler);
    element.removeEventListener(event, handler);
    this.eventHandlers.delete(handler);
  }
};

// Apply mixin to manager
export class InteractiveManager extends Manager {
  constructor() {
    super();
    Object.assign(this, EventMixin);
  }
}
```

### Component Inheritance

#### Component Extension
```javascript
export class BaseButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.attachEvents();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        button { /* base button styles */ }
      </style>
      <button><slot></slot></button>
    `;
  }

  attachEvents() {
    const button = this.shadowRoot.querySelector('button');
    button.addEventListener('click', () => this.handleClick());
  }

  handleClick() {
    // Base click handling
    this.dispatchEvent(new CustomEvent('button-click'));
  }
}

export class PrimaryButton extends BaseButton {
  render() {
    super.render();
    // Override styles for primary variant
    const style = this.shadowRoot.querySelector('style');
    style.textContent += `
      button {
        background: blue;
        color: white;
      }
    `;
  }
}
```

## Manager Registration and Discovery

### Backend Manager Registration

```javascript
// backend/app.js
export class MainApp extends App {
  async init() {
    // Register managers in dependency order
    this.addManager(new StoreManager());      // No dependencies
    this.addManager(new WindowManager());     // Depends on StoreManager
    this.addManager(new SectionManager());    // Independent

    await this.initManagers();
  }
}
```

### Frontend Manager Registration

```javascript
// frontend/sections/main/index.js
export class MainSection extends Section {
  constructor() {
    super();

    // Register core managers
    this.sectionManager = this.addManager(new SectionManager());

    // Register section-specific managers
    this.mainManager = this.addManager(new MainManager());
    this.contentManager = this.addManager(new ContentManager());
  }
}
```

## Component Registration

### Global Component Registration
```javascript
// frontend/components/index.js
import { Tabs } from './tabs.js';
import { Modal } from './modal.js';

// Register all components
customElements.define('tabs', Tabs);
customElements.define('modal', Modal);
```

### Lazy Component Loading
```javascript
export async function loadComponent(name) {
  switch(name) {
    case 'chart':
      const { ChartComponent } = await import('./chart.js');
      customElements.define('data-chart', ChartComponent);
      break;
  }
}
```

## Lifecycle Management

### Manager Lifecycle

#### Initialization
1. **Constructor**: Set up initial state
2. **Dependency Resolution**: Access other managers
3. **Resource Allocation**: Open connections, load data
4. **Event Setup**: Register IPC handlers or DOM listeners

#### Operation
- **State Management**: Maintain internal state
- **Communication**: IPC calls, event handling
- **Resource Updates**: Refresh data, update UI

#### Cleanup
- **Event Removal**: Remove listeners and handlers
- **Resource Release**: Close connections, free memory
- **State Persistence**: Save state before shutdown

### Component Lifecycle

#### Creation
- **Constructor**: Initialize component state
- **Shadow Root**: Create encapsulated DOM
- **Initial Render**: Create component HTML structure

#### Connection
- **connectedCallback**: Component added to DOM
- **Attribute Setup**: Apply initial attributes
- **Event Attachment**: Add event listeners
- **Child Observation**: Set up mutation observers

#### Updates
- **attributeChangedCallback**: React to attribute changes
- **Re-rendering**: Update component DOM
- **State Synchronization**: Update internal state

#### Disconnection
- **disconnectedCallback**: Component removed from DOM
- **Cleanup**: Remove event listeners
- **Resource Release**: Clear timers, connections

## Error Handling and Debugging

### Manager Error Handling

```javascript
export class RobustManager extends Manager {
  async init() {
    try {
      await this.performInitialization();
    } catch (error) {
      console.error(`${this.constructor.name} initialization failed:`, error);
      // Fallback initialization or graceful degradation
      await this.fallbackInit();
    }
  }

  async performOperation() {
    try {
      return await this.dangerousOperation();
    } catch (error) {
      this.handleOperationError(error);
      throw error; // Re-throw or handle gracefully
    }
  }
}
```

### Component Error Boundaries

```javascript
export class ErrorBoundary extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    try {
      this.renderContent();
    } catch (error) {
      this.renderError(error);
    }
  }

  renderError(error) {
    this.shadowRoot.innerHTML = `
      <div class="error">
        <h3>Component Error</h3>
        <p>${error.message}</p>
        <button onclick="location.reload()">Reload</button>
      </div>
    `;
  }
}
```

## Performance Optimization

### Manager Optimization

#### Lazy Initialization
```javascript
export class LazyManager extends Manager {
  async init() {
    // Defer heavy initialization
    this.initialized = false;
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.performHeavyInit();
      this.initialized = true;
    }
  }

  async getData() {
    await this.ensureInitialized();
    return this.cachedData;
  }
}
```

#### Resource Pooling
```javascript
export class ConnectionManager extends Manager {
  constructor() {
    super();
    this.connections = new Map();
  }

  async getConnection(key) {
    if (!this.connections.has(key)) {
      this.connections.set(key, await this.createConnection(key));
    }
    return this.connections.get(key);
  }
}
```

### Component Optimization

#### Virtual Scrolling
```javascript
export class VirtualList extends HTMLElement {
  constructor() {
    super();
    this.visibleItems = [];
    this.scrollTop = 0;
  }

  render() {
    // Only render visible items
    const startIndex = Math.floor(this.scrollTop / this.itemHeight);
    const endIndex = startIndex + this.visibleCount;

    this.visibleItems = this.items.slice(startIndex, endIndex);
    // Render visible items only
  }
}
```

#### Memoization
```javascript
export class MemoizedComponent extends HTMLElement {
  constructor() {
    super();
    this._memoizedResults = new Map();
  }

  computeExpensiveValue(input) {
    if (this._memoizedResults.has(input)) {
      return this._memoizedResults.get(input);
    }

    const result = this.expensiveComputation(input);
    this._memoizedResults.set(input, result);
    return result;
  }
}
```

## Testing Patterns

### Manager Testing

```javascript
// manager.test.js
import { TestManager } from '../managers/test-manager.js';

describe('TestManager', () => {
  let manager;

  beforeEach(() => {
    manager = new TestManager();
    manager.app = { /* mock app */ };
  });

  test('initializes correctly', async () => {
    await manager.init();
    expect(manager.initialized).toBe(true);
  });

  test('handles IPC calls', async () => {
    const result = await manager.processData('test');
    expect(result).toBeDefined();
  });
});
```

### Component Testing

```javascript
// component.test.js
import { TestComponent } from '../components/test-component.js';

describe('TestComponent', () => {
  let component;

  beforeEach(() => {
    component = new TestComponent();
    document.body.appendChild(component);
  });

  afterEach(() => {
    document.body.removeChild(component);
  });

  test('renders correctly', () => {
    expect(component.shadowRoot.querySelector('.content')).toBeTruthy();
  });

  test('handles attribute changes', () => {
    component.setAttribute('value', 'test');
    expect(component.value).toBe('test');
  });
});
```

## Best Practices

### Manager Development
- **Single Responsibility**: Each manager handles one concern
- **Dependency Injection**: Use app reference for manager communication
- **Async Operations**: Properly handle promises and error states
- **Resource Management**: Clean up resources in destruction

### Component Development
- **Shadow DOM**: Use for style encapsulation
- **Attribute API**: Expose configuration through attributes
- **Event System**: Use custom events for component communication
- **Performance**: Minimize DOM operations and re-renders

### Architecture Guidelines
- **Consistent Naming**: Follow naming conventions
- **Documentation**: Document public APIs and usage
- **Error Handling**: Implement robust error boundaries
- **Testing**: Write unit tests for critical functionality

### Code Organization
- **File Structure**: Group related managers and components
- **Import Patterns**: Use clear import/export statements
- **Modularity**: Keep files focused and single-purpose
- **Reusability**: Design for component and manager reuse

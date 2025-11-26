# Section Folder System Documentation

## Overview
The section folder system implements a modular architecture for organizing UI components and functionality into self-contained sections. Each section represents a distinct part of the application that can be loaded dynamically, providing clear separation of concerns and enabling scalable development.

## Key Terms and Concepts

### Sections
- **Section**: A self-contained UI module with its own HTML, JavaScript, and optional CSS
- **Section Folder**: Directory containing all files for a specific section
- **Dynamic Loading**: Sections loaded on-demand by the SectionManager
- **Section Lifecycle**: Initialization, activation, and cleanup phases

### Section Structure
- **Entry Point**: `index.html` - Main HTML file loaded by Electron
- **JavaScript**: `index.js` - Section initialization and logic
- **Managers**: `managers/` - Section-specific manager classes
- **Components**: `components/` - Section-specific UI components
- **Styles**: `style.css` - Section-specific styling (optional)

## Section Organization

### Directory Structure
```
frontend/sections/
├── main/                    # Main application section
│   ├── index.html          # Entry HTML file
│   ├── index.js            # Section initialization
│   ├── managers/           # Section-specific managers
│   │   └── main-manager.js
│   ├── components/         # Section-specific components
│   └── style.css           # Section styles
├── test/                   # Test/demo section
│   ├── index.html
│   └── index.js
└── [other-sections]/       # Additional sections
```

### Section Discovery
- **Automatic Detection**: SectionManager scans `frontend/sections/` directory
- **Validation**: Checks for required `index.html` file
- **Metadata**: Collects section name and file availability

## Section Implementation Patterns

### Class-Based Sections (Recommended)
**Example**: `frontend/sections/main/index.js`

```javascript
import { Section } from "../../core/section.js";
import { MainManager } from "./managers/main-manager.js";
import { SectionManager } from "../../managers/section-manager.js";

export class MainSection extends Section {
  constructor() {
    super();

    // Add core managers (shared across sections)
    this.sectionManager = this.addManager(new SectionManager());

    // Add section-specific managers
    this.mainManager = this.addManager(new MainManager());
  }
}

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", async () => {
  let mainSection = new MainSection();
  await mainSection.init();
});
```

### Function-Based Sections (Simple)
**Example**: `frontend/sections/test/index.js`

```javascript
import { Logger } from '../../core/logger.js';
import { sectionManager } from '../../managers/section-manager.js';

// Initialize logger
const logger = new Logger();

// DOM ready initialization
document.addEventListener('DOMContentLoaded', async () => {
  logger.log({ tag: 'test-section', color: 'blue' }, 'Test section loaded!');

  // Initialize DOM elements and event handlers
  await initializeSection();
});

// Section-specific functions
window.goBackToMain = async function() {
  const success = await sectionManager.navigateTo('main');
  // Handle navigation result
};
```

## Section Lifecycle

### 1. Loading Phase
- **File Loading**: Electron loads section's `index.html`
- **DOM Construction**: HTML parsed and DOM created
- **Script Execution**: `index.js` executes in renderer process

### 2. Initialization Phase
- **Constructor**: Section class instantiated
- **Manager Setup**: Managers added to section
- **DOM Ready**: `DOMContentLoaded` event triggers initialization
- **Manager Init**: All managers initialized in sequence

### 3. Active Phase
- **Event Handling**: User interactions processed
- **IPC Communication**: Backend API calls made
- **State Management**: UI state maintained
- **Navigation**: Section switches handled

### 4. Cleanup Phase
- **Navigation Away**: Section unloaded when switching
- **Resource Cleanup**: Event listeners removed, timers cleared
- **Memory Management**: DOM references released

## Manager Integration

### Section Managers
- **Purpose**: Handle section-specific business logic
- **Inheritance**: Extend base `Manager` class
- **Lifecycle**: Initialize after DOM ready
- **Dependencies**: Can depend on core managers

### Core Managers
- **SectionManager**: Navigation and section coordination (always present)
- **Shared Managers**: Available across sections via imports
- **Global Access**: Available through section instance

### Manager Initialization Pattern
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
        // Handle navigation
      });
    }
  }

  async initStates() {
    // Initialize component state
    this.currentView = 'default';
  }
}
```

## Navigation System

### Section Switching
- **Backend Coordination**: SectionManager handles HTML loading
- **Validation**: Checks section existence before switching
- **State Reset**: New section initializes fresh state
- **IPC Communication**: Secure navigation through backend API

### Navigation Methods
```javascript
// Direct navigation
await sectionManager.switchToSection('sectionName');

// Safe navigation with validation
await sectionManager.navigateTo('sectionName');

// Quick return to main
await sectionManager.goToMain();
```

### Navigation Events
- **Section Load**: `DOMContentLoaded` triggers section initialization
- **Manager Init**: Sequential manager initialization
- **IPC Ready**: Backend APIs become available
- **UI Ready**: Section fully interactive

## Component Organization

### Section Components
- **Location**: `sections/[section-name]/components/`
- **Purpose**: Reusable UI components specific to section
- **Registration**: Custom elements defined in component files
- **Integration**: Imported and used in section HTML/JS

### Shared Components
- **Location**: `frontend/components/`
- **Purpose**: Components usable across multiple sections
- **Examples**: Tabs, modals, form controls
- **Registration**: Global custom element definitions

### Component Example: Tabs Component
```javascript
// frontend/components/tabs.js
export class Tabs extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  // Component implementation...
}

// Register globally
customElements.define('tabs', Tabs);
```

## Styling Architecture

### Section Styles
- **File**: `style.css` in section directory
- **Scope**: Styles apply only to current section
- **Loading**: Included in section's HTML file
- **Isolation**: Section switch resets styling context

### Global Styles
- **Location**: `frontend/styles/` (if exists)
- **Purpose**: Application-wide styling
- **Loading**: Could be included in base HTML template

### CSS Organization
```html
<!-- Section-specific styles -->
<link rel="stylesheet" href="style.css">
```

```css
/* Section-scoped styles */
.section-container {
  /* Section-specific styling */
}

.section-header {
  /* Component styling within section */
}
```

## Section Development Workflow

### Creating New Sections

#### 1. Directory Structure
```bash
mkdir frontend/sections/new-section
cd frontend/sections/new-section
touch index.html index.js
mkdir managers components
```

#### 2. HTML Template
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>New Section - Agent Group Chat</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="section-container">
        <h1>New Section</h1>
        <!-- Section content -->
    </div>
    <script type="module" src="index.js"></script>
</body>
</html>
```

#### 3. JavaScript Implementation
```javascript
import { Section } from "../../core/section.js";
import { NewSectionManager } from "./managers/new-section-manager.js";

export class NewSection extends Section {
  constructor() {
    super();
    this.sectionManager = this.addManager(new SectionManager());
    this.newManager = this.addManager(new NewSectionManager());
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  let section = new NewSection();
  await section.init();
});
```

#### 4. Manager Implementation
```javascript
import { Manager } from "../../core/manager.js";

export class NewSectionManager extends Manager {
  async initElementReferences() {
    // Initialize DOM references
  }

  async initEventListeners() {
    // Set up event handlers
  }
}
```

### Best Practices

#### Section Design
- **Single Responsibility**: Each section handles one major feature
- **Self-Contained**: Minimize dependencies on other sections
- **Consistent Naming**: Use descriptive, consistent naming
- **Error Handling**: Graceful failure handling

#### Code Organization
- **Modular Structure**: Separate concerns into managers
- **Import Patterns**: Clear import organization
- **Event Management**: Proper cleanup of event listeners
- **Memory Management**: Avoid memory leaks

#### Navigation Design
- **Validation**: Always validate navigation targets
- **Loading States**: Show loading indicators during switches
- **Error Recovery**: Handle navigation failures gracefully
- **State Preservation**: Save/restore section state as needed

## Section Manager Backend Integration

### IPC API Definition
```javascript
// backend/managers/section-manager.js
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
```

### Frontend Usage
```javascript
// Access through global API
const sections = await window.sectionAPI.listSections();
const success = await window.sectionAPI.switchToSection('newSection');
```

## Performance Considerations

### Loading Optimization
- **Lazy Loading**: Sections loaded only when needed
- **Resource Cleanup**: Proper cleanup when switching sections
- **Bundle Splitting**: Separate bundles for large sections
- **Caching**: Cache frequently used resources

### Memory Management
- **Event Cleanup**: Remove event listeners on section unload
- **DOM References**: Clear references to prevent memory leaks
- **Timer Cleanup**: Clear intervals/timeouts
- **Component Disposal**: Clean up custom components

### Navigation Performance
- **Validation Caching**: Cache section existence checks
- **Preloading**: Optional preloading of frequently used sections
- **Transition Animations**: Smooth visual transitions
- **Loading Indicators**: User feedback during loading

## Testing and Debugging

### Section Testing
- **Isolation**: Test sections independently
- **Manager Testing**: Unit test individual managers
- **Integration Testing**: Test section navigation
- **UI Testing**: Test user interactions within sections

### Debug Tools
- **Console Logging**: Extensive logging in development
- **DevTools**: Browser developer tools for DOM inspection
- **IPC Monitoring**: Track inter-process communication
- **Performance Profiling**: Monitor section loading performance

## Scalability Patterns

### Large Applications
- **Section Splitting**: Break large features into sub-sections
- **Shared Components**: Reusable components across sections
- **Service Layers**: Shared business logic managers
- **Routing Systems**: Complex navigation patterns

### Code Organization
- **Index Files**: Central export files for components
- **Utility Modules**: Shared utility functions
- **Type Definitions**: TypeScript interfaces for complex sections
- **Documentation**: Comprehensive section documentation

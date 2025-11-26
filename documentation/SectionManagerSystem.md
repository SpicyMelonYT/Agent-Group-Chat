# Section Manager System Documentation

## Overview
The Section Manager system provides a coordinated architecture for managing application sections (pages/screens) across both backend and frontend processes. It enables dynamic loading and switching between different UI sections while maintaining state separation and providing a consistent navigation API. The system consists of backend section management (HTML loading) and frontend section coordination (navigation logic).

## Key Terms and Concepts

### Sections
- **Section**: A self-contained UI module with its own HTML, JavaScript, and resources
- **Section Folder**: Directory containing section files (`index.html`, `index.js`, etc.)
- **Dynamic Loading**: Runtime loading of section HTML files
- **Section State**: Isolated state within each section's lifecycle

### Navigation
- **Section Switching**: Backend-driven HTML file loading
- **Navigation Coordination**: Frontend validation and state management
- **Section Discovery**: Automatic detection of available sections
- **Validation**: Pre-navigation checks for section existence

### Coordination
- **Backend SectionManager**: Handles HTML loading and section validation
- **Frontend SectionManager**: Manages navigation logic and client-side coordination
- **IPC Communication**: Secure communication between section managers
- **State Synchronization**: Maintaining section state across processes

## Backend Section Manager

### Architecture and Responsibilities

#### Core Functionality
- **HTML Loading**: Dynamically loads section HTML files into the main window
- **Section Discovery**: Scans filesystem for available sections
- **Validation**: Ensures sections exist and have required files
- **State Tracking**: Maintains current section information

#### File System Structure
```
frontend/sections/
├── main/
│   ├── index.html     # Entry point
│   ├── index.js       # Section logic
│   └── managers/      # Section-specific managers
├── auth/
│   ├── index.html
│   └── index.js
└── chat/
    ├── index.html
    └── index.js
```

### Section Loading Process

#### HTML File Loading
```javascript
async switchToSection(sectionName) {
  try {
    console.log(`SectionManager: Switching to section '${sectionName}'`);

    // Validate main window availability
    if (!this.app || !this.app.mainWindow) {
      throw new Error('Main window not available for section switching');
    }

    // Construct section paths
    const sectionPath = path.join(this.sectionsPath, sectionName);
    const htmlFile = path.join(sectionPath, 'index.html');

    // Validate section exists
    if (!fs.existsSync(sectionPath)) {
      throw new Error(`Section '${sectionName}' directory not found`);
    }

    if (!fs.existsSync(htmlFile)) {
      throw new Error(`Section '${sectionName}' index.html not found`);
    }

    // Load the section's HTML file
    await this.app.mainWindow.loadFile(htmlFile);

    this.currentSection = sectionName;
    console.log(`SectionManager: Successfully switched to section '${sectionName}'`);

    return true;
  } catch (error) {
    console.error(`SectionManager: Failed to switch to section '${sectionName}':`, error);
    return false;
  }
}
```

#### Section Discovery
```javascript
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
    console.error('SectionManager: Failed to list sections:', error);
    return [];
  }
}
```

#### Section Validation
```javascript
async sectionExists(sectionName) {
  try {
    const sections = await this.listSections();
    const section = sections.find(s => s.name === sectionName);
    return section && section.hasIndexHtml;
  } catch (error) {
    return false;
  }
}
```

## Frontend Section Manager

### Client-Side Coordination

#### Navigation Logic
```javascript
async switchToSection(sectionName) {
  try {
    console.log(`SectionManager: Requesting switch to section '${sectionName}'`);

    // Call backend SectionManager to switch sections
    const success = await window.sectionAPI.switchToSection(sectionName);

    if (success) {
      this.currentSection = sectionName;
      console.log(`SectionManager: Successfully switched to section '${sectionName}'`);
    } else {
      console.error(`SectionManager: Failed to switch to section '${sectionName}'`);
    }

    return success;
  } catch (error) {
    console.error(`SectionManager: Error switching to section '${sectionName}':`, error);
    return false;
  }
}
```

#### Safe Navigation
```javascript
async navigateTo(sectionName) {
  // Validate section exists before navigating
  const exists = await this.sectionExists(sectionName);
  if (!exists) {
    console.error(`SectionManager: Cannot navigate to '${sectionName}' - section does not exist`);
    return false;
  }

  return await this.switchToSection(sectionName);
}
```

#### Section State Queries
```javascript
async getCurrentSection() {
  try {
    const section = await window.sectionAPI.getCurrentSection();
    this.currentSection = section;
    return section;
  } catch (error) {
    console.error("SectionManager: Error getting current section:", error);
    return this.currentSection;
  }
}
```

## IPC Integration

### Preload API Configuration
```javascript
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

### IPC Channel Usage
- **SectionManager:switchToSection**: Backend section switching
- **SectionManager:getCurrentSection**: Current section queries
- **SectionManager:listSections**: Section enumeration
- **SectionManager:sectionExists**: Section validation

## Section Lifecycle

### Section Loading Sequence

#### 1. Navigation Request
```javascript
// User initiates navigation
await sectionManager.navigateTo('chat');

// Frontend validation
const exists = await sectionManager.sectionExists('chat');
if (!exists) return false;

// Backend section loading
const success = await window.sectionAPI.switchToSection('chat');
```

#### 2. HTML Loading
```javascript
// Backend loads new HTML
await this.app.mainWindow.loadFile('frontend/sections/chat/index.html');

// Browser navigates to new document
// Previous section context is destroyed
```

#### 3. Section Initialization
```javascript
// New section's JavaScript executes
document.addEventListener('DOMContentLoaded', async () => {
  // Section-specific initialization
  let chatSection = new ChatSection();
  await chatSection.init();
});
```

#### 4. State Synchronization
```javascript
// Frontend updates current section tracking
this.currentSection = 'chat';

// IPC state synchronization
const current = await window.sectionAPI.getCurrentSection();
```

### Section Context Management

#### Context Isolation
- **Document Reset**: Each section loads in a fresh document context
- **State Reset**: Previous section state is completely cleared
- **Resource Cleanup**: Event listeners and resources from previous section are cleaned up
- **Fresh Start**: Each section initializes independently

#### State Preservation
- **Global Managers**: SectionManager instance persists across section switches
- **Backend State**: Window state, data persistence, and other backend managers maintain state
- **Cross-Section Data**: Shared data through StoreManager or other persistent storage

## Navigation Patterns

### Direct Navigation
```javascript
// Direct section switching
await window.sectionAPI.switchToSection('settings');
```

### Validated Navigation
```javascript
// Safe navigation with validation
const success = await sectionManager.navigateTo('profile');
if (!success) {
  console.error('Failed to navigate to profile section');
}
```

### Programmatic Navigation
```javascript
// Navigation from UI components
class NavigationMenu extends HTMLElement {
  async navigateToSection(sectionName) {
    const success = await window.sectionAPI.switchToSection(sectionName);
    if (success) {
      // Update UI state
      this.updateActiveSection(sectionName);
    }
  }
}
```

### Conditional Navigation
```javascript
// Navigation with prerequisites
async navigateToProtectedSection(sectionName) {
  // Check authentication
  const isAuthenticated = await this.checkAuthentication();

  if (!isAuthenticated) {
    // Redirect to login
    await sectionManager.navigateTo('auth');
    return;
  }

  // Proceed to requested section
  await sectionManager.navigateTo(sectionName);
}
```

## Error Handling and Recovery

### Backend Error Handling
```javascript
async switchToSection(sectionName) {
  try {
    // Section switching logic
    await this.validateSection(sectionName);
    await this.app.mainWindow.loadFile(htmlFile);

    this.currentSection = sectionName;
    return true;
  } catch (error) {
    console.error(`SectionManager: Failed to switch to section '${sectionName}':`, error);

    // Error recovery - attempt to stay on current section
    // Don't change this.currentSection on failure
    return false;
  }
}
```

### Frontend Error Handling
```javascript
async switchToSection(sectionName) {
  try {
    const success = await window.sectionAPI.switchToSection(sectionName);

    if (success) {
      this.currentSection = sectionName;
      // Update UI indicators
      this.updateNavigationUI(sectionName);
    } else {
      // Handle navigation failure
      this.showNavigationError(`Failed to load section: ${sectionName}`);
    }

    return success;
  } catch (error) {
    console.error(`SectionManager: Error switching to section '${sectionName}':`, error);

    // Show user-friendly error
    this.showNavigationError('Navigation failed. Please try again.');
    return false;
  }
}
```

### Fallback Strategies
```javascript
async safeNavigate(sectionName) {
  try {
    // Primary navigation attempt
    const success = await this.navigateTo(sectionName);
    if (success) return true;

    // Fallback: try to return to main section
    console.warn(`Falling back to main section after failed navigation to ${sectionName}`);
    return await this.navigateTo('main');

  } catch (error) {
    // Ultimate fallback: reload application
    console.error('Critical navigation error, reloading application');
    window.location.reload();
  }
}
```

## Section Development Workflow

### Creating New Sections

#### 1. Directory Structure
```bash
# Create section directory
mkdir frontend/sections/new-section

# Create required files
touch frontend/sections/new-section/index.html
touch frontend/sections/new-section/index.js
mkdir frontend/sections/new-section/managers
mkdir frontend/sections/new-section/components
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
        <header>
            <h1>New Section</h1>
            <nav>
                <button onclick="goBack()">← Back</button>
            </nav>
        </header>

        <main>
            <!-- Section content -->
        </main>
    </div>

    <script type="module" src="index.js"></script>
</body>
</html>
```

#### 3. JavaScript Implementation
```javascript
import { Section } from "../../core/section.js";
import { SectionManager } from "../../managers/section-manager.js";
import { NewSectionManager } from "./managers/new-section-manager.js";

export class NewSection extends Section {
  constructor() {
    super();

    // Add core managers
    this.sectionManager = this.addManager(new SectionManager());

    // Add section-specific managers
    this.newManager = this.addManager(new NewSectionManager());
  }
}

// Global navigation functions
window.goBack = async function() {
  await window.sectionAPI.switchToSection('main');
};

// Initialize section
document.addEventListener("DOMContentLoaded", async () => {
  let section = new NewSection();
  await section.init();
});
```

#### 4. Section Manager
```javascript
import { Manager } from "../../core/manager.js";

export class NewSectionManager extends Manager {
  async initElementReferences() {
    this.contentArea = document.getElementById('content-area');
  }

  async initEventListeners() {
    // Section-specific event handlers
  }

  async initStates() {
    // Initialize section state
    this.currentView = 'default';
  }
}
```

### Section Registration
```javascript
// Sections are automatically discovered by the SectionManager
// No explicit registration required - just create the directory structure

// Backend automatically finds sections via filesystem scanning
const sections = await window.sectionAPI.listSections();
// Returns: [{ name: 'main', hasIndexHtml: true }, { name: 'new-section', hasIndexHtml: true }]
```

## Performance Considerations

### Loading Optimization
- **Lazy Loading**: Sections load only when requested
- **Resource Cleanup**: Previous section resources are automatically cleaned up
- **Cache Management**: Browser cache handles static assets
- **Bundle Splitting**: Large sections can be code-split

### Navigation Performance
- **Validation Caching**: Section existence checks can be cached
- **Preloading**: Optional preloading of frequently used sections
- **Transition Effects**: Smooth visual transitions during navigation
- **Loading States**: User feedback during section loading

### Memory Management
- **Context Reset**: Each section gets a fresh JavaScript context
- **DOM Cleanup**: Previous section's DOM is completely replaced
- **Event Cleanup**: Automatic cleanup of event listeners
- **Resource Disposal**: Proper cleanup of resources and connections

## Cross-Section Communication

### Global State Management
```javascript
// Shared state through StoreManager
class GlobalStateManager {
  async setSharedState(key, value) {
    await window.storeAPI.writeJSON(`shared/${key}`, value);
  }

  async getSharedState(key) {
    try {
      return await window.storeAPI.readJSON(`shared/${key}`);
    } catch (error) {
      return null;
    }
  }
}
```

### Inter-Section Messaging
```javascript
// Message passing through StoreManager
class SectionMessenger {
  async sendMessage(toSection, message) {
    const messageId = `msg_${Date.now()}_${Math.random()}`;
    await window.storeAPI.writeJSON(`messages/${messageId}`, {
      toSection,
      message,
      timestamp: new Date().toISOString()
    });
  }

  async getMessages(forSection) {
    const messageFiles = await window.storeAPI.list('messages');
    const messages = [];

    for (const file of messageFiles) {
      const message = await window.storeAPI.readJSON(`messages/${file.name}`);
      if (message.toSection === forSection) {
        messages.push(message);
      }
    }

    return messages;
  }
}
```

## Testing Section Navigation

### Unit Testing Section Managers
```javascript
describe('SectionManager', () => {
  let sectionManager;

  beforeEach(() => {
    sectionManager = new SectionManager();
  });

  test('navigateTo validates section existence', async () => {
    // Mock IPC calls
    window.sectionAPI = {
      sectionExists: jest.fn().mockResolvedValue(true),
      switchToSection: jest.fn().mockResolvedValue(true)
    };

    const result = await sectionManager.navigateTo('test-section');
    expect(window.sectionAPI.sectionExists).toHaveBeenCalledWith('test-section');
    expect(window.sectionAPI.switchToSection).toHaveBeenCalledWith('test-section');
    expect(result).toBe(true);
  });

  test('navigateTo fails for non-existent sections', async () => {
    window.sectionAPI = {
      sectionExists: jest.fn().mockResolvedValue(false)
    };

    const result = await sectionManager.navigateTo('nonexistent');
    expect(result).toBe(false);
  });
});
```

### Integration Testing
```javascript
describe('Section Navigation Integration', () => {
  test('section switching updates current section', async () => {
    // Mock successful section switch
    window.sectionAPI = {
      switchToSection: jest.fn().mockResolvedValue(true),
      getCurrentSection: jest.fn().mockResolvedValue('new-section')
    };

    const success = await sectionManager.switchToSection('new-section');
    expect(success).toBe(true);

    const current = await sectionManager.getCurrentSection();
    expect(current).toBe('new-section');
  });

  test('section listing works correctly', async () => {
    const mockSections = [
      { name: 'main', hasIndexHtml: true },
      { name: 'settings', hasIndexHtml: true }
    ];

    window.sectionAPI = {
      listSections: jest.fn().mockResolvedValue(mockSections)
    };

    const sections = await sectionManager.listSections();
    expect(sections).toEqual(mockSections);
  });
});
```

## Best Practices

### Section Design
- **Single Responsibility**: Each section handles one major feature area
- **Self-Contained**: Minimize dependencies between sections
- **Consistent Structure**: Follow established directory and file patterns
- **Error Boundaries**: Handle errors gracefully within sections

### Navigation Design
- **Validation**: Always validate navigation targets
- **User Feedback**: Provide loading states and error messages
- **State Preservation**: Save/restore section-specific state as needed
- **Fallback Handling**: Provide fallback navigation options

### Development Practices
- **Modular Code**: Keep section code well-organized
- **Testing**: Test navigation logic and section initialization
- **Documentation**: Document section purposes and navigation flows
- **Performance**: Optimize section loading and resource usage

### Architecture Guidelines
- **Clear Separation**: Backend handles loading, frontend handles coordination
- **Consistent APIs**: Use uniform navigation patterns
- **Error Recovery**: Implement robust error handling and recovery
- **Scalability**: Design for easy addition of new sections

## Troubleshooting

### Common Issues

#### Section Not Loading
```javascript
// Check section exists
const exists = await window.sectionAPI.sectionExists('section-name');
console.log('Section exists:', exists);

// Check file structure
const sections = await window.sectionAPI.listSections();
console.log('Available sections:', sections);
```

#### Navigation Failures
```javascript
// Enable detailed logging
console.log('Attempting navigation...');
const success = await sectionManager.navigateTo('target-section');
console.log('Navigation result:', success);

// Check for IPC errors
try {
  const result = await window.sectionAPI.switchToSection('target-section');
} catch (error) {
  console.error('IPC Error:', error);
}
```

#### State Synchronization Issues
```javascript
// Verify current section
const backendSection = await window.sectionAPI.getCurrentSection();
const frontendSection = sectionManager.currentSection;
console.log('Backend section:', backendSection);
console.log('Frontend section:', frontendSection);
```

### Debug Tools
```javascript
class SectionDebugger {
  async logSectionState() {
    const currentSection = await window.sectionAPI.getCurrentSection();
    const availableSections = await window.sectionAPI.listSections();

    console.group('Section Debug Info');
    console.log('Current Section:', currentSection);
    console.log('Available Sections:', availableSections);
    console.log('Frontend Manager State:', sectionManager.currentSection);
    console.groupEnd();
  }

  async validateSectionIntegrity(sectionName) {
    const exists = await window.sectionAPI.sectionExists(sectionName);
    if (!exists) {
      console.error(`Section '${sectionName}' does not exist or is invalid`);
      return false;
    }

    console.log(`Section '${sectionName}' is valid`);
    return true;
  }
}
```

This comprehensive Section Manager system provides robust section coordination, enabling dynamic UI switching while maintaining clear separation between backend loading logic and frontend navigation coordination.

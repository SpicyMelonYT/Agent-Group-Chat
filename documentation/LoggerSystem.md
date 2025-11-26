# Logger System Documentation

## Overview
The Logger system is a sophisticated, tag-based logging framework designed for complex application debugging and development. It provides advanced filtering capabilities, colored console output, source code location tracking, and a flexible tag pattern system that enables developers to control exactly which log messages are displayed based on customizable boolean logic expressions.

## Logging Philosophy

### Comprehensive Development Logging
The core philosophy of this logging system is to **log extensively during development and never remove logs**. Instead of adding and removing console.log statements, developers should:

1. **Add comprehensive logging** throughout the codebase during development
2. **Use strategic tagging** to categorize messages for easy filtering
3. **Filter visibility** using tag patterns instead of removing code
4. **Maintain permanent logging** that can be activated as needed for future debugging

### Why Not Native Console Logging?
While JavaScript provides `console.log()`, `console.error()`, etc., this custom logger offers several advantages:

- **Tag-based filtering** with boolean logic expressions
- **Contextual tag display** showing only relevant tags when filtered
- **Colored output** with customizable styling
- **Source location tracking** for precise debugging
- **Pattern matching** that works across the entire application
- **Browser dev tools integration** with additional filtering capabilities

### Development Workflow
```javascript
// During development - add extensive logging
logger.log({ tags: "auth|login|debug" }, "Login attempt for user:", username);
logger.log({ tags: "store|data|load" }, "Loading data from file:", filePath);
logger.log({ tags: "ui|render|component" }, "Rendering component:", componentName);

// When focusing on authentication debugging
logger.setTagPattern("auth"); // Only shows auth-related messages

// When debugging data operations
logger.setTagPattern("store & !test"); // Store messages but not test data

// When working on UI rendering
logger.setTagPattern("ui | render"); // UI and rendering messages

// Back to seeing everything
logger.setTagPattern(null); // Clear filter, show all messages
```

### Tag Naming Strategy
Tags should be named to enable effective filtering across development scenarios:

- **Component-based**: `store`, `auth`, `ui`, `network`, `manager`
- **Action-based**: `load`, `save`, `render`, `init`, `destroy`
- **Context-based**: `debug`, `trace`, `error`, `user-action`, `system`
- **Feature-based**: `login`, `chat`, `settings`, `profile`

This naming strategy allows patterns like:
- `"auth & login"` - Authentication login flow
- `"store & (load | save)"` - Data persistence operations
- `"ui & render & !debug"` - UI rendering without debug messages
- `"manager & init"` - Manager initialization across the app

## Key Terms and Concepts

### Tag-Based Logging
- **Tags**: String identifiers that categorize log messages (e.g., "manager", "section", "error")
- **Tag Patterns**: Boolean expressions for filtering log messages
- **Tag Filtering**: Dynamic control over which messages are displayed
- **Tag Display**: Contextual tag labels that show only relevant tags when filtered

### Pattern Language
- **Boolean Operations**: AND (`&`, `*`), OR (`|`, `+`), NOT (`!`)
- **Parentheses**: Grouping for complex expressions
- **Tag Matching**: Individual tags or combinations
- **Expression Evaluation**: Runtime compilation to efficient evaluators

### Console Enhancement
- **Colored Output**: CSS-styled console messages in browsers
- **Source Location**: File path and line number inclusion
- **Stack Trace Parsing**: Automatic caller information extraction
- **Visual Formatting**: Structured message layout with styling

## Architecture Overview

### Core Components

#### Logger Class Structure
```javascript
export class Logger {
  constructor() {
    this.tagPattern = null;      // Current filter pattern
    this._tagEvaluator = null;   // Compiled pattern evaluator
  }

  // Public API
  setTagPattern(pattern)         // Set filtering pattern
  log(settings, ...messages)     // Log message
  error(settings, ...messages)   // Error message
  warn(settings, ...messages)    // Warning message

  // Internal methods
  _emit()                        // Message formatting and output
  _shouldLog()                   // Pattern matching
  _normalizeTags()               // Tag parsing and normalization
  _compilePattern()              // Pattern compilation to AST
  _buildEvaluator()              // AST to function conversion
  _getCallerInfo()               // Stack trace parsing
  _getDisplayLabel()             // Filtered tag display
}
```

### Tag Input Formats

#### Object Format (Primary)
```javascript
logger.log({
  tags: "manager|section",       // Tag string with separators
  color: "blue",                 // Single color for all elements
  color1: "red",                 // Bracket/label color
  color2: "blue",                // Message color
  includeSource: true,           // Include file/line info
  sourceDepth: 1,                // Stack trace depth
  sourcePosition: "end"          // Source info position
}, "Message content");
```

#### Legacy Formats (Backward Compatible)
```javascript
// Set input
logger.log(new Set(["manager", "section"]), "Message");

// Array input
logger.log(["manager", "section"], "Message");

// String input
logger.log("manager|section", "Message");
```

## Tag Pattern Language

### Basic Operations

#### AND Operations
- `tag1 & tag2` or `tag1 * tag2`: Both tags must be present
- Example: `"manager & section"` matches messages tagged with both

#### OR Operations
- `tag1 | tag2` or `tag1 + tag2`: Either tag can be present
- Example: `"manager | section"` matches messages tagged with either

#### NOT Operations
- `!tag`: Tag must NOT be present
- Example: `"!error"` matches messages not tagged with "error"

#### Complex Expressions
- `"manager & (section | component)"`: Manager AND (section OR component)
- `"(debug | trace) & !error"`: (Debug OR trace) AND NOT error
- `"manager & section & !test"`: Manager AND section AND NOT test

### Pattern Compilation

#### Tokenization Process
```javascript
_tokenizePattern(pattern) {
  // Converts string to token array
  // Handles operators: +, -, *, &, |, (, ), !
  // Preserves tag names and operators
}
```

#### AST Construction
```javascript
_compilePattern() {
  // Parse tokens into Abstract Syntax Tree
  // Handles operator precedence and parentheses
  // Creates nodes: tag, and, or, andNot, not
}
```

#### Evaluator Generation
```javascript
_buildEvaluator(node) {
  switch(node.type) {
    case "tag": return (tags) => tags.has(node.value);
    case "and": return (tags) => left(tags) && right(tags);
    case "or": return (tags) => left(tags) || right(tags);
    case "andNot": return (tags) => left(tags) && !right(tags);
    case "not": return (tags) => !value(tags);
  }
}
```

## Message Formatting and Output

### Colored Console Output

#### Browser Console Styling
```javascript
// Format string with CSS styling placeholders
const formatString = `%c[source]%c %c[tag]%c message %c[file:line]%c`;

// Corresponding styles array
const styles = [
  'color: grey',      // Source color
  '',                 // Reset
  'color: blue',      // Tag color
  '',                 // Reset
  'color: grey',      // File info color
  ''                  // Reset
];

console.log(formatString, ...styles);
```

#### Color Configuration
- **color**: Single color for all styled elements
- **color1**: Color for brackets and tag labels
- **color2**: Color for message content
- **Default**: White text for all elements

### Source Code Location

#### Stack Trace Parsing
```javascript
_getCallerInfo(depth = 0) {
  // Create error to capture stack trace
  const error = new Error();
  Error.captureStackTrace(error, this._emit);

  // Parse stack trace lines
  const lines = error.stack.split('\n');

  // Filter out logger-related lines
  const externalLines = lines.filter(
    line => !line.includes('Logger._emit') && !line.includes('logger.js')
  );

  // Extract file path and line number
  const targetLine = externalLines[depth] || externalLines[0];
  const match = targetLine.match(/^(.*):(\d+)(?::(\d+))?$/);

  return match ? `(source: ${relativePath}:${line}${column ? `:${column}` : ''})` : null;
}
```

#### Source Position Options
- **"start"**: Source info appears before tag `[file:line] [tag] message`
- **"end"**: Source info appears after message `message [file:line]` (default)

## Tag Display Filtering

### Filtered Tag Labels

#### Problem Solved
When filtering log messages, the displayed tag should only show tags that contributed to the message being shown, not all original tags.

#### Implementation
```javascript
_getDisplayLabel(tags) {
  // If no pattern is active, show all tags
  if (!this._tagEvaluator) {
    return tags.size > 0 ? Array.from(tags).join("|") : "untagged";
  }

  // Test each tag individually against the pattern
  const matchingTags = [];
  for (const tag of tags) {
    const singleTagSet = new Set([tag]);
    if (this._tagEvaluator(singleTagSet)) {
      matchingTags.push(tag);
    }
  }

  // Return matching tags or fall back to all tags for complex patterns
  return matchingTags.length > 0 ? matchingTags.join("|") : Array.from(tags).join("|");
}
```

#### Example Behavior
```javascript
// Original message tagged: "main|test|debug"
// Pattern set to: "test"

// Before filtering: [main|test|debug] Message
// After filtering:  [test] Message

// Pattern set to: "test|debug"
// After filtering:  [test|debug] Message
```

## Usage Patterns

### Development Workflow

#### Setting Global Filters
```javascript
// Global logger instance
import { Logger } from './core/logger.js';
const logger = new Logger();
window.logger = logger;

// Set pattern to only show manager-related messages
logger.setTagPattern("manager");

// Clear pattern to show all messages
logger.setTagPattern(null);
```

#### Section-Specific Logging
```javascript
export class MainSection extends Section {
  constructor() {
    super();
    // Set section-specific logging
    this.logger.setTagPattern("main");
  }

  async init() {
    this.logger.log({
      tags: "section|init",
      color: "green",
      includeSource: true
    }, "Main section initialized");
  }
}
```

### Advanced Filtering Examples

#### Component Debugging
```javascript
// Only show messages from specific components
logger.setTagPattern("storeAPI | sectionAPI");

// Show all except errors
logger.setTagPattern("!error");

// Complex filtering: managers but not tests
logger.setTagPattern("manager & !test");

// Multiple component types
logger.setTagPattern("(storeAPI | windowAPI | sectionAPI) & !test");
```

#### Development vs Production
```javascript
if (process.env.NODE_ENV === 'development') {
  logger.setTagPattern("debug | trace | manager");
} else {
  logger.setTagPattern("!debug & !trace"); // Suppress debug messages
}
```

## Message Examples

### Basic Logging
```javascript
// Simple tagged message
logger.log("manager", "Manager initialized");

// Colored message with source
logger.log({
  tags: "store",
  color: "blue",
  includeSource: true
}, "Data loaded successfully");

// Error with multiple tags
logger.error({
  tags: "store|error",
  color1: "red",
  color2: "orange"
}, "Failed to save data:", error);
```

### Pattern-Based Filtering
```javascript
// Log various messages
logger.log({ tags: "manager|init" }, "Manager starting");
logger.log({ tags: "store|data" }, "Loading data");
logger.log({ tags: "ui|render" }, "Rendering component");
logger.log({ tags: "manager|error" }, "Manager failed");

// Filter to only show manager messages
logger.setTagPattern("manager");

// Output will show:
// [manager] Manager starting
// [manager] Manager failed

// Filter to show data operations but not errors
logger.setTagPattern("(store | ui) & !error");

// Output will show:
// [store] Loading data
// [ui] Rendering component
```

## Integration Points

### Section Integration
```javascript
// frontend/sections/main/index.js
import { Logger } from "../../core/logger.js";

export class MainSection extends Section {
  constructor() {
    super();
    this.logger = new Logger();
    window.logger = this.logger; // Global access

    // Section-specific filtering
    this.logger.setTagPattern("main");
  }
}
```

### Manager Integration
```javascript
// frontend/managers/store-manager.js
export class StoreManager extends Manager {
  async init() {
    this.logger.log({
      tags: "manager|store|init",
      color: "green"
    }, "StoreManager initialized");
  }

  async loadData() {
    try {
      const data = await this.loadFromFile();
      this.logger.log({
        tags: "store|data",
        color: "blue"
      }, "Data loaded:", data.length, "items");
      return data;
    } catch (error) {
      this.logger.error({
        tags: "store|error",
        color1: "red",
        color2: "orange"
      }, "Failed to load data:", error);
      throw error;
    }
  }
}
```

## Performance Considerations

### Pattern Compilation
- **One-time Cost**: Patterns compiled once when set
- **Efficient Evaluation**: AST converted to optimized functions
- **Memoization**: Evaluator functions cached for reuse

### Message Filtering
- **Fast Rejection**: Non-matching messages filtered early
- **Minimal Overhead**: Tag checking is lightweight
- **Stack Trace Impact**: Source location parsing only when requested

### Memory Management
- **Reference Cleanup**: No persistent references to logged objects
- **Stack Trace Limits**: Controlled depth to prevent large strings
- **Pattern Caching**: Compiled patterns reused across messages

## Error Handling and Validation

### Pattern Validation
```javascript
setTagPattern(pattern) {
  try {
    if (!pattern) {
      this.tagPattern = null;
      this._tagEvaluator = null;
      return;
    }

    const normalized = String(pattern).trim();
    this.tagPattern = normalized;
    this._tagEvaluator = this._compilePattern(normalized);
  } catch (error) {
    console.error('Invalid tag pattern:', pattern, error);
    // Keep previous pattern on error
  }
}
```

### Input Validation
```javascript
_normalizeTags(tagInput) {
  // Handle null/undefined/invalid inputs
  if (settings === null || typeof settings !== 'object') {
    console.warn('[Logger] Invalid settings, using defaults');
    return { /* default values */ };
  }

  // Process various input formats safely
  // ... validation and normalization logic
}
```

### Stack Trace Safety
```javascript
_getCallerInfo(depth = 0) {
  try {
    // Safe stack trace parsing with fallbacks
    const error = new Error();
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(error, this._emit);
    }

    // Graceful degradation if parsing fails
    return this._parseStackTrace(error.stack) || null;
  } catch (error) {
    return null; // Silent failure for source info
  }
}
```

## Browser Compatibility

### Console API Support
- **CSS Styling**: Modern browsers support `%c` formatting
- **Fallback**: Graceful degradation to plain text in older browsers
- **Color Support**: CSS color values supported across browsers

### Stack Trace Support
- **V8 Engines**: Chrome, Edge, Node.js support `Error.captureStackTrace`
- **Firefox**: Stack trace parsing works with different format
- **Safari**: Limited stack trace support, graceful fallback

### ES6+ Features
- **Arrow Functions**: Used throughout for concise syntax
- **Template Literals**: String interpolation in formatting
- **Destructuring**: Object property extraction
- **Sets**: Efficient tag storage and lookup

## Testing and Debugging

### Pattern Testing
```javascript
describe('Logger Pattern Matching', () => {
  test('AND operations work correctly', () => {
    logger.setTagPattern('manager & section');
    expect(logger._shouldLog(new Set(['manager', 'section']))).toBe(true);
    expect(logger._shouldLog(new Set(['manager']))).toBe(false);
  });

  test('OR operations work correctly', () => {
    logger.setTagPattern('manager | section');
    expect(logger._shouldLog(new Set(['manager']))).toBe(true);
    expect(logger._shouldLog(new Set(['section']))).toBe(true);
    expect(logger._shouldLog(new Set(['other']))).toBe(false);
  });
});
```

### Display Label Testing
```javascript
describe('Tag Display Filtering', () => {
  test('shows filtered tags only', () => {
    logger.setTagPattern('test');
    const tags = new Set(['main', 'test', 'debug']);
    const displayLabel = logger._getDisplayLabel(tags);
    expect(displayLabel).toBe('test');
  });

  test('shows all tags when no filter', () => {
    logger.setTagPattern(null);
    const tags = new Set(['main', 'test']);
    const displayLabel = logger._getDisplayLabel(tags);
    expect(displayLabel).toBe('main|test');
  });
});
```

## Best Practices

### Logging Philosophy Guidelines
- **Log Extensively**: Add comprehensive logging during development - never remove it
- **Filter, Don't Remove**: Use tag patterns to control visibility instead of commenting out logs
- **Permanent Logging**: Maintain all development logs for future debugging needs
- **Strategic Tagging**: Design tag names that enable powerful filtering combinations

### Tag Naming Conventions
- **Component-based**: `store`, `auth`, `ui`, `network`, `manager`, `section`
- **Action-based**: `load`, `save`, `render`, `init`, `destroy`, `create`, `update`
- **Context-based**: `debug`, `trace`, `error`, `user-action`, `system`, `lifecycle`
- **Feature-based**: `login`, `chat`, `settings`, `profile`, `navigation`
- **Consistent**: Use the same tag names across similar functionality
- **Composable**: Design tags that work well in boolean combinations

### Tag Naming Strategy Examples
```javascript
// Authentication features
logger.log({ tags: "auth|login" }, "User login attempt");
logger.log({ tags: "auth|logout" }, "User logout");
logger.log({ tags: "auth|token|refresh" }, "Token refresh");

// Data operations
logger.log({ tags: "store|data|load" }, "Loading user data");
logger.log({ tags: "store|data|save" }, "Saving user preferences");
logger.log({ tags: "store|archive|create" }, "Creating new data archive");

// UI interactions
logger.log({ tags: "ui|render|component" }, "Rendering chat component");
logger.log({ tags: "ui|user-action|click" }, "User clicked button");
logger.log({ tags: "ui|navigation|section" }, "Switching to chat section");

// Manager lifecycle
logger.log({ tags: "manager|init|lifecycle" }, "StoreManager initializing");
logger.log({ tags: "manager|error|handling" }, "Manager caught error");
logger.log({ tags: "manager|cleanup|destroy" }, "Manager cleaning up");
```

### Pattern Usage Guidelines
- **Development**: Use broad patterns to see everything (`debug | trace | manager`)
- **Feature Focus**: Isolate specific features (`auth & login & !debug`)
- **Error Hunting**: Focus on errors (`error & !test`)
- **Performance**: Avoid complex patterns in hot code paths
- **Browser Filtering**: Combine with browser dev tools filtering for maximum control

### Development Workflow Patterns
```javascript
// Starting new feature development
logger.setTagPattern("new-feature | debug"); // See new code + debug info

// Debugging authentication issues
logger.setTagPattern("auth & !test"); // Auth flow without test noise

// UI development
logger.setTagPattern("ui & (render | user-action)"); // UI interactions

// Performance investigation
logger.setTagPattern("manager & (init | load)"); // System initialization

// Error analysis
logger.setTagPattern("error & !network"); // App errors, not network issues

// Clean production-like view
logger.setTagPattern("!debug & !trace"); // Hide development noise
```

### Message Content Guidelines
- **Contextual**: Include relevant IDs, names, and state information
- **Structured**: Use consistent message formats across similar operations
- **Serializable**: Ensure logged objects can be JSON-serialized
- **Privacy**: Never log passwords, tokens, or sensitive user data
- **Performance**: Avoid logging large objects or arrays in frequently called code

### Integration Best Practices
- **Global Access**: Single logger instance accessible via `window.logger`
- **Section-Specific**: Each section can set its own tag patterns for focused debugging
- **Manager Integration**: Managers should log their lifecycle and operations
- **Error Context**: Include stack traces and relevant state in error messages
- **Source Information**: Enable during development for precise debugging

### Browser Dev Tools Integration
Combine logger filtering with browser console filtering:

```javascript
// Logger pattern filtering
logger.setTagPattern("auth & login");

// Browser console filtering (additional level)
console.log("🔍 Focus: Auth login flow");
// Use browser's filter box for text search
// Use browser's console levels (log, warn, error)
```

### Maintenance Guidelines
- **Regular Review**: Periodically review and update tag naming consistency
- **Pattern Documentation**: Document commonly used filtering patterns
- **Performance Monitoring**: Watch for logging overhead in production scenarios
- **Team Standards**: Establish team-wide tag naming conventions

## Future Extensions

### Backend Logger Integration
- **Similar API**: Backend logger with same tag pattern system
- **IPC Communication**: Backend log messages forwarded to frontend
- **Unified Filtering**: Single pattern controls both frontend and backend logs
- **Persistent Storage**: Backend logs saved to files with filtering

### Advanced Features
- **Log Levels**: Hierarchical severity levels (trace, debug, info, warn, error)
- **Structured Logging**: JSON-formatted logs with metadata
- **Remote Logging**: Send logs to external services
- **Performance Monitoring**: Built-in timing and performance measurements

### UI Integration
- **Log Viewer**: In-app log console with real-time filtering
- **Log Export**: Save filtered logs to files
- **Search Functionality**: Full-text search within logs
- **Log Levels UI**: Toggle visibility of different log levels

This comprehensive logger system provides powerful debugging capabilities while maintaining clean, efficient code and excellent developer experience.

# Development Environment Documentation

## Overview
This document outlines the project file structure, development workflow, and important guidelines for AI assistants working on this project. It distinguishes between committable repository files and development environment files, and provides clear rules about terminal command usage.

## Project File Structure

### Repository Structure (Committable Files)
All files within the `agent-group-chat/` folder are part of the repository and should be committed:

```
agent-group-chat/
├── backend/                 # Main process code
│   ├── main.js             # Application entry point
│   ├── app.js              # Main application class
│   ├── core/               # Core backend classes
│   ├── managers/           # Backend managers
│   ├── preload.cjs         # IPC preload script
│   └── watch.js            # Development watcher
├── frontend/               # Renderer process code
│   ├── sections/           # UI sections
│   ├── managers/           # Frontend managers
│   ├── components/         # Reusable components
│   └── core/               # Core frontend classes
├── documentation/          # Project documentation
│   ├── *.md               # Documentation files
├── node_modules/           # Dependencies (auto-generated)
├── package-lock.json       # Dependency lock file
└── package.json           # Project configuration
```

### Development Environment Files (Not Committable)
Files outside the `agent-group-chat/` folder are development environment files:

```
Project Root/
├── agent-group-chat/        # Repository folder (committable)
├── install.bat             # Installation script (development only)
├── run-dev.bat            # Development startup script (development only)
├── start_dev.bat          # Alternative startup script
├── terminal.bat           # Terminal setup script
└── workspace.code-workspace # VS Code workspace configuration
```

## Development Workflow

### Application Startup
The application uses a specific startup process that should always be initiated manually by the developer:

1. **Initial Setup**: Run `install.bat` to install dependencies
2. **Development Start**: Run `run-dev.bat` to start the application in development mode
3. **Hot Reloading**: The application automatically reloads when files change

### Hot Reloading System
- **Automatic**: Changes to frontend files trigger immediate browser refresh
- **Backend**: Changes to backend files automatically restart the Electron process
- **No Manual Restart**: Never restart the application manually during development
- **Continuous Development**: Keep the application running while making changes

## AI Assistant Guidelines

### Terminal Command Restrictions

#### ❌ NEVER Execute These Commands
AI assistants must **never** execute terminal commands for:

- **Dependency Installation**
  ```bash
  npm install
  npm ci
  yarn install
  ```

- **Application Startup**
  ```bash
  npm start
  npm run dev
  electron .
  node backend/main.js
  ```

- **Build Commands**
  ```bash
  npm run build
  npm run dist
  electron-builder
  ```

#### ✅ Safe Terminal Operations
AI assistants **may** execute these types of commands:

- **File Operations**
  ```bash
  ls, dir, cat, type  # Reading files and directories
  find, grep, where   # Searching for files
  ```

- **Code Quality**
  ```bash
  npm run lint       # If linting scripts exist
  npm run test       # If test scripts exist
  ```

- **Development Tools**
  ```bash
  git status         # Check repository status
  git diff           # Show changes
  ```

### Package.json Modification Protocol

#### When Dependencies Need to Change
If code changes require new dependencies to be added to `package.json`:

1. **AI Action**: Update the `package.json` file with the new dependency
2. **AI Communication**: Inform the developer that dependencies need to be installed
3. **Developer Action**: The developer manually runs the installation

#### Communication Template
```javascript
// After modifying package.json
console.log("📦 Dependency added to package.json");
console.log("Please run the install script to update dependencies");
console.log("Then restart the application using run-dev.bat");
```

### Development Session Guidelines

#### During Active Development
- **Application Running**: Assume the application is already running with hot reloading
- **Immediate Feedback**: Changes are visible immediately without restart
- **Error Handling**: UI breaks are acceptable during development - inform developer of issues
- **Continuous Workflow**: Make changes while application runs

#### When Application Needs Restart
In rare cases where changes break the application completely:

- **Inform Developer**: "The changes may have broken the application. Please restart using run-dev.bat"
- **Don't Auto-Restart**: Never attempt to restart the application
- **Wait for Confirmation**: Let developer decide when to restart

## File Management Rules

### Repository Files (agent-group-chat/)
- **Always Committable**: All files in this folder should be committed to version control
- **Code Changes**: Make all code modifications within this structure
- **Documentation**: Update documentation files as needed
- **Configuration**: Modify package.json and other config files appropriately

### Development Files (Project Root)
- **Not Committable**: These are environment-specific and shouldn't be in repository
- **Don't Modify**: AI should not modify .bat files or workspace configurations
- **Reference Only**: May reference these files in documentation or communication
- **Manual Execution**: These are always executed manually by the developer

## Error Handling and Recovery

### Development Errors
- **Expected**: UI breaks and errors are normal during development
- **Communication**: Inform developer of issues without panic
- **Recovery**: Let developer handle restarts and fixes
- **Documentation**: Errors may indicate need for documentation updates

### Terminal Command Violations
- **Prevention**: Never execute restricted commands
- **Communication**: If functionality requires restricted commands, inform developer
- **Alternatives**: Suggest manual execution or provide instructions

## Communication Protocols

### Dependency Changes
```javascript
// When adding dependencies
logger.log({ tags: "system|deps" }, "Added dependency:", packageName);
console.log("🔧 Please run install.bat to install new dependencies");
```

### Application Issues
```javascript
// When changes break the app
logger.log({ tags: "system|error" }, "Changes may have broken the application");
console.log("⚠️  Please restart the application using run-dev.bat");
```

### Development Status
```javascript
// During development workflow
logger.log({ tags: "system|workflow" }, "Changes applied with hot reloading");
console.log("🔄 Changes should be visible immediately");
```

## Best Practices

### AI Behavior Guidelines
- **Manual Triggers Only**: Respect that installation and startup are manual processes
- **Inform, Don't Execute**: Tell developer what needs to be done, don't do it
- **Continuous Development**: Assume hot reloading is active
- **Error Tolerance**: Development errors are acceptable and expected

### Development Workflow
- **Hot Reloading First**: Always assume hot reloading is working
- **Manual Intervention**: Only request manual actions when absolutely necessary
- **Clear Communication**: Be explicit about what the developer needs to do
- **Status Updates**: Keep developer informed of development progress

### File Organization
- **Repository Focus**: Work primarily within the committable codebase
- **Documentation Updates**: Update docs when patterns or architecture change
- **Code Standards**: Maintain existing code organization and naming conventions

## Troubleshooting

### Hot Reloading Issues
- **Not Working**: Inform developer that hot reloading may not be functioning
- **Restart Needed**: Request manual restart via run-dev.bat
- **File Watching**: Check if backend watch.js is running properly

### Dependency Issues
- **Missing Dependencies**: After package.json changes, request manual installation
- **Version Conflicts**: Let developer handle dependency resolution
- **Installation Failures**: Don't attempt to fix installation issues

### Development Environment
- **Application Not Running**: Request manual startup via run-dev.bat
- **Port Conflicts**: Let developer handle environment issues
- **System Resources**: Don't attempt to manage system-level issues

This development environment structure ensures clean separation between repository code and development tooling, while providing clear guidelines for AI assistants to work effectively within the established workflow.

#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import chokidar from 'chokidar';

// Create require function for ESM
const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class HotReloadWatcher {
  constructor() {
    this.electronProcess = null;
    this.isRestarting = false;
    this.startTime = Date.now();

    // Get electron executable path
    this.electronPath = require('electron');

    // File patterns to watch
    this.backendWatchPatterns = [
      'backend/**/*.js',
      'backend/**/*.json',
      '!backend/main.js', // Exclude main.js as it can crash the app
      '!backend/preload.cjs',
      '!backend/watch.js'
    ];

    this.frontendWatchPatterns = [
      'frontend/**/*',
      '!frontend/**/*.log'
    ];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  startElectron() {
    if (this.electronProcess) {
      this.log('Stopping existing Electron process...');
      this.electronProcess.kill('SIGTERM');

      // Give it a moment to shut down
      setTimeout(() => this.spawnElectron(), 1000);
    } else {
      this.spawnElectron();
    }
  }

  spawnElectron() {
    this.log('Starting Electron process...');

    // Spawn Electron directly with the app directory
    const args = ['.', '--dev', '--trace-warnings'];
    const env = {
      ...process.env,
      NODE_ENV: 'development',
      ELECTRON_DISABLE_SECURITY_WARNINGS: '1'
    };

    this.electronProcess = spawn(this.electronPath, args, {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      env
    });

    this.electronProcess.on('close', (code) => {
      if (!this.isRestarting) {
        this.log(`Electron process exited with code ${code}`, code === 0 ? 'success' : 'error');
      }
    });

    this.electronProcess.on('error', (error) => {
      this.log(`Failed to start Electron process: ${error.message}`, 'error');
    });
  }

  triggerFrontendReload() {
    if (this.electronProcess) {
      // Send a signal to the Electron process to reload the window
      // We'll implement this by sending a message through IPC
      try {
        this.electronProcess.kill('SIGUSR1'); // Custom signal for reload
      } catch (error) {
        this.log('Could not trigger frontend reload', 'error');
      }
    }
  }

  setupFileWatchers() {
    this.log('Setting up file watchers...');

    // Watch backend files (restart process)
    const backendWatcher = chokidar.watch(this.backendWatchPatterns, {
      cwd: path.join(__dirname, '..'),
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50
      }
    });

    backendWatcher.on('change', (filePath) => {
      this.log(`Backend file changed: ${filePath}`);
      this.isRestarting = true;
      setTimeout(() => {
        this.startElectron();
        this.isRestarting = false;
      }, 500); // Debounce restarts
    });

    // Watch frontend files (reload window)
    const frontendWatcher = chokidar.watch(this.frontendWatchPatterns, {
      cwd: path.join(__dirname, '..'),
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50
      }
    });

    frontendWatcher.on('change', (filePath) => {
      this.log(`Frontend file changed: ${filePath} - triggering reload`);
      this.triggerFrontendReload();
    });

    this.log('File watchers active!');
    this.log('Backend changes will restart the Electron process');
    this.log('Frontend changes will reload the Electron window');
    this.log('Note: main.js changes are ignored to prevent crashes');
  }

  start() {
    this.log('🚀 Starting Hot Reload Development Server');
    this.log('=====================================');

    // Setup file watchers first
    this.setupFileWatchers();

    // Start Electron
    this.startElectron();

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      this.log('Shutting down...');
      if (this.electronProcess) {
        this.electronProcess.kill('SIGTERM');
      }
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      this.log('Shutting down...');
      if (this.electronProcess) {
        this.electronProcess.kill('SIGTERM');
      }
      process.exit(0);
    });
  }
}

// Handle main.js changes notification
function handleMainJsWarning() {
  console.log('\n⚠️  WARNING: main.js changes are not watched');
  console.log('   This prevents application crashes during development.');
  console.log('   To test main.js changes, manually restart the application.\n');
}

// Start the watcher
const watcher = new HotReloadWatcher();
handleMainJsWarning();
watcher.start();

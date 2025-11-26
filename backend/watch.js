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
    this.isPendingRestart = false; // Flag to prevent multiple restart operations
    this.startTime = Date.now();
    this.restartTimeout = null; // For debouncing multiple file changes

    // Get electron executable path
    this.electronPath = require('electron');

    // File patterns to watch
    this.backendWatchPatterns = [
      'backend/**/*.js',
      'backend/**/*.json',
      '!backend/preload.cjs',
      '!backend/watch.js'
    ];

  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  startElectron() {
    // Prevent multiple restart operations from running simultaneously
    if (this.isPendingRestart) {
      this.log('Restart already pending, skipping...');
      return;
    }

    this.isPendingRestart = true;

    if (this.electronProcess) {
      this.log('Stopping existing Electron process...');
      this.electronProcess.kill('SIGTERM');

      // Give it a moment to shut down
      setTimeout(() => {
        this.spawnElectron();
      }, 1000);
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

    // Clear the pending restart flag now that we've started the new process
    this.isPendingRestart = false;

    this.electronProcess.on('close', (code) => {
      if (!this.isRestarting) {
        this.log(`Electron process exited with code ${code}`, code === 0 ? 'success' : 'error');
      }
    });

    this.electronProcess.on('error', (error) => {
      this.log(`Failed to start Electron process: ${error.message}`, 'error');
    });
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

      // Clear any existing restart timeout
      if (this.restartTimeout) {
        clearTimeout(this.restartTimeout);
      }

      // Set a new debounced restart timeout
      this.restartTimeout = setTimeout(() => {
        this.isRestarting = true;
        this.startElectron();
        this.isRestarting = false;
        this.restartTimeout = null;
      }, 100); // 100ms debounce delay
    });

    this.log('File watchers active!');
    this.log('Backend changes will restart the Electron process (debounced 100ms)');
    this.log('Frontend changes will reload the Electron window (via electron-reload)');
    this.log('All backend JS files including main.js are watched');
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
      if (this.restartTimeout) {
        clearTimeout(this.restartTimeout);
      }
      this.isPendingRestart = false; // Reset flag on shutdown
      if (this.electronProcess) {
        this.electronProcess.kill('SIGTERM');
      }
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      this.log('Shutting down...');
      if (this.restartTimeout) {
        clearTimeout(this.restartTimeout);
      }
      this.isPendingRestart = false; // Reset flag on shutdown
      if (this.electronProcess) {
        this.electronProcess.kill('SIGTERM');
      }
      process.exit(0);
    });
  }
}

// Handle development notifications
function handleDevNotifications() {
  console.log('\nℹ️  Development mode: All backend files are watched for hot reloading');
  console.log('   Changes to main.js will restart the Electron process.\n');
}

// Start the watcher
const watcher = new HotReloadWatcher();
handleDevNotifications();
watcher.start();

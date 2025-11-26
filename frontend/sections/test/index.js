// Test Section JavaScript
import { Logger } from '../../core/logger.js';
import { sectionManager } from '../../managers/section-manager.js';

// Initialize logger for this section
const logger = new Logger();

// DOM elements
let currentSectionSpan;
let infoDisplay;

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async () => {
    logger.log({ tag: 'test-section', color: 'blue' }, 'Test section loaded!');

    // Get DOM elements
    currentSectionSpan = document.getElementById('current-section');
    infoDisplay = document.getElementById('info-display');

    // Update current section display
    await updateCurrentSection();

    logger.log({ tag: 'test-section', color: 'green' }, 'Test section initialization complete');
});

// Global functions for HTML buttons
window.goBackToMain = async function() {
    logger.log({ tag: 'navigation', color: 'orange' }, 'Navigating back to main section...');

    const success = await sectionManager.navigateTo('main');
    if (success) {
        logger.log({ tag: 'navigation', color: 'green' }, 'Successfully navigated to main');
    } else {
        logger.error({ tag: 'navigation', color: 'red' }, 'Failed to navigate to main');
    }
};

window.showSectionInfo = function() {
    const isVisible = infoDisplay.style.display !== 'none';
    infoDisplay.style.display = isVisible ? 'none' : 'block';

    logger.log({ tag: 'ui', color: 'purple' }, `Section info ${isVisible ? 'hidden' : 'shown'}`);
};

// Helper function to update current section display
async function updateCurrentSection() {
    try {
        const currentSection = await sectionManager.getCurrentSection();
        if (currentSectionSpan) {
            currentSectionSpan.textContent = currentSection;
        }
    } catch (error) {
        logger.error({ tag: 'test-section', color: 'red' }, 'Failed to get current section:', error);
    }
}

// Test some section manager functions
async function runSectionTests() {
    logger.log({ tag: 'test', color: 'cyan' }, 'Running section manager tests...');

    try {
        // Test listing sections
        const sections = await sectionManager.listSections();
        logger.log({ tag: 'test', color: 'cyan' }, 'Available sections:', sections);

        // Test section existence
        const mainExists = await sectionManager.sectionExists('main');
        const testExists = await sectionManager.sectionExists('test');
        const nonexistentExists = await sectionManager.sectionExists('nonexistent');

        logger.log({ tag: 'test', color: 'cyan' }, 'Section existence checks:', {
            main: mainExists,
            test: testExists,
            nonexistent: nonexistentExists
        });

    } catch (error) {
        logger.error({ tag: 'test', color: 'red' }, 'Section tests failed:', error);
    }
}

// Run tests after a short delay
setTimeout(runSectionTests, 1000);

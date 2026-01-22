// Main entry point - imports and initializes all modules

import { injectBadgeStyles } from "./render.js";
import { initAdminElements, setupAdminEvents } from "./admin.js";

import { renderStartMenu, initMenuElements } from "./menu.js";

// Inject badge styles
injectBadgeStyles();

// Initialize app
// const loadedQuiz = loadQuiz();
// initializeQuiz(loadedQuiz);

// Initialize admin UI & Menu after DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        initAdminElements();
        setupAdminEvents();
        initMenuElements(); // Get menu refs
        renderStartMenu();  // Show menu
    });
} else {
    initAdminElements();
    setupAdminEvents();
    initMenuElements();
    renderStartMenu();
}

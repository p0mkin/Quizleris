// Main entry point - imports and initializes all modules

import { injectBadgeStyles } from "./render.js";
import { setupAdmin, toggleAdminMode } from "./admin.js";
import { renderStartMenu, setupMenu } from "./menu.js";
import { setupDashboard, renderDashboard } from "./dashboard.js";

function initApp() {
    try {
        // Inject badge styles first
        injectBadgeStyles();
        // Callbacks
        const onHome = () => renderStartMenu();
        const onDashboard = () => renderDashboard();
        const onAdmin = () => toggleAdminMode();

        // 1. Setup Dashboard (needs onHome)
        setupDashboard({ onHome });

        // 2. Setup Menu (needs onAdmin, onDashboard)
        setupMenu({ onAdmin, onDashboard });

        // 3. Setup Admin (needs onHome, onDashboard)
        setupAdmin({ onHome, onDashboard });

        // 4. Show Initial Screen
        renderStartMenu();

    } catch (e) {
        alert("Application Init Error: " + e);
        console.error(e);
    }
}

// Initialize admin UI & Menu after DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}

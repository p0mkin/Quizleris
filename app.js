// Main entry point - imports and initializes all modules
import { setupAdmin, toggleAdminMode, refreshAdminUI } from "./quiz-editor.js";
import { renderStartMenu, setupMenu, renderStudentJoin, isStudentViewActive, handleStudentClick } from "./menu.js";
import { setupDashboard, renderDashboard } from "./dashboard.js";
import { loadQuiz } from "./storage.js";
import { initLanguage, setLanguage, getLanguage, updatePageLanguage } from "./lang.js";
import { renderTopicsPage } from "./topics.js";
/**
 * The main application bootstrap function.
 * Orchestrates the initialization of all modules, sets up global callbacks,
 * handles initial routing via URL parameters, and wires up the language switcher.
 */
function initApp() {
    try {
        // Initialize language system first
        initLanguage();
        // Callbacks
        const onHome = () => renderStartMenu();
        const onAdmin = () => toggleAdminMode();
        // 1. Setup Dashboard (needs onHome)
        setupDashboard({ onHome });
        // 2. Setup Menu (needs onAdmin only)
        setupMenu({ onAdmin });
        // 3. Setup Admin (needs onHome)
        setupAdmin({ onHome });
        // 4. Show Initial Screen or Dashboard if param present
        const params = new URLSearchParams(window.location.search);
        const dashParam = params.get("dashboard");
        const quizParam = params.get("quiz");
        const viewParam = params.get("view");
        const path = window.location.pathname;
        if (dashParam) {
            renderDashboard(dashParam);
        }
        else if (quizParam) {
            const quizData = loadQuiz();
            renderStudentJoin(quizData);
        }
        else if (viewParam === "topics" || path === "/topics" || path.endsWith("/topics")) {
            renderTopicsPage();
        }
        else {
            renderStartMenu();
        }
        // 5. Update page language
        updatePageLanguage();
        // 6. Wire up language toggle
        const langToggle = document.getElementById('lang-toggle');
        const langLabel = document.getElementById('lang-label');
        if (langToggle && langLabel) {
            // Set initial label
            langLabel.textContent = getLanguage().toUpperCase();
            langToggle.addEventListener('click', () => {
                const newLang = getLanguage() === 'lt' ? 'en' : 'lt';
                setLanguage(newLang);
                langLabel.textContent = newLang.toUpperCase();
                // 1. Update static elements
                updatePageLanguage();
                // 2. Re-render current dynamic view to update quiz titles etc
                const currentParams = new URLSearchParams(window.location.search);
                const currentDash = currentParams.get("dashboard");
                const currentQuiz = currentParams.get("quiz");
                if (currentDash) {
                    renderDashboard(currentDash);
                }
                else if (currentQuiz) {
                    renderStudentJoin(loadQuiz());
                }
                else {
                    if (isStudentViewActive()) {
                        handleStudentClick();
                    }
                    else {
                        renderStartMenu();
                    }
                }
                // 3. Refresh Admin UI if active
                try {
                    refreshAdminUI();
                }
                catch (e) {
                    console.error("Admin Refresh Error", e);
                }
            });
        }
    }
    catch (e) {
        alert("Application Init Error: " + e);
        console.error(e);
    }
}
// Initialize admin UI & Menu after DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
}
else {
    initApp();
}
// Global popstate handler for back/forward navigation
window.onpopstate = () => {
    const langToggle = document.getElementById('lang-toggle');
    if (langToggle && langToggle.parentElement) {
        langToggle.parentElement.style.display = "block"; // Reset to visible
    }
    // Simple routing reload
    location.reload();
};

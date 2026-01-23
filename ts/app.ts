// Main entry point - imports and initializes all modules

import { setupAdmin, toggleAdminMode } from "./admin.js";
import { renderStartMenu, setupMenu, renderStudentJoin, isStudentViewActive, handleStudentClick } from "./menu.js";
import { setupDashboard, renderDashboard } from "./dashboard.js";
import { loadQuiz } from "./storage.js";
import { initLanguage, setLanguage, getLanguage, updatePageLanguage } from "./i18n.js";

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

        if (dashParam) {
            renderDashboard(dashParam);
        } else if (quizParam) {
            const quizData = loadQuiz();
            renderStudentJoin(quizData);
        } else {
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
                } else if (currentQuiz) {
                    renderStudentJoin(loadQuiz());
                } else {
                    if (isStudentViewActive()) {
                        handleStudentClick();
                    } else {
                        renderStartMenu();
                    }
                }
            });
        }

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

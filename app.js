import { setupAdmin, toggleAdminMode } from "./admin.js";
import { renderStartMenu, setupMenu, renderStudentJoin, isStudentViewActive, handleStudentClick } from "./menu.js";
import { setupDashboard, renderDashboard } from "./dashboard.js";
import { loadQuiz } from "./storage.js";
import { initLanguage, setLanguage, getLanguage, updatePageLanguage } from "./i18n.js";

function initApp() {
    console.log("Initializing App...");
    try {
        initLanguage();

        const onHome = () => renderStartMenu();
        const onAdmin = () => toggleAdminMode();

        setupDashboard({ onHome });
        setupMenu({ onAdmin });
        setupAdmin({ onHome });

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

        updatePageLanguage();

        const langToggle = document.getElementById('lang-toggle');
        const langLabel = document.getElementById('lang-label');
        if (langToggle && langLabel) {
            langLabel.textContent = getLanguage().toUpperCase();

            langToggle.addEventListener('click', () => {
                const newLang = getLanguage() === 'lt' ? 'en' : 'lt';
                setLanguage(newLang);
                langLabel.textContent = newLang.toUpperCase();

                updatePageLanguage();

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

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}

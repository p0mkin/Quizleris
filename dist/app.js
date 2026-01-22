// Main entry point - imports and initializes all modules
import { loadQuiz } from "./storage.js";
import { initializeQuiz, injectBadgeStyles } from "./render.js";
import { initAdminElements, setupAdminEvents } from "./admin.js";
// Inject badge styles
injectBadgeStyles();
// Initialize app
const loadedQuiz = loadQuiz();
initializeQuiz(loadedQuiz);
// Initialize admin UI after DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        initAdminElements();
        setupAdminEvents();
    });
}
else {
    initAdminElements();
    setupAdminEvents();
}
//# sourceMappingURL=app.js.map
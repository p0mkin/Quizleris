import { getTopicBundles } from "./storage.js";
import { getRequiredElement } from "./dom.js";
import { renderStartMenu } from "./menu.js";
import { initializeQuiz } from "./render.js";
import { t } from "./lang.js";
let startMenu;
let quizHeader;
let quizMain;
export function renderTopicsPage() {
    startMenu = getRequiredElement("start-menu");
    quizHeader = document.querySelector(".quiz-header");
    quizMain = document.querySelector(".quiz-main");

    if (quizHeader) {
        // Only show header if there's actually something to show (like back button when quiz starts)
        // For topics page, hide it to avoid "ugly white space"
        quizHeader.style.display = "none";

        // Ensure logo is always visible on topics page
        const logo = document.getElementById("app-logo");
        if (logo) logo.style.display = "block";
    }

    // Hide welcome/student form
    const welcomeH1 = startMenu.querySelector('h1');
    const welcomeP = startMenu.querySelector('p');
    const menuActions = startMenu.querySelector(".menu-actions");
    const existingForm = startMenu.querySelector(".student-form-container");
    if (welcomeH1)
        welcomeH1.style.display = "none";
    if (welcomeP)
        welcomeP.style.display = "none";
    if (menuActions)
        menuActions.style.display = "none";
    if (existingForm)
        existingForm.style.display = "none";
    let topicsContainer = startMenu.querySelector(".topics-page-container");
    if (topicsContainer) {
        topicsContainer.remove();
    }
    topicsContainer = document.createElement("div");
    topicsContainer.className = "topics-page-container";
    topicsContainer.style.width = "100%";
    topicsContainer.style.maxWidth = "1000px";
    topicsContainer.style.margin = "0 auto";
    topicsContainer.style.padding = "20px";
    const bundles = getTopicBundles();
    const grouped = {
        algebra: bundles.filter(b => b.id.startsWith('algebra')),
        combinatorics: bundles.filter(b => b.id.startsWith('combinatorics'))
    };
    topicsContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;">
            <h1 style="font-size: 2.5rem; margin: 0;">${t('topics.title') || 'English Quiz Topics'}</h1>
            <button id="topics-back-btn" class="btn">${t('admin.backToMenu') || 'Back'}</button>
        </div>
        
        <section style="margin-bottom: 48px;">
            <h2 style="font-size: 1.8rem; border-bottom: 2px solid var(--accent); padding-bottom: 8px; margin-bottom: 24px;">Algebra</h2>
            <div class="bundle-grid">
                ${grouped.algebra.map(b => renderBundleCard(b)).join('')}
            </div>
        </section>

        <section>
            <h2 style="font-size: 1.8rem; border-bottom: 2px solid var(--accent); padding-bottom: 8px; margin-bottom: 24px;">Combinatorics</h2>
            <div class="bundle-grid">
                ${grouped.combinatorics.map(b => renderBundleCard(b)).join('')}
            </div>
        </section>
    `;
    startMenu.appendChild(topicsContainer);
    const langToggle = document.getElementById('lang-toggle');
    if (langToggle && langToggle.parentElement) {
        langToggle.parentElement.style.display = "none";
    }
    // Wire up back button
    document.getElementById("topics-back-btn").onclick = () => {
        window.location.href = "/";
    };
    // Wire up start buttons
    bundles.forEach(b => {
        const btn = document.getElementById(`start-bundle-${b.id}`);
        if (btn) {
            btn.onclick = () => {
                startTopicQuiz(b);
            };
        }
    });
}
function renderBundleCard(bundle) {
    const difficultyColor = bundle.difficulty === 'beginner' ? '#10b981' :
        bundle.difficulty === 'intermediate' ? '#f59e0b' : '#ef4444';
    return `
        <div class="bundle-card">
            <h3 style="margin: 0 0 12px 0; font-size: 1.25rem;">${bundle.title}</h3>
            <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                <span style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: ${difficultyColor}; background: ${difficultyColor}22; padding: 2px 8px; border-radius: 4px;">
                    ${bundle.difficulty}
                </span>
            </div>
            <p style="color: var(--muted); font-size: 0.9rem; margin: 0 0 24px 0;">
                ${bundle.questions.length} questions • ~${bundle.estimatedMinutes} min
            </p>
            <button id="start-bundle-${bundle.id}" class="btn btn-primary" style="margin-top: auto; width: 100%;">Start Quiz</button>
        </div>
    `;
}
function startTopicQuiz(quiz) {
    const name = localStorage.getItem("current_student_name") || "Anonymous";
    startMenu.style.display = "none";
    if (quizHeader)
        quizHeader.style.display = "flex";
    if (quizMain)
        quizMain.style.display = "flex";
    initializeQuiz(quiz);
}

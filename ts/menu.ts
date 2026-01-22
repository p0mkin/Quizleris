import { getRequiredElement } from "./dom.js";
import { toggleAdminMode } from "./admin.js";
import { renderDashboard } from "./dashboard.js";

// DOM Elements
let startMenu: HTMLElement;
let quizHeader: HTMLElement;
let quizMain: HTMLElement;
let studentBtn: HTMLButtonElement;
let adminBtn: HTMLButtonElement;
let dashboardBtn: HTMLButtonElement;

export function initMenuElements(): void {
    startMenu = getRequiredElement("start-menu");
    // These might be hidden, but they exist
    quizHeader = document.querySelector(".quiz-header") as HTMLElement;
    quizMain = document.querySelector(".quiz-main") as HTMLElement;

    studentBtn = getRequiredElement("menu-btn-student") as HTMLButtonElement;
    adminBtn = getRequiredElement("menu-btn-admin") as HTMLButtonElement;
    dashboardBtn = getRequiredElement("menu-btn-dashboard") as HTMLButtonElement;
}

export function renderStartMenu(): void {
    // Ensure elements are ready
    if (!startMenu) initMenuElements();

    // Show menu, hide game
    startMenu.style.display = "flex";
    quizHeader.style.display = "none";
    quizMain.style.display = "none";

    // Wire up buttons (idempotent checks or simple onclick replacement)
    adminBtn.onclick = () => {
        handleAdminClick();
    };

    studentBtn.onclick = () => {
        handleStudentClick();
    };

    dashboardBtn.onclick = () => {
        // Hide menu handled by renderDashboard?
        // dashboard.ts says: "Hide others (handled by caller usually...)"
        // But dashboard.ts renderDashboard() sets dashboardView.style.display = "block".
        // It doesn't hide startMenu.

        startMenu.style.display = "none";
        renderDashboard();
    };
}

function handleAdminClick(): void {
    // For now, just switch to admin mode logic
    // We'll hide the menu and trigger the existing admin toggle
    // But existing admin toggle asks for password if needed.

    // UI Transition
    startMenu.style.display = "none";
    quizHeader.style.display = "flex";
    quizMain.style.display = "flex"; // Admin panel appears within main? No, admin panel is separate.

    // Check index.html: admin-panel is a sibling of quiz-main?
    // <div id="app-root">
    //   <header>...</header>
    //   <main class="quiz-main">...</main>
    //   <section id="admin-panel">...</section>
    // </div>
    // The admin toggle is in the header.
    // If we click "I'm Admin", we probably want to show the header and invoke the toggleAdminMode logic.

    // Make sure admin elements are initialized
    // They are initialized in app.ts, but let's be safe.

    // Trigger the toggle
    toggleAdminMode();
}

// Student form handling
function handleStudentClick(): void {
    // Hide buttons, show student form
    const menuActions = startMenu.querySelector(".menu-actions") as HTMLElement;
    menuActions.style.display = "none";

    let formContainer = startMenu.querySelector(".student-form-container");
    if (!formContainer) {
        formContainer = document.createElement("div");
        formContainer.className = "student-form-container";
        formContainer.innerHTML = `
            <div>
                <label>Your Name (optional)</label>
                <input type="text" id="student-name" class="admin-form" placeholder="Enter name to track results">
            </div>
            
            <div style="margin: 16px 0;">
                <label style="margin-bottom:8px; display:block;">Try a Premade Quiz:</label>
                <div id="premade-list" style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px;"></div>
            </div>

            <div>
                <label>Or Enter Quiz Code / ID</label>
                <input type="text" id="quiz-id-input" class="admin-form" placeholder="demo">
            </div>
            <div style="margin-top: 16px; display: flex; gap: 10px;">
                <button id="start-quiz-btn" class="btn btn-primary">Start Quiz</button>
                <button id="back-menu-btn" class="btn">Back</button>
            </div>
        `;
        // We reuse .admin-form input styles or add specific ones
        // Just adjusting the input class to match existing styles if possible
        const inputs = formContainer.querySelectorAll("input");
        inputs.forEach(inp => {
            inp.style.width = "100%";
            inp.style.padding = "10px";
            inp.style.borderRadius = "12px";
            inp.style.border = "1px solid rgba(255,255,255,0.1)";
            inp.style.background = "var(--bg)";
            inp.style.color = "var(--text)";
            inp.style.marginBottom = "4px";
        });

        startMenu.appendChild(formContainer);

        // Wire up buttons
        formContainer.querySelector("#back-menu-btn")!.addEventListener("click", () => {
            (formContainer as HTMLElement).style.display = "none";
            menuActions.style.display = "flex";
        });

        formContainer.querySelector("#start-quiz-btn")!.addEventListener("click", () => {
            const nameInput = document.getElementById("student-name") as HTMLInputElement;
            const quizInput = document.getElementById("quiz-id-input") as HTMLInputElement;
            startStudentQuiz(nameInput.value, quizInput.value);
        });

        // Populate premade quizzes
        const premadeList = formContainer.querySelector("#premade-list");
        if (premadeList) {
            getPremadeQuizzes().forEach(q => {
                const btn = document.createElement("button");
                btn.className = "btn";
                btn.style.fontSize = "0.9rem";
                btn.style.padding = "8px 12px";
                btn.style.background = "rgba(255,255,255,0.05)";
                btn.textContent = q.title;
                btn.onclick = () => {
                    const nameInput = document.getElementById("student-name") as HTMLInputElement;
                    // We load this quiz directly, bypassing ID lookup if possible, 
                    // OR we rely on ID lookup if we make storage support it.
                    // But getPremadeQuizzes returns the object. 
                    // Let's modify startStudentQuiz to accept an optional object, or just handle it here.

                    // Easiest: Pass the object directly to a new overload or handle logic here.
                    // Let's call a helper or modify startStudentQuiz to take (name, id | object).
                    // For now, I'll just set the inputs and click start? No, ID might not work if it's "algebra" and not saved.
                    // Actually, startStudentQuiz logic tries to load from storage.
                    // I should probably save these premade quizzes to storage on first load? 
                    // OR separate the "Start with Quiz Object" logic.

                    // Let's create a direct start function or modify startStudentQuiz.
                    startStudentQuizDirect(nameInput.value, q);
                };
                premadeList.appendChild(btn);
            });
        }

    } else {
        (formContainer as HTMLElement).style.display = "flex";
    }
}

function startStudentQuizDirect(name: string, quizData: any): void {
    // Reuse logic
    if (name) localStorage.setItem("current_student_name", name);

    startMenu.style.display = "none";
    quizHeader.style.display = "flex";
    quizMain.style.display = "flex";
    initializeQuiz(quizData);
}

import { loadQuizFromStorage, getDemoQuiz, getPremadeQuizzes } from "./storage.js";
import { initializeQuiz } from "./render.js";

function startStudentQuiz(name: string, quizId: string): void {
    quizId = quizId.trim() || "demo"; // default to demo if empty

    let quiz = loadQuizFromStorage(quizId);

    // If not found in storage, check premade quizzes
    if (!quiz) {
        if (quizId === "demo") {
            quiz = getDemoQuiz();
        } else {
            const premade = getPremadeQuizzes().find(q => q.id === quizId);
            if (premade) {
                quiz = premade;
            }
        }
    }

    if (!quiz) {
        alert("Quiz not found with that ID.");
        return;
    }

    // Save student name to session/local for results later
    if (name) {
        localStorage.setItem("current_student_name", name);
    }

    // Start Game
    startMenu.style.display = "none";
    quizHeader.style.display = "flex";
    quizMain.style.display = "flex";

    initializeQuiz(quiz);
}

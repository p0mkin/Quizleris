import { getRequiredElement } from "./dom.js";
import { t, updatePageLanguage } from "./i18n.js";
import { loadQuizFromStorage, getDemoQuiz, getPremadeQuizzes } from "./storage.js";
import { initializeQuiz } from "./render.js";


// DOM Elements
let startMenu;
let quizHeader;
let quizMain;
let studentBtn;
let adminBtn;
let isStudentMenuOpen = false;

export function setupMenu(callbacks) {
    startMenu = getRequiredElement("start-menu");
    quizHeader = document.querySelector(".quiz-header");
    quizMain = document.querySelector(".quiz-main");

    studentBtn = getRequiredElement("menu-btn-student");
    adminBtn = getRequiredElement("menu-btn-admin");

    adminBtn.onclick = () => {
        console.log('Button clicked: Admin Mode');
        try {
            callbacks.onAdmin();
        } catch (e) {
            console.error("Admin Click Error:", e);
            alert("Admin Click Error: " + e);
        }
    };

    studentBtn.onclick = () => {
        console.log('Button clicked: Student Mode');
        try {
            isStudentMenuOpen = true;
            handleStudentClick();
        } catch (e) {
            console.error("Student Click Error:", e);
            alert("Student Click Error: " + e);
        }
    };
}

export function isStudentViewActive() {
    return isStudentMenuOpen;
}

export function renderStartMenu() {
    if (!startMenu) {
        console.error("Menu not setup! Call setupMenu() first.");
        return;
    }

    startMenu.style.display = "flex";
    quizHeader.style.display = "none";
    quizMain.style.display = "none";

    const container = startMenu.querySelector(".student-form-container");
    if (container) container.remove();
    isStudentMenuOpen = false;
}

export function renderStudentJoin(quizToJoin) {
    if (!startMenu) return;

    const welcomeH1 = startMenu.querySelector('h1');
    const welcomeP = startMenu.querySelector('p');
    const menuActions = startMenu.querySelector(".menu-actions");
    const existingForm = startMenu.querySelector(".student-form-container");

    if (welcomeH1) welcomeH1.style.display = "none";
    if (welcomeP) welcomeP.style.display = "none";
    if (menuActions) menuActions.style.display = "none";
    if (existingForm) existingForm.style.display = "none";

    let joinContainer = startMenu.querySelector(".student-join-container");
    if (!joinContainer) {
        joinContainer = document.createElement("div");
        joinContainer.className = "student-form-container student-join-container";
        startMenu.appendChild(joinContainer);
    }

    joinContainer.style.display = "flex";

    let timeInfo = t('admin.timerNone');
    if (quizToJoin.timerConfig && quizToJoin.timerConfig.mode !== "none") {
        const limit = quizToJoin.timerConfig.limitSeconds;
        if (quizToJoin.timerConfig.mode === "question") {
            timeInfo = `${limit}s / ${t('admin.timerPerQuestion').toLowerCase()}`;
        } else {
            timeInfo = `${Math.floor(limit / 60)}m ${limit % 60}s ${t('admin.timerWholeQuiz').toLowerCase()}`;
        }
    }

    joinContainer.innerHTML = `
        <div class="join-card">
             <div style="margin-bottom: 24px;">
                <span style="background: var(--accent); color: #000; padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;">
                    ${t('join.joinQuiz')}
                </span>
             </div>
             <div class="join-quiz-info">
                <h2 style="font-size: 2.2rem; margin-bottom: 12px;">${quizToJoin.title}</h2>
                <p style="font-size: 1.1rem; color: var(--muted);">${quizToJoin.questions.length} ${t('join.questions')} | ${timeInfo}</p>
             </div>
             
             <div class="join-input-group">
                <label for="join-student-name" class="join-label">${t('join.yourName')}</label>
                <input type="text" id="join-student-name" class="join-input" placeholder="${t('join.namePlaceholder')}">
             </div>
             
             <div class="join-actions">
                <button id="join-start-btn" class="btn btn-primary btn-xl">${t('join.startBtn')}</button>
                <button id="join-back-btn" class="btn btn-secondary">${t('join.backBtn')}</button>
             </div>
        </div>
    `;

    document.getElementById("join-start-btn").onclick = () => {
        const nameInput = document.getElementById("join-student-name");
        const name = nameInput.value.trim() || "Anonymous";
        startStudentQuizDirect(name, quizToJoin);
    };

    const params = new URLSearchParams(window.location.search);
    if (params.get("preview") === "true") {
        const nameInput = document.getElementById("join-student-name");
        if (nameInput) {
            nameInput.value = t('admin.previewName');
        }
    }

    document.getElementById("join-back-btn").onclick = () => {
        joinContainer.style.display = "none";
        if (welcomeH1) welcomeH1.style.display = "block";
        if (welcomeP) welcomeP.style.display = "block";
        if (menuActions) menuActions.style.display = "flex";
    };
}

export function handleStudentClick() {
    const welcomeH1 = startMenu.querySelector('h1');
    const welcomeP = startMenu.querySelector('p');
    const menuActions = startMenu.querySelector(".menu-actions");

    if (welcomeH1) welcomeH1.style.display = "none";
    if (welcomeP) welcomeP.style.display = "none";
    menuActions.style.display = "none";

    let formContainer = startMenu.querySelector(".student-form-container");
    if (formContainer) {
        formContainer.remove();
    }

    formContainer = document.createElement("div");
    formContainer.className = "student-form-container";
    formContainer.innerHTML = `
            <div style="margin-bottom: 20px;">
                <label data-i18n="student.nameLabel" style="display: block; margin-bottom: 8px; font-weight: 500;">Your Name (optional)</label>
                <input type="text" id="student-name" class="admin-form" data-i18n-placeholder="student.namePlaceholder" placeholder="Enter name to track results">
            </div>
            
            <div style="margin: 20px 0;">
                <label style="margin-bottom:12px; display:block; font-weight: 500;" data-i18n="student.premadeLabel">Try a Premade Quiz:</label>
                <div id="premade-list" style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:12px;"></div>
            </div>

            <div style="margin-top: 20px;">
                <label data-i18n="student.quizIdLabel" style="display: block; margin-bottom: 8px; font-weight: 500;">Or Enter Quiz Code / ID</label>
                <input type="text" id="quiz-id-input" class="admin-form" data-i18n-placeholder="student.quizIdPlaceholder" placeholder="demo">
            </div>
            <div style="margin-top: 32px; display: flex; gap: 12px;">
                <button id="start-quiz-btn" class="btn btn-primary" data-i18n="student.startBtn" style="flex: 1; padding: 12px;">Start Quiz</button>
                <button id="back-menu-btn" class="btn" data-i18n="student.backBtn" style="flex: 1; padding: 12px;">Back</button>
            </div>
        `;
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

    updatePageLanguage();

    formContainer.querySelector("#back-menu-btn").addEventListener("click", () => {
        const welcomeH1 = startMenu.querySelector('h1');
        const welcomeP = startMenu.querySelector('p');

        formContainer.style.display = "none";
        if (welcomeH1) welcomeH1.style.display = "block";
        if (welcomeP) welcomeP.style.display = "block";
        menuActions.style.display = "flex";
        isStudentMenuOpen = false;
    });

    formContainer.querySelector("#start-quiz-btn").addEventListener("click", () => {
        const nameInput = document.getElementById("student-name");
        const quizInput = document.getElementById("quiz-id-input");
        startStudentQuiz(nameInput.value, quizInput.value);
    });

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
                const nameInput = document.getElementById("student-name");
                startStudentQuizDirect(nameInput.value, q);
            };
            premadeList.appendChild(btn);
        });
    }
}

function startStudentQuizDirect(name, quizData) {
    if (name) localStorage.setItem("current_student_name", name);

    startMenu.style.display = "none";
    quizHeader.style.display = "flex";
    quizMain.style.display = "flex";

    try {
        initializeQuiz(quizData);
    } catch (e) {
        console.error("Quiz Start Error:", e);
        alert("Failed to start quiz: " + e);
    }
}

function startStudentQuiz(name, quizId) {
    quizId = quizId.trim() || "demo";

    let quiz = loadQuizFromStorage(quizId);

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

    if (name) {
        localStorage.setItem("current_student_name", name);
    }

    startMenu.style.display = "none";
    quizHeader.style.display = "flex";
    quizMain.style.display = "flex";

    try {
        initializeQuiz(quiz);
    } catch (e) {
        console.error("Quiz Start Error:", e);
        alert("Failed to start quiz: " + e);
    }
}

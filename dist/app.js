"use strict";
// Simple state container
class QuizState {
    constructor(quiz) {
        this.currentIndex = 0;
        this.hasAnswered = false;
        this.score = 0;
        this.startTime = Date.now();
        this.questionStartTimes = [];
        this.questionAnswerTimes = [];
        this.quiz = quiz;
        this.questionStartTimes[0] = Date.now();
    }
    get currentQuestion() {
        return this.quiz.questions[this.currentIndex];
    }
    get isLastQuestion() {
        return this.currentIndex >= this.quiz.questions.length - 1;
    }
    get totalTime() {
        return Date.now() - this.startTime;
    }
    submitAnswer(choiceId) {
        if (this.hasAnswered)
            return false;
        this.hasAnswered = true;
        const chosen = this.currentQuestion.choices.find((c) => c.id === choiceId);
        const correct = !!chosen?.isCorrect;
        if (correct)
            this.score += 1;
        // Track time for this question
        const questionStart = this.questionStartTimes[this.currentIndex] || this.startTime;
        this.questionAnswerTimes[this.currentIndex] = Date.now() - questionStart;
        return correct;
    }
    nextQuestion() {
        if (this.isLastQuestion)
            return;
        this.currentIndex += 1;
        this.hasAnswered = false;
        this.questionStartTimes[this.currentIndex] = Date.now();
    }
    getResults() {
        return {
            score: this.score,
            total: this.quiz.questions.length,
            percentage: Math.round((this.score / this.quiz.questions.length) * 100),
            totalTime: this.totalTime,
            questionTimes: this.questionAnswerTimes,
        };
    }
}
// Typed DOM helper to avoid null checks later
function getRequiredElement(id) {
    const el = document.getElementById(id);
    if (!el) {
        throw new Error(`Root element #${id} not found in index.html`);
    }
    return el;
}
// DOM refs (non-null, typed)
const questionContainer = getRequiredElement("question-container");
const answersContainer = getRequiredElement("answers-container");
const statusContainer = getRequiredElement("status-container");
// Storage keys
const STORAGE_KEY_PREFIX = "quiz_";
const STORAGE_KEY_ALL_IDS = "quiz_all_ids";
// Generate a simple ID (timestamp-based, or you can use crypto.randomUUID() if available)
function generateQuizId() {
    return `quiz_${Date.now()}`;
}
// Save quiz to localStorage
function saveQuizToStorage(quizData) {
    const key = STORAGE_KEY_PREFIX + quizData.id;
    localStorage.setItem(key, JSON.stringify(quizData));
    // Track all quiz IDs
    const allIds = getAllQuizIds();
    if (!allIds.includes(quizData.id)) {
        allIds.push(quizData.id);
        localStorage.setItem(STORAGE_KEY_ALL_IDS, JSON.stringify(allIds));
    }
}
// Load quiz from localStorage by ID
function loadQuizFromStorage(quizId) {
    const key = STORAGE_KEY_PREFIX + quizId;
    const data = localStorage.getItem(key);
    if (!data)
        return null;
    try {
        return JSON.parse(data);
    }
    catch {
        return null;
    }
}
// Get all saved quiz IDs
function getAllQuizIds() {
    const data = localStorage.getItem(STORAGE_KEY_ALL_IDS);
    if (!data)
        return [];
    try {
        return JSON.parse(data);
    }
    catch {
        return [];
    }
}
// Load quiz from URL param or localStorage, or return default demo quiz
function loadQuiz() {
    // Check URL param first: ?quiz=abc123
    const params = new URLSearchParams(window.location.search);
    const quizParam = params.get("quiz");
    if (quizParam) {
        // Try to decode as base64 JSON (for sharing)
        try {
            const decoded = atob(quizParam);
            const parsed = JSON.parse(decoded);
            return parsed;
        }
        catch {
            // If not base64, treat as localStorage ID
            const loaded = loadQuizFromStorage(quizParam);
            if (loaded)
                return loaded;
        }
    }
    // Try to load from localStorage (most recent, or first available)
    const allIds = getAllQuizIds();
    if (allIds.length > 0) {
        const lastId = allIds[allIds.length - 1];
        const loaded = loadQuizFromStorage(lastId);
        if (loaded)
            return loaded;
    }
    // Fallback: return a default demo quiz
    return {
        id: "demo",
        title: "Demo Quiz",
        questions: [
            {
                id: "q1",
                prompt: "What is the derivative of \\(x^2\\)?",
                choices: [
                    { id: "a", text: "\\(2x\\)", isCorrect: true },
                    { id: "b", text: "\\(x\\)", isCorrect: false },
                    { id: "c", text: "\\(x^2\\)", isCorrect: false },
                    { id: "d", text: "\\(2\\)", isCorrect: false },
                ],
            },
        ],
    };
}
// Will be initialized after loading quiz
let quiz = null;
// Render functions
function renderQuestion(q) {
    questionContainer.innerHTML = `
    <div class="prompt">${q.prompt}</div>
  `;
    // Ask KaTeX to render LaTeX within the question container
    renderMathInElement(questionContainer, {
        delimiters: [
            { left: "\\(", right: "\\)", display: false },
            { left: "\\[", right: "\\]", display: true },
        ],
    });
}
function renderAnswers(q) {
    answersContainer.innerHTML = "";
    q.choices.forEach((choice) => {
        const btn = document.createElement("button");
        btn.className = "answer-btn";
        btn.dataset.choiceId = choice.id;
        btn.innerHTML = choice.text; // allow KaTeX inline markup
        btn.addEventListener("click", () => onAnswer(choice.id));
        answersContainer.appendChild(btn);
    });
    renderMathInElement(answersContainer, {
        delimiters: [
            { left: "\\(", right: "\\)", display: false },
            { left: "\\[", right: "\\]", display: true },
        ],
    });
}
function renderStatus(message, kind) {
    const colorClass = kind === "correct" ? "badge badge-correct" : kind === "incorrect" ? "badge badge-incorrect" : "badge";
    const scoreText = `Score: ${quiz?.score ?? 0}`;
    statusContainer.innerHTML = `
    <span class="${colorClass}">${message}</span>
    <span class="badge">${scoreText}</span>
  `;
}
// Answer handler
function onAnswer(choiceId) {
    if (!quiz || quiz.hasAnswered)
        return;
    const isCorrect = quiz.submitAnswer(choiceId);
    // mark buttons
    Array.from(answersContainer.querySelectorAll(".answer-btn")).forEach((btn) => {
        const id = btn.dataset.choiceId;
        const choice = quiz.currentQuestion.choices.find((c) => c.id === id);
        if (!choice)
            return;
        if (choice.isCorrect)
            btn.classList.add("correct");
        if (id === choiceId && !choice.isCorrect)
            btn.classList.add("incorrect");
        btn.disabled = true;
    });
    renderStatus(isCorrect ? "Correct!" : "Incorrect", isCorrect ? "correct" : "incorrect");
    renderNextButton();
}
// Initialize quiz and render
function initializeQuiz(quizData) {
    quiz = new QuizState(quizData);
    renderQuiz();
}
function renderQuiz() {
    if (!quiz)
        return;
    // Update header title
    const headerTitle = document.querySelector(".quiz-header h1");
    if (headerTitle) {
        headerTitle.textContent = quiz.quiz.title;
    }
    renderQuestionCounter();
    renderQuestion(quiz.currentQuestion);
    renderAnswers(quiz.currentQuestion);
    renderStatus("Choose an answer", "neutral");
    renderNextButton();
    startQuestionTimer();
}
function renderQuestionCounter() {
    if (!quiz)
        return;
    const counterId = "question-counter";
    let counter = document.getElementById(counterId);
    if (!counter) {
        counter = document.createElement("div");
        counter.id = counterId;
        counter.className = "question-counter";
        questionContainer.insertBefore(counter, questionContainer.firstChild);
    }
    counter.textContent = `Question ${quiz.currentIndex + 1} of ${quiz.quiz.questions.length}`;
}
let timerInterval = null;
function startQuestionTimer() {
    // Clear existing timer
    if (timerInterval !== null) {
        clearInterval(timerInterval);
    }
    if (!quiz)
        return;
    const timerId = "question-timer";
    let timerEl = document.getElementById(timerId);
    if (!timerEl) {
        timerEl = document.createElement("div");
        timerEl.id = timerId;
        timerEl.className = "question-timer";
        statusContainer.appendChild(timerEl);
    }
    const questionStart = quiz.questionStartTimes[quiz.currentIndex] || quiz.startTime;
    timerInterval = window.setInterval(() => {
        if (!quiz)
            return;
        const elapsed = Date.now() - questionStart;
        const seconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(seconds / 60);
        const displaySeconds = seconds % 60;
        timerEl.textContent = `Time: ${minutes}:${displaySeconds.toString().padStart(2, "0")}`;
    }, 1000);
}
function renderNextButton() {
    const nextButtonId = "next-btn";
    let btn = document.getElementById(nextButtonId);
    if (!btn) {
        btn = document.createElement("button");
        btn.id = nextButtonId;
        btn.textContent = "Next Question";
        btn.className = "answer-btn";
        btn.style.marginTop = "8px";
        statusContainer.appendChild(btn);
    }
    if (!quiz) {
        btn.style.display = "none";
        return;
    }
    if (quiz.isLastQuestion && quiz.hasAnswered) {
        // Show "View Results" instead
        btn.style.display = "block";
        btn.disabled = false;
        btn.textContent = "View Results";
        btn.onclick = () => {
            showResults();
        };
    }
    else {
        btn.style.display = quiz.hasAnswered ? "block" : "none";
        btn.disabled = !quiz.hasAnswered || quiz.isLastQuestion;
        btn.textContent = quiz.isLastQuestion ? "Quiz Complete!" : "Next Question";
        btn.onclick = () => {
            if (!quiz || !quiz.hasAnswered || quiz.isLastQuestion)
                return;
            if (timerInterval !== null) {
                clearInterval(timerInterval);
            }
            quiz.nextQuestion();
            renderQuiz();
        };
    }
}
function showResults() {
    if (!quiz)
        return;
    if (timerInterval !== null) {
        clearInterval(timerInterval);
    }
    const results = quiz.getResults();
    const totalMinutes = Math.floor(results.totalTime / 60000);
    const totalSeconds = Math.floor((results.totalTime % 60000) / 1000);
    // Hide quiz content
    questionContainer.style.display = "none";
    answersContainer.style.display = "none";
    statusContainer.style.display = "none";
    // Create results container
    const resultsId = "results-container";
    let resultsContainer = document.getElementById(resultsId);
    if (!resultsContainer) {
        resultsContainer = document.createElement("div");
        resultsContainer.id = resultsId;
        resultsContainer.className = "results-container";
        document.querySelector(".quiz-main").appendChild(resultsContainer);
    }
    resultsContainer.innerHTML = `
        <h2>Quiz Complete!</h2>
        <div class="results-summary">
            <div class="results-score">
                <div class="results-big-score">${results.score} / ${results.total}</div>
                <div class="results-percentage">${results.percentage}%</div>
            </div>
            <div class="results-stats">
                <p>Total Time: ${totalMinutes}:${totalSeconds.toString().padStart(2, "0")}</p>
                <p>Average Time per Question: ${Math.round(results.questionTimes.reduce((a, b) => a + b, 0) / results.questionTimes.length / 1000)}s</p>
            </div>
        </div>
        <div class="results-review">
            <h3>Review</h3>
            ${quiz.quiz.questions.map((q, idx) => {
        const time = results.questionTimes[idx] ? Math.round(results.questionTimes[idx] / 1000) : 0;
        const correctChoice = q.choices.find(c => c.isCorrect);
        return `
                    <div class="result-question-item">
                        <div class="result-question-header">
                            <strong>Question ${idx + 1}</strong>
                            <span>Time: ${time}s</span>
                        </div>
                        <div class="result-question-prompt">${q.prompt}</div>
                        <div class="result-question-answer">Correct Answer: ${correctChoice?.text || "N/A"}</div>
                    </div>
                `;
    }).join("")}
        </div>
        <button id="restart-quiz-btn" class="answer-btn">Take Quiz Again</button>
    `;
    // Render LaTeX in results
    renderMathInElement(resultsContainer, {
        delimiters: [
            { left: "\\(", right: "\\)", display: false },
            { left: "\\[", right: "\\]", display: true },
        ],
    });
    // Wire up restart button
    document.getElementById("restart-quiz-btn").addEventListener("click", () => {
        if (!quiz)
            return;
        initializeQuiz(quiz.quiz);
        resultsContainer.remove();
        questionContainer.style.display = "block";
        answersContainer.style.display = "grid";
        statusContainer.style.display = "flex";
    });
}
// Minimal styling helpers for status badges (kept here to avoid touching CSS again now)
const style = document.createElement("style");
style.textContent = `
  .badge-correct { border-color: var(--success); color: var(--success); }
  .badge-incorrect { border-color: var(--danger); color: var(--danger); }
`;
document.head.appendChild(style);
// Admin UI state
let adminMode = false;
let adminQuiz = null;
const ADMIN_PASSWORD_KEY = "quiz_admin_password";
const ADMIN_SESSION_KEY = "quiz_admin_session";
// Get admin DOM elements (will be set after DOM loads)
let adminToggle;
let adminPanel;
let adminQuizTitle;
let adminQuestionsList;
let adminAddQuestionBtn;
let adminScanQuestionBtn;
let adminOcrInput;
let adminSaveBtn;
let adminCancelBtn;
let adminShareCode;
// Initialize admin DOM refs (call after DOM is ready)
function initAdminElements() {
    adminToggle = getRequiredElement("admin-toggle");
    adminPanel = getRequiredElement("admin-panel");
    adminQuizTitle = getRequiredElement("admin-quiz-title");
    adminQuestionsList = getRequiredElement("admin-questions-list");
    adminAddQuestionBtn = getRequiredElement("admin-add-question");
    adminScanQuestionBtn = getRequiredElement("admin-scan-question");
    adminOcrInput = getRequiredElement("admin-ocr-input");
    adminSaveBtn = getRequiredElement("admin-save");
    adminCancelBtn = getRequiredElement("admin-cancel");
    adminShareCode = getRequiredElement("admin-share-code");
    // Hide admin toggle by default (only show if admin access allowed)
    if (!isAdminAccessAllowed()) {
        adminToggle.style.display = "none";
    }
}
// Check if admin access is allowed (URL param ?admin=true or session flag)
function isAdminAccessAllowed() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("admin") === "true")
        return true;
    // Check session storage for admin session
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
}
// Prompt for admin password
function promptAdminPassword() {
    const storedPassword = localStorage.getItem(ADMIN_PASSWORD_KEY);
    // If no password set, set one now
    if (!storedPassword) {
        const newPassword = prompt("Set admin password (you'll need this to access admin mode):");
        if (!newPassword)
            return false;
        localStorage.setItem(ADMIN_PASSWORD_KEY, newPassword);
        sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
        return true;
    }
    // Verify password
    const entered = prompt("Enter admin password:");
    if (entered === storedPassword) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
        return true;
    }
    alert("Incorrect password.");
    return false;
}
// Toggle admin mode
function toggleAdminMode() {
    // Require password unless already authenticated
    if (!isAdminAccessAllowed()) {
        if (!promptAdminPassword())
            return;
    }
    adminMode = !adminMode;
    adminPanel.style.display = adminMode ? "block" : "none";
    adminToggle.textContent = adminMode ? "Player Mode" : "Admin Mode";
    if (adminMode) {
        // Initialize admin quiz from current quiz or create new
        if (quiz) {
            adminQuiz = { ...quiz.quiz };
        }
        else {
            adminQuiz = {
                id: generateQuizId(),
                title: "New Quiz",
                questions: [],
            };
        }
        renderAdminForm();
    }
}
// Render admin form
function renderAdminForm() {
    if (!adminQuiz)
        return;
    adminQuizTitle.value = adminQuiz.title;
    adminQuestionsList.innerHTML = "";
    adminQuiz.questions.forEach((q, qIdx) => {
        const qDiv = document.createElement("div");
        qDiv.className = "admin-question-item";
        qDiv.innerHTML = `
      <h3>Question ${qIdx + 1}</h3>
      <label>
        Prompt (LaTeX):
        <textarea class="admin-question-prompt" data-qidx="${qIdx}">${q.prompt}</textarea>
      </label>
      <div class="admin-choices-list" data-qidx="${qIdx}"></div>
      <button class="admin-add-choice-btn" data-qidx="${qIdx}">+ Add Choice</button>
      <button class="admin-remove-question-btn" data-qidx="${qIdx}">Remove Question</button>
    `;
        adminQuestionsList.appendChild(qDiv);
        // Render choices for this question
        const choicesList = qDiv.querySelector(`.admin-choices-list[data-qidx="${qIdx}"]`);
        q.choices.forEach((choice, cIdx) => {
            const choiceDiv = document.createElement("div");
            choiceDiv.className = "admin-choice-item";
            choiceDiv.innerHTML = `
        <input type="radio" name="correct_${qIdx}" value="${cIdx}" ${choice.isCorrect ? "checked" : ""} />
        <input type="text" class="admin-choice-text" data-qidx="${qIdx}" data-cidx="${cIdx}" value="${choice.text}" />
        <button class="admin-remove-choice-btn" data-qidx="${qIdx}" data-cidx="${cIdx}">Remove</button>
      `;
            choicesList.appendChild(choiceDiv);
        });
        // Wire up choice events
        qDiv.querySelector(`.admin-add-choice-btn[data-qidx="${qIdx}"]`).addEventListener("click", () => {
            if (!adminQuiz)
                return;
            adminQuiz.questions[qIdx].choices.push({
                id: String.fromCharCode(97 + adminQuiz.questions[qIdx].choices.length), // a, b, c, d...
                text: "",
                isCorrect: false,
            });
            renderAdminForm();
        });
        qDiv.querySelector(`.admin-remove-question-btn[data-qidx="${qIdx}"]`).addEventListener("click", () => {
            if (!adminQuiz)
                return;
            adminQuiz.questions.splice(qIdx, 1);
            renderAdminForm();
        });
        // Wire up choice removal
        choicesList.querySelectorAll(`.admin-remove-choice-btn`).forEach((btn) => {
            btn.addEventListener("click", (e) => {
                if (!adminQuiz)
                    return;
                const target = e.target;
                const qIdx = parseInt(target.dataset.qidx);
                const cIdx = parseInt(target.dataset.cidx);
                adminQuiz.questions[qIdx].choices.splice(cIdx, 1);
                renderAdminForm();
            });
        });
    });
    // Wire up correct answer radios
    adminQuestionsList.querySelectorAll(`input[type="radio"]`).forEach((radio) => {
        radio.addEventListener("change", (e) => {
            if (!adminQuiz)
                return;
            const target = e.target;
            const qIdx = parseInt(target.name.split("_")[1]);
            const cIdx = parseInt(target.value);
            adminQuiz.questions[qIdx].choices.forEach((c, idx) => {
                c.isCorrect = idx === cIdx;
            });
        });
    });
}
// Save admin quiz
function saveAdminQuiz() {
    if (!adminQuiz)
        return;
    // Collect form data
    adminQuiz.title = adminQuizTitle.value.trim() || "Untitled Quiz";
    adminQuestionsList.querySelectorAll(".admin-question-prompt").forEach((textarea) => {
        const qIdx = parseInt(textarea.dataset.qidx);
        adminQuiz.questions[qIdx].prompt = textarea.value;
    });
    adminQuestionsList.querySelectorAll(".admin-choice-text").forEach((input) => {
        const qIdx = parseInt(input.dataset.qidx);
        const cIdx = parseInt(input.dataset.cidx);
        adminQuiz.questions[qIdx].choices[cIdx].text = input.value;
    });
    // Validate
    if (adminQuiz.questions.length === 0) {
        alert("Add at least one question!");
        return;
    }
    for (const q of adminQuiz.questions) {
        if (!q.prompt.trim()) {
            alert("All questions must have a prompt!");
            return;
        }
        if (q.choices.length < 2) {
            alert("Each question needs at least 2 choices!");
            return;
        }
        if (!q.choices.some((c) => c.isCorrect)) {
            alert("Each question needs at least one correct answer!");
            return;
        }
    }
    // Save to localStorage
    saveQuizToStorage(adminQuiz);
    // Generate share code (base64 JSON)
    const shareCode = btoa(JSON.stringify(adminQuiz));
    const shareUrl = `${window.location.origin}${window.location.pathname}?quiz=${shareCode}`;
    adminShareCode.style.display = "block";
    adminShareCode.innerHTML = `
    <strong>Quiz saved!</strong><br>
    Share URL: <code>${shareUrl}</code><br>
    Quiz ID: <code>${adminQuiz.id}</code>
  `;
    // Reload player mode with new quiz
    setTimeout(() => {
        toggleAdminMode();
        initializeQuiz(adminQuiz);
    }, 2000);
}
// OCR processing placeholder (will integrate actual OCR library later)
async function processOCRImage(_imageFile) {
    // Use Tesseract.js (loaded via CDN) to OCR the image
    const objectUrl = URL.createObjectURL(_imageFile);
    try {
        const result = await Tesseract.recognize(objectUrl, "eng");
        const raw = result.data.text || "";
        const parsed = parseOCRText(raw);
        return parsed;
    }
    catch (err) {
        console.error("OCR error:", err);
        alert("OCR failed. Please try again or type manually.");
        return null;
    }
    finally {
        URL.revokeObjectURL(objectUrl);
    }
}
// Handle OCR file upload
async function handleOCRUpload(event) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file)
        return;
    // Show loading state
    adminScanQuestionBtn.disabled = true;
    adminScanQuestionBtn.textContent = "Processing...";
    try {
        const result = await processOCRImage(file);
        if (result && adminQuiz) {
            // Add scanned question to quiz
            adminQuiz.questions.push({
                id: `q${adminQuiz.questions.length + 1}`,
                prompt: result.prompt,
                choices: result.choices.map((text, idx) => ({
                    id: String.fromCharCode(97 + idx), // a, b, c, d...
                    text: text,
                    isCorrect: idx === 0, // First choice is correct by default (admin can change)
                })),
            });
            renderAdminForm();
            alert("Question added from scan! Review and mark the correct answer.");
        }
    }
    catch (error) {
        console.error("OCR error:", error);
        alert("Error processing image. Please try again or type manually.");
    }
    finally {
        adminScanQuestionBtn.disabled = false;
        adminScanQuestionBtn.textContent = "📷 Scan Question (OCR)";
        input.value = ""; // Reset file input
    }
}
// Very simple OCR parsing heuristic:
// - Use first non-empty line as the prompt
// - Use next lines (up to 6) as choices; if fewer than 2, generate placeholders
function parseOCRText(text) {
    const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
    const prompt = lines[0] ?? "Scanned question";
    const choiceLines = lines.slice(1, 7); // up to 6 lines for choices
    let choices = choiceLines;
    if (choices.length < 2) {
        choices = [...choices, "Choice A", "Choice B"].slice(0, 4);
    }
    // Truncate to max 6 to avoid runaway lists
    choices = choices.slice(0, 6);
    return { prompt, choices };
}
// Wire up admin events (call after DOM is ready)
function setupAdminEvents() {
    adminToggle.addEventListener("click", toggleAdminMode);
    adminAddQuestionBtn.addEventListener("click", () => {
        if (!adminQuiz) {
            adminQuiz = {
                id: generateQuizId(),
                title: "New Quiz",
                questions: [],
            };
        }
        adminQuiz.questions.push({
            id: `q${adminQuiz.questions.length + 1}`,
            prompt: "",
            choices: [
                { id: "a", text: "", isCorrect: true },
                { id: "b", text: "", isCorrect: false },
            ],
        });
        renderAdminForm();
    });
    // OCR button triggers file input
    adminScanQuestionBtn.addEventListener("click", () => {
        adminOcrInput.click();
    });
    // Handle file selection
    adminOcrInput.addEventListener("change", handleOCRUpload);
    adminSaveBtn.addEventListener("click", saveAdminQuiz);
    adminCancelBtn.addEventListener("click", () => {
        toggleAdminMode();
    });
}
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
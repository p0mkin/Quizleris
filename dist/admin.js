import { quiz } from "./state.js";
import { getRequiredElement } from "./dom.js";
import { generateQuizId, saveQuizToStorage } from "./storage.js";
import { isAdminAccessAllowed, promptAdminPassword } from "./auth.js";
import { processOCRImage } from "./ocr.js";
import { initializeQuiz } from "./render.js";
// Admin UI state
let adminMode = false;
let adminQuiz = null;
// Admin DOM elements (will be set after DOM loads)
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
export function initAdminElements() {
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
// Toggle admin mode
export function toggleAdminMode() {
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
export function renderAdminForm() {
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
export function saveAdminQuiz() {
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
// Handle OCR file upload
export async function handleOCRUpload(event) {
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
        adminScanQuestionBtn.textContent = "Scan Question (OCR)";
        input.value = ""; // Reset file input
    }
}
// Wire up admin events (call after DOM is ready)
export function setupAdminEvents() {
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
//# sourceMappingURL=admin.js.map
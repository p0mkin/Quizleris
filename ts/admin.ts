import type { Quiz } from "./types.js";
import { quiz } from "./state.js";
import { getRequiredElement } from "./dom.js";
import { generateQuizId, saveQuizToStorage } from "./storage.js";
import { isAdminAccessAllowed, promptAdminPassword } from "./auth.js";
import { processOCRImage } from "./ocr.js";
import { initializeQuiz } from "./render.js";

// Admin UI state
let adminMode = false;
let adminQuiz: Quiz | null = null;

// Admin DOM elements (will be set after DOM loads)
let adminToggle: HTMLButtonElement;
let adminPanel: HTMLElement;
let adminQuizTitle: HTMLInputElement;
let adminQuestionsList: HTMLElement;
let adminAddQuestionBtn: HTMLButtonElement;
let adminScanQuestionBtn: HTMLButtonElement;
let adminOcrInput: HTMLInputElement;
let adminSaveBtn: HTMLButtonElement;
let adminCancelBtn: HTMLButtonElement;
let adminShareCode: HTMLElement;

// Initialize admin DOM refs (call after DOM is ready)
export function initAdminElements(): void {
    adminToggle = getRequiredElement("admin-toggle") as HTMLButtonElement;
    adminPanel = getRequiredElement("admin-panel");
    adminQuizTitle = getRequiredElement("admin-quiz-title") as HTMLInputElement;
    adminQuestionsList = getRequiredElement("admin-questions-list");
    adminAddQuestionBtn = getRequiredElement("admin-add-question") as HTMLButtonElement;
    adminScanQuestionBtn = getRequiredElement("admin-scan-question") as HTMLButtonElement;
    adminOcrInput = getRequiredElement("admin-ocr-input") as HTMLInputElement;
    adminSaveBtn = getRequiredElement("admin-save") as HTMLButtonElement;
    adminCancelBtn = getRequiredElement("admin-cancel") as HTMLButtonElement;
    adminShareCode = getRequiredElement("admin-share-code");

    // Hide admin toggle by default (only show if admin access allowed)
    if (!isAdminAccessAllowed()) {
        adminToggle.style.display = "none";
    }
}

// Toggle admin mode
export function toggleAdminMode(): void {
    // Require password unless already authenticated
    if (!isAdminAccessAllowed()) {
        if (!promptAdminPassword()) return;
    }

    adminMode = !adminMode;
    adminPanel.style.display = adminMode ? "block" : "none";
    adminToggle.textContent = adminMode ? "Player Mode" : "Admin Mode";

    if (adminMode) {
        // Initialize admin quiz from current quiz or create new
        if (quiz) {
            adminQuiz = { ...quiz.quiz };
        } else {
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
export function renderAdminForm(): void {
    if (!adminQuiz) return;

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
      <button class="admin-add-choice-btn btn" data-qidx="${qIdx}">+ Add Choice</button>
      <button class="admin-remove-question-btn btn btn-danger" data-qidx="${qIdx}">Remove Question</button>
    `;
        adminQuestionsList.appendChild(qDiv);

        // Render choices for this question
        const choicesList = qDiv.querySelector(`.admin-choices-list[data-qidx="${qIdx}"]`)!;
        q.choices.forEach((choice, cIdx) => {
            const choiceDiv = document.createElement("div");
            choiceDiv.className = "admin-choice-item";
            choiceDiv.innerHTML = `
        <input type="radio" name="correct_${qIdx}" value="${cIdx}" ${choice.isCorrect ? "checked" : ""} />
        <input type="text" class="admin-choice-text" data-qidx="${qIdx}" data-cidx="${cIdx}" value="${choice.text}" />
        <button class="admin-remove-choice-btn btn btn-danger btn-icon" data-qidx="${qIdx}" data-cidx="${cIdx}" title="Delete choice">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      `;
            choicesList.appendChild(choiceDiv);
        });

        // Wire up choice events
        qDiv.querySelector(`.admin-add-choice-btn[data-qidx="${qIdx}"]`)!.addEventListener("click", () => {
            if (!adminQuiz) return;
            adminQuiz.questions[qIdx].choices.push({
                id: String.fromCharCode(97 + adminQuiz.questions[qIdx].choices.length), // a, b, c, d...
                text: "",
                isCorrect: false,
            });
            renderAdminForm();
        });

        qDiv.querySelector(`.admin-remove-question-btn[data-qidx="${qIdx}"]`)!.addEventListener("click", () => {
            if (!adminQuiz) return;
            if (!confirm("Are you sure you want to delete this specific question?")) return;
            adminQuiz.questions.splice(qIdx, 1);
            renderAdminForm();
        });

        // Wire up choice removal
        choicesList.querySelectorAll(`.admin-remove-choice-btn`).forEach((btn) => {
            btn.addEventListener("click", (e) => {
                if (!adminQuiz) return;
                const target = e.currentTarget as HTMLButtonElement; // use currentTarget to get the button, not inner SVG
                const qIdx = parseInt(target.dataset.qidx!);
                const cIdx = parseInt(target.dataset.cidx!);

                // Optional: Prevent leaving less than 2 choices? The user validator check is at save time.
                // But preventing it here is nicer.
                // The user only asked for "delete individual choice".
                // I'll add the confirm.
                if (!confirm("Remove this choice?")) return;

                adminQuiz!.questions[qIdx].choices.splice(cIdx, 1);
                renderAdminForm();
            });
        });
    });

    // Wire up correct answer radios
    adminQuestionsList.querySelectorAll(`input[type="radio"]`).forEach((radio) => {
        radio.addEventListener("change", (e) => {
            if (!adminQuiz) return;
            const target = e.target as HTMLInputElement;
            const qIdx = parseInt(target.name.split("_")[1]);
            const cIdx = parseInt(target.value);
            adminQuiz.questions[qIdx].choices.forEach((c, idx) => {
                c.isCorrect = idx === cIdx;
            });
        });
    });
}

// Save admin quiz
export function saveAdminQuiz(): void {
    if (!adminQuiz) return;

    // Collect form data
    adminQuiz.title = adminQuizTitle.value.trim() || "Untitled Quiz";

    adminQuestionsList.querySelectorAll(".admin-question-prompt").forEach((textarea) => {
        const qIdx = parseInt((textarea as HTMLElement).dataset.qidx!);
        adminQuiz!.questions[qIdx].prompt = (textarea as HTMLTextAreaElement).value;
    });

    adminQuestionsList.querySelectorAll(".admin-choice-text").forEach((input) => {
        const qIdx = parseInt((input as HTMLElement).dataset.qidx!);
        const cIdx = parseInt((input as HTMLElement).dataset.cidx!);
        adminQuiz!.questions[qIdx].choices[cIdx].text = (input as HTMLInputElement).value;
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
        initializeQuiz(adminQuiz!);
    }, 2000);
}

// Handle OCR file upload
export async function handleOCRUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

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
    } catch (error) {
        console.error("OCR error:", error);
        alert("Error processing image. Please try again or type manually.");
    } finally {
        adminScanQuestionBtn.disabled = false;
        adminScanQuestionBtn.textContent = "Scan Question (OCR)";
        input.value = ""; // Reset file input
    }
}

// Wire up admin events (call after DOM is ready)
export function setupAdminEvents(): void {
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

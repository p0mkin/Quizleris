import { quiz } from "./state.js";
import { getRequiredElement } from "./dom.js";
import { generateQuizId, saveQuizToStorage } from "./storage.js";
import { isAdminAccessAllowed, promptAdminPassword } from "./auth.js";
import { processOCRImage } from "./ocr.js";
import { initializeQuiz } from "./render.js";
import { renderStartMenu } from "./menu.js";
import { renderDashboard } from "./dashboard.js";
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
let adminGenerateAiBtn;
let adminOcrInput;
let adminSaveBtn;
let adminExportBtn;
let adminImportBtn;
let adminImportInput;
let adminCancelBtn;
let adminShareCode;
let adminTimerMode;
let adminTimerLimit;
// Initialize admin DOM refs (call after DOM is ready)
export function initAdminElements() {
    adminToggle = getRequiredElement("admin-toggle");
    adminPanel = getRequiredElement("admin-panel");
    adminQuizTitle = getRequiredElement("admin-quiz-title");
    adminQuestionsList = getRequiredElement("admin-questions-list");
    adminAddQuestionBtn = getRequiredElement("admin-add-question");
    adminScanQuestionBtn = getRequiredElement("admin-scan-question");
    adminGenerateAiBtn = getRequiredElement("admin-generate-ai");
    adminOcrInput = getRequiredElement("admin-ocr-input");
    adminSaveBtn = getRequiredElement("admin-save");
    adminExportBtn = getRequiredElement("admin-export");
    adminImportBtn = getRequiredElement("admin-import-btn");
    adminImportInput = getRequiredElement("admin-import-input");
    adminCancelBtn = getRequiredElement("admin-cancel");
    adminShareCode = getRequiredElement("admin-share-code");
    adminTimerMode = getRequiredElement("admin-timer-mode");
    adminTimerLimit = getRequiredElement("admin-timer-limit");
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
    // Set timer defaults
    if (!adminQuiz.timerConfig) {
        adminTimerMode.value = "question";
        adminTimerLimit.value = "30";
    }
    else {
        adminTimerMode.value = adminQuiz.timerConfig.mode;
        adminTimerLimit.value = String(adminQuiz.timerConfig.limitSeconds);
    }
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
        const choicesList = qDiv.querySelector(`.admin-choices-list[data-qidx="${qIdx}"]`);
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
            if (!confirm("Are you sure you want to delete this specific question?"))
                return;
            adminQuiz.questions.splice(qIdx, 1);
            renderAdminForm();
        });
        // Wire up choice removal
        choicesList.querySelectorAll(`.admin-remove-choice-btn`).forEach((btn) => {
            btn.addEventListener("click", (e) => {
                if (!adminQuiz)
                    return;
                const target = e.currentTarget; // use currentTarget to get the button, not inner SVG
                const qIdx = parseInt(target.dataset.qidx);
                const cIdx = parseInt(target.dataset.cidx);
                // Optional: Prevent leaving less than 2 choices? The user validator check is at save time.
                // But preventing it here is nicer.
                // The user only asked for "delete individual choice".
                // I'll add the confirm.
                if (!confirm("Remove this choice?"))
                    return;
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
    // Save timer config
    adminQuiz.timerConfig = {
        mode: adminTimerMode.value,
        limitSeconds: parseInt(adminTimerLimit.value) || 30
    };
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
    // AI Generation Button
    adminGenerateAiBtn.addEventListener("click", async () => {
        const topic = prompt("Enter a topic for the AI to generate a quiz about (e.g., 'Physics', 'History'):");
        if (!topic)
            return;
        adminGenerateAiBtn.disabled = true;
        adminGenerateAiBtn.textContent = "✨ Generating...";
        try {
            await simulateAinGeneration(topic);
        }
        catch (e) {
            alert("Failed to generate quiz.");
        }
        finally {
            adminGenerateAiBtn.disabled = false;
            adminGenerateAiBtn.textContent = "✨ Generate with AI";
        }
    });
    // Handle file selection
    adminOcrInput.addEventListener("change", handleOCRUpload);
    adminSaveBtn.addEventListener("click", saveAdminQuiz);
    // Export
    adminExportBtn.addEventListener("click", () => {
        if (!adminQuiz)
            return;
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(adminQuiz, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", (adminQuiz.title || "quiz") + ".json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    });
    // Import
    adminImportBtn.addEventListener("click", () => {
        adminImportInput.click();
    });
    adminImportInput.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result);
                if (json && json.questions) {
                    adminQuiz = json;
                    // Ensure ID exists
                    if (!adminQuiz.id)
                        adminQuiz.id = crypto.randomUUID();
                    renderAdminForm();
                    alert("Quiz imported successfully!");
                }
                else {
                    alert("Invalid quiz JSON.");
                }
            }
            catch (err) {
                alert("Error parsing JSON");
            }
        };
        reader.readAsText(file);
        e.target.value = ""; // Reset
    });
    adminCancelBtn.addEventListener("click", () => {
        toggleAdminMode();
    });
    const backBtn = document.getElementById("admin-btn-back");
    if (backBtn) {
        backBtn.addEventListener("click", () => {
            adminPanel.style.display = "none";
            adminToggle.textContent = "Admin Mode"; // Reset toggle text if needed, or rely on toggleAdminMode logic if we used it.
            // Actually better to just hide panel and show menu, but we need to ensure adminMode state is consistent.
            // If we just hide, adminMode var is still true.
            // Let's call toggleAdminMode() if it is open?
            // Or just reset state manually.
            if (adminMode)
                toggleAdminMode(); // This will close it and update state/text
            renderStartMenu();
        });
    }
    const dashBtn = document.getElementById("admin-btn-dashboard");
    if (dashBtn) {
        dashBtn.addEventListener("click", () => {
            if (adminMode)
                toggleAdminMode(); // Close admin panel
            renderDashboard();
        });
    }
}
// Mock AI Generation
async function simulateAinGeneration(topic) {
    if (!adminQuiz)
        return;
    // Simulate delay
    await new Promise(r => setTimeout(r, 1500));
    const newQuestions = [];
    const t = topic.toLowerCase();
    if (t.includes("history")) {
        newQuestions.push({
            id: crypto.randomUUID(),
            prompt: "Who was the first President of the United States?",
            choices: [
                { id: crypto.randomUUID(), text: "George Washington", isCorrect: true },
                { id: crypto.randomUUID(), text: "Thomas Jefferson", isCorrect: false },
                { id: crypto.randomUUID(), text: "Abraham Lincoln", isCorrect: false }
            ]
        });
        newQuestions.push({
            id: crypto.randomUUID(),
            prompt: "In which year did World War II end?",
            choices: [
                { id: crypto.randomUUID(), text: "1945", isCorrect: true },
                { id: crypto.randomUUID(), text: "1939", isCorrect: false },
                { id: crypto.randomUUID(), text: "1918", isCorrect: false }
            ]
        });
    }
    else if (t.includes("science") || t.includes("physics")) {
        newQuestions.push({
            id: crypto.randomUUID(),
            prompt: "What is the speed of light in vacuum?",
            choices: [
                { id: crypto.randomUUID(), text: "299,792 km/s", isCorrect: true },
                { id: crypto.randomUUID(), text: "150,000 km/s", isCorrect: false },
                { id: crypto.randomUUID(), text: "1,080 km/h", isCorrect: false }
            ]
        });
    }
    else {
        // Default generic
        newQuestions.push({
            id: crypto.randomUUID(),
            prompt: `Basic question about ${topic}`,
            choices: [
                { id: crypto.randomUUID(), text: "Correct Answer", isCorrect: true },
                { id: crypto.randomUUID(), text: "Wrong Answer", isCorrect: false },
                { id: crypto.randomUUID(), text: "Another Option", isCorrect: false }
            ]
        });
    }
    adminQuiz.questions.push(...newQuestions);
    renderAdminForm();
    alert(`Generated ${newQuestions.length} questions about ${topic}!`);
}
//# sourceMappingURL=admin.js.map
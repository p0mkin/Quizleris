import { quiz } from "./state.js";
import { getRequiredElement } from "./dom.js";
import { generateQuizId, saveQuizToStorage } from "./storage.js";
import { isAdminAccessAllowed, promptAdminPassword } from "./auth.js";
import { processOCRImage } from "./ocr.js";
import { t, updatePageLanguage } from "./i18n.js";
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
let adminExportBtn;
let adminImportBtn;
let adminImportInput;
let adminCancelBtn;
let adminShareCode;
let adminTimerMode;
let adminTimerLimit;
let adminShowResultsValue;
let adminResultGroup;
let adminQuizMode;
let adminShuffleQuestions;
let adminShuffleAnswers;
// Callbacks
let goHome = () => { };
// Initialize admin DOM refs and events
export function setupAdmin(callbacks) {
    goHome = callbacks.onHome;
    adminToggle = getRequiredElement("admin-toggle");
    adminPanel = getRequiredElement("admin-panel");
    adminQuizTitle = getRequiredElement("admin-quiz-title");
    adminQuestionsList = getRequiredElement("admin-questions-list");
    adminAddQuestionBtn = getRequiredElement("admin-add-question");
    adminScanQuestionBtn = getRequiredElement("admin-scan-question");
    adminOcrInput = getRequiredElement("admin-ocr-input");
    adminSaveBtn = getRequiredElement("admin-save");
    adminExportBtn = getRequiredElement("admin-export");
    adminImportBtn = getRequiredElement("admin-import-btn");
    adminImportInput = getRequiredElement("admin-import-input");
    adminCancelBtn = getRequiredElement("admin-cancel");
    adminShareCode = getRequiredElement("admin-share-code");
    adminTimerMode = getRequiredElement("admin-timer-mode");
    adminTimerLimit = getRequiredElement("admin-timer-limit");
    adminShowResultsValue = getRequiredElement("admin-show-results-value");
    adminResultGroup = getRequiredElement("admin-result-visibility-group");
    adminQuizMode = getRequiredElement("admin-quiz-mode");
    adminShuffleQuestions = getRequiredElement("admin-shuffle-questions");
    adminShuffleAnswers = getRequiredElement("admin-shuffle-answers");
    // Segmented control events
    setupSegmentedControl();
    // Hide admin toggle by default (only show if admin access allowed)
    if (!isAdminAccessAllowed()) {
        adminToggle.style.display = "none";
    }
    // Wire up events immediately
    setupAdminEventsInternal();
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
    adminToggle.textContent = adminMode ? t('admin.playerMode') : t('admin.adminMode');
    if (adminMode) {
        // Initialize admin quiz from current quiz or create new
        if (quiz) {
            adminQuiz = { ...quiz.quiz };
        }
        else {
            adminQuiz = {
                id: generateQuizId(),
                title: t('admin.newQuiz'),
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
    // Global settings
    adminQuizMode.value = adminQuiz.mode || "practice";
    adminShuffleQuestions.checked = adminQuiz.shuffleConfig?.questions || false;
    adminShuffleAnswers.checked = adminQuiz.shuffleConfig?.answers || false;
    // Show results setting
    const currentVal = adminQuiz.showDetailedResults !== false ? "detailed" : "score";
    adminShowResultsValue.value = currentVal;
    updateSegmentedUI(currentVal);
    // Toggle time limit visibility based on mode
    try {
        updateTimerLimitVisibility();
    }
    catch (e) {
        console.error("Timer vis error", e);
    }
    // Ensure localized strings are up to date
    updatePageLanguage();
    adminTimerMode.onchange = () => {
        try {
            updateTimerLimitVisibility();
        }
        catch (e) {
            alert(t('admin.timerUpdateError') + ": " + e);
        }
    };
    adminQuestionsList.innerHTML = "";
    adminQuiz.questions.forEach((q, qIdx) => {
        const qDiv = document.createElement("div");
        qDiv.className = "admin-question-item";
        qDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="margin:0;">${t('admin.question')} ${qIdx + 1}</h3>
        <div style="display: flex; gap: 10px; align-items: center;">
          <label style="font-size: 0.9rem;">${t('admin.qType')}</label>
          <select class="admin-q-type-selector" data-qidx="${qIdx}" style="padding: 4px 8px; border-radius: 4px; background: rgba(0,0,0,0.2); color: white; border: 1px solid rgba(255,255,255,0.1);">
            <option value="multiple-choice" ${q.type === 'multiple-choice' || !q.type ? 'selected' : ''}>${t('admin.typeMC')}</option>
            <option value="numeric" ${q.type === 'numeric' ? 'selected' : ''}>${t('admin.typeNum')}</option>
            <option value="fill-blank" ${q.type === 'fill-blank' ? 'selected' : ''}>${t('admin.typeBlank')}</option>
            <option value="image-upload" ${q.type === 'image-upload' ? 'selected' : ''}>${t('admin.typeImage')}</option>
            <option value="text" ${q.type === 'text' ? 'selected' : ''}>${t('admin.typeText')}</option>
            <option value="true-false" ${q.type === 'true-false' ? 'selected' : ''}>${t('admin.typeTF')}</option>
          </select>
        </div>
      </div>
      
      <div class="admin-q-image-area" style="margin-bottom: 15px;">
        ${q.image ? `
          <div style="position: relative; display: inline-block;">
            <img src="${q.image}" style="max-height: 120px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);" />
            <button class="admin-remove-q-image btn btn-danger btn-icon" data-qidx="${qIdx}" 
                    style="position: absolute; top: -10px; right: -10px; width: 24px; height: 24px; padding: 0; min-width: 24px; font-size: 10px;">✕</button>
          </div>
        ` : `
          <button class="admin-add-q-image btn btn-secondary btn-icon" data-qidx="${qIdx}" style="font-size: 0.8rem; padding: 6px 12px;">
            ${t('admin.addImage')}
          </button>
        `}
      </div>

      <label>
        ${t('admin.promptLabel')}
        <textarea class="admin-question-prompt" data-qidx="${qIdx}">${q.prompt}</textarea>
      </label>
      
      <div class="admin-q-config-area" data-qidx="${qIdx}">
        ${renderQuestionConfig(q, qIdx)}
      </div>

      <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between;">
        <button class="admin-remove-question-btn btn btn-danger" data-qidx="${qIdx}">${t('admin.removeQuestion')}</button>
      </div>
    `;
        adminQuestionsList.appendChild(qDiv);
        // Wire up type selector
        const typeSelector = qDiv.querySelector('.admin-q-type-selector');
        typeSelector.onchange = () => {
            if (!adminQuiz)
                return;
            updateQuizFromDOM(); // Sync current inputs
            const newType = typeSelector.value;
            adminQuiz.questions[qIdx].type = newType;
            // Initialize basic data for type
            if (newType === 'multiple-choice') {
                adminQuiz.questions[qIdx].choices = [
                    { id: 'a', text: '', isCorrect: true },
                    { id: 'b', text: '', isCorrect: false }
                ];
            }
            else if (newType === 'numeric') {
                adminQuiz.questions[qIdx].correctAnswerNumber = 0;
            }
            else if (newType === 'fill-blank') {
                adminQuiz.questions[qIdx].blankAnswers = [];
            }
            renderAdminForm();
        };
        // Reactive listener for MCQ multiple-answer toggle
        qDiv.querySelector('.admin-mc-multiple')?.addEventListener('change', () => {
            if (!adminQuiz)
                return;
            updateQuizFromDOM();
            renderAdminForm(); // re-render to switch radio/checkbox
        });
        // Numeric change listeners
        qDiv.querySelectorAll('.admin-num-answer, .admin-num-tolerance, .admin-num-tolerance-type').forEach(input => {
            input.addEventListener('change', () => updateQuizFromDOM());
        });
        // Blank answers listener
        qDiv.querySelectorAll('.admin-blank-answer').forEach(input => {
            input.addEventListener('input', () => updateQuizFromDOM());
        });
        // Prompt listener (needed for state sync and detecting ___ for blanks)
        qDiv.querySelector('.admin-question-prompt')?.addEventListener('input', (e) => {
            if (!adminQuiz)
                return;
            const target = e.target;
            const prompt = target.value;
            const oldBlankCount = (adminQuiz.questions[qIdx].prompt.match(/___/g) || []).length;
            const newBlankCount = (prompt.match(/___/g) || []).length;
            if (adminQuiz.questions[qIdx].type === 'fill-blank' && oldBlankCount !== newBlankCount) {
                adminQuiz.questions[qIdx].prompt = prompt;
                renderAdminForm(); // Re-render to show correct number of blank inputs
            }
            else {
                adminQuiz.questions[qIdx].prompt = prompt;
            }
        });
        // Reactive Choice Text listeners
        qDiv.querySelectorAll('.admin-choice-text').forEach(input => {
            input.addEventListener('input', () => updateQuizFromDOM());
        });
        // Blank Insert Button logic
        qDiv.querySelector('.admin-insert-blank-btn')?.addEventListener('click', () => {
            const promptEl = qDiv.querySelector('.admin-question-prompt');
            const start = promptEl.selectionStart;
            const end = promptEl.selectionEnd;
            const text = promptEl.value;
            promptEl.value = text.substring(0, start) + "___" + text.substring(end);
            promptEl.focus();
            promptEl.setSelectionRange(start + 3, start + 3);
            // Trigger the input event manually to generate new blank inputs
            promptEl.dispatchEvent(new Event('input', { bubbles: true }));
        });
        // Wire up MCQ specific events if it's MC
        if (q.type === 'multiple-choice' || !q.type) {
            qDiv.querySelector(`.admin-add-choice-btn[data-qidx="${qIdx}"]`)?.addEventListener("click", () => {
                if (!adminQuiz)
                    return;
                updateQuizFromDOM();
                if (!adminQuiz.questions[qIdx].choices)
                    adminQuiz.questions[qIdx].choices = [];
                adminQuiz.questions[qIdx].choices.push({
                    id: String.fromCharCode(97 + adminQuiz.questions[qIdx].choices.length),
                    text: "",
                    isCorrect: false,
                });
                renderAdminForm();
            });
            const choicesList = qDiv.querySelector(`.admin-choices-list[data-qidx="${qIdx}"]`);
            choicesList.querySelectorAll(`.admin-remove-choice-btn`).forEach((btn) => {
                btn.addEventListener("click", (e) => {
                    if (!adminQuiz)
                        return;
                    const cIdx = parseInt(e.currentTarget.dataset.cidx);
                    if (!confirm(t('admin.confirmRemoveChoice')))
                        return;
                    updateQuizFromDOM();
                    adminQuiz.questions[qIdx].choices.splice(cIdx, 1);
                    renderAdminForm();
                });
            });
            choicesList.querySelectorAll(`input[type="checkbox"], input[type="radio"]`).forEach((input) => {
                input.addEventListener("change", (e) => {
                    if (!adminQuiz)
                        return;
                    updateQuizFromDOM(); // SYNC FIRST before potentially re-rendering
                    const target = e.target;
                    const cIdx = parseInt(target.dataset.cidx);
                    const allowMultiple = adminQuiz.questions[qIdx].allowMultipleAnswers;
                    if (!allowMultiple) {
                        adminQuiz.questions[qIdx].choices.forEach((c, idx) => {
                            c.isCorrect = idx === cIdx;
                        });
                        renderAdminForm(); // re-render to update radios
                    }
                    else {
                        adminQuiz.questions[qIdx].choices[cIdx].isCorrect = target.checked;
                    }
                });
            });
        }
        // Wire up T/F radio events
        if (q.type === 'true-false') {
            qDiv.querySelectorAll(`input[name="tf_${qIdx}"]`).forEach(radio => {
                radio.addEventListener('change', (e) => {
                    if (!adminQuiz)
                        return;
                    adminQuiz.questions[qIdx].isTrue = e.target.value === 'true';
                });
            });
        }
        // Wire up remove queston
        qDiv.querySelector(`.admin-remove-question-btn[data-qidx="${qIdx}"]`).addEventListener("click", () => {
            if (!adminQuiz)
                return;
            if (!confirm(t('admin.confirmRemoveQuestion')))
                return;
            updateQuizFromDOM();
            adminQuiz.questions.splice(qIdx, 1);
            renderAdminForm();
        });
        // Question Image Listeners
        qDiv.querySelector('.admin-add-q-image')?.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async (e) => {
                const file = e.target.files?.[0];
                if (file && adminQuiz) {
                    try {
                        const resizedBase64 = await resizeImage(file, 800);
                        adminQuiz.questions[qIdx].image = resizedBase64;
                        renderAdminForm();
                    }
                    catch (err) {
                        alert("Error processing image: " + err);
                    }
                }
            };
            input.click();
        });
        qDiv.querySelector('.admin-remove-q-image')?.addEventListener('click', () => {
            if (adminQuiz) {
                adminQuiz.questions[qIdx].image = undefined;
                renderAdminForm();
            }
        });
        // Choice Image Listeners
        qDiv.querySelectorAll('.admin-choice-add-image').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cIdx = parseInt(e.currentTarget.dataset.cidx);
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = async (ev) => {
                    const file = ev.target.files?.[0];
                    if (file && adminQuiz) {
                        try {
                            const resizedBase64 = await resizeImage(file, 600);
                            adminQuiz.questions[qIdx].choices[cIdx].image = resizedBase64;
                            renderAdminForm();
                        }
                        catch (err) {
                            alert("Error processing image: " + err);
                        }
                    }
                };
                input.click();
            });
        });
        qDiv.querySelectorAll('.admin-choice-remove-image').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cIdx = parseInt(e.currentTarget.dataset.cidx);
                if (adminQuiz) {
                    adminQuiz.questions[qIdx].choices[cIdx].image = undefined;
                    renderAdminForm();
                }
            });
        });
    });
}
function renderQuestionConfig(q, qIdx) {
    const type = q.type || 'multiple-choice';
    switch (type) {
        case 'multiple-choice':
            return `
        <div style="margin-bottom: 10px;">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.9rem;">
            <input type="checkbox" class="admin-mc-multiple" data-qidx="${qIdx}" ${q.allowMultipleAnswers ? 'checked' : ''} />
            ${t('admin.mcMultiple')}
          </label>
        </div>
        <div class="admin-choices-list" data-qidx="${qIdx}">
          ${(q.choices || []).map((choice, cIdx) => `
            <div class="admin-choice-item" style="flex-direction: column; align-items: stretch; gap: 8px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <input type="${q.allowMultipleAnswers ? 'checkbox' : 'radio'}" 
                       name="correct_${qIdx}" 
                       data-qidx="${qIdx}" 
                       data-cidx="${cIdx}" 
                       ${choice.isCorrect ? 'checked' : ''} />
                <input type="text" class="admin-choice-text" data-qidx="${qIdx}" data-cidx="${cIdx}" value="${choice.text}" style="flex:1;" />
                <button class="admin-choice-add-image btn btn-icon" data-qidx="${qIdx}" data-cidx="${cIdx}" style="font-size: 1rem; padding: 4px 8px;" title="${t('admin.addImage')}">🖼</button>
                <button class="admin-remove-choice-btn btn btn-danger btn-icon" data-qidx="${qIdx}" data-cidx="${cIdx}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
              ${choice.image ? `
                <div style="margin-left: 30px; position: relative; display: inline-block;">
                  <img src="${choice.image}" style="max-height: 80px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.05);" />
                  <button class="admin-choice-remove-image btn btn-danger" data-qidx="${qIdx}" data-cidx="${cIdx}" 
                          style="position: absolute; top: -5px; right: -5px; width: 18px; height: 18px; padding:0; min-width: 18px; font-size: 8px;">✕</button>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
        <button class="admin-add-choice-btn btn" data-qidx="${qIdx}">+ ${t('admin.addChoice')}</button>
      `;
        case 'numeric':
            return `
        <div style="display: flex; gap: 15px; align-items: flex-end;">
          <div style="flex: 2;">
            <label style="display: block; margin-bottom: 5px; font-size: 0.9rem;">${t('admin.numAnswer')}</label>
            <input type="number" class="admin-num-answer" data-qidx="${qIdx}" value="${q.correctAnswerNumber ?? ''}" style="width: 100%; padding: 8px;" />
          </div>
          <div style="flex: 1;">
            <label style="display: block; margin-bottom: 5px; font-size: 0.9rem;">${t('admin.numTolerance')}</label>
            <input type="number" class="admin-num-tolerance" data-qidx="${qIdx}" value="${q.toleranceValue ?? 0}" style="width: 100%; padding: 8px;" />
          </div>
          <div style="flex: 1;">
            <select class="admin-num-tolerance-type" data-qidx="${qIdx}" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.2); color:white; border: 1px solid rgba(255,255,255,0.1);">
              <option value="absolute" ${q.toleranceType === 'absolute' ? 'selected' : ''}>${t('admin.tolAbs')}</option>
              <option value="percentage" ${q.toleranceType === 'percentage' ? 'selected' : ''}>${t('admin.tolPct')}</option>
            </select>
          </div>
        </div>
      `;
        case 'fill-blank': {
            // Count ___ in prompt to show enough input fields
            const blankCount = (q.prompt.match(/___/g) || []).length;
            return `
        <div style="margin-bottom: 12px; display: flex; gap: 10px; align-items: center;">
          <button class="btn btn-secondary btn-icon admin-insert-blank-btn" data-qidx="${qIdx}" style="font-size: 0.8rem;">
            ➕ ${t('admin.insertBlank') || 'Įterpti tarpą (___)'}
          </button>
          <span style="font-size: 0.8rem; color: #fbbf24;">💡 ${t('admin.blankHint') || 'Naudokite ___ tarpams sukurti.'}</span>
        </div>
        <div class="admin-blanks-list" data-qidx="${qIdx}" style="display: flex; flex-direction: column; gap: 12px;">
          ${Array.from({ length: blankCount }).map((_, bIdx) => `
            <div style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 0.9rem; font-weight: bold; color: var(--accent); min-width: 90px;">Laukas ${bIdx + 1}:</span>
              <input type="text" class="admin-blank-answer" data-qidx="${qIdx}" data-bidx="${bIdx}" 
                     placeholder="Įveskite teisingą atsakymą..."
                     value="${q.blankAnswers?.[bIdx] || ''}" style="flex:1; padding: 10px; border-radius: 4px; background: rgba(0,0,0,0.2); color:white; border: 1px solid rgba(255,255,255,0.1);" />
            </div>
          `).join('')}
          ${blankCount === 0 ? `<p style="color: #ff9800; font-size: 0.85rem;">! Nepamirškite klausime įrašyti ___</p>` : ''}
        </div>
      `;
        }
        case 'true-false':
            return `
        <div style="display: flex; gap: 20px; margin-top: 10px;">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="radio" name="tf_${qIdx}" value="true" ${q.isTrue === true ? 'checked' : ''} />
            <span style="color: #4CAF50; font-weight: bold;">TRUE</span>
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="radio" name="tf_${qIdx}" value="false" ${q.isTrue === false ? 'checked' : ''} />
            <span style="color: #f44336; font-weight: bold;">FALSE</span>
          </label>
        </div>
      `;
        case 'text':
            return `
        <div style="margin-bottom: 15px;">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.9rem; margin-bottom: 8px;">
            <input type="checkbox" class="admin-text-long" data-qidx="${qIdx}" ${q.isLongAnswer ? 'checked' : ''} />
            ${t('admin.longAnswer')}
          </label>
          <label style="display: block; margin-bottom: 5px; font-size: 0.9rem;">${t('admin.keywords')}</label>
          <input type="text" class="admin-text-keywords" data-qidx="${qIdx}" value="${(q.expectedKeywords || []).join(', ')}" placeholder="keyword1, keyword2..." style="width: 100%; padding: 8px;" />
        </div>
      `;
        case 'image-upload':
            return `
        <div style="background: rgba(139, 92, 246, 0.1); border: 1px dashed var(--accent); padding: 15px; border-radius: 8px; text-align: center;">
          <p style="margin:0; font-size: 0.9rem;">${t('admin.imageUploadHint') || 'Studentas matys mygtuką nuotraukos įkėlimui. Vertinama bus rankiniu būdu.'}</p>
        </div>
      `;
        default:
            return '';
    }
}
// Helper to sync DOM to State
function updateQuizFromDOM() {
    if (!adminQuiz)
        return;
    if (adminQuizTitle)
        adminQuiz.title = adminQuizTitle.value;
    if (adminQuizMode)
        adminQuiz.mode = adminQuizMode.value;
    if (adminShuffleQuestions && adminShuffleAnswers) {
        adminQuiz.shuffleConfig = {
            questions: adminShuffleQuestions.checked,
            answers: adminShuffleAnswers.checked
        };
    }
    adminQuestionsList.querySelectorAll(".admin-question-item").forEach((qDiv) => {
        const promptArea = qDiv.querySelector(".admin-question-prompt");
        if (!promptArea)
            return;
        const qIdx = parseInt(promptArea.dataset.qidx);
        const q = adminQuiz.questions[qIdx];
        if (!q)
            return;
        q.prompt = promptArea.value;
        const typeSelector = qDiv.querySelector(".admin-q-type-selector");
        if (typeSelector)
            q.type = typeSelector.value;
        // Sync type-specific values with null-safety
        switch (q.type) {
            case 'multiple-choice':
                const multipleToggle = qDiv.querySelector(".admin-mc-multiple");
                if (multipleToggle)
                    q.allowMultipleAnswers = multipleToggle.checked;
                qDiv.querySelectorAll(".admin-choice-text").forEach((input) => {
                    const cIdx = parseInt(input.dataset.cidx);
                    if (q.choices && q.choices[cIdx]) {
                        q.choices[cIdx].text = input.value;
                    }
                });
                break;
            case 'numeric':
                const numAns = qDiv.querySelector(".admin-num-answer");
                const numTol = qDiv.querySelector(".admin-num-tolerance");
                const numTolType = qDiv.querySelector(".admin-num-tolerance-type");
                if (numAns)
                    q.correctAnswerNumber = parseFloat(numAns.value);
                if (numTol)
                    q.toleranceValue = parseFloat(numTol.value);
                if (numTolType)
                    q.toleranceType = numTolType.value;
                break;
            case 'fill-blank':
                q.blankAnswers = Array.from(qDiv.querySelectorAll(".admin-blank-answer")).map(input => input.value);
                break;
            case 'true-false':
                const radioChecked = qDiv.querySelector(`input[name="tf_${qIdx}"]:checked`);
                if (radioChecked)
                    q.isTrue = radioChecked.value === 'true';
                break;
            case 'text':
                const textLong = qDiv.querySelector(".admin-text-long");
                const kwInput = qDiv.querySelector(".admin-text-keywords");
                if (textLong)
                    q.isLongAnswer = textLong.checked;
                if (kwInput)
                    q.expectedKeywords = kwInput.value.split(',').map(s => s.trim()).filter(s => s);
                break;
        }
    });
}
function updateTimerLimitVisibility() {
    const limitContainer = adminTimerLimit.parentElement;
    if (adminTimerMode.value === "none") {
        limitContainer.style.display = "none";
    }
    else {
        limitContainer.style.display = "block";
    }
}
// Save admin quiz
export function saveAdminQuiz() {
    if (!adminQuiz)
        return;
    // Collect form data
    adminQuiz.title = adminQuizTitle.value.trim() || t('admin.untitledQuiz');
    // Save timer config
    adminQuiz.timerConfig = {
        mode: adminTimerMode.value,
        limitSeconds: parseInt(adminTimerLimit.value) || 30
    };
    // Save show results toggle
    adminQuiz.showDetailedResults = adminShowResultsValue.value === "detailed";
    // Sync from DOM
    updateQuizFromDOM();
    // Validate
    if (adminQuiz.questions.length === 0) {
        alert(t('admin.errorNoQuestions'));
        return;
    }
    for (const q of adminQuiz.questions) {
        if (!q.prompt.trim()) {
            alert(t('admin.errorNoPrompt'));
            return;
        }
        const qType = q.type || 'multiple-choice';
        if (qType === 'multiple-choice') {
            if (!q.choices || q.choices.length < 2) {
                alert(t('admin.errorNoChoices'));
                return;
            }
            if (!q.choices.some((c) => c.isCorrect)) {
                alert(t('admin.errorNoCorrect'));
                return;
            }
        }
        else if (qType === 'numeric') {
            if (q.correctAnswerNumber === undefined || isNaN(q.correctAnswerNumber)) {
                alert('Please enter a valid numeric answer.');
                return;
            }
        }
        else if (qType === 'fill-blank') {
            const blankCount = (q.prompt.match(/___/g) || []).length;
            if (blankCount > 0 && (!q.blankAnswers || q.blankAnswers.length < blankCount || q.blankAnswers.some(a => !a.trim()))) {
                alert('Please fill in all blank answers.');
                return;
            }
        }
    }
    // Save to localStorage
    saveQuizToStorage(adminQuiz);
    // Generate share code (UTF-8 safe base64 JSON)
    const jsonStr = JSON.stringify(adminQuiz);
    const bytes = new TextEncoder().encode(jsonStr);
    let binary = "";
    for (let i = 0; i < bytes.length; i++)
        binary += String.fromCharCode(bytes[i]);
    const shareCode = btoa(binary);
    if (shareCode.length > 8000) {
        alert("WARNING: Your quiz contains a lot of image data. The share URL might be too long for some browsers. Try removing images if the link doesn't work.");
    }
    const shareUrl = `${window.location.origin}${window.location.pathname}?quiz=${shareCode}`;
    const dashboardUrl = `${window.location.origin}${window.location.pathname}?dashboard=${adminQuiz.id}`;
    adminShareCode.style.display = "block";
    adminShareCode.innerHTML = `
    <div style="background: rgba(76, 175, 80, 0.1); border: 1px solid rgba(76, 175, 80, 0.3); padding: 15px; border-radius: 8px; margin-top: 15px;">
      <strong style="color: #4CAF50;">✓ ${t('admin.saveSuccess')}</strong><br><br>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">${t('admin.studentUrl')}:</label>
        <div style="display: flex; gap: 10px;">
          <input type="text" readonly value="${shareUrl}" id="share-url-input" style="flex: 1; padding: 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2); background: var(--bg); color: var(--text); font-size: 0.9rem;" />
          <button id="copy-share-url" class="btn btn-secondary" style="white-space: nowrap;">📋 ${t('admin.copy')}</button>
        </div>
      </div>

      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">${t('admin.dashboardUrl')}:</label>
        <div style="display: flex; gap: 10px;">
          <input type="text" readonly value="${dashboardUrl}" id="dash-url-input" style="flex: 1; padding: 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2); background: var(--bg); color: var(--text); font-size: 0.9rem;" />
          <button id="copy-dash-url" class="btn btn-secondary" style="white-space: nowrap;">📋 ${t('admin.copy')}</button>
        </div>
      </div>

      <label style="display: block; margin-bottom: 5px; font-weight: bold;">${t('admin.quizId')}:</label>
      <code style="background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px; display: inline-block;">${adminQuiz.id}</code>
    </div>
  `;
    // Wire up share copy button
    const copyBtn = document.getElementById('copy-share-url');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const input = document.getElementById('share-url-input');
            input.select();
            navigator.clipboard.writeText(shareUrl).then(() => {
                copyBtn.textContent = '✓ Copied!';
                setTimeout(() => { copyBtn.textContent = '📋 Copy'; }, 2000);
            });
        });
    }
    // Wire up dashboard copy button
    const dashCopyBtn = document.getElementById('copy-dash-url');
    if (dashCopyBtn) {
        dashCopyBtn.addEventListener('click', () => {
            const input = document.getElementById('dash-url-input');
            input.select();
            navigator.clipboard.writeText(dashboardUrl).then(() => {
                dashCopyBtn.textContent = '✓ Copied!';
                setTimeout(() => { dashCopyBtn.textContent = '📋 Copy'; }, 2000);
            });
        });
    }
    // NO AUTO-CLOSE - keep admin panel open for user convenience
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
function setupAdminEventsInternal() {
    adminToggle.addEventListener("click", toggleAdminMode);
    adminAddQuestionBtn.addEventListener("click", () => {
        try {
            if (!adminQuiz) {
                adminQuiz = {
                    id: generateQuizId(),
                    title: "New Quiz",
                    questions: [],
                };
            }
            // Sync before adding
            if (adminQuiz.questions.length > 0) {
                updateQuizFromDOM();
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
        }
        catch (e) {
            console.error(e);
            alert("Error adding question: " + e);
        }
    });
    // OCR button triggers file input
    adminScanQuestionBtn.addEventListener("click", () => {
        adminOcrInput.click();
    });
    // Handle file selection
    adminOcrInput.addEventListener("change", handleOCRUpload);
    adminSaveBtn.addEventListener("click", saveAdminQuiz);
    // Reactive listeners for global settings
    adminQuizMode.addEventListener('change', () => { if (adminQuiz)
        adminQuiz.mode = adminQuizMode.value; });
    adminShuffleQuestions.addEventListener('change', () => {
        if (adminQuiz) {
            adminQuiz.shuffleConfig = {
                questions: adminShuffleQuestions.checked,
                answers: adminQuiz.shuffleConfig?.answers || false
            };
        }
    });
    adminShuffleAnswers.addEventListener('change', () => {
        if (adminQuiz) {
            adminQuiz.shuffleConfig = {
                questions: adminQuiz.shuffleConfig?.questions || false,
                answers: adminShuffleAnswers.checked
            };
        }
    });
    adminTimerMode.addEventListener('change', () => {
        if (adminQuiz) {
            adminQuiz.timerConfig = { ...adminQuiz.timerConfig, mode: adminTimerMode.value, limitSeconds: parseInt(adminTimerLimit.value) };
            updateTimerLimitVisibility();
        }
    });
    adminTimerLimit.addEventListener('change', () => {
        if (adminQuiz && adminQuiz.timerConfig)
            adminQuiz.timerConfig.limitSeconds = parseInt(adminTimerLimit.value);
    });
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
                    alert(t('admin.importSuccess'));
                }
                else {
                    alert(t('admin.importInvalid'));
                }
            }
            catch (err) {
                alert(t('admin.importError'));
            }
        };
        reader.readAsText(file);
        e.target.value = ""; // Reset
    });
    adminCancelBtn.addEventListener("click", () => {
        if (confirm(t('admin.confirmCancel'))) {
            toggleAdminMode();
        }
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
            goHome();
        });
    }
}
function setupSegmentedControl() {
    const buttons = adminResultGroup.querySelectorAll(".segment-btn");
    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            const val = btn.getAttribute("data-value") || "detailed";
            adminShowResultsValue.value = val;
            updateSegmentedUI(val);
        });
    });
}
function updateSegmentedUI(value) {
    const buttons = adminResultGroup.querySelectorAll(".segment-btn");
    buttons.forEach(btn => {
        if (btn.getAttribute("data-value") === value) {
            btn.classList.add("active");
        }
        else {
            btn.classList.remove("active");
        }
    });
}
//# sourceMappingURL=admin.js.map
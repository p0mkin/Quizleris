import type { Quiz, Question, Choice } from "./types.js";
import { quiz } from "./state.js";
import { getRequiredElement } from "./dom.js";
import { generateQuizId, saveQuizToStorage, saveImageRegistry } from "./storage.js";
import { isAdminAccessAllowed, promptAdminPassword } from "./auth.js";
import { processOCRImage } from "./ocr.js";
import { t, updatePageLanguage } from "./lang.js";

// Admin UI state
let adminMode = false;
let adminQuiz: Quiz | null = null;

// Admin DOM elements
let adminToggle: HTMLButtonElement;
let adminPanel: HTMLElement;
let adminQuizTitle: HTMLInputElement;
let adminQuestionsList: HTMLElement;
let adminAddQuestionBtn: HTMLButtonElement;
let adminScanQuestionBtn: HTMLButtonElement;
let adminOcrInput: HTMLInputElement;
let adminSaveBtn: HTMLButtonElement;
let adminPreviewBtn: HTMLButtonElement;
let adminExportBtn: HTMLButtonElement;
let adminImportBtn: HTMLButtonElement;
let adminImportInput: HTMLInputElement;
let adminCancelBtn: HTMLButtonElement;
let adminShareCode: HTMLElement;
let adminTimerMode: HTMLSelectElement;
let adminTimerLimit: HTMLInputElement;
let adminShowResultsValue: HTMLInputElement;
let adminResultGroup: HTMLElement;
let adminQuizMode: HTMLSelectElement;
let adminShuffleQuestions: HTMLInputElement;
let adminShuffleAnswers: HTMLInputElement;

// Callbacks
let goHome: () => void = () => { };

/**
 * Refresh admin toggle button visibility based on authorization.
 * Ensures the toggle isn't visible to students unless they have the secret param or session.
 */
export function refreshAdminToggleVisibility(): void {
    if (!adminToggle) return;

    // Always hide in preview mode to avoid confusion
    const params = new URLSearchParams(window.location.search);
    if (params.get("preview") === "true") {
        adminToggle.style.display = "none";
        return;
    }

    adminToggle.style.display = isAdminAccessAllowed() ? "block" : "none";
}

export function refreshAdminUI(): void {
    if (adminMode && adminQuiz) {
        renderAdminForm();
    }
}

/**
 * Entry point for Admin UI. Binds all major DOM elements and sets up standard events.
 * Also performs an initial visibility check for the admin toggle.
 */
export function setupAdmin(callbacks: { onHome: () => void }): void {
    goHome = callbacks.onHome;

    adminToggle = getRequiredElement("admin-toggle") as HTMLButtonElement;
    adminPanel = getRequiredElement("admin-panel");
    // ... (rest of the assignments)
    adminQuizTitle = getRequiredElement("admin-quiz-title") as HTMLInputElement;
    adminQuestionsList = getRequiredElement("admin-questions-list");
    adminAddQuestionBtn = getRequiredElement("admin-add-question") as HTMLButtonElement;
    adminScanQuestionBtn = getRequiredElement("admin-scan-question") as HTMLButtonElement;
    adminOcrInput = getRequiredElement("admin-ocr-input") as HTMLInputElement;
    adminSaveBtn = getRequiredElement("admin-save") as HTMLButtonElement;
    adminPreviewBtn = getRequiredElement("admin-preview") as HTMLButtonElement;
    adminExportBtn = getRequiredElement("admin-export") as HTMLButtonElement;
    adminImportBtn = getRequiredElement("admin-import-btn") as HTMLButtonElement;
    adminImportInput = getRequiredElement("admin-import-input") as HTMLInputElement;
    adminCancelBtn = getRequiredElement("admin-cancel") as HTMLButtonElement;
    adminShareCode = getRequiredElement("admin-share-code");
    adminTimerMode = getRequiredElement("admin-timer-mode") as HTMLSelectElement;
    adminTimerLimit = getRequiredElement("admin-timer-limit") as HTMLInputElement;
    adminShowResultsValue = getRequiredElement("admin-show-results-value") as HTMLInputElement;
    adminResultGroup = getRequiredElement("admin-result-visibility-group");
    adminQuizMode = getRequiredElement("admin-quiz-mode") as HTMLSelectElement;
    adminShuffleQuestions = getRequiredElement("admin-shuffle-questions") as HTMLInputElement;
    adminShuffleAnswers = getRequiredElement("admin-shuffle-answers") as HTMLInputElement;

    setupSegmentedControl();

    refreshAdminToggleVisibility();

    setupAdminEventsInternal();
}

/**
 * Main routine to switch between Student (Player) and Admin (Editor) views.
 * Handles password prompting if not already authorized.
 */
export function toggleAdminMode(): void {
    if (!isAdminAccessAllowed()) {
        if (!promptAdminPassword()) return;
        refreshAdminToggleVisibility();
    }

    adminMode = !adminMode;
    // UI state sync
    adminPanel.style.display = adminMode ? "block" : "none";
    adminToggle.textContent = adminMode ? t('admin.playerMode') : t('admin.adminMode');

    if (adminMode) {
        if (quiz) {
            // Shadow copy of current quiz to edit
            adminQuiz = { ...quiz.quiz };
        } else {
            // New quiz scaffold
            adminQuiz = {
                id: generateQuizId(),
                title: t('admin.newQuiz'),
                questions: [],
            };
        }
        renderAdminForm();
    }
}

/**
 * Heavy UI rendering function for the Admin Editor.
 * Rebuilds the entire question list DOM based on the current 'adminQuiz' state.
 */
export function renderAdminForm(): void {
    if (!adminQuiz) return;
    // ... existing implementation
    if (!adminQuiz) return;

    adminQuizTitle.value = adminQuiz.title;

    if (!adminQuiz.timerConfig) {
        adminTimerMode.value = "question";
        adminTimerLimit.value = "30";
    } else {
        adminTimerMode.value = adminQuiz.timerConfig.mode;
        adminTimerLimit.value = String(adminQuiz.timerConfig.limitSeconds);
    }

    adminQuizMode.value = adminQuiz.mode || "practice";
    adminShuffleQuestions.checked = adminQuiz.shuffleConfig?.questions || false;
    adminShuffleAnswers.checked = adminQuiz.shuffleConfig?.answers || false;

    const currentVal = adminQuiz.showDetailedResults !== false ? "detailed" : "score";
    adminShowResultsValue.value = currentVal;
    updateSegmentedUI(currentVal);

    updateTimerLimitVisibility();
    updatePageLanguage();

    adminTimerMode.onchange = () => updateTimerLimitVisibility();

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
            <img src="${q.image.startsWith("data:") ? q.image : "data:image/jpeg;base64," + q.image}" style="max-height: 120px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);" />
            <button class="admin-remove-q-image btn btn-danger btn-icon" data-qidx="${qIdx}" 
                    style="position: absolute; top: -10px; right: -10px; width: 24px; height: 24px; padding: 0; min-width: 24px; font-size: 10px;">✕</button>
          </div>
        ` : `
          <button class="admin-add-q-image btn btn-light" data-qidx="${qIdx}">
            📷 ${t('admin.addImage')}
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

        const typeSelector = qDiv.querySelector('.admin-q-type-selector') as HTMLSelectElement;
        typeSelector.onchange = () => {
            if (!adminQuiz) return;
            updateQuizFromDOM();
            const newType = typeSelector.value as any;
            adminQuiz.questions[qIdx].type = newType;
            if (newType === 'multiple-choice') {
                adminQuiz.questions[qIdx].choices = [{ id: 'a', text: '', isCorrect: true }, { id: 'b', text: '', isCorrect: false }];
            } else if (newType === 'numeric') {
                adminQuiz.questions[qIdx].correctAnswerNumber = 0;
            } else if (newType === 'fill-blank') {
                adminQuiz.questions[qIdx].blankAnswers = [];
            }
            renderAdminForm();
        };

        qDiv.querySelector('.admin-mc-multiple')?.addEventListener('change', () => { updateQuizFromDOM(); renderAdminForm(); });
        qDiv.querySelectorAll('.admin-num-answer, .admin-num-tolerance, .admin-num-tolerance-type, .admin-blank-answer').forEach(input => {
            input.addEventListener('input', () => updateQuizFromDOM());
        });

        qDiv.querySelector('.admin-question-prompt')?.addEventListener('input', (e) => {
            if (!adminQuiz) return;
            const target = e.target as HTMLTextAreaElement;
            const prompt = target.value;
            const oldBlankCount = (adminQuiz.questions[qIdx].prompt.match(/___/g) || []).length;
            const newBlankCount = (prompt.match(/___/g) || []).length;
            adminQuiz.questions[qIdx].prompt = prompt;
            if (adminQuiz.questions[qIdx].type === 'fill-blank' && oldBlankCount !== newBlankCount) {
                renderAdminForm();
            }
        });

        qDiv.querySelectorAll('.admin-choice-text').forEach(input => input.addEventListener('input', () => updateQuizFromDOM()));

        qDiv.querySelector('.admin-insert-blank-btn')?.addEventListener('click', () => {
            const promptEl = qDiv.querySelector('.admin-question-prompt') as HTMLTextAreaElement;
            const start = promptEl.selectionStart;
            const end = promptEl.selectionEnd;
            const text = promptEl.value;
            promptEl.value = text.substring(0, start) + "___" + text.substring(end);
            promptEl.focus();
            promptEl.setSelectionRange(start + 3, start + 3);
            promptEl.dispatchEvent(new Event('input', { bubbles: true }));
        });

        if (q.type === 'multiple-choice' || !q.type) {
            qDiv.querySelector(`.admin-add-choice-btn`)?.addEventListener("click", () => {
                if (!adminQuiz) return;
                updateQuizFromDOM();
                if (!adminQuiz.questions[qIdx].choices) adminQuiz.questions[qIdx].choices = [];
                adminQuiz.questions[qIdx].choices!.push({ id: String.fromCharCode(97 + adminQuiz.questions[qIdx].choices!.length), text: "", isCorrect: false });
                renderAdminForm();
            });

            const choicesList = qDiv.querySelector(`.admin-choices-list`)!;
            choicesList.querySelectorAll(`.admin-remove-choice-btn`).forEach((btn) => {
                btn.addEventListener("click", (e) => {
                    if (!adminQuiz) return;
                    const cIdx = parseInt((e.currentTarget as HTMLButtonElement).dataset.cidx!);
                    if (!confirm(t('admin.confirmRemoveChoice'))) return;
                    updateQuizFromDOM();
                    adminQuiz.questions[qIdx].choices!.splice(cIdx, 1);
                    renderAdminForm();
                });
            });

            choicesList.querySelectorAll(`input[type="checkbox"], input[type="radio"]`).forEach((input) => {
                input.addEventListener("change", (e) => {
                    if (!adminQuiz) return;
                    updateQuizFromDOM();
                    const target = e.target as HTMLInputElement;
                    const idx = parseInt(target.dataset.cidx!);
                    const allowMultiple = adminQuiz.questions[qIdx].allowMultipleAnswers;
                    if (!allowMultiple) {
                        adminQuiz.questions[qIdx].choices!.forEach((c, cIdx) => c.isCorrect = idx === cIdx);
                        renderAdminForm();
                    } else {
                        adminQuiz.questions[qIdx].choices![idx].isCorrect = target.checked;
                    }
                });
            });
        }

        if (q.type === 'true-false') {
            qDiv.querySelectorAll(`input[name="tf_${qIdx}"]`).forEach(radio => {
                radio.addEventListener('change', (e) => {
                    if (!adminQuiz) return;
                    adminQuiz.questions[qIdx].isTrue = (e.target as HTMLInputElement).value === 'true';
                });
            });
        }

        qDiv.querySelector(`.admin-remove-question-btn`)!.addEventListener("click", () => {
            if (!adminQuiz) return;
            if (!confirm(t('admin.confirmRemoveQuestion'))) return;
            updateQuizFromDOM();
            adminQuiz.questions.splice(qIdx, 1);
            renderAdminForm();
        });

        qDiv.querySelector('.admin-add-q-image')?.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file && adminQuiz) {
                    try {
                        const resizedBase64 = await resizeImage(file, 640);
                        adminQuiz.questions[qIdx].image = resizedBase64;
                        renderAdminForm();
                    } catch (err) { alert("Error processing image: " + err); }
                }
            };
            input.click();
        });

        qDiv.querySelector('.admin-remove-q-image')?.addEventListener('click', () => {
            if (adminQuiz) { adminQuiz.questions[qIdx].image = undefined; renderAdminForm(); }
        });

        qDiv.querySelectorAll('.admin-choice-add-image').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cIdx = parseInt((e.currentTarget as HTMLElement).dataset.cidx!);
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = async (ev) => {
                    const file = (ev.target as HTMLInputElement).files?.[0];
                    if (file && adminQuiz) {
                        try {
                            const resizedBase64 = await resizeImage(file, 480);
                            adminQuiz.questions[qIdx].choices![cIdx].image = resizedBase64;
                            renderAdminForm();
                        } catch (err) { alert("Error processing image: " + err); }
                    }
                };
                input.click();
            });
        });

        qDiv.querySelectorAll('.admin-choice-remove-image').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cIdx = parseInt((e.currentTarget as HTMLElement).dataset.cidx!);
                if (adminQuiz) { adminQuiz.questions[qIdx].choices![cIdx].image = undefined; renderAdminForm(); }
            });
        });
    });
}

function renderQuestionConfig(q: Question, qIdx: number): string {
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
          ${(q.choices || []).map((choice: Choice, cIdx: number) => `
            <div class="admin-choice-item" style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                <input type="${q.allowMultipleAnswers ? 'checkbox' : 'radio'}" name="correct_${qIdx}" ${choice.isCorrect ? 'checked' : ''} data-cidx="${cIdx}" />
                <input type="text" class="admin-choice-text" data-qidx="${qIdx}" data-cidx="${cIdx}" value="${choice.text || ''}" style="flex:1; padding: 8px; border: 1px solid rgba(0,0,0,0.2); border-radius: 4px;" />
                
                ${choice.image ? `
                  <div style="position: relative; display: inline-block;">
                    <img src="${choice.image.startsWith("data:") ? choice.image : "data:image/jpeg;base64," + choice.image}" style="max-height: 40px; border-radius: 4px;" />
                    <button class="admin-choice-remove-image btn btn-danger" data-cidx="${cIdx}" style="position: absolute; top: -5px; right: -5px; width: 14px; height: 14px; padding:0; min-width: 14px; font-size: 8px;">✕</button>
                  </div>
                ` : `
                  <button class="admin-choice-add-image btn btn-light btn-icon" data-cidx="${cIdx}" title="${t('admin.addImage')}">📷</button>
                `}
                
                <button class="admin-remove-choice-btn btn btn-danger btn-icon" data-cidx="${cIdx}">✕</button>
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
            <select class="admin-num-tolerance-type" data-qidx="${qIdx}" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.2); color:white;">
              <option value="absolute" ${q.toleranceType === 'absolute' ? 'selected' : ''}>${t('admin.tolAbs')}</option>
              <option value="percentage" ${q.toleranceType === 'percentage' ? 'selected' : ''}>${t('admin.tolPct')}</option>
            </select>
          </div>
        </div>
      `;
        case 'fill-blank': {
            const blankCount = (q.prompt.match(/___/g) || []).length;
            return `
        <div style="margin-bottom: 12px; display: flex; gap: 10px; align-items: center;">
          <button class="btn btn-secondary btn-icon admin-insert-blank-btn" style="font-size: 0.8rem;">➕ ${t('admin.insertBlank')}</button>
          <span style="font-size: 0.8rem; color: #fbbf24;">💡 ${t('admin.blankHint')}</span>
        </div>
        <div class="admin-blanks-list" data-qidx="${qIdx}" style="display: flex; flex-direction: column; gap: 12px;">
          ${Array.from({ length: blankCount }).map((_, bIdx) => `
            <div style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 6px; display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 0.9rem; font-weight: bold; color: var(--accent); min-width: 90px;">Laukas ${bIdx + 1}:</span>
              <input type="text" class="admin-blank-answer" data-qidx="${qIdx}" data-bidx="${bIdx}" value="${q.blankAnswers?.[bIdx] || ''}" style="flex:1; padding: 10px; background: rgba(0,0,0,0.2); color:white;" />
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
          <input type="text" class="admin-text-keywords" data-qidx="${qIdx}" value="${(q.expectedKeywords || []).join(', ')}" style="width: 100%; padding: 8px;" />
        </div>
      `;
        case 'image-upload':
            return `<div style="background: rgba(139, 92, 246, 0.1); padding: 15px; border-radius: 8px; text-align: center;"><p style="margin:0; font-size: 0.9rem;">${t('admin.imageUploadHint')}</p></div>`;
        default: return '';
    }
}

/**
 * Synchronization function that reads values from DOM inputs back into the 'adminQuiz' object.
 * This is called before any state-modifying action (Save, Export, Add Question).
 */
function updateQuizFromDOM(): void {
    if (!adminQuiz) return;
    adminQuiz.title = adminQuizTitle.value;
    adminQuiz.mode = adminQuizMode.value as any;
    adminQuiz.shuffleConfig = { questions: adminShuffleQuestions.checked, answers: adminShuffleAnswers.checked };

    adminQuestionsList.querySelectorAll(".admin-question-item").forEach((qDiv) => {
        const promptArea = qDiv.querySelector(".admin-question-prompt") as HTMLTextAreaElement;
        if (!promptArea) return;
        const qIdx = parseInt(promptArea.dataset.qidx!);
        const q = adminQuiz!.questions[qIdx];
        if (!q) return;
        q.prompt = promptArea.value;
        const typeSelector = qDiv.querySelector(".admin-q-type-selector") as HTMLSelectElement;
        if (typeSelector) q.type = typeSelector.value as any;

        switch (q.type) {
            case 'multiple-choice':
                const multToggle = qDiv.querySelector(".admin-mc-multiple") as HTMLInputElement;
                if (multToggle) q.allowMultipleAnswers = multToggle.checked;
                qDiv.querySelectorAll(".admin-choice-text").forEach((input) => {
                    const idx = parseInt((input as HTMLElement).dataset.cidx!);
                    if (q.choices?.[idx]) q.choices[idx].text = (input as HTMLInputElement).value;
                });
                break;
            case 'numeric':
                q.correctAnswerNumber = parseFloat((qDiv.querySelector(".admin-num-answer") as HTMLInputElement)?.value);
                q.toleranceValue = parseFloat((qDiv.querySelector(".admin-num-tolerance") as HTMLInputElement)?.value);
                q.toleranceType = (qDiv.querySelector(".admin-num-tolerance-type") as HTMLSelectElement)?.value as any;
                break;
            case 'fill-blank':
                q.blankAnswers = Array.from(qDiv.querySelectorAll(".admin-blank-answer")).map(i => (i as HTMLInputElement).value);
                break;
            case 'true-false':
                const checked = qDiv.querySelector(`input[name="tf_${qIdx}"]:checked`) as HTMLInputElement;
                if (checked) q.isTrue = checked.value === 'true';
                break;
            case 'text':
                q.isLongAnswer = (qDiv.querySelector(".admin-text-long") as HTMLInputElement)?.checked;
                q.expectedKeywords = (qDiv.querySelector(".admin-text-keywords") as HTMLInputElement)?.value.split(',').map(s => s.trim()).filter(s => s);
                break;
        }
    });
}

function updateTimerLimitVisibility(): void {
    const parent = adminTimerLimit.parentElement as HTMLElement;
    if (parent) parent.style.display = adminTimerMode.value === "none" ? "none" : "block";
}

/**
 * Finalizes the quiz editing process.
 * 1. Syncs DOM state
 * 2. Compresses/Optimizes images for sharing
 * 3. Generates a Base64-encoded shareable URL
 * 4. Saves locally to storage
 */
/**
 * Finalizes the quiz editing process.
 * 1. Syncs DOM state
 * 2. Compresses/Optimizes images for sharing
 * 3. Generates a Base64-encoded shareable URL
 * 4. Saves locally to storage
 */
export function saveAdminQuiz(): void {
    if (!adminQuiz) return;
    updateQuizFromDOM();
    if (adminQuiz.questions.length === 0) { alert(t('admin.errorNoQuestions')); return; }

    saveQuizToStorage(adminQuiz);

    const { shareCode, registry } = exportQuizForSharing(adminQuiz);

    saveImageRegistry(adminQuiz.id, registry);
    if (shareCode.length > 8000) alert("WARNING: Quiz data very large. URL might fail.");

    // Fix: Ensure we point to root, stripping subpaths like /topics
    let path = window.location.pathname;
    if (path.endsWith("/topics") || path.endsWith("/topics/")) {
        path = path.replace(/\/topics\/?$/, "/");
    }
    // Ensure path ends with / or is basically empty
    if (!path.endsWith("/")) path += "/";

    // Actually, safest is just origin + / if we assume root deployment
    const base = window.location.origin + path;

    const shareUrl = `${base}?quiz=${shareCode}`;
    const dashUrl = `${base}?dashboard=${adminQuiz.id}`;

    adminShareCode.style.display = "block";
    adminShareCode.innerHTML = `
        <div style="background: rgba(76, 175, 80, 0.1); border: 1px solid rgba(76, 175, 80, 0.3); padding: 15px; border-radius: 8px;">
            <strong style="color: #4CAF50;">✓ ${t('admin.saveSuccess')}</strong><br><br>
            <div style="margin-bottom: 10px;">
                <label style="display: block; font-weight: bold;">Student URL:</label>
                <div style="display: flex; gap: 10px;">
                    <input type="text" readonly value="${shareUrl}" id="share-url-input" style="flex: 1; padding: 8px; background: rgba(0,0,0,0.2); color: white; border: 1px solid rgba(255,255,255,0.1);" />
                    <button id="copy-share-btn" class="btn btn-secondary">Copy</button>
                </div>
            </div>
            <div style="margin-bottom: 10px;">
                <label style="display: block; font-weight: bold;">Dashboard URL:</label>
                <div style="display: flex; gap: 10px;">
                    <input type="text" readonly value="${dashUrl}" id="dash-url-input" style="flex: 1; padding: 8px; background: rgba(0,0,0,0.2); color: white; border: 1px solid rgba(255,255,255,0.1);" />
                    <button id="copy-dash-btn" class="btn btn-secondary">Copy</button>
                </div>
            </div>
            <div><label style="display: block; font-weight: bold;">Quiz ID:</label><code>${adminQuiz.id}</code></div>
        </div>`;

    document.getElementById('copy-share-btn')?.addEventListener('click', () => {
        const input = document.getElementById('share-url-input') as HTMLInputElement;
        input.select(); navigator.clipboard.writeText(shareUrl); alert("Copied!");
    });
    document.getElementById('copy-dash-btn')?.addEventListener('click', () => {
        const input = document.getElementById('dash-url-input') as HTMLInputElement;
        input.select(); navigator.clipboard.writeText(dashUrl); alert("Copied!");
    });
}

function exportQuizForSharing(sourceQuiz: Quiz): { shareCode: string, registry: Record<string, string> } {
    const quizToShare: Quiz = JSON.parse(JSON.stringify(sourceQuiz));
    const registry: Record<string, string> = {};
    let imgCounter = 1;

    quizToShare.questions.forEach(q => {
        if (q.image && q.image.startsWith("data:")) {
            const imgId = `img${imgCounter++}`;
            registry[imgId] = q.image;
            q.image = `local:${imgId}`;
        }
        q.choices?.forEach(c => {
            if (c.image && c.image.startsWith("data:")) {
                const imgId = `img${imgCounter++}`;
                registry[imgId] = c.image;
                c.image = `local:${imgId}`;
            }
        });
    });

    const bytes = new TextEncoder().encode(JSON.stringify(quizToShare));
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const shareCode = btoa(binary);

    return { shareCode, registry };
}

export function previewQuiz(): void {
    if (!adminQuiz) return;
    updateQuizFromDOM();

    // We export to get the image registry populated
    const { shareCode, registry } = exportQuizForSharing(adminQuiz);

    // CRITICAL: We MUST save the image registry so the new tab can resolve 'local:img...' references.
    // This is a side effect (saving to localStorage), but necessary for the preview to work with heavy images.
    saveImageRegistry(adminQuiz.id, registry);

    const base = window.location.origin + window.location.pathname;
    const previewUrl = `${base}?quiz=${shareCode}&preview=true`;

    window.open(previewUrl, "_blank");
}

async function handleOCRUpload(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !adminQuiz) return;
    adminScanQuestionBtn.textContent = "Processing...";
    try {
        const result = await processOCRImage(file);
        if (result) {
            adminQuiz.questions.push({ id: `q${adminQuiz.questions.length + 1}`, prompt: result.prompt, choices: result.choices.map((t, i) => ({ id: String.fromCharCode(97 + i), text: t, isCorrect: i === 0 })) });
            renderAdminForm();
        }
    } catch (e) { alert("OCR failed"); } finally { adminScanQuestionBtn.textContent = t('admin.scanOCR'); }
}

function setupAdminEventsInternal(): void {
    adminToggle.addEventListener("click", toggleAdminMode);
    adminAddQuestionBtn.addEventListener("click", () => {
        if (!adminQuiz) adminQuiz = { id: generateQuizId(), title: "New Quiz", questions: [] };
        updateQuizFromDOM();
        adminQuiz.questions.push({ id: `q${adminQuiz.questions.length + 1}`, prompt: "", choices: [{ id: "a", text: "", isCorrect: true }, { id: "b", text: "", isCorrect: false }] });
        renderAdminForm();
    });
    adminScanQuestionBtn.addEventListener("click", () => adminOcrInput.click());
    adminOcrInput.addEventListener("change", handleOCRUpload);
    adminSaveBtn.addEventListener("click", saveAdminQuiz);
    adminPreviewBtn.addEventListener("click", previewQuiz);
    adminExportBtn.addEventListener("click", () => {
        if (!adminQuiz) return; const blob = new Blob([JSON.stringify(adminQuiz, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'quiz.json'; a.click();
    });
    adminImportBtn.addEventListener("click", () => adminImportInput.click());
    adminImportInput.addEventListener("change", (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => { try { const json = JSON.parse(ev.target?.result as string); if (json.questions) { adminQuiz = json; renderAdminForm(); } } catch (e) { alert("Import failed"); } };
        reader.readAsText(file);
    });
    adminCancelBtn.addEventListener("click", () => { if (confirm(t('admin.confirmCancel'))) toggleAdminMode(); });

    document.getElementById("admin-btn-back")?.addEventListener("click", () => {
        if (adminMode) toggleAdminMode();
        goHome();
    });
}

function setupSegmentedControl(): void {
    adminResultGroup.querySelectorAll(".segment-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const val = btn.getAttribute("data-value") || "detailed";
            adminShowResultsValue.value = val;
            updateSegmentedUI(val);
            if (adminQuiz) adminQuiz.showDetailedResults = val === "detailed";
        });
    });
}

function updateSegmentedUI(value: string): void {
    adminResultGroup.querySelectorAll(".segment-btn").forEach(btn => {
        if (btn.getAttribute("data-value") === value) btn.classList.add("active");
        else btn.classList.remove("active");
    });
}

/**
 * Downscales and compresses uploaded images to keep Base64 strings within reasonable limits.
 * Uses a canvas-based approach to convert to JPEG with 50% quality.
 */
async function resizeImage(file: File, maxDim: number): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width, h = img.height;
                if (w > h) { if (w > maxDim) { h *= maxDim / w; w = maxDim; } }
                else { if (h > maxDim) { w *= maxDim / h; h = maxDim; } }
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', 0.5));
            };
            img.onerror = reject;
            img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

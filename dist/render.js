import { QuizState, quiz, setQuiz } from "./state.js";
import { questionContainer, answersContainer, statusContainer } from "./dom.js";
import { startTimer, clearTimer } from "./timer.js";
import { saveResult } from "./storage.js";
import { renderStartMenu } from "./menu.js";
import { t } from "./i18n.js";
function isSafeUrl(url) {
    if (!url)
        return false;
    // Allow data URLs for images
    if (url.startsWith('data:image/'))
        return true;
    // Allow local registry references
    if (url.startsWith('local:img'))
        return true;
    // Allow http/https URLs
    try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
    }
    catch {
        // Fallback for relative paths if any (though not expected in this app)
        return url.startsWith('./') || url.startsWith('/');
    }
}
// Render question prompt
export function renderQuestion(q) {
    const typeLabel = q.type === 'multiple-choice' ?
        (q.allowMultipleAnswers ? t('quiz.mcSelectAll') : t('quiz.mcSelectOne')) : '';
    questionContainer.innerHTML = ""; // Clear
    // Header
    const header = document.createElement("div");
    header.className = "prompt-header";
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";
    header.style.marginBottom = "10px";
    if (typeLabel) {
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.style.background = "var(--accent)";
        badge.style.color = "white";
        badge.textContent = typeLabel;
        header.appendChild(badge);
    }
    else {
        header.appendChild(document.createElement("span"));
    }
    questionContainer.appendChild(header);
    // Image
    if (q.image && isSafeUrl(q.image)) {
        const imgDiv = document.createElement("div");
        imgDiv.className = "question-image";
        imgDiv.style.marginBottom = "15px";
        imgDiv.style.textAlign = "center";
        const img = document.createElement("img");
        img.src = q.image;
        img.style.maxWidth = "100%";
        img.style.maxHeight = "300px";
        img.style.borderRadius = "8px";
        img.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
        imgDiv.appendChild(img);
        questionContainer.appendChild(imgDiv);
    }
    // Prompt
    const prompt = document.createElement("div");
    prompt.className = "prompt";
    prompt.textContent = q.prompt;
    questionContainer.appendChild(prompt);
    // Ask KaTeX to render LaTeX
    window.renderMathInElement(questionContainer, {
        delimiters: [
            { left: "\\(", right: "\\)", display: false },
            { left: "\\[", right: "\\]", display: true },
        ],
    });
}
// Main Answers Dispatcher
export function renderAnswers(q) {
    const type = q.type || 'multiple-choice';
    answersContainer.innerHTML = "";
    answersContainer.className = "answers-container " + type;
    switch (type) {
        case 'multiple-choice':
            renderMCQ(q);
            break;
        case 'numeric':
            renderNumeric(q);
            break;
        case 'fill-blank':
            renderFillBlank(q);
            break;
        case 'true-false':
            renderTrueFalse(q);
            break;
        case 'text':
            renderTextInput(q);
            break;
        case 'image-upload':
            renderImageUpload(q);
            break;
    }
    window.renderMathInElement(answersContainer, {
        delimiters: [
            { left: "\\(", right: "\\)", display: false },
            { left: "\\[", right: "\\]", display: true },
        ],
    });
}
function renderMCQ(q) {
    const allowMultiple = q.allowMultipleAnswers;
    const currentAnswer = quiz?.userAnswers.get(q.id) || [];
    const isAnswered = quiz?.hasAnswered && quiz.quiz.mode !== 'exam';
    q.choices?.forEach((choice) => {
        const btn = document.createElement("button");
        btn.className = "answer-btn mc-btn";
        if (allowMultiple)
            btn.classList.add("checkbox-style");
        btn.dataset.choiceId = choice.id;
        const indicator = document.createElement("div");
        indicator.className = "mc-indicator";
        indicator.textContent = allowMultiple ? '' : choice.id.toUpperCase();
        btn.appendChild(indicator);
        const content = document.createElement("div");
        content.className = "mc-content";
        content.style.display = "flex";
        content.style.flexDirection = "column";
        content.style.gap = "8px";
        content.style.flex = "1";
        if (choice.image && isSafeUrl(choice.image)) {
            const img = document.createElement("img");
            img.src = choice.image;
            img.style.maxHeight = "120px";
            img.style.width = "auto";
            img.style.alignSelf = "flex-start";
            img.style.borderRadius = "4px";
            content.appendChild(img);
        }
        const text = document.createElement("div");
        text.className = "mc-text";
        text.textContent = choice.text;
        content.appendChild(text);
        btn.appendChild(content);
        if (Array.isArray(currentAnswer) && currentAnswer.includes(choice.id)) {
            btn.classList.add("selected");
        }
        if (!isAnswered) {
            btn.onclick = () => {
                if (quiz?.quiz.mode === 'exam') {
                    toggleMCSelection(q.id, choice.id, btn, !!allowMultiple);
                }
                else {
                    if (allowMultiple) {
                        toggleMCSelection(q.id, choice.id, btn, true);
                    }
                    else {
                        onAnswer(choice.id);
                    }
                }
            };
        }
        else {
            // Feedback mode
            if (choice.isCorrect)
                btn.classList.add("correct");
            if (Array.isArray(currentAnswer) && currentAnswer.includes(choice.id) && !choice.isCorrect) {
                btn.classList.add("incorrect");
            }
            btn.disabled = true;
        }
        answersContainer.appendChild(btn);
    });
    if (allowMultiple && !isAnswered) {
        const submitBtn = document.createElement("button");
        submitBtn.className = "btn btn-primary submit-mc-btn";
        submitBtn.textContent = (quiz?.quiz.mode === 'exam') ? t('quiz.answered') : t('quiz.nextQuestion');
        submitBtn.onclick = () => {
            const selected = Array.from(answersContainer.querySelectorAll(".answer-btn.selected"))
                .map(b => b.dataset.choiceId);
            onAnswer(selected);
        };
        // In exam mode, we don't need a specific submit for MC, but it helps UX
        if (quiz?.quiz.mode !== 'exam') {
            answersContainer.appendChild(submitBtn);
        }
    }
}
function toggleMCSelection(qId, choiceId, btn, multiple) {
    if (!quiz)
        return;
    let current = quiz.userAnswers.get(qId) || [];
    if (!Array.isArray(current))
        current = [current];
    if (multiple) {
        if (current.includes(choiceId)) {
            current = current.filter((id) => id !== choiceId);
            btn.classList.remove("selected");
        }
        else {
            current.push(choiceId);
            btn.classList.add("selected");
        }
    }
    else {
        // Radio style
        answersContainer.querySelectorAll(".answer-btn").forEach(b => b.classList.remove("selected"));
        current = [choiceId];
        btn.classList.add("selected");
    }
    quiz.userAnswers.set(qId, current);
    if (quiz.quiz.mode === 'exam') {
        renderExamNavigation(); // Update "answered" status
    }
}
function renderNumeric(q) {
    const isAnswered = quiz?.hasAnswered && quiz.quiz.mode !== 'exam';
    const currentVal = quiz?.userAnswers.get(q.id) || "";
    const input = document.createElement("input");
    input.type = "number";
    input.className = "quiz-input numeric-input";
    input.value = currentVal;
    input.placeholder = "0.00";
    input.disabled = !!isAnswered;
    input.oninput = () => {
        if (quiz)
            quiz.userAnswers.set(q.id, input.value);
        if (quiz?.quiz.mode === 'exam')
            renderExamNavigation();
    };
    if (quiz?.quiz.mode !== 'exam' && !isAnswered) {
        input.onkeydown = (e) => { if (e.key === 'Enter')
            onAnswer(input.value); };
    }
    answersContainer.appendChild(input);
    if (!isAnswered && quiz?.quiz.mode !== 'exam') {
        const btn = document.createElement("button");
        btn.className = "btn btn-primary";
        btn.textContent = t('quiz.nextQuestion');
        btn.onclick = () => onAnswer(input.value);
        answersContainer.appendChild(btn);
    }
}
function renderFillBlank(q) {
    const isAnswered = quiz?.hasAnswered && quiz.quiz.mode !== 'exam';
    const currentAnswers = quiz?.userAnswers.get(q.id) || [];
    const blankCount = (q.prompt.match(/___/g) || []).length;
    const container = document.createElement("div");
    container.className = "blanks-container";
    for (let i = 0; i < blankCount; i++) {
        const row = document.createElement("div");
        row.className = "blank-row";
        const label = document.createElement("span");
        label.className = "blank-label";
        label.textContent = `${i + 1}:`;
        row.appendChild(label);
        const input = document.createElement("input");
        input.type = "text";
        input.className = "quiz-input blank-input";
        input.value = currentAnswers[i] || "";
        input.disabled = !!isAnswered;
        input.oninput = () => {
            const answers = quiz?.userAnswers.get(q.id) || [];
            answers[i] = input.value;
            quiz?.userAnswers.set(q.id, answers);
            if (quiz?.quiz.mode === 'exam')
                renderExamNavigation();
        };
        row.appendChild(input);
        container.appendChild(row);
    }
    answersContainer.appendChild(container);
    if (!isAnswered && quiz?.quiz.mode !== 'exam') {
        const btn = document.createElement("button");
        btn.className = "btn btn-primary";
        btn.textContent = t('quiz.nextQuestion');
        btn.onclick = () => onAnswer(quiz?.userAnswers.get(q.id));
        answersContainer.appendChild(btn);
    }
}
function renderTrueFalse(q) {
    const isAnswered = quiz?.hasAnswered && quiz.quiz.mode !== 'exam';
    const currentAnswer = quiz?.userAnswers.get(q.id);
    const options = [
        { val: true, text: "TRUE", color: "#4CAF50" },
        { val: false, text: "FALSE", color: "#f44336" }
    ];
    options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "answer-btn tf-btn";
        btn.textContent = opt.text;
        btn.style.borderColor = opt.color;
        if (currentAnswer !== undefined && (currentAnswer === opt.val || currentAnswer === String(opt.val))) {
            btn.classList.add("selected");
            btn.style.background = opt.color;
            btn.style.color = "white";
        }
        if (!isAnswered) {
            btn.onclick = () => {
                if (quiz?.quiz.mode === 'exam') {
                    quiz.userAnswers.set(q.id, opt.val);
                    renderAnswers(q); // re-render to show selection
                    renderExamNavigation();
                }
                else {
                    onAnswer(opt.val);
                }
            };
        }
        else {
            if (q.isTrue === opt.val)
                btn.classList.add("correct");
            if (currentAnswer === opt.val && q.isTrue !== opt.val)
                btn.classList.add("incorrect");
            btn.disabled = true;
        }
        answersContainer.appendChild(btn);
    });
}
function renderTextInput(q) {
    const isAnswered = quiz?.hasAnswered && quiz.quiz.mode !== 'exam';
    const currentVal = quiz?.userAnswers.get(q.id) || "";
    const input = q.isLongAnswer ? document.createElement("textarea") : document.createElement("input");
    input.className = "quiz-input text-input";
    if (input instanceof HTMLTextAreaElement)
        input.rows = 5;
    input.value = currentVal;
    input.disabled = !!isAnswered;
    input.oninput = () => {
        if (quiz)
            quiz.userAnswers.set(q.id, input.value);
        if (quiz?.quiz.mode === 'exam')
            renderExamNavigation();
    };
    answersContainer.appendChild(input);
    if (!isAnswered && quiz?.quiz.mode !== 'exam') {
        const btn = document.createElement("button");
        btn.className = "btn btn-primary";
        btn.textContent = t('quiz.nextQuestion');
        btn.onclick = () => onAnswer(input.value);
        answersContainer.appendChild(btn);
    }
}
function renderImageUpload(q) {
    const isAnswered = quiz?.hasAnswered && quiz.quiz.mode !== 'exam';
    const currentAnswer = quiz?.userAnswers.get(q.id); // base64
    if (currentAnswer && isSafeUrl(currentAnswer)) {
        const img = document.createElement("img");
        img.src = currentAnswer;
        img.className = "uploaded-preview";
        img.style.maxWidth = "100%";
        img.style.borderRadius = "8px";
        img.style.marginBottom = "15px";
        answersContainer.appendChild(img);
    }
    if (!isAnswered) {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.style.display = "none";
        const btn = document.createElement("button");
        btn.className = "btn btn-secondary";
        btn.textContent = currentAnswer ? "Change Photo" : "📷 Upload Work";
        btn.onclick = () => input.click();
        input.onchange = (e) => {
            const file = e.target.files?.[0];
            if (!file)
                return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const base64 = ev.target?.result;
                quiz?.userAnswers.set(q.id, base64);
                renderAnswers(q);
                if (quiz?.quiz.mode === 'exam')
                    renderExamNavigation();
            };
            reader.readAsDataURL(file);
        };
        answersContainer.appendChild(input);
        answersContainer.appendChild(btn);
        if (quiz?.quiz.mode !== 'exam') {
            const sub = document.createElement("button");
            sub.className = "btn btn-primary";
            sub.textContent = t('quiz.nextQuestion');
            sub.style.marginLeft = "10px";
            sub.onclick = () => onAnswer(quiz?.userAnswers.get(q.id));
            answersContainer.appendChild(sub);
        }
    }
}
// Answer handler
export function onAnswer(answer) {
    if (!quiz || (quiz.hasAnswered && quiz.quiz.mode !== 'exam'))
        return;
    quiz.submitAnswer(answer);
    if (quiz.quiz.mode !== 'exam') {
        renderQuiz(); // Redraw with feedback
    }
}
// Global quiz render function
export function renderQuiz() {
    if (!quiz)
        return;
    // Update header title
    const headerTitle = document.querySelector(".quiz-header h1");
    if (headerTitle) {
        headerTitle.textContent = quiz.quiz.title;
    }
    if (quiz.quiz.mode === 'exam') {
        renderExamNavigation();
    }
    else {
        renderQuestionCounter();
    }
    renderQuestion(quiz.currentQuestion);
    renderAnswers(quiz.currentQuestion);
    // Status text
    if (quiz.quiz.mode !== 'exam') {
        if (quiz.hasAnswered) {
            const grading = quiz.gradeQuestion(quiz.currentQuestion, quiz.userAnswers.get(quiz.currentQuestion.id));
            renderStatus(grading.isCorrect ? t('quiz.correct') : t('quiz.incorrect'), grading.isCorrect ? "correct" : "incorrect");
        }
        else {
            renderStatus(t('quiz.chooseAnswer'), "neutral");
        }
    }
    else {
        renderStatus(`${t('quiz.answered')}: ${quiz.userAnswers.size} / ${quiz.shuffledQuestions.length}`, "neutral");
    }
    renderNextButton();
    // Start timer (global for entire quiz or per question)
    const config = quiz.quiz.timerConfig || { mode: 'question', limitSeconds: 30 };
    if (!quiz.hasAnswered) {
        startTimer(config, () => {
            if (quiz?.quiz.mode === 'exam') {
                showResults(); // Hard stop for exam
            }
            else {
                onAnswer(null); // Time out for practice
            }
        });
    }
}
export function renderExamNavigation() {
    if (!quiz)
        return;
    const navId = "exam-nav";
    let nav = document.getElementById(navId);
    if (!nav) {
        nav = document.createElement("div");
        nav.id = navId;
        nav.className = "exam-navigation";
        document.querySelector(".quiz-main")?.prepend(nav);
    }
    nav.innerHTML = quiz.shuffledQuestions.map((q, idx) => {
        const isAnswered = quiz.userAnswers.has(q.id);
        const isActive = quiz.currentIndex === idx;
        return `
            <button class="nav-dot ${isActive ? 'active' : ''} ${isAnswered ? 'answered' : ''}" 
                    onclick="window.jumpTo(${idx})">
                ${idx + 1}
            </button>
        `;
    }).join('');
    // Expose jumpTo globally for onclick handlers
    window.jumpTo = (idx) => {
        if (!quiz)
            return;
        quiz.jumpToQuestion(idx);
        renderQuiz();
    };
}
// Render status message
export function renderStatus(message, kind) {
    const colorClass = kind === "correct" ? "badge badge-correct" : kind === "incorrect" ? "badge badge-incorrect" : "badge";
    const scoreText = `${t('quiz.score')}: ${quiz?.score ?? 0}`;
    statusContainer.innerHTML = `
    <span class="${colorClass}">${message}</span>
    ${quiz?.quiz.mode !== 'exam' ? `<span class="badge">${scoreText}</span>` : ''}
  `;
}
export function renderQuestionCounter() {
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
    counter.textContent = `${t('quiz.question')} ${quiz.currentIndex + 1} ${t('quiz.of')} ${quiz.shuffledQuestions.length}`;
}
export function renderNextButton() {
    const btnId = "next-btn";
    let btn = document.getElementById(btnId);
    if (!btn) {
        btn = document.createElement("button");
        btn.id = btnId;
        btn.className = "btn btn-primary";
        btn.style.marginTop = "15px";
        statusContainer.appendChild(btn);
    }
    if (quiz?.quiz.mode === 'exam') {
        btn.style.display = "block";
        btn.textContent = t('quiz.examSubmit');
        btn.onclick = () => {
            const unanswered = quiz.shuffledQuestions.length - quiz.userAnswers.size;
            const confirmMsg = unanswered > 0 ?
                `Tau dar liko ${unanswered} neatsakytų klausimų. Ar tikrai norite pateikti?` :
                t('quiz.examConfirm');
            if (confirm(confirmMsg))
                showResults();
        };
    }
    else {
        if (quiz?.isLastQuestion && quiz.hasAnswered) {
            btn.style.display = "block";
            btn.textContent = t('quiz.viewResults');
            btn.onclick = showResults;
        }
        else {
            btn.style.display = quiz?.hasAnswered ? "block" : "none";
            btn.textContent = t('quiz.nextQuestion');
            btn.onclick = () => { quiz?.nextQuestion(); renderQuiz(); };
        }
    }
}
export function showResults() {
    if (!quiz)
        return;
    clearTimer();
    const results = quiz.getResults();
    const studentName = localStorage.getItem("current_student_name") || "Anonymous";
    saveResult({
        name: studentName,
        quizId: quiz.quiz.id,
        quizTitle: quiz.quiz.title,
        score: results.score,
        maxScore: results.total,
        date: new Date().toISOString(),
        details: results.questionResults
    });
    // Clean UI
    questionContainer.style.display = "none";
    answersContainer.style.display = "none";
    statusContainer.style.display = "none";
    document.getElementById("exam-nav")?.remove();
    const resultsId = "results-container";
    let container = document.getElementById(resultsId);
    if (!container) {
        container = document.createElement("div");
        container.id = resultsId;
        container.className = "results-container fade-in";
        document.querySelector(".quiz-main").appendChild(container);
    }
    const timeMin = Math.floor(results.totalTime / 60000);
    const timeSec = Math.floor((results.totalTime % 60000) / 1000);
    container.innerHTML = `
        <div class="results-card">
            <h2>${t('quiz.complete')}</h2>
            <div class="final-score">
                <div class="big-percent">${results.percentage}%</div>
                <div class="small-ratio">${results.score} / ${results.total}</div>
            </div>
            <div class="final-stats">
                <span>⏱ ${timeMin}:${timeSec.toString().padStart(2, '0')}</span>
            </div>
            
            ${quiz.quiz.showDetailedResults !== false ? `
            <div class="results-review-list" style="margin-top: 30px; text-align: left;">
                <h3 style="border-bottom: 2px solid var(--accent); padding-bottom: 8px;">${t('dashboard.review')}</h3>
                ${results.questionResults.map((r, idx) => `
                    <div class="result-item ${r.isCorrect ? 'correct' : (r.pendingReview ? 'pending' : 'incorrect')}" style="padding: 15px; border-radius: 8px; margin-bottom: 15px; background: rgba(255,255,255,0.03); border-left: 4px solid ${r.isCorrect ? 'var(--success)' : (r.pendingReview ? 'var(--accent)' : 'var(--danger)')}">
                        <div style="font-weight: bold; margin-bottom: 5px;">${t('quiz.question')} ${idx + 1}</div>
                        <div style="margin-bottom: 10px; font-style: italic;">${r.questionPrompt}</div>
                        <div style="font-size: 0.9rem;">
                            <strong>Atsakymas:</strong> ${renderResultAnswer(r)}
                        </div>
                        ${r.pendingReview ? `<div style="color: var(--accent); font-size: 0.8rem; margin-top: 5px;">⏳ ${t('quiz.pending')}</div>` : ''}
                    </div>
                `).join('')}
            </div>` : ''}

            <div style="margin-top: 30px; display: flex; gap: 15px; justify-content: center;">
                <button id="restart-quiz-btn" class="btn btn-primary">${t('quiz.takeAgain')}</button>
                <button id="back-to-menu-btn" class="btn">${t('quiz.backToMenu')}</button>
            </div>
        </div>
    `;
    window.renderMathInElement(container, {
        delimiters: [{ left: "\\(", right: "\\)", display: false }, { left: "\\[", right: "\\]", display: true }]
    });
    document.getElementById("restart-quiz-btn").onclick = () => {
        setQuiz(new QuizState(quiz.quiz));
        container.remove();
        questionContainer.style.display = "block";
        answersContainer.style.display = "block";
        statusContainer.style.display = "flex";
        renderQuiz();
    };
    document.getElementById("back-to-menu-btn").onclick = () => {
        container.remove();
        renderStartMenu();
    };
}
function renderResultAnswer(r) {
    if (r.type === 'image-upload' && r.answer) {
        return `<br><img src="${r.answer}" style="max-height: 150px; margin-top: 5px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1);" />`;
    }
    if (Array.isArray(r.answer)) {
        return r.answer.join(', ');
    }
    return String(r.answer || t('quiz.noAnswer'));
}
export function initializeQuiz(quizData) {
    setQuiz(new QuizState(quizData));
    renderQuiz();
}
//# sourceMappingURL=render.js.map
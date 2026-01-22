import { QuizState, quiz, setQuiz } from "./state.js";
import { questionContainer, answersContainer, statusContainer } from "./dom.js";
import { startQuestionTimer, clearTimer } from "./timer.js";
import { saveResult } from "./storage.js";
import { renderStartMenu } from "./menu.js";
// Render question prompt
export function renderQuestion(q) {
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
// Render answer choices
export function renderAnswers(q) {
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
// Render status message with score
export function renderStatus(message, kind) {
    const colorClass = kind === "correct" ? "badge badge-correct" : kind === "incorrect" ? "badge badge-incorrect" : "badge";
    const scoreText = `Score: ${quiz?.score ?? 0}`;
    statusContainer.innerHTML = `
    <span class="${colorClass}">${message}</span>
    <span class="badge">${scoreText}</span>
  `;
}
// Answer handler
export function onAnswer(choiceId) {
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
export function initializeQuiz(quizData) {
    setQuiz(new QuizState(quizData));
    renderQuiz();
}
// Main quiz render function
export function renderQuiz() {
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
// Render question counter
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
    counter.textContent = `Question ${quiz.currentIndex + 1} of ${quiz.quiz.questions.length}`;
}
// Render next button
export function renderNextButton() {
    const nextButtonId = "next-btn";
    let btn = document.getElementById(nextButtonId);
    if (!btn) {
        btn = document.createElement("button");
        btn.id = nextButtonId;
        btn.textContent = "Next Question";
        btn.className = "btn btn-primary";
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
            clearTimer();
            quiz.nextQuestion();
            renderQuiz();
        };
    }
}
// Show results screen
export function showResults() {
    if (!quiz)
        return;
    clearTimer();
    const results = quiz.getResults();
    const totalMinutes = Math.floor(results.totalTime / 60000);
    const totalSeconds = Math.floor((results.totalTime % 60000) / 1000);
    // Save result if student name exists
    const studentName = localStorage.getItem("current_student_name");
    if (studentName) {
        saveResult({
            name: studentName,
            quizId: quiz.quiz.id,
            score: results.score,
            maxScore: results.total,
            date: new Date().toISOString()
        });
    }
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
            ${quiz.quiz.questions
        .map((q, idx) => {
        const time = results.questionTimes[idx] ? Math.round(results.questionTimes[idx] / 1000) : 0;
        const correctChoice = q.choices.find((c) => c.isCorrect);
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
    })
        .join("")}
        </div>
        <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button id="restart-quiz-btn" class="btn btn-primary">Take Quiz Again</button>
            <button id="back-to-menu-btn" class="btn">Back to Menu</button>
        </div>
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
    // Wire up back to menu button
    document.getElementById("back-to-menu-btn").addEventListener("click", () => {
        resultsContainer.remove();
        renderStartMenu();
    });
}
// Inject badge styles
export function injectBadgeStyles() {
    const style = document.createElement("style");
    style.textContent = `
  .badge-correct { border-color: var(--success); color: var(--success); }
  .badge-incorrect { border-color: var(--danger); color: var(--danger); }
`;
    document.head.appendChild(style);
}
//# sourceMappingURL=render.js.map
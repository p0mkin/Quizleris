import { quiz } from "./state.js";
import { statusContainer } from "./dom.js";
// Timer interval reference
export let timerInterval = null;
export function startQuestionTimer() {
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
export function clearTimer() {
    if (timerInterval !== null) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}
//# sourceMappingURL=timer.js.map
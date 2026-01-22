import { quiz } from "./state.js";
import { statusContainer } from "./dom.js";
// Timer interval reference
export let timerInterval = null;
export function startTimer(config, onTimeout) {
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
    timerEl.classList.remove("text-danger");
    // Determine start time and logic
    const mode = config.mode;
    const limit = config.limitSeconds;
    // For quiz mode, we use global start time. For question mode, current question start.
    const startTime = mode === 'question'
        ? (quiz.questionStartTimes[quiz.currentIndex] || Date.now())
        : quiz.startTime;
    timerInterval = window.setInterval(() => {
        if (!quiz) {
            clearTimer();
            return;
        }
        // Stop conditions
        if (mode === 'question' && quiz.hasAnswered) {
            clearTimer();
            return;
        }
        if ((mode === 'quiz' || mode === 'none') && quiz.isLastQuestion && quiz.hasAnswered) {
            clearTimer();
            return;
        }
        const elapsed = (Date.now() - startTime) / 1000;
        if (mode === 'none') {
            // Stopwatch (Count Up)
            const minutes = Math.floor(elapsed / 60);
            const seconds = Math.floor(elapsed % 60);
            timerEl.textContent = `Time: ${minutes}:${seconds.toString().padStart(2, "0")}`;
        }
        else {
            // Countdown
            const remaining = Math.max(0, Math.ceil(limit - elapsed));
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            timerEl.textContent = `Time: ${minutes}:${seconds.toString().padStart(2, "0")}`;
            if (remaining <= 5) {
                timerEl.classList.add("text-danger");
            }
            if (remaining <= 0) {
                clearTimer();
                if (onTimeout)
                    onTimeout();
            }
        }
    }, 1000);
    // Initial text set
    const initialElapsed = (Date.now() - startTime) / 1000;
    if (mode === 'none') {
        timerEl.textContent = "Time: 0:00";
    }
    else {
        const remaining = Math.max(0, Math.ceil(limit - initialElapsed));
        const m = Math.floor(remaining / 60);
        const s = remaining % 60;
        timerEl.textContent = `Time: ${m}:${s.toString().padStart(2, "0")}`;
    }
}
export function clearTimer() {
    if (timerInterval !== null) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}
//# sourceMappingURL=timer.js.map
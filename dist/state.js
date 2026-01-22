// Simple state container for quiz progress
export class QuizState {
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
// Global quiz state - will be initialized after loading quiz
export let quiz = null;
export function setQuiz(newQuiz) {
    quiz = newQuiz;
}
//# sourceMappingURL=state.js.map
import type { Quiz, Question } from "./types.js";

// Simple state container for quiz progress
export class QuizState {
    quiz: Quiz;
    currentIndex = 0;
    hasAnswered = false;
    score = 0;
    startTime: number = Date.now();
    questionStartTimes: number[] = [];
    questionAnswerTimes: number[] = [];

    constructor(quiz: Quiz) {
        this.quiz = quiz;
        this.questionStartTimes[0] = Date.now();
    }

    get currentQuestion(): Question {
        return this.quiz.questions[this.currentIndex];
    }

    get isLastQuestion(): boolean {
        return this.currentIndex >= this.quiz.questions.length - 1;
    }

    get totalTime(): number {
        return Date.now() - this.startTime;
    }

    submitAnswer(choiceId: string | null): boolean {
        if (this.hasAnswered) return false;
        this.hasAnswered = true;

        let correct = false;
        if (choiceId) {
            const chosen = this.currentQuestion.choices.find((c) => c.id === choiceId);
            correct = !!chosen?.isCorrect;
        }

        if (correct) this.score += 1;

        // Track time for this question
        const questionStart = this.questionStartTimes[this.currentIndex] || this.startTime;
        this.questionAnswerTimes[this.currentIndex] = Date.now() - questionStart;

        return correct;
    }

    nextQuestion(): void {
        if (this.isLastQuestion) return;
        this.currentIndex += 1;
        this.hasAnswered = false;
        this.questionStartTimes[this.currentIndex] = Date.now();
    }

    getResults(): {
        score: number;
        total: number;
        percentage: number;
        totalTime: number;
        questionTimes: number[];
    } {
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
export let quiz: QuizState | null = null;

export function setQuiz(newQuiz: QuizState | null): void {
    quiz = newQuiz;
}

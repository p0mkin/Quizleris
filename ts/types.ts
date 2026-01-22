// Basic types for the quiz application

export type Choice = {
    id: string;
    text: string;
    isCorrect: boolean;
};

export type Question = {
    id: string;
    prompt: string; // LaTeX-friendly string
    choices: Choice[];
};

export type TimerMode = "question" | "quiz" | "none";

export type TimerConfig = {
    mode: TimerMode;
    limitSeconds: number;
};

export type Quiz = {
    id: string;
    title: string;
    questions: Question[];
    timerConfig?: TimerConfig;
    showDetailedResults?: boolean;
};

export interface QuestionResult {
    questionId: string;
    questionPrompt: string;
    selectedChoiceId: string;
    selectedChoiceText: string;
    isCorrect: boolean;
    timeSpent: number;
}

export interface QuizResult {
    name: string;
    quizId: string;
    quizTitle: string;
    score: number;
    maxScore: number;
    date: string;
    details: QuestionResult[];
}

// Basic types for the quiz application

export type Choice = {
    id: string;
    text: string;
    isCorrect: boolean;
    image?: string; // base64 string
};

export type QuestionType = "multiple-choice" | "numeric" | "fill-blank" | "image-upload" | "text" | "true-false";

export type ToleranceType = "absolute" | "percentage";

export type Question = {
    id: string;
    prompt: string; // LaTeX-friendly string
    type?: QuestionType; // Defaults to multiple-choice
    image?: string; // Attached by admin
    choices?: Choice[]; // used for multiple-choice

    // Type-specific configs
    allowMultipleAnswers?: boolean; // For MC
    correctAnswerNumber?: number; // For numeric
    toleranceType?: ToleranceType; // For numeric
    toleranceValue?: number; // For numeric
    blankAnswers?: string[]; // For fill-blank (sequential for ___)
    expectedKeywords?: string[]; // For text answer
    isLongAnswer?: boolean; // For text answer
    isTrue?: boolean; // For true-false
};

export type TimerMode = "question" | "quiz" | "none";

export type TimerConfig = {
    mode: TimerMode;
    limitSeconds: number;
};

export type QuizMode = "practice" | "exam";

export interface ShuffleConfig {
    questions: boolean;
    answers: boolean;
}

export type Quiz = {
    id: string;
    title: string;
    questions: Question[];
    timerConfig?: TimerConfig;
    showDetailedResults?: boolean;
    mode?: QuizMode;
    shuffleConfig?: ShuffleConfig;
};

export interface QuestionResult {
    questionId: string;
    questionPrompt: string;
    type: QuestionType;
    answer: any; // string, number, string[], base64
    isCorrect: boolean;
    pendingReview?: boolean;
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

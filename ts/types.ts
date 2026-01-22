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
};

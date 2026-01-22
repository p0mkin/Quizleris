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

export type Quiz = {
    id: string;
    title: string;
    questions: Question[];
};

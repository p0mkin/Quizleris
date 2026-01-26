// Basic types for the quiz application

/**
 * Represents a single choice in a multiple-choice question.
 */
export type Choice = {
    id: string; // e.g., "a", "b", "c"
    text: string; // The text content (can contain LaTeX)
    isCorrect: boolean;
    image?: string; // Optional Base64 or URL reference
};

export type QuestionType = "multiple-choice" | "numeric" | "fill-blank" | "image-upload" | "text" | "true-false";

export type ToleranceType = "absolute" | "percentage";

/**
 * The core data structure for a quiz question.
 * NOTE: This is a "flat" structure containing fields for ALL question types.
 * For better type safety, this could be refactored into a Discriminated Union.
 */
export type Question = {
    id: string;
    prompt: string; // The primary question text. LaTeX-friendly.
    type?: QuestionType; // Defaults to multiple-choice if omitted.
    image?: string; // Optional main image for the question.
    choices?: Choice[]; // Used for multiple-choice only.

    // Type-specific configurations
    allowMultipleAnswers?: boolean; // For multiple-choice: enables checkbox style
    correctAnswerNumber?: number; // For numeric: the target value
    toleranceType?: ToleranceType; // For numeric: how tolerance is calculated
    toleranceValue?: number; // For numeric: the allowed deviation
    blankAnswers?: string[]; // For fill-blank: correct answers mapped to '___' markers
    expectedKeywords?: string[]; // For text answer: used for keyword matching (manual review hint)
    isLongAnswer?: boolean; // For text answer: toggles between input and textarea
    isTrue?: boolean; // For true-false: the correct boolean state
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

/**
 * The top-level quiz definition containing all metadata and questions.
 */
export type Quiz = {
    id: string;
    title: string;
    questions: Question[];
    timerConfig?: TimerConfig;
    showDetailedResults?: boolean; // Toggles the visibility of the review list in results
    mode?: QuizMode; // 'practice' or 'exam'
    shuffleConfig?: ShuffleConfig;
    difficulty?: "beginner" | "intermediate" | "advanced";
    language?: string;
    estimatedMinutes?: number;
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

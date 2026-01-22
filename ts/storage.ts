import type { Quiz } from "./types.js";

// Storage keys
export const STORAGE_KEY_PREFIX = "quiz_";
export const STORAGE_KEY_ALL_IDS = "quiz_all_ids";

// Generate a simple ID (timestamp-based)
export function generateQuizId(): string {
    return `quiz_${Date.now()}`;
}

// Save quiz to localStorage
export function saveQuizToStorage(quizData: Quiz): void {
    const key = STORAGE_KEY_PREFIX + quizData.id;
    localStorage.setItem(key, JSON.stringify(quizData));

    // Track all quiz IDs
    const allIds = getAllQuizIds();
    if (!allIds.includes(quizData.id)) {
        allIds.push(quizData.id);
        localStorage.setItem(STORAGE_KEY_ALL_IDS, JSON.stringify(allIds));
    }
}

// Load quiz from localStorage by ID
export function loadQuizFromStorage(quizId: string): Quiz | null {
    const key = STORAGE_KEY_PREFIX + quizId;
    const data = localStorage.getItem(key);
    if (!data) return null;
    try {
        return JSON.parse(data) as Quiz;
    } catch {
        return null;
    }
}

// Get all saved quiz IDs
export function getAllQuizIds(): string[] {
    const data = localStorage.getItem(STORAGE_KEY_ALL_IDS);
    if (!data) return [];
    try {
        return JSON.parse(data) as string[];
    } catch {
        return [];
    }
}

// Load quiz from URL param or localStorage, or return default demo quiz
export function loadQuiz(): Quiz {
    // Check URL param first: ?quiz=abc123
    const params = new URLSearchParams(window.location.search);
    const quizParam = params.get("quiz");

    if (quizParam) {
        // Try to decode as base64 JSON (for sharing)
        try {
            const decoded = atob(quizParam);
            const parsed = JSON.parse(decoded) as Quiz;
            return parsed;
        } catch {
            // If not base64, treat as localStorage ID
            const loaded = loadQuizFromStorage(quizParam);
            if (loaded) return loaded;
        }
    }

    // Try to load from localStorage (most recent, or first available)
    const allIds = getAllQuizIds();
    if (allIds.length > 0) {
        const lastId = allIds[allIds.length - 1];
        const loaded = loadQuizFromStorage(lastId);
        if (loaded) return loaded;
    }

    // Fallback: return a default demo quiz
    // Fallback: return a default demo quiz
    return getDemoQuiz();
}

export function getDemoQuiz(): Quiz {
    return {
        id: "demo",
        title: "Demo Quiz",
        questions: [
            {
                id: "q1",
                prompt: "What is the derivative of \\(x^2\\)?",
                choices: [
                    { id: "a", text: "\\(2x\\)", isCorrect: true },
                    { id: "b", text: "\\(x\\)", isCorrect: false },
                    { id: "c", text: "\\(x^2\\)", isCorrect: false },
                    { id: "d", text: "\\(2\\)", isCorrect: false },
                ],
            },
        ],
    };
}

// Result Tracking
export interface QuizResult {
    name: string;
    quizId: string;
    score: number;
    maxScore: number;
    date: string;
}

export const STORAGE_KEY_RESULTS = "quiz_results";

export function saveResult(result: QuizResult): void {
    const results = getResults();
    results.push(result);
    localStorage.setItem(STORAGE_KEY_RESULTS, JSON.stringify(results));
}

export function getResults(): QuizResult[] {
    const data = localStorage.getItem(STORAGE_KEY_RESULTS);
    if (!data) return [];
    try {
        return JSON.parse(data) as QuizResult[];
    } catch {
        return [];
    }
}


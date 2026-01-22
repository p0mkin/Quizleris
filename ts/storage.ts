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

export function getPremadeQuizzes(): Quiz[] {
    return [
        getDemoQuiz(),
        {
            id: "algebra",
            title: "Algebra Basics",
            questions: [
                {
                    id: "a1",
                    prompt: "Solve for x: \\(2x + 5 = 15\\)",
                    choices: [
                        { id: "a", text: "5", isCorrect: true },
                        { id: "b", text: "10", isCorrect: false },
                        { id: "c", text: "2.5", isCorrect: false },
                    ]
                },
                {
                    id: "a2",
                    prompt: "Expand \\((x+3)(x-3)\\)",
                    choices: [
                        { id: "a", text: "\\(x^2 - 9\\)", isCorrect: true },
                        { id: "b", text: "\\(x^2 + 9\\)", isCorrect: false },
                        { id: "c", text: "\\(x^2 - 6x + 9\\)", isCorrect: false },
                    ]
                }
            ]
        },
        {
            id: "combinatorics",
            title: "Combinatorics",
            questions: [
                {
                    id: "c1",
                    prompt: "How many ways can you arrange 3 books on a shelf?",
                    choices: [
                        { id: "a", text: "6", isCorrect: true },
                        { id: "b", text: "3", isCorrect: false },
                        { id: "c", text: "9", isCorrect: false },
                    ]
                },
                {
                    id: "c2",
                    prompt: "Value of \\(5!\\)?",
                    choices: [
                        { id: "a", text: "120", isCorrect: true },
                        { id: "b", text: "60", isCorrect: false },
                        { id: "c", text: "100", isCorrect: false },
                    ]
                }
            ]
        }
    ];
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

export function getHighScores(): QuizResult[] {
    const results = getResults();
    const highScores = new Map<string, QuizResult>();

    results.forEach(r => {
        if (!highScores.has(r.quizId) || r.score > highScores.get(r.quizId)!.score) {
            highScores.set(r.quizId, r);
        }
    });

    return Array.from(highScores.values());
}


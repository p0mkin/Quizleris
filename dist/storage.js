import { t } from "./i18n.js";
// Storage keys
export const STORAGE_KEY_PREFIX = "quiz_";
export const STORAGE_KEY_ALL_IDS = "quiz_all_ids";
// Generate a simple ID (timestamp-based)
export function generateQuizId() {
    return `quiz_${Date.now()}`;
}
// Save quiz to localStorage
export function saveQuizToStorage(quizData) {
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
export function loadQuizFromStorage(quizId) {
    const key = STORAGE_KEY_PREFIX + quizId;
    const data = localStorage.getItem(key);
    if (!data) {
        // Fallback to premade
        if (quizId === "demo")
            return getDemoQuiz();
        const premade = getPremadeQuizzes().find(q => q.id === quizId);
        return premade || null;
    }
    try {
        return JSON.parse(data);
    }
    catch {
        return null;
    }
}
// Get all saved quiz IDs
export function getAllQuizIds() {
    const data = localStorage.getItem(STORAGE_KEY_ALL_IDS);
    if (!data)
        return [];
    try {
        return JSON.parse(data);
    }
    catch {
        return [];
    }
}
// Load quiz from URL param or localStorage, or return default demo quiz
export function loadQuiz() {
    // Check URL param first: ?quiz=abc123
    const params = new URLSearchParams(window.location.search);
    const quizParam = params.get("quiz");
    if (quizParam) {
        // Try to decode as base64 JSON (for sharing)
        try {
            // Enhanced decoding: supports UTF-8 (Lithuanian chars) and handles binary data safety
            const binary = atob(quizParam);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++)
                bytes[i] = binary.charCodeAt(i);
            const decoded = new TextDecoder().decode(bytes);
            return JSON.parse(decoded);
        }
        catch (e) {
            console.warn("Base64 decode failed, trying raw string lookup", e);
            // If not base64, treat as localStorage ID
            const loaded = loadQuizFromStorage(quizParam);
            if (loaded)
                return loaded;
        }
    }
    // Try to load from localStorage (most recent, or first available)
    const allIds = getAllQuizIds();
    if (allIds.length > 0) {
        const lastId = allIds[allIds.length - 1];
        const loaded = loadQuizFromStorage(lastId);
        if (loaded)
            return loaded;
    }
    // Fallback: return a default demo quiz
    // Fallback: return a default demo quiz
    return getDemoQuiz();
}
export function getDemoQuiz() {
    return {
        id: "demo",
        title: t('quiz.demoTitle'),
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
export function getPremadeQuizzes() {
    return [
        getDemoQuiz(),
        {
            id: "algebra",
            title: t('quiz.algebraTitle'),
            questions: [
                {
                    id: "a1",
                    prompt: "Solve for \\(x\\): \\(2x + 5 = 15\\)",
                    choices: [
                        { id: "a", text: "5", isCorrect: true },
                        { id: "b", text: "10", isCorrect: false },
                        { id: "c", text: "2.5", isCorrect: false },
                        { id: "d", text: "7.5", isCorrect: false }
                    ]
                },
                {
                    id: "a2",
                    prompt: "Expand the expression \\((x+3)(x-3)\\)",
                    choices: [
                        { id: "a", text: "\\(x^2 - 9\\)", isCorrect: true },
                        { id: "b", text: "\\(x^2 + 9\\)", isCorrect: false },
                        { id: "c", text: "\\(x^2 - 6x + 9\\)", isCorrect: false },
                        { id: "d", text: "\\(x^2 + 6x + 9\\)", isCorrect: false }
                    ]
                },
                {
                    id: "a3",
                    prompt: "Simplify: \\(3(x - 2) + 4x\\)",
                    choices: [
                        { id: "a", text: "\\(7x - 6\\)", isCorrect: true },
                        { id: "b", text: "\\(7x - 2\\)", isCorrect: false },
                        { id: "c", text: "\\(x - 6\\)", isCorrect: false },
                        { id: "d", text: "\\(12x - 6\\)", isCorrect: false }
                    ]
                }
            ]
        },
        {
            id: "combinatorics",
            title: t('quiz.combinatoricsTitle'),
            questions: [
                {
                    id: "c1",
                    prompt: "How many distinct ways can the letters in the word 'BANANA' be arranged?",
                    choices: [
                        { id: "a", text: "60", isCorrect: true },
                        { id: "b", text: "120", isCorrect: false },
                        { id: "c", text: "720", isCorrect: false },
                        { id: "d", text: "360", isCorrect: false }
                    ]
                },
                {
                    id: "c2",
                    prompt: "A committee of 3 people is to be chosen from a group of 10. How many different committees are possible?",
                    choices: [
                        { id: "a", text: "120", isCorrect: true },
                        { id: "b", text: "720", isCorrect: false },
                        { id: "c", text: "30", isCorrect: false },
                        { id: "d", text: "1000", isCorrect: false }
                    ]
                },
                {
                    id: "c3",
                    prompt: "In how many ways can 5 people span in a line?",
                    choices: [
                        { id: "a", text: "120", isCorrect: true },
                        { id: "b", text: "24", isCorrect: false },
                        { id: "c", text: "720", isCorrect: false },
                        { id: "d", text: "25", isCorrect: false }
                    ]
                },
                {
                    id: "c4",
                    prompt: "What is the coefficient of \\(x^2\\) in the expansion of \\((1+x)^5\\)?",
                    choices: [
                        { id: "a", text: "10", isCorrect: true },
                        { id: "b", text: "5", isCorrect: false },
                        { id: "c", text: "20", isCorrect: false },
                        { id: "d", text: "1", isCorrect: false }
                    ]
                },
                {
                    id: "c5",
                    prompt: "You have 4 different math books and 5 different history books. How many ways can you arrange them on a shelf if books of the same subject must be together?",
                    choices: [
                        { id: "a", text: "69,120", isCorrect: false },
                        { id: "b", text: "5,760", isCorrect: true },
                        { id: "c", text: "362,880", isCorrect: false },
                        { id: "d", text: "20", isCorrect: false }
                    ]
                }
            ]
        }
    ];
}
export const STORAGE_KEY_RESULTS = "quiz_results";
export function saveResult(result) {
    const results = getResults();
    results.push(result);
    localStorage.setItem(STORAGE_KEY_RESULTS, JSON.stringify(results));
}
export function getResults() {
    const data = localStorage.getItem(STORAGE_KEY_RESULTS);
    if (!data)
        return [];
    try {
        return JSON.parse(data);
    }
    catch {
        return [];
    }
}
export function getResultsByQuizId(quizId) {
    return getResults().filter(r => r.quizId === quizId);
}
export function clearResults() {
    localStorage.removeItem(STORAGE_KEY_RESULTS);
}
export function getHighScores() {
    const results = getResults();
    const highScores = new Map();
    results.forEach(r => {
        if (!highScores.has(r.quizId) || r.score > highScores.get(r.quizId).score) {
            highScores.set(r.quizId, r);
        }
    });
    return Array.from(highScores.values());
}
//# sourceMappingURL=storage.js.map
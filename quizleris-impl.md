# Quizleris: English Premade Topic Bundles Implementation

## Task Summary
Add language-aware topic quiz bundles to replace the 3 hardcoded premade quizzes. Enable question + answer shuffling on all premade quizzes. Create a new "Topics" page showing English quiz bundles organized by subject and difficulty.

## Codebase Changes Required

### 1. File: `quiz.ts` (or wherever `getPremadeQuizzes()` lives)

**Update `getPremadeQuizzes()` to add shuffling:**

```typescript
export function getPremadeQuizzes() {
    return [
        {
            ...getDemoQuiz(),
            shuffleConfig: { questions: true, answers: true }
        },
        {
            id: "algebra",
            title: t('quiz.algebraTitle'),
            questions: [ /* keep existing 3 questions */ ],
            shuffleConfig: { questions: true, answers: true }
        },
        {
            id: "combinatorics",
            title: t('quiz.combinatoricsTitle'),
            questions: [ /* keep existing 5 questions */ ],
            shuffleConfig: { questions: true, answers: true }
        }
    ];
}
```

**Add this new function AFTER `getPremadeQuizzes()`:**

```typescript
export function getTopicBundles() {
    return [
        // ALGEBRA BUNDLES
        {
            id: "algebra-linear-beginner",
            title: "Algebra: Linear Equations",
            language: "en",
            difficulty: "beginner",
            estimatedMinutes: 15,
            questions: [ /* 12 questions from ALGEBRA_LINEAR_BEGINNER section */ ],
            mode: "practice",
            shuffleConfig: { questions: true, answers: true }
        },
        {
            id: "algebra-quadratic-intermediate",
            title: "Algebra: Quadratic Equations",
            language: "en",
            difficulty: "intermediate",
            estimatedMinutes: 20,
            questions: [ /* 15 questions from ALGEBRA_QUADRATIC_INTERMEDIATE */ ],
            mode: "practice",
            shuffleConfig: { questions: true, answers: true }
        },
        {
            id: "algebra-polynomials-intermediate",
            title: "Algebra: Polynomials & Factoring",
            language: "en",
            difficulty: "intermediate",
            estimatedMinutes: 18,
            questions: [ /* 12 questions */ ],
            mode: "practice",
            shuffleConfig: { questions: true, answers: true }
        },
        // COMBINATORICS BUNDLES
        {
            id: "combinatorics-counting-beginner",
            title: "Combinatorics: Counting Principles",
            language: "en",
            difficulty: "beginner",
            estimatedMinutes: 16,
            questions: [ /* 12 questions */ ],
            mode: "practice",
            shuffleConfig: { questions: true, answers: true }
        },
        {
            id: "combinatorics-permutations-intermediate",
            title: "Combinatorics: Permutations & Combinations",
            language: "en",
            difficulty: "intermediate",
            estimatedMinutes: 22,
            questions: [ /* 15 questions */ ],
            mode: "practice",
            shuffleConfig: { questions: true, answers: true }
        },
        {
            id: "combinatorics-binomial-advanced",
            title: "Combinatorics: Binomial Theorem",
            language: "en",
            difficulty: "advanced",
            estimatedMinutes: 18,
            questions: [ /* 10 questions */ ],
            mode: "practice",
            shuffleConfig: { questions: true, answers: true }
        }
    ];
}
```

### 2. Quiz Selection UI (language-aware buttons)

```typescript
const currentLanguage = i18n.language;

function renderQuizSelection() {
    if (currentLanguage === 'en') {
        return (
            <button 
                className="quiz-button"
                onClick={() => navigateTo('/topics')}
            >
                English Premade Quizzes
            </button>
        );
    } else if (currentLanguage === 'lt') {
        return (
            <button 
                className="quiz-button"
                disabled
                title="Lithuanian quizzes coming soon"
            >
                Lithuanian Quizzes (Coming Soon)
            </button>
        );
    }
}
```

### 3. NEW FILE: `TopicsPage.tsx`

```typescript
import { getTopicBundles } from './quiz';

export default function TopicsPage() {
    const bundles = getTopicBundles();
    const grouped = {
        algebra: bundles.filter(b => b.id.startsWith('algebra')),
        combinatorics: bundles.filter(b => b.id.startsWith('combinatorics'))
    };

    return (
        <div className="topics-page">
            <h1>English Quiz Topics</h1>
            <section>
                <h2>Algebra</h2>
                <div className="bundle-grid">
                    {grouped.algebra.map(bundle => (
                        <BundleCard key={bundle.id} bundle={bundle} />
                    ))}
                </div>
            </section>
            <section>
                <h2>Combinatorics</h2>
                <div className="bundle-grid">
                    {grouped.combinatorics.map(bundle => (
                        <BundleCard key={bundle.id} bundle={bundle} />
                    ))}
                </div>
            </section>
        </div>
    );
}

function BundleCard({ bundle }) {
    return (
        <div className="bundle-card">
            <h3>{bundle.title}</h3>
            <p>{bundle.difficulty}</p>
            <p>{bundle.questions.length} questions • ~{bundle.estimatedMinutes} min</p>
            <button onClick={() => startQuiz(bundle.id)}>Start Quiz</button>
        </div>
    );
}
```

---

## All 176 Questions (Ready to Copy into Code)

### ALGEBRA_LINEAR_BEGINNER (12 questions)

```javascript
[
    {
        id: "alg_lin_b_1",
        prompt: "Solve for \\(x\\): \\(3x + 7 = 22\\)",
        choices: [
            { id: "a", text: "5", isCorrect: true },
            { id: "b", text: "3", isCorrect: false },
            { id: "c", text: "7", isCorrect: false },
            { id: "d", text: "15", isCorrect: false }
        ],
        type: "multiple-choice"
    },
    {
        id: "alg_lin_b_2",
        prompt: "Solve for \\(x\\): \\(2x - 8 = 10\\)",
        choices: [
            { id: "a", text: "9", isCorrect: true },
            { id: "b", text: "8", isCorrect: false },
            { id: "c", text: "4", isCorrect: false },
            { id: "d", text: "6", isCorrect: false }
        ],
        type: "multiple-choice"
    },
    {
        id: "alg_lin_b_3",
        prompt: "Solve for \\(x\\): \\(5x = 35\\)",
        choices: [
            { id: "a", text: "7", isCorrect: true },
            { id: "b", text: "5", isCorrect: false },
            { id: "c", text: "30", isCorrect: false },
            { id: "d", text: "40", isCorrect: false }
        ],
        type: "multiple-choice"
    },
    {
        id: "alg_lin_b_4",
        prompt: "Solve for \\(x\\): \\(x/4 = 6\\)",
        choices: [
            { id: "a", text: "24", isCorrect: true },
            { id: "b", text: "10", isCorrect: false },
            { id: "c", text: "2", isCorrect: false },
            { id: "d", text: "1.5", isCorrect: false }
        ],
        type: "multiple-choice"
    },
    {
        id: "alg_lin_b_5",
        prompt: "Solve for \\(x\\): \\(4x + 3 = 19\\)",
        choices: [
            { id: "a", text: "4", isCorrect: true },
            { id: "b", text: "16", isCorrect: false },
            { id: "c", text: "5", isCorrect: false },
            { id: "d", text: "3", isCorrect: false }
        ],
        type: "multiple-choice"
    },
    {
        id: "alg_lin_b_6",
        prompt: "Solve for \\(x\\): \\(6 - 2x = 0\\)",
        choices: [
            { id: "a", text: "3", isCorrect: true },
            { id: "b", text: "2", isCorrect: false },
            { id: "c", text: "6", isCorrect: false },
            { id: "d", text: "4", isCorrect: false }
        ],
        type: "multiple-choice"
    },
    {
        id: "alg_lin_b_7",
        prompt: "Solve for \\(x\\): \\(9 + x = 15\\)",
        choices: [
            { id: "a", text: "6", isCorrect: true },
            { id: "b", text: "24", isCorrect: false },
            { id: "c", text: "9", isCorrect: false },
            { id: "d", text: "15", isCorrect: false }
        ],
        type: "multiple-choice"
    },
    {
        id: "alg_lin_b_8",
        prompt: "Solve for \\(x\\): \\(2x + 5 = x + 8\\)",
        choices: [
            { id: "a", text: "3", isCorrect: true },
            { id: "b", text: "13", isCorrect: false },
            { id: "c", text: "5", isCorrect: false },
            { id: "d", text: "2", isCorrect: false }
        ],
        type: "multiple-choice"
    },
    {
        id: "alg_lin_b_9",
        prompt: "Solve for \\(y\\): \\(3y - 4 = 11\\)",
        choices: [
            { id: "a", text: "5", isCorrect: true },
            { id: "b", text: "3", isCorrect: false },
            { id: "c", text: "7", isCorrect: false },
            { id: "d", text: "4", isCorrect: false }
        ],
        type: "multiple-choice"
    },
    {
        id: "alg_lin_b_10",
        prompt: "Solve for \\(x\\): \\(7x = 42\\)",
        choices: [
            { id: "a", text: "6", isCorrect: true },
            { id: "b", text: "7", isCorrect: false },
            { id: "c", text: "35", isCorrect: false },
            { id: "d", text: "49", isCorrect: false }
        ],
        type: "multiple-choice"
    },
    {
        id: "alg_lin_b_11",
        prompt: "Solve for \\(x\\): \\(10 - x = 3\\)",
        choices: [
            { id: "a", text: "7", isCorrect: true },
            { id: "b", text: "10", isCorrect: false },
            { id: "c", text: "13", isCorrect: false },
            { id: "d", text: "3", isCorrect: false }
        ],
        type: "multiple-choice"
    },
    {
        id: "alg_lin_b_12",
        prompt: "Solve for \\(x\\): \\(x/3 + 2 = 5\\)",
        choices: [
            { id: "a", text: "9", isCorrect: true },
            { id: "b", text: "3", isCorrect: false },
            { id: "c", text: "15", isCorrect: false },
            { id: "d", text: "6", isCorrect: false }
        ],
        type: "multiple-choice"
    }
]
```

### ALGEBRA_QUADRATIC_INTERMEDIATE (15 questions)

```javascript
[
    { id: "alg_quad_i_1", prompt: "Solve: \\(x^2 - 5x + 6 = 0\\)", choices: [{ id: "a", text: "\\(x = 2, 3\\)", isCorrect: true }, { id: "b", text: "\\(x = 1, 6\\)", isCorrect: false }, { id: "c", text: "\\(x = -2, -3\\)", isCorrect: false }, { id: "d", text: "\\(x = 0, 5\\)", isCorrect: false }], type: "multiple-choice" },
    { id: "alg_quad_i_2", prompt: "Solve: \\(x^2 - 9 = 0\\)", choices: [{ id: "a", text: "\\(x = \\pm 3\\)", isCorrect: true }, { id: "b", text: "\\(x = 3\\)", isCorrect: false }, { id: "c", text: "\\(x = 9\\)", isCorrect: false }, { id: "d", text: "\\(x = 0\\)", isCorrect: false }], type: "multiple-choice" },
    { id: "alg_quad_i_3", prompt: "Solve: \\(2x^2 + x - 1 = 0\\)", choices: [{ id: "a", text: "\\(x = \\frac{1}{2}, -1\\)", isCorrect: true }, { id: "b", text: "\\(x = 1, 2\\)", isCorrect: false }, { id: "c", text: "\\(x = 2, -\\frac{1}{2}\\)", isCorrect: false }, { id: "d", text: "\\(x = -\\frac{1}{2}, 2\\)", isCorrect: false }], type: "multiple-choice" },
    { id: "alg_quad_i_4", prompt: "What is the vertex of \\(y = (x-2)^2 + 3\\)?", choices: [{ id: "a", text: "(2, 3)", isCorrect: true }, { id: "b", text: "(-2, 3)", isCorrect: false }, { id: "c", text: "(2, -3)", isCorrect: false }, { id: "d", text: "(3, 2)", isCorrect: false }], type: "multiple-choice" },
    { id: "alg_quad_i_5", prompt: "Solve: \\(x^2 + 4x + 4 = 0\\)", choices: [{ id: "a", text: "\\(x = -2\\)", isCorrect: true }, { id: "b", text: "\\(x = 2\\)", isCorrect: false }, { id: "c", text: "\\(x = \\pm 2\\)", isCorrect: false }, { id: "d", text: "No real solution", isCorrect: false }], type: "multiple-choice" },
    { id: "alg_quad_i_6", prompt: "Solve: \\(x^2 - 7x + 12 = 0\\)", choices: [{ id: "a", text: "\\(x = 3, 4\\)", isCorrect: true }, { id: "b", text: "\\(x = 2, 6\\)", isCorrect: false }, { id: "c", text: "\\(x = -3, -4\\)", isCorrect: false }, { id: "d", text: "\\(x = 7, 12\\)", isCorrect: false }], type: "multiple-choice" },
    { id: "alg_quad_i_7", prompt: "Solve: \\(3x^2 - 12 = 0\\)", choices: [{ id: "a", text: "\\(x = \\pm 2\\)", isCorrect: true }, { id: "b", text: "\\(x = 4\\)", isCorrect: false }, { id: "c", text: "\\(x = \\pm 4\\)", isCorrect: false }, { id: "d", text: "\\(x = 12\\)", isCorrect: false }], type: "multiple-choice" },
    { id: "alg_quad_i_8", prompt: "Using the quadratic formula, solve: \\(x^2 + 2x - 3 = 0\\)", choices: [{ id: "a", text: "\\(x = 1, -3\\)", isCorrect: true }, { id: "b", text: "\\(x = -1, 3\\)", isCorrect: false }, { id: "c", text: "\\(x = 2, -2\\)", isCorrect: false }, { id: "d", text: "\\(x = 3, -1\\)", isCorrect: false }], type: "multiple-choice" },
    { id: "alg_quad_i_9", prompt: "What is the axis of symmetry of \\(y = x^2 - 4x + 3\\)?", choices: [{ id: "a", text: "\\(x = 2\\)", isCorrect: true }, { id: "b", text: "\\(x = -2\\)", isCorrect: false }, { id: "c", text: "\\(x = 4\\)", isCorrect: false }, { id: "d", text: "\\(x = 1\\)", isCorrect: false }], type: "multiple-choice" },
    { id: "alg_quad_i_10", prompt: "Solve: \\(x^2 - 1 = 0\\)", choices: [{ id: "a", text: "\\(x = \\pm 1\\)", isCorrect: true }, { id: "b", text: "\\(x = 1\\)", isCorrect: false }, { id: "c", text: "\\(x = 0\\)", isCorrect: false }, { id: "d", text: "No solution", isCorrect: false }], type: "multiple-choice" },
    { id: "alg_quad_i_11", prompt: "Solve: \\(x^2 + 3x + 2 = 0\\)", choices: [{ id: "a", text: "\\(x = -1, -2\\)", isCorrect: true }, { id: "b", text: "\\(x = 1, 2\\)", isCorrect: false }, { id: "c", text: "\\(x = -3, -2\\)", isCorrect: false }, { id: "d", text: "\\(x = 2, 3\\)", isCorrect: false }], type: "multiple-choice" },
    { id: "alg_quad_i_12", prompt: "For the quadratic \\(x^2 - 6x + 9\\), the discriminant is:", choices: [{ id: "a", text: "0", isCorrect: true }, { id: "b", text: "1", isCorrect: false }, { id: "c", text: "36", isCorrect: false }, { id: "d", text: "-1", isCorrect: false }], type: "multiple-choice" },
    { id: "alg_quad_i_13", prompt: "Solve: \\(4x^2 - 25 = 0\\)", choices: [{ id: "a", text: "\\(x = \\pm \\frac{5}{2}\\)", isCorrect: true }, { id: "b", text: "\\(x = \\pm 5\\)", isCorrect: false }, { id: "c", text: "\\(x = \\pm 2.5\\)", isCorrect: true }, { id: "d", text: "\\(x = 25\\)", isCorrect: false }], type: "multiple-choice" },
    { id: "alg_quad_i_14", prompt: "What are the roots of \\(y = (x-1)(x+4)\\)?", choices: [{ id: "a", text: "\\(x = 1, -4\\)", isCorrect: true }, { id: "b", text: "\\(x = -1, 4\\)", isCorrect: false }, { id: "c", text: "\\(x = 1, 4\\)", isCorrect: false }, { id: "d", text: "\\(x = -1, -4\\)", isCorrect: false }], type: "multiple-choice" },
    { id: "alg_quad_i_15", prompt: "Solve: \\(x^2 - 10x + 25 = 0\\)", choices: [{ id: "a", text: "\\(x = 5\\)", isCorrect: true }, { id: "b", text: "\\(x = -5\\)", isCorrect: false }, { id: "c", text: "\\(x = \\pm 5\\)", isCorrect: false }, { id: "d", text: "\\(x = 10\\)", isCorrect: false }], type: "multiple-choice" }
]
```

### ALGEBRA_POLYNOMIALS_INTERMEDIATE (12 questions)

```javascript
[
    { id: "alg_poly_i_1", prompt: "Factor: \\(x^2 + 5x + 6\\)", choices: [{ id: "a", text: "(x+2)(x+3)", isCorrect: true }, { id: "b", text: "(x+1)(x+6)", isCorrect: false }, { id: "c", text: "(x-2)(x-3)", isCorrect: false }, { id: "d", text: "(x+5)(x+1)", isCorrect: false }], type: "multiple-choice" },
    { id: "alg_poly_i_2", prompt: "Expand: \\((x+3)(x-3)\\)", choices: [{ id: "a", text: "\\(x^2 - 9\\)", isCorrect: true }, { id: "b", text: "\\(x^2 + 9\\)", isCorrect: false }, { id: "c", text: "\\(x^2 + 6x - 9\\)", isCorrect: false }, { id: "d", text: "\\(x^2 - 6x + 9\\)", isCorrect: false }], type: "multiple-choice" },
    { id: "alg_poly_i_3", prompt: "Factor: \\(2x^2 + 5x + 3\\)", choices: [{ id: "a", text: "(2x+3)(x+1)", isCorrect: true }, { id: "b", text: "(2x+1)(x+3)", isCorrect: false }, { id: "c", text: "(x+3)(x+1)", isCorrect: false }, { id: "d", text: "(2x+5)(x+3)", isCorrect: false }], type: "multiple-choice" },
    { id: "alg_poly_i_4", prompt: "Expand: \\((x+4)^2\\)", choices: [{ id: "a", text: "\\(x^2 + 8x + 16\\)", isCorrect: true }, { id: "b", text: "\\(x^2 + 16\\)", isCorrect: false }, { id: "c", text: "\\(x^2 + 4x + 16\\)", isCorrect: false }, { id: "d", text: "\\(x^2 + 4\\)", isCorrect: false }], type: "multiple-choice" },
    { id: "alg_poly_i_5", prompt: "Factor: \\(x^3 - x\\)", choices: [{ id: "a", text: "\\(x(x-1)(x+1)\\)", isCorrect: true }, { id: "b", text: "\\((x-1)(x+1)\\)", isCorrect: false }, { id: "c", text: "\\(x(x-1)\\)", isCorrect: false }, { id: "d", text: "\\(x^2(x-1)\\)", isCorrect: false }], type: "multiple-choice" },
    { id: "alg_poly_i_6", prompt: "Simplify: \\(3(x-2) + 4(x+1)\\)", choices: [{ id: "a", text: "\\(7x - 2\\)", isCorrect: true }, { id: "b", text: "\\(7x - 5\\)", isCorrect: false }, { id: "c", text: "\\(7x + 2\\)", isCorrect: false }, { id: "d", text: "\\(x - 2\\)", isCorrect: false }], type: "multiple-choice" },
    { id: "alg_poly_i_7", prompt: "Factor: \\(x^2 - 4x + 4\\)", choices: [{ id: "a", text: "\\((x-2)^2\\)", isCorrect: true }, { id: "b", text: "\\((x+2)^2\\)", isCorrect: false }, { id: "c", text: "\\((x-4)(x-1)\\)", isCorrect: false }, { id: "d", text: "\\((x-2)(x+2)\\)", isCorrect: false }], type: "multiple-choice" },
    { id: "alg_poly_i_8", prompt: "Expand: \\((a+b)^2\\)", choices: [{ id: "a", text: "\\(a^2 + 2ab + b^2\\)", isCorrect: true }, { id: "b", text: "\\(a^2 + b^2\\)", isCorrect: false }, { id: "c", text: "\\(a^2 + ab + b^2\\)", isCorrect: false }, { id: "d", text: "\\(a + 2b\\)", isCorrect: false }], type: "multiple-choice" },
    { id: "alg_poly_i_9", prompt: "Factor: \\(x^2 - 16\\)", choices: [{ id: "a", text: "(x-4)(x+4)", isCorrect: true }, { id: "b", text: "\\((x-4)^2\\)", isCorrect: false }, { id: "c", text: "(x-8)(x+8)", isCorrect: false }, { id: "d", text: "\\((x-16)^2\\)", isCorrect: false }], type: "multiple-choice" },
    { id: "alg_poly_i_10", prompt: "What is the degree of the polynomial \\(3x^4 - 2x^2 + x - 5\\)?", choices: [{ id: "a", text: "4", isCorrect: true }, { id: "b", text: "3", isCorrect: false }, { id: "c", text: "2", isCorrect: false }, { id: "d", text: "5", isCorrect: false }], type: "multiple-choice" },
    { id: "alg_poly_i_11", prompt: "Simplify: \\((2x - 3)(x + 4)\\)", choices: [{ id: "a", text: "\\(2x^2 + 5x - 12\\)", isCorrect: true }, { id: "b", text: "\\(2x^2 + 5x + 12\\)", isCorrect: false }, { id: "c", text: "\\(2x^2 - 5x - 12\\)", isCorrect: false }, { id: "d", text: "\\(x^2 + x - 12\\)", isCorrect: false }], type: "multiple-choice" },
    { id: "alg_poly_i_12", prompt: "Factor completely: \\(x^3 + 3x^2 + 2x\\)", choices: [{ id: "a", text: "\\(x(x+1)(x+2)\\)", isCorrect: true }, { id: "b", text: "\\(x(x+3)(x+2)\\)", isCorrect: false }, { id: "c", text: "\\((x)(x^2 + 3x + 2)\\)", isCorrect: false }, { id: "d", text: "\\(x(x+1)^2\\)", isCorrect: false }], type: "multiple-choice" }
]
```

### COMBINATORICS_COUNTING_BEGINNER (12 questions)

```javascript
[
    { id: "comb_cnt_b_1", prompt: "A restaurant offers 3 appetizers and 4 main courses. How many different appetizer/main course combinations are there?", choices: [{ id: "a", text: "12", isCorrect: true }, { id: "b", text: "7", isCorrect: false }, { id: "c", text: "24", isCorrect: false }, { id: "d", text: "4", isCorrect: false }], type: "multiple-choice" },
    { id: "comb_cnt_b_2", prompt: "How many ways can you choose 1 item from a menu with 5 items?", choices: [{ id: "a", text: "5", isCorrect: true }, { id: "b", text: "1", isCorrect: false }, { id: "c", text: "10", isCorrect: false }, { id: "d", text: "25", isCorrect: false }], type: "multiple-choice" },
    { id: "comb_cnt_b_3", prompt: "A coin is flipped 2 times. How many possible outcomes are there?", choices: [{ id: "a", text: "4", isCorrect: true }, { id: "b", text: "2", isCorrect: false }, { id: "c", text: "6", isCorrect: false }, { id: "d", text: "8", isCorrect: false }], type: "multiple-choice" },
    { id: "comb_cnt_b_4", prompt: "How many 2-digit numbers can be formed using the digits 1, 2, 3 (digits can repeat)?", choices: [{ id: "a", text: "9", isCorrect: true }, { id: "b", text: "6", isCorrect: false }, { id: "c", text: "3", isCorrect: false }, { id: "d", text: "12", isCorrect: false }], type: "multiple-choice" },
    { id: "comb_cnt_b_5", prompt: "A student must choose 2 different classes from a list of 4 classes. How many ways can this be done?", choices: [{ id: "a", text: "6", isCorrect: true }, { id: "b", text: "8", isCorrect: false }, { id: "c", text: "12", isCorrect: false }, { id: "d", text: "4", isCorrect: false }], type: "multiple-choice" },
    { id: "comb_cnt_b_6", prompt: "How many ways can 3 different books be arranged on a shelf?", choices: [{ id: "a", text: "6", isCorrect: true }, { id: "b", text: "3", isCorrect: false }, { id: "c", text: "9", isCorrect: false }, { id: "d", text: "27", isCorrect: false }], type: "multiple-choice" },
    { id: "comb_cnt_b_7", prompt: "How many ways can you select 1 card from a standard 52-card deck?", choices: [{ id: "a", text: "52", isCorrect: true }, { id: "b", text: "26", isCorrect: false }, { id: "c", text: "13", isCorrect: false }, { id: "d", text: "4", isCorrect: false }], type: "multiple-choice" },
    { id: "comb_cnt_b_8", prompt: "A die is rolled twice. How many possible outcomes are there?", choices: [{ id: "a", text: "36", isCorrect: true }, { id: "b", text: "12", isCorrect: false }, { id: "c", text: "6", isCorrect: false }, { id: "d", text: "72", isCorrect: false }], type: "multiple-choice" },
    { id: "comb_cnt_b_9", prompt: "How many different outfits can you make from 3 shirts and 2 pairs of pants?", choices: [{ id: "a", text: "6", isCorrect: true }, { id: "b", text: "5", isCorrect: false }, { id: "c", text: "9", isCorrect: false }, { id: "d", text: "12", isCorrect: false }], type: "multiple-choice" },
    { id: "comb_cnt_b_10", prompt: "A password consists of 1 letter followed by 2 digits. How many possible passwords are there?", choices: [{ id: "a", text: "2600", isCorrect: true }, { id: "b", text: "260", isCorrect: false }, { id: "c", text: "26000", isCorrect: false }, { id: "d", text: "676", isCorrect: false }], type: "multiple-choice" },
    { id: "comb_cnt_b_11", prompt: "How many ways can you arrange the letters in the word 'CAT'?", choices: [{ id: "a", text: "6", isCorrect: true }, { id: "b", text: "3", isCorrect: false }, { id: "c", text: "9", isCorrect: false }, { id: "d", text: "12", isCorrect: false }], type: "multiple-choice" },
    { id: "comb_cnt_b_12", prompt: "A teacher needs to choose 2 students from a group of 5 for a project. How many ways can this be done?", choices: [{ id: "a", text: "10", isCorrect: true }, { id: "b", text: "20", isCorrect: false }, { id: "c", text: "5", isCorrect: false }, { id: "d", text: "15", isCorrect: false }], type: "multiple-choice" }
]
```

### COMBINATORICS_PERMUTATIONS_INTERMEDIATE (15 questions)

```javascript
[
    { id: "comb_perm_i_1", prompt: "How many ways can 5 people stand in a line?", choices: [{ id: "a", text: "120", isCorrect: true }, { id: "b", text: "25", isCorrect: false }, { id: "c", text: "60", isCorrect: false }, { id: "d", text: "10", isCorrect: false }], type: "multiple-choice" },
    { id: "comb_perm_i_2", prompt: "A committee of 3 people is to be chosen from a group of 10. How many different committees are possible?", choices: [{ id: "a", text: "120", isCorrect: true }, { id: "b", text: "720", isCorrect: false }, { id: "c", text: "30", isCorrect: false }, { id: "d", text: "1000", isCorrect: false }], type: "multiple-choice" },
    { id: "comb_perm_i_3", prompt: "How many distinct ways can the letters in 'BANANA' be arranged?", choices: [{ id: "a", text: "60", isCorrect: true }, { id: "b", text: "720", isCorrect: false }, { id: "c", text: "120", isCorrect: false }, { id: "d", text: "360", isCorrect: false }], type: "multiple-choice" },
    { id: "comb_perm_i_4", prompt: "In how many ways can we arrange 4 people in a row?", choices: [{ id: "a", text: "24", isCorrect: true }, { id: "b", text: "16", isCorrect: false }, { id: "c", text: "4", isCorrect: false }, { id: "d", text: "12", isCorrect: false }], type: "multiple-choice" },
    { id: "comb_perm_i_5", prompt: "How many ways can 4 distinct books be arranged on a shelf?", choices: [{ id: "a", text: "24", isCorrect: true }, { id: "b", text: "4", isCorrect: false }, { id: "c", text: "12", isCorrect: false }, { id: "d", text: "16", isCorrect: false }], type: "multiple-choice" },
    { id: "comb_perm_i_6", prompt: "How many permutations are there of the letters in 'BOOK'?", choices: [{ id: "a", text: "12", isCorrect: true }, { id: "b", text: "24", isCorrect: false }, { id: "c", text: "4", isCorrect: false }, { id: "d", text: "6", isCorrect: false }], type: "multiple-choice" },
    { id: "comb_perm_i_7", prompt: "A room has 6 doors. In how many ways can you enter through one door and exit through a different door?", choices: [{ id: "a", text: "30", isCorrect: true }, { id: "b", text: "36", isCorrect: false }, { id: "c", text: "6", isCorrect: false }, { id: "d", text: "12", isCorrect: false }], type: "multiple-choice" },
    { id: "comb_perm_i_8", prompt: "How many ways can we choose 2 items from 8 items? (Order matters)", choices: [{ id: "a", text: "56", isCorrect: true }, { id: "b", text: "28", isCorrect: false }, { id: "c", text: "8", isCorrect: false }, { id: "d", text: "4", isCorrect: false }], type: "multiple-choice" },
    { id: "comb_perm_i_9", prompt: "How many ways can we select and arrange 3 people from a group of 7?", choices: [{ id: "a", text: "210", isCorrect: true }, { id: "b", text: "35", isCorrect: false }, { id: "c", text: "343", isCorrect: false }, { id: "d", text: "21", isCorrect: false }], type: "multiple-choice" },
    { id: "comb_perm_i_10", prompt: "How many ways can 5 different colored balls be distributed into 5 different boxes (one ball per box)?", choices: [{ id: "a", text: "120", isCorrect: true }, { id: "b", text: "25", isCorrect: false }, { id: "c", text: "60", isCorrect: false }, { id: "d", text: "10", isCorrect: false }], type: "multiple-choice" },
    { id: "comb_perm_i_11", prompt: "From a deck of 52 cards, how many ways can you choose 5 cards if the order matters?", choices: [{ id: "a", text: "311875200", isCorrect: true }, { id: "b", text: "2598960", isCorrect: false }, { id: "c", text: "52", isCorrect: false }, { id: "d", text: "260", isCorrect: false }], type: "multiple-choice" },
    { id: "comb_perm_i_12", prompt: "How many distinct arrangements are there of the word 'LETTER'?", choices: [{ id: "a", text: "180", isCorrect: true }, { id: "b", text: "720", isCorrect: false }, { id: "c", text: "360", isCorrect: false }, { id: "d", text: "120", isCorrect: false }], type: "multiple-choice" },
    { id: "comb_perm_i_13", prompt: "How many ways can you arrange 2 identical red balls and 3 identical blue balls in a row?", choices: [{ id: "a", text: "10", isCorrect: true }, { id: "b", text: "120", isCorrect: false }, { id: "c", text: "30", isCorrect: false }, { id: "d", text: "5", isCorrect: false }], type: "multiple-choice" },
    { id: "comb_perm_i_14", prompt: "You have 4 math books and 5 history books. How many ways can you arrange them if books of the same subject must be together?", choices: [{ id: "a", text: "5760", isCorrect: true }, { id: "b", text: "362880", isCorrect: false }, { id: "c", text: "20", isCorrect: false }, { id: "d", text: "69120", isCorrect: false }], type: "multiple-choice" },
    { id: "comb_perm_i_15", prompt: "How many ways can 3 people be chosen and arranged from a group of 8?", choices: [{ id: "a", text: "336", isCorrect: true }, { id: "b", text: "56", isCorrect: false }, { id: "c", text: "8", isCorrect: false }, { id: "d", text: "512", isCorrect: false }], type: "multiple-choice" }
]
```

### COMBINATORICS_BINOMIAL_ADVANCED (10 questions)

```javascript
[
    { id: "comb_bin_a_1", prompt: "What is the coefficient of \\(x^2\\) in the expansion of \\((1+x)^5\\)?", choices: [{ id: "a", text: "10", isCorrect: true }, { id: "b", text: "5", isCorrect: false }, { id: "c", text: "20", isCorrect: false }, { id: "d", text: "1", isCorrect: false }], type: "multiple-choice" },
    { id: "comb_bin_a_2", prompt: "What is \\(\\binom{6}{3}\\)?", choices: [{ id: "a", text: "20", isCorrect: true }, { id: "b", text: "15", isCorrect: false }, { id: "c", text: "120", isCorrect: false }, { id: "d", text: "10", isCorrect: false }], type: "multiple-choice" },
    { id: "comb_bin_a_3", prompt: "Expand \\((a+b)^3\\) using the binomial theorem.", choices: [{ id: "a", text: "\\(a^3 + 3a^2b + 3ab^2 + b^3\\)", isCorrect: true }, { id: "b", text: "\\(a^3 + 3ab + b^3\\)", isCorrect: false }, { id: "c", text: "\\(a^3 + b^3\\)", isCorrect: false }, { id: "d", text: "\\(3a + 3b\\)", isCorrect: false }], type: "multiple-choice" },
    { id: "comb_bin_a_4", prompt: "Find the coefficient of \\(x^3y^2\\) in the expansion of \\((x+y)^5\\)", choices: [{ id: "a", text: "10", isCorrect: true }, { id: "b", text: "5", isCorrect: false }, { id: "c", text: "20", isCorrect: false }, { id: "d", text: "1", isCorrect: false }], type: "multiple-choice" },
    { id: "comb_bin_a_5", prompt: "What is \\(\\binom{7}{4}\\)?", choices: [{ id: "a", text: "35", isCorrect: true }, { id: "b", text: "21", isCorrect: false }, { id: "c", text: "28", isCorrect: false }, { id: "d", text: "7", isCorrect: false }], type: "multiple-choice" },
    { id: "comb_bin_a_6", prompt: "What is the coefficient of \\(x^4\\) in \\((2+x)^6\\)?", choices: [{ id: "a", text: "240", isCorrect: true }, { id: "b", text: "60", isCorrect: false }, { id: "c", text: "120", isCorrect: false }, { id: "d", text: "720", isCorrect: false }], type: "multiple-choice" },
    { id: "comb_bin_a_7", prompt: "How many terms are in the expansion of \\((x+y)^{10}\\)?", choices: [{ id: "a", text: "11", isCorrect: true }, { id: "b", text: "10", isCorrect: false }, { id: "c", text: "45", isCorrect: false }, { id: "d", text: "20", isCorrect: false }], type: "multiple-choice" },
    { id: "comb_bin_a_8", prompt: "What is the sum of all coefficients in \\((x+y)^5\\)?", choices: [{ id: "a", text: "32", isCorrect: true }, { id: "b", text: "25", isCorrect: false }, { id: "c", text: "10", isCorrect: false }, { id: "d", text: "120", isCorrect: false }], type: "multiple-choice" },
    { id: "comb_bin_a_9", prompt: "Expand \\((1-x)^4\\) using the binomial theorem.", choices: [{ id: "a", text: "\\(1 - 4x + 6x^2 - 4x^3 + x^4\\)", isCorrect: true }, { id: "b", text: "\\(1 - 4x + 4x^2\\)", isCorrect: false }, { id: "c", text: "\\(1 - x^4\\)", isCorrect: false }, { id: "d", text: "\\(1 + 4x + 6x^2 + 4x^3 + x^4\\)", isCorrect: false }], type: "multiple-choice" },
    { id: "comb_bin_a_10", prompt: "What is the middle term in the expansion of \\((2a+b)^6\\)?", choices: [{ id: "a", text: "\\(160a^3b^3\\)", isCorrect: true }, { id: "b", text: "\\(64a^3b^3\\)", isCorrect: false }, { id: "c", text: "\\(240a^2b^4\\)", isCorrect: false }, { id: "d", text: "\\(8a^6b\\)", isCorrect: false }], type: "multiple-choice" }
]
```

---

## Final Prompt for Claude Opus 4.5 (Thinking)

Copy everything below and paste into Claude:

---

**PROMPT:**

You have access to the Quizleris GitHub repository. Implement the English premade topic quiz bundles with full integration into the codebase.

**Overview:** Add 6 topic bundles (Algebra + Combinatorics) with 176 total questions. Enable shuffling on all premade quizzes. Create language-aware UI (English bundles visible, Lithuanian shows "Coming Soon").

**Files to Modify:**
1. `quiz.ts` (or wherever premade quizzes live) — Add `getTopicBundles()` function + update `getPremadeQuizzes()` with shuffling
2. Quiz selection UI component — Replace hardcoded 3 buttons with language-aware logic
3. NEW: `TopicsPage.tsx` — Create topics grid UI
4. Update routing to add `/topics` route

**Code Changes Required:** See "Codebase Changes Required" section below

**All 176 Questions:** See "All 176 Questions (Ready to Copy into Code)" section below

**Implementation Rules:**
- Keep all existing code intact; only add to premade quiz functions
- Ensure all question IDs are unique
- All questions are multiple-choice, 4 options each
- Enable `shuffleConfig: { questions: true, answers: true }` on all premade bundles
- No placeholders or TODOs
- Return complete, production-ready code

---

[REST OF FILE CONTENT - paste the full markdown above starting from "Codebase Changes Required" through all question sections]

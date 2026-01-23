# Quizleris Codebase Wellness Report 🩺

This report provides an overview of the current health of the Quizleris codebase, identifying strengths, technical debt, and recommendations for future maintenance.

## Executive Summary
The codebase is functional and modular, but relies heavily on direct DOM manipulation and global state. While this works well for a project of this scale, it introduces fragility as features grow (e.g., more question types, large image sets).

---

## File-by-File Audit

### 1. `ts/render.ts`
- **Good Parts**: Clear separation of rendering logic by question type. Robust image sanitizer.
- **Concerns**:
  - **Global Pollution**: Attaches `jumpTo` to `window`, which is prone to name collisions.
  - **Magic Strings**: Hardcoded CSS classes and IDs make renaming difficult.
  - **i18n Gaps**: Found hardcoded Lithuanian strings inside `renderNextButton`.

### 2. `ts/admin.ts`
- **Good Parts**: Advanced feature support (OCR, image resizing).
- **Concerns**:
  - **Extreme Complexity**: The file handles state sync, DOM generation, and event binding in a single monolithic flow.
  - **Fragile Sync**: `updateQuizFromDOM` relies on string parsing of `dataset.qidx`, which can break if the DOM structure changes slightly.
  - **URL Length Risks**: Sharing large quizzes via Base64 in URL is clever but hits browser limits (~8KB) very quickly with images.

### 3. `ts/storage.ts`
- **Good Parts**: Robust Base64 UTF-8 decoding. Smart two-pronged image storage (Registry vs Inline).
- **Concerns**:
  - **Data Cap**: `localStorage` (5-10MB limit) can be exhausted by just a few image-heavy quizzes.
  - **Cleanup**: No automated way to prune unused images from the registry when quizzes are ignored/replaced.

### 4. `ts/state.ts`
- **Good Parts**: Deep cloning of questions prevents accidental template mutation. Detailed per-question time tracking.
- **Concerns**:
  - **Global State**: `export let quiz` is a global mutable variable. Tracking who changes it and when is difficult.
  - **Grading Logic**: `gradeQuestion` is growing into a large switch-case; might eventually need strategy-pattern separation.

### 5. `ts/types.ts`
- **Good Parts**: Clear string-literal unions for modes and types.
- **Concerns**:
  - **Flat Structure**: The `Question` type is a "flat" object with many optional fields. It's unclear which fields are mandatory for which `QuestionType`.

### 6. `ts/app.ts` & `ts/menu.ts`
- **Good Parts**: Functional routing and language hot-swapping.
- **Concerns**:
  - **Routing**: Minimalist query-param routing is limited.
  - **i18n Inconsistency**: Some views use `data-i18n` attributes (DOM-based translation), while others use template literals (JS-based).

---

## Top Awareness Items & Recommendations

1.  **⚠️ URL Length Limit**: Base64 URLs are highly convenient but will fail for large quizzes. Recommend implementing a "Save to Cloud" or "Share as File" option if quizzes grow beyond 20 questions with images.
2.  **🛡️ Type Safety**: Refactor the `Question` type into a **Discriminated Union** to ensure that (e.g.) a `numeric` question *must* have a `correctAnswerNumber`.
3.  **📦 State Management**: Move away from the global `quiz` variable. Use a proper state container or even a simple Store pattern to track active quiz instances.
4.  **🌐 i18n Standardization**: Pick one translation strategy. The `data-i18n` approach is cleaner for static elements, while `t()` is better for highly dynamic templates.
5.  **🧹 Storage Pruning**: Implement a "Maintenance" routine in `storage.ts` that removes orphaned image registry entries to prevent `localStorage` overflow.

## Advice for Future Agents
- When adding a new question type: You must update `types.ts`, `state.ts` (grading), `render.ts` (view), and `admin.ts` (editor).
- Watch out for `innerHTML` replacements in `admin.ts` and `menu.ts`; they destroy existing event listeners on those elements.
- Always run `npm run build` after changes, as the inter-dependency between modules is tight.

// Typed DOM helper to avoid null checks later
export function getRequiredElement(id) {
    const el = document.getElementById(id);
    if (!el) {
        throw new Error(`Root element #${id} not found in index.html`);
    }
    return el;
}
// DOM refs (non-null, typed) - initialized immediately
export const questionContainer = getRequiredElement("question-container");
export const answersContainer = getRequiredElement("answers-container");
export const statusContainer = getRequiredElement("status-container");
//# sourceMappingURL=dom.js.map
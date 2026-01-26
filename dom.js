// Typed DOM helper to avoid null checks later
export function getRequiredElement(id) {
    const el = document.getElementById(id);
    if (!el) {
        const msg = `CRITICAL ERROR: Root element #${id} not found in index.html`;
        alert(msg);
        throw new Error(msg);
    }
    return el;
}
// DOM refs (non-null, typed) - initialized immediately
export const questionContainer = getRequiredElement("question-container");
export const answersContainer = getRequiredElement("answers-container");
export const statusContainer = getRequiredElement("status-container");

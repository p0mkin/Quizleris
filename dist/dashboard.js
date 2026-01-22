import { getRequiredElement } from "./dom.js";
import { getResults, STORAGE_KEY_RESULTS } from "./storage.js";
import { renderStartMenu } from "./menu.js";
let dashboardView;
let dashboardContent;
let closeBtn;
let clearBtn;
export function initDashboardElements() {
    dashboardView = getRequiredElement("dashboard-view");
    dashboardContent = getRequiredElement("dashboard-content");
    closeBtn = getRequiredElement("dashboard-close-btn");
    clearBtn = getRequiredElement("dashboard-clear-btn");
    closeBtn.addEventListener("click", () => {
        dashboardView.style.display = "none";
        renderStartMenu();
    });
    clearBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to clear all history?")) {
            localStorage.removeItem(STORAGE_KEY_RESULTS);
            renderDashboardList();
        }
    });
}
export function renderDashboard() {
    if (!dashboardView)
        initDashboardElements();
    // Hide others (handled by caller usually, but let's be safe or assume caller handles it)
    // The caller (menu.ts) should hide itself.
    dashboardView.style.display = "block";
    renderDashboardList();
}
function renderDashboardList() {
    const results = getResults();
    if (results.length === 0) {
        dashboardContent.innerHTML = "<p class='no-results'>No results recorded yet.</p>";
        clearBtn.disabled = true;
        return;
    }
    clearBtn.disabled = false;
    // Sort by date desc
    results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    let html = `
        <table class="dashboard-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Name</th>
                    <th>Quiz</th>
                    <th>Score</th>
                </tr>
            </thead>
            <tbody>
    `;
    results.forEach(r => {
        const dateStr = new Date(r.date).toLocaleDateString() + " " + new Date(r.date).toLocaleTimeString();
        const percentage = Math.round((r.score / r.maxScore) * 100);
        const scoreClass = percentage >= 80 ? "good" : percentage < 50 ? "bad" : "avg";
        html += `
            <tr>
                <td>${dateStr}</td>
                <td>${r.name}</td>
                <td>${r.quizId}</td>
                <td class="score-${scoreClass}">
                    ${r.score}/${r.maxScore} (${percentage}%)
                </td>
            </tr>
        `;
    });
    html += `</tbody></table>`;
    dashboardContent.innerHTML = html;
}
//# sourceMappingURL=dashboard.js.map
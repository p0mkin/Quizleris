import { getRequiredElement } from "./dom.js";
import { getResults, getHighScores, STORAGE_KEY_RESULTS } from "./storage.js";
// import { renderStartMenu } from "./menu.js"; // REMOVED

let dashboardView: HTMLElement;
let dashboardContent: HTMLElement;
let closeBtn: HTMLButtonElement;
let clearBtn: HTMLButtonElement;

export function setupDashboard(callbacks: { onHome: () => void }): void {
    dashboardView = getRequiredElement("dashboard-view");
    dashboardContent = getRequiredElement("dashboard-content");
    closeBtn = getRequiredElement("dashboard-close-btn") as HTMLButtonElement;
    clearBtn = getRequiredElement("dashboard-clear-btn") as HTMLButtonElement;

    closeBtn.addEventListener("click", () => {
        dashboardView.style.display = "none";
        callbacks.onHome();
    });

    clearBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to clear all history?")) {
            localStorage.removeItem(STORAGE_KEY_RESULTS);
            renderDashboardList();
        }
    });
}

export function renderDashboard(): void {
    // if (!dashboardView) setupDashboard(); // Can't auto init without callbacks anymore logic


    // Hide others (handled by caller usually, but let's be safe or assume caller handles it)
    // The caller (menu.ts) should hide itself.
    dashboardView.style.display = "block";
    renderDashboardList();
}

function renderDashboardList(): void {
    const results = getResults();
    const highScores = getHighScores();

    if (results.length === 0) {
        dashboardContent.innerHTML = "<p class='no-results'>No results recorded yet.</p>";
        clearBtn.disabled = true;
        return;
    }

    clearBtn.disabled = false;

    // Sort by date desc
    results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let html = `
        <div style="display:flex; gap:20px; flex-wrap:wrap;">
            <div style="flex:1; min-width:300px;">
                <h3 style="margin-bottom:10px; color:var(--accent);">Recent Activity</h3>
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

    html += `</tbody></table></div>`;

    // High Scores Section
    html += `
        <div style="flex:1; min-width:300px;">
            <h3 style="margin-bottom:10px; color:var(--success);">High Scores</h3>
             <table class="dashboard-table">
                <thead>
                    <tr>
                        <th>Quiz ID</th>
                        <th>Top Student</th>
                        <th>Score</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
    `;

    highScores.forEach(h => {
        const percentage = Math.round((h.score / h.maxScore) * 100);
        html += `
            <tr>
                <td>${h.quizId}</td>
                <td>${h.name}</td>
                <td class="score-good">${h.score}/${h.maxScore} (${percentage}%)</td>
                <td>${new Date(h.date).toLocaleDateString()}</td>
            </tr>
         `;
    });

    html += `</tbody></table></div></div>`;

    dashboardContent.innerHTML = html;
}

// Admin authentication constants
export const ADMIN_PASSWORD_KEY = "quiz_admin_password";
export const ADMIN_PASSWORD_HASH_KEY = "quiz_admin_password_hash";
export const ADMIN_SESSION_KEY = "quiz_admin_session";
// Check if admin access is allowed (session flag only)
export function isAdminAccessAllowed() {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

async function hashPassword(password) {
    try {
        if (window.crypto?.subtle && window.TextEncoder) {
            const data = new TextEncoder().encode(password);
            const digest = await window.crypto.subtle.digest("SHA-256", data);
            return Array.from(new Uint8Array(digest))
                .map(b => b.toString(16).padStart(2, "0"))
                .join("");
        }
    }
    catch {
        // Fall through to weak fallback (still avoids plaintext persistence)
    }
    return btoa(unescape(encodeURIComponent(password)));
}
// Prompt for admin password
export async function promptAdminPassword() {
    let storedHash = localStorage.getItem(ADMIN_PASSWORD_HASH_KEY);
    const legacyPassword = localStorage.getItem(ADMIN_PASSWORD_KEY);
    if (!storedHash && legacyPassword) {
        storedHash = await hashPassword(legacyPassword);
        localStorage.setItem(ADMIN_PASSWORD_HASH_KEY, storedHash);
        localStorage.removeItem(ADMIN_PASSWORD_KEY);
    }
    // If no password set, set one now
    if (!storedHash) {
        const newPassword = prompt("Set admin password (you'll need this to access admin mode):");
        if (!newPassword)
            return false;
        const newHash = await hashPassword(newPassword);
        localStorage.setItem(ADMIN_PASSWORD_HASH_KEY, newHash);
        localStorage.removeItem(ADMIN_PASSWORD_KEY);
        sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
        return true;
    }
    // Verify password
    const entered = prompt("Enter admin password:");
    if (!entered)
        return false;
    const enteredHash = await hashPassword(entered);
    if (enteredHash === storedHash) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
        return true;
    }
    alert("Incorrect password.");
    return false;
}

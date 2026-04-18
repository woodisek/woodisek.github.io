// Zobrazení toast notifikace - používá existující #toast-container
let toastTimeout = null;

export function showNotification(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    const toastText = document.getElementById('toast-text');
    const toastIcon = document.getElementById('toast-icon');
    
    if (!toastContainer || !toastText || !toastIcon) {
        // Fallback - vytvoř nový toast
        createFallbackToast(message, type);
        return;
    }
    
    // Různé ikony podle typu
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toastIcon.textContent = icons[type] || '🔔';
    toastText.textContent = message;
    
    // Zobraz toast
    toastContainer.classList.remove('show');
    void toastContainer.offsetWidth; // force reflow
    toastContainer.classList.add('show');
    
    // Schovat po 2 sekundách
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toastContainer.classList.remove('show');
    }, 2000);
}

// Fallback pro případ, že #toast-container neexistuje
function createFallbackToast(message, type) {
    const existingToast = document.querySelector('.toast-fallback');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-fallback';
    
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    toast.textContent = `${icons[type] || '🔔'} ${message}`;
    
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--card);
        color: var(--text);
        padding: 12px 24px;
        border-radius: 40px;
        border: 1px solid var(--accent);
        z-index: 10001;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideUp 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// Rychlé notifikace
export const notify = {
    success: (msg) => showNotification(msg, 'success'),
    error: (msg) => showNotification(msg, 'error'),
    warning: (msg) => showNotification(msg, 'warning'),
    info: (msg) => showNotification(msg, 'info')
};
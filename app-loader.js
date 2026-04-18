console.log('✅ app-loader.js loaded');
// app-loader.js
import { apps } from './apps-manifest.js';


let currentModal = null;

export function initAppsGrid() {
    // Nejprve zkus najít existující kontejner
    let container = document.getElementById('apps-grid-container');
    
    // Pokud neexistuje, vytvoř ho
    if (!container) {
        const appsSection = document.getElementById('apps-section');
        if (!appsSection) {
            console.error('apps-section not found');
            return;
        }
        
        // Vytvoř grid container
        container = document.createElement('div');
        container.id = 'apps-grid-container';
        container.className = 'apps-grid';
        appsSection.appendChild(container);
    }
    
    // Nastav správné CSS třídy
    container.className = 'apps-grid';
    
    // Zobraz apps-section
    const appsSection = document.getElementById('apps-section');
    if (appsSection) appsSection.style.display = 'block';
    
    // Vykresli karty aplikací
    container.innerHTML = apps.map(app => `
        <div class="app-card" data-app-id="${app.id}">
            <div class="app-icon">${app.icon || '🛠️'}</div>
            <h3 class="app-name">${escapeHtml(app.name)}</h3>
            <p class="app-desc">${escapeHtml(app.description)}</p>
        </div>
    `).join('');
    
    // Přidej event listenery
    document.querySelectorAll('.app-card').forEach(card => {
        card.addEventListener('click', () => openAppModal(card.dataset.appId));
    });
    
    console.log('✅ Apps grid rendered, found', apps.length, 'apps');
}

async function openAppModal(appId) {
    const app = apps.find(a => a.id === appId);
    if (!app) return;

    if (app.css) {
        loadAppCSS(app.css);
    }
    
    const modal = document.createElement('div');
    modal.className = 'app-modal-overlay';
    modal.innerHTML = `
        <div class="app-modal-content">
            <div class="app-modal-header">
                <h3>${app.icon} ${escapeHtml(app.name)}</h3>
                <div class="app-modal-actions">
                    <button class="app-modal-fullscreen" title="Celá obrazovka">⛶</button>
                    <button class="app-modal-close">&times;</button>
                </div>
            </div>
            <div class="app-modal-body"></div>
        </div>
    `;
    
    document.body.appendChild(modal);
    currentModal = modal;
    
    const fullscreenBtn = modal.querySelector('.app-modal-fullscreen');
    fullscreenBtn.onclick = () => {
        modal.classList.toggle('fullscreen');
    };
    
    modal.querySelector('.app-modal-close').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    
    const body = modal.querySelector('.app-modal-body');
    
    // 🔥 VLASTNÍ SPINNER - IGNORUJE VŠECHNY CSS APLIKACÍ
    body.innerHTML = '';
    body.style.cssText = `
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 0 !important;
        margin: 0 !important;
        min-height: 200px !important;
        background: transparent !important;
    `;
    
    const spinner = document.createElement('div');
    spinner.style.cssText = `
        width: 30px;
        height: 30px;
        border: 3px solid var(--border);
        border-top-color: var(--accent);
        border-radius: 10PX;
        animation: appSpin 0.8s linear infinite;
        display: block;
    `;
    
    if (!document.querySelector('#app-spinner-style')) {
        const style = document.createElement('style');
        style.id = 'app-spinner-style';
        style.textContent = `@keyframes appSpin { to { transform: rotate(360deg); } }`;
        document.head.appendChild(style);
    }
    
    body.appendChild(spinner);
    
    try {
        const module = await app.component();
        const render = module.default;
        body.innerHTML = '';
        body.style.cssText = ''; // Vrátíme původní styly
        render(body);
    } catch (error) {
        console.error('Chyba při načítání aplikace:', error);
        body.innerHTML = '<div class="error">❌ Chyba při načítání nástroje</div>';
    }
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Načtení CSS pro aplikaci
function loadAppCSS(cssPath) {
    if (!cssPath) {
        console.log('❌ CSS cesta není definována');
        return;
    }
    
    console.log('📦 Načítám CSS:', cssPath);
    
    if (document.querySelector(`link[href="${cssPath}"]`)) {
        console.log('✅ CSS již bylo načteno');
        return;
    }
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssPath;
    document.head.appendChild(link);
    console.log('✅ CSS přidáno do hlavičky:', cssPath);
}


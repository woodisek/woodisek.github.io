import { copyToClipboard } from '../clipboard.js';
import { showNotification } from '../notify.js';
import { getStorage } from '../storage.js';

const storage = getStorage('departure-planner-pro');

export default function render(container) {
    container.innerHTML = `
        <div class="departure-planner-pro">
            <div class="dpp-header">
                <span class="dpp-icon">🚗</span>
                <div>
                    <h3>Time Backplanner - Odjezd</h3>
                    <p>Naplánuj si cestu</p>
                </div>
            </div>

            <!-- CÍLOVÝ ČAS -->
            <div class="dpp-section">
                <label class="dpp-label">🎯 Cílový čas</label>
                <input type="time" id="dpp-target-time" class="dpp-input" value="14:00">
                <div class="dpp-hint">Kdy přesně tam musíš být?</div>
            </div>

            <!-- SEZNAM KROKŮ -->
            <div class="dpp-section">
                <div class="dpp-steps-header">
                    <label class="dpp-label">📋 Seznam kroků</label>
                    <button id="dpp-add-step" class="dpp-small-btn">➕ Přidat krok</button>
                </div>
                <div id="dpp-steps-list" class="dpp-steps-list">
                    <div class="dpp-empty-steps">Přidej první krok (např. cesta, příprava, zastávka)</div>
                </div>
                <div class="dpp-hint">💡 Kroky se počítají od cíle zpětně. Každý krok má název, trvání a volitelnou rezervu.</div>
            </div>

            <!-- Tlačítka -->
            <div class="dpp-buttons">
                <button id="dpp-calculate" class="dpp-btn dpp-btn-primary">⏰ Spočítat čas odjezdu</button>
                <button id="dpp-clear" class="dpp-btn dpp-btn-secondary">🔄️ Reset</button>
            </div>

            <!-- VÝSLEDEK -->
            <div class="dpp-result-section">
                <div class="dpp-result-header">
                    <span>📋 Výsledný plán</span>
                    <button id="dpp-copy" class="dpp-small-btn">📋 Kopírovat</button>
                </div>
                <div id="dpp-result" class="dpp-result">
                    <div class="dpp-empty">Přidej kroky a klikni na "Spočítat čas odjezdu"</div>
                </div>
            </div>

            <!-- Přednastavené šablony -->
            <details class="dpp-details">
                <summary>📋 Přednastavené šablony</summary>
                <div class="dpp-templates">
                    <button data-template="work" class="dpp-template-btn">💼 Cesta do práce</button>
                    <button data-template="airport" class="dpp-template-btn">✈️ Cesta na letiště</button>
                    <button data-template="meeting" class="dpp-template-btn">🤝 Důležitá schůzka</button>
                    <button data-template="school" class="dpp-template-btn">🏫 Vyzvednutí dítěte</button>
                </div>

        </div>
    `;

    // ========== DOM elementy ==========
    const targetTimeInput = document.getElementById('dpp-target-time');
    const stepsListDiv = document.getElementById('dpp-steps-list');
    const addStepBtn = document.getElementById('dpp-add-step');
    const calculateBtn = document.getElementById('dpp-calculate');
    const clearBtn = document.getElementById('dpp-clear');
    const copyBtn = document.getElementById('dpp-copy');
    const resultDiv = document.getElementById('dpp-result');
    const templateBtns = document.querySelectorAll('.dpp-template-btn');

    // Šablony
    const templates = {
        work: [
            { name: "🏠 Ranní příprava", duration: 30, reserve: 5 },
            { name: "🚗 Cesta do práce", duration: 45, reserve: 10 },
            { name: "🅿️ Hledání parkování", duration: 10, reserve: 5 }
        ],
        airport: [
            { name: "🧳 Balení kufrů", duration: 60, reserve: 15 },
            { name: "🚗 Cesta na letiště", duration: 90, reserve: 20 },
            { name: "🅿️ Parkování na letišti", duration: 15, reserve: 10 },
            { name: "✈️ Odbavení a bezpečnost", duration: 45, reserve: 15 }
        ],
        meeting: [
            { name: "👔 Příprava materiálů", duration: 20, reserve: 5 },
            { name: "🚗 Cesta na schůzku", duration: 30, reserve: 10 },
            { name: "☕ Rezerva na zpoždění", duration: 0, reserve: 15 }
        ],
        school: [
            { name: "👕 Oblékání dítěte", duration: 15, reserve: 5 },
            { name: "🚶 Cesta do školy", duration: 20, reserve: 5 }
        ]
    };

    let steps = [];
    let currentResult = null;

    // Výchozí kroky
    function getDefaultSteps() {
        return [
            { id: Date.now(), name: "🏠 Příprava doma", duration: 30, reserve: 10, isEditing: false },
            { id: Date.now() + 1, name: "🚗 Cesta", duration: 45, reserve: 10, isEditing: false }
        ];
    }

    // Renderování seznamu kroků
    function renderStepsList() {
        if (steps.length === 0) {
            stepsListDiv.innerHTML = '<div class="dpp-empty-steps">Přidej první krok (např. cesta, příprava, zastávka)</div>';
            return;
        }

        stepsListDiv.innerHTML = steps.map((step, idx) => `
            <div class="dpp-step-item" data-id="${step.id}">
                <div class="dpp-step-header">
                    <span class="dpp-step-number">${idx + 1}.</span>
                    ${step.isEditing ? `
                        <input type="text" class="dpp-step-name-edit" value="${escapeHtml(step.name)}" data-id="${step.id}">
                    ` : `
                        <span class="dpp-step-name">${escapeHtml(step.name)}</span>
                    `}
                    <div class="dpp-step-actions">
                        <button class="dpp-step-edit" data-id="${step.id}">✏️</button>
                        <button class="dpp-step-delete" data-id="${step.id}">🗑️</button>
                    </div>
                </div>
                <div class="dpp-step-body">
                    <div class="dpp-step-time">
                        <span>⏱️ Trvání:</span>
                        <div class="dpp-time-control">
                            <button class="dpp-time-minus" data-id="${step.id}" data-field="duration">−</button>
                            <input type="number" class="dpp-time-input" data-id="${step.id}" data-field="duration" value="${step.duration}" min="0" max="720" step="5">
                            <button class="dpp-time-plus" data-id="${step.id}" data-field="duration">+</button>
                            <span class="dpp-time-unit">min</span>
                        </div>
                    </div>
                    <div class="dpp-step-reserve">
                        <span>🛡️ Rezerva:</span>
                        <div class="dpp-time-control">
                            <button class="dpp-time-minus" data-id="${step.id}" data-field="reserve">−</button>
                            <input type="number" class="dpp-time-input" data-id="${step.id}" data-field="reserve" value="${step.reserve}" min="0" max="120" step="5">
                            <button class="dpp-time-plus" data-id="${step.id}" data-field="reserve">+</button>
                            <span class="dpp-time-unit">min</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // Eventy pro editaci
        document.querySelectorAll('.dpp-step-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(btn.dataset.id);
                const step = steps.find(s => s.id === id);
                if (step) {
                    step.isEditing = true;
                    renderStepsList();
                }
            });
        });

        document.querySelectorAll('.dpp-step-name-edit').forEach(input => {
            input.addEventListener('blur', (e) => {
                const id = parseInt(input.dataset.id);
                const step = steps.find(s => s.id === id);
                if (step) {
                    step.name = input.value || "Krok";
                    step.isEditing = false;
                    renderStepsList();
                    saveSettings();
                }
            });
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    input.blur();
                }
            });
        });

        document.querySelectorAll('.dpp-step-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(btn.dataset.id);
                steps = steps.filter(s => s.id !== id);
                renderStepsList();
                saveSettings();
                showNotification('Krok smazán');
            });
        });

        // Eventy pro +/-
        document.querySelectorAll('.dpp-time-minus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(btn.dataset.id);
                const field = btn.dataset.field;
                const step = steps.find(s => s.id === id);
                if (step) {
                    const val = step[field];
                    const stepVal = field === 'duration' ? 5 : 5;
                    if (val >= stepVal) step[field] = val - stepVal;
                    renderStepsList();
                    saveSettings();
                }
            });
        });

        document.querySelectorAll('.dpp-time-plus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(btn.dataset.id);
                const field = btn.dataset.field;
                const step = steps.find(s => s.id === id);
                if (step) {
                    const val = step[field];
                    const maxVal = field === 'duration' ? 720 : 120;
                    if (val < maxVal) step[field] = val + 5;
                    renderStepsList();
                    saveSettings();
                }
            });
        });

        document.querySelectorAll('.dpp-time-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const id = parseInt(input.dataset.id);
                const field = input.dataset.field;
                const step = steps.find(s => s.id === id);
                if (step) {
                    let val = parseInt(input.value) || 0;
                    const maxVal = field === 'duration' ? 720 : 120;
                    if (val < 0) val = 0;
                    if (val > maxVal) val = maxVal;
                    step[field] = val;
                    renderStepsList();
                    saveSettings();
                }
            });
        });
    }

    function addStep() {
        const newId = Date.now();
        steps.push({
            id: newId,
            name: "📌 Nový krok",
            duration: 15,
            reserve: 5,
            isEditing: true
        });
        renderStepsList();
        saveSettings();
        showNotification('Nový krok přidán');
    }

    function calculateSchedule() {
        const targetTime = targetTimeInput.value;
        if (!targetTime) {
            showNotification('Zadej cílový čas', 'warning');
            return;
        }

        if (steps.length === 0) {
            showNotification('Přidej alespoň jeden krok', 'warning');
            return;
        }

        function timeToMinutes(timeStr) {
            const [hours, minutes] = timeStr.split(':');
            return parseInt(hours) * 60 + parseInt(minutes);
        }

        function minutesToTime(minutes) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        }

        function formatTime(timeStr) {
            const [hours, minutes] = timeStr.split(':');
            return `${hours}.${minutes}`;
        }

        const targetMinutes = timeToMinutes(targetTime);
        let currentTime = targetMinutes;
        const schedule = [];

        // Počítáme od cíle zpětně
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const totalDuration = step.duration + step.reserve;
            const startTime = currentTime - totalDuration;
            
            schedule.push({
                name: step.name,
                duration: step.duration,
                reserve: step.reserve,
                startTime: startTime,
                endTime: currentTime,
                startTimeStr: minutesToTime(startTime),
                endTimeStr: minutesToTime(currentTime)
            });
            
            currentTime = startTime;
        }

        const departureTime = currentTime;
        const departureTimeStr = minutesToTime(departureTime);
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const isDepartureLate = departureTime < nowMinutes;

        // Zobrazení výsledku
        let resultHtml = `
            <div class="dpp-result-card">
                <div class="dpp-timeline">
        `;

        for (let i = schedule.length - 1; i >= 0; i--) {
            const item = schedule[i];
            resultHtml += `
                <div class="dpp-timeline-item">
                    <div class="dpp-timeline-time">${formatTime(item.startTimeStr)} – ${formatTime(item.endTimeStr)}</div>
                    <div class="dpp-timeline-label">${escapeHtml(item.name)}</div>
                    <div class="dpp-timeline-desc">⏱️ ${item.duration} min + ${item.reserve} min rezerva</div>
                </div>
                ${i > 0 ? '<div class="dpp-timeline-arrow">↓</div>' : ''}
            `;
        }

        resultHtml += `
                    <div class="dpp-timeline-item dpp-timeline-goal">
                        <div class="dpp-timeline-time">🎯 ${formatTime(targetTime)}</div>
                        <div class="dpp-timeline-label">Cíl - být na místě</div>
                    </div>
                </div>
                
                <div class="dpp-summary">
                    <div class="dpp-summary-row ${isDepartureLate ? 'dpp-warning' : ''}">
                        <span>🚗 Čas odjezdu:</span>
                        <strong>${formatTime(departureTimeStr)}</strong>
                        ${isDepartureLate ? '<span class="dpp-warning-text"> (⚠️ Už bys měl být na cestě!)</span>' : ''}
                    </div>
                    <div class="dpp-summary-row">
                        <span>📊 Celkový čas:</span>
                        <strong>${Math.floor((targetMinutes - departureTime) / 60)} hodin ${(targetMinutes - departureTime) % 60} minut</strong>
                    </div>
                </div>
            </div>
        `;

        resultDiv.innerHTML = resultHtml;
        currentResult = schedule;
        showNotification(`Musíš vyjet v ${formatTime(departureTimeStr)}`, 'success');
        saveSettings();
    }

    function loadTemplate(templateName) {
        const template = templates[templateName];
        if (template) {
            steps = template.map((item, idx) => ({
                id: Date.now() + idx,
                name: item.name,
                duration: item.duration,
                reserve: item.reserve,
                isEditing: false
            }));
            renderStepsList();
            saveSettings();
            showNotification(`Šablona "${templateName}" načtena`);
        }
    }

    async function copyResult() {
        const resultText = resultDiv.innerText;
        if (resultText && !resultText.includes('Přidej kroky')) {
            await copyToClipboard(resultText);
            showNotification('Plán zkopírován');
        } else {
            showNotification('Nejprve spočítej čas odjezdu', 'warning');
        }
    }

    function clearAll() {
        steps = [];
        targetTimeInput.value = '14:00';
        renderStepsList();
        resultDiv.innerHTML = '<div class="dpp-empty">Přidej kroky a klikni na "Spočítat čas odjezdu"</div>';
        showNotification('Vyčištěno');
        saveSettings();
    }

    function escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Eventy
    addStepBtn.addEventListener('click', addStep);
    calculateBtn.addEventListener('click', calculateSchedule);
    clearBtn.addEventListener('click', clearAll);
    copyBtn.addEventListener('click', copyResult);
    targetTimeInput.addEventListener('change', saveSettings);

    templateBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            loadTemplate(btn.dataset.template);
        });
    });

    function saveSettings() {
        storage.set('steps', steps);
        storage.set('targetTime', targetTimeInput.value);
    }

    function loadSettings() {
        const savedSteps = storage.get('steps', []);
        const savedTargetTime = storage.get('targetTime', '14:00');
        
        if (savedSteps.length > 0) {
            steps = savedSteps;
        } else {
            steps = getDefaultSteps();
        }
        
        targetTimeInput.value = savedTargetTime;
        renderStepsList();
    }

    loadSettings();
}

export function cleanup() {
    console.log('Departure Planner Pro se zavírá');
}
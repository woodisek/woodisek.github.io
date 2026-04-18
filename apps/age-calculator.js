// apps/age-calculator.js
import { copyToClipboard } from '../clipboard.js';
import { showNotification } from '../notify.js';
import { getStorage } from '../storage.js';

const storage = getStorage('age-calculator');

// Znamení zvěrokruhu
const zodiacSigns = [
    { name: '♈ Beran', start: [3, 21], end: [4, 19] },
    { name: '♉ Býk', start: [4, 20], end: [5, 20] },
    { name: '♊ Blíženci', start: [5, 21], end: [6, 20] },
    { name: '♋ Rak', start: [6, 21], end: [7, 22] },
    { name: '♌ Lev', start: [7, 23], end: [8, 22] },
    { name: '♍ Panna', start: [8, 23], end: [9, 22] },
    { name: '♎ Váhy', start: [9, 23], end: [10, 22] },
    { name: '♏ Štír', start: [10, 23], end: [11, 21] },
    { name: '♐ Střelec', start: [11, 22], end: [12, 21] },
    { name: '♑ Kozoroh', start: [12, 22], end: [1, 19] },
    { name: '♒ Vodnář', start: [1, 20], end: [2, 18] },
    { name: '♓ Ryby', start: [2, 19], end: [3, 20] }
];

// Dny v týdnu
const weekDays = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];

function getZodiac(day, month) {
    for (const sign of zodiacSigns) {
        const [startMonth, startDay] = sign.start;
        const [endMonth, endDay] = sign.end;
        
        if ((month === startMonth && day >= startDay) || (month === endMonth && day <= endDay)) {
            return sign.name;
        }
        if (startMonth === 12 && endMonth === 1 && (month === 12 && day >= startDay) || (month === 1 && day <= endDay)) {
            return sign.name;
        }
    }
    return '♑ Kozoroh';
}

export default function render(container) {
    container.innerHTML = `
        <div class="age-calculator">
            <div class="ac-header">
                <span class="ac-icon">🎂</span>
                <div>
                    <h3>Kalkulačka věku</h3>
                    <p>Zjisti přesný věk z data narození</p>
                </div>
            </div>

            <div class="ac-form">
                <div class="ac-section">
                    <label class="ac-label">📅 Datum narození <span class="ac-required">*</span></label>
                    <input type="date" id="ac-birthdate" class="ac-input">
                </div>

                <div class="ac-section">
                    <label class="ac-label">📅 K datu <span class="ac-optional">(nepovinné)</span></label>
                    <input type="date" id="ac-target-date" class="ac-input">
                </div>
            </div>

            <div class="ac-buttons">
                <button id="ac-calculate" class="ac-btn ac-btn-primary">
                    <span class="ac-btn-icon">🎂</span>
                    <span>Spočítat věk</span>
                </button>
            </div>

            <div id="ac-results" class="ac-results" style="display: none;">
                <div class="ac-results-grid">
                    <div class="ac-result-card">
                        <div class="ac-result-value" id="ac-years">0</div>
                        <div class="ac-result-label">let</div>
                    </div>
                    <div class="ac-result-card">
                        <div class="ac-result-value" id="ac-months">0</div>
                        <div class="ac-result-label">měsíců</div>
                    </div>
                    <div class="ac-result-card">
                        <div class="ac-result-value" id="ac-days">0</div>
                        <div class="ac-result-label">dní</div>
                    </div>
                    <div class="ac-result-card">
                        <div class="ac-result-value" id="ac-weeks">0</div>
                        <div class="ac-result-label">týdnů</div>
                    </div>
                </div>

                <div class="ac-divider"></div>

                <div class="ac-stats-grid">
                    <div class="ac-stat-card">
                        <div class="ac-stat-icon">📆</div>
                        <div class="ac-stat-value" id="ac-total-days">0</div>
                        <div class="ac-stat-label">celkem dní</div>
                    </div>
                    <div class="ac-stat-card">
                        <div class="ac-stat-icon">📅</div>
                        <div class="ac-stat-value" id="ac-total-weeks">0</div>
                        <div class="ac-stat-label">celkem týdnů</div>
                    </div>
                    <div class="ac-stat-card">
                        <div class="ac-stat-icon">📊</div>
                        <div class="ac-stat-value" id="ac-total-months">0</div>
                        <div class="ac-stat-label">celkem měsíců</div>
                    </div>
                    <div class="ac-stat-card">
                        <div class="ac-stat-icon">🎈</div>
                        <div class="ac-stat-value" id="ac-next-birthday">0</div>
                        <div class="ac-stat-label">dní do narozenin</div>
                    </div>
                </div>

                <div class="ac-divider"></div>

                <div class="ac-info-grid">
                    <div class="ac-info-card">
                        <div class="ac-info-icon">🔮</div>
                        <div class="ac-info-value" id="ac-zodiac">-</div>
                        <div class="ac-info-label">znamení zvěrokruhu</div>
                    </div>
                    <div class="ac-info-card">
                        <div class="ac-info-icon">📅</div>
                        <div class="ac-info-value" id="ac-weekday">-</div>
                        <div class="ac-info-label">den v týdnu narození</div>
                    </div>
                </div>
            </div>

            <div id="ac-reset-container" class="ac-reset" style="display: none;">
                <button id="ac-reset" class="ac-btn ac-btn-secondary">
                    <span class="ac-btn-icon">🔄</span>
                    <span>Reset</span>
                </button>
            </div>
        </div>
    `;

    // DOM elementy
    const birthdateInput = document.getElementById('ac-birthdate');
    const targetDateInput = document.getElementById('ac-target-date');
    const calculateBtn = document.getElementById('ac-calculate');
    const resetContainer = document.getElementById('ac-reset-container');
    const resetBtn = document.getElementById('ac-reset');
    const resultsDiv = document.getElementById('ac-results');

    const yearsSpan = document.getElementById('ac-years');
    const monthsSpan = document.getElementById('ac-months');
    const daysSpan = document.getElementById('ac-days');
    const weeksSpan = document.getElementById('ac-weeks');
    const totalDaysSpan = document.getElementById('ac-total-days');
    const totalWeeksSpan = document.getElementById('ac-total-weeks');
    const totalMonthsSpan = document.getElementById('ac-total-months');
    const nextBirthdaySpan = document.getElementById('ac-next-birthday');
    const zodiacSpan = document.getElementById('ac-zodiac');
    const weekdaySpan = document.getElementById('ac-weekday');

    function calculateAge() {
        const birthdateStr = birthdateInput.value;
        if (!birthdateStr) {
            showNotification('Zadej prosím datum narození', 'warning');
            return;
        }

        const birthDate = new Date(birthdateStr);
        const targetDate = targetDateInput.value ? new Date(targetDateInput.value) : new Date();
        
        if (isNaN(birthDate.getTime())) {
            showNotification('Neplatné datum narození', 'error');
            return;
        }

        // Výpočet věku
        let years = targetDate.getFullYear() - birthDate.getFullYear();
        let months = targetDate.getMonth() - birthDate.getMonth();
        let days = targetDate.getDate() - birthDate.getDate();

        if (days < 0) {
            months--;
            const lastMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 0);
            days += lastMonth.getDate();
        }
        if (months < 0) {
            years--;
            months += 12;
        }

        // Celkový počet dní
        const totalDays = Math.floor((targetDate - birthDate) / (1000 * 60 * 60 * 24));
        const totalWeeks = Math.floor(totalDays / 7);
        const totalMonths = years * 12 + months;

        // Dny do dalších narozenin
        const nextBirthday = new Date(targetDate.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        if (nextBirthday < targetDate) {
            nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
        }
        const daysToBirthday = Math.ceil((nextBirthday - targetDate) / (1000 * 60 * 60 * 24));

        // Znamení zvěrokruhu
        const zodiac = getZodiac(birthDate.getDate(), birthDate.getMonth() + 1);
        
        // Den v týdnu narození
        const weekday = weekDays[birthDate.getDay()];

        // Zobrazení výsledků
        yearsSpan.textContent = years;
        monthsSpan.textContent = months;
        daysSpan.textContent = days;
        weeksSpan.textContent = Math.floor(days / 7);
        totalDaysSpan.textContent = totalDays.toLocaleString();
        totalWeeksSpan.textContent = totalWeeks.toLocaleString();
        totalMonthsSpan.textContent = totalMonths.toLocaleString();
        nextBirthdaySpan.textContent = daysToBirthday;
        zodiacSpan.textContent = zodiac;
        weekdaySpan.textContent = weekday;

        resultsDiv.style.display = 'block';
        resetContainer.style.display = 'flex';  // 🔥 Zobrazí reset tlačítko
        
        saveSettings();
        showNotification(`Věk spočítán: ${years} let`, 'success');
    }

    function reset() {
        birthdateInput.value = '';
        targetDateInput.value = '';
        resultsDiv.style.display = 'none';
        resetContainer.style.display = 'none';  // 🔥 Schová reset tlačítko
        saveSettings();
        showNotification('Formulář vyčištěn');
    }

    function saveSettings() {
        storage.set('birthdate', birthdateInput.value);
        storage.set('targetDate', targetDateInput.value);
    }

    function loadSettings() {
        const savedBirthdate = storage.get('birthdate', '');
        const savedTargetDate = storage.get('targetDate', '');
        
        if (savedBirthdate) birthdateInput.value = savedBirthdate;
        if (savedTargetDate) targetDateInput.value = savedTargetDate;
        
        if (savedBirthdate) {
            calculateAge();
        }
    }

    calculateBtn.addEventListener('click', calculateAge);
    resetBtn.addEventListener('click', reset);
    
    loadSettings();
}

export function cleanup() {
    console.log('Age Calculator se zavírá');
}
import { copyToClipboard } from '../clipboard.js';
import { showNotification } from '../notify.js';
import { getStorage } from '../storage.js';

const storage = getStorage('bmi-calculator');

export default function render(container) {
    container.innerHTML = `
        <div class="bmi-calculator-new">
            <div class="bmi-header">
                <span class="bmi-icon">⚖️</span>
                <div>
                    <h3>BMI Kalkulačka</h3>
                    <p>Spočítej si své BMI a sleduj zdraví</p>
                </div>
            </div>

            <!-- Přepínání pohlaví -->
            <div class="bmi-section">
                <label class="bmi-label">👤 Pohlaví</label>
                <div class="bmi-gender">
                    <button data-gender="male" class="bmi-gender-btn active">👨 Muž</button>
                    <button data-gender="female" class="bmi-gender-btn">👩 Žena</button>
                </div>
            </div>

            <!-- Výška -->
            <div class="bmi-section">
                <label class="bmi-label">📏 Výška (cm)</label>
                <div class="bmi-input-group">
                    <input type="number" id="bmi-height" class="bmi-input" value="175" step="1" min="100" max="250">
                    <span class="bmi-unit">cm</span>
                </div>
            </div>

            <!-- Váha -->
            <div class="bmi-section">
                <label class="bmi-label">⚖️ Váha (kg)</label>
                <div class="bmi-input-group">
                    <input type="number" id="bmi-weight" class="bmi-input" value="75" step="1" min="30" max="250">
                    <span class="bmi-unit">kg</span>
                </div>
            </div>

            <!-- Věk -->
            <div class="bmi-section">
                <label class="bmi-label">🎂 Věk (roky)</label>
                <div class="bmi-input-group">
                    <input type="number" id="bmi-age" class="bmi-input" value="30" step="1" min="18" max="100">
                    <span class="bmi-unit">let</span>
                </div>
            </div>

            <!-- Rozšířené míry (volitelné) -->
            <details class="bmi-details">
                <summary>📏 Rozšířené míry (pro přesnější výsledek)</summary>
                <div class="bmi-extra">
                    <div class="bmi-extra-row">
                        <label>📐 Obvod pasu (cm)</label>
                        <input type="number" id="bmi-waist" class="bmi-input-small" value="80" step="1">
                    </div>
                    <div class="bmi-extra-row">
                        <label>🔄 Obvod boků (cm)</label>
                        <input type="number" id="bmi-hip" class="bmi-input-small" value="95" step="1">
                    </div>
                </div>
            </details>

            <!-- Tlačítka -->
            <div class="bmi-buttons">
                <button id="bmi-calculate" class="bmi-btn bmi-btn-primary">📊 Spočítat BMI</button>
                <button id="bmi-clear" class="bmi-btn bmi-btn-secondary">🗑️ Vyčistit</button>
            </div>

            <!-- Výsledek -->
            <div class="bmi-result-section">
                <div class="bmi-result-header">
                    <span>📊 Tvé výsledky</span>
                    <button id="bmi-copy" class="bmi-small-btn">📋 Kopírovat</button>
                </div>
                <div id="bmi-result" class="bmi-result">
                    <div class="bmi-empty">Vyplň údaje a klikni na "Spočítat BMI"</div>
                </div>
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const heightInput = document.getElementById('bmi-height');
    const weightInput = document.getElementById('bmi-weight');
    const ageInput = document.getElementById('bmi-age');
    const waistInput = document.getElementById('bmi-waist');
    const hipInput = document.getElementById('bmi-hip');
    const genderBtns = document.querySelectorAll('.bmi-gender-btn');
    const calculateBtn = document.getElementById('bmi-calculate');
    const clearBtn = document.getElementById('bmi-clear');
    const copyBtn = document.getElementById('bmi-copy');
    const resultDiv = document.getElementById('bmi-result');

    let selectedGender = 'male';
    let currentResult = null;

    function calculateBMI() {
        const height = parseFloat(heightInput.value) / 100;
        const weight = parseFloat(weightInput.value);
        const age = parseFloat(ageInput.value);
        const waist = parseFloat(waistInput.value);
        const hip = parseFloat(hipInput.value);
        
        if (height <= 0 || weight <= 0 || age <= 0) {
            resultDiv.innerHTML = '<div class="bmi-error">❌ Zadej platné hodnoty (výška, váha, věk)</div>';
            return;
        }
        
        // BMI
        const bmi = weight / (height * height);
        const bmiRounded = bmi.toFixed(1);
        
        // Kategorie BMI
        let bmiCategory = '';
        let bmiColor = '';
        let bmiIcon = '';
        let bmiDesc = '';
        
        if (bmi < 18.5) {
            bmiCategory = 'Podváha';
            bmiColor = '#ffc107';
            bmiIcon = '⚠️';
            bmiDesc = 'Mírně podváha. Doporučuje se konzultace s lékařem a vyvážená strava.';
        } else if (bmi < 25) {
            bmiCategory = 'Normální váha';
            bmiColor = '#4caf50';
            bmiIcon = '✅';
            bmiDesc = 'Gratuluji! Tvá váha je v optimálním rozmezí. Pokračuj ve zdravém životním stylu.';
        } else if (bmi < 30) {
            bmiCategory = 'Nadváha';
            bmiColor = '#ff9800';
            bmiIcon = '⚠️';
            bmiDesc = 'Mírná nadváha. Zkus zvýšit pohyb a upravit jídelníček.';
        } else {
            bmiCategory = 'Obezita';
            bmiColor = '#f44336';
            bmiIcon = '❌';
            bmiDesc = 'Vysoká nadváha. Doporučuje se konzultace s lékařem a odborníkem na výživu.';
        }
        
        // Ideální váha (BMI 22)
        const idealWeight = (22 * height * height).toFixed(1);
        
        // WHR (poměr pas/boky)
        let whr = null;
        let whrCategory = '';
        let whrColor = '';
        if (waist > 0 && hip > 0) {
            whr = waist / hip;
            const whrRounded = whr.toFixed(2);
            const isHealthy = (selectedGender === 'male' && whr < 0.9) || (selectedGender === 'female' && whr < 0.85);
            whrCategory = isHealthy ? 'Zdravý poměr' : 'Zvýšené riziko';
            whrColor = isHealthy ? '#4caf50' : '#f44336';
        }
        
        currentResult = {
            bmi: bmiRounded,
            category: bmiCategory,
            idealWeight: idealWeight,
            whr: whr ? whr.toFixed(2) : null,
            whrCategory: whrCategory,
            age: age,
            gender: selectedGender === 'male' ? 'muž' : 'žena'
        };
        
        resultDiv.innerHTML = `
            <div class="bmi-result-card" style="border-top: 4px solid ${bmiColor}">
                <div class="bmi-result-main">
                    <div class="bmi-result-bmi">
                        <span class="bmi-bmi-number">${bmiRounded}</span>
                        <span class="bmi-bmi-label">BMI</span>
                    </div>
                    <div class="bmi-result-category" style="background: ${bmiColor}20; color: ${bmiColor}">
                        ${bmiIcon} ${bmiCategory}
                    </div>
                </div>
                
                <div class="bmi-result-stats">
                    <div class="bmi-stat-item">
                        <span class="bmi-stat-label">📏 Výška</span>
                        <span class="bmi-stat-value">${(height * 100).toFixed(0)} cm</span>
                    </div>
                    <div class="bmi-stat-item">
                        <span class="bmi-stat-label">⚖️ Váha</span>
                        <span class="bmi-stat-value">${weight.toFixed(0)} kg</span>
                    </div>
                    <div class="bmi-stat-item">
                        <span class="bmi-stat-label">🎯 Ideální váha</span>
                        <span class="bmi-stat-value">${idealWeight} kg</span>
                    </div>
                    <div class="bmi-stat-item">
                        <span class="bmi-stat-label">🎂 Věk</span>
                        <span class="bmi-stat-value">${age} let</span>
                    </div>
                </div>
                
                <div class="bmi-result-description">
                    ${bmiDesc}
                </div>
                
                ${whr ? `
                <div class="bmi-whr-section" style="border-left-color: ${whrColor}">
                    <div class="bmi-whr-header">
                        <span>📐 Poměr pas/boky (WHR)</span>
                        <strong style="color: ${whrColor}">${whr.toFixed(2)}</strong>
                    </div>
                    <div class="bmi-whr-category" style="color: ${whrColor}">${whrCategory}</div>
                    <div class="bmi-whr-note">
                        ${selectedGender === 'male' ? '👨 Muži: zdravý poměr < 0.9' : '👩 Ženy: zdravý poměr < 0.85'}
                    </div>
                </div>
                ` : ''}
                
                <div class="bmi-tip-inline">
                    💡 Zdravý životní styl: pravidelný pohyb, vyvážená strava a dostatek spánku.
                </div>
            </div>
        `;
        
        showNotification(`BMI: ${bmiRounded} - ${bmiCategory}`, 'success');
        saveSettings();
    }
    
    async function copyResult() {
        if (!currentResult) {
            showNotification('Nejprve spočítej BMI', 'warning');
            return;
        }
        
        let text = `BMI: ${currentResult.bmi} (${currentResult.category})\n`;
        text += `Ideální váha: ${currentResult.idealWeight} kg\n`;
        if (currentResult.whr) {
            text += `Poměr pas/boky: ${currentResult.whr} (${currentResult.whrCategory})\n`;
        }
        text += `Věk: ${currentResult.age} let, Pohlaví: ${currentResult.gender}`;
        
        await copyToClipboard(text);
        showNotification('Výsledek zkopírován');
    }
    
    function clearAll() {
        heightInput.value = '175';
        weightInput.value = '75';
        ageInput.value = '30';
        waistInput.value = '80';
        hipInput.value = '95';
        resultDiv.innerHTML = '<div class="bmi-empty">Vyplň údaje a klikni na "Spočítat BMI"</div>';
        currentResult = null;
        showNotification('Vyčištěno');
        saveSettings();
    }
    
    // Eventy
    genderBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            genderBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedGender = btn.dataset.gender;
            saveSettings();
        });
    });
    
    calculateBtn.addEventListener('click', calculateBMI);
    clearBtn.addEventListener('click', clearAll);
    copyBtn.addEventListener('click', copyResult);
    
    heightInput.addEventListener('input', saveSettings);
    weightInput.addEventListener('input', saveSettings);
    ageInput.addEventListener('input', saveSettings);
    waistInput.addEventListener('input', saveSettings);
    hipInput.addEventListener('input', saveSettings);
    
    // Enter klávesa
    const inputs = [heightInput, weightInput, ageInput];
    inputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') calculateBMI();
        });
    });
    
    // Ukládání/načítání
    function saveSettings() {
        storage.set('height', heightInput.value);
        storage.set('weight', weightInput.value);
        storage.set('age', ageInput.value);
        storage.set('waist', waistInput.value);
        storage.set('hip', hipInput.value);
        storage.set('gender', selectedGender);
    }
    
    function loadSettings() {
        heightInput.value = storage.get('height', '175');
        weightInput.value = storage.get('weight', '75');
        ageInput.value = storage.get('age', '30');
        waistInput.value = storage.get('waist', '80');
        hipInput.value = storage.get('hip', '95');
        selectedGender = storage.get('gender', 'male');
        
        genderBtns.forEach(btn => {
            if (btn.dataset.gender === selectedGender) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    loadSettings();
}

export function cleanup() {
    console.log('BMI Calculator se zavírá');
}
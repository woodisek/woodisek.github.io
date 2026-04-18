// apps/fuel-calculator.js
import { copyToClipboard } from '../clipboard.js';
import { showNotification } from '../notify.js';
import { getStorage } from '../storage.js';

const storage = getStorage('fuel-calculator');

export default function render(container) {
    container.innerHTML = `
        <div class="fuel-calculator">
            <div class="fc-header">
                <span class="fc-icon">⛽</span>
                <div>
                    <h3>Kalkulačka spotřeby paliva</h3>
                    <p>Spočítej cenu za cestu a spotřebu</p>
                </div>
            </div>

            <div class="fc-form">
                <!-- Vzdálenost -->
                <div class="fc-section">
                    <label class="fc-label">📏 Vzdálenost</label>
                    <div class="fc-input-group">
                        <input type="number" id="fc-distance" class="fc-input" value="100" step="any" placeholder="např. 250">
                        <select id="fc-distance-unit" class="fc-select">
                            <option value="km">km</option>
                            <option value="mi">míle</option>
                        </select>
                    </div>
                </div>

                <!-- Spotřeba -->
                <div class="fc-section">
                    <label class="fc-label">⛽ Spotřeba paliva</label>
                    <div class="fc-input-group">
                        <input type="number" id="fc-consumption" class="fc-input" value="7.5" step="any" placeholder="např. 7.5">
                        <select id="fc-consumption-unit" class="fc-select">
                            <option value="l100km">l/100km</option>
                            <option value="mpg">mpg (mi/gal)</option>
                            <option value="kml">km/l</option>
                        </select>
                    </div>
                </div>

                <!-- Cena paliva -->
                <div class="fc-section">
                    <label class="fc-label">💰 Cena paliva</label>
                    <div class="fc-input-group">
                        <input type="number" id="fc-price" class="fc-input" value="38.50" step="any" placeholder="např. 38.90">
                        <select id="fc-currency" class="fc-select">
                            <option value="czk">Kč/l</option>
                            <option value="eur">€/l</option>
                            <option value="usd">$/l</option>
                        </select>
                    </div>
                </div>

                <!-- Počet cestujících -->
                <div class="fc-section">
                    <label class="fc-label">👥 Počet cestujících</label>
                    <div class="fc-passenger-control">
                        <button id="fc-passenger-minus" class="fc-stepper-btn">−</button>
                        <input type="number" id="fc-passengers" class="fc-passenger-input" value="1" min="1" step="1">
                        <button id="fc-passenger-plus" class="fc-stepper-btn">+</button>
                    </div>
                </div>
            </div>

            <div class="fc-buttons">
                <button id="fc-calculate" class="fc-btn fc-btn-primary">
                    <span class="fc-btn-icon">⛽</span>
                    <span>Spočítat</span>
                </button>
                <button id="fc-clear" class="fc-btn fc-btn-secondary">
                    <span class="fc-btn-icon">🔄</span>
                    <span>Reset</span>
                </button>
            </div>

            <div id="fc-results" class="fc-results" style="display: none;">
                <div class="fc-results-header">
                    <span>📊 Výsledky cesty</span>
                    <button id="fc-copy" class="fc-small-btn">📋 Kopírovat</button>
                </div>
                <div id="fc-results-content" class="fc-results-grid"></div>
            </div>


        </div>
    `;

    // DOM elementy
    const distanceInput = document.getElementById('fc-distance');
    const distanceUnit = document.getElementById('fc-distance-unit');
    const consumptionInput = document.getElementById('fc-consumption');
    const consumptionUnit = document.getElementById('fc-consumption-unit');
    const priceInput = document.getElementById('fc-price');
    const currencySelect = document.getElementById('fc-currency');
    const passengersInput = document.getElementById('fc-passengers');
    const passengerMinusBtn = document.getElementById('fc-passenger-minus');
    const passengerPlusBtn = document.getElementById('fc-passenger-plus');
    const calculateBtn = document.getElementById('fc-calculate');
    const clearBtn = document.getElementById('fc-clear');
    const copyBtn = document.getElementById('fc-copy');
    const resultsDiv = document.getElementById('fc-results');
    const resultsContent = document.getElementById('fc-results-content');

    // +- tlačítka pro cestující
    passengerMinusBtn.addEventListener('click', () => {
        let val = parseInt(passengersInput.value) || 1;
        if (val > 1) passengersInput.value = val - 1;
        autoCalculate();
    });
    
    passengerPlusBtn.addEventListener('click', () => {
        let val = parseInt(passengersInput.value) || 1;
        passengersInput.value = val + 1;
        autoCalculate();
    });

    // Převodní funkce
    function convertToLPer100km(consumption, unit) {
        if (unit === 'l100km') return consumption;
        if (unit === 'mpg') return 235.214583 / consumption;
        if (unit === 'kml') return 100 / consumption;
        return consumption;
    }

    function formatCurrency(value, currency) {
        const symbols = { czk: 'Kč', eur: '€', usd: '$' };
        return `${value.toFixed(2)} ${symbols[currency]}`;
    }

    function calculate() {
        let distance = parseFloat(distanceInput.value) || 0;
        let consumption = parseFloat(consumptionInput.value) || 0;
        let price = parseFloat(priceInput.value) || 0;
        let passengers = parseInt(passengersInput.value) || 1;

        if (distance <= 0) {
            resultsDiv.style.display = 'none';
            return;
        }
        if (consumption <= 0) {
            resultsDiv.style.display = 'none';
            return;
        }
        if (price <= 0) {
            resultsDiv.style.display = 'none';
            return;
        }

        // Převod vzdálenosti na km
        let distanceKm = distanceUnit.value === 'km' ? distance : distance * 1.60934;
        
        // Převod spotřeby na l/100km
        const consumptionL100km = convertToLPer100km(consumption, consumptionUnit.value);
        
        // Spotřeba na celou cestu
        const totalLiters = (consumptionL100km * distanceKm) / 100;
        
        // Celková cena
        const totalCost = totalLiters * price;
        
        // Cena na osobu
        const costPerPerson = totalCost / passengers;
        
        // Cena na km
        const costPerKm = totalCost / distanceKm;
        
        // Emise CO2 (cca 2.3 kg CO2 na litr benzínu)
        const co2Emission = totalLiters * 2.3;
        
        const currency = currencySelect.value;
        const currencySymbol = currency === 'czk' ? 'Kč' : currency === 'eur' ? '€' : '$';
        const distanceUnitDisplay = distanceUnit.value === 'km' ? 'km' : 'mi';
        
        resultsContent.innerHTML = `
            <div class="fc-result-card">
                <div class="fc-result-icon">⛽</div>
                <div class="fc-result-content">
                    <div class="fc-result-value">${totalLiters.toFixed(2)} l</div>
                    <div class="fc-result-label">Celková spotřeba paliva</div>
                </div>
            </div>
            
            <div class="fc-result-card">
                <div class="fc-result-icon">💰</div>
                <div class="fc-result-content">
                    <div class="fc-result-value">${formatCurrency(totalCost, currency)}</div>
                    <div class="fc-result-label">Celková cesta</div>
                </div>
            </div>
            
            <div class="fc-result-card">
                <div class="fc-result-icon">👥</div>
                <div class="fc-result-content">
                    <div class="fc-result-value">${formatCurrency(costPerPerson, currency)}</div>
                    <div class="fc-result-label">Na osobu (${passengers} ${passengers === 1 ? 'cestující' : 'cestujících'})</div>
                </div>
            </div>
            
            <div class="fc-result-card">
                <div class="fc-result-icon">📏</div>
                <div class="fc-result-content">
                    <div class="fc-result-value">${costPerKm.toFixed(2)} ${currencySymbol}/${distanceUnitDisplay}</div>
                    <div class="fc-result-label">Cena na ${distanceUnitDisplay}</div>
                </div>
            </div>
            
            <div class="fc-result-card">
                <div class="fc-result-icon">🌍</div>
                <div class="fc-result-content">
                    <div class="fc-result-value">${co2Emission.toFixed(1)} kg</div>
                    <div class="fc-result-label">Emise CO₂</div>
                </div>
            </div>
        `;
        
        resultsDiv.style.display = 'block';
        saveSettings();
    }

    async function copyResults() {
        const text = resultsContent.innerText;
        if (text && resultsDiv.style.display === 'block') {
            await copyToClipboard(text);
            showNotification('Výsledky zkopírovány', 'success');
        } else {
            showNotification('Nejprve spočítej cestu', 'warning');
        }
    }

    function clearAll() {
        distanceInput.value = '';
        consumptionInput.value = '';
        priceInput.value = '';
        passengersInput.value = '1';
        distanceUnit.value = 'km';
        consumptionUnit.value = 'l100km';
        currencySelect.value = 'czk';
        resultsDiv.style.display = 'none';
        showNotification('Vyčištěno');
        saveSettings();
    }

    // Auto-výpočet
    let debounceTimer;
    const autoCalculate = () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (distanceInput.value && consumptionInput.value && priceInput.value) {
                calculate();
            }
        }, 300);
    };
    
    distanceInput.addEventListener('input', autoCalculate);
    distanceUnit.addEventListener('change', autoCalculate);
    consumptionInput.addEventListener('input', autoCalculate);
    consumptionUnit.addEventListener('change', autoCalculate);
    priceInput.addEventListener('input', autoCalculate);
    currencySelect.addEventListener('change', autoCalculate);
    passengersInput.addEventListener('input', autoCalculate);
    
    calculateBtn.addEventListener('click', calculate);
    clearBtn.addEventListener('click', clearAll);
    copyBtn.addEventListener('click', copyResults);
    
    function saveSettings() {
        storage.set('distance', distanceInput.value);
        storage.set('distanceUnit', distanceUnit.value);
        storage.set('consumption', consumptionInput.value);
        storage.set('consumptionUnit', consumptionUnit.value);
        storage.set('price', priceInput.value);
        storage.set('currency', currencySelect.value);
        storage.set('passengers', passengersInput.value);
    }
    
    function loadSettings() {
        distanceInput.value = storage.get('distance', '');
        distanceUnit.value = storage.get('distanceUnit', 'km');
        consumptionInput.value = storage.get('consumption', '');
        consumptionUnit.value = storage.get('consumptionUnit', 'l100km');
        priceInput.value = storage.get('price', '');
        currencySelect.value = storage.get('currency', 'czk');
        passengersInput.value = storage.get('passengers', '1');
        
        if (distanceInput.value && consumptionInput.value && priceInput.value) {
            setTimeout(() => calculate(), 100);
        }
    }
    
    loadSettings();
}

export function cleanup() {
    console.log('Fuel Calculator se zavírá');
}
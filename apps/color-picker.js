import { copyToClipboard } from '../clipboard.js';
import { showNotification } from '../notify.js';
import { createElement, clearElement } from '../dom.js';
import { getStorage } from '../storage.js';

const storage = getStorage('color-picker');

export default function render(container) {
    container.innerHTML = `
        <div class="color-picker">
            <div class="cp-header">
                <span class="cp-icon">🎨</span>
                <div>
                    <h3>Color Picker</h3>
                    <p>Výběr barvy a převod mezi formáty</p>
                </div>
            </div>

            <!-- Hlavní barevný panel -->
            <div class="cp-color-preview" id="cp-color-preview" style="background-color: #667eea">
                <div class="cp-color-value" id="cp-color-value">#667eea</div>
            </div>

            <!-- Výběr barvy -->
            <div class="cp-section">
                <label class="cp-label">🎨 Výběr barvy</label>
                <input type="color" id="cp-color-input" class="cp-color-input" value="#667eea">
            </div>

            <!-- Formáty -->
            <div class="cp-section">
                <label class="cp-label">📋 Formáty barvy</label>
                <div class="cp-formats">
                    <div class="cp-format-row">
                        <span class="cp-format-label">HEX:</span>
                        <div class="cp-format-value-wrapper">
                            <span id="cp-hex" class="cp-format-value">#667eea</span>
                            <button data-format="hex" class="cp-copy-format">📋</button>
                        </div>
                    </div>
                    <div class="cp-format-row">
                        <span class="cp-format-label">RGB:</span>
                        <div class="cp-format-value-wrapper">
                            <span id="cp-rgb" class="cp-format-value">rgb(102, 126, 234)</span>
                            <button data-format="rgb" class="cp-copy-format">📋</button>
                        </div>
                    </div>
                    <div class="cp-format-row">
                        <span class="cp-format-label">RGBA:</span>
                        <div class="cp-format-value-wrapper">
                            <span id="cp-rgba" class="cp-format-value">rgba(102, 126, 234, 1)</span>
                            <button data-format="rgba" class="cp-copy-format">📋</button>
                        </div>
                    </div>
                    <div class="cp-format-row">
                        <span class="cp-format-label">HSL:</span>
                        <div class="cp-format-value-wrapper">
                            <span id="cp-hsl" class="cp-format-value">hsl(229, 76%, 66%)</span>
                            <button data-format="hsl" class="cp-copy-format">📋</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Manuální zadání -->
            <div class="cp-section">
                <label class="cp-label">✏️ Manuální zadání</label>
                <div class="cp-manual">
                    <input type="text" id="cp-manual-hex" class="cp-manual-input" placeholder="#667eea" maxlength="7">
                    <button id="cp-apply" class="cp-apply-btn">Použít</button>
                </div>
                <div class="cp-hint">Zadej HEX (#RRGGBB) nebo RGB (rgb(100,100,100))</div>
            </div>

            
        </div>
    `;

    // ========== DOM elementy ==========
    const colorPreview = document.getElementById('cp-color-preview');
    const colorValue = document.getElementById('cp-color-value');
    const colorInput = document.getElementById('cp-color-input');
    const hexSpan = document.getElementById('cp-hex');
    const rgbSpan = document.getElementById('cp-rgb');
    const rgbaSpan = document.getElementById('cp-rgba');
    const hslSpan = document.getElementById('cp-hsl');
    const manualHex = document.getElementById('cp-manual-hex');
    const applyBtn = document.getElementById('cp-apply');
    const copyButtons = document.querySelectorAll('.cp-copy-format');

    // ========== POMOCNÉ FUNKCE ==========
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    function rgbToHex(r, g, b) {
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    function rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        
        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }

    function hslToRgb(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;
        
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    function parseManualInput(input) {
        input = input.trim().toLowerCase();
        
        // HEX formát
        if (input.startsWith('#')) {
            const rgb = hexToRgb(input);
            if (rgb) return rgb;
        }
        
        // HEX bez #
        if (/^[0-9a-f]{6}$/i.test(input)) {
            const rgb = hexToRgb('#' + input);
            if (rgb) return rgb;
        }
        
        // RGB formát rgb(100,100,100)
        const rgbMatch = input.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (rgbMatch) {
            return {
                r: parseInt(rgbMatch[1]),
                g: parseInt(rgbMatch[2]),
                b: parseInt(rgbMatch[3])
            };
        }
        
        // RGBA formát (ignorujeme alfa)
        const rgbaMatch = input.match(/rgba\((\d+),\s*(\d+),\s*(\d+)/);
        if (rgbaMatch) {
            return {
                r: parseInt(rgbaMatch[1]),
                g: parseInt(rgbaMatch[2]),
                b: parseInt(rgbaMatch[3])
            };
        }
        
        // HSL formát
        const hslMatch = input.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (hslMatch) {
            const rgb = hslToRgb(parseInt(hslMatch[1]), parseInt(hslMatch[2]), parseInt(hslMatch[3]));
            return rgb;
        }
        
        return null;
    }

    function updateColor(hex) {
        if (!hex.startsWith('#')) hex = '#' + hex;
        
        const rgb = hexToRgb(hex);
        if (!rgb) return;
        
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        
        // Aktualizace UI
        colorPreview.style.backgroundColor = hex;
        colorValue.textContent = hex.toUpperCase();
        colorInput.value = hex;
        manualHex.value = hex.toUpperCase();
        
        hexSpan.textContent = hex.toUpperCase();
        rgbSpan.textContent = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        rgbaSpan.textContent = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`;
        hslSpan.textContent = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
        
        // Uložení
        storage.set('lastColor', hex);
    }

    // ========== EVENTY ==========
    colorInput.addEventListener('input', (e) => {
        updateColor(e.target.value);
    });

    applyBtn.addEventListener('click', () => {
        const input = manualHex.value;
        const rgb = parseManualInput(input);
        
        if (rgb) {
            const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
            updateColor(hex);
            showNotification('Barva aplikována', 'success');
        } else {
            showNotification('Neplatný formát barvy. Použij #RRGGBB nebo rgb(100,100,100)', 'error');
        }
    });

    manualHex.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            applyBtn.click();
        }
    });

    // Kopírování formátů
    copyButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const format = btn.dataset.format;
            let text = '';
            
            switch (format) {
                case 'hex':
                    text = hexSpan.textContent;
                    break;
                case 'rgb':
                    text = rgbSpan.textContent;
                    break;
                case 'rgba':
                    text = rgbaSpan.textContent;
                    break;
                case 'hsl':
                    text = hslSpan.textContent;
                    break;
            }
            
            await copyToClipboard(text);
        });
    });

    // Načtení uložené barvy
    const savedColor = storage.get('lastColor', '#667eea');
    updateColor(savedColor);
}

export function cleanup() {
    console.log('Color Picker se zavírá');
}
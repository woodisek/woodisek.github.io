// apps/font-viewer.js
import { copyToClipboard } from '../clipboard.js';
import { showNotification } from '../notify.js';
import { getStorage } from '../storage.js';

// Nové kategorie a fonty
const fonts = [
  // script
{ name: 'Great Vibes', category: 'script' },
{ name: 'Allura', category: 'script' },
{ name: 'Alex Brush', category: 'script' },
{ name: 'Sacramento', category: 'script' },
{ name: 'Dancing Script', category: 'script' },
{ name: 'Pacifico', category: 'script' },
{ name: 'Satisfy', category: 'script' },
{ name: 'Parisienne', category: 'script' },
{ name: 'Tangerine', category: 'script' },
{ name: 'Lobster', category: 'script' },
{ name: 'Lobster Two', category: 'script' },
{ name: 'Courgette', category: 'script' },
{ name: 'Pinyon Script', category: 'script' },
{ name: 'Cookie', category: 'script' },
{ name: 'Kaushan Script', category: 'script' },

{ name: 'Caveat', category: 'handwritten' },
{ name: 'Indie Flower', category: 'handwritten' },
{ name: 'Kalam', category: 'handwritten' },
{ name: 'Patrick Hand', category: 'handwritten' },
{ name: 'Shadows Into Light', category: 'handwritten' },
{ name: 'Handlee', category: 'handwritten' },
{ name: 'Architects Daughter', category: 'handwritten' },
{ name: 'Gloria Hallelujah', category: 'handwritten' },
{ name: 'Permanent Marker', category: 'handwritten' },
{ name: 'Covered By Your Grace', category: 'handwritten' },
{ name: 'Amatic SC', category: 'handwritten' },
{ name: 'Coming Soon', category: 'handwritten' },
{ name: 'Crafty Girls', category: 'handwritten' },
{ name: 'Gochi Hand', category: 'handwritten' },
{ name: 'Reenie Beanie', category: 'handwritten' },

{ name: 'Inter', category: 'technical' },
{ name: 'Roboto', category: 'technical' },
{ name: 'Montserrat', category: 'technical' },
{ name: 'Poppins', category: 'technical' },
{ name: 'Lato', category: 'technical' },
{ name: 'Open Sans', category: 'technical' },
{ name: 'Raleway', category: 'technical' },
{ name: 'Quicksand', category: 'technical' },
{ name: 'Josefin Sans', category: 'technical' },
{ name: 'Exo 2', category: 'technical' },
{ name: 'Titillium Web', category: 'technical' },
{ name: 'Work Sans', category: 'technical' },
{ name: 'Barlow', category: 'technical' },
{ name: 'Manrope', category: 'technical' },
{ name: 'Space Grotesk', category: 'technical' },

{ name: 'Nunito', category: 'sans' },
{ name: 'Ubuntu', category: 'sans' },
{ name: 'Source Sans 3', category: 'sans' },
{ name: 'Plus Jakarta Sans', category: 'sans' },
{ name: 'Figtree', category: 'sans' },
{ name: 'Urbanist', category: 'sans' },
{ name: 'Outfit', category: 'sans' },
{ name: 'Epilogue', category: 'sans' },
{ name: 'Lexend', category: 'sans' },
{ name: 'Jost', category: 'sans' },
{ name: 'Rubik', category: 'sans' },
{ name: 'Karla', category: 'sans' },
{ name: 'Mukta', category: 'sans' },
{ name: 'Cabin', category: 'sans' },
{ name: 'Fira Sans', category: 'sans' },

{ name: 'Playfair Display', category: 'serif' },
{ name: 'Merriweather', category: 'serif' },
{ name: 'Libre Baskerville', category: 'serif' },
{ name: 'Cormorant', category: 'serif' },
{ name: 'Crimson Text', category: 'serif' },
{ name: 'EB Garamond', category: 'serif' },
{ name: 'Lora', category: 'serif' },
{ name: 'Bitter', category: 'serif' },
{ name: 'Source Serif 4', category: 'serif' },
{ name: 'Alegreya', category: 'serif' },
{ name: 'Cardo', category: 'serif' },
{ name: 'Cormorant Garamond', category: 'serif' },
{ name: 'Domine', category: 'serif' },
{ name: 'Faustina', category: 'serif' },
{ name: 'Frank Ruhl Libre', category: 'serif' },

{ name: 'Poiret One', category: 'thin' },
{ name: 'Josefin Sans', category: 'thin' },
{ name: 'Quicksand', category: 'thin' },
{ name: 'Raleway', category: 'thin' },
{ name: 'Exo 2', category: 'thin' },
{ name: 'Titillium Web', category: 'thin' },
{ name: 'Work Sans', category: 'thin' },
{ name: 'Barlow', category: 'thin' },
{ name: 'Inter', category: 'thin' },
{ name: 'Montserrat', category: 'thin' },
{ name: 'Lato', category: 'thin' },
{ name: 'Nunito', category: 'thin' },
{ name: 'Poppins', category: 'thin' },
{ name: 'Ubuntu', category: 'thin' },
{ name: 'Manrope', category: 'thin' },

{ name: 'Cinzel', category: 'decorative' },
{ name: 'Abril Fatface', category: 'decorative' },
{ name: 'Bebas Neue', category: 'decorative' },
{ name: 'Oswald', category: 'decorative' },
{ name: 'Anton', category: 'decorative' },
{ name: 'Black Ops One', category: 'decorative' },
{ name: 'Bungee', category: 'decorative' },
{ name: 'Fascinate', category: 'decorative' },
{ name: 'Monoton', category: 'decorative' },
{ name: 'Righteous', category: 'decorative' },


];

// Mapování kategorií
const categoryNames = {
    all: '🎲 Vše',
    script: '✍️ Propojené',
    handwritten: '🖊️ Ručně psané',
    technical: '⚙️ Technické',
    sans: '🧱 Moderní',
    serif: '📖 Elegantní',
    thin: '🔲 Tenké',
    decorative: '🎨 Dekorativní'
};

// ========== PROMĚNNÉ (pouze jedna deklarace) ==========
let loadedCategories = new Set();
let currentCategory = 'all';
let currentFontsList = [];
let visibleFontCount = 20;
let isLoading = false;

// ========== FUNKCE ==========
function loadGoogleFont(fontName) {
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;700&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
}

function loadFontsForCategory(category, fontsList) {
    if (loadedCategories.has(category)) return;
    
    const fontsToLoad = fontsList.slice(0, 30);
    fontsToLoad.forEach(font => {
        loadGoogleFont(font.name);
    });
    
    loadedCategories.add(category);
}

function getFontsByCategory(category) {
    if (category === 'all') {
        return fonts;
    }
    return fonts.filter(f => f.category === category);
}

export default function render(container) {
    container.innerHTML = `
        <div class="font-viewer">
            <div class="fv-header">
                <span class="fv-icon">🔤</span>
                <div>
                    <h3>Ukázka fontů</h3>
                    <p>Vyzkoušej si různé fonty na svém textu</p>
                </div>
            </div>

            <div class="fv-section">
                <label class="fv-label">✍️ Tvůj text</label>
                <textarea id="fv-text" class="fv-textarea" rows="3" placeholder="Napiš svůj text...">Woodisek ♥</textarea>
            </div>

            <div class="fv-row">
                <div class="fv-size-wrap">
                    <input type="range" id="fv-size" class="fv-range" min="12" max="72" value="32">
                </div>
                <div class="fv-style">
                    <button id="fv-bold" class="fv-style-btn">𝐁</button>
                    <button id="fv-italic" class="fv-style-btn">𝐼</button>
                    <button id="fv-underline" class="fv-style-btn">U</button>
                    <button id="fv-invert" class="fv-style-btn">🌓</button>
                </div>
            </div>

            <div class="fv-categories">
                ${Object.entries(categoryNames).map(([key, name]) => `
                    <button data-cat="${key}" class="fv-cat-btn ${key === 'all' ? 'active' : ''}">${name}</button>
                `).join('')}
            </div>

            <div class="fv-font-selector">
                <div style="position: relative; flex: 1;">
                    <select id="fv-font" class="fv-select" size="8"></select>
                    <div id="fv-loading" class="fv-loading" style="display: none;">📥 Načítám další fonty...</div>
                </div>
                <div class="fv-nav-buttons">
                    <button id="fv-prev-font" class="fv-nav-btn" title="Předchozí font">▲</button>
                    <button id="fv-next-font" class="fv-nav-btn" title="Další font">▼</button>
                </div>
            </div>

            <div class="fv-preview" id="fv-preview-container">
                <div id="fv-preview-text" class="fv-preview-text">
                    Woodisek ♥
                </div>
            </div>

            <div class="fv-buttons">
                <button id="fv-copy" class="fv-btn fv-btn-primary">📋 Kopírovat</button>
            </div>
        </div>
    `;

    // DOM elementy
    const textarea = document.getElementById('fv-text');
    const fontSelect = document.getElementById('fv-font');
    const sizeSlider = document.getElementById('fv-size');
    const previewText = document.getElementById('fv-preview-text');
    const previewContainer = document.getElementById('fv-preview-container');
    const copyBtn = document.getElementById('fv-copy');
    const prevFontBtn = document.getElementById('fv-prev-font');
    const nextFontBtn = document.getElementById('fv-next-font');
    const boldBtn = document.getElementById('fv-bold');
    const italicBtn = document.getElementById('fv-italic');
    const underlineBtn = document.getElementById('fv-underline');
    const invertBtn = document.getElementById('fv-invert');
    const catBtns = document.querySelectorAll('.fv-cat-btn');
    const loadingDiv = document.getElementById('fv-loading');

    let currentFont = 'Roboto';
    let currentFontIndex = 0;
    let currentStyle = {
        bold: false,
        italic: false,
        underline: false,
        invert: false
    };

    // Načtení dalších fontů při scrollování
    function setupInfiniteScroll() {
        fontSelect.addEventListener('scroll', () => {
            const scrollTop = fontSelect.scrollTop;
            const scrollHeight = fontSelect.scrollHeight;
            const clientHeight = fontSelect.clientHeight;
            
            if (scrollTop + clientHeight >= scrollHeight - 50 && !isLoading) {
                loadMoreFonts();
            }
        });
    }

    function loadMoreFonts() {
        if (isLoading) return;
        if (visibleFontCount >= currentFontsList.length) return;
        
        isLoading = true;
        loadingDiv.style.display = 'block';
        
        setTimeout(() => {
            const newCount = Math.min(visibleFontCount + 20, currentFontsList.length);
            
            for (let i = visibleFontCount; i < newCount; i++) {
                const font = currentFontsList[i];
                const option = document.createElement('option');
                option.value = font.name;
                option.style.fontFamily = `'${font.name}', sans-serif`;
                option.textContent = font.name;
                fontSelect.appendChild(option);
                
                if (!loadedCategories.has(currentCategory)) {
                    loadGoogleFont(font.name);
                }
            }
            
            visibleFontCount = newCount;
            isLoading = false;
            loadingDiv.style.display = 'none';
            
            if (visibleFontCount >= currentFontsList.length) {
                loadingDiv.style.display = 'none';
            }
        }, 100);
    }

    function loadFonts() {
        currentFontsList = getFontsByCategory(currentCategory);
        visibleFontCount = Math.min(20, currentFontsList.length);
        
        fontSelect.innerHTML = '';
        
        for (let i = 0; i < visibleFontCount; i++) {
            const font = currentFontsList[i];
            const option = document.createElement('option');
            option.value = font.name;
            option.style.fontFamily = `'${font.name}', sans-serif`;
            option.textContent = font.name;
            if (i === currentFontIndex) option.selected = true;
            fontSelect.appendChild(option);
        }
        
        loadFontsForCategory(currentCategory, currentFontsList.slice(0, 30));
        
        if (currentFontsList.length > 0) {
            if (currentFontIndex >= currentFontsList.length) currentFontIndex = 0;
            currentFont = currentFontsList[currentFontIndex]?.name || currentFontsList[0]?.name;
        }
        
        updatePreview();
    }

    function prevFont() {
        if (currentFontsList.length === 0) return;
        if (currentFontIndex > 0) {
            currentFontIndex--;
        } else {
            currentFontIndex = currentFontsList.length - 1;
        }
        currentFont = currentFontsList[currentFontIndex].name;
        fontSelect.value = currentFont;
        const selectedOption = fontSelect.querySelector(`option[value="${currentFont}"]`);
        if (selectedOption) {
            selectedOption.scrollIntoView({ block: 'nearest' });
        }
        updatePreview();
    }

    function nextFont() {
        if (currentFontsList.length === 0) return;
        if (currentFontIndex < currentFontsList.length - 1) {
            currentFontIndex++;
        } else {
            currentFontIndex = 0;
        }
        currentFont = currentFontsList[currentFontIndex].name;
        fontSelect.value = currentFont;
        const selectedOption = fontSelect.querySelector(`option[value="${currentFont}"]`);
        if (selectedOption) {
            selectedOption.scrollIntoView({ block: 'nearest' });
        }
        updatePreview();
    }

    function updatePreview() {
        const text = textarea.value || 'Woodisek ♥';
        const size = sizeSlider.value;
        
        previewText.textContent = text;
        previewText.style.fontFamily = `'${currentFont}', sans-serif`;
        previewText.style.fontSize = `${size}px`;
        previewText.style.fontWeight = currentStyle.bold ? 'bold' : 'normal';
        previewText.style.fontStyle = currentStyle.italic ? 'italic' : 'normal';
        previewText.style.textDecoration = currentStyle.underline ? 'underline' : 'none';
        
        if (currentStyle.invert) {
            previewContainer.classList.add('inverted');
        } else {
            previewContainer.classList.remove('inverted');
            previewText.style.color = '#8B5A2B';
        }
        
        saveSettings();
    }

    async function copyFontInfo() {
        const styleText = [];
        if (currentStyle.bold) styleText.push('tučné');
        if (currentStyle.italic) styleText.push('kurzíva');
        if (currentStyle.underline) styleText.push('podtržené');
        
        const styleStr = styleText.length > 0 ? ` (${styleText.join(', ')})` : '';
        const result = `${currentFont}${styleStr}`;
        
        await copyToClipboard(result);
        showNotification(`Zkopírováno: ${result}`);
    }

    function saveSettings() {
        const storage = getStorage('font-viewer');
        storage.set('text', textarea.value);
        storage.set('size', sizeSlider.value);
        storage.set('font', currentFont);
        storage.set('fontIndex', currentFontIndex);
        storage.set('category', currentCategory);
        storage.set('bold', currentStyle.bold);
        storage.set('italic', currentStyle.italic);
        storage.set('underline', currentStyle.underline);
        storage.set('invert', currentStyle.invert);
    }

    function loadSettings() {
        const storage = getStorage('font-viewer');
        const savedText = storage.get('text', 'Woodisek ♥');
        const savedSize = storage.get('size', 32);
        const savedFont = storage.get('font', 'Roboto');
        const savedFontIndex = storage.get('fontIndex', 0);
        const savedCategory = storage.get('category', 'all');
        const savedBold = storage.get('bold', false);
        const savedItalic = storage.get('italic', false);
        const savedUnderline = storage.get('underline', false);
        const savedInvert = storage.get('invert', false);
        
        textarea.value = savedText;
        sizeSlider.value = savedSize;
        currentCategory = savedCategory;
        currentFontIndex = savedFontIndex;
        currentStyle = { 
            bold: savedBold, 
            italic: savedItalic, 
            underline: savedUnderline,
            invert: savedInvert
        };
        
        if (savedBold) boldBtn.classList.add('active');
        if (savedItalic) italicBtn.classList.add('active');
        if (savedUnderline) underlineBtn.classList.add('active');
        if (savedInvert) invertBtn.classList.add('active');
        
        catBtns.forEach(btn => {
            if (btn.dataset.cat === savedCategory) btn.classList.add('active');
            else btn.classList.remove('active');
        });
        
        loadFonts();
        updatePreview();
    }

    // Eventy
    textarea.addEventListener('input', updatePreview);
    sizeSlider.addEventListener('input', updatePreview);
    fontSelect.addEventListener('change', (e) => {
        currentFont = e.target.value;
        currentFontIndex = currentFontsList.findIndex(f => f.name === currentFont);
        updatePreview();
    });
    
    prevFontBtn.addEventListener('click', prevFont);
    nextFontBtn.addEventListener('click', nextFont);
    
    boldBtn.addEventListener('click', () => {
        currentStyle.bold = !currentStyle.bold;
        boldBtn.classList.toggle('active', currentStyle.bold);
        updatePreview();
    });
    
    italicBtn.addEventListener('click', () => {
        currentStyle.italic = !currentStyle.italic;
        italicBtn.classList.toggle('active', currentStyle.italic);
        updatePreview();
    });
    
    underlineBtn.addEventListener('click', () => {
        currentStyle.underline = !currentStyle.underline;
        underlineBtn.classList.toggle('active', currentStyle.underline);
        updatePreview();
    });
    
    invertBtn.addEventListener('click', () => {
        currentStyle.invert = !currentStyle.invert;
        invertBtn.classList.toggle('active', currentStyle.invert);
        updatePreview();
    });
    
    catBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            catBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.cat;
            currentFontIndex = 0;
            loadFonts();
            saveSettings();
        });
    });
    
    copyBtn.addEventListener('click', copyFontInfo);
    
    setupInfiniteScroll();
    loadSettings();
}

export function cleanup() {
    console.log('Font Viewer se zavírá');
}
import { CONFIG } from './config.js';

// ============================================================
// LOKÁLNÍ ODPOVĚDI (rychlá tlačítka) – PŘEDDEFINOVANÉ
// ============================================================
const localAnswers = {
    "🛒 Jak objednat?": "Objednávka je jednoduchá! Klikni na 'Koupit teď' u produktu, otevře se WhatsApp s předvyplněnou zprávou, potvrdíme detaily a hotovo! 🛒✨",
    
    "💰 Vlastní cena": "U každého produktu najdeš tlačítko 'Nabídnout cenu'. Napiš svou částku, pošli mi ji na WhatsApp a já se ozvu! Nejhorší, co se může stát, je, že řeknu ne 😉",
    
    "🚚 Doprava": "Zásilkovna (výdejní místo): 99 Kč\nZásilkovna (na adresu): 139 Kč\nBalíkovna (výdejní místo): 85 Kč\nBalíkovna (na adresu): 115 Kč\n\nPlatíš jen jedno poštovné za celou objednávku! 📦",
    
    "💳 Platba": "Můžeš zaplatit:\n• QR kód (klikni na tlačítko níže)\n• Bankovní převod: 670100-2212159557 / 6210\n• PayPal / Revolut (individuálně)\n• Dobírka (platíš jen poštovné předem) 💰",

    "🖼️ Zobrazit QR kód": "📱 Klikni na tlačítko **'Otevřít QR kód'** níže pro zobrazení platebního QR kódu.",
    
    "🪚 Zakázková výroba": "Chceš unikátní kousek? Napiš mi na WhatsApp +420730996444, pošli svou představu, já ti zdarma připravím návrh i s cenou! 🪵✨",
    
    "❓ Skladová dostupnost": "Produkty s označením 'skladem' jsou připravené k okamžitému odeslání. Pokud se zrovna prodaly, vyrobím nový! Stačí mi napsat 📦",
    
    "📞 Kontakt": "Nejrychlejší je WhatsApp: +420730996444\nMůžeš mi i zavolat nebo napsat email: hello.plisek@gmail.com 📱",
    
    "🛠️ Péče o výrobky": "Nelakované dřevo: jen suchý hadřík\nLakované: vlhký hadřík s kapkou jaru\nNevystavuj přímému slunci ani radiátorům 🧼",
};

// Apps Script URL
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzDt4zWT7cFf099OcQq_nC_O9DnU_uQsgUk341GzShff52bwnx9d_x435Uiu8yhx4g/exec";

// Stav chatu
let chatInitialized = false;
let isWaitingForResponse = false;

function getUserId() {
  let userId = localStorage.getItem('woodisek_user_id');
  if (!userId) {
    userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('woodisek_user_id', userId);
  }
  return userId;
}

// ============================================================
// PŘEPNUTÍ PANELU CHATU
// ============================================================
function toggleChatPanel() {
    if (navigator.vibrate) navigator.vibrate(10);
    
    const modal = document.getElementById('chat-modal');
    const bg = document.getElementById('chat-overlay-bg');
    const chatBtn = document.getElementById('chat-toggle-btn');
    
    if (!modal || !bg) return;
    
    if (modal.classList.contains('open')) {
        modal.classList.remove('open');
        bg.style.display = 'none';
        document.body.style.overflow = '';
        if (chatBtn) chatBtn.style.display = 'flex';
    } else {
        modal.classList.add('open');
        bg.style.display = 'block';
        document.body.style.overflow = 'hidden';
        if (chatBtn) chatBtn.style.display = 'none';
        
        if (!chatInitialized) {
            initChat();
        }
    }
}

// ============================================================
// INICIALIZACE CHATU
// ============================================================
function initChat() {
    console.log('🚀 Inicializuji chat s lokálními odpověďmi + Gemini AI...');
    
    const chatBody = document.getElementById('chat-body');
    const optionsContainer = document.getElementById('chat-options');
    
    if (!chatBody || !optionsContainer) {
        console.error('❌ Chat kontejner nenalezen!');
        return;
    }
    
    // Vyčištění
    chatBody.innerHTML = '';
    optionsContainer.innerHTML = '';
    
    // Úvodní zpráva
    const welcomeMsg = document.createElement('div');
    welcomeMsg.className = 'msg msg-system';
    welcomeMsg.innerHTML = `👋 <b>Ahoj! Jsem Woodisek</b><br><br>Rád ti pomohu s objednávkou, dopravou nebo čímkoli dalším. Vyber si téma nebo napiš vlastní otázku! 🪵✨`;
    chatBody.appendChild(welcomeMsg);
    
    // RYCHLÁ TLAČÍTKA (lokální odpovědi)
    const quickContainer = document.createElement('div');
    quickContainer.className = 'quick-questions-container';
    quickContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;';
    
    const quickQuestions = Object.keys(localAnswers);
    quickQuestions.forEach(question => {
        const btn = document.createElement('button');
        btn.className = 'chat-opt-btn';
        btn.innerText = question;
        btn.onclick = () => {
            // LOKÁLNÍ ODPOVĚĎ – OKAMŽITÁ, BEZ AI
            sendLocalMessage(question, localAnswers[question]);
        };
        quickContainer.appendChild(btn);
    });
    
    optionsContainer.appendChild(quickContainer);
    
    // Vstupní pole (pouze toto jde do AI)
    const inputContainer = document.createElement('div');
    inputContainer.className = 'chat-input-container';
    inputContainer.style.cssText = 'display: flex; gap: 8px; margin-top: 15px; padding-top: 10px; border-top: 1px solid var(--border);';
    inputContainer.innerHTML = `
        <input type="text" id="chat-input-field" class="chat-input-field" placeholder="Zeptej se AI..." style="flex: 1; padding: 10px 14px; border-radius: 25px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-family: inherit; font-size: 13px; outline: none;">
        <button id="chat-send-btn" class="chat-send-btn" style="background: var(--accent); color: white; border: none; border-radius: 50%; width: 42px; height: 42px; cursor: pointer; font-size: 18px;">➤</button>
    `;
    optionsContainer.appendChild(inputContainer);
    
    // Event listenery
    const inputField = document.getElementById('chat-input-field');
    const sendBtn = document.getElementById('chat-send-btn');
    
    if (sendBtn) {
        sendBtn.onclick = () => {
            const text = inputField?.value.trim();
            if (text) {
                sendUserMessage(text);
                inputField.value = '';
            }
        };
    }
    
    if (inputField) {
        inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const text = inputField.value.trim();
                if (text) {
                    sendUserMessage(text);
                    inputField.value = '';
                }
            }
        });
    }
    
    chatInitialized = true;
}

// ============================================================
// LOKÁLNÍ ODPOVĚĎ (z předdefinovaných tlačítek)
// ============================================================
function sendLocalMessage(question, answer) {
    const chatBody = document.getElementById('chat-body');
    if (!chatBody) return;
    
    // Zobrazení otázky uživatele
    const userMsg = document.createElement('div');
    userMsg.className = 'msg msg-user';
    userMsg.innerText = question;
    chatBody.appendChild(userMsg);
    chatBody.scrollTop = chatBody.scrollHeight;
    
    // ============================================================
    // PŘIDÁNO: Indikátor psaní + zpoždění
    // ============================================================
    
    // Zobrazí indikátor "Woodisek píše"
    const typingDiv = document.createElement('div');
    typingDiv.className = 'msg msg-system typing-message';
    typingDiv.innerHTML = `✍️ <span class="typing-text-animated">Woodisek píše</span>`;
    chatBody.appendChild(typingDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
    
    // Zpoždění před odpovědí (např. 800 milisekund)
    setTimeout(() => {
        // Odstraní indikátor psaní
        if (typingDiv && typingDiv.parentNode) typingDiv.remove();
        
        // Zobrazení odpovědi
        const botMsg = document.createElement('div');
        botMsg.className = 'msg msg-system';
        
        // Speciální případ pro QR kód
        if (question === "🖼️ Zobrazit QR kód") {
            botMsg.innerHTML = `
                ${answer}
                <div style="text-align: center; margin-top: 15px;">
                    <button onclick="window.openQrZoom()" 
                            style="background: var(--accent); color: white; border: none; 
                                   padding: 12px 24px; border-radius: 30px; font-size: 14px;
                                   font-weight: bold; cursor: pointer; margin-top: 10px;">
                        📱 Otevřít QR kód
                    </button>
                    <p style="font-size: 11px; color: var(--text-dim); margin-top: 10px;">
                        🏦 Číslo účtu: 670100-2212159557 / 6210
                    </p>
                </div>
            `;
        } else {
            botMsg.innerHTML = answer.replace(/\n/g, '<br>');
        }
        
        chatBody.appendChild(botMsg);
        chatBody.scrollTop = chatBody.scrollHeight;
    }, 800); // ← ZDE MĚNÍŠ RYCHLOST (v milisekundách)
}

// ============================================================
// ODESLÁNÍ DO GEMINI AI (pouze z input pole)
// ============================================================
async function sendUserMessage(message) {
    if (isWaitingForResponse) {
        showToastInChat("Prosím počkej, zpracovávám předchozí odpověď...", "⏳");
        return;
    }
    
    const chatBody = document.getElementById('chat-body');
    if (!chatBody) return;
    
    // Zobrazení uživatelské zprávy
    const userMsg = document.createElement('div');
    userMsg.className = 'msg msg-user';
    userMsg.innerText = message;
    chatBody.appendChild(userMsg);
    
    // Zobrazení indikátoru psaní
    const typingDiv = document.createElement('div');
    typingDiv.className = 'msg msg-system typing-message';
    typingDiv.innerHTML = `✍️ <span class="typing-text-animated">Woodisek přemýšlí (AI)</span>`;
    chatBody.appendChild(typingDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
    
    isWaitingForResponse = true;
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);
        
        // JSONP pro Apps Script (zachováváme tvůj stávající způsob)
        const callbackName = `callback_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
        
        const response = await new Promise((resolve, reject) => {
            window[callbackName] = (data) => {
                clearTimeout(timeoutId);
                resolve(data);
                delete window[callbackName];
            };
            
            const script = document.createElement('script');
            const userId = getUserId();
            script.src = `${APPS_SCRIPT_URL}?callback=${callbackName}&task=${encodeURIComponent(message)}&userId=${encodeURIComponent(userId)}`;
            script.onerror = () => {
                clearTimeout(timeoutId);
                reject(new Error('Network error'));
                delete window[callbackName];
            };
            document.body.appendChild(script);
            
            setTimeout(() => {
                if (window[callbackName]) {
                    reject(new Error('Timeout'));
                    delete window[callbackName];
                }
            }, 25000);
        });
        
        // Odstranění indikátoru psaní
        if (typingDiv && typingDiv.parentNode) typingDiv.remove();
        
        let replyText = "Omlouvám se, něco se pokazilo. Zkus to prosím znovu. 🪵";
        
        if (response && response.steps) {
            replyText = response.steps;
        }
        
        const aiMsg = document.createElement('div');
        aiMsg.className = 'msg msg-system';
        aiMsg.innerHTML = replyText.replace(/\n/g, '<br>');
        chatBody.appendChild(aiMsg);
        chatBody.scrollTop = chatBody.scrollHeight;
        
    } catch (error) {
        if (typingDiv && typingDiv.parentNode) typingDiv.remove();
        
        const errorMsg = document.createElement('div');
        errorMsg.className = 'msg msg-system';
        errorMsg.innerHTML = "❌ Bohužel se nepodařilo spojit s AI. Zkus to prosím za chvíli nebo použij jedno z tlačítek nahoře. 🪵";
        chatBody.appendChild(errorMsg);
        chatBody.scrollTop = chatBody.scrollHeight;
    }
    
    isWaitingForResponse = false;
}

// ============================================================
// POMOCNÁ FUNKCE PRO TOAST
// ============================================================
function showToastInChat(text, icon = "🪵") {
    const toast = document.getElementById('toast-container');
    if (toast) {
        const iconSpan = document.getElementById('toast-icon');
        const textSpan = document.getElementById('toast-text');
        if (iconSpan) iconSpan.innerText = icon;
        if (textSpan) textSpan.innerText = text;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }
}

// ============================================================
// ZAVŘENÍ CHATU
// ============================================================
function closeChatPanel() {
    const modal = document.getElementById('chat-modal');
    const bg = document.getElementById('chat-overlay-bg');
    const chatBtn = document.getElementById('chat-toggle-btn');
    
    if (modal) modal.classList.remove('open');
    if (bg) bg.style.display = 'none';
    document.body.style.overflow = '';
    if (chatBtn) chatBtn.style.display = 'flex';
}

// Globální exporty
window.toggleChatPanel = toggleChatPanel;
window.initChat = initChat;
window.closeChatPanel = closeChatPanel;

export { toggleChatPanel, initChat, closeChatPanel };

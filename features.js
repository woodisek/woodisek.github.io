import { allProducts } from './api.js';
import { CONFIG } from './config.js';

export function createWoodShavings(event) {
    let x, y;
    if (event && event.target) {
        const rect = event.target.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
    } else {
        x = window.innerWidth / 2;
        y = window.innerHeight / 2;
    }
    
    const colors = ['#7a4e2d', '#8b5a2b', '#9b6a3b', '#c28a4b', '#b87a3a'];
    const emojis = ['🪵', '🌲', '🍂', '🪓'];
    const particleCount = 7;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        const useEmoji = Math.random() > 0.5;
        
        if (useEmoji) {
            particle.innerText = emojis[Math.floor(Math.random() * emojis.length)];
            particle.style.fontSize = '16px';
            particle.style.fontFamily = 'monospace';
        } else {
            particle.style.width = '8px';
            particle.style.height = '8px';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.borderRadius = '2px';
            particle.style.transform = 'rotate(' + Math.random() * 360 + 'deg)';
        }
        
        particle.style.position = 'fixed';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '99999';
        particle.style.opacity = '1';
        
        const angle = (Math.random() * Math.PI) - (Math.PI / 2);
        const distance = 50 + Math.random() * 70;
        const dx = Math.cos(angle) * distance * (Math.random() > 0.5 ? 1 : -1);
        const dy = Math.sin(angle) * distance - 40;
        const rotate = (Math.random() - 0.5) * 360;
        
        particle.style.transition = 'all 0.6s cubic-bezier(0.2, 0.9, 0.4, 1.1)';
        document.body.appendChild(particle);
        
        requestAnimationFrame(() => {
            particle.style.transform = `translate(${dx}px, ${dy}px) rotate(${rotate}deg)`;
            particle.style.opacity = '0';
        });
        
        setTimeout(() => {
            if (particle && particle.remove) particle.remove();
        }, 600);
    }
}

const socialMessages = [
    { icon: "🪦", text: "Naposledy viděn: {name}, když si prohlížel {product}. Pak zmizel." },
    { icon: "👻", text: "Duch bývalého zákazníka {name} právě přidal {product} do košíku." },
    { icon: "⚰️", text: "{name} řekl: Až umřu, chci být pohřben s {product}. Je to jediná věc, která mi dává smysl." },
    { icon: "🔪", text: "{product} je tak ostrý, že by rozřezal i city {name}. Ale ty už jsou dávno mrtvé." },
    { icon: "💀", text: "Zákazník {name} si koupil {product} a pak... už o něm nikdo neslyšel." },
    { icon: "🕯️", text: "Svíčka dohořívá, stejně jako naděje {name}, že {product} někdo koupí." },
    { icon: "🥀", text: "Růže uvadají, {product} stále čeká na {name}. Láska je mýtus, ale dřevo je věčné." },
    { icon: "🪓", text: "{product} je tak dobrý, že by pro něj {name} šel i na popravu. A vlastně proč ne?" },
    { icon: "📉", text: "{count} lidí si právě prohlíží {product}. A {count - 1} z nich nemá peníze. {name} je ten jeden." },
    { icon: "😭", text: "{name} pláče do polštáře, protože {product} je vyprodáno. Ale co už, život bolí." },
    { icon: "🖤", text: "{name} věří jen dvěma věcem: smrti a tomu, že {product} je kvalitní." },
    { icon: "🧟", text: "{name} nezemřel, jen čeká na doručení {product}. Pošta ho zabije dřív." },
    { icon: "☠️", text: "Varování pro {name}: {product} může způsobit závislost, ztrátu peněz a chronický úsměv." },
    { icon: "🥲", text: "{product} je jediný důvod, proč {name} ráno vstává. Ten druhý je kafe. A třetí už nemá." },
    { icon: "🪦", text: "R.I.P. výplata {name}. Právě si objednal {product}." },
    { icon: "🤡", text: "{name} je klaun. Dává slevy, i když nemá na nájem. Ale {product} stojí za to." },
    { icon: "🏚️", text: "{name} bydlí v krabici od {product}. Ale aspoň voní dřevem." },
    { icon: "😵", text: "{name} prodá ledvinu, koupí {product}. Kdo potřebuje dvě ledviny stejně?" },
    { icon: "🥴", text: "Zákazník {name} si koupil {product}. Já si koupil ramen na týden. Win-win." },
    { icon: "🔄", text: "Život {name} je jako {product} - jednou ho máš, podruhé ne. Ale hlavně že točí." },
    { icon: "💸", text: "{name}: Peníze jsou přelud. {product} je realita. Jeho účetní to nesnáší." },
    { icon: "😶‍🌫️", text: "{name} čeká na {product}. Já čekám na smysl života. Kdo bude dřív?" },
    { icon: "🐄", text: "Kráva souseda {name} si oblíbila {product}. Nevím proč, ale nelžu." },
    { icon: "🍞", text: "{name} spadl chleba máslem na zem. Místo toho si koupil {product}. Logika?" },
    { icon: "🦷", text: "Zubař doporučuje {name} {product}. Na zuby to není, ale na duši ano." },
    { icon: "🚽", text: "{name} říká: {product} je tak dobrý, že bych si ho dal i na záchod. A už jsem to udělal." },
    { icon: "🐧", text: "Tučňák {name} řekl: {product} je boží. Tučňáci nelžou." },
    { icon: "🍌", text: "Banán je křivý, stejně jako životní cesta {name}. Ale {product} je rovný. Až na ty hrany." },
    { icon: "🎪", text: "{name} utekl z cirkusu. Teď prodává {product}. Zábava na druhou." },
    { icon: "📞", text: "Volal {name}: Prý už mu {product} zachránilo manželství. Nebo to bylo něco jiného?" }
];

const names = [
    "Pavel", "Jirka", "Honza", "Petr", "Martin", "Tomáš", "Lukáš", "David",
    "Michal", "Ondra", "Jakub", "Filip", "Venca", "Karel", "Zdeněk", "Miloš",
    "Eva", "Jana", "Petra", "Lucie", "Martina", "Kateřina", "Veronika", "Tereza"
];

let socialProofInterval = null;

function showRandomSocialMessage() {
    if (!CONFIG.Enable_Social_Proof) return;
    if (!allProducts || allProducts.length === 0) return;
    
    const randomMsg = socialMessages[Math.floor(Math.random() * socialMessages.length)];
    let text = randomMsg.text;
    let icon = randomMsg.icon;
    
    const name = names[Math.floor(Math.random() * names.length)];
    const randomProduct = allProducts[Math.floor(Math.random() * allProducts.length)];
    const productName = randomProduct.name;
    const randomCount = Math.floor(Math.random() * 25) + 3;
    
    if (text.includes("{count - 1}")) {
        const calculated = randomCount - 1;
        text = text.replace("{count - 1}", calculated);
    }
    
    text = text.replace(/{name}/g, name)
               .replace(/{product}/g, productName || "dřevěný výrobek")
               .replace(/{count}/g, randomCount);
    
    const proofDiv = document.getElementById('social-proof');
    if (!proofDiv) return;
    
    const iconSpan = proofDiv.querySelector('.sp-icon');
    const textSpan = proofDiv.querySelector('.sp-text');
    
    if (iconSpan) iconSpan.innerText = icon;
    if (textSpan) textSpan.innerHTML = text;
    
    proofDiv.classList.remove('show');
    void proofDiv.offsetWidth;
    proofDiv.classList.add('show');
    
    setTimeout(() => {
        proofDiv.classList.remove('show');
    }, 7000);
}

function scheduleNextSocialProof() {
    if (!CONFIG.Enable_Social_Proof) return;
    
    const interval = CONFIG.Social_Proof_Interval || 30000;
    const randomDelay = Math.floor(Math.random() * (interval + 10000) + interval);
    socialProofInterval = setTimeout(() => {
        showRandomSocialMessage();
        scheduleNextSocialProof();
    }, randomDelay);
}

export function initSocialProof() {
    if (!CONFIG.Enable_Social_Proof) {
        const socialProof = document.getElementById('social-proof');
        if (socialProof) socialProof.style.display = 'none';
        return;
    }
    
    if (socialProofInterval) {
        clearTimeout(socialProofInterval);
    }
    
    const socialProof = document.getElementById('social-proof');
    if (socialProof) socialProof.style.display = 'flex';
    
    socialProofInterval = setTimeout(() => {
        showRandomSocialMessage();
        scheduleNextSocialProof();
    }, 8000);
}
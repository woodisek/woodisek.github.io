/**
 * WOODISEK E-SHOP
 * Copyright (c) 2025 Michal Plíšek (Woodisek)
 * License: Proprietary - All rights reserved
 * Unauthorized copying, modification, or distribution is prohibited.
 * Contact: hello.plisek@gmail.com
 */

// ============================================================
// chat.js - Woodisek Rádce (Chatbot)
// ============================================================

import { CONFIG } from './config.js';

// ============================================================
// CHATOVÁ DATA – definice musí být PŘED ladícími výpisy
// ============================================================

const chatData = {
    // ============================================================
    // HLAVNÍ MENU (odebráno "Jak vznikl Woodisek?")
    // ============================================================
    start: {
        text: `👋 <b>Dobrý den, potřebujete s něčím poradit?</b><br><br>Jsem tu, abych vám nákup co nejvíce usnadnil. Vyberte si téma, které vás zajímá:`,
        options: [
            { label: "🛒 Jak objednat?", next: "order" },
            { label: "💰 Chci navrhnout vlastní cenu", next: "offer" },
            { label: "🚚 Doprava a cena", next: "shipping" },
            { label: "💳 Platba", next: "payment" },
            { label: "🪚 Zakázková výroba", next: "custom" },
            { label: "❓ Je zboží skladem?", next: "stock" },
            { label: "📞 Kontakt", next: "contact" },
            { label: "🛠️ Jak se starat o výrobky?", next: "careMenu" },
            { label: "🔍 Jaký má produkt povrch?", next: "surfaceInfo" }
        ]
    },

    // ============================================================
    // PŘÍBĚH WOODISKU (zachován pro případ, že by se na něj odkazovalo)
    // ============================================================

    story1: {
        text: `📖 <b>Jak to celé vzniklo?</b> 🛠️<br><br>
               Vlastně úplnou náhodou v červenci 2022! Viděl jsem na netu video s gravírováním a okamžitě mě to chytlo. 📱`,
        options: [
            { label: "💡 A co dál?", next: "story2" },
            { label: "⬅️ Zpět na začátek", next: "start" }
        ]
    },

    story2: {
        text: `💡 <b>Blesklo mi hlavou:</b><br><br>
               Proč pálit odřezky dřeva v kamnech 🪵🔥, když jim můžu vdechnout nový život?<br><br>
               Chtěl jsem udělat něco pro planetu 🌍 a zkusit si tím i něco vydělat.`,
        options: [
            { label: "👨‍💻 Pokračovat", next: "story3" },
            { label: "⬅️ Zpět na začátek", next: "start" }
        ]
    },

    story3: {
        text: `👨‍💻 <b>A pak to začalo...</b><br><br>
               Koupil jsem první stroj, začal jako samouk a dnes už mě to baví roky.<br><br>
               Největší odměna? Když se můj kousek dřeva líbí právě vám! ✨`,
        options: [
            { label: "✨ Co můžu objednat?", next: "storyMenu" },
            { label: "⬅️ Zpět na začátek", next: "start" }
        ]
    },

    storyMenu: {
        text: `✨ <b>Co vás zajímá dál?</b> 👇<br><br>
               Rád vám povím víc, nebo vám můžu pomoct s nákupem. Vyberte si:`,
        options: [
            { label: "🛒 Jak objednat?", next: "order" },
            { label: "🪚 Zakázková výroba", next: "custom" },
            { label: "🛠️ Jak se starat o výrobky?", next: "careMenu" },
            { label: "🔍 Jaký má produkt povrch?", next: "surfaceInfo" },
            { label: "📞 Kontakt na mě", next: "contact" },
            { label: "⬅️ Zpět na začátek", next: "start" }
        ]
    },

    // ============================================================
    // OBJEDNÁVKA
    // ============================================================

    order: {
        text: `<b>Objednávka je u mě rychlá a osobní.</b> 🙂<br><br>1️⃣ U produktu klikněte na <b>'Koupit teď'</b> nebo <b>'Objednat'</b>.<br>2️⃣ Otevře se vám <b>WhatsApp</b> s předpřipravenou zprávou.<br>3️⃣ Tam si bleskově potvrdíme detaily a je to! Produkt pak putuje do vašeho <b>košíčku</b> a ke mně do dílny.`,
        options: [
            { label: "Jak funguje celý proces?", next: "howItWorks" },
            { label: "💰 Vlastní cena", next: "offer" },
            { label: "🚚 Doprava", next: "shipping" },
            { label: "👉 Napsat mi rovnou", next: "writeNow" },
            { label: "⬅️ Zpět na začátek", next: "start" }
        ]
    },

    howItWorks: {
        text: `<b>Jak to u mě chodí krok za krokem:</b><br><br>👉 <b>Výběr:</b> Kliknete na produkt na webu.<br>👉 <b>Domluva:</b> Otevře se WhatsApp, kde potvrdíme detaily.<br>👉 <b>Platba:</b> Vyberete si způsob platby (QR, převod, dobírka...).<br>👉 <b>Odeslání:</b> Balíček pečlivě zabalím a odesílám k vám! 🚀`,
        options: [
            { label: "💳 Platba", next: "payment" },
            { label: "🚚 Doprava", next: "shipping" },
            { label: "👉 Napsat mi na WhatsApp", next: "writeNow" },
            { label: "⬅️ Zpět na začátek", next: "start" }
        ]
    },

    // ============================================================
    // NABÍDKA CENY
    // ============================================================

    offer: {
        text: `<b>Zaujal vás produkt, ale cena vám úplně nesedí?</b> 🤝<br><br>U každého produktu najdete tlačítko <b>'Nabídnout cenu'</b>. Funguje to jednoduše:<br><br>1️⃣ Do políčka napíšete částku, kterou byste si představovali.<br>2️⃣ Kliknete na <b>'Odeslat nabídku'</b>.<br>3️⃣ Otevře se vám WhatsApp s kódem produktu a vaší nabídkou.<br><br>Já se na to mrknu a buď si plácneme, nebo zkusíme najít zlatou střední cestu. Nebojte se, nekoušu! Nejhorší, co se může stát, je, že vám napíšu, že pod tuhle cenu jít nemůžu, protože dřevo taky něco stojí. 😉`,
        options: [
            { label: "🛒 Jak pak objednat?", next: "order" },
            { label: "👉 Napsat mi rovnou", next: "writeNow" },
            { label: "⬅️ Zpět na začátek", next: "start" }
        ]
    },

    // ============================================================
    // PLATBA
    // ============================================================

    payment: {
        text: `<b>Jak u mě můžete zaplatit?</b><br><br>📱 <b>QR kód</b> – stačí kliknout na tlačítko níže.<br>🏦 <b>Převod</b> – na účet: <b>670100-2212159557 / 6210</b>.<br>💸 <b>PayPal / Revolut</b> – vyřešíme individuálně.`,
        options: [
            { label: "🖼️ Zobrazit QR kód", next: "qrCode" },
            { label: "📦 Lze na dobírku?", next: "cod" },
            { label: "⬅️ Zpět na začátek", next: "start" }
        ]
    },

qrCode: {
    text: `Zde je QR kód pro platbu. Kliknutím na něj ho zvětšíte:<br><br>
           <img src="${CONFIG.QR_CODE_URL}" 
                class="chat-qr-img" 
                onclick="window.openQrZoom()" 
                style="cursor: pointer;"
                alt="QR kód k platbě">
           <br><i>Po zaplacení mi prosím dejte vědět do zprávy.</i>`,
    options: [
        { label: "🚚 Doprava a ceny", next: "shipping" },
        { label: "📞 Kontakt na mě", next: "contact" },
        { label: "⬅️ Zpět na začátek", next: "start" }
    ]
},

    cod: {
        text: `<b>Ano, dobírka je bez problému možná!</b> 👍<br><br>Funguje to jednoduše:<br>1. Předem zaplatíte pouze cenu za poštovné.<br>2. Samotný produkt zaplatíte až při převzetí balíčku.<br><br>Vše společně domluvíme za minutku přes <a href="https://wa.me/420730996444" target="_blank">WhatsApp</a>.`,
        options: [
            { label: "🚚 Ceny dopravy", next: "shipping" },
            { label: "👉 Napsat mi rovnou", next: "writeNow" },
            { label: "⬅️ Zpět na začátek", next: "start" }
        ]
    },

    orderId: {
        text: `<b>Číslo objednávky je důležité.</b> 🔢<br><br>Slouží mi jako identifikace vaší platby. Zadejte ho prosím při platbě (ať už přes QR, banku nebo Revolut), abych mohl váš kousek hned spárovat a začít balit.`,
        options: [
            { label: "💳 Zpět na platbu", next: "payment" },
            { label: "⬅️ Zpět na začátek", next: "start" }
        ]
    },

    // ============================================================
    // DOPRAVA
    // ============================================================

    shipping: {
        text: `<b>Možnosti doručení a ceny:</b><br><br>📦 <b>Zásilkovna</b> (výdejní místo): 99 Kč<br>🚚 <b>Zásilkovna</b> (na adresu): 139 Kč<br>📦 <b>Balíkovna</b> (výdejní místo): 85 Kč<br>🚚 <b>Balíkovna</b> (na adresu): 115 Kč<br><br>💡 <i>Platíte jen jedno poštovné za celou objednávku. Více informací přes <a href="https://wa.me/420730996444" target="_blank">WhatsApp</a>.</i>`,
        options: [
            { label: "⏱️ Kdy mi balíček dorazí?", next: "delivery" },
            { label: "📦 Dobírka", next: "cod" },
            { label: "👉 Napsat mi rovnou", next: "writeNow" },
            { label: "⬅️ Zpět na začátek", next: "start" }
        ]
    },

    delivery: {
        text: `<b>Kdy se můžete těšit na zásilku?</b> ⏱️<br><br>✔️ <b>Skladové kousky:</b> Odesílám obvykle do 1–2 dnů od přijetí platby.<br>🛠️ <b>Zakázková výroba:</b> Čas dodání si domluvíme individuálně přes WhatsApp podle toho, jak moc se u toho zapotím v dílně.`,
        options: [
            { label: "🚚 Zpět na dopravu", next: "shipping" },
            { label: "⬅️ Zpět na začátek", next: "start" }
        ]
    },

    // ============================================================
    // SKLADEM
    // ============================================================

    stock: {
        text: `<b>Dostupnost produktů:</b><br><br>Produkty s označením <b>"skladem"</b> jsou připravené k okamžitému odeslání. <br><br>Jelikož je to ruční výroba a prodávám i jinde, může se stát, že se kousek právě prodal. Pokud by to nastalo, hned vám napíšu a vymyslíme náhradu nebo vyrobím nový!`,
        options: [
            { label: "🛒 Jak objednat?", next: "order" },
            { label: "👉 Napsat mi rovnou", next: "writeNow" },
            { label: "⬅️ Zpět na začátek", next: "start" }
        ]
    },

    // ============================================================
    // ZAKÁZKOVÁ VÝROBA
    // ============================================================

    custom: {
        text: `<b>Chcete unikátní kousek přesně na míru?</b> 🔥<br><br>Moje pila už se těší! Stačí mi napsat na WhatsApp nebo u produktu kliknout na <b>'Poptat výrobu na míru'</b>.<br><br>👉 Pošlete mi svou představu.<br>👉 Já vám <b>zdarma</b> připravím návrh i s cenou.<br>👉 Pokud si plácneme, jdu do dílny!`,
        options: [
            { label: "💰 Jak funguje návrh ceny?", next: "offer" },
            { label: "👉 Napsat mi rovnou", next: "writeNow" },
            { label: "⬅️ Zpět na začátek", next: "start" }
        ]
    },

    // ============================================================
    // KONTAKT
    // ============================================================

    writeNow: {
        text: `<b>Výborně, jdeme na to!</b> 💬<br><br>Klikněte na odkaz níže, otevře se chat a můžeme to probrat. Obvykle odepisuju hned, pokud zrovna nedržím v ruce brusku a nemám plné uši pilin.<br><br>📱 <a href="https://wa.me/420730996444" target="_blank"><b>Otevřít chat na WhatsAppu</b></a>`,
        options: [
            { label: "⬅️ Zpět na začátek", next: "start" }
        ]
    },

    contact: {
        text: `<b>Kde mě najdete:</b><br><br>Nejrychlejší je WhatsApp, ale klidně mi i zavolejte:<br><br>📱 <a href="https://wa.me/420730996444" target="_blank"><b>WhatsApp</b></a> (nejlepší volba)<br>📞 <a href="tel:+420730996444">+420 730 996 444</a><br>✉️ <a href="mailto:hello.plisek@gmail.com">hello.plisek@gmail.com</a>`,
        options: [
            { label: "👉 Napsat mi rovnou", next: "writeNow" },
            { label: "⬅️ Zpět na začátek", next: "start" }
        ]
    },

    // ============================================================
    // ÚDRŽBA VÝROBKŮ
    // ============================================================

    careMenu: {
        text: `🛠️ <b>Jak se starat o dřevěné výrobky?</b><br><br>
               Každý povrch vyžaduje jinou péči. <b>Jaký povrch má váš výrobek, najdete v popisu produktu</b> – tam vždy uvádím, zda je nelakovaný, lakovaný nebo s akrylovými barvami.<br><br>
               Vyberte si typ povrchu podle vašeho výrobku:`,
        options: [
            { label: "🌲 Nelakovaná překližka", next: "careUnlacquered" },
            { label: "🎨 Akrylové barvy (bez laku)", next: "careAcrylic" },
            { label: "✨ Lakovaný povrch", next: "careLacquered" },
            { label: "📋 Obecné zásady pro všechny", next: "careGeneral" },
            { label: "💡 Můj tip na ošetření", next: "careTip" },
            { label: "⬅️ Zpět na začátek", next: "start" }
        ]
    },

    careUnlacquered: {
        text: `🌲 <b>Nelakovaná, čistá překližka</b><br><br>
               Tento povrch je nejcitlivější. Dřevo je "živé", dýchá a okamžitě nasákne jakoukoli tekutinu nebo mastnotu.<br><br>
               🧼 <b>Čištění:</b> Používejte pouze suchý nebo velmi mírně navlhčený hadřík (mikrovlákno). Pokud použijete vodu, povrch může zdrsnět (zvednou se vlákna).<br><br>
               ❌ <b>Čemu se vyhnout:</b> Nikdy nepoužívejte agresivní chemii nebo příliš vody. Skvrny od kávy či vína jsou u nelakovaného dřeva v podstatě neodstranitelné bez broušení.<br><br>
               💡 <b>Tip:</b> Pokud se povrch po čase ušpiní, můžete ho jemně přebrousit smirkovým papírem o zrnitosti 180–240.`,
        options: [
            { label: "🛠️ Další typ povrchu", next: "careMenu" },
            { label: "💡 Můj tip na ošetření", next: "careTip" },
            { label: "⬅️ Zpět na začátek", next: "start" }
        ]
    },

    careAcrylic: {
        text: `🎨 <b>Akrylové barvy (bez laku)</b><br><br>
               Akryl po zaschnutí vytvoří plastovou vrstvu, která je částečně voděodolná, ale bez laku zůstává "otevřená" nečistotám a mechanickému poškození.<br><br>
               🧼 <b>Čištění:</b> Otírejte jemně navlhčeným hadříkem. Barva drží, ale při silném drhnutí byste ji mohli "vyleštit" (vytvořit lesklé fleky na matném povrchu) nebo odřít.<br><br>
               ⚠️ <b>Pozor na barvení:</b> Nelakovaný akryl může chytat prach a mastnotu z prstů, které pak jdou špatně dolů.<br><br>
               📦 <b>Skladování:</b> Výrobky k sobě nedávejte natěsno plochami – akryl má tendenci se k sobě lepit (tzv. "blocking"), což by mohlo barvu při odtržení poškodit.`,
        options: [
            { label: "🛠️ Další typ povrchu", next: "careMenu" },
            { label: "💡 Můj tip na ošetření", next: "careTip" },
            { label: "⬅️ Zpět na začátek", next: "start" }
        ]
    },

    careLacquered: {
        text: `✨ <b>Lakovaný povrch (včetně lakovaného akrylu)</b><br><br>
               Toto je nejodolnější varianta. Lak vytvoří ochranný film, který nepustí vlhkost k dřevu ani k barvě.<br><br>
               🧼 <b>Čištění:</b> Můžete používat vlhký hadřík s kapkou neagresivního saponátu (jaru).<br><br>
               🛡️ <b>Údržba:</b> Lak chrání barvy před vyblednutím a mechanickým poškrábáním. Stačí běžné utírání prachu.<br><br>
               ⚠️ <b>Omezení:</b> I když je výrobek lakovaný, překližka nepatří do exteriéru nebo do koupelny, pokud nebyla použita speciální vodovzdorná překližka a lodní lak. Vlhkost se může dostat do řezných hran a způsobit nabobtnání.`,
        options: [
            { label: "🛠️ Další typ povrchu", next: "careMenu" },
            { label: "📋 Obecné zásady", next: "careGeneral" },
            { label: "⬅️ Zpět na začátek", next: "start" }
        ]
    },

    careGeneral: {
        text: `📋 <b>Obecné zásady pro všechny typy</b><br><br>
               ☀️ <b>Stop přímému slunci:</b> Dlouhodobé vystavení UV záření může způsobit žloutnutí čistého dřeva nebo blednutí barev.<br><br>
               🔥 <b>Pozor na teplo:</b> Nepokládejte výrobky přímo na radiátory. Překližka by mohla popraskat nebo se prohnout.<br><br>
               💧 <b>Sucho je základ:</b> Pokud výrobek polijete, okamžitě ho vysušte.<br><br>
               🧽 <b>Běžné čištění:</b> Na všechny povrchy používejte jemný hadřík, vyhněte se drsným houbičkám.`,
        options: [
            { label: "🛠️ Zpět na typy povrchů", next: "careMenu" },
            { label: "💡 Můj tip na ošetření", next: "careTip" },
            { label: "⬅️ Zpět na začátek", next: "start" }
        ]
    },

    careTip: {
        text: `💡 <b>Můj tip na ošetření</b><br><br>
               Pokud máte doma nelakovaný kousek, který chcete běžně používat, zvažte jeho ošetření přírodním voskem nebo olejem na dřevo.<br><br>
               ✅ Je to snadné<br>
               ✅ Voní to krásně<br>
               ✅ Dodá to dřevu krásnou hloubku<br>
               ✅ Poskytne základní ochranu proti skvrnám<br><br>
               🛒 <b>Koupit můžete třeba zde:</b><br>
               • <a href="https://www.osmo.cz/" target="_blank">Osmo olej</a><br>
               • <a href="https://www.hornbach.cz/" target="_blank">Hornbach – vosky a oleje</a><br><br>
               <i>Při aplikaci postupujte podle návodu výrobce.</i>`,
        options: [
            { label: "🛠️ Další typ povrchu", next: "careMenu" },
            { label: "🛒 Zpět na začátek", next: "start" }
        ]
    },

    // ============================================================
    // JAKÝ MÁ PRODUKT POVRCH?
    // ============================================================

    surfaceInfo: {
        text: `🔍 <b>Jaký má produkt povrch?</b><br><br>
               Informaci o povrchu každého výrobku <b>najdete v popisu produktu</b>.<br><br>
               📱 <b>Jak se k němu dostat?</b><br>
               1️⃣ Najděte produkt v seznamu<br>
               2️⃣ Klikněte na tlačítko <b>"Detaily"</b><br>
               3️⃣ V otevřeném okně uvidíte kompletní popis včetně povrchové úpravy<br><br>
               Pokud tam informaci přesto nenajdete, stačí mi napsat a rád vám ji sdělím! 😊<br><br>
               <i>Povrch ovlivňuje, jak se o výrobek starat – proto je dobré to vědět.</i>`,
        options: [
            { label: "🛠️ Jak se starat o výrobky?", next: "careMenu" },
            { label: "🛒 Jak objednat?", next: "order" },
            { label: "⬅️ Zpět na začátek", next: "start" }
        ]
    }
};

// Stav chatu
let chatInitialized = false;

/**
 * Přepnutí panelu chatu
 */
function toggleChatPanel() {
    // Haptická odezva
    if (navigator.vibrate) navigator.vibrate(10);
    
    const modal = document.getElementById('chat-modal');
    const bg = document.getElementById('chat-overlay-bg');
    if (!modal || !bg) return;
    
    if (modal.classList.contains('open')) {
        modal.classList.remove('open');
        bg.style.display = 'none';
    } else {
        modal.classList.add('open');
        bg.style.display = 'block';
        // Inicializace chatu při prvním otevření
        if (!chatInitialized) {
            initChat();
        }
    }
}



function showTypingIndicator() {
    const chatBody = document.getElementById('chat-body');
    if (!chatBody) return null;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'msg msg-system typing-message';
    typingDiv.innerHTML = `✍️ <span class="typing-text-animated">Woodisek píše</span>`;
    chatBody.appendChild(typingDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
    return typingDiv;
}




/**
 * Inicializace chatu - vykreslí úvodní obrazovku
 */
function initChat() {
    console.log('🚀 initChat volán!');
    const chatBody = document.getElementById('chat-body');
    const optionsContainer = document.getElementById('chat-options');
    
    if (!chatBody) {
        console.error('❌ chat-body nenalezen!');
        return;
    }
    if (!optionsContainer) {
        console.error('❌ chat-options nenalezen!');
        return;
    }
    
    console.log('✅ chat-body a chat-options nalezeny, vykresluji...');
    
    // Vyčistíme kontejnery
    chatBody.innerHTML = '';
    optionsContainer.innerHTML = '';
    
    // Vykreslíme startovací krok
    renderChatStep('start');
    chatInitialized = true;
}

// Přiřazení do window, aby byly dostupné globálně
window.toggleChatPanel = toggleChatPanel;
window.initChat = initChat;

/**
 * Vykreslení kroku chatu
 */
function renderChatStep(key) {
    console.log('📝 renderChatStep:', key);
    const data = chatData[key];
    if (!data) {
        console.error('❌ chatData pro klíč', key, 'nenalezeno!');
        return;
    }
    
    const chatBody = document.getElementById('chat-body');
    const optionsContainer = document.getElementById('chat-options');
    if (!chatBody || !optionsContainer) return;
    
    // Přidání systémové zprávy
    const sysMsg = document.createElement('div');
    sysMsg.className = 'msg msg-system';
    sysMsg.innerHTML = data.text;
    chatBody.appendChild(sysMsg);
    
    // Vykreslení tlačítek
    optionsContainer.innerHTML = '';
    data.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'chat-opt-btn';
        btn.innerText = opt.label;
        btn.onclick = () => handleUserChoice(opt.label, opt.next);
        optionsContainer.appendChild(btn);
    });
    
    // Scroll na konec
    setTimeout(() => {
        chatBody.scrollTop = chatBody.scrollHeight;
    }, 50);
}

/**
 * Zpracování volby uživatele
 */
function handleUserChoice(label, nextKey) {
    const chatBody = document.getElementById('chat-body');
    if (!chatBody) return;
    
    // Přidání uživatelské zprávy
    const userMsg = document.createElement('div');
    userMsg.className = 'msg msg-user';
    userMsg.innerText = label;
    chatBody.appendChild(userMsg);
    
    setTimeout(() => {
        chatBody.scrollTop = chatBody.scrollHeight;
    }, 50);
    
    // Zobrazení dalšího kroku po krátkém zpoždění
    setTimeout(() => {
        renderChatStep(nextKey);
    }, 400);
}

/**
 * Zvětšení QR kódu na celou obrazovku
 */
window.toggleFullScreenQR = function(img) {
    img.classList.toggle('qr-fullscreen');
    document.body.classList.toggle('qr-overlay-active');
};

// Export pro případné použití
export { chatData, renderChatStep, initChat };





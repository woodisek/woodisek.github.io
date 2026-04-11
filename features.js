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
    { icon: "🌅", text: "Až jednou pochopíš, že štěstí není cíl, ale způsob, jakým kráčíš, přestaneš spěchat a začneš opravdu žít." },
    { icon: "🌿", text: "Nejkrásnější věci v životě nejsou věci – jsou to okamžiky, kdy se tvé srdce cítí doma." },
    { icon: "💫", text: "Někdy musíš ztratit sám sebe, abys našel to, kým jsi měl být." },
    { icon: "❤️", text: "Láska není o tom najít někoho dokonalého, ale vidět nedokonalého člověka dokonale." },
    { icon: "🌙", text: "I ta nejtemnější noc jednou skončí a slunce znovu vyjde." },
    { icon: "🔥", text: "Síla člověka se nepozná podle toho, kolikrát nepadne, ale podle toho, kolikrát znovu vstane." },
    { icon: "🌸", text: "Buď jemný k sobě – i květiny potřebují čas, aby vykvetly." },
    { icon: "🌊", text: "Nauč se odcházet od všeho, co ti bere klid – protože klid je to nejcennější, co máš." },
    { icon: "✨", text: "Život není o čekání, až přejde bouře, ale o tom naučit se tančit v dešti." },
    { icon: "🕊️", text: "Odpusť ostatním ne proto, že si to zaslouží, ale proto, že ty si zasloužíš klid." },
    { icon: "🌄", text: "Každý nový den je tichá šance začít znovu a napsat lepší příběh." },
    { icon: "💖", text: "To, co dáváš druhým, se k tobě jednou vrátí – proto rozdávej lásku, ne strach." },
    { icon: "🌌", text: "Někdy stačí zpomalit a uvědomit si, že už teď máš víc, než sis kdy přál." },
    { icon: "🍃", text: "Ne všechno, co ztratíš, je prohra – některé věci tě jen uvolní pro něco lepšího." },
    { icon: "🌞", text: "Štěstí přichází tiše – v maličkostech, kterých si většina lidí ani nevšimne." },
    { icon: "🌺", text: "Každá jizva vypráví příběh o síle, kterou v sobě nosíš." },
    { icon: "🪶", text: "Lehkost života začíná ve chvíli, kdy přestaneš kontrolovat všechno kolem sebe." },
    { icon: "🌈", text: "Po každé bouři přichází klid – jen musíš vydržet dost dlouho, abys ho zažil." },
    { icon: "🕯️", text: "I malé světlo dokáže zahnat velkou tmu." },
    { icon: "🌻", text: "Otoč se za sluncem – i když ho zrovna nevidíš, pořád tam je." },
    { icon: "🌠", text: "Sny nejsou na to, aby zůstaly sny – jsou začátkem něčeho skutečného." },
    { icon: "🧡", text: "Největší klid najdeš ve chvíli, kdy přijmeš věci takové, jaké jsou." },
    { icon: "🌹", text: "Někdy největší síla spočívá v tom, že zůstaneš laskavý ve světě, který tě učí opak." },
    { icon: "🌊", text: "Pusť to, co nemůžeš změnit, a obejmi to, co právě přichází." },
    { icon: "🌙", text: "Ticho noci často prozradí pravdy, které přes den přehlížíme." },
    { icon: "☀️", text: "Každé ráno má v sobě novou naději – i když ji ještě nevidíš." },
    { icon: "🍂", text: "Stejně jako listí musí opadat, i ty musíš někdy nechat věci jít." },
    { icon: "🕊️", text: "Klid nepřichází z toho, že máš vše pod kontrolou, ale z toho, že se naučíš důvěřovat." },
    { icon: "🌼", text: "Radost se skrývá v maličkostech – v úsměvu, doteku, tichém okamžiku." },
    { icon: "🔥", text: "I když se cítíš ztracený, pořád v tobě hoří jiskra, která tě dovede dál." },
    { icon: "🌌", text: "Někdy musíš projít tmou, abys uviděl, jak silně dokážeš zářit." },
    { icon: "🌿", text: "Růst bolí, ale zůstat na místě bolí ještě víc." },
    { icon: "💫", text: "To, co hledáš venku, často tiše čeká uvnitř tebe." },
    { icon: "🌸", text: "Nejsi pozadu – jsi přesně tam, kde máš být." },
    { icon: "🌞", text: "Dovol si být šťastný i bez důvodu." },
    { icon: "🌈", text: "I malé kroky tě jednou dovedou na velká místa." },
    { icon: "🪞", text: "To, jak mluvíš sám k sobě, utváří tvůj svět." },
    { icon: "🌠", text: "Neboj se snít – sny jsou mapa k tvé budoucnosti." },
    { icon: "🍃", text: "Někdy je největší výhra v tom, že se rozhodneš jít dál." },
    { icon: "🕯️", text: "Stačí jedna naděje, aby rozsvítila celý tvůj svět." },
    { icon: "🌻", text: "Rosteme nejvíc v okamžicích, kdy si myslíme, že už nemůžeme." },
    { icon: "❤️", text: "Láska začíná tam, kde přestaneš předstírat." },
    { icon: "🌄", text: "Každý konec v sobě nese tichý začátek něčeho nového." },
    { icon: "🌊", text: "Nech život plynout – ne všechno musíš řídit." },
    { icon: "✨", text: "Krása života je v jeho nedokonalosti." },
    { icon: "🧡", text: "Buď k sobě tak laskavý, jaký jsi k ostatním." },
    { icon: "🌙", text: "Některé odpovědi přicházejí až ve chvíli, kdy přestaneš hledat." },
    { icon: "🌿", text: "To, co tě čeká, může být krásnější než to, co jsi ztratil." },
    { icon: "💖", text: "Nezapomeň – jsi dost takový, jaký jsi." },
    { icon: "🌺", text: "Každý den je nová šance změnit svůj příběh." },
    { icon: "🔥", text: "Odvaha začíná tam, kde končí strach." },
    { icon: "🌌", text: "Tvůj příběh ještě neskončil – to nejlepší může teprve přijít." },
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

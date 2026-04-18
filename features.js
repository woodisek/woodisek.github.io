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
    { icon: "📱", text: "Ztráta mobilního signálu je pro mozek stresující stejně jako přírodní katastrofa." },
    { icon: "🐙", text: "Chobotnice mají tři srdce." },
    { icon: "🔩", text: "Lidské tělo obsahuje dostatek železa na výrobu 7,5 cm dlouhého hřebíku." },
    { icon: "☕", text: "Káva je druhé nejobchodovanější zboží na světě hned po ropě." },
    { icon: "🍌", text: "Lidé sdílí 60 % DNA s banánem." },
    { icon: "❤️", text: "Lidské srdce bije v průměru 100 000krát za den." },
    { icon: "🐘", text: "Sloni jsou jediní savci, kteří neumí skákat." },
    { icon: "🦩", text: "Plameňáci se barví dorůžova díky řasám a korýšům, které jedí." },
    { icon: "🌍", text: "Rusko je rozlohou větší než Pluto." },
    { icon: "⏱️", text: "Den na Venuši je delší než rok na Venuši." },
    { icon: "🍍", text: "Ananas roste na zemi, ne na stromě." },
    { icon: "🦷", text: "Zubní sklovina je nejtvrdší látka v lidském těle." },
    { icon: "🐨", text: "Otisky prstů koaly jsou tak podobné lidským, že je lze zaměnit i pod mikroskopem." },
    { icon: "💨", text: "Prd má průměrnou rychlost 3 metry za sekundu." },
    { icon: "🧠", text: "Mozek spotřebuje 20 % celkové energie těla." },
    { icon: "🦈", text: "Žraloci existují na Zemi déle než stromy." },
    { icon: "🥜", text: "Arašídy nejsou ořechy, ale luštěniny." },
    { icon: "🌙", text: "Měsíc se od Země vzdaluje rychlostí 3,8 cm za rok." },
    { icon: "🐝", text: "Včela během svého života vyprodukuje asi 1/12 čajové lžičky medu." },
    { icon: "👁️", text: "Tvoje oči zůstávají po celý život stejně velké, ale nos a uši rostou pořád." },
    { icon: "🐧", text: "Tučňákům není zima na nohy, protože mají speciální tepelný výměník v krevním oběhu." },
    { icon: "🍫", text: "Čokoláda byla kdysi používána jako platidlo." },
    { icon: "🦴", text: "Dítě se rodí s asi 300 kostmi, dospělý jich má jen 206." },
    { icon: "🔊", text: "Nejhlasitější zvuk v historii byl výbuch sopky Krakatoa, byl slyšet 4 800 km daleko." },
    { icon: "🐭", text: "Myš je nejčastěji používané zvíře ve vědeckém výzkumu." },
    { icon: "🦋", text: "Motýli chutnají nohama." },
    { icon: "💧", text: "Kapka vody v průměru dopadá rychlostí 13 km/h." },
    { icon: "🍔", text: "První hamburger byl prodán v roce 1900 v USA." },
    { icon: "🎂", text: "Nejstarší žijící strom na světě je starý přes 4 800 let." },
    { icon: "🦟", text: "Komáři zabijí ročně víc lidí než lidé sami navzájem." },
    { icon: "🌡️", text: "Nejvyšší teplota naměřená na Zemi byla 56,7 °C v Údolí smrti." },
    { icon: "❄️", text: "Nejnižší teplota naměřená na Zemi byla -89,2 °C na Antarktidě." },
    { icon: "📏", text: "Rozpětí tvých paží je přibližně rovné tvé výšce." },
    { icon: "🐕", text: "Psi mají asi 1 700 chuťových pohárků, lidé 9 000." },
    { icon: "🐱", text: "Kočky tráví 70 % svého života spánkem." },
    { icon: "🍯", text: "Med se nikdy nezkazí. Archeologové našli 3 000 let starý med, který byl stále jedlý." },
    { icon: "🦜", text: "Papoušci jsou jediní ptáci, kteří umí používat nástroje." },
    { icon: "🌎", text: "Nejdelší pohoří na světě je Středoatlantský hřbet, který je pod vodou." },
    { icon: "👃", text: "Lidský nos dokáže rozpoznat přes 1 bilion různých pachů." },
    { icon: "🍕", text: "Nejpopulárnější den pro objednávku pizzy je Super Bowl neděle." },
    { icon: "💪", text: "Nejsilnější sval v lidském těle (v poměru k velikosti) je jazyk." },
    { icon: "🐌", text: "Hlemýžď může spát až 3 roky." },
    { icon: "🎵", text: "Poslech hudby uvolňuje dopamin – stejnou látku jako jídlo nebo sex." },
    { icon: "🪐", text: "Saturn by plaval na vodě, protože má menší hustotu." },
    { icon: "🦷", text: "Čistíš si zuby asi 2 minuty? V USA stráví lidé průměrně 38 dní života čištěním zubů." },
    { icon: "📸", text: "První fotografie člověka je z roku 1838. Muž si čistil boty a stál tak dlouho, že se stihl vyfotit." },
    { icon: "🐒", text: "Šimpanzi a gorily mohou dostat nachlazení od lidí." },
    { icon: "🧀", text: "Nejvíce kradená potravina na světě je sýr." },
    { icon: "🌻", text: "Slunečnice dokáže vyčistit radioaktivní půdu." },
    { icon: "🦉", text: "Sovy neumí hýbat očima, proto otáčejí hlavou až o 270 stupňů." },
    { icon: "💡", text: "Žárovka v hasičské stanici v Kalifornii svítí nepřetržitě od roku 1901." },
    { icon: "🥚", text: "Pštrosí vejce je největší buňka na světě." },
    { icon: "🐄", text: "Krávy mají nejlepší kamarádky a stresují se, když jsou od sebe odděleny." },
    { icon: "🌿", text: "Existuje rostlina, která kvete jen jednou za 100 let." },
    { icon: "🦴", text: "Páteř má 33 obratlů." },
    { icon: "🥕", text: "Mrkev byla původně fialová. Oranžovou vyšlechtili Holanďané." },
    { icon: "🌧️", text: "V indické vesnici Mawsynram naprší ročně 11 871 mm srážek, je to nejdeštivější místo na Zemi." },
    { icon: "🐦", text: "Kolibřík je jediný pták, který umí létat pozpátku." },
    { icon: "👖", text: "Rifle byly vynalezeny v roce 1873." },
    { icon: "🔋", text: "Elektrický úhoř dokáže vygenerovat výboj až 600 voltů." },
    { icon: "🍎", text: "Jablko, cibule a brambora chutnají stejně, když si zacpeš nos. Rozdíl je jen ve vůni." },
    { icon: "🪱", text: "Žížala má 5 srdcí." },
    { icon: "👶", text: "Děti nemají kolenní čéšky, vyvíjejí se až kolem 2-6 let." },
    { icon: "🌵", text: "Kaktusy mohou žít i 300 let." },
    { icon: "🔊", text: "Když křičíš do sklenice s vodou, mění se struktura zvuku." },
    { icon: "📚", text: "Nejdražší kniha světa je Codex Leicester od Leonarda da Vinci." },
    { icon: "🌌", text: "Ve vesmíru je víc hvězd než zrnek písku na všech plážích Země." },
    { icon: "🧊", text: "Led je minerál." },
    { icon: "🦇", text: "Netopýři jsou jediní savci, kteří skutečně létají." },
    { icon: "🥤", text: "Plastová láhev se v přírodě rozkládá 450 let." },
    { icon: "👟", text: "Boty Crocs mají 13 dírek, což není náhoda." },
    { icon: "🍷", text: "Víno bylo vynalezeno dříve než kolo." },
    { icon: "🦥", text: "Lenochod zadrží dech pod vodou déle než delfín (až 40 minut)." },
    { icon: "🧴", text: "Průměrný člověk spotřebuje za život 50 litrů opalovacího krému." },
    { icon: "🐓", text: "Slepice s červenými ušními lalůčky snášejí hnědá vejce, s bílými bílá vejce." },
    { icon: "🚗", text: "První auto mělo jen 3 kola." },
    { icon: "🌱", text: "Bambus může vyrůst až o 91 cm za jediný den." },
    { icon: "✈️", text: "Nejkratší komerční let na světě trvá jen 57 sekund (mezi skotskými ostrovy)." },
    { icon: "🐉", text: "Vážka žije jen 24 hodin? Omyl, žije až několik měsíců." },
    { icon: "📺", text: "První televizní vysílání proběhlo v roce 1928." },
    { icon: "🌰", text: "Kešu ořechy rostou na jablku." },
    { icon: "🐚", text: "Mušle se otvírají a zavírají díky svalu, který je silnější než lidský biceps." },
    { icon: "🧊", text: "Suchý led není z vody, ale z oxidu uhličitého." },
    { icon: "🦎", text: "Gekon pije vodu tak, že si ji olizuje z očí." },
    { icon: "💤", text: "Během spánku jsi o 1-2 cm vyšší." },
    { icon: "🎂", text: "Happy Birthday je nejčastěji zpívaná píseň na světě." },
    { icon: "🐿️", text: "Veverky sází tisíce stromů ročně, protože zapomenou, kam zahrabaly ořechy." },
    { icon: "🦞", text: "Humři jsou biologicky nesmrtelní, neumírají stářím." },
    { icon: "🌡️", text: "V roce 1816 nebylo léto kvůli výbuchu sopky Tambora." },
    { icon: "👂", text: "Ucho je samočisticí orgán, vata do uší nepatří." },
    { icon: "🐄", text: "Kráva vyprodukuje za život dost mléka na 200 000 šálků kávy." },
    { icon: "💀", text: "Lebka má 22 kostí." },
    { icon: "🦟", text: "Jen samičky komárů koušou." },
    { icon: "🔥", text: "Oheň není pevné, kapalné ani plynné skupenství, je to plazma." },
    { icon: "🍫", text: "Bílá čokoláda technicky není čokoláda, neobsahuje kakaovou sušinu." },
    { icon: "👟", text: "Nejprodávanější bota všech dob je Nike Air Force 1." },
    { icon: "🦷", text: "Zuby se ti nehojí samy jako jiné kosti, proto potřebuješ zubaře." },
    { icon: "🌊", text: "Tichý oceán je větší než všechny kontinenty dohromady." },
    { icon: "✏️", text: "Jedna tužka dokáže napsat čáru dlouhou 56 km." },
    { icon: "🧀", text: "Ve Švýcarsku je víc druhů sýra než dní v roce." },
    { icon: "🎃", text: "Dýně je ovoce, ne zelenina." },
    { icon: "🦧", text: "Orangutani používají deštníky z listů, když prší." },
    { icon: "⌚", text: "Rolex byl první vodotěsné hodinky na světě." },
    { icon: "💧", text: "Lidské tělo je tvořeno ze 60 % vodou." },
    { icon: "🐬", text: "Delfíni spí jen s jednou polovinou mozku." },
    { icon: "🍅", text: "Rajče bylo v Evropě dlouho považováno za jedovaté." },
    { icon: "🔊", text: "Zvuk se šíří 4x rychleji ve vodě než ve vzduchu." },
    { icon: "💡", text: "Thomas Edison nevynalezl žárovku, jen ji vylepšil." },
    { icon: "🦷", text: "První zubní pasta byla vyrobena ze soli, pepře a máty." },
    { icon: "🌋", text: "Největší aktivní sopka na světě je Mauna Loa na Havaji." },
    { icon: "🦒", text: "Žirafa si čistí uši svým 50 cm dlouhým jazykem." },
    { icon: "🍺", text: "Pivo je třetí nejpopulárnější nápoj na světě po vodě a čaji." },
    { icon: "🪲", text: "Brouci tvoří 25 % všech živočišných druhů na Zemi." },
    { icon: "📱", text: "První mobil vážil přes 1 kg." },
    { icon: "🐻❄️", text: "Lední medvědi mají černou kůži, jejich srst je ve skutečnosti průhledná." },
    { icon: "⏳", text: "Kleopatra žila blíž vynálezu iPhonu než stavbě pyramid." },
    { icon: "🍄", text: "Největší živý organismus na světě je houba v Oregonu, zabírá 9 km²." },
    { icon: "🎂", text: "Nejstarší dort na světě je starý 4 200 let, našli ho v egyptské hrobce." },
    { icon: "🦴", text: "Nejmenší kost v těle je třmínek v uchu, měří 3 mm." },
    { icon: "🦂", text: "Štíři svítí pod UV světlem." },
    { icon: "🥜", text: "Burákové máslo lze proměnit v diamant." },
    { icon: "🧦", text: "Každý rok se ztratí v průměru 15 párů ponožek na osobu." },
    { icon: "🐘", text: "Sloní samice je březí 22 měsíců, nejdéle ze všech savců." },
    { icon: "🌻", text: "Slunečnice nejsou jeden květ, ale tisíce malých kvítků." },
    { icon: "🧊", text: "Antarktida je největší poušť na světě." },
    { icon: "💋", text: "Polibek spálí 2-6 kalorií za minutu." },
    { icon: "🐧", text: "Tučňák císařský se potápí do hloubky až 500 metrů." },
    { icon: "💡", text: "První semafor na světě byl v Londýně v roce 1868 a explodoval." },
    { icon: "🌵", text: "V kaktusu je voda, ale její pití způsobuje průjem a dehydrataci." },
    { icon: "🦑", text: "Oliheň obrovská má oči velké jako talíře." },
    { icon: "👻", text: "Strach z pátku 13. se nazývá paraskevidekatriafobie." },
    { icon: "📺", text: "Průměrný Američan stráví 9 let života sledováním televize." },
    { icon: "🛏️", text: "Člověk prosní v průměru 6 let svého života." },
    { icon: "🐕", text: "Čich psa je 40x citlivější než lidský." },
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

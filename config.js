/**
 * WOODISEK E-SHOP
 * Copyright (c) 2025 Michal Plíšek (Woodisek)
 */

export let CONFIG = {
    // Produkty (stávající)
    SHEETS_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTDLmB1BcPIJvI1rVpHHK59r7zTfZJVmQ30BofKB2wszp8aZxJBwLhjwTwbzHkZ1kiozdl7YDQO2cVI/pub?gid=1217363054&single=true&output=csv",
    // Nastavení (NOVÉ!)
    SETTINGS_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTDLmB1BcPIJvI1rVpHHK59r7zTfZJVmQ30BofKB2wszp8aZxJBwLhjwTwbzHkZ1kiozdl7YDQO2cVI/pub?gid=1043880805&single=true&output=csv",
    
    PHONE: "+420730996444",
    EMAIL: "hello.plisek@gmail.com",
    BANK_ACCOUNT: "670100-2212159557 / 6210",
    QR_CODE_URL: "https://i.ibb.co/qF1FyvG2/mbank.jpg",
    BASE_URL: "woodisek.github.io/",
    MAX_LOAD_ATTEMPTS: 3,
    FETCH_TIMEOUT: 15000,
    SWIPE_THRESHOLD: 70,
    Enable_Shop: true,
    
    // Výchozí hodnoty (pokud se nepodaří načíst CSV)
    Primarni_Barva: "#7a4e2d",
    Sekundarni_Barva: "#1a1a1a",
    Textova_Barva: "#e0e0e0",
    Textova_Barva_Tmava: "#888",
    Border_Radius: "16px",
    Font: "'Inter', sans-serif",
    Enable_Kosik: true,
    Enable_Slevy: true,
    Enable_Varianty: false,
    WhatsApp_Sablona: "Objednávka:\n{items}\n{shipping}\nCelkem: {total}\nČíslo objednávky: {order_number}",

    Empty_Products_Title: "Žádné kousky k nalezení",
    Empty_Products_Subtitle: "Zkuste změnit filtry nebo vyhledávání",
    Empty_Products_Icon: "🪵",

        // ============================================================
    // CHAT A KONTAKTY
    // ============================================================
    Enable_Chat: true,                    // Zapnout/vypnout chat tlačítko
    Show_Contact_Section: true,           // Zobrazit kontaktní sekci v About (telefon, WhatsApp, email)
    Contact_Phone: "+420730996444",        // Telefonní číslo v kontaktní sekci
    Contact_WhatsApp: "+420730996444",     // WhatsApp číslo v kontaktní sekci
    Contact_Email: "hello.plisek@gmail.com", // Email v kontaktní sekci

    // ============================================================
    // SOCIÁLNÍ PROOF (notifikace)
    // ============================================================
    Enable_Social_Proof: true,            // Zapnout/vypnout notifikace
    Social_Proof_Interval: 30000,         // Frekvence notifikací v milisekundách (30 sekund)
    
    // ============================================================
    // TEXTY PRO KOŠÍK A TLAČÍTKA
    // ============================================================
    Cart_Title: "🛒 Nákupní košíček",
    Cart_Button_Text: "Objednat vše přes WhatsApp",
    Custom_Order_Button_Text: "Poptat výrobu na míru",
    Custom_Order_Message: "Dobrý den, mám zájem o zakázkovou výrobu. Rád bych probral detaily.",
    Custom_Order_Message: "Zaujala vás ukázka mojí práce?",
    Blog_Title: "📖 Novinky a články",
    Product_Count_Text: "🪵 produktů",
    Reviews_Button_Text: "Zobrazit recenze",
    Reviews_Panel_Text: "⭐ Přes 100+<br>spokojených zákazníků",
    Offer_Button_Text: "ODESLAT NABÍDKU",
    Product_Loading_Text: "🪵 Načítání dřeva...",
    Product_Category_Text: "🪵 v kategorii ",
    

    Cart_Empty_Text: "Váš košíček je prázdný.",
    Cart_Empty_Icon: "🪵",
    Enable_Empty_Cart_Message: true,   // false = nezobrazovat nic

    Favicon_URL: "https://i.postimg.cc/vTpLtS2m/150x150.png",
    Menu_Button_Text_Products: "🛒 Obchod",
    Menu_Button_Text_Blog: "📖 Blog",
    Menu_Button_Text_About: "💡 Woodisek",
    GDPR_Banner_Text: "🍪 Používám cookies pro ukládání vašeho košíčku a zajištění lepšího zážitku z nakupování. Kliknutím na \"Přijmout\" souhlasíte s jejich používáním.",
    OG_Image_URL: "https://i.postimg.cc/d30SxX9d/woodisek-kopie.jpg",
    Meta_Description: "Ručně vyráběné dřevěné produkty Woodisek – originální dekorace, dárky a zakázková výroba z české dílny. Poctivá práce ze dřeva.",

        // ============================================================
    // NOVÉ NASTAVENÍ - REŽIM ÚDRŽBY A VIDITELNOST SEKCE
    // ============================================================
    Maintenance_Mode: false,           // false = normální provoz, true = režim údržby
    Maintenance_Title: "🔧 Probíhá údržba",  // Nadpis v režimu údržby
    Maintenance_Text: "Dřevodílna se zrovna uklízí a ladí nové kousky. Brzy tu bude veselo! 🪵✨",  // Text v režimu údržby
    Show_Blog: true,                   // Zobrazit tlačítko Blog
    Show_About: true,                  // Zobrazit tlačítko About me
    




    // ============================================================
    // DOPRAVA - výchozí možnosti
    // ============================================================
    ShippingOptions: [
        { id: "pickup_point_zasilkovna", name: "📦 Zásilkovna - výdejní místo", price: 99, type: "fixed" },
        { id: "home_delivery_zasilkovna", name: "🚚 Zásilkovna - na adresu", price: 139, type: "fixed" },
        { id: "pickup_point_balikovna", name: "📮 Balíkovna - výdejní místo", price: 85, type: "fixed" },
        { id: "home_delivery_balikovna", name: "🚛 Balíkovna - na adresu", price: 115, type: "fixed" },
    ],
    DefaultShippingId: "pickup_point_zasilkovna"
};

export async function loadSettings() {
    try {
        const url = CONFIG.SETTINGS_URL + "&t=" + Date.now();
        console.log("Načítám nastavení z:", url);
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const csvText = await response.text();
        console.log("CSV obsah:", csvText.substring(0, 200));
        
        const settings = parseSettingsCSV(csvText);
        Object.assign(CONFIG, settings);
        
        console.log("✅ Nastavení načteno z tabulky:", {
            barva: CONFIG.Primarni_Barva,
            kosik: CONFIG.Enable_Kosik,
            doprava: CONFIG.ShippingOptions?.length || 0
        });
        
    } catch (error) {
        console.warn("⚠️ Nastavení se nepodařilo načíst, používám výchozí:", error.message);
    }
    
    applySettingsToCSS();
}

function parseSettingsCSV(csvText) {
    const rows = csvText.split("\n");
    const settings = {};
    const shippingOptions = [];
    let searchPhrases = [];  // ← NOVÉ
    
    for (let i = 1; i < rows.length; i++) {
        if (!rows[i].trim()) continue;
        
        const match = rows[i].match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g);
        if (!match || match.length < 2) continue;
        
        let key = match[0].replace(/^"|"$/g, '').trim();
        let value = match[1].replace(/^"|"$/g, '').trim();
        const type = match[2] ? match[2].replace(/^"|"$/g, '').trim() : '';
        
        if (!key) continue;
        

                if (key === "Favicon_URL") {
            settings.Favicon_URL = value;
        }
        if (key === "Menu_Button_Text_Products") {
            settings.Menu_Button_Text_Products = value;
        }
        if (key === "Menu_Button_Text_Blog") {
            settings.Menu_Button_Text_Blog = value;
        }
        if (key === "Menu_Button_Text_About") {
            settings.Menu_Button_Text_About = value;
        }
        if (key === "GDPR_Banner_Text") {
            settings.GDPR_Banner_Text = value;
        }
        if (key === "OG_Image_URL") {
            settings.OG_Image_URL = value;
        }
        if (key === "Meta_Description") {
            settings.Meta_Description = value;
        }
        if (key === "Cart_Empty_Text") {
        settings.Cart_Empty_Text = value;
        }
        if (key === "Cart_Empty_Icon") {
            settings.Cart_Empty_Icon = value;
        }
        if (key === "Enable_Empty_Cart_Message") {
            settings.Enable_Empty_Cart_Message = value === "true" || value === "TRUE";
        }
        if (key === "Enable_Chat") {
            settings.Enable_Chat = value === "true" || value === "TRUE";
        }
        if (key === "Show_Contact_Section") {
            settings.Show_Contact_Section = value === "true" || value === "TRUE";
        }
        if (key === "Contact_Phone") {
            settings.Contact_Phone = value;
        }
        if (key === "Contact_WhatsApp") {
            settings.Contact_WhatsApp = value;
        }
        if (key === "Contact_Email") {
            settings.Contact_Email = value;
        }
        if (key === "Enable_Social_Proof") {
            settings.Enable_Social_Proof = value === "true" || value === "TRUE";
        }
        if (key === "Social_Proof_Interval") {
            settings.Social_Proof_Interval = parseInt(value) || 30000;
        }
        if (key === "Enable_Shop") {
    settings.Enable_Shop = value === "true" || value === "TRUE";
}
                // ============================================================
        // PARSOVÁNÍ PORTFOLIO OBRÁZKŮ
        // ============================================================
        if (key === "PortfolioImages" && value) {
            console.log('🖼️ Načítám PortfolioImages:', value);
            
            let cleanValue = value.replace(/^"|"$/g, '');
            const images = cleanValue.match(/https?:\/\/[^\s,;"']+/g) || [];
            
            settings.PortfolioImages = images;  // TADY UKLÁDÁME JAKO POLE
            console.log('🖼️ Načteno obrázků:', images.length);
        }

                // Přidej k ostatním if(key === ...) blokům:
        if (key === "Maintenance_Mode") {
            settings.Maintenance_Mode = value === "true" || value === "TRUE";
        }
        if (key === "Show_Blog") {
            settings.Show_Blog = value === "true" || value === "TRUE";
        }
        if (key === "Show_About") {
            settings.Show_About = value === "true" || value === "TRUE";
        }
        if (key === "Maintenance_Title") {
            settings.Maintenance_Title = value;
        }
        if (key === "Maintenance_Text") {
            settings.Maintenance_Text = value;
        }

        // ============================================================
        // PARSOVÁNÍ MOŽNOSTÍ DOPRAVY
        // ============================================================
        if (key === "ShippingOptions" && value) {
            console.log('📦 Načítám ShippingOptions:', value);
            
            // Odstraníme uvozovky pokud jsou
            let cleanValue = value.replace(/^"|"$/g, '');
            
            // Rozdělení podle skutečných nových řádků (\n) NEBO podle textového \n
            let lines;
            if (cleanValue.includes('\\n')) {
                // Pokud jsou nové řádky jako text \n
                lines = cleanValue.split('\\n');
                console.log('📦 Dělení podle \\n, počet:', lines.length);
            } else {
                // Pokud jsou nové řádky jako skutečné znaky
                lines = cleanValue.split(/\r?\n/);
                console.log('📦 Dělení podle skutečných nových řádků, počet:', lines.length);
            }
            
            lines.forEach(line => {
                line = line.trim();
                if (!line) return;
                
                const parts = line.split("|");
                if (parts.length >= 3) {
                    shippingOptions.push({
                        id: parts[0].trim(),
                        name: parts[1].trim(),
                        price: parseInt(parts[2]) || 0,
                        type: parts[3] ? parts[3].trim() : "fixed"
                    });
                } else {
                    console.warn('📦 Špatný formát řádku:', line);
                }
            });
            console.log('📦 Načteno možností dopravy:', shippingOptions.length);
        }
        
        // Typová konverze
        if (type === "boolean") {
            value = value === "true" || value === "TRUE";
        } else if (type === "number") {
            value = parseFloat(value);
        }
        
        settings[key] = value;
    }
    
    // Pokud se načetly možnosti dopravy, použijeme je
    if (shippingOptions.length > 0) {
        settings.ShippingOptions = shippingOptions;
    }
    
    console.log('📦 FINÁLNÍ ShippingOptions:', shippingOptions);
    
    return {
        PortfolioImages: settings.PortfolioImages || [],
        Primarni_Barva: settings.Primarni_Barva || CONFIG.Primarni_Barva,
        Sekundarni_Barva: settings.Sekundarni_Barva || CONFIG.Sekundarni_Barva,
        Textova_Barva: settings.Textova_Barva || CONFIG.Textova_Barva,
        Textova_Barva_Tmava: settings.Textova_Barva_Tmava || CONFIG.Textova_Barva_Tmava,
        Border_Radius: settings.Border_Radius || CONFIG.Border_Radius,
        Font: settings.Font || CONFIG.Font,
        Enable_Kosik: settings.Enable_Kosik !== undefined ? settings.Enable_Kosik : CONFIG.Enable_Kosik,
        Enable_Slevy: settings.Enable_Slevy !== undefined ? settings.Enable_Slevy : CONFIG.Enable_Slevy,
        WhatsApp_Sablona: settings.WhatsApp_Sablona || CONFIG.WhatsApp_Sablona,
        Nazev_Firmy: settings.Nazev_Firmy || "WOODISEK",
        Logo_URL: settings.Logo_URL || "https://i.postimg.cc/d30SxX9d/woodisek-kopie.jpg",
        About_Titulek: settings.About_Titulek || "O Woodiskovi",
        About_Text: settings.About_Text || "Každý kousek vyrábím ručně, poctivě a s radostí. ✨",
        Zakazkova_Tvorba_Titulek: settings.Zakazkova_Tvorba_Titulek || "Zakázková tvorba",
        Zakazkova_Tvorba_Text: settings.Zakazkova_Tvorba_Text || "Máte vlastní představu o výrobku na míru? Napište mi na WhatsApp.",
        WhatsApp_Cislo_Zakazka: settings.WhatsApp_Cislo_Zakazka || "+420730996444",
        Footer_Text: settings.Footer_Text || "Woodisek – ručně vyráběné dřevěné výrobky",
        ShippingOptions: settings.ShippingOptions || CONFIG.ShippingOptions,
        DefaultShippingId: settings.DefaultShippingId || CONFIG.DefaultShippingId,
        Favicon_URL: settings.Favicon_URL || CONFIG.Favicon_URL,
        Menu_Button_Text_Products: settings.Menu_Button_Text_Products || CONFIG.Menu_Button_Text_Products,
        Menu_Button_Text_Blog: settings.Menu_Button_Text_Blog || CONFIG.Menu_Button_Text_Blog,
        Menu_Button_Text_About: settings.Menu_Button_Text_About || CONFIG.Menu_Button_Text_About,
        GDPR_Banner_Text: settings.GDPR_Banner_Text || CONFIG.GDPR_Banner_Text,
        OG_Image_URL: settings.OG_Image_URL || CONFIG.OG_Image_URL,
        Meta_Description: settings.Meta_Description || CONFIG.Meta_Description,
        Cart_Title: settings.Cart_Title || CONFIG.Cart_Title,
        Cart_Button_Text: settings.Cart_Button_Text || CONFIG.Cart_Button_Text,
        Custom_Order_Button_Text: settings.Custom_Order_Button_Text || CONFIG.Custom_Order_Button_Text,
        Custom_Order_Message: settings.Custom_Order_Message || CONFIG.Custom_Order_Message,
        Blog_Title: settings.Blog_Title || CONFIG.Blog_Title,
        Product_Count_Text: settings.Product_Count_Text || CONFIG.Product_Count_Text,
        Reviews_Button_Text: settings.Reviews_Button_Text || CONFIG.Reviews_Button_Text,
        Reviews_Panel_Text: settings.Reviews_Panel_Text || CONFIG.Reviews_Panel_Text,
        Offer_Button_Text: settings.Offer_Button_Text || CONFIG.Offer_Button_Text,
        Product_Loading_Text: settings.Product_Loading_Text || "🪵 Načítání dřeva...",
        // V parseSettingsCSV přidej mezeru automaticky
        Product_Category_Text: (settings.Product_Category_Text || "🪵 v kategorii ") + " ",
        // Přidej k ostatním return hodnotám:
        Maintenance_Mode: settings.Maintenance_Mode === true || settings.Maintenance_Mode === "true" || settings.Maintenance_Mode === "TRUE" ? true : false,
        Maintenance_Title: settings.Maintenance_Title || CONFIG.Maintenance_Title,
        Maintenance_Text: settings.Maintenance_Text || CONFIG.Maintenance_Text,
        Show_Blog: settings.Show_Blog === true || settings.Show_Blog === "true" || settings.Show_Blog === "TRUE" ? true : (settings.Show_Blog === false || settings.Show_Blog === "false" || settings.Show_Blog === "FALSE" ? false : CONFIG.Show_Blog),
        Show_About: settings.Show_About === true || settings.Show_About === "true" || settings.Show_About === "TRUE" ? true : (settings.Show_About === false || settings.Show_About === "false" || settings.Show_About === "FALSE" ? false : CONFIG.Show_About),
        Cart_Empty_Text: settings.Cart_Empty_Text || CONFIG.Cart_Empty_Text,
        Cart_Empty_Icon: settings.Cart_Empty_Icon || CONFIG.Cart_Empty_Icon,
        Enable_Empty_Cart_Message: settings.Enable_Empty_Cart_Message !== undefined ? settings.Enable_Empty_Cart_Message : CONFIG.Enable_Empty_Cart_Message,
        Enable_Chat: settings.Enable_Chat !== undefined ? settings.Enable_Chat : CONFIG.Enable_Chat,
        Show_Contact_Section: settings.Show_Contact_Section !== undefined ? settings.Show_Contact_Section : CONFIG.Show_Contact_Section,
        Contact_Phone: settings.Contact_Phone || CONFIG.Contact_Phone,
        Contact_WhatsApp: settings.Contact_WhatsApp || CONFIG.Contact_WhatsApp,
        Contact_Email: settings.Contact_Email || CONFIG.Contact_Email,
        Enable_Social_Proof: settings.Enable_Social_Proof !== undefined ? settings.Enable_Social_Proof : CONFIG.Enable_Social_Proof,
        Social_Proof_Interval: settings.Social_Proof_Interval || CONFIG.Social_Proof_Interval,
        Enable_Shop: settings.Enable_Shop !== undefined ? settings.Enable_Shop : CONFIG.Enable_Shop,
    };
}

export function applySettingsToCSS() {
    const root = document.documentElement;
    root.style.setProperty('--accent', CONFIG.Primarni_Barva);
    root.style.setProperty('--card', CONFIG.Sekundarni_Barva);
    root.style.setProperty('--text', CONFIG.Textova_Barva);
    root.style.setProperty('--text-dim', CONFIG.Textova_Barva_Tmava);
    root.style.setProperty('--border-radius', CONFIG.Border_Radius);
    root.style.setProperty('--font', CONFIG.Font);
    
    if (!CONFIG.Enable_Kosik) {
        const cartBtn = document.getElementById('floating-cart-btn');
        const cartIcon = document.querySelector('.icon-btn');
        if (cartBtn) cartBtn.style.display = 'none';
        if (cartIcon) cartIcon.style.display = 'none';
    } else {
        const cartBtn = document.getElementById('floating-cart-btn');
        const cartIcon = document.querySelector('.icon-btn');
        if (cartBtn) cartBtn.style.display = 'flex';
        if (cartIcon) cartIcon.style.display = 'flex';
    }
    
    console.log("🎨 CSS aplikováno:", {
        accent: CONFIG.Primarni_Barva,
        borderRadius: CONFIG.Border_Radius,
        kosik: CONFIG.Enable_Kosik ? "viditelný" : "skrytý"
    });
}
// Na konec config.js přidej:
window.CONFIG = CONFIG;

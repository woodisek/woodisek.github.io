import { CONFIG } from './config.js';

// Cache helper funkce
const CACHE_KEY = 'woodisek_products_cache';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 dní

function saveProductsToCache(products, categoriesArray) {
    const cacheItem = {
        data: products,
        categories: categoriesArray,  // 👈 PŘIDÁNO
        timestamp: Date.now(),
        expiry: CACHE_DURATION
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheItem));
    //console.log('📦 Produkty a kategorie uloženy do cache');
}

function loadProductsFromCache() {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    try {
        const cacheItem = JSON.parse(cached);
        const isExpired = (Date.now() - cacheItem.timestamp) > cacheItem.expiry;
        
        if (isExpired) {
            localStorage.removeItem(CACHE_KEY);
            //console.log('⏰ Cache vypršela, mažu...');
            return null;
        }
        
        //console.log(`✅ Cache platná, zbývá ${Math.round((cacheItem.expiry - (Date.now() - cacheItem.timestamp)) / 1000)} sekund`);
        
        // 👈 VRÁTÍME I KATEGORIE
        return {
            products: cacheItem.data,
            categories: cacheItem.categories
        };
    } catch(e) {
        localStorage.removeItem(CACHE_KEY);
        return null;
    }
}

export let allProducts = [];
export let portfolioImages = [];
export let categories = new Set();

async function fetchDataWithRetry() {
    let attempts = 0;
    let data = null;
    
    while (attempts < CONFIG.MAX_LOAD_ATTEMPTS && !data) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.FETCH_TIMEOUT);
            
            const url = CONFIG.SHEETS_URL + "&t=" + Date.now();
            
            const res = await fetch(url, {
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            data = await res.text();
            
        } catch (error) {
            attempts++;
            if (attempts < CONFIG.MAX_LOAD_ATTEMPTS) {
                await new Promise(r => setTimeout(r, 2000));
            }
        }
    }
    
    return data;
}

function parseProductsData(csvText) {
    const rows = csvText.split("\n").slice(1);
    const products = [];
    
    rows.forEach((row, i) => {
        const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(s => s.replace(/^"|"$/g, '').trim());
        
        if (!columns[0] || !columns[6]) return;
        
        let rawStatus = columns[11];
        let status = "TRUE";
        
        if (rawStatus !== undefined && rawStatus !== null && rawStatus !== "") {
            const statusStr = rawStatus.toString().trim().toUpperCase();
            if (statusStr === "FALSE" || statusStr === "NE" || statusStr === "0" || statusStr === "NO") {
                status = "FALSE";
            } else if (statusStr === "TRUE" || statusStr === "ANO" || statusStr === "1" || statusStr === "YES") {
                status = "TRUE";
            }
        }
        
        if (status === "TRUE" && columns[8] && columns[8] !== "") {
            categories.add(columns[8].trim());
        }
        
        products.push({
            id: columns[0].replace(/\s+/g, '-'),
            name: columns[1],
            price: columns[2],
            sale: columns[3],
            stock: columns[4],
            imgs: (columns[5] || "").match(/https?:\/\/[^\s,;"']+/g) || ['https://via.placeholder.com/400?text=No+Image'],
            desc: (columns[6] || "").replace(/\\n/g, '<br>'),
            ship: (columns[7] || "").replace(/\\n/g, '<br>'),
            cat: columns[8] || "Ostatní",
            tag: columns[9] ? columns[9].trim() : "",
            priority: parseInt(columns[10]) || 999,
            cur: 0,
            idx: i,
            status: status
        });
    });
    
    return products;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export async function initProducts() {
    // 1. Zkus načíst z cache
    const cached = loadProductsFromCache();
    if (cached) {
        allProducts = cached.products;
        // 👈 OBNOVÍME KATEGORIE
        categories.clear();
        cached.categories.forEach(cat => categories.add(cat));
        
        return {
            products: allProducts,
            portfolioImages,
            categories: Array.from(categories)
        };
    }
    
    // 2. Cache není → načti z Google Sheets
    //console.log('🔄 Načítám data z Google Sheets...');
    const csvData = await fetchDataWithRetry();
    
    if (!csvData) {
        throw new Error("Nepodařilo se načíst data z Google Sheets");
    }
    
    // Vyčistíme kategorie před načtením
    categories.clear();
    const products = parseProductsData(csvData);
    
    if (products.length === 0) {
        throw new Error("Žádná data k zobrazení");
    }
    
    allProducts = shuffleArray(products);
    
    // 3. Ulož do cache (produkty i kategorie)
    saveProductsToCache(allProducts, Array.from(categories));
    
    return {
        products: allProducts,
        portfolioImages,
        categories: Array.from(categories)
    };
}
/**
 * WOODISEK E-SHOP
 * Copyright (c) 2025 Michal Plíšek (Woodisek)
 * License: Proprietary - All rights reserved
 * Unauthorized copying, modification, or distribution is prohibited.
 * Contact: hello.plisek@gmail.com
 */

// ============================================================
// api.js - Načítání a zpracování dat z Google Sheets (NO CACHE)
// ============================================================

import { CONFIG } from './config.js';

// Stav
export let allProducts = [];
export let portfolioImages = [];
export let categories = new Set();

/**
 * Stáhne CSV data z Google Sheets s opakováním při chybě
 * a s vynuceným zákazem cache
 */
async function fetchDataWithRetry() {
    let attempts = 0;
    let data = null;
    
    while (attempts < CONFIG.MAX_LOAD_ATTEMPTS && !data) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.FETCH_TIMEOUT);
            
            // ============================================
            // PŘÍMÝ FETCH BEZ PROXY (CORS Unblock to povolí)
            // ============================================
            const url = CONFIG.SHEETS_URL + "&t=" + Date.now();
            
            console.log(`Pokus ${attempts + 1}: Načítám data...`);
            
            const res = await fetch(url, {
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            data = await res.text();
            
            console.log(`✅ Data načtena, délka: ${data.length} znaků`);
            
        } catch (error) {
            console.warn(`Pokus ${attempts + 1} selhal:`, error.message);
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
        
        // ============================================================
        // SPRÁVNÉ ZPRACOVÁNÍ STATUSU (sloupec N = index 13)
        // ============================================================
        let rawStatus = columns[11];
        let status = "TRUE"; // výchozí = viditelný
        
        if (rawStatus !== undefined && rawStatus !== null && rawStatus !== "") {
            const statusStr = rawStatus.toString().trim().toUpperCase();
            if (statusStr === "FALSE" || statusStr === "NE" || statusStr === "0" || statusStr === "NO") {
                status = "FALSE";
            } else if (statusStr === "TRUE" || statusStr === "ANO" || statusStr === "1" || statusStr === "YES") {
                status = "TRUE";
            }
        }
        
        // Portfolio obrázky se nyní plní z CONFIG v main.js
        // Tento kód je zakomentován, protože portfolioImages se plní až po loadSettings
        
// SPRÁVNĚ:
// Správný kód
if (status === "TRUE" && columns[8] && columns[8] !== "") {
    categories.add(columns[8].trim());
}
        
        products.push({
            id: columns[0].replace(/\s+/g, '-'),           // A: ID
            name: columns[1],                               // B: Název
            price: columns[2],                              // C: Cena
            sale: columns[3],                               // D: Akční cena
            stock: columns[4],                              // E: Počet skladem
            imgs: (columns[5] || "").match(/https?:\/\/[^\s,;"']+/g) || ['https://via.placeholder.com/400?text=No+Image'], // F: Obrázky
            desc: (columns[6] || "").replace(/\\n/g, '<br>'), // G: Popis
            ship: (columns[7] || "Ne").replace(/\\n/g, '<br>'), // H: Dodatečné info
            cat: columns[8] || "Ostatní",                   // I: Kategorie
            tag: columns[9] ? columns[9].trim() : "",       // J: Štítek
            priority: parseInt(columns[10]) || 999,        // K: Priorita
            // Status se zpracovává zvlášť (columns[11])
            cur: 0,
            idx: i,
            status: status
        });
    });
    
    return products;
}

/**
 * Náhodné zamíchání pole (Fisher-Yates)
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Hlavní inicializační funkce – načte a zpracuje data
 */
export async function initProducts() {
    const csvData = await fetchDataWithRetry();
    
    if (!csvData) {
        throw new Error("Nepodařilo se načíst data z Google Sheets");
    }
    
    const products = parseProductsData(csvData);
    
    if (products.length === 0) {
        throw new Error("Žádná data k zobrazení");
    }
    
    // Náhodné promíchání
    allProducts = shuffleArray(products);
    
    return {
        products: allProducts,
        portfolioImages,
        categories: Array.from(categories)
    };
}

// apps/find-replace.js
import { copyToClipboard } from '../clipboard.js';
import { showNotification } from '../notify.js';
import { getStorage } from '../storage.js';

const storage = getStorage('find-replace');

// ============ DEFINICE AKCÍ ============
const actions = [
    // 🧹 ČIŠTĚNÍ
    { name: "Odstranit mezery na konci", category: "clean", icon: "✂️", execute: (text) => text.replace(/[ \t]+$/gm, "") },
    { name: "Oříznout mezery (začátek+konec)", category: "clean", icon: "✂️", execute: (text) => text.split('\n').map(line => line.trim()).join('\n') },
    { name: "Odstranit prázdné řádky", category: "clean", icon: "📄", execute: (text) => text.replace(/^\s*$\n?/gm, "") },
    { name: "Odstranit HTML tagy", category: "clean", icon: "🔤", execute: (text) => text.replace(/<[^>]*>/g, "") },
    { name: "Odstranit čísla", category: "clean", icon: "🔢", execute: (text) => text.replace(/\d+/g, "") },
    { name: "Odstranit diakritiku", category: "clean", icon: "🔠", execute: (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '') },
    { name: "Odstranit duplicitní řádky", category: "clean", icon: "🗑️", execute: (text) => [...new Map(text.split('\n').map(line => [line, line])).values()].join('\n') },
    { name: "Odstranit písmena (A-Z, a-z)", category: "clean", icon: "🔤", execute: (text) => text.replace(/[A-Za-záčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/g, '') },
    { name: "Odstranit číslice (0-9)", category: "clean", icon: "🔢", execute: (text) => text.replace(/[0-9]/g, '') },
    { name: "Odstranit všechny mezery", category: "clean", icon: "␣", execute: (text) => text.replace(/\s/g, '') },
    { name: "Odstranit interpunkci (.,!?;:)", category: "clean", icon: "📝", execute: (text) => text.replace(/[.,!?;:()\[\]{}"']/g, '') },
    { name: "Odstranit speciální znaky (@#$%)", category: "clean", icon: "⚙️", execute: (text) => text.replace(/[^A-Za-záčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ0-9\s\n]/g, '') },
    { name: "Odstranit emoji", category: "clean", icon: "😊", execute: (text) => text.replace(/\p{Emoji}/gu, '') },
    { name: "Odstranit emailové adresy", category: "clean", icon: "📧", execute: (text) => text.replace(/[\w.-]+@[\w.-]+\.\w{2,}/g, '') },
    { name: "Odstranit URL adresy", category: "clean", icon: "🔗", execute: (text) => text.replace(/https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=]+/g, '') },
    { name: "Odstranit vše kromě písmen a číslic", category: "clean", icon: "🎯", execute: (text) => text.replace(/[^A-Za-záčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ0-9\n]/g, '') },
    { name: "Odstranit vše kromě číslic", category: "clean", icon: "🔢", execute: (text) => text.replace(/[^0-9\n]/g, '') },
    { name: "Odstranit vše kromě písmen", category: "clean", icon: "🔤", execute: (text) => text.replace(/[^A-Za-záčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ\n]/g, '') },

    // 🔄 FORMÁTOVÁNÍ
    { name: "VELKÁ PÍSMENA", category: "format", icon: "🔠", execute: (text) => text.toUpperCase() },
    { name: "malá písmena", category: "format", icon: "🔡", execute: (text) => text.toLowerCase() },
    { name: "První písmeno velké", category: "format", icon: "📝", execute: (text) => text.replace(/\b\w/g, c => c.toUpperCase()) },
    { name: "Obrátit text", category: "format", icon: "🔄", execute: (text) => text.split('').reverse().join('') },
    { name: "Obrátit řádky", category: "format", icon: "🔀", execute: (text) => text.split('\n').reverse().join('\n') },
    { name: "Každé slovo velkým písmenem", category: "format", icon: "📖", execute: (text) => text.replace(/\b\w/g, c => c.toUpperCase()) },
    { name: "Střídavá velikost (SpongeBob)", category: "format", icon: "🧽", execute: (text) => text.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join('') },
    { name: "Převést na slug (URL)", category: "format", icon: "🔗", execute: (text) => text
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '-') },
    { name: "Převést na camelCase", category: "format", icon: "🐫", execute: (text) => {
        const cleaned = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
        return cleaned.replace(/\s+(.)/g, (_, c) => c.toUpperCase()).replace(/^\w/, c => c.toLowerCase());
    } },
    { name: "Převést na snake_case", category: "format", icon: "🐍", execute: (text) => text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '_') },
    { name: "Převést na kebab-case", category: "format", icon: "🍢", execute: (text) => text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '-') },
    { name: "Invertovat velikost písmen", category: "format", icon: "🔄", execute: (text) => text.split('').map(c => 
        c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase()
    ).join('') },
    { name: "Seřadit řádky (A-Z)", category: "format", icon: "📋", execute: (text) => text.split('\n').sort((a, b) => a.localeCompare(b)).join('\n') },
    { name: "Seřadit řádky (Z-A)", category: "format", icon: "📋", execute: (text) => text.split('\n').sort((a, b) => b.localeCompare(a)).join('\n') },
    { name: "Seřadit řádky podle délky (nejkratší→nejdelší)", category: "format", icon: "📏", execute: (text) => text.split('\n').sort((a, b) => a.length - b.length).join('\n') },
    { name: "Seřadit řádky podle délky (nejdelší→nejkratší)", category: "format", icon: "📏", execute: (text) => text.split('\n').sort((a, b) => b.length - a.length).join('\n') },
    { name: "Přidat číslování řádků", category: "format", icon: "🔢", execute: (text) => text.split('\n').map((line, i) => `${i+1}. ${line}`).join('\n') },
    { name: "Odstranit číslování řádků", category: "format", icon: "🔢", execute: (text) => text.split('\n').map(line => line.replace(/^\d+\.\s*/, '')).join('\n') },
    { name: "Kompaktní kód (Smazat mezery)", category: "format", icon: "🗜️", description: "Odstraní prázdné řádky a ořeže bílé znaky na krajích.", execute: (text) => text.split('\n').map(l => l.trim()).filter(l => l !== '').join('\n') },

    // 📊 SHEET FORMÁTOVÁNÍ
    { name: "Text → Sloupec (podle tabulátoru)", category: "sheet", icon: "📊", execute: (text) => text.split('\n').map(row => row.split('\t').join(' | ')).join('\n') },
    { name: "Text → Řádek (spojit)", category: "sheet", icon: "➡️", execute: (text) => text.replace(/\n/g, ' | ') },
    { name: "Transpozice (řádky ↔ sloupce)", category: "sheet", icon: "🔄", execute: (text) => {
        const rows = text.split('\n').map(row => {
            if (row.includes('\t')) return row.split('\t');
            if (row.includes(' | ')) return row.split(' | ');
            if (row.includes(',')) return row.split(',');
            return [row];
        });
        const maxCols = Math.max(...rows.map(r => r.length));
        const transposed = Array(maxCols).fill().map(() => []);
        for (let i = 0; i < rows.length; i++) {
            for (let j = 0; j < rows[i].length; j++) {
                transposed[j][i] = rows[i][j];
            }
        }
        return transposed.map(row => row.join('\t')).join('\n');
    } },
    { name: "Odstranit prázdné buňky", category: "sheet", icon: "🗑️", execute: (text) => text.split('\n').map(row => row.split('\t').filter(cell => cell.trim() !== '').join('\t')).join('\n') },
    { name: "Tabulátor → Mezera", category: "sheet", icon: "␉", execute: (text) => text.replace(/\t/g, '  ') },
    { name: "Mezera → Tabulátor", category: "sheet", icon: "␉", execute: (text) => text.replace(/  +/g, '\t') },
    { name: "CSV → Tabulátor (čárka na tabulátor)", category: "sheet", icon: "📊", execute: (text) => text.split('\n').map(row => row.split(',').join('\t')).join('\n') },
    { name: "Tabulátor → CSV (tabulátor na čárku)", category: "sheet", icon: "📊", execute: (text) => text.split('\n').map(row => row.split('\t').join(',')).join('\n') },
    { name: "Spojit sloupce do jednoho", category: "sheet", icon: "🔗", execute: (text) => text.split('\n').map(row => {
        const cells = row.includes('\t') ? row.split('\t') : [row];
        return cells.join(' ');
    }).join('\n') },

    // 🔧 NAHRAZOVÁNÍ
    { name: "Nahradit mezeru podtržítkem", category: "replace", icon: "🔤", params: { find: " ", replace: "_" } },
    { name: "Nahradit více mezer jednou", category: "replace", icon: "🔢", params: { find: "\\s+", replace: " ", isRegex: true } },
    { name: "Nahradit čárku za středník", category: "replace", icon: "🔤", params: { find: ",", replace: ";" } },
    { name: "Nahradit tečku za čárku", category: "replace", icon: "🔤", params: { find: "\\.", replace: ",", isRegex: true } },
    { name: "Nahradit uvozovky \" za '", category: "replace", icon: "🔤", params: { find: '"', replace: "'" } },
    { name: "Nahradit apostrof za nic", category: "replace", icon: "🔤", params: { find: "'", replace: "" } },
    { name: "Nahradit nový řádek za mezeru", category: "replace", icon: "⏎", params: { find: "\\n", replace: " ", isRegex: true } },
    { name: "Nahradit tabulátor za 4 mezery", category: "replace", icon: "␉", params: { find: "\\t", replace: "    ", isRegex: true } },
    { name: "Nahradit 4 mezery za tabulátor", category: "replace", icon: "␉", params: { find: "    ", replace: "\t" } },

// 🆕 NOVÁ KATEGORIE: VÝVOJÁŘSKÉ NÁSTROJE (DEVTools)

{ name: "JSON: Formátovat (Pretty Print)", category: "devtools", icon: "📋", execute: (text) => {
    try {
        return JSON.stringify(JSON.parse(text), null, 2);
    } catch (e) {
        return text;
    }
} },

{ name: "JSON: Minifikovat", category: "devtools", icon: "🗜️", execute: (text) => {
    try {
        return JSON.stringify(JSON.parse(text));
    } catch (e) {
        return text;
    }
} },

{ name: "Base64: Encode", category: "devtools", icon: "🔐", execute: (text) => {
    try {
        return btoa(unescape(encodeURIComponent(text)));
    } catch (e) {
        return text;
    }
} },

{ name: "Base64: Decode", category: "devtools", icon: "🔓", execute: (text) => {
    try {
        return decodeURIComponent(escape(atob(text)));
    } catch (e) {
        return text;
    }
} },

{ name: "URL: Encode", category: "devtools", icon: "🔗", execute: (text) => encodeURIComponent(text) },

{ name: "URL: Decode", category: "devtools", icon: "🔗", execute: (text) => decodeURIComponent(text) },

{ name: "JavaScript: Minifikovat", category: "devtools", icon: "⚡", execute: (text) => {
    // Jednoduchá minifikace - odstraní komentáře, zbytečné mezery a nové řádky
    return text
        .replace(/\/\/.*$/gm, '')  // odstraní // komentáře
        .replace(/\/\*[\s\S]*?\*\//g, '')  // odstraní /* */ komentáře
        .replace(/\s+/g, ' ')  // vícenásobné mezery na jednu
        .replace(/;\s*}/g, '}')  // ; před }
        .replace(/{\s+/g, '{')  // mezery za {
        .replace(/\s+}/g, '}')  // mezery před }
        .replace(/\(\s+/g, '(')  // mezery za (
        .replace(/\s+\)/g, ')')  // mezery před )
        .trim();
} },

{ name: "CSS: Minifikovat", category: "devtools", icon: "🎨", execute: (text) => {
    return text
        .replace(/\/\*[\s\S]*?\*\//g, '')  // odstraní komentáře
        .replace(/\s+/g, ' ')  // vícenásobné mezery na jednu
        .replace(/;\s+}/g, '}')  // ; před }
        .replace(/{\s+/g, '{')  // mezery za {
        .replace(/\s+}/g, '}')  // mezery před }
        .replace(/:\s+/g, ':')  // mezery za :
        .replace(/,\s+/g, ',')  // mezery za ,
        .trim();
} },

{ name: "HTML: Minifikovat", category: "devtools", icon: "🌐", execute: (text) => {
    return text
        .replace(/<!--[\s\S]*?-->/g, '')  // odstraní HTML komentáře
        .replace(/\s+/g, ' ')  // vícenásobné mezery na jednu
        .replace(/>\s+</g, '><')  // mezery mezi tagy
        .trim();
} },

{ name: "Odstranit Markdown formátování", category: "devtools", icon: "📝", execute: (text) => {
    return text
        .replace(/^#{1,6}\s+/gm, '')  // nadpisy
        .replace(/\*\*(.+?)\*\*/g, '$1')  // **tučné**
        .replace(/\*(.+?)\*/g, '$1')  // *kurzíva*
        .replace(/\[(.+?)\]\(.+?\)/g, '$1')  // [odkaz](url)
        .replace(/!\[.+?\]\(.+?\)/g, '')  // obrázky
        .replace(/`(.+?)`/g, '$1')  // kód
        .replace(/^>\s+/gm, '')  // citace
        .replace(/^-{3,}/gm, '')  // horizontální linka
        .replace(/\n{3,}/g, '\n\n');  // vícenásobné nové řádky
} },

// 🆕 LOKÁLNÍ (ČESKÉ)
{ name: "Extrahovat IČO", category: "extract", icon: "🏢", extract: (text) => [...new Set(text.match(/\b\d{8}\b/g) || [])].join('\n') },

{ name: "Extrahovat rodná čísla", category: "extract", icon: "🆔", extract: (text) => [...new Set(text.match(/\b\d{6}\/\d{3,4}\b/g) || [])].join('\n') },

// 🆕 FORMÁTOVÁNÍ
{ name: "Odstranit zdvojené mezery (nechat jednu)", category: "clean", icon: "␣", execute: (text) => text.replace(/[ \t]{2,}/g, ' ') },

{ name: "Frekvence slov (Top 10)", category: "analyze", icon: "📊", analyze: (text) => {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const freq = {};
    words.forEach(w => freq[w] = (freq[w] || 0) + 1);
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10);
    return `📊 Top 10 slov:\n${sorted.map(([w, c]) => `  ${w}: ${c}x`).join('\n')}`;
} },

{ name: "Vygenerovat Lorem Ipsum (odstavec)", category: "format", icon: "📄", execute: (text) => {
    // Pokud je text prázdný, vygeneruje Lorem Ipsum
    if (!text.trim()) {
        return "Lorem ipsum odor amet, consectetuer adipiscing elit. Himenaeos turpis vestibulum leo torquent, integer ultricies erat. Per accumsan sagittis eleifend potenti auctor donec id duis. Nisi malesuada faucibus ultricies egestas class mollis porta vitae. Platea mus senectus dui class varius. Cubilia et cursus adipiscing dui mauris habitant nulla. Praesent mollis tortor adipiscing libero scelerisque; volutpat ipsum. Ligula habitant laoreet quisque dictumst metus in lectus. Venenatis ad nostra class lacinia malesuada magna tempor. Lectus bibendum porttitor fusce risus nisi donec sociosqu.";
    }
    return text;
} },

    // 📎 EXTRACTION
    { name: "Extrahovat emaily", category: "extract", icon: "📧", extract: (text) => [...new Set(text.match(/[\w.-]+@[\w.-]+\.\w{2,}/g) || [])].join('\n') },
    { name: "Extrahovat URL", category: "extract", icon: "🔗", extract: (text) => [...new Set(text.match(/https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=]+/g) || [])].join('\n') },
    { name: "Extrahovat telefonní čísla", category: "extract", icon: "📞", extract: (text) => [...new Set(text.match(/\+?[0-9]{9,13}/g) || [])].join('\n') },
    { name: "Extrahovat IP adresy", category: "extract", icon: "🌐", extract: (text) => [...new Set(text.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g) || [])].join('\n') },
    { name: "Extrahovat hashtagy (#)", category: "extract", icon: "#️⃣", extract: (text) => [...new Set(text.match(/#[\w]+/g) || [])].join('\n') },
    { name: "Extrahovat mentiony (@)", category: "extract", icon: "@", extract: (text) => [...new Set(text.match(/@[\w]+/g) || [])].join('\n') },
    { name: "Extrahovat datumy (DD.MM.YYYY)", category: "extract", icon: "📅", extract: (text) => [...new Set(text.match(/\b\d{1,2}\.\d{1,2}\.\d{4}\b/g) || [])].join('\n') },
    { name: "Extrahovat čísla (všechna)", category: "extract", icon: "🔢", extract: (text) => [...new Set(text.match(/\b\d+\b/g) || [])].join('\n') },
    { name: "Extrahovat hexadecimální kódy", category: "extract", icon: "🎨", extract: (text) => [...new Set(text.match(/#[0-9A-Fa-f]{6}\b/g) || [])].join('\n') },
    { name: "Extrahovat jedinečná slova", category: "extract", icon: "🔤", extract: (text) => [...new Set(text.toLowerCase().match(/\b\w+\b/g) || [])].sort().join('\n') },

    // 📊 ANALÝZA
    { name: "Počet slov", category: "analyze", icon: "📊", analyze: (text) => `📊 Počet slov: ${(text.match(/\b\w+\b/g) || []).length}` },
    { name: "Počet znaků", category: "analyze", icon: "🔢", analyze: (text) => `🔢 Počet znaků: ${text.length}` },
    { name: "Počet řádků", category: "analyze", icon: "📄", analyze: (text) => `📄 Počet řádků: ${text.split('\n').length}` },
    { name: "Počet odstavců", category: "analyze", icon: "📝", analyze: (text) => `📝 Počet odstavců: ${text.split('\n\n').length}` },
    { name: "Počet vět", category: "analyze", icon: "💬", analyze: (text) => `💬 Počet vět: ${(text.match(/[.!?]+/g) || []).length}` },
    { name: "Počet slov (bez diakritiky)", category: "analyze", icon: "🔤", analyze: (text) => {
        const withoutDiacritics = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return `🔤 Počet slov bez diakritiky: ${(withoutDiacritics.match(/\b\w+\b/g) || []).length}`;
    } },

    // 🗑️ ODSTRANĚNÍ KOMENTÁŘŮ
    { 
        name: "JS/C/PHP: Bezpečné čištění", 
        category: "comments", 
        icon: "🛡️", 
        description: "Odstraní // a /* */. Chrání URL adresy, řetězce a regulární výrazy.",
        execute: (text) => {
            let res = ''; let i = 0; 
            let s = { q: null, b: false, l: false, r: false };
            while (i < text.length) {
                const c = text[i], n = text[i+1], p = text[i-1];
                if (s.b) { if (c === '*' && n === '/') { s.b = false; i++; } i++; continue; }
                if (s.l) { if (c === '\n') s.l = false; else { i++; continue; } }
                if (s.q) { res += c; if (c === s.q && p !== '\\') s.q = null; i++; continue; }
                if (s.r) { res += c; if (c === '/' && p !== '\\') s.r = false; i++; continue; }
                if (c === '/' && n === '*') { s.b = true; i++; }
                else if (c === '/' && n === '/') { s.l = true; i++; }
                else if (c === '/' && (p === '=' || p === '(' || p === '[' || p === ':' || p === ' ' || p === '\n')) { s.r = true; res += c; }
                else if (c === "'" || c === '"' || c === '`') { s.q = c; res += c; }
                else res += c;
                i++;
            }
            return res;
        } 
    },
    { 
        name: "Python: Bezpečné čištění", 
        category: "comments", 
        icon: "🐍", 
        description: "Odstraní # i blokové docstringy ('''/\"\"\"). Chrání URL v kódu.",
        execute: (text) => {
            let res = '', i = 0, q = null, b = null;
            while (i < text.length) {
                const c = text[i], n3 = text.slice(i, i+3);
                if (b) { if (n3 === b) { i += 2; b = null; } i++; continue; }
                if (q) { res += c; if (c === q && text[i-1] !== '\\') q = null; i++; continue; }
                if (n3 === "'''" || n3 === '"""') { b = n3; i += 2; }
                else if (c === '"' || c === "'") { q = c; res += c; }
                else if (c === '#') { while (i < text.length && text[i] !== '\n') i++; if (i < text.length) res += '\n'; }
                else res += c;
                i++;
            }
            return res;
        } 
    },
    { 
        name: "Ruby/Perl: Bezpečné čištění", 
        category: "comments", 
        icon: "💎", 
        description: "Odstraní # komentáře, ale ignoruje je uvnitř řetězců (URL).",
        execute: (text) => {
            let res = '', i = 0, q = null;
            while (i < text.length) {
                const c = text[i];
                if (q) { res += c; if (c === q && text[i-1] !== '\\') q = null; i++; continue; }
                if (c === '"' || c === "'") { q = c; res += c; }
                else if (c === '#') { while (i < text.length && text[i] !== '\n') i++; if (i < text.length) res += '\n'; }
                else res += c;
                i++;
            }
            return res;
        } 
    },
    { 
        name: "SQL/Lua: Bezpečné čištění", 
        category: "comments", 
        icon: "🗄️", 
        description: "Odstraní -- komentáře. Chrání řetězce v uvozovkách.",
        execute: (text) => {
            let res = '', i = 0, q = null;
            while (i < text.length) {
                const c = text[i], n = text[i+1];
                if (q) { res += c; if (c === q && text[i-1] !== '\\') q = null; i++; continue; }
                if (c === "'" || c === '"') { q = c; res += c; }
                else if (c === '-' && n === '-') { while (i < text.length && text[i] !== '\n') i++; if (i < text.length) res += '\n'; }
                else res += c;
                i++;
            }
            return res;
        } 
    },
    { 
        name: "HTML: Odstranit <!-- -->", 
        category: "comments", 
        icon: "🌐", 
        description: "Odstraní HTML komentáře <!-- ... -->.",
        execute: (text) => text.replace(/<!--[\s\S]*?-->/g, '') 
    },
    { 
    name: "CSS: Odstranit /* */ (bezpečné)", 
    category: "comments", 
    icon: "🎨", 
    description: "Odstraní CSS komentáře. Chrání řetězce v uvozovkách.",
    execute: (text) => {
        let result = '';
        let quoteChar = null;
        let i = 0;
        
        while (i < text.length) {
            const c = text[i];
            const n = text[i+1];
            
            // Začátek řetězce
            if (!quoteChar && (c === '"' || c === "'")) {
                quoteChar = c;
                result += c;
                i++;
                continue;
            }
            
            // Konec řetězce
            if (quoteChar && c === quoteChar && text[i-1] !== '\\') {
                quoteChar = null;
                result += c;
                i++;
                continue;
            }
            
            // CSS komentář
            if (!quoteChar && c === '/' && n === '*') {
                i += 2;
                while (i < text.length - 1 && !(text[i] === '*' && text[i+1] === '/')) {
                    i++;
                }
                i += 2;
                continue;
            }
            
            result += c;
            i++;
        }
        return result;
    }
},
    { 
        name: "Smazat TODO / FIXME", 
        category: "comments", 
        icon: "🧹", 
        description: "Odstraní řádky obsahující TODO, FIXME, DEBUG.",
        execute: (text) => text.replace(/^.*(TODO|FIXME|DEBUG).*$/gm, '').replace(/^\s*[\r\n]/gm, '') 
    }
];

const categories = [
    { id: "clean", name: "🧹 Čištění textu" },
    { id: "format", name: "🔄 Formátování" },
    { id: "sheet", name: "📊 Sheet Formatter" },
    { id: "replace", name: "🏷️ Nahrazování" },
    { id: "extract", name: "📎 Extrakce" },
    { id: "analyze", name: "📊 Analýza" },
    { id: "comments", name: "🗑️ Odstranění komentářů" },
    { id: "devtools", name: "🛠️ Vývojářské nástroje" }  // NOVÉ
];
    


export default function render(container) {
    container.innerHTML = `
        <div class="find-replace">
            <div class="fr-header">
                <span class="fr-icon">🔍</span>
                <div>
                    <h3>Find & Replace</h3>
                    <p>Rychlé hledání a nahrazování v textu</p>
                </div>
            </div>

            <!-- VSTUP -->
            <div class="fr-section">
                <label class="fr-label">📝 Vstupní text</label>
                <textarea id="fr-input" class="fr-textarea" rows="4" placeholder="..."></textarea>
            </div>

            <!-- VLASTNÍ HLEDÁNÍ/NAHRAZOVÁNÍ -->
            <div class="fr-section">
                <div class="fr-row">
                    <div class="fr-input-group" style="flex: 2;">
                        <label class="fr-label-small">🔍 Hledat</label>
                        <input type="text" id="fr-find" class="fr-input" placeholder="...">
                    </div>
                    <div class="fr-input-group" style="flex: 2;">
                        <label class="fr-label-small">✏️ Nahradit za</label>
                        <input type="text" id="fr-replace" class="fr-input" placeholder="...">
                    </div>
                </div>
            </div>

            <!-- MOŽNOSTI -->
            <div class="fr-section">
                <div class="fr-options">
                    <label class="fr-checkbox">
                        <input type="checkbox" id="fr-case-sensitive">
                        <span>🔠 Rozlišovat velikost</span>
                    </label>
                    <label class="fr-checkbox">
                        <input type="checkbox" id="fr-whole-word">
                        <span>📝 Celá slova</span>
                    </label>
                    <label class="fr-checkbox">
                        <input type="checkbox" id="fr-use-regex">
                        <span>⚡ Regulární výraz</span>
                    </label>
                </div>
            </div>

            <!-- TLAČÍTKA -->
            <div class="fr-buttons">
                <button id="fr-replace-all" class="fr-btn fr-btn-primary">🔄 Nahradit vše</button>
                <button id="fr-replace-one" class="fr-btn fr-btn-secondary">➡️ Nahradit první</button>
                <button id="fr-clear" class="fr-btn fr-btn-secondary">🔄️ Reset</button>
                <button id="fr-copy" class="fr-btn fr-btn-secondary">📋 Kopírovat výsledek</button>
            </div>

<!-- STATISTIKY - zjednodušené -->
<div class="fr-stats">
    <div class="fr-stat-card">
        <div class="fr-stat-value" id="fr-occurrences">0</div>
        <div class="fr-stat-label">nalezeno</div>
    </div>
    <div class="fr-stat-card">
        <div class="fr-stat-value" id="fr-rows-cols">0 | 0</div>
        <div class="fr-stat-label">řádků | sloupců</div>
    </div>
</div>

            <!-- ŽIVÝ NÁHLED (hlavní výstup) -->
            <div class="fr-section">
                <div id="fr-live-preview" class="fr-live-preview"></div>
            </div>

            <!-- RYCHLÉ AKCE -->
            <div class="fr-section">
                <label class="fr-label"></label>
                <div class="fr-actions-grid" id="fr-actions-grid"></div>
            </div>

            
        </div>
    `;

    // DOM elementy
    const inputEl = document.getElementById('fr-input');
    const findInput = document.getElementById('fr-find');
    const replaceInput = document.getElementById('fr-replace');
    const caseSensitiveCheck = document.getElementById('fr-case-sensitive');
    const wholeWordCheck = document.getElementById('fr-whole-word');
    const useRegexCheck = document.getElementById('fr-use-regex');
    const replaceAllBtn = document.getElementById('fr-replace-all');
    const replaceOneBtn = document.getElementById('fr-replace-one');
    const clearBtn = document.getElementById('fr-clear');
    const copyBtn = document.getElementById('fr-copy');
    const livePreviewDiv = document.getElementById('fr-live-preview');
    
    const occurrencesSpan = document.getElementById('fr-occurrences');
    const rowsColsSpan = document.getElementById('fr-rows-cols');
    const actionsGrid = document.getElementById('fr-actions-grid');

    let currentReplacedText = '';

    // ============ AKTUALIZACE STATISTIK ============
    // ============ AKTUALIZACE STATISTIK ŘÁDKŮ/SLOUPCŮ ============
function updateRowsColsStats(text) {
    if (!text || text.trim() === '') {
        rowsColsSpan.textContent = '0 | 0';
        rowsColsSpan.title = '';
        return;
    }
    
    const lines = text.split('\n').filter(l => l.trim() !== '' || l === '');
    const rows = lines.length;
    
    let maxCols = 0;
    let totalCells = 0;
    let detectedSeparator = 'none';
    
    for (const line of lines) {
        if (line === '') continue;
        
        let cells = [];
        
        // Automatická detekce oddělovače
        if (line.includes('\t')) {
            cells = line.split('\t');
            detectedSeparator = 'tabulátor';
        } else if (line.includes(' | ')) {
            cells = line.split(' | ');
            detectedSeparator = ' | ';
        } else if (line.includes(',')) {
            cells = line.split(',');
            detectedSeparator = 'čárka';
        } else {
            cells = [line];
        }
        
        // Odstranění prázdných buněk
        cells = cells.filter(c => c.trim() !== '');
        
        if (cells.length > 0) {
            maxCols = Math.max(maxCols, cells.length);
            totalCells += cells.length;
        }
    }
    
    // Zobrazení
    if (maxCols === 0) {
        rowsColsSpan.textContent = `${rows} | 1`;
        rowsColsSpan.title = `Detekováno: žádný oddělovač, každý řádek = 1 buňka`;
    } else {
        rowsColsSpan.textContent = `${rows} | ${maxCols}`;
        rowsColsSpan.title = `Detekováno: ${detectedSeparator || 'automaticky'}\nCelkem buněk: ${totalCells}\nPrůměr sloupců: ${Math.round(totalCells / rows)}`;
    }
}

    // ============ VYTVOŘENÍ REGEXU ============
    function createRegex(find, forReplace = false) {
        if (!find) return null;
        
        let flags = 'g';
        if (!caseSensitiveCheck.checked) flags += 'i';
        
        let pattern = find;
        if (!useRegexCheck.checked) {
            pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
        
        if (wholeWordCheck.checked && !forReplace) {
            pattern = '\\b' + pattern + '\\b';
        }
        
        try {
            return new RegExp(pattern, flags);
        } catch (e) {
            return null;
        }
    }

    // ============ ESCAPE HTML ============
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        }).replace(/\n/g, '<br>');
    }

    // ============ ŽIVÝ NÁHLED ============
    function updateLivePreview() {
        const text = inputEl.value;
        const find = findInput.value;
        const replace = replaceInput.value;
        
        if (!text) {
            livePreviewDiv.innerHTML = '<div class="fr-preview-placeholder">📝 Vlož text do vstupního pole</div>';
            currentReplacedText = '';
            return;
        }
        
        if (!find) {
            livePreviewDiv.innerHTML = `<div class="fr-preview-content">${escapeHtml(text)}</div>`;
            currentReplacedText = text;
            return;
        }
        
        const regex = createRegex(find, false);
        if (!regex) {
            livePreviewDiv.innerHTML = '<div class="fr-preview-placeholder">❌ Neplatný regulární výraz</div>';
            return;
        }
        
        const matches = text.match(regex) || [];
        
        // Zvýraznění vstupního textu (zeleně)
        let highlightedText = text;
        if (matches.length > 0) {
            highlightedText = text.replace(regex, (match) => {
                return `<mark class="fr-highlight-match">${escapeHtml(match)}</mark>`;
            });
        }
        
        // Výpočet textu po nahrazení
        let replacedText = text;
        if (replace) {
            const replaceRegex = createRegex(find, true);
            if (replaceRegex) {
                replacedText = text.replace(replaceRegex, replace);
            }
        }
        currentReplacedText = replacedText;
        
        // Zobrazení obou pohledů
        livePreviewDiv.innerHTML = `
            <div class="fr-preview-split">
                <div class="fr-preview-half">
                    <div class="fr-preview-label">🔍 Nalezeno (${matches.length} výskytů)</div>
                    <div class="fr-preview-content">${highlightedText}</div>
                </div>
                <div class="fr-preview-half">
                    <div class="fr-preview-label">✏️ Po nahrazení</div>
                    <div class="fr-preview-content">${escapeHtml(replacedText)}</div>
                </div>
            </div>
        `;
        
        // Aktualizace statistik
        
        occurrencesSpan.textContent = matches.length;
        updateRowsColsStats(replacedText);
    }

    // ============ VYKRESLENÍ TLAČÍTEK AKCÍ ============
    function renderActionButtons() {
        actionsGrid.innerHTML = '';
        
        for (const category of categories) {
            const categoryActions = actions.filter(a => a.category === category.id);
            if (categoryActions.length === 0) continue;
            
            const groupDiv = document.createElement('div');
            groupDiv.className = 'fr-action-group';
            groupDiv.innerHTML = `<div class="fr-action-group-title">${category.name}</div>`;
            
            const buttonsDiv = document.createElement('div');
            buttonsDiv.className = 'fr-action-buttons';
            
            for (const action of categoryActions) {
                const btn = document.createElement('button');
                btn.className = 'fr-action-btn';
                btn.innerHTML = `${action.icon} ${action.name}`;
                btn.addEventListener('click', () => executeAction(action));
                buttonsDiv.appendChild(btn);
            }
            
            groupDiv.appendChild(buttonsDiv);
            actionsGrid.appendChild(groupDiv);
        }
    }

    // ============ PROVEDENÍ AKCE ============
    function executeAction(action) {
    const text = inputEl.value;
    if (!text && action.category !== 'analyze') {
        showNotification('Nejprve vlož text do vstupního pole', 'warning');
        return;
    }
    
    let result = '';
    
    if (action.execute) {
        result = action.execute(text);
        inputEl.value = result;
        findInput.value = '';
        replaceInput.value = '';
        updateLivePreview();
        updateRowsColsStats(result);  // ← PŘIDAT
        showNotification(`✓ ${action.name} provedena`, 'success');
    }
        else if (action.params) {
            findInput.value = action.params.find;
            replaceInput.value = action.params.replace;
            if (action.params.isRegex) useRegexCheck.checked = true;
            updateLivePreview();
            showNotification(`✓ ${action.name} - nastaveno, klikni na "Nahradit vše"`, 'info');
        }
        else if (action.extract) {
            result = action.extract(text);
            if (!result) {
                showNotification(`Žádné položky nenalezeny`, 'warning');
                return;
            }
            inputEl.value = result;
            findInput.value = '';
            replaceInput.value = '';
            updateLivePreview();
            showNotification(`✓ ${action.name}: extrahováno ${result.split('\n').length} položek`, 'success');
        }
        else if (action.analyze) {
            const message = action.analyze(text);
            showNotification(message, 'info');
            return;
        }
        
        saveSettings();
    }

    // ============ NAHRADIT VŠE ============
    function replaceAll() {
        const text = inputEl.value;
        const find = findInput.value;
        const replace = replaceInput.value;
        
        if (!text) { showNotification('Žádný text k úpravě', 'warning'); return; }
        if (!find) { showNotification('Zadej text k hledání', 'warning'); return; }
        
        const regex = createRegex(find, true);
        if (!regex) return;
        
        const newText = text.replace(regex, replace);
        inputEl.value = newText;
        
        const count = (text.match(createRegex(find, false)) || []).length;
        updateLivePreview();
        showNotification(`Nahrazeno ${count} výskytů`, 'success');
        saveSettings();
    }

    // ============ NAHRADIT PRVNÍ ============
    function replaceOne() {
        const text = inputEl.value;
        const find = findInput.value;
        const replace = replaceInput.value;
        
        if (!text) { showNotification('Žádný text k úpravě', 'warning'); return; }
        if (!find) { showNotification('Zadej text k hledání', 'warning'); return; }
        
        const regex = createRegex(find, true);
        if (!regex) return;
        
        const newText = text.replace(regex, replace);
        inputEl.value = newText;
        updateLivePreview();
        showNotification(`Nahrazen první výskyt`, 'success');
        saveSettings();
    }

    // ============ VYČISTIT ============
    function clearAll() {
        inputEl.value = '';
        findInput.value = '';
        replaceInput.value = '';
        caseSensitiveCheck.checked = false;
        wholeWordCheck.checked = false;
        useRegexCheck.checked = false;
        updateLivePreview();
        showNotification('Vyčištěno', 'info');
        saveSettings();
    }

    // ============ KOPÍROVAT ============
    async function copyOutput() {
        if (currentReplacedText) {
            await copyToClipboard(currentReplacedText);
            showNotification('Text po nahrazení zkopírován do schránky', 'success');
        } else {
            showNotification('Žádný text ke kopírování', 'warning');
        }
    }

    // ============ ULOŽENÍ NASTAVENÍ ============
    function saveSettings() {
        storage.set('input', inputEl.value);
        storage.set('find', findInput.value);
        storage.set('replace', replaceInput.value);
        storage.set('caseSensitive', caseSensitiveCheck.checked);
        storage.set('wholeWord', wholeWordCheck.checked);
        storage.set('useRegex', useRegexCheck.checked);
    }

    // ============ NAČTENÍ NASTAVENÍ ============
    function loadSettings() {
        inputEl.value = storage.get('input', '');
        findInput.value = storage.get('find', '');
        replaceInput.value = storage.get('replace', '');
        caseSensitiveCheck.checked = storage.get('caseSensitive', false);
        wholeWordCheck.checked = storage.get('wholeWord', false);
        useRegexCheck.checked = storage.get('useRegex', false);
        updateLivePreview();
    }

    // ============ EVENT LISTENERY ============
    inputEl.addEventListener('input', () => { updateLivePreview(); saveSettings(); });
    findInput.addEventListener('input', () => { updateLivePreview(); saveSettings(); });
    replaceInput.addEventListener('input', () => { updateLivePreview(); saveSettings(); });
    caseSensitiveCheck.addEventListener('change', () => { updateLivePreview(); saveSettings(); });
    wholeWordCheck.addEventListener('change', () => { updateLivePreview(); saveSettings(); });
    useRegexCheck.addEventListener('change', () => { updateLivePreview(); saveSettings(); });
    
    replaceAllBtn.addEventListener('click', replaceAll);
    replaceOneBtn.addEventListener('click', replaceOne);
    clearBtn.addEventListener('click', clearAll);
    copyBtn.addEventListener('click', copyOutput);
    
    // Inicializace
    renderActionButtons();
    loadSettings();
}

export function cleanup() {
    console.log('Find & Replace se zavírá');
}

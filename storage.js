// Namespace storage pro jednotlivé aplikace
export function getStorage(namespace) {
    const prefix = `app_${namespace}_`;
    
    return {
        set(key, value) {
            try {
                localStorage.setItem(prefix + key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Storage save failed:', e);
                return false;
            }
        },
        
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(prefix + key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.error('Storage load failed:', e);
                return defaultValue;
            }
        },
        
        remove(key) {
            localStorage.removeItem(prefix + key);
        },
        
        clear() {
            Object.keys(localStorage)
                .filter(k => k.startsWith(prefix))
                .forEach(k => localStorage.removeItem(k));
        },
        
        getAll() {
            const result = {};
            Object.keys(localStorage)
                .filter(k => k.startsWith(prefix))
                .forEach(k => {
                    const key = k.slice(prefix.length);
                    try {
                        result[key] = JSON.parse(localStorage.getItem(k));
                    } catch (e) {
                        result[key] = localStorage.getItem(k);
                    }
                });
            return result;
        }
    };
}

// Globální nastavení
export const settings = getStorage('global');
// rating.js
import { CONFIG } from './config.js';
const ratingsCache = new Map();

// Načtení hodnocení (s cache)
export async function loadProductRating(productId, forceRefresh = false) {
    // Pokud máme v cache a nechceme obnovit, vrátíme cached data
    if (!forceRefresh && ratingsCache.has(productId)) {
        return ratingsCache.get(productId);
    }
    
    try {
        const response = await fetch(`${CONFIG.APPS_SCRIPT_URL}?action=getRatings&productId=${encodeURIComponent(productId)}`);
        const data = await response.json();
        
        const result = {
            average: data.average || 0,
            count: data.count || 0,
            ratings: data.ratings || []
        };
        
        // Uložit do cache
        ratingsCache.set(productId, result);
        return result;
    } catch (err) {
        return { average: 0, count: 0, ratings: [] };
    }
}

// Smazání cache pro konkrétní produkt (po přidání hodnocení)
export function clearRatingCache(productId) {
    ratingsCache.delete(productId);
}

// Přidání hodnocení (jen přihlášený uživatel)
export async function addRating(productId, userId, rating, comment) {
    try {
        const response = await fetch(`${CONFIG.APPS_SCRIPT_URL}?action=addRating&productId=${encodeURIComponent(productId)}&userId=${encodeURIComponent(userId)}&rating=${rating}&comment=${encodeURIComponent(comment || '')}`);
        const data = await response.json();
        return data;
    } catch (err) {
        console.error("Chyba při ukládání hodnocení:", err);
        return { success: false, error: err.message };
    }
}

// Vykreslení hvězdiček (1-5) – vrací HTML string
export function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let stars = '';
    for (let i = 0; i < fullStars; i++) stars += '★';
    if (hasHalfStar) stars += '½';
    for (let i = 0; i < emptyStars; i++) stars += '☆';
    
    return stars;
}

// Vytvoření HTML pro hvězdičky s interakcí (pro formulář)
export function createStarSelector(containerId, onRatingChange) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let selectedRating = 5;
    
    const starsHtml = `
        <div style="display: flex; gap: 8px; font-size: 32px; cursor: pointer;">
            <span data-rating="1">☆</span>
            <span data-rating="2">☆</span>
            <span data-rating="3">☆</span>
            <span data-rating="4">☆</span>
            <span data-rating="5">☆</span>
        </div>
        <input type="hidden" id="selected-rating-value" value="5">
    `;
    
    container.innerHTML = starsHtml;
    
    const stars = container.querySelectorAll('span');
    const ratingInput = document.getElementById('selected-rating-value');
    
    function updateStarsDisplay(rating) {
        stars.forEach((star, index) => {
            if (index < rating) {
                star.innerHTML = '★';
                star.style.color = '#ffc107';
            } else {
                star.innerHTML = '☆';
                star.style.color = 'var(--text-dim)';
            }
        });
    }
    
    updateStarsDisplay(5);
    
    stars.forEach((star, index) => {
        const ratingValue = index + 1;
        
        star.addEventListener('mouseenter', () => {
            updateStarsDisplay(ratingValue);
        });
        
        star.addEventListener('mouseleave', () => {
            updateStarsDisplay(selectedRating);
        });
        
        star.addEventListener('click', () => {
            selectedRating = ratingValue;
            if (ratingInput) ratingInput.value = ratingValue;
            updateStarsDisplay(selectedRating);
            if (onRatingChange) onRatingChange(selectedRating);
        });
    });
    
    return {
        getSelectedRating: () => selectedRating,
        setSelectedRating: (rating) => {
            selectedRating = rating;
            if (ratingInput) ratingInput.value = rating;
            updateStarsDisplay(selectedRating);
        }
    };
}
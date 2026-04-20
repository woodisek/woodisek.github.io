import { showToast } from './ui.js';
import { addToCart } from './cart.js';

// Načtení seznamu přání z localStorage
export function getWishlist() {
    return JSON.parse(localStorage.getItem('wishlist') || '[]');
}

// Uložení seznamu přání
function saveWishlist(wishlist) {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

// Přidat do přání
export function addToWishlist(product, event) {
    if (event) event.stopPropagation();
    
    let wishlist = getWishlist();
    if (!wishlist.find(p => p.id === product.id)) {
        wishlist.push({
            id: product.id,
            name: product.name,
            price: product.price,
            img: product.imgs[0].includes('?') ? product.imgs[0] : product.imgs[0] + '?w=300',
            idx: product.idx
        });
        saveWishlist(wishlist);
        showToast("Přidáno do přání! ✨", "✨");
        updateWishlistBadge();
        return true;
    } else {
        showToast("Už je v seznamu přání", "✨");
        return false;
    }
}

// Odebrat z přání
export function removeFromWishlist(productId) {
    let wishlist = getWishlist().filter(p => p.id !== productId);
    saveWishlist(wishlist);
    updateWishlistBadge();
    showToast("Odebráno z přání", "🗑️");
}

// Kontrola zda je produkt v přání
export function isInWishlist(productId) {
    return getWishlist().some(p => p.id === productId);
}

// Počet položek v přání
export function getWishlistCount() {
    return getWishlist().length;
}

// Aktualizace badge (počtu)
function updateWishlistBadge() {
    const badge = document.getElementById('wishlist-badge');
    const count = getWishlistCount();
    if (badge) {
        badge.innerText = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

// Přesunout z přání do košíku
export function moveToCart(productId) {
    const wishlist = getWishlist();
    const product = wishlist.find(p => p.id === productId);
    if (!product) return;
    
    // Vytvoříme produkt z dat uložených ve wishlistu
    const cartProduct = {
        id: product.id,
        name: product.name,
        price: product.price,
        imgs: [product.img],
        idx: product.idx,
        stock: "1",
        sale: "0",
        desc: "",
        ship: ""
    };
    
    addToCart(cartProduct);
    removeFromWishlist(productId);
    showToast("Přesunuto do košíku! 🛒", "✅");
}

// Zobrazení stránky wishlist
window.showWishlist = function() {
    
    window.isInfiniteScrollDisabled = true;
    
    
    // Schovat ostatní sekce
    const shop = document.getElementById('shop');
    const blogSection = document.getElementById('blog-section');
    const aboutSection = document.getElementById('about');
    const searchContainer = document.querySelector('.search-container');
    const filters = document.getElementById('filters');
    const productCount = document.getElementById('product-count');
    const priceFilterToggle = document.getElementById('price-filter-toggle');
    const portfolioSection = document.getElementById('portfolio-container');
    const userSection = document.getElementById('user-section');
    const appsSection = document.getElementById('apps-section');
    
    
    if (shop) shop.style.display = 'none';
    if (searchContainer) searchContainer.style.display = 'none';
    if (filters) filters.style.display = 'none';
    if (productCount) productCount.style.display = 'none';
    if (priceFilterToggle) priceFilterToggle.style.display = 'none';
    if (blogSection) blogSection.style.display = 'none';
    if (aboutSection) aboutSection.style.display = 'none';
    if (portfolioSection) portfolioSection.style.display = 'none';
    if (userSection) userSection.style.display = 'none';
    if (appsSection) appsSection.style.display = 'none';
    
    
    // Vytvoř nebo zobraz wishlist sekci
    let wishlistSection = document.getElementById('wishlist-section');
    if (!wishlistSection) {
        wishlistSection = document.createElement('div');
        wishlistSection.id = 'wishlist-section';
        wishlistSection.className = 'wishlist-section';
        wishlistSection.style.cssText = 'max-width: 1200px; margin: 40px auto;';
        document.body.appendChild(wishlistSection);
    }
    
    wishlistSection.style.display = 'block';
    renderWishlist();
};

function renderWishlist() {
    const wishlistSection = document.getElementById('wishlist-section');
    if (!wishlistSection) return;
    
    const wishlist = getWishlist();
    
    if (wishlist.length === 0) {
        wishlistSection.innerHTML = `
            <div class="empty-wishlist" style="text-align: center; padding: 60px 20px;">
                <div style="font-size: 64px; margin-bottom: 20px;">✨</div>
                <h3 style="color: var(--accent); margin-bottom: 10px;">Seznam přání je prázdný</h3>
                <p style="color: var(--text-dim); margin-bottom: 20px;">Přidejte si produkty, které se vám líbí.</p>
                <button class="btn btn-main" onclick="window.showProducts()">🛒 Procházet produkty</button>
            </div>
        `;
        return;
    }
    
let html = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; flex-wrap: wrap; gap: 15px; text-align: center;">
        <h2 style="color: var(--accent); margin: 0;">✨ Seznam přání (${wishlist.length})</h2>
        <button class="btn btn-sec" onclick="window.showProducts()">Zpět do obchodu</button>
    </div>
    <div id="shop">
`;
    
    wishlist.forEach(product => {
        html += `
            <div class="product-card" style="cursor: default;">
                <div class="card-front">
                    <div class="img-box">
                        <img src="${product.img}" class="main-img" style="width: 100%; aspect-ratio: 4/5; object-fit: cover; opacity: 1;">
                        <button class="wishlist-remove-btn" onclick="window.removeFromWishlistAndRefresh('${product.id}')" style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.5); border: none; color: white; width: 34px; height: 34px; border-radius: 50%; cursor: pointer; font-size: 16px;">x</button>
                    </div>
                    <div class="p-content">
                        <div class="p-title">${product.name}</div>
                        <div class="p-prices">
                            <span class="curr-price">${product.price}</span>
                        </div>
                        <div style="display: flex; gap: 8px; margin-top: 10px;">
                            <button class="btn btn-main" style="flex-grow: 1;" onclick="window.moveToCartAndRefresh('${product.id}')">🛒 Přidat do košíku</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    wishlistSection.innerHTML = html;
}

window.removeFromWishlistAndRefresh = function(productId) {
    removeFromWishlist(productId);
    renderWishlist();
};

window.moveToCartAndRefresh = function(productId) {
    moveToCart(productId);
    renderWishlist();
};

// Export pro použití v jiných souborech
export { updateWishlistBadge };

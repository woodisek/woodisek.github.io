
import { CONFIG } from './config.js';
import { allProducts, categories } from './api.js';
import { addToCart, getCartTotalItems } from './cart.js';
import { createWoodShavings } from './features.js';
const filterCache = new Map();
const CACHE_DURATION = 300000; // 5 minut v milisekundách
function getCacheKey() {
    const searchInput = document.getElementById("search-input");
    const query = searchInput ? removeDiacritics(searchInput.value.toLowerCase()) : "";
    const minPriceVal = document.getElementById('min-price')?.value || '';
    const maxPriceVal = document.getElementById('max-price')?.value || '';
    const inStockVal = document.getElementById('filter-instock')?.checked || false;
    const customVal = document.getElementById('filter-custom')?.checked || false;
    
    return `${currentCategory}|${query}|${minPriceVal}|${maxPriceVal}|${inStockVal}|${customVal}|${currentSort}`;
}
function clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of filterCache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
            filterCache.delete(key);
        }
    }
}
let minPrice = null;
let maxPrice = null;
let currentSort = 'default';
let filterInStock = false;
let filterCustom = false;
let currentCategory = 'Vše';
let activeOverlayIdx = null;
let activeOfferIdx = null;
let scrollStartPos = 0;
let updateCartBadgeCallback = null;
let allFilteredProducts = [];
let visibleProductsCount = 8;
let isLoadingMore = false;
let hasMoreProducts = true;
window.isInfiniteScrollDisabled = false;
export function setCartBadgeCallback(callback) {
    updateCartBadgeCallback = callback;
}
let toastTimeout = null;
export function showToast(text, icon = '🛒') {
    const toast = document.getElementById('toast-container');
    const toastText = document.getElementById('toast-text');
    const toastIcon = document.getElementById('toast-icon');
    if (!toast) return;
    if (toastTimeout) clearTimeout(toastTimeout);
    toastText.innerText = text;
    toastIcon.innerText = icon;
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
        toastTimeout = null;
    }, 3000);
}
export function updateNavButtonsVisibility() {
    const blogBtn = document.getElementById('nav-blog-btn');
    const aboutBtn = document.getElementById('nav-about-btn');
    const productsBtn = document.getElementById('nav-products-btn');
    if (blogBtn) {
        blogBtn.style.display = CONFIG.Show_Blog !== false ? 'flex' : 'none';
    }
    if (aboutBtn) {
        aboutBtn.style.display = CONFIG.Show_About !== false ? 'flex' : 'none';
    }
    if (productsBtn) {
        if (CONFIG.Enable_Shop === false) {
            productsBtn.style.opacity = '1';
            productsBtn.style.cursor = 'pointer';
            productsBtn.title = 'Obchod je dočasně zavřený';
            productsBtn.innerHTML = '🛒 Obchod';
        } else {
            productsBtn.style.opacity = '1';
            productsBtn.style.cursor = 'pointer';
            productsBtn.title = '';
            productsBtn.innerHTML = CONFIG.Menu_Button_Text_Products || '🛒 Obchod';
        }
    }
}
export function renderSkeletons(container, count = 8) {
    if (!container) return;
    const skeletonHTML = `
        <div class="skeleton-card">
            <div class="sk-share"></div>
            <div class="skeleton-img"></div>
            <div class="skeleton-content">
                <div class="sk-line sk-title"></div>
                <div class="sk-line sk-price"></div>
                <div class="sk-btn-group">
                    <div class="sk-line sk-btn-main"></div>
                    <div class="sk-line sk-btn-side"></div>
                </div>
                <div class="sk-btn-group">
                    <div class="sk-line sk-btn-main"></div>
                    <div class="sk-line sk-btn-side"></div>
                </div>
            </div>
        </div>
    `;
    container.innerHTML = skeletonHTML.repeat(count);
}
export function renderFilters() {
    const fDiv = document.getElementById("filters");
    if (!fDiv) return;
    let html = `<button class="f-btn active" data-cat="Vše" onclick="window.filterData('Vše', this)">Vše</button>`;
    if (allProducts.some(p => p.stock && p.stock !== "0")) {
        html += `<button class="f-btn" data-cat="Skladem" style="color:var(--green); border-color:var(--green)" onclick="window.filterData('Skladem', this)"> 📦 Skladem</button>`;
    }
    if (allProducts.some(p => p.sale && p.sale !== "0")) {
        html += `<button class="f-btn" data-cat="Slevy" style="color:var(--sale); border-color:var(--sale)" onclick="window.filterData('Slevy', this)"> 🔥 Slevy</button>`;
    }
    if (Array.from(categories).includes("Novinky")) {
        html += `<button class="f-btn" data-cat="Novinky" style="color:#ffc107; border-color:#ffc107" onclick="window.filterData('Novinky', this)">✨ Novinky</button>`;
    }
    Array.from(categories).sort().forEach(cat => {
        if (cat !== "Novinky") {
            html += `<button class="f-btn" data-cat="${cat}" onclick="window.filterData('${cat}', this)">${cat}</button>`;
        }
    });
    fDiv.innerHTML = html;
}
window.isInfiniteScrollDisabled = false;
window.hideLoad = function(idx) {
    const img = document.getElementById(`img-${idx}`);
    const spin = document.getElementById(`spin-${idx}`);
    if (img) img.style.opacity = "1";
    if (spin) spin.style.display = "none";
};
window.togglePriceFilter = () => {
    const panel = document.getElementById('price-filter-panel');
    if (panel) {
        panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex';
    }
};
function setupAutoFilters() {
    const minInput = document.getElementById('min-price');
    const maxInput = document.getElementById('max-price');
    const inStockCheck = document.getElementById('filter-instock');
    const customCheck = document.getElementById('filter-custom');
    const sortBtns = document.querySelectorAll('.sort-btn');
sortBtns.forEach(btn => {
    btn.removeEventListener('click', window.handleSortClick);
    btn.addEventListener('click', window.handleSortClick);
});
    if (minInput) minInput.addEventListener('input', () => applyAllFilters());
    if (maxInput) maxInput.addEventListener('input', () => applyAllFilters());
    if (inStockCheck) inStockCheck.addEventListener('change', () => applyAllFilters());
    if (customCheck) customCheck.addEventListener('change', () => applyAllFilters());
}
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(setupAutoFilters, 500);
});
window.applyAllFilters = () => {
    const minInput = document.getElementById('min-price');
    const maxInput = document.getElementById('max-price');
    minPrice = minInput.value ? parseInt(minInput.value) : null;
    maxPrice = maxInput.value ? parseInt(maxInput.value) : null;
    filterInStock = document.getElementById('filter-instock')?.checked || false;
    filterCustom = document.getElementById('filter-custom')?.checked || false;
    applyFilters();
    updateNavButtonsVisibility();
};
window.setSort = (sortType, btn) => {
    currentSort = sortType;
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyFilters();
};
window.chImg = function(idx, step, e) {
    if (e) e.stopPropagation();
    const p = allProducts.find(x => x.idx === idx);
    if (!p) return; 
    p.cur = (p.cur + step + p.imgs.length) % p.imgs.length;
    const cardImg = document.getElementById(`img-${idx}`);
    const cardSpin = document.getElementById(`spin-${idx}`);
    if (cardImg) {
        if (cardSpin) cardSpin.style.display = "block";
        cardImg.style.opacity = "0";
        cardImg.src = p.imgs[p.cur];
    }
    const tag = document.getElementById(`ct-${idx}`);
    if (tag) tag.innerText = `${p.cur + 1} / ${p.imgs.length}`;
    const gal = document.getElementById("gal");
    if (gal && gal.style.display === "flex") {
        const galSpinner = document.getElementById("gal-spinner");
        const galImg = document.getElementById("galImg");
        if (galSpinner) galSpinner.style.display = "block";
        if (galImg) {
            galImg.style.opacity = "0";
            galImg.src = p.imgs[p.cur];
        }
    }
};
window.toggleOver = function(idx, show) {
    if (show && navigator.vibrate) navigator.vibrate(10);
    
    const p = allProducts.find(x => x.idx === idx);
    if (!p) return;
    
    const card = document.getElementById(p.id);
    if (!card) return;
    
    if (show) {
        card.classList.add('flip');
        activeOverlayIdx = idx;
        scrollStartPos = window.scrollY;
        
        const descContainer = document.getElementById(`burning-desc-${idx}`);
        if (descContainer) {
            descContainer.innerHTML = p.desc;
            descContainer.className = '';
        }
        
        const shipTitleContainer = document.getElementById(`burning-ship-title-${idx}`);
        if (shipTitleContainer) {
            shipTitleContainer.innerHTML = "Dodatečné informace:";
            shipTitleContainer.className = '';
        }
        
        const shipContainer = document.getElementById(`burning-ship-${idx}`);
        if (shipContainer) {
            shipContainer.innerHTML = p.ship || '';
            shipContainer.className = '';
        }
    } else {
        card.classList.remove('flip');
        activeOverlayIdx = null;
        
        const descContainer = document.getElementById(`burning-desc-${idx}`);
        const shipTitleContainer = document.getElementById(`burning-ship-title-${idx}`);
        const shipContainer = document.getElementById(`burning-ship-${idx}`);
        
        if (descContainer) descContainer.innerHTML = '';
        if (shipTitleContainer) shipTitleContainer.innerHTML = '';
        if (shipContainer) shipContainer.innerHTML = '';
    }
};

window.orderProduct = function(idx, event) {
    if (navigator.vibrate) navigator.vibrate(10);
    
    const p = allProducts.find(x => x.idx === idx);
    if (!p) return;
    
    window.addToCart(idx, event);
    
    if (typeof window.toggleCart === 'function') {
        window.toggleCart();
    } else {
        const modal = document.getElementById('cart-modal');
        const bg = document.getElementById('cart-overlay-bg');
        if (modal && bg) {
            modal.classList.add('open');
            bg.style.display = 'block';
        }
    }
};

window.addToCart = function(idx, event) {
    if (navigator.vibrate) navigator.vibrate(10);
    
    // Zvuk s fallbackem
    try {
        const audio = new Audio('bell.mp3');
        audio.volume = 0.3;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                // Ticho - prohlížeč blokuje, nic neděláme
            });
        }
    } catch(e) {}
    
    const p = allProducts.find(x => x.idx === idx);
    if (!p) return;
    
    createWoodShavings(event);
    
    const btn = event?.target;
    if (btn) {
        btn.classList.add('cart-added-effect');
        setTimeout(() => btn.classList.remove('cart-added-effect'), 600);
    }
    
    const result = addToCart(p, event);
    if (result.success) {
        showToast("Přidáno do košíčku!", " 🛒 ");
        if (updateCartBadgeCallback) updateCartBadgeCallback();
        
        const cartIcon = document.querySelector('.icon-btn');
        if (cartIcon) {
            cartIcon.classList.add('cart-added-effect');
            setTimeout(() => cartIcon.classList.remove('cart-added-effect'), 600);
        }
        
        const floatingCartBtn = document.getElementById('floating-cart-btn');
        if (floatingCartBtn) {
            floatingCartBtn.classList.add('cart-added-effect');
            setTimeout(() => floatingCartBtn.classList.remove('cart-added-effect'), 600);
        }
    } else if (result.reason === 'no_gdpr') {
        showToast("Pro uložení košíku prosím přijměte cookies.", "🍪");
        const banner = document.getElementById('gdpr-banner');
        if (banner) banner.style.display = 'flex';
    }
};

function createProductCard(p, displayIndex) {
    
    const isSale = p.sale && p.sale !== "0";
    const isStock = p.stock && p.stock !== "0";
    const finalPrice = isSale ? p.sale : p.price;
    const mainBtnText = isStock ? "Koupit teď" : "Objednat";
    const mainBtnClass = isStock ? 'btn btn-main btn-skladem' : 'btn btn-main btn-zakazka';
    
    const card = document.createElement("div");
    card.className = "product-card";
    card.id = p.id;
    card.setAttribute('data-product-idx', p.idx);  // ← NOVÉ
    card.style.animationDelay = `${(displayIndex % 8) * 0.05}s`;
    card.style.setProperty('--offer-delay', `${(Math.random() * 10).toFixed(2)}s`);
    
    card.innerHTML = `
        <div class="card-front">
            <div class="img-box" data-action="open-gallery" data-idx="${p.idx}">
                <div class="spinner" id="spin-${p.idx}"></div>
                <div class="share-btn" data-action="share-product" data-id="${p.id}" data-name="${p.name.replace(/'/g, "\\'")}"> 🔗 </div>
                ${p.tag ? `<span class="product-tag">${p.tag}</span>` : ''}
                <img src="${p.imgs[0]}" loading="lazy" decoding="async" class="main-img" id="img-${p.idx}" onload="window.hideLoad(${p.idx})">
                ${p.imgs.length > 1 ? `
                    <button class="nav-btn btn-prev" data-action="prev-image" data-idx="${p.idx}">‹</button>
                    <button class="nav-btn btn-next" data-action="next-image" data-idx="${p.idx}">›</button>
                    <div class="cnt-tag" id="ct-${p.idx}">1 / ${p.imgs.length}</div>
                ` : ''}
            </div>
            <div class="p-content">
                <div class="st-line">
                    <span class="${isStock ? 'st-ok' : 'st-none'}">${isStock ? p.stock + ' ks Skladem' : 'Na zakázku'}</span>
                    <span style="color:var(--text-dim); font-size:10px;">Kód: ${p.id}</span>
                </div>
                <div class="p-title">${p.name}</div>
                <div class="p-prices">
                    <span class="curr-price ${isSale ? 'sale-blink' : ''}">${finalPrice}</span>
                    ${isSale ? `<span class="old-price">${p.price}</span>` : ''}
                </div>
                
                ${CONFIG.Enable_Kosik ? `
                <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                    <button class="btn btn-sec" style="flex-grow: 1;" data-action="show-details" data-idx="${p.idx}">Detaily</button>
                    ${!isSale ? `<button class="btn-offer-small" data-action="open-offer" data-idx="${p.idx}"> 🏷️ </button>` : `<button class="btn-offer-small" style="visibility: hidden;"></button>`}
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="${mainBtnClass}" style="flex-grow: 1;" data-action="order-product" data-idx="${p.idx}">${mainBtnText}</button>
                    <button class="btn-cart-small" data-action="add-to-cart" data-idx="${p.idx}"> 🛒 </button>
                </div>
                ` : `
                <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                    <button class="btn btn-sec" style="flex-grow: 1;" data-action="show-details" data-idx="${p.idx}">Detaily</button>
                </div>
                `}
            </div>
        </div>
        <div class="card-back">
            <div class="over-scroll">
                
                <p style="margin:10px 0;">
                    <span id="burning-desc-${p.idx}"></span>
                </p>
                
                    <b style="font-size:12px;">
                        <span id="burning-ship-title-${p.idx}"></span>
                    </b>
                    <p style="font-size:12px; margin-top: 8px;">
                        <span id="burning-ship-${p.idx}"></span>
                    </p>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

function showLoadingSpinner() {
    // Spinner je odstraněn - žádná vizuální indikace načítání
}

function removeLoadingSpinner() {
    const existingSpinner = document.getElementById("loading-spinner");
    if (existingSpinner) existingSpinner.remove();
}

function reconnectObserver() {
    if (!window.productObserver) return;
    
    const products = document.querySelectorAll('.product-card');
    if (products.length === 0) return;
    
    const lastProduct = products[products.length - 1];
    window.productObserver.disconnect();
    window.productObserver.observe(lastProduct);
}

async function loadMoreProducts() {
    if (isLoadingMore || !hasMoreProducts) return;
    
    isLoadingMore = true;
    // showLoadingSpinner(); // ZAKOMENTOVÁNO - žádný spinner
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const newCount = Math.min(visibleProductsCount + 8, allFilteredProducts.length);
    const newlyLoaded = newCount - visibleProductsCount;
    
    if (newlyLoaded > 0) {
        visibleProductsCount = newCount;
        const newProducts = allFilteredProducts.slice(visibleProductsCount - newlyLoaded, visibleProductsCount);
        
        const shop = document.getElementById("shop");
        if (shop) {
            const fragment = document.createDocumentFragment();
            newProducts.forEach((p, index) => {
                fragment.appendChild(createProductCard(p, visibleProductsCount - newlyLoaded + index));
            });
            shop.appendChild(fragment);
        }
        
        
    }
    
    hasMoreProducts = visibleProductsCount < allFilteredProducts.length;
    
    // if (!hasMoreProducts) {
    //     removeLoadingSpinner(); // ZAKOMENTOVÁNO
    // }
    
    isLoadingMore = false;
    
    if (hasMoreProducts) {
        setTimeout(() => reconnectObserver(), 100);
    }
}

export function initInfiniteScroll() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // POKUD JE POSOUVÁNÍ ZAKÁZÁNO, NIC NEDĚLEJ
            if (window.isInfiniteScrollDisabled) return;
            
            if (entry.isIntersecting && hasMoreProducts && !isLoadingMore) {
                loadMoreProducts();
            }
        });
    }, {
        rootMargin: '100px',
        threshold: 0.1
    });
    
    window.productObserver = observer;
}

export function resetInfiniteScroll() {
    visibleProductsCount = 8;
    hasMoreProducts = true;
    isLoadingMore = false;
    removeLoadingSpinner();
}

window.showBlog = function() {
    // ZAKÁZAT INFINITE SCROLL
    window.isInfiniteScrollDisabled = true;
    
    const shop = document.getElementById('shop');
    const blogSection = document.getElementById('blog-section');
    const aboutSection = document.getElementById('about');
    const portfolioSection = document.getElementById('portfolio-container');
    const searchContainer = document.querySelector('.search-container');
    const filters = document.getElementById('filters');
    const productCount = document.getElementById('product-count');
    const priceFilterToggle = document.getElementById('price-filter-toggle');
    const cartBtn = document.querySelector('.icon-btn');  // Košík tlačítko
    
    if (shop) shop.style.display = 'none';
    if (searchContainer) searchContainer.style.display = 'none';
    if (filters) filters.style.display = 'none';
    if (productCount) productCount.style.display = 'none';
    if (priceFilterToggle) priceFilterToggle.style.display = 'none';
    if (cartBtn) cartBtn.style.display = 'none';  // Schovat košík
    
    if (blogSection) blogSection.style.display = 'block';
    if (aboutSection) aboutSection.style.display = 'none';
    if (portfolioSection) portfolioSection.style.display = 'none';
    
    import('./blog.js').then(blog => {
        if (blog.blogPosts.length === 0) {
            blog.loadBlogPosts().then(() => blog.renderBlogPosts());
        } else {
            blog.renderBlogPosts();
        }
    });
};

window.showAbout = function() {
    // ZAKÁZAT INFINITE SCROLL
    window.isInfiniteScrollDisabled = true;
    
    const shop = document.getElementById('shop');
    // ... zbytek kódu ...
    const blogSection = document.getElementById('blog-section');
    const aboutSection = document.getElementById('about');
    const portfolioSection = document.getElementById('portfolio-container');
    const searchContainer = document.querySelector('.search-container');
    const filters = document.getElementById('filters');
    const productCount = document.getElementById('product-count');
    const priceFilterToggle = document.getElementById('price-filter-toggle');
    const cartBtn = document.querySelector('.icon-btn');  // Košík tlačítko
    
    if (shop) shop.style.display = 'none';
    if (searchContainer) searchContainer.style.display = 'none';
    if (filters) filters.style.display = 'none';
    if (productCount) productCount.style.display = 'none';
    if (priceFilterToggle) priceFilterToggle.style.display = 'none';
    if (cartBtn) cartBtn.style.display = 'none';  // Schovat košík
    
    if (blogSection) blogSection.style.display = 'none';
    if (aboutSection) aboutSection.style.display = 'block';
    if (portfolioSection) portfolioSection.style.display = 'block';
};

window.showProducts = function() {
    // POVOLIT INFINITE SCROLL (až se vrátíš do obchodu)
    window.isInfiniteScrollDisabled = false;
    const shop = document.getElementById('shop');
    const blogSection = document.getElementById('blog-section');
    const aboutSection = document.getElementById('about');
    const portfolioSection = document.getElementById('portfolio-container');
    const searchContainer = document.querySelector('.search-container');
    const filters = document.getElementById('filters');
    const productCount = document.getElementById('product-count');
    const priceFilterToggle = document.getElementById('price-filter-toggle');
    const cartBtn = document.querySelector('.icon-btn');
    const modeBtn = document.getElementById('mode-toggle');
    
    // ============================================================
    // POKUD JE OBCHOD ZAVŘENÝ
    // ============================================================
    if (CONFIG.Enable_Shop === false) {
        // ZOBRAZÍME VYHLEDÁVÁNÍ A FILTRY
        if (searchContainer) searchContainer.style.display = 'block';
        if (filters) filters.style.display = 'flex';
        if (priceFilterToggle) priceFilterToggle.style.display = 'flex';
        
        // MALÝ TEXT POD LOGEM
        if (productCount) {
            productCount.style.display = 'block';
            productCount.innerHTML = '🪵 Obchod je dočasně zavřený...';
        }
        
        // VELKÁ ZPRÁVA V KARTĚ (jako produkt)
        if (shop) {
            shop.style.display = 'grid';  // grid jako normální produkty
shop.innerHTML = `
<div class="product-card" style="grid-column: 1 / -1; display: flex; align-items: center; justify-content: center; min-height: 300px; cursor: default; transform: none !important; transition: none !important; box-shadow: none !important; outline: none !important; border: none !important;">
    <div style="text-align: center; padding: 40px;">
        <div class="shop-closed-icon" style="font-size: 64px; margin-bottom: 20px; display: inline-block;">🪵</div>
        <h3 class="shop-closed-title" style="color: var(--accent); margin-bottom: 10px; font-size: 24px;">Obchod je dočasně zavřený</h3>
        <p style="color: var(--text-dim); font-size: 16px;">Brzy tu bude veselo! Koukněte na můj blog :)</p>
    </div>
</div>
`;
        }
        
        // Ostatní prvky
        if (cartBtn) cartBtn.style.display = 'flex';
        if (modeBtn) modeBtn.style.display = 'flex';
        if (blogSection) blogSection.style.display = 'none';
        if (aboutSection) aboutSection.style.display = 'none';
        if (portfolioSection) portfolioSection.style.display = 'block';
        
        return;  // KONEC
    }
    
    // ============================================================
    // NORMÁLNÍ CHOVÁNÍ (OBCHOD JE OTEVŘENÝ)
    // ============================================================
    if (shop) shop.style.display = 'grid';
    if (searchContainer) searchContainer.style.display = 'block';
    if (filters) filters.style.display = 'flex';
    if (productCount) productCount.style.display = 'block';
    if (priceFilterToggle) priceFilterToggle.style.display = 'flex';
    if (cartBtn) cartBtn.style.display = 'flex';
    if (modeBtn) modeBtn.style.display = 'flex';
    
    if (blogSection) blogSection.style.display = 'none';
    if (aboutSection) aboutSection.style.display = 'none';
    if (portfolioSection) portfolioSection.style.display = 'block';
};


export function renderProductsWithInfiniteScroll(productsToRender) {
    const shop = document.getElementById("shop");
    if (!shop) return;
    
    // PŘESKOČ VYKRESLOVÁNÍ, POKUD JSOU PRODUKTY PRÁZDNÉ A JEŠTĚ SE NAČÍTAJÍ
    if (productsToRender.length === 0 && allProducts.length === 0) {
        return;
    }
    
    allFilteredProducts = productsToRender;
    
if (allFilteredProducts.length === 0) {
    const emptyTitle = CONFIG.Empty_Products_Title || "🪵 Žádné kousky k nalezení";
    const emptySubtitle = CONFIG.Empty_Products_Subtitle || "Zkuste změnit filtry nebo vyhledávání";
    const emptyIcon = CONFIG.Empty_Products_Icon || "🪵";
    
    shop.innerHTML = `
        <div class="empty-products">
            <span class="empty-products-icon">${emptyIcon}</span>
            <span class="empty-products-text">${emptyTitle}</span>
            <span class="empty-products-sub">${emptySubtitle}</span>
            <button class="empty-products-reset" onclick="window.resetFilters()" style="margin-top: 20px; padding: 10px 24px; background: var(--accent); color: white; border: none; border-radius: 30px; font-size: 13px; font-weight: 600; cursor: pointer; transition: transform 0.2s;">
                🔄 Obnovit filtry
            </button>
        </div>
    `;
    resetInfiniteScroll();

    return;
}
    
    resetInfiniteScroll();
    
    const firstBatch = allFilteredProducts.slice(0, visibleProductsCount);
    shop.innerHTML = "";
    
    firstBatch.forEach((p, index) => {
        shop.appendChild(createProductCard(p, index));
    });
    

    hasMoreProducts = visibleProductsCount < allFilteredProducts.length;
    
    if (hasMoreProducts) {
        setTimeout(() => reconnectObserver(), 100);
    }
}

export function applyFilters() {

        // Kontrola na speciální kategorie
    if (currentCategory === '___BLOG___') {
        window.showBlog();
        return;
    }
    
    if (currentCategory === '___ABOUT___') {
        window.showAbout();
        return;
    }
        window.showProducts();

    if (!allProducts || allProducts.length === 0) {
        console.warn("Produkty ještě nejsou načteny");
        return;
    }
    
    const searchInput = document.getElementById("search-input");
    let query = "";
    if (searchInput) {
        query = removeDiacritics(searchInput.value.toLowerCase());
    }
    
    // Vyčištění staré cache
    clearExpiredCache();
    
    // Vytvoření klíče pro cache
    const cacheKey = getCacheKey();
    
    // KONTROLA CACHE
    if (filterCache.has(cacheKey)) {
        const cached = filterCache.get(cacheKey);
        console.log("⚡ Z cache:", cacheKey.substring(0, 50) + "...");
        renderProductsWithInfiniteScroll(cached.data);
        return;
    }
    
    console.log("🔄 Počítám filtr (není v cache):", cacheKey.substring(0, 50) + "...");
    
    // ============================================================
    // PŮVODNÍ FILTROVÁNÍ (zde nic neměníme, jen obalíme)
    // ============================================================
    
    let filtered = [...allProducts];
    filtered = filtered.filter(p => p.status === "TRUE");
    
    if (currentCategory === 'Slevy') {
        filtered = filtered.filter(p => p.sale && p.sale !== "0");
    } else if (currentCategory === 'Skladem') {
        filtered = filtered.filter(p => p.stock && p.stock !== "0");
    } else if (currentCategory !== 'Vše') {
        filtered = filtered.filter(p => p.cat === currentCategory);
    }
    
    if (query && query.trim() !== "") {
        const tokens = query.trim().split(/\s+/).filter(t => t.length > 0);
        filtered = filtered.filter(p => {
            const combined = removeDiacritics(`${p.name} ${p.desc} ${p.id} ${p.cat}`).toLowerCase();
            return tokens.every(t => combined.includes(t));
        });
    }
    
    const minPriceVal = document.getElementById('min-price')?.value;
    const maxPriceVal = document.getElementById('max-price')?.value;
    const minPrice = minPriceVal ? parseInt(minPriceVal) : null;
    const maxPrice = maxPriceVal ? parseInt(maxPriceVal) : null;
    
    if (minPrice !== null || maxPrice !== null) {
        filtered = filtered.filter(p => {
            const priceStr = (p.sale && p.sale !== "0") ? p.sale : p.price;
            const price = parseInt(priceStr.replace(/[^\d]/g, ''), 10) || 0;
            if (minPrice !== null && price < minPrice) return false;
            if (maxPrice !== null && price > maxPrice) return false;
            return true;
        });
    }
    
    const filterInStock = document.getElementById('filter-instock')?.checked || false;
    const filterCustom = document.getElementById('filter-custom')?.checked || false;
    
    if (filterInStock || filterCustom) {
        filtered = filtered.filter(p => {
            const isStock = p.stock && p.stock !== "0";
            if (filterInStock && filterCustom) return true;
            if (filterInStock && isStock) return true;
            if (filterCustom && !isStock) return true;
            return false;
        });
    }
    
    filtered.sort((a, b) => {
        switch(currentSort) {
            case 'price-asc':
                const priceA = parseInt((a.sale && a.sale !== "0") ? a.sale : a.price);
                const priceB = parseInt((b.sale && b.sale !== "0") ? b.sale : b.price);
                return priceA - priceB;
            case 'price-desc':
                const priceC = parseInt((a.sale && a.sale !== "0") ? a.sale : a.price);
                const priceD = parseInt((b.sale && b.sale !== "0") ? b.sale : b.price);
                return priceD - priceC;
            case 'name-asc':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            default:
                return a.priority - b.priority;
        }
    });
    
    // ULOŽENÍ DO CACHE
    filterCache.set(cacheKey, {
        data: filtered,
        timestamp: Date.now()
    });
    
    renderProductsWithInfiniteScroll(filtered);
     
     
}

// Globální funkce pro reset filtrů
window.resetFilters = function() {
    if (navigator.vibrate) navigator.vibrate(10);
    
    // Reset vyhledávání
    const searchInput = document.getElementById("search-input");
    if (searchInput) searchInput.value = "";
    
    // Reset cenového filtru
    const minPrice = document.getElementById("min-price");
    const maxPrice = document.getElementById("max-price");
    if (minPrice) minPrice.value = "";
    if (maxPrice) maxPrice.value = "";
    
    // Reset checkboxů
    const inStock = document.getElementById("filter-instock");
    const custom = document.getElementById("filter-custom");
    if (inStock) inStock.checked = false;
    if (custom) custom.checked = false;
    
    // Reset řazení na výchozí
    const defaultSortBtn = document.querySelector('.sort-btn[data-sort="default"]');
    if (defaultSortBtn) {
        window.setSort('default', defaultSortBtn);
    }
    
    // Aktivovat kategorii "Vše"
    const allBtn = document.querySelector('.f-btn[data-cat="Vše"]');
    if (allBtn) {
        window.filterData('Vše', allBtn);
    }
    
    // Aplikovat filtry
    if (typeof window.applyAllFilters === 'function') {
        window.applyAllFilters();
    } else {
        window.applyFilters();
    }
    
    showToast("Filtry obnoveny", "🔄");
};

function removeDiacritics(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

window.filterData = function(cat, btn) {
    if (navigator.vibrate) navigator.vibrate(10);
    
    currentCategory = cat;
    document.querySelectorAll('.f-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    applyFilters();
};

window.filterDataFromUI = window.filterData;

let searchDebounceTimer = null;
window.handleSearch = function() {
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
        applyFilters();
        searchDebounceTimer = null;
    }, 300);
};

window.openOffer = function(idx) {
    const p = allProducts.find(x => x.idx === idx);
    if (!p) return;
    
    const isSale = p.sale && p.sale !== "0";
    if (isSale) {
        showToast("Tento produkt je již ve slevě, nabídka ceny není možná.", "🏷️");
        return;
    }
    
    activeOfferIdx = idx;
    const priceNum = parseInt(p.price.replace(/[^\d]/g, ''), 10) || 0;
    const minOffer = 1;
    const maxOffer = 9999;
    
    const offerImg = document.getElementById('offer-img');
    const offerTitle = document.getElementById('offer-title');
    const offerPriceRef = document.getElementById('offer-price-ref');
    const offerValue = document.getElementById('offer-value');
    const offerError = document.getElementById('offer-error');
    
    if (offerImg) offerImg.src = p.imgs[0];
    if (offerTitle) offerTitle.innerText = p.name;
    if (offerPriceRef) offerPriceRef.innerHTML = `Aktuální cena: ${p.price}<br><span style="font-size:10px;">Min. nabídka: ${minOffer} Kč | Max. nabídka: ${maxOffer} Kč</span>`;
    if (offerValue) offerValue.value = "";
    if (offerError) offerError.style.display = "none";
    
    if (offerValue) {
        offerValue.min = minOffer;
        offerValue.max = maxOffer;
    }
    
    const overlay = document.getElementById('offer-overlay-bg');
    if (overlay) overlay.style.display = "flex";
    
    setTimeout(() => {
        if (offerValue) {
            offerValue.focus();
            offerValue.select();
        }
    }, 10);
};

window.closeOffer = function() {
    const overlay = document.getElementById('offer-overlay-bg');
    if (overlay) overlay.style.display = "none";
    activeOfferIdx = null;
};

window.sendOffer = function() {
    const userPriceRaw = document.getElementById('offer-value')?.value;
    const errorDiv = document.getElementById('offer-error');
    const offerInput = document.getElementById('offer-value');
    
    if (!errorDiv) return;
    
    if (!userPriceRaw || userPriceRaw.trim() === "") {
        errorDiv.innerText = "Zadejte prosím cenu.";
        errorDiv.style.display = "block";
        return;
    }
    
    let userPrice = parseFloat(userPriceRaw.replace(',', '.'));
    if (isNaN(userPrice) || userPrice <= 0) {
        errorDiv.innerText = "Zadejte prosím platnou cenu (kladné číslo).";
        errorDiv.style.display = "block";
        return;
    }
    
    const minOffer = offerInput ? parseInt(offerInput.min) || 1 : 1;
    const maxOffer = offerInput ? parseInt(offerInput.max) || 10000 : 10000;
    userPrice = Math.round(userPrice);
    
    if (userPrice < minOffer) {
        errorDiv.innerText = `Minimální nabídka je ${minOffer.toLocaleString('cs-CZ')} Kč.`;
        errorDiv.style.display = "block";
        return;
    }
    
    if (userPrice > maxOffer) {
        errorDiv.innerText = `Maximální nabídka je ${maxOffer.toLocaleString('cs-CZ')} Kč.`;
        errorDiv.style.display = "block";
        return;
    }
    
    const p = allProducts.find(x => x.idx === activeOfferIdx);
    if (!p) return;
    
    const stockInfo = (p.stock && p.stock !== "0") ? `${p.stock} ks Skladem` : 'Na zakázku';
    const link = `${CONFIG.BASE_URL}#${p.id}`;
    const orderNum = `${new Date().getHours().toString().padStart(2, '0')}${new Date().getMinutes().toString().padStart(2, '0')}${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
    const waMsg = `Dobrý den, u produktu ${p.name} (Kód: ${p.id}) za cenu ${p.price} vám nabízím svou cenu: ${userPrice} Kč + poštovné. Máte zájem?\n\nStav: ${stockInfo}\nOdkaz: ${link}\n\nČíslo objednávky: ${orderNum}`;
    
    window.open(`https://wa.me/${CONFIG.PHONE}?text=${encodeURIComponent(waMsg)}`);
    window.closeOffer();
};

window.shareProduct = function(id, name, e) {
    e.stopPropagation();
    const shareUrl = `${CONFIG.BASE_URL}#${id}`;
    if (navigator.share) {
        navigator.share({ title: 'Woodisek Shop', text: `Koukni na tohle: ${name}`, url: shareUrl });
    } else {
        navigator.clipboard.writeText(shareUrl);
        showToast("Odkaz zkopírován!", " 🔗 ");
    }
};
window.handleSortClick = function(e) {
    const btn = e.currentTarget;
    const sortType = btn.getAttribute('data-sort');
    
    if (sortType) {
        window.setSort(sortType, btn);
    }
};
export { currentCategory, activeOverlayIdx, scrollStartPos };
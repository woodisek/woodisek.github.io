import { CONFIG, loadSettings } from './config.js';
import { initProducts, allProducts, portfolioImages, categories } from './api.js';
import { 
    cart, gdprConsent, setCartUpdateCallback, getCartTotalItems, 
    getCartItems, generateCartWhatsAppMessage, generateCartWhatsAppMessageWithOrderNumber, openWhatsApp,
    initGDPR, acceptGDPR, declineGDPR, initShipping, setShipping,
    getShippingPrice, getShippingText, selectedShipping, removeFromCart as removeFromCartModule,
    changeCartItemQty, saveCart
} from './cart.js';
import { 
    renderSkeletons, renderFilters, applyFilters, showToast,
    setCartBadgeCallback, activeOverlayIdx, scrollStartPos,
    initInfiniteScroll, updateNavButtonsVisibility
} from './ui.js';
import { initPortfolio, initGlobalSwipeDetection } from './gallery.js';
import { createWoodShavings, initSocialProof } from './features.js';
import { loadBlogPosts, renderBlogPosts } from './blog.js';
import './chat.js';
import { loadProductRating, clearRatingCache } from './rating.js';

// ZMĚNA VERZE WEBU zde + main.js?v=
const APP_VERSION = '20250412';  // ← TOTO ČÍSLO BUDEŠ MĚNIT

const storedVersion = localStorage.getItem('app_version');

if (storedVersion !== APP_VERSION) {
    console.log('Nová verze aplikace, mažu localStorage...');
    localStorage.clear();
    localStorage.setItem('app_version', APP_VERSION);
    console.log('LocalStorage vymazán, verze', APP_VERSION);
}

window.loadRatingsToModal = async function(productId, idx, forceRefresh = false) {
    const container = document.getElementById(`ratings-list-${idx}`);
    if (!container) return;
    container.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-dim);">⭐ Načítám hodnocení...</div>';
    // Pokusíme se načíst hodnocení z rating.js
    try {
        const { loadProductRating } = await import('./rating.js');
        const rating = await loadProductRating(productId, forceRefresh);
        if (rating.count > 0) {
            let starsHtml = '';
            for (let i = 0; i < Math.floor(rating.average); i++) starsHtml += '★';
            for (let i = 0; i < 5 - Math.floor(rating.average); i++) starsHtml += '☆';
            let html = `<div style="margin-bottom: 15px; text-align: center;">${starsHtml} <strong>${rating.average}</strong> (z ${rating.count} hodnocení)</div>`;
            rating.ratings.forEach(r => {
                html += `<div style="padding: 10px; border-bottom: 1px solid var(--border);"><div style="font-size: 12px; font-weight: 600;">👤 ${r.userName || 'Anonym'}</div><div style="font-size: 11px;">⭐ ${r.rating}/5</div>${r.comment ? `<p style="font-size: 12px;">${r.comment}</p>` : ''}</div>`;
            });
            container.innerHTML = html;
        } else {
            container.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-dim);">🌟 Zatím žádné hodnocení. Buď první!</div>';
        }
    } catch(e) {
        container.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-dim);">⭐ Hodnocení není k dispozici</div>';
    }
};

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistration().then(registration => {
    if (registration) registration.update();
  });
}

let cachedUserProfile = null;
let cachedUserOrders = null;
let lastProfileFetch = 0;
let lastOrdersFetch = 0;
const CACHE_TTL = 60000;
let cachedNewsletterStatus = null;
let lastNewsletterFetch = 0;
const ratingsCache = new Map();
let isMaintenanceMode = false;

function showMaintenanceMode() {
    if (document.getElementById('maintenance-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'maintenance-overlay';
    overlay.innerHTML = `
        <div class="maintenance-card">
            <div class="maintenance-icon">🔧🪵</div>
            <div class="maintenance-title">${CONFIG.Maintenance_Title || "🔧 Probíhá údržba"}</div>
            <div class="maintenance-text">${CONFIG.Maintenance_Text || "Dřevodílna se zrovna uklízí a ladí nové kousky. Brzy tu bude veselo! 🪵✨"}</div>
            <div class="maintenance-progress"><div class="maintenance-progress-bar"></div></div>
        </div>
    `;
    document.body.appendChild(overlay);
    document.body.classList.add('maintenance-active');
    document.querySelectorAll('.icon-btn, #floating-cart-btn, #chat-toggle-btn, .nav-link-btn, .f-btn, #search-input, .price-filter-btn').forEach(el => { if (el) el.style.pointerEvents = 'none'; });
}

function showGDPRBannerIfNeeded() {
    if (!localStorage.getItem('gdpr_consent')) {
        const banner = document.getElementById('gdpr-banner');
        if (banner) setTimeout(() => banner.style.display = 'flex', 500);
    }
}

function formatPhoneNumber(phone) {
    let clean = phone.toString().replace(/\D/g, '');
    if (clean.startsWith('420')) return `+420 ${clean.slice(3, 6)} ${clean.slice(6, 9)} ${clean.slice(9, 12)}`;
    return `+${clean}`;
}

function hideMaintenanceMode() {
    const overlay = document.getElementById('maintenance-overlay');
    if (overlay) overlay.remove();
    document.body.classList.remove('maintenance-active');
    document.querySelectorAll('.icon-btn, #floating-cart-btn, #chat-toggle-btn, .nav-link-btn, .f-btn, #search-input, .price-filter-btn').forEach(el => { if (el) el.style.pointerEvents = ''; });
}

window.showProductsAndResetFilter = function() {
    if (CONFIG.Enable_Shop === false) { window.showProducts(); return; }
    window.showProducts();
    const allBtn = document.querySelector('.f-btn[data-cat="Vše"]');
    if (allBtn) window.filterData('Vše', allBtn);
};

window.toggleCart = () => {
    if (navigator.vibrate) navigator.vibrate(10);
    const modal = document.getElementById('cart-modal');
    const bg = document.getElementById('cart-overlay-bg');
    if (modal && bg) {
        if (modal.classList.contains('open')) {
            modal.classList.remove('open');
            bg.style.display = 'none';
        } else {
            modal.classList.add('open');
            bg.style.display = 'block';
        }
    }
};

let currentModalProduct = null;
let currentModalImageIndex = 0;

window.openProductModal = function(idx) {
    const product = allProducts?.find(x => x.idx === idx);
    if (!product) return;
    currentModalProduct = product;
    currentModalImageIndex = product.cur || 0;
    document.getElementById('modal-product-title').innerText = product.name;
    const isStock = product.stock && product.stock !== "0";
    const stockHtml = isStock ? `<span class="in-stock">📦 ${product.stock} ks ihned</span>` : `<span class="out-stock">📝 Na zakázku</span>`;
    document.getElementById('modal-stock').innerHTML = stockHtml;
    const isSale = product.sale && product.sale !== "0";
    const finalPrice = isSale ? product.sale : product.price;
    const priceHtml = isSale ? `<span class="sale-price">${finalPrice}</span><span class="old-price">${product.price}</span>` : `<span>${finalPrice}</span>`;
    document.getElementById('modal-price').innerHTML = priceHtml;
    document.getElementById('modal-desc').innerHTML = product.desc || 'Žádný popis';
    document.getElementById('modal-ship').innerHTML = `<strong>Dodatečné info:</strong><br>${product.ship || 'Standardní doručení do 3-5 dnů'}`;
    updateModalImage();
    if (!CONFIG.Enable_Kosik) {
        document.getElementById('modal-order-btn').style.display = 'none';
        document.getElementById('modal-cart-btn').style.display = 'none';
        document.getElementById('modal-offer-btn').style.display = 'none';
    } else {
        document.getElementById('modal-order-btn').style.display = 'flex';
        document.getElementById('modal-cart-btn').style.display = 'flex';
        document.getElementById('modal-offer-btn').style.display = 'flex';
    }
    const orderBtn = document.getElementById('modal-order-btn');
    const cartBtn = document.getElementById('modal-cart-btn');
    const offerBtn = document.getElementById('modal-offer-btn');
    if (isStock) {
        orderBtn.innerHTML = '💰 Koupit teď';
        orderBtn.className = 'btn btn-main';
    } else {
        orderBtn.innerHTML = '📝 Objednat na zakázku';
        orderBtn.className = 'btn btn-main';
    }
    orderBtn.onclick = () => { window.orderProduct(idx); closeProductModal(); };
    cartBtn.onclick = (e) => { e.stopPropagation(); window.addToCart(idx, e); showToast("Přidáno do košíčku!", " 🛒 "); };
    if (!CONFIG.Enable_Kosik) {
        offerBtn.style.display = 'none';
    } else if (isSale) {
        offerBtn.style.display = 'none';
    } else {
        offerBtn.style.display = 'flex';
        offerBtn.innerHTML = '🏷️ Nabídnout vlastní cenu';
        offerBtn.onclick = () => { closeProductModal(); setTimeout(() => window.openOffer(idx), 100); };
    }
    const oldRatingsSection = document.querySelectorAll('[id^="modal-ratings-"]').forEach(el => el.remove());
    const modalBody = document.querySelector('#product-detail-modal .modal-product-info');
    if (modalBody) {
        const ratingsHtml = `
            <div class="modal-ratings" id="modal-ratings-${idx}" style="margin-top: 20px; padding-top: 15px; border-top: 1px solid var(--border);">
                <div class="modal-ratings-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4 style="color: var(--accent); margin: 0;">⭐ Hodnocení</h4>
                    <button id="add-rating-btn-${idx}" class="btn-small" style="background: var(--accent); color: white; border: none; padding: 5px 12px; border-radius: 10px; cursor: pointer;">➕ Přidat hodnocení</button>
                </div>
                <div id="ratings-list-${idx}" style="max-height: 200px; overflow-y: auto;">
                    <div style="text-align: center; padding: 20px; color: var(--text-dim);">Načítám hodnocení...</div>
                </div>
            </div>
        `;
        modalBody.insertAdjacentHTML('beforeend', ratingsHtml);
        loadRatingsToModal(product.id, idx);
        const addBtn = document.getElementById(`add-rating-btn-${idx}`);
        if (addBtn) addBtn.onclick = () => showRatingForm(product.id, idx);
    }
    const modal = document.getElementById('product-detail-modal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

window.closeProductModal = function() {
    const modal = document.getElementById('product-detail-modal');
    modal.style.display = 'none';
    document.body.style.overflow = '';
    currentModalProduct = null;
};

function updateModalImage() {
    if (!currentModalProduct) return;
    const img = document.getElementById('modal-main-img');
    const spinner = document.getElementById('modal-spinner');
    const counter = document.getElementById('modal-counter');
    const images = currentModalProduct.imgs;
    if (spinner) spinner.style.display = 'block';
    if (img) { img.style.opacity = '0'; img.src = images[currentModalImageIndex]; }
    if (counter) counter.innerText = `${currentModalImageIndex + 1} / ${images.length}`;
    const prevBtn = document.querySelector('.modal-slider-prev');
    const nextBtn = document.querySelector('.modal-slider-next');
    if (images.length <= 1) {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
    } else {
        if (prevBtn) prevBtn.style.display = 'flex';
        if (nextBtn) nextBtn.style.display = 'flex';
    }
    if (img) {
        img.onload = function() { if (spinner) spinner.style.display = 'none'; img.style.opacity = '1'; };
        if (img.complete) { if (spinner) spinner.style.display = 'none'; img.style.opacity = '1'; }
    }
}

window.modalPrevImage = function() {
    if (!currentModalProduct) return;
    currentModalImageIndex = (currentModalImageIndex - 1 + currentModalProduct.imgs.length) % currentModalProduct.imgs.length;
    updateModalImage();
};

window.modalNextImage = function() {
    if (!currentModalProduct) return;
    currentModalImageIndex = (currentModalImageIndex + 1) % currentModalProduct.imgs.length;
    updateModalImage();
};

window.toggleOver = function(idx, show) { if (show) window.openProductModal(idx); };

document.getElementById('shop')?.addEventListener('click', (e) => {
    if (e.target.closest('[data-action]')) return;
    if (e.target.closest('.nav-btn')) return;
    if (e.target.closest('.share-btn')) return;
    if (e.target.closest('.btn-cart-small')) return;
    if (e.target.closest('.btn-offer-small')) return;
    const card = e.target.closest('.product-card');
    if (card) { const idx = card.getAttribute('data-product-idx'); if (idx) window.openProductModal(parseInt(idx)); }
});

window.orderCart = () => {
    if (navigator.vibrate) navigator.vibrate(10);
    const message = generateCartWhatsAppMessage();
    if (message) { createWoodShavings({ target: document.querySelector('#cart-modal .btn-main') }); openWhatsApp(message); }
    else showToast("Váš košíček je prázdný, přidejte něco...", " 🪵 ");
};

window.shareCart = () => {
    const cartItems = getCartItems();
    if (cartItems.length === 0) { showToast("Košíček je prázdný, není co sdílet.", "🪵"); return; }
    let message = "🛒 Můj košík z Woodisek:\n\n";
    let totalSum = 0;
    cartItems.forEach(item => {
        const priceNum = parseInt(item.price.replace(/[^\d]/g, ''), 10) || 0;
        totalSum += priceNum * item.qty;
        message += `* ${item.qty}x ${item.name} - ${item.price}\n   Odkaz: ${CONFIG.BASE_URL}#${item.id}\n\n`;
    });
    message += `Celkem: ${totalSum > 0 ? totalSum.toLocaleString('cs-CZ') + ' Kč + poštovné' : ''}\n\nObjednat: ${CONFIG.BASE_URL}`;
    if (navigator.share) navigator.share({ title: 'Můj košík - Woodisek', text: message }).catch(() => copyToClipboard(message));
    else copyToClipboard(message);
};


window.showRatingForm = function(productId, idx) {
    const userId = localStorage.getItem('woodisek_userId');
    if (!userId) {
        import('./ui.js').then(ui => {
            window.closeProductModal();
            setTimeout(() => {
                window.showUserSection();
                ui.showToast("Přihlaste se pro přidání hodnocení", "🔒");
            }, 300);
        });
        return;
    }
    
    const container = document.getElementById(`ratings-list-${idx}`);
    if (!container) return;
    
    let selectedRating = 5;
    
    container.innerHTML = `
        <div style="padding: 15px; background: var(--bg); border-radius: 12px;">
            <div style="margin-bottom: 10px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Vaše hodnocení:</label>
                <div id="star-selector-${idx}" style="display: flex; gap: 8px; font-size: 32px; cursor: pointer;">
                    <span data-rating="1">☆</span>
                    <span data-rating="2">☆</span>
                    <span data-rating="3">☆</span>
                    <span data-rating="4">☆</span>
                    <span data-rating="5">☆</span>
                </div>
                <input type="hidden" id="selected-rating-${idx}" value="5">
            </div>
            <div style="margin-bottom: 15px;">
                <textarea id="rating-comment-${idx}" rows="2" maxlength="500" placeholder="Napište svůj komentář (max 500 znaků, volitelné)" style="width: 100%; padding: 12px; border-radius: 12px; border: 1px solid var(--border); background: var(--bg); color: var(--text); resize: vertical;"></textarea>
                <div style="display: flex; justify-content: flex-end; align-items: center; margin-top: 5px;">
                    <span id="char-counter-${idx}" style="font-size: 11px; color: var(--text-dim);">0 / 500 znaků</span>
                </div>
            </div>
            <div style="display: flex; gap: 12px;">
                <button onclick="window.submitRating('${productId}', ${idx})" class="btn-rating-submit">⭐ Odeslat hodnocení</button>
                <button onclick="window.loadRatingsToModal('${productId}', ${idx})" class="btn-rating-cancel">Zrušit</button>
            </div>
        </div>
    `;
    
    const stars = document.querySelectorAll(`#star-selector-${idx} span`);
    const ratingInput = document.getElementById(`selected-rating-${idx}`);
    
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
        
        star.addEventListener('mouseenter', () => updateStarsDisplay(ratingValue));
        star.addEventListener('mouseleave', () => updateStarsDisplay(selectedRating));
        star.addEventListener('click', () => {
            selectedRating = ratingValue;
            ratingInput.value = ratingValue;
            updateStarsDisplay(selectedRating);
        });
    });
    
    const textarea = document.getElementById(`rating-comment-${idx}`);
    const charCounter = document.getElementById(`char-counter-${idx}`);
    
    if (textarea && charCounter) {
        textarea.addEventListener('input', function() {
            const length = this.value.length;
            charCounter.innerText = `${length} / 500 znaků`;
            charCounter.style.color = length >= 490 ? '#ff6b00' : 'var(--text-dim)';
        });
    }
};


function copyToClipboard(text) { navigator.clipboard.writeText(text).then(() => showToast("Obsah košíku zkopírován do schránky! 📋", "📋")).catch(() => showToast("Nepodařilo se zkopírovat.", "❌")); }

window.scrollToAbout = () => {
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
        if (navigator.vibrate) navigator.vibrate(10);
        window.isInfiniteScrollDisabled = true;
        aboutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        aboutSection.classList.add('section-highlight');
        setTimeout(() => { aboutSection.classList.remove('section-highlight'); window.isInfiniteScrollDisabled = false; }, 2000);
    }
};

window.acceptGDPR = () => { acceptGDPR(); document.getElementById('gdpr-banner').style.display = 'none'; showToast("Děkuji za souhlas! 🍪", "✅"); updateCartBadge(); renderCart(); };
window.declineGDPR = () => { declineGDPR(); document.getElementById('gdpr-banner').style.display = 'none'; showToast("Košíček není ukládán. Pro uložení košíčku prosím přijměte cookies.", "🍪"); updateCartBadge(); renderCart(); };
window.toggleReviews = () => { const sidebar = document.getElementById('reviewsSidebar'); if (sidebar) sidebar.classList.toggle('active'); };
window.handleScroll = () => {
    const backToTopBtn = document.getElementById("back-to-top");
    const floatingCartBtn = document.getElementById("floating-cart-btn");
    const scrollY = window.scrollY;
    const SCROLL_THRESHOLD = 400;
    if (backToTopBtn) backToTopBtn.style.display = scrollY > SCROLL_THRESHOLD ? "flex" : "none";
    if (floatingCartBtn) { if (scrollY > SCROLL_THRESHOLD) floatingCartBtn.classList.add('show'); else floatingCartBtn.classList.remove('show'); }
    if (activeOverlayIdx !== null && Math.abs(scrollY - scrollStartPos) > 25) import('./ui.js').then(ui => ui.toggleOver(activeOverlayIdx, false));
};
window.toggleMode = () => {
    const isLight = document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    const modeBtn = document.getElementById('mode-toggle');
    if (modeBtn) modeBtn.innerText = isLight ? ' ☀️ ' : ' 🌙 ';
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute('content', isLight ? '#f5f2ed' : '#0d0d0d');
};
window.togglePriceFilter = () => {
    const panel = document.getElementById('price-filter-panel');
    if (navigator.vibrate) navigator.vibrate(10);
    if (panel) {
        if (panel.classList.contains('open')) { panel.classList.remove('open'); setTimeout(() => panel.style.display = 'none', 0); }
        else { panel.style.display = 'flex'; setTimeout(() => panel.classList.add('open'), 10); }
    }
};
window.toggleChatPanel = () => {
    const modal = document.getElementById('chat-modal');
    const bg = document.getElementById('chat-overlay-bg');
    const chatBtn = document.getElementById('chat-toggle-btn');
    if (!modal || !bg) return;
    if (modal.classList.contains('open')) {
        modal.classList.remove('open'); bg.style.display = 'none'; document.body.style.overflow = ''; if (chatBtn) chatBtn.style.display = 'flex';
    } else {
        modal.classList.add('open'); bg.style.display = 'block'; document.body.style.overflow = 'hidden'; if (chatBtn) chatBtn.style.display = 'none';
        if (window.initChat && document.getElementById('chat-body')?.children.length === 0) window.initChat();
    }
};
window.closeChatPanel = () => { const modal = document.getElementById('chat-modal'); const bg = document.getElementById('chat-overlay-bg'); const chatBtn = document.getElementById('chat-toggle-btn'); if (modal) modal.classList.remove('open'); if (bg) bg.style.display = 'none'; document.body.style.overflow = ''; if (chatBtn) chatBtn.style.display = 'flex'; };
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { const modal = document.getElementById('chat-modal'); if (modal && modal.classList.contains('open')) window.closeChatPanel(); } });
window.switchCategoryBySwipe = (direction) => { const filterButtons = Array.from(document.querySelectorAll('.f-btn')); if (filterButtons.length === 0) return; const activeButton = filterButtons.find(btn => btn.classList.contains('active')); let currentIndex = filterButtons.indexOf(activeButton); if (currentIndex === -1) currentIndex = 0; let newIndex = currentIndex + direction; if (newIndex < 0) newIndex = filterButtons.length - 1; if (newIndex >= filterButtons.length) newIndex = 0; const targetButton = filterButtons[newIndex]; if (targetButton) { const category = targetButton.getAttribute('data-cat') || targetButton.innerText; if (typeof window.filterDataFromUI === 'function') window.filterDataFromUI(category, targetButton); else if (typeof window.filterData === 'function') window.filterData(category, targetButton); else import('./ui.js').then(ui => ui.filterData(category, targetButton)); setTimeout(() => targetButton.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }), 50); } };
function updateCartBadge() { const badge = document.getElementById('cart-badge'); const floatingBadge = document.getElementById('floating-cart-badge'); const total = getCartTotalItems(); if (badge) { badge.innerText = total; badge.style.display = total > 0 ? 'flex' : 'none'; } if (floatingBadge) { floatingBadge.innerText = total; floatingBadge.style.display = total > 0 ? 'flex' : 'none'; } }
function renderCart() { const container = document.getElementById('cart-items-container'); if (!container) return; const cartItems = getCartItems(); const shippingPrice = getShippingPrice(); const shippingText = getShippingText(); let itemsHtml = ''; let totalSum = 0; if (cartItems.length === 0) { if (CONFIG.Enable_Empty_Cart_Message === false) itemsHtml = `<div class="cart-empty" style="min-height: 200px;"></div>`; else { const emptyText = CONFIG.Cart_Empty_Text || "Váš košíček je prázdný."; const emptyIcon = CONFIG.Cart_Empty_Icon || "🪵"; itemsHtml = `<div class="cart-empty"><span class="cart-empty-icon">${emptyIcon}</span><span class="cart-empty-text">${emptyText}</span></div>`; } } else { cartItems.forEach(item => { const priceNum = parseInt(item.price.replace(/[^\d]/g, ''), 10) || 0; totalSum += priceNum * item.qty; itemsHtml += `<div class="cart-item" data-id="${item.id}"><button class="cart-remove" onclick="window.handleRemoveFromCart('${item.id}')"> ✕ </button><img src="${item.img}"><div class="cart-item-info"><div class="cart-item-title">${item.name}</div><div class="st-line" style="margin: 2px 0;"><span class="${item.stock !== "0" ? 'st-ok' : 'st-none'}">${item.stock !== "0" ? item.stock + ' ks' : 'Na zakázku'}</span></div><div style="display: flex; justify-content: space-between; align-items: center;"><div class="cart-item-price">${item.price}</div><div class="cart-controls"><button class="qty-btn" onclick="window.handleChangeQty('${item.id}', -1)">-</button><span class="qty-val">${item.qty}</span><button class="qty-btn" onclick="window.handleChangeQty('${item.id}', 1)">+</button></div></div></div></div>`; }); } container.innerHTML = itemsHtml; const discountedTotal = window.getDiscountedTotal ? window.getDiscountedTotal() : totalSum; const totalWithShipping = discountedTotal + shippingPrice; const totalDisplay = totalWithShipping > 0 ? totalWithShipping.toLocaleString('cs-CZ') + ' Kč' : ''; const totalPriceEl = document.getElementById('cart-total-price'); if (totalPriceEl) totalPriceEl.innerText = totalDisplay; let shippingOptionsHtml = ''; if (CONFIG.ShippingOptions && CONFIG.ShippingOptions.length > 0) { shippingOptionsHtml = `<div class="cart-shipping-section"><div class="cart-shipping-header" onclick="toggleShippingDropdown()"><span>🚚 <strong id="selected-shipping-text">${shippingText}</strong></span><span class="shipping-dropdown-arrow">▼</span></div><div class="shipping-dropdown" id="shipping-dropdown" style="display: none;">`; CONFIG.ShippingOptions.forEach(opt => { const isSelected = selectedShipping && selectedShipping.id === opt.id; const priceText = opt.type === 'custom' ? 'Cena dle domluvy' : `${opt.price} Kč`; shippingOptionsHtml += `<div class="shipping-option ${isSelected ? 'selected' : ''}" onclick="selectShipping('${opt.id}')"><div class="shipping-option-info"><div class="shipping-option-name">${opt.name}</div><div class="shipping-option-price">${priceText}</div></div>${isSelected ? '<span class="shipping-option-check">✓</span>' : ''}</div>`; }); shippingOptionsHtml += `</div></div>`; } const footer = document.querySelector('.cart-footer'); if (footer) { const discountHtml = `<div class="discount-section" style="margin-bottom: 15px;"><div style="display: flex; gap: 10px;"><input type="text" id="discount-code" placeholder="Slevový kód" style="flex: 1; padding: 12px; border-radius: 12px; border: 1px solid var(--border); background: var(--bg); color: var(--text);"><button id="apply-discount-btn" class="btn btn-sec" style="padding: 12px 20px;" onclick="window.applyDiscount()">Uplatnit</button></div><div id="discount-message" style="font-size: 12px; margin-top: 8px;"></div></div>`; footer.innerHTML = `${shippingOptionsHtml}${discountHtml}<div class="cart-total"><span>Celkem včetně dopravy:</span><span id="cart-total-price-display">${totalDisplay}</span></div><button class="btn btn-main btn-pulse" onclick="orderCart()">${CONFIG.Cart_Button_Text}</button>`; } }
window.handleRemoveFromCart = function(id) { if (navigator.vibrate) navigator.vibrate(10); window.appliedDiscount = null; const discountInput = document.getElementById('discount-code'); const applyBtn = document.getElementById('apply-discount-btn'); if (discountInput) { discountInput.value = ''; discountInput.disabled = false; } if (applyBtn) applyBtn.disabled = false; const messageDiv = document.getElementById('discount-message'); if (messageDiv) messageDiv.innerHTML = ''; removeFromCartModule(id); renderCart(); updateCartBadge(); showToast("Položka odebrána z košíčku", "🗑️"); };
window.handleChangeQty = function(id, delta) { if (navigator.vibrate) navigator.vibrate(10); changeCartItemQty(id, delta); window.appliedDiscount = null; const discountInput = document.getElementById('discount-code'); const applyBtn = document.getElementById('apply-discount-btn'); if (discountInput) { discountInput.value = ''; discountInput.disabled = false; } if (applyBtn) applyBtn.disabled = false; const messageDiv = document.getElementById('discount-message'); if (messageDiv) messageDiv.innerHTML = ''; renderCart(); updateCartBadge(); };
setCartUpdateCallback(() => { updateCartBadge(); renderCart(); });
setCartBadgeCallback(updateCartBadge);
function applyTheme() { const savedTheme = localStorage.getItem('theme') || 'light'; if (savedTheme === 'light') { document.body.classList.add('light-mode'); const modeBtn = document.getElementById('mode-toggle'); if (modeBtn) modeBtn.innerText = ' ☀️ '; const themeColor = document.querySelector('meta[name="theme-color"]'); if (themeColor) themeColor.setAttribute('content', '#f5f2ed'); } else { document.body.classList.remove('light-mode'); const modeBtn = document.getElementById('mode-toggle'); if (modeBtn) modeBtn.innerText = ' 🌙 '; const themeColor = document.querySelector('meta[name="theme-color"]'); if (themeColor) themeColor.setAttribute('content', '#0d0d0d'); } }
window.toggleShippingDropdown = function() { if (navigator.vibrate) navigator.vibrate(10); const dropdown = document.getElementById('shipping-dropdown'); if (dropdown) dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block'; };
window.selectShipping = function(shippingId) { if (navigator.vibrate) navigator.vibrate(10); const success = setShipping(shippingId); if (success) { const shippingTextEl = document.getElementById('selected-shipping-text'); if (shippingTextEl) shippingTextEl.innerText = getShippingText(); const dropdown = document.getElementById('shipping-dropdown'); if (dropdown) dropdown.style.display = 'none'; renderCart(); showToast(`Doprava změněna`, "🚚"); } };
document.addEventListener('click', function(event) { const shippingSection = document.querySelector('.cart-shipping-section'); const dropdown = document.getElementById('shipping-dropdown'); if (shippingSection && dropdown && !shippingSection.contains(event.target)) dropdown.style.display = 'none'; });
window.showProfileTab = function(tab) { const profileContent = document.getElementById('profile-content'); const ordersContent = document.getElementById('orders-content'); const profileBtn = document.getElementById('tab-profile-btn'); const ordersBtn = document.getElementById('tab-orders-btn'); const newsletterSection = document.querySelector('.newsletter-section'); if (tab === 'profile') { profileContent.style.display = 'block'; ordersContent.style.display = 'none'; if (newsletterSection) newsletterSection.style.display = 'block'; profileBtn.style.color = 'var(--accent)'; ordersBtn.style.color = 'var(--text-dim)'; } else if (tab === 'orders') { profileContent.style.display = 'none'; ordersContent.style.display = 'block'; if (newsletterSection) newsletterSection.style.display = 'none'; ordersBtn.style.color = 'var(--accent)'; profileBtn.style.color = 'var(--text-dim)'; const now = Date.now(); const hasValidCache = cachedUserOrders && (now - lastOrdersFetch) < CACHE_TTL; if (!hasValidCache) window.loadUserOrders(true); else { const container = document.getElementById('orders-list-content'); const loaderOverlay = document.getElementById('orders-loader-overlay'); if (container && loaderOverlay) { loaderOverlay.style.display = 'none'; container.style.display = 'block'; renderUserOrders(cachedUserOrders, container); } } } };
window.loadUserOrders = async function(forceRefresh = false) { const userId = localStorage.getItem('woodisek_userId'); if (!userId) return; const now = Date.now(); const container = document.getElementById('orders-list-content'); const loaderOverlay = document.getElementById('orders-loader-overlay'); if (!container || !loaderOverlay) return; const loaderSteps = document.querySelectorAll('#orders-loader-overlay .loader-step'); const loaderText = document.querySelector('#orders-loader-overlay .loader-text'); const loaderSubtext = document.querySelector('#orders-loader-overlay .loader-subtext'); function updateLoaderStep(stepIndex, status) { const step = loaderSteps[stepIndex - 1]; if (step) { step.classList.remove('active', 'completed'); if (status === 'active') { step.classList.add('active'); step.querySelector('.step-dot').style.background = 'var(--accent)'; } else if (status === 'completed') { step.classList.add('completed'); step.querySelector('.step-dot').style.background = '#5b7c5d'; } } } function resetLoaderSteps() { loaderSteps.forEach(step => { step.classList.remove('active', 'completed'); step.querySelector('.step-dot').style.background = 'var(--text-dim)'; }); } if (!forceRefresh && cachedUserOrders && (now - lastOrdersFetch) < CACHE_TTL) { loaderOverlay.style.display = 'none'; container.style.display = 'block'; renderUserOrders(cachedUserOrders, container); return; } loaderOverlay.style.display = 'flex'; container.style.display = 'none'; resetLoaderSteps(); updateLoaderStep(1, 'active'); loaderText.innerText = 'Načítám objednávky'; loaderSubtext.innerText = 'Připojuji se k serveru'; let step1Done = false; setTimeout(() => { if (loaderOverlay.style.display === 'flex' && !step1Done) { updateLoaderStep(1, 'completed'); updateLoaderStep(2, 'active'); loaderSubtext.innerText = 'Stahuji vaše objednávky'; step1Done = true; } }, 400); try { const response = await fetch(`${CONFIG.APPS_SCRIPT_URL}?action=getOrders&userId=${encodeURIComponent(userId)}`); const data = await response.json(); updateLoaderStep(2, 'completed'); updateLoaderStep(3, 'active'); loaderSubtext.innerText = 'Zpracovávám data'; await new Promise(resolve => setTimeout(resolve, 250)); if (data.success && data.orders && data.orders.length > 0) { cachedUserOrders = data.orders; lastOrdersFetch = now; renderUserOrders(cachedUserOrders, container); } else { container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-dim);">📦 Zatím žádné objednávky</div>'; } updateLoaderStep(3, 'completed'); loaderText.innerText = 'Hotovo!'; loaderSubtext.innerText = 'Objednávky jsou načteny'; setTimeout(() => { loaderOverlay.style.display = 'none'; container.style.display = 'block'; }, 350); } catch (err) { loaderText.innerText = 'Chyba připojení'; loaderSubtext.innerText = 'Zkuste to prosím znovu'; setTimeout(() => { loaderOverlay.style.display = 'none'; container.style.display = 'block'; container.innerHTML = '<div style="text-align: center; padding: 40px; color: #dc2626;">❌ Nepodařilo se načíst objednávky<br><span style="font-size: 12px; margin-top: 10px; display: inline-block;">Zkuste obnovit stránku</span></div>'; }, 1200); } };
window.loadUserProfile = async function(userId, forceRefresh = false) { 
    if (!userId || userId === "" || userId === "null") { 
        console.log("loadUserProfile: userId neplatný, končím"); 
        return; 
    } 
    return new Promise(async (resolve, reject) => { 
        const now = Date.now(); 
        if (!forceRefresh && cachedUserProfile && (now - lastProfileFetch) < CACHE_TTL) { 
            renderUserProfile(cachedUserProfile); 
            resolve(); 
            return; 
        } 
        try { 
            const url = `${CONFIG.APPS_SCRIPT_URL}?action=getUser&userId=${encodeURIComponent(userId)}`; 
            const response = await fetch(url); 
            const data = await response.json(); 
            if (data.success) { 
                cachedUserProfile = data.user; 
                lastProfileFetch = now; 
                renderUserProfile(cachedUserProfile);
                
                // 🔥 Uložíme VŠECHNY údaje do sessionStorage pro rychlý přístup z cart.js
                if (data.user) {
                    if (data.user.name) {
                        sessionStorage.setItem('woodisek_user_name', data.user.name);
                    }
                    if (data.user.phone) {
                        sessionStorage.setItem('woodisek_user_phone', data.user.phone);
                    }
                    if (data.user.email) {
                        sessionStorage.setItem('woodisek_user_email', data.user.email);
                    }
                    if (data.user.address) {
                        sessionStorage.setItem('woodisek_user_address', data.user.address);
                    }
                }
                
                resolve(); 
            } else { 
                import('./ui.js').then(ui => ui.showToast(data.error || "Chyba načtení profilu", "❌")); 
                reject(data.error); 
            } 
        } catch (err) { 
            import('./ui.js').then(ui => ui.showToast("Chyba připojení", "❌")); 
            reject(err); 
        } 
    }); 
};
function renderUserProfile(user) { const profileHtml = `<div class="form-group" style="margin-bottom:15px;"><label style="display:block; margin-bottom:8px; font-size:14px; font-weight:600; color:var(--text-dim);">👤 Jméno</label><input type="text" id="profile-name" value="${escapeHtml(user.name)}" style="width:100%; padding:14px; border-radius:12px; border:1px solid var(--border); background:var(--bg); color:var(--text); outline:none;"></div><div class="form-group" style="margin-bottom:15px;"><label style="display:block; margin-bottom:8px; font-size:14px; font-weight:600; color:var(--text-dim);">📧 Email</label><input type="email" id="profile-email" value="${escapeHtml(user.email)}" readonly style="width:100%; padding:14px; border-radius:12px; border:1px solid var(--border); background:var(--bg); color:var(--text); opacity:0.6; outline:none;"></div><div class="form-group" style="margin-bottom:15px;"><label style="display:block; margin-bottom:8px; font-size:14px; font-weight:600; color:var(--text-dim);">📞 Telefon</label><input type="tel" id="profile-phone" value="${escapeHtml(user.phone || '')}" placeholder="+420 123 456 789" style="width:100%; padding:14px; border-radius:12px; border:1px solid var(--border); background:var(--bg); color:var(--text); outline:none;"></div><div class="form-group" style="margin-bottom:25px;"><label style="display:block; margin-bottom:8px; font-size:14px; font-weight:600; color:var(--text-dim);">🏠 Adresa</label><textarea id="profile-address" rows="3" placeholder="Zásilkovna / Ulice 123, Město, PSČ" style="width:100%; padding:14px; border-radius:12px; border:1px solid var(--border); background:var(--bg); color:var(--text); resize:none; outline:none; font-family:inherit;">${escapeHtml(user.address || '')}</textarea></div><button onclick="window.updateUserProfile()" class="btn btn-main" style="width:100%; padding: 0px; border-radius: 12px; font-weight: bold; cursor: pointer;">💾 Uložit změny</button>`; document.getElementById('user-profile-content').innerHTML = profileHtml; document.getElementById('user-login-form').style.display = 'none'; document.getElementById('user-register-form').style.display = 'none'; document.getElementById('user-forgot-form').style.display = 'none'; document.getElementById('user-profile').style.display = 'block'; setTimeout(() => window.checkNewsletterStatus(), 200); }
function renderUserOrders(orders, container) { let html = ''; orders.forEach(order => { let statusColor = '#94a3b8'; const statusLower = order.status ? order.status.toLowerCase() : ''; if (statusLower === 'nová') statusColor = '#f59e0b'; if (statusLower === 'odeslána') statusColor = '#10b981'; if (statusLower === 'zrušena') statusColor = '#ef4444'; const orderDate = new Date(order.date).toLocaleDateString('cs-CZ'); let itemsHtml = ''; if (order.items && order.items.length > 0) { itemsHtml = '<div style="margin-top: 15px; border-top: 1px solid var(--border); padding-top: 10px; display: flex; flex-direction: column; gap: 12px;">'; order.items.forEach(item => { itemsHtml += `<div style="display: flex; gap: 12px; align-items: center; cursor: pointer;" onclick="window.showProductsAndResetFilter ? window.showProductsAndResetFilter() : window.showProducts();"><img src="${item.img}" style="width: 70px; height: 70px; border-radius: 6px; object-fit: cover; border: 1px solid var(--border); flex-shrink: 0;"><div style="flex: 1; min-width: 0;"><div style="font-size: 13px; font-weight: 600; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.name}</div><div style="font-size: 11px; color: var(--text-dim);">Kód: <strong>${item.id}</strong> | ${item.qty}x ${item.price}</div></div></div>`; }); itemsHtml += '</div>'; } html += `<div style="margin-bottom: 25px;"><div style="font-size: 11px; color: var(--text-dim); font-weight: 700; margin-bottom: 6px; margin-left: 4px; text-transform: uppercase; letter-spacing: 0.5px;">${orderDate}</div><div style="background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 15px; position: relative;"><div style="display: flex; justify-content: space-between; align-items: flex-start;"><div><div style="font-weight: 700; font-size: 14px; color: var(--text);">📦 ${order.orderId}</div></div><div style="text-align: right;"><div style="padding: 3px 10px; border-radius: 10px; font-size: 10px; font-weight: 800; background: ${statusColor}20; color: ${statusColor}; border: 1px solid ${statusColor}40; display: inline-block; text-transform: uppercase;">${order.status}</div></div></div><div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;"><div style="font-size: 13px; color: var(--text-dim);">🚚 ${order.shipping || 'Doprava'}</div><div style="font-size: 15px; font-weight: 700; color: var(--text);">${order.total} Kč</div></div>${itemsHtml}</div></div>`; }); container.innerHTML = html || '<p style="text-align:center; color:var(--text-dim); padding: 20px;">Zatím žádné objednávky.</p>'; }
function handleHashScroll() { const hash = window.location.hash.substring(1); if (!hash) return; const tryScroll = () => { const targetEl = document.getElementById(hash); if (targetEl) { targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); const originalShadow = targetEl.style.boxShadow; targetEl.style.transition = "box-shadow 0.5s ease"; targetEl.style.boxShadow = "0 0 20px var(--accent)"; setTimeout(() => targetEl.style.boxShadow = originalShadow, 2000); return true; } return false; }; if (tryScroll()) return; let attempts = 0; const maxAttempts = 40; const forceLoadInterval = setInterval(() => { attempts++; window.scrollTo(0, document.body.scrollHeight); if (tryScroll()) clearInterval(forceLoadInterval); else if (attempts >= maxAttempts) { clearInterval(forceLoadInterval); window.scrollTo({ top: 0, behavior: 'smooth' }); } }, 200); }
document.getElementById('shop')?.addEventListener('click', (e) => { const target = e.target.closest('[data-action]'); if (!target) return; const action = target.getAttribute('data-action'); const idx = target.getAttribute('data-idx'); const productId = target.getAttribute('data-id'); const productName = target.getAttribute('data-name'); if (navigator.vibrate) navigator.vibrate(10); switch(action) { case 'add-to-cart': if (idx) window.addToCart(parseInt(idx), e); break; case 'order-product': if (idx) window.orderProduct(parseInt(idx), e); break; case 'show-details': if (idx) window.toggleOver(parseInt(idx), true); break; case 'close-details': if (idx) window.toggleOver(parseInt(idx), false); break; case 'open-offer': if (idx) window.openOffer(parseInt(idx)); break; case 'open-gallery': if (idx) window.openGal(parseInt(idx)); break; case 'share-product': if (productId && productName) window.shareProduct(productId, productName, e); break; case 'prev-image': if (idx) window.chImg(parseInt(idx), -1, e); e.stopPropagation(); break; case 'next-image': if (idx) window.chImg(parseInt(idx), 1, e); e.stopPropagation(); break; } });
const originalToggleOver = window.toggleOver; window.toggleOver = function(idx, show) { const p = allProducts?.find(x => x.idx === idx); if (!p) return; const card = document.getElementById(p.id); if (!card) { setTimeout(() => window.toggleOver(idx, show), 100); return; } originalToggleOver(idx, show); };
window.addEventListener('load', handleHashScroll); window.addEventListener('hashchange', handleHashScroll);
function applyTextsFromSettings() { const logoImg = document.getElementById('about-logo'); if (logoImg) logoImg.src = CONFIG.Logo_URL; if (CONFIG.Show_Contact_Section) { let contactSection = document.getElementById('contact-section'); if (!contactSection) { const aboutDiv = document.getElementById('about'); if (aboutDiv) { const portfolioSection = document.getElementById('portfolio-container'); contactSection = document.createElement('div'); contactSection.id = 'contact-section'; contactSection.className = 'contact-section'; contactSection.style.cssText = 'margin-top: 50px; padding: 20px; background: var(--card); border-radius: var(--border-radius); border: 1px solid var(--border);'; contactSection.innerHTML = `<h3 style="color: var(--accent); margin-bottom: 15px; font-size: 16px;">📞 Kontakt</h3><div class="contact-links" style="display: flex; flex-direction: column; gap: 12px;">${CONFIG.Contact_Phone ? `<a href="tel:+${CONFIG.Contact_Phone}" class="contact-link" style="display: flex; align-items: center; gap: 10px; color: var(--text); text-decoration: none; padding: 8px; background: #1a1a1a0a; border-radius: 12px;"><span>📱</span> ${formatPhoneNumber(CONFIG.Contact_Phone)}</a>` : ''}${CONFIG.Contact_WhatsApp ? `<a href="https://wa.me/${CONFIG.Contact_WhatsApp}" target="_blank" class="contact-link" style="display: flex; align-items: center; gap: 10px; color: var(--text); text-decoration: none; padding: 8px; background: #1a1a1a0a; border-radius: 12px;"><span>💬</span> WhatsApp</a>` : ''}${CONFIG.Contact_Email ? `<a href="mailto:${CONFIG.Contact_Email}" class="contact-link" style="display: flex; align-items: center; gap: 10px; color: var(--text); text-decoration: none; padding: 8px; background: #1a1a1a0a; border-radius: 12px;"><span>📧</span> ${CONFIG.Contact_Email}</a>` : ''}</div>`; if (portfolioSection) portfolioSection.insertAdjacentElement('afterend', contactSection); else aboutDiv.appendChild(contactSection); } } else { contactSection.innerHTML = `<h3 style="color: var(--accent); margin-bottom: 15px; font-size: 16px;">📞 Kontakt</h3><div class="contact-links" style="display: flex; flex-direction: column; gap: 12px;">${CONFIG.Contact_Phone ? `<a href="tel:+${CONFIG.Contact_Phone}" class="contact-link" style="display: flex; align-items: center; gap: 10px; color: var(--text); text-decoration: none; padding: 8px; background: #1a1a1a0a; border-radius: 12px;"><span>📱</span> ${formatPhoneNumber(CONFIG.Contact_Phone)}</a>` : ''}${CONFIG.Contact_WhatsApp ? `<a href="https://wa.me/${CONFIG.Contact_WhatsApp}" target="_blank" class="contact-link" style="display: flex; align-items: center; gap: 10px; color: var(--text); text-decoration: none; padding: 8px; background: #1a1a1a0a; border-radius: 12px;"><span>💬</span> WhatsApp</a>` : ''}${CONFIG.Contact_Email ? `<a href="mailto:${CONFIG.Contact_Email}" class="contact-link" style="display: flex; align-items: center; gap: 10px; color: var(--text); text-decoration: none; padding: 8px; background: #1a1a1a0a; border-radius: 12px;"><span>📧</span> ${CONFIG.Contact_Email}</a>` : ''}</div>`; } } else { const contactSection = document.getElementById('contact-section'); if (contactSection) contactSection.style.display = 'none'; } const logoText = document.querySelector('.logo'); if (logoText) logoText.innerText = CONFIG.Nazev_Firmy; const aboutTitle = document.getElementById('about-title'); const aboutText = document.getElementById('about-text'); const customTitle = document.getElementById('custom-title'); const customText = document.getElementById('custom-text'); const customBtn = document.getElementById('custom-wa-btn'); const cartTitle = document.getElementById('cart-title'); if (cartTitle) cartTitle.innerHTML = CONFIG.Cart_Title; if (aboutTitle) aboutTitle.innerText = CONFIG.About_Titulek; const chatBtn = document.getElementById('chat-toggle-btn'); if (chatBtn) chatBtn.style.display = CONFIG.Enable_Chat ? 'flex' : 'none'; if (aboutText) { let formattedText = CONFIG.About_Text; if (formattedText) aboutText.innerHTML = formattedText.replace(/\n/g, '<br>'); } const productsBtn = document.getElementById('nav-products-btn'); const blogBtn = document.getElementById('nav-blog-btn'); const aboutBtn = document.getElementById('nav-about-btn'); if (productsBtn && CONFIG.Menu_Button_Text_Products) productsBtn.innerHTML = CONFIG.Menu_Button_Text_Products; if (blogBtn && CONFIG.Menu_Button_Text_Blog) blogBtn.innerHTML = CONFIG.Menu_Button_Text_Blog; if (aboutBtn && CONFIG.Menu_Button_Text_About) aboutBtn.innerHTML = CONFIG.Menu_Button_Text_About; const blogBtnNav = document.getElementById('nav-blog-btn'); const aboutBtnNav = document.getElementById('nav-about-btn'); if (blogBtnNav) blogBtnNav.style.display = CONFIG.Show_Blog ? 'flex' : 'none'; if (aboutBtnNav) aboutBtnNav.style.display = CONFIG.Show_About ? 'flex' : 'none'; if (CONFIG.Favicon_URL) { const favicon = document.querySelector('link[rel="icon"]'); if (favicon) favicon.href = CONFIG.Favicon_URL; } if (CONFIG.Meta_Description) { const metaDesc = document.querySelector('meta[name="description"]'); if (metaDesc) metaDesc.setAttribute('content', CONFIG.Meta_Description); const ogDesc = document.querySelector('meta[property="og:description"]'); if (ogDesc) ogDesc.setAttribute('content', CONFIG.Meta_Description); const twitterDesc = document.querySelector('meta[name="twitter:description"]'); if (twitterDesc) twitterDesc.setAttribute('content', CONFIG.Meta_Description.substring(0, 200)); } if (CONFIG.OG_Image_URL) { const ogImage = document.querySelector('meta[property="og:image"]'); if (ogImage) ogImage.setAttribute('content', CONFIG.OG_Image_URL); const twitterImage = document.querySelector('meta[name="twitter:image"]'); if (twitterImage) twitterImage.setAttribute('content', CONFIG.OG_Image_URL); } const gdprText = document.getElementById('gdpr-banner-text'); if (gdprText && CONFIG.GDPR_Banner_Text) gdprText.innerHTML = CONFIG.GDPR_Banner_Text; const reviewsPanelText = document.getElementById('reviews-panel-text'); if (reviewsPanelText && CONFIG.Reviews_Panel_Text) reviewsPanelText.innerHTML = CONFIG.Reviews_Panel_Text; const reviewsBtnText = document.getElementById('reviews-btn-text'); if (reviewsBtnText && CONFIG.Reviews_Button_Text) reviewsBtnText.innerText = CONFIG.Reviews_Button_Text; const blogTitleText = document.getElementById('blog-title-text'); if (blogTitleText && CONFIG.Blog_Title) blogTitleText.innerHTML = CONFIG.Blog_Title; const offerBtnText = document.getElementById('offer-btn-text'); if (offerBtnText && CONFIG.Offer_Button_Text) offerBtnText.innerText = CONFIG.Offer_Button_Text; const productCountEl = document.getElementById("product-count"); if (productCountEl && allProducts) productCountEl.innerHTML = `${allProducts.length} ${CONFIG.Product_Count_Text || "🪵 produktů"}`; if (customTitle) customTitle.innerText = CONFIG.Zakazkova_Tvorba_Titulek; if (customText) customText.innerText = CONFIG.Zakazkova_Tvorba_Text; if (customBtn) { customBtn.innerText = CONFIG.Custom_Order_Button_Text; customBtn.onclick = () => { const message = encodeURIComponent(CONFIG.Custom_Order_Message); window.open(`https://wa.me/${CONFIG.WhatsApp_Cislo_Zakazka}?text=${message}`); }; } const footer = document.querySelector('footer'); if (footer) footer.innerText = CONFIG.Footer_Text; window.openQrZoom = function() { const gal = document.getElementById("gal"); const galImg = document.getElementById("galImg"); const galPrev = document.getElementById("galPrev"); const galNext = document.getElementById("galNext"); if (gal && galImg) { galImg.src = CONFIG.QR_CODE_URL; gal.style.display = "flex"; galImg.style.pointerEvents = "none"; if (galPrev) galPrev.style.display = "none"; if (galNext) galNext.style.display = "none"; } }; }
function addQuickTapAnimation(selector) { document.querySelectorAll(selector).forEach(btn => { if (btn.hasAttribute('data-quick-animation')) return; btn.setAttribute('data-quick-animation', 'true'); btn.addEventListener('mousedown', function() { this.style.transform = 'scale(0.92)'; }); btn.addEventListener('mouseup', function() { this.style.transform = ''; }); btn.addEventListener('mouseleave', function() { this.style.transform = ''; }); btn.addEventListener('touchstart', function() { this.style.transform = 'scale(0.92)'; }); btn.addEventListener('touchend', function() { this.style.transform = ''; }); btn.addEventListener('touchcancel', function() { this.style.transform = ''; }); }); }
function initQuickAnimations() { ['.btn-offer-small', '.btn-cart-small', '.btn.btn-main', '.btn.btn-sec', '#modal-order-btn', '#modal-cart-btn', '#modal-offer-btn', '#custom-wa-btn', '.btn.btn-main.btn-pulse', '.share-cart-btn'].forEach(selector => addQuickTapAnimation(selector)); }
document.addEventListener('DOMContentLoaded', initQuickAnimations); new MutationObserver(() => initQuickAnimations()).observe(document.body, { childList: true, subtree: true });
async function init() { if (window.skipNormalInit) return; const urlTheme = new URLSearchParams(window.location.search).get('theme'); if (urlTheme === 'light') { localStorage.setItem('theme', 'light'); window.history.replaceState({}, document.title, window.location.pathname); } applyTheme(); showGDPRBannerIfNeeded(); await loadBlogPosts(); renderBlogPosts(); await loadSettings(); applyTextsFromSettings(); updateNavButtonsVisibility(); handleHashScroll(); if (CONFIG.Maintenance_Mode === true) { showMaintenanceMode(); return; } if (CONFIG.PortfolioImages && Array.isArray(CONFIG.PortfolioImages) && CONFIG.PortfolioImages.length > 0) { portfolioImages.length = 0; CONFIG.PortfolioImages.forEach(img => portfolioImages.push(img)); } else if (typeof CONFIG.PortfolioImages === 'string' && CONFIG.PortfolioImages) { const images = CONFIG.PortfolioImages.match(/https?:\/\/[^\s,;"']+/g) || []; portfolioImages.length = 0; images.forEach(img => portfolioImages.push(img)); } handleHashScroll(); initGDPR(); initShipping(); initPortfolio(); initGlobalSwipeDetection((direction) => window.switchCategoryBySwipe(direction)); initSocialProof(); if (CONFIG.Enable_Shop === false) { const searchContainer = document.querySelector(".search-container"); if (searchContainer) searchContainer.style.display = "block"; const filtersContainer = document.getElementById("filters"); if (filtersContainer) filtersContainer.style.display = "flex"; const priceFilterBtn = document.getElementById("price-filter-toggle"); if (priceFilterBtn) priceFilterBtn.style.display = "flex"; const productCountEl = document.getElementById("product-count"); if (productCountEl) { productCountEl.style.display = 'block'; productCountEl.innerHTML = '🪵 Obchod je dočasně zavřený...'; } const shopContainer = document.getElementById("shop"); if (shopContainer) { shopContainer.innerHTML = ""; shopContainer.style.display = 'grid'; shopContainer.innerHTML = `<div class="product-card" style="grid-column: 1 / -1; display: flex; align-items: center; justify-content: center; min-height: 300px; cursor: default; transform: none !important; transition: none !important; box-shadow: none !important; outline: none !important; border: none !important;"><div style="text-align: center; padding: 40px;"><div class="shop-closed-icon" style="font-size: 64px; margin-bottom: 20px; display: inline-block;">🪵</div><h3 class="shop-closed-title" style="color: var(--accent); margin-bottom: 10px; font-size: 24px;">Obchod je dočasně zavřený</h3><p style="color: var(--text-dim); font-size: 16px;">Brzy tu bude veselo!</p></div></div>`; } const cartIconBtn = document.querySelector('.header-actions .icon-btn'); if (cartIconBtn) cartIconBtn.style.display = 'flex'; const floatingCartBtn = document.getElementById("floating-cart-btn"); if (floatingCartBtn) floatingCartBtn.style.display = 'flex'; initPortfolio(); return; } const shopContainer = document.getElementById("shop"); try { const data = await initProducts(); if (shopContainer) shopContainer.innerHTML = ""; if (!data || data.length === 0) return; if (CONFIG.PortfolioImages && Array.isArray(CONFIG.PortfolioImages) && CONFIG.PortfolioImages.length > 0) { portfolioImages.length = 0; CONFIG.PortfolioImages.forEach(img => portfolioImages.push(img)); } renderFilters(); applyFilters(); handleHashScroll(); initInfiniteScroll(); } catch (error) { if (shopContainer) shopContainer.innerHTML = "<p style='text-align:center; padding:50px;'>Omlouváme se, nepodařilo se načíst produkty. Zkuste prosím stránku obnovit.</p>"; } renderCart(); updateCartBadge(); setTimeout(() => handleHashScroll(), 500); }
document.addEventListener('DOMContentLoaded', () => { init(); window.addEventListener('load', () => setTimeout(() => handleHashScroll(), 1500)); });
document.addEventListener('click', (event) => { const sidebar = document.getElementById('reviewsSidebar'); if (sidebar && !sidebar.contains(event.target) && sidebar.classList.contains('active')) sidebar.classList.remove('active'); });
document.getElementById("galImg")?.addEventListener("load", function() { const spinner = document.getElementById("gal-spinner"); if (spinner) spinner.style.display = "none"; this.style.opacity = "1"; });
function initAnimatedPlaceholder() { const searchInput = document.getElementById('search-input'); if (!searchInput) { setTimeout(initAnimatedPlaceholder, 500); return; } const phrases = ["Co si vyrobíme ??", "Téměř každý výrobek lze personalizovat !!", "Zakázková výroba ??", "Výrobky lze vyrobit i ve větších nebo menších velikostech !!", "Zboží skladem - ihned k odeslání !!", "Hledáte dárek ??", "Přívěsek na klíče ??", "Jmenovka na dveře ??", "Dřevěný obraz ??", "Podtácky na víno ??", "Fotka do dřeva ??", "Dárek pro blízké ??", "Gravírované pero ??", "Cedule na chalupu ??", "Doprava Zásilkovnou ??", "Vánoční dekorace ??",]; let phraseIndex = 0; let charIndex = 0; let isDeleting = false; let currentText = ''; function animatePlaceholder() { const currentPhrase = phrases[phraseIndex]; if (isDeleting) { currentText = currentPhrase.substring(0, charIndex - 1); charIndex--; if (charIndex === 0) { isDeleting = false; phraseIndex = (phraseIndex + 1) % phrases.length; searchInput.placeholder = ""; setTimeout(animatePlaceholder, 300); return; } } else { currentText = currentPhrase.substring(0, charIndex + 1); charIndex++; if (charIndex === currentPhrase.length) { isDeleting = true; setTimeout(animatePlaceholder, 2000); return; } } searchInput.placeholder = currentText; setTimeout(animatePlaceholder, isDeleting ? 60 : 100); } searchInput.placeholder = "Hledej dřevěné dárky..."; setTimeout(animatePlaceholder, 1000); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAnimatedPlaceholder); else initAnimatedPlaceholder();
function initStatsFlip() { const cards = document.querySelectorAll('.stats-flip-card'); if (cards.length === 0) return; let currentIndex = 0; function flipCard(index) { cards.forEach(card => card.classList.remove('flipped')); if (cards[index]) cards[index].classList.add('flipped'); } function flipNext() { currentIndex = (currentIndex + 1) % cards.length; flipCard(currentIndex); } setInterval(flipNext, 2000); cards.forEach((card, idx) => card.addEventListener('mouseenter', () => { flipCard(idx); currentIndex = idx; })); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initStatsFlip); else initStatsFlip();
function escapeHtml(unsafe) { return (unsafe || "").toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }

// ============================================================
// CLOUDFLARE TURNSTILE
// ============================================================
let turnstileWidgets = { login: null, register: null, forgot: null };
window.initLoginTurnstile = function() { const container = document.getElementById('login-turnstile-container'); const placeholder = document.getElementById('login-recaptcha-placeholder'); if (!container || !placeholder) return;  if (container.parentNode !== placeholder) { placeholder.innerHTML = ''; placeholder.appendChild(container); } if (turnstileWidgets.login) { turnstile.reset(turnstileWidgets.login); return; } turnstileWidgets.login = turnstile.render(container, { sitekey: '0x4AAAAAAC6qi8ceRKAigUhk', callback: function(token) { container.setAttribute('data-turnstile-token', token); }, 'expired-callback': function() { container.removeAttribute('data-turnstile-token'); } }); };
window.initRegisterTurnstile = function() { const container = document.getElementById('register-turnstile-container'); const placeholder = document.getElementById('register-recaptcha-placeholder'); if (!container || !placeholder) return; if (container.parentNode !== placeholder) { placeholder.innerHTML = ''; placeholder.appendChild(container); } if (turnstileWidgets.register) { turnstile.reset(turnstileWidgets.register); return; } turnstileWidgets.register = turnstile.render(container, { sitekey: '0x4AAAAAAC6qi8ceRKAigUhk', callback: function(token) { container.setAttribute('data-turnstile-token', token); }, 'expired-callback': function() { container.removeAttribute('data-turnstile-token'); } }); };
window.initForgotTurnstile = function() { const container = document.getElementById('forgot-turnstile-container'); const placeholder = document.getElementById('forgot-recaptcha-placeholder'); if (!container || !placeholder) return; if (container.parentNode !== placeholder) { placeholder.innerHTML = ''; placeholder.appendChild(container); } if (turnstileWidgets.forgot) { turnstile.reset(turnstileWidgets.forgot); return; } turnstileWidgets.forgot = turnstile.render(container, { sitekey: '0x4AAAAAAC6qi8ceRKAigUhk', callback: function(token) { container.setAttribute('data-turnstile-token', token); }, 'expired-callback': function() { container.removeAttribute('data-turnstile-token'); } }); };
function getLoginTurnstileToken() { const container = document.getElementById('login-turnstile-container'); return container?.getAttribute('data-turnstile-token') || ''; }
function getRegisterTurnstileToken() { const container = document.getElementById('register-turnstile-container'); return container?.getAttribute('data-turnstile-token') || ''; }
function getForgotTurnstileToken() { const container = document.getElementById('forgot-turnstile-container'); return container?.getAttribute('data-turnstile-token') || ''; }
function resetLoginTurnstile() { if (turnstileWidgets.login) { turnstile.reset(turnstileWidgets.login); const container = document.getElementById('login-turnstile-container'); if (container) container.removeAttribute('data-turnstile-token'); } }
function resetRegisterTurnstile() { if (turnstileWidgets.register) { turnstile.reset(turnstileWidgets.register); const container = document.getElementById('register-turnstile-container'); if (container) container.removeAttribute('data-turnstile-token'); } }
function resetForgotTurnstile() { if (turnstileWidgets.forgot) { turnstile.reset(turnstileWidgets.forgot); const container = document.getElementById('forgot-turnstile-container'); if (container) container.removeAttribute('data-turnstile-token'); } }
window.showLoginForm = function() { document.querySelectorAll('.global-overlay').forEach(overlay => overlay.style.display = 'none'); document.getElementById('user-login-form').style.display = 'block'; document.getElementById('user-register-form').style.display = 'none'; document.getElementById('user-forgot-form').style.display = 'none'; document.getElementById('user-profile').style.display = 'none'; setTimeout(() => window.initLoginTurnstile(), 100); };
window.showRegisterForm = function() { document.querySelectorAll('.global-overlay').forEach(overlay => overlay.style.display = 'none'); document.getElementById('user-login-form').style.display = 'none'; document.getElementById('user-register-form').style.display = 'block'; document.getElementById('user-forgot-form').style.display = 'none'; document.getElementById('user-profile').style.display = 'none'; setTimeout(() => window.initRegisterTurnstile(), 100); };
window.showForgotPassword = function() { document.querySelectorAll('.global-overlay').forEach(overlay => overlay.style.display = 'none'); document.getElementById('user-login-form').style.display = 'none'; document.getElementById('user-register-form').style.display = 'none'; document.getElementById('user-forgot-form').style.display = 'block'; document.getElementById('user-profile').style.display = 'none'; setTimeout(() => window.initForgotTurnstile(), 100); };
window.loginUser = async function() { const email = document.getElementById('login-email').value; const password = document.getElementById('login-password').value; const turnstileToken = getLoginTurnstileToken(); if (!turnstileToken || turnstileToken.length === 0) { import('./ui.js').then(ui => ui.showToast("Potvrďte, že jste člověk", "🤖")); return; } const loaderOverlay = document.getElementById('login-loader-overlay'); const loaderText = document.getElementById('login-loader-text'); const loaderSubtext = document.getElementById('login-loader-subtext'); const loaderSteps = document.querySelectorAll('#login-loader-steps .loader-step'); function updateLoaderStep(stepIndex, status) { const step = loaderSteps[stepIndex - 1]; if (step) { step.classList.remove('active', 'completed'); if (status === 'active') { step.classList.add('active'); const dot = step.querySelector('.step-dot'); if (dot) dot.style.background = 'var(--accent)'; } else if (status === 'completed') { step.classList.add('completed'); const dot = step.querySelector('.step-dot'); if (dot) dot.style.background = '#5b7c5d'; } } } function resetLoaderSteps() { loaderSteps.forEach(step => { step.classList.remove('active', 'completed'); const dot = step.querySelector('.step-dot'); if (dot) dot.style.background = 'var(--text-dim)'; }); } if (!email || !password) { import('./ui.js').then(ui => ui.showToast("Zadejte email a heslo", "❌")); return; } loaderOverlay.style.display = 'flex'; resetLoaderSteps(); updateLoaderStep(1, 'active'); loaderText.innerText = 'Přihlašování...'; loaderSubtext.innerText = 'Odesílám požadavek na server'; let step1Completed = false; setTimeout(() => { if (loaderOverlay.style.display === 'flex' && !step1Completed) { updateLoaderStep(1, 'completed'); updateLoaderStep(2, 'active'); loaderSubtext.innerText = 'Ověřuji přihlašovací údaje'; step1Completed = true; } }, 600); let success = false; let userData = null; try { const response = await fetch(`${CONFIG.APPS_SCRIPT_URL}?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&turnstile=${turnstileToken}`); const data = await response.json(); updateLoaderStep(2, 'completed'); updateLoaderStep(3, 'active'); loaderSubtext.innerText = 'Načítám váš profil'; if (data.success) { resetLoginTurnstile(); renderCart(); localStorage.setItem('woodisek_token', data.token); localStorage.setItem('woodisek_userId', data.userId); localStorage.setItem('woodisek_user', JSON.stringify(data.user)); success = true; userData = data; } else { setTimeout(() => { loaderOverlay.style.display = 'none'; import('./ui.js').then(ui => ui.showToast(data.error || "Špatné jméno nebo heslo", "❌")); }, 500); return; } } catch (err) { setTimeout(() => { loaderOverlay.style.display = 'none'; import('./ui.js').then(ui => ui.showToast("Chyba připojení", "❌")); }, 500); return; } if (success && userData) { loaderText.innerText = 'Načítám profil...'; loaderSubtext.innerText = 'Připravuji uživatelské prostředí'; await window.loadUserProfile(userData.userId, true); setTimeout(() => { loaderOverlay.style.display = 'none'; if (loginForm) loginForm.style.display = 'none'; const profileSection = document.getElementById('user-profile'); if (profileSection) profileSection.style.display = 'block'; import('./ui.js').then(ui => ui.showToast("Vítejte zpět! 🪵", "👋")); }, 400); } };
window.hideLoginLoader = function() { const loaderOverlay = document.getElementById('login-loader-overlay'); if (loaderOverlay) loaderOverlay.style.display = 'none'; };
window.showUserSection = async function() { window.isInfiniteScrollDisabled = true; const shop = document.getElementById('shop'); const blogSection = document.getElementById('blog-section'); const aboutSection = document.getElementById('about'); const searchContainer = document.querySelector('.search-container'); const filters = document.getElementById('filters'); const productCount = document.getElementById('product-count'); const priceFilterToggle = document.getElementById('price-filter-toggle'); const cartBtn = document.querySelector('.icon-btn'); const portfolioSection = document.getElementById('portfolio-container'); if (shop) shop.style.display = 'none'; if (searchContainer) searchContainer.style.display = 'none'; if (filters) filters.style.display = 'none'; if (productCount) productCount.style.display = 'none'; if (priceFilterToggle) priceFilterToggle.style.display = 'none'; if (cartBtn) cartBtn.style.display = 'none'; if (blogSection) blogSection.style.display = 'none'; if (aboutSection) aboutSection.style.display = 'none'; if (portfolioSection) portfolioSection.style.display = 'none'; let userSection = document.getElementById('user-section'); const needsRecreate = !userSection || userSection.getAttribute('data-initialized') !== 'true'; if (!userSection) { userSection = document.createElement('div'); userSection.id = 'user-section'; userSection.className = 'user-section'; userSection.style.cssText = 'max-width: 500px; margin: 40px auto; padding: 20px;'; document.body.appendChild(userSection); } userSection.style.display = 'block'; if (needsRecreate) { userSection.setAttribute('data-initialized', 'true'); userSection.innerHTML = `<div class="user-card" style="background: var(--card); padding: 30px; border-radius: 20px; border: 1px solid var(--border); box-shadow: 0 10px 30px rgba(0,0,0,0.1); position: relative; overflow: hidden; width: 100%; box-sizing: border-box;"><div id="login-loader-overlay" class="global-overlay" style="display: none;"><div class="spinner-modern"></div><div class="loader-text" id="login-loader-text">Přihlašování...</div><div class="loader-subtext" id="login-loader-subtext">Ověřuji přihlašovací údaje</div><div class="loader-steps" id="login-loader-steps"><div class="loader-step" data-step="1"><span class="step-dot"></span><span class="step-text">Odesílám požadavek</span></div><div class="loader-step" data-step="2"><span class="step-dot"></span><span class="step-text">Ověřuji údaje</span></div><div class="loader-step" data-step="3"><span class="step-dot"></span><span class="step-text">Načítám profil</span></div></div></div><div id="register-loader-overlay" class="global-overlay" style="display: none;"><div class="spinner-modern"></div><div class="loader-text" id="register-loader-text">Registrace...</div><div class="loader-subtext" id="register-loader-subtext">Odesílám registrační údaje</div><div class="loader-steps" id="register-loader-steps"><div class="loader-step" data-step="1"><span class="step-dot"></span><span class="step-text">Odesílám požadavek</span></div><div class="loader-step" data-step="2"><span class="step-dot"></span><span class="step-text">Vytvářím účet</span></div><div class="loader-step" data-step="3"><span class="step-dot"></span><span class="step-text">Dokončuji registraci</span></div></div></div><div id="forgot-loader-overlay" class="global-overlay" style="display: none;"><div class="spinner-modern"></div><div class="loader-text" id="forgot-loader-text">Odesílám...</div><div class="loader-subtext" id="forgot-loader-subtext">Připravuji odkaz pro obnovu</div><div class="loader-steps" id="forgot-loader-steps"><div class="loader-step" data-step="1"><span class="step-dot"></span><span class="step-text">Odesílám požadavek</span></div><div class="loader-step" data-step="2"><span class="step-dot"></span><span class="step-text">Ověřuji email</span></div><div class="loader-step" data-step="3"><span class="step-dot"></span><span class="step-text">Odesílám odkaz</span></div></div></div><h2 style="color: var(--accent); margin-bottom: 25px; text-align: center; font-size: 24px;"></h2><div id="user-login-form" style="display: block; position: relative;"><div class="form-group" style="margin-bottom: 15px;"><label style="display:block; margin-bottom:8px; font-size:14px; font-weight:600; color:var(--text-dim);">📧 Email</label><input type="email" id="login-email" placeholder="vas@email.cz" style="width:100%; padding:14px; border-radius:12px; border:1px solid var(--border); background:var(--bg); color:var(--text); outline:none;"></div><div class="form-group" style="margin-bottom: 25px;"><label style="display:block; margin-bottom:8px; font-size:14px; font-weight:600; color:var(--text-dim);">🔒 Heslo</label><div style="position: relative;"><input type="password" id="login-password" placeholder="••••••" style="width:100%; padding:14px; border-radius:12px; border:1px solid var(--border); background:var(--bg); color:var(--text); outline:none; padding-right: 45px;"><button type="button" onclick="togglePassword('login-password', this)" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 18px; padding: 0; color: var(--text-dim);">👁️</button></div></div><div class="form-group" style="margin-bottom: 15px; text-align: center;"><div id="login-recaptcha-placeholder"></div></div><button onclick="window.loginUser()" class="btn btn-main" style="width:100%; border-radius: 12px; font-weight: bold; font-size:15px; cursor: pointer;">Přihlásit se</button><div style="margin-top: 20px; text-align: center; font-size: 14px;"><a href="#" onclick="window.showRegisterForm(); return false;" style="color: var(--accent); text-decoration: none; font-weight:600;">Nemáš účet? Zaregistruj se</a><br><br><a href="#" onclick="window.showForgotPassword(); return false;" style="color: var(--text-dim); text-decoration: none;">Zapomenuté heslo?</a></div></div><div id="user-register-form" style="display: none; position: relative;"><div style="text-align: center; margin-bottom: 20px; padding: 12px; border-radius: 10px; border: 1px solid var(--border);"><div style="font-size: 13px; color: var(--accent); font-weight: 600; margin-bottom: 5px;">🪵 Zaregistruj se</div><div style="font-size: 12px; color: var(--text-dim); line-height: 1.4;">Usnadni si nákup a měj přehled o objednávkách.<br>Nákup bude rychlejší – stačí vyplnit telefon a adresu jednou a pak už jen klikat!</div></div><div class="form-group" style="margin-bottom: 15px;"><label style="display:block; margin-bottom:8px; font-size:14px; font-weight:600; color:var(--text-dim);">📧 Email</label><input type="email" id="register-email" placeholder="vas@email.cz" style="width:100%; padding:14px; border-radius:12px; border:1px solid var(--border); background:var(--bg); color:var(--text); outline:none;"></div><div class="form-group" style="margin-bottom: 15px;"><label style="display:block; margin-bottom:8px; font-size:14px; font-weight:600; color:var(--text-dim);">👤 Jméno</label><input type="text" id="register-name" placeholder="Vaše jméno" style="width:100%; padding:14px; border-radius:12px; border:1px solid var(--border); background:var(--bg); color:var(--text); outline:none;"></div><div class="form-group" style="margin-bottom: 25px;"><label style="display:block; margin-bottom:8px; font-size:14px; font-weight:600; color:var(--text-dim);">🔒 Heslo (min. 6 znaků)</label><div style="position: relative;"><input type="password" id="register-password" placeholder="••••••" style="width:100%; padding:14px; border-radius:12px; border:1px solid var(--border); background:var(--bg); color:var(--text); outline:none; padding-right: 45px;"><button type="button" onclick="togglePassword('register-password', this)" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 18px; padding: 0; color: var(--text-dim);">👁️</button></div></div><div class="form-group" style="margin-bottom: 15px; text-align: center;"><div id="register-recaptcha-placeholder"></div></div><button onclick="window.registerUser()" class="btn btn-main" style="width:100%; border-radius: 12px; font-weight: bold; font-size:15px; cursor: pointer;">Registrovat se</button><div style="margin-top: 20px; text-align: center; font-size: 14px;"><a href="#" onclick="window.showLoginForm(); return false;" style="color: var(--text-dim); text-decoration: none;">← Zpět na přihlášení</a></div></div><div id="user-forgot-form" style="display: none; position: relative;"><div class="form-group" style="margin-bottom: 25px;"><label style="display:block; margin-bottom:8px; font-size:14px; font-weight:600; color:var(--text-dim);">📧 Email pro obnovu hesla</label><input type="email" id="forgot-email" placeholder="vas@email.cz" style="width:100%; padding:14px; border-radius:12px; border:1px solid var(--border); background:var(--bg); color:var(--text); outline:none;"></div><div class="form-group" style="margin-bottom: 15px; text-align: center;"><div id="forgot-recaptcha-placeholder"></div></div><button onclick="window.forgotPassword()" class="btn btn-main" style="width:100%; border-radius: 12px; font-weight: bold; font-size:15px; cursor: pointer;">Odeslat odkaz</button><div style="margin-top: 20px; text-align: center; font-size: 14px;"><a href="#" onclick="window.showLoginForm(); return false;" style="color: var(--text-dim); text-decoration: none;">← Zpět na přihlášení</a></div></div><div id="user-profile" style="display: none;"><div class="profile-tabs" style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid var(--border);"><button id="tab-profile-btn" onclick="window.showProfileTab('profile')" class="profile-tab active" style="background: none; border: none; padding: 10px 20px; cursor: pointer; color: var(--accent); font-weight: 600;">👤 Profil</button><button id="tab-orders-btn" onclick="window.showProfileTab('orders')" class="profile-tab" style="background: none; border: none; padding: 10px 20px; cursor: pointer; color: var(--text-dim);">📦 Objednávky</button></div><div class="newsletter-section" style="margin-bottom: 20px; padding: 15px; background: var(--bg); border-radius: 12px; border: 1px solid var(--border);"><h4 style="margin-bottom: 8px;">📧 Novinky z dílny</h4><p style="font-size: 12px; color: var(--text-dim); margin-bottom: 12px;">Dostávejte informace o nových produktech a akcích.</p><div style="display: flex; gap: 10px; justify-content: center;"><button id="newsletter-subscribe-btn" onclick="window.subscribeNewsletter()" class="btn btn-main" style="flex:1; max-width: 200px; padding: 10px;">✅ Přihlásit k odběru</button><button id="newsletter-unsubscribe-btn" onclick="window.unsubscribeNewsletter()" class="btn btn-sec" style="flex:1; max-width: 200px; padding: 10px; display: none;">❌ Odhlásit odběr</button></div></div><div id="profile-content" style="display: block;"><div id="user-profile-content"></div></div><div id="orders-content" style="display: none;"><div id="orders-list" style="position: relative; min-height: 280px;"><div id="orders-loader-overlay" class="orders-loader-overlay" style="display: flex;"><div class="spinner-modern"></div><div class="loader-text">Načítám objednávky</div><div class="loader-subtext">Připravuji seznam vašich objednávek</div><div class="loader-steps"><div class="loader-step" data-step="1"><span class="step-dot"></span><span class="step-text">Připojuji se k serveru</span></div><div class="loader-step" data-step="2"><span class="step-dot"></span><span class="step-text">Stahuji vaše objednávky</span></div><div class="loader-step" data-step="3"><span class="step-dot"></span><span class="step-text">Zpracovávám data</span></div></div></div><div id="orders-list-content" style="display: none; background: var(--card); border-radius: 20px; padding: 5px;"></div></div></div><button onclick="window.logoutUser()" class="btn btn-sec" style="width:100%; margin-top:20px; padding: 0px; border-radius: 12px; font-weight: bold; cursor: pointer;">Odhlásit se</button></div></div>`; } document.getElementById('user-login-form').style.display = 'block'; document.getElementById('user-register-form').style.display = 'none'; document.getElementById('user-forgot-form').style.display = 'none'; document.getElementById('user-profile').style.display = 'none'; setTimeout(() => { if (typeof window.initLoginTurnstile === 'function') window.initLoginTurnstile(); }, 100); if (typeof resetLoginTurnstile === 'function') resetLoginTurnstile(); if (typeof resetRegisterTurnstile === 'function') resetRegisterTurnstile(); if (typeof resetForgotTurnstile === 'function') resetForgotTurnstile(); setTimeout(() => { if (typeof window.initLoginTurnstile === 'function') window.initLoginTurnstile(); }, 100); const userId = localStorage.getItem('woodisek_userId'); if (userId) { const now = Date.now(); const hasValidCache = cachedUserProfile && (now - lastProfileFetch) < CACHE_TTL; if (hasValidCache) { const loginForm = document.getElementById('user-login-form'); if (loginForm) loginForm.style.display = 'none'; const profileSection = document.getElementById('user-profile'); if (profileSection) profileSection.style.display = 'block'; renderUserProfile(cachedUserProfile); } else { const loginLoaderOverlay = document.getElementById('login-loader-overlay'); const loginForm = document.getElementById('user-login-form'); const loaderText = document.getElementById('login-loader-text'); const loaderSubtext = document.getElementById('login-loader-subtext'); if (loginLoaderOverlay && loginForm) { if (loaderText) loaderText.innerText = 'Načítám profil...'; if (loaderSubtext) loaderSubtext.innerText = 'Připravuji vaše uživatelské prostředí'; loginLoaderOverlay.style.display = 'flex'; await window.loadUserProfile(userId, false); loginLoaderOverlay.style.display = 'none'; if (loginForm) loginForm.style.display = 'none'; const profileSection = document.getElementById('user-profile'); if (profileSection) profileSection.style.display = 'block'; } } } };
window.registerUser = async function() { const email = document.getElementById('register-email').value; const name = document.getElementById('register-name').value; const password = document.getElementById('register-password').value; const turnstileToken = getRegisterTurnstileToken(); if (!turnstileToken || turnstileToken.length === 0) { import('./ui.js').then(ui => ui.showToast("Potvrďte, že jste člověk", "🤖")); return; } const loaderOverlay = document.getElementById('register-loader-overlay'); const loaderText = document.getElementById('register-loader-text'); const loaderSubtext = document.getElementById('register-loader-subtext'); const loaderSteps = document.querySelectorAll('#register-loader-steps .loader-step'); function updateLoaderStep(stepIndex, status) { const step = loaderSteps[stepIndex - 1]; if (step) { step.classList.remove('active', 'completed'); if (status === 'active') { step.classList.add('active'); const dot = step.querySelector('.step-dot'); if (dot) dot.style.background = 'var(--accent)'; } else if (status === 'completed') { step.classList.add('completed'); const dot = step.querySelector('.step-dot'); if (dot) dot.style.background = '#5b7c5d'; } } } function resetLoaderSteps() { loaderSteps.forEach(step => { step.classList.remove('active', 'completed'); const dot = step.querySelector('.step-dot'); if (dot) dot.style.background = 'var(--text-dim)'; }); } if (!email || !name || !password) { import('./ui.js').then(ui => ui.showToast("Vyplňte všechna pole", "❌")); return; } if (password.length < 6) { import('./ui.js').then(ui => ui.showToast("Heslo musí mít alespoň 6 znaků", "❌")); return; } loaderOverlay.style.display = 'flex'; resetLoaderSteps(); updateLoaderStep(1, 'active'); loaderText.innerText = 'Registrace...'; loaderSubtext.innerText = 'Odesílám registrační údaje'; setTimeout(() => { if (loaderOverlay.style.display === 'flex') { updateLoaderStep(1, 'completed'); updateLoaderStep(2, 'active'); loaderSubtext.innerText = 'Vytvářím účet'; } }, 600); try { const response = await fetch(`${CONFIG.APPS_SCRIPT_URL}?action=register&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&name=${encodeURIComponent(name)}&turnstile=${turnstileToken}`); const data = await response.json(); updateLoaderStep(2, 'completed'); updateLoaderStep(3, 'active'); loaderSubtext.innerText = 'Dokončuji registraci'; if (data.success) { resetRegisterTurnstile(); updateLoaderStep(3, 'completed'); loaderText.innerText = 'Hotovo!'; loaderSubtext.innerText = 'Registrace proběhla úspěšně'; setTimeout(() => { loaderOverlay.style.display = 'none'; window.showLoginForm(); }, 800); } else { setTimeout(() => { loaderOverlay.style.display = 'none'; import('./ui.js').then(ui => ui.showToast(data.error || "Registrace selhala", "❌")); }, 500); } } catch (err) { setTimeout(() => { loaderOverlay.style.display = 'none'; import('./ui.js').then(ui => ui.showToast("Chyba připojení", "❌")); }, 500); } };
window.forgotPassword = async function() { const email = document.getElementById('forgot-email').value; const turnstileToken = getForgotTurnstileToken(); if (!turnstileToken || turnstileToken.length === 0) { import('./ui.js').then(ui => ui.showToast("Potvrďte, že jste člověk", "🤖")); return; } const loaderOverlay = document.getElementById('forgot-loader-overlay'); const loaderText = document.getElementById('forgot-loader-text'); const loaderSubtext = document.getElementById('forgot-loader-subtext'); const loaderSteps = document.querySelectorAll('#forgot-loader-steps .loader-step'); function updateLoaderStep(stepIndex, status) { const step = loaderSteps[stepIndex - 1]; if (step) { step.classList.remove('active', 'completed'); if (status === 'active') { step.classList.add('active'); const dot = step.querySelector('.step-dot'); if (dot) dot.style.background = 'var(--accent)'; } else if (status === 'completed') { step.classList.add('completed'); const dot = step.querySelector('.step-dot'); if (dot) dot.style.background = '#5b7c5d'; } } } function resetLoaderSteps() { loaderSteps.forEach(step => { step.classList.remove('active', 'completed'); const dot = step.querySelector('.step-dot'); if (dot) dot.style.background = 'var(--text-dim)'; }); } if (!email) { import('./ui.js').then(ui => ui.showToast("Zadejte email", "❌")); return; } loaderOverlay.style.display = 'flex'; resetLoaderSteps(); updateLoaderStep(1, 'active'); loaderText.innerText = 'Odesílám...'; loaderSubtext.innerText = 'Odesílám požadavek na server'; setTimeout(() => { if (loaderOverlay.style.display === 'flex') { updateLoaderStep(1, 'completed'); updateLoaderStep(2, 'active'); loaderSubtext.innerText = 'Ověřuji email'; } }, 600); try { const response = await fetch(`${CONFIG.APPS_SCRIPT_URL}?action=forgotPassword&email=${encodeURIComponent(email)}&turnstile=${turnstileToken}`); const data = await response.json(); updateLoaderStep(2, 'completed'); updateLoaderStep(3, 'active'); loaderSubtext.innerText = 'Odesílám odkaz'; setTimeout(() => { loaderOverlay.style.display = 'none'; import('./ui.js').then(ui => ui.showToast("Pokud zadaný e-mail existuje, byl na něj odeslán odkaz pro obnovení hesla.", "📧")); window.showLoginForm(); }, 800); } catch (err) { setTimeout(() => { loaderOverlay.style.display = 'none'; import('./ui.js').then(ui => ui.showToast("Pokud zadaný e-mail existuje, byl na něj odeslán odkaz pro obnovení hesla.", "📧")); window.showLoginForm(); }, 500); } };
window.updateUserProfile = async function() { const userId = localStorage.getItem('woodisek_userId'); if (!userId) { import('./ui.js').then(ui => ui.showToast("Nejste přihlášeni", "❌")); return; } const name = document.getElementById('profile-name').value; const phone = document.getElementById('profile-phone').value; const address = document.getElementById('profile-address').value; import('./ui.js').then(ui => ui.showToast("Ukládám...", "⏳")); try { const response = await fetch(`${CONFIG.APPS_SCRIPT_URL}?action=updateUser&userId=${encodeURIComponent(userId)}&name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}&address=${encodeURIComponent(address)}`); const data = await response.json(); if (data.success) { import('./ui.js').then(ui => ui.showToast("Profil aktualizován", "✅")); if (typeof window.checkNewsletterStatus === 'function') window.checkNewsletterStatus(true); const user = JSON.parse(localStorage.getItem('woodisek_user') || '{}'); user.name = name; user.phone = phone; user.address = address; localStorage.setItem('woodisek_user', JSON.stringify(user)); if (typeof cachedUserProfile !== 'undefined') cachedUserProfile = null; if (typeof lastProfileFetch !== 'undefined') lastProfileFetch = 0; const profileContent = document.getElementById('user-profile-content'); if (profileContent) { const nameInput = document.getElementById('profile-name'); const phoneInput = document.getElementById('profile-phone'); const addressTextarea = document.getElementById('profile-address'); if (nameInput) nameInput.value = name; if (phoneInput) phoneInput.value = phone; if (addressTextarea) addressTextarea.value = address; } } else { import('./ui.js').then(ui => ui.showToast(data.error || "Chyba uložení", "❌")); } } catch (err) { import('./ui.js').then(ui => ui.showToast("Chyba připojení", "❌")); } };
window.logoutUser = function() { 
    localStorage.removeItem('woodisek_token'); 
    localStorage.removeItem('woodisek_userId'); 
    localStorage.removeItem('woodisek_user'); 
    sessionStorage.removeItem('woodisek_user_phone');
    sessionStorage.removeItem('woodisek_user_name');
    sessionStorage.removeItem('woodisek_user_email');
    sessionStorage.removeItem('woodisek_user_address'); cachedUserProfile = null; cachedUserOrders = null; renderCart(); updateCartBadge(); const userSection = document.getElementById('user-section'); if (userSection && userSection.getAttribute('data-initialized') === 'true') { document.getElementById('user-login-form').style.display = 'block'; document.getElementById('user-register-form').style.display = 'none'; document.getElementById('user-forgot-form').style.display = 'none'; document.getElementById('user-profile').style.display = 'none'; setTimeout(() => { if (typeof window.initLoginTurnstile === 'function') window.initLoginTurnstile(); }, 100); if (typeof resetLoginRecaptcha === 'function') resetLoginTurnstile(); if (typeof resetRegisterRecaptcha === 'function') resetRegisterTurnstile(); if (typeof resetForgotRecaptcha === 'function') resetForgotTurnstile(); } else { window.showUserSection(); } setTimeout(() => { if (typeof initLoginTurnstile === 'function') initLoginTurnstile(); if (typeof initRegisterTurnstile === 'function') initRegisterTurnstile(); if (typeof initForgotTurnstile === 'function') initForgotTurnstile(); }, 150); import('./ui.js').then(ui => ui.showToast("Odhlášení proběhlo úspěšně", "✅")); };
window.orderCart = async () => { 
    if (navigator.vibrate) navigator.vibrate(10); 
    
    // Kontrola, jestli už objednávka neprobíhá (prevence dvojího kliknutí)
    if (window.isOrderProcessing) {
        showToast("Zpracovávám objednávku, chvilinku strpení...", "⏳");
        return;
    }
    
    const userId = localStorage.getItem('woodisek_userId'); 
    const user = JSON.parse(localStorage.getItem('woodisek_user') || '{}'); 
    const cartItems = getCartItems(); 
    const email = user.email || ""; 
    
    if (cartItems.length === 0) { 
        showToast("Váš košíček je prázdný, přidejte něco...", " 🪵 "); 
        return; 
    } 
    
    // ZÍSKÁNÍ ADRESY Z PROFILU
    let userAddress = "";
    let userEmail = "";
    
    // Nejdříve zkusíme sessionStorage
    const cachedAddress = sessionStorage.getItem('woodisek_user_address');
    const cachedEmail = sessionStorage.getItem('woodisek_user_email');
    if (cachedAddress) userAddress = cachedAddress;
    if (cachedEmail) userEmail = cachedEmail;
    
    // Pokud ne, zkusíme localStorage
    if (!userAddress && user.address && user.address.trim() !== "") userAddress = user.address;
    if (!userEmail && user.email && user.email.trim() !== "") userEmail = user.email;
    
    // Pokud ne, zkusíme cachedUserProfile
    if (!userAddress && window.cachedUserProfile && window.cachedUserProfile.address) {
        userAddress = window.cachedUserProfile.address;
    }
    if (!userEmail && window.cachedUserProfile && window.cachedUserProfile.email) {
        userEmail = window.cachedUserProfile.email;
    }
    
    const total = getCartTotalPrice(); 
    const finalTotal = window.getDiscountedTotal ? window.getDiscountedTotal() : total; 
    const shippingPrice = getShippingPrice(); 
    const shippingText = getShippingText(); 
    
    const orderData = { 
        userId: userId || "guest", 
        email: email, 
        items: cartItems, 
        total: finalTotal + shippingPrice, 
        shipping: shippingText, 
        shippingPrice: shippingPrice, 
        discount: window.appliedDiscount ? `${window.appliedDiscount.code} (${window.appliedDiscount.type === 'percent' ? window.appliedDiscount.value + '%' : window.appliedDiscount.value + ' Kč'})` : "", 
        address: userAddress 
    }; 
    
    // 🔥 NASTAVÍME ZAMČENÍ TLACÍTKA
    window.isOrderProcessing = true;
    const orderBtn = document.querySelector('#cart-modal .btn-main');
    const originalBtnText = orderBtn ? orderBtn.innerHTML : '';
    
    if (orderBtn) {
        orderBtn.innerHTML = '⏳ Odesílám...';
        orderBtn.disabled = true;
        orderBtn.style.opacity = '0.6';
        orderBtn.style.cursor = 'wait';
    }
    
    try { 
        const response = await fetch(`${CONFIG.APPS_SCRIPT_URL}?action=saveOrder&orderData=${encodeURIComponent(JSON.stringify(orderData))}`); 
        const result = await response.json(); 
        const orderNumber = result.orderId || getOrderNumber(); 
        const message = generateCartWhatsAppMessageWithOrderNumber(orderNumber, userAddress, userEmail); 
        
        if (message) { 
            createWoodShavings({ target: document.querySelector('#cart-modal .btn-main') }); 
            openWhatsApp(message); 
            cart.length = 0; 
            window.appliedDiscount = null; 
            saveCart(); 
            renderCart(); 
            updateCartBadge(); 
        } 
    } catch (err) { 
        console.error("Chyba při ukládání objednávky:", err); 
        showToast("Chyba při vytváření objednávky", "❌"); 
    } finally {
        // 🔥 ODEMČENÍ TLACÍTKA PO 2 SEKUNDÁCH
        setTimeout(() => {
            window.isOrderProcessing = false;
            if (orderBtn) {
                orderBtn.innerHTML = originalBtnText;
                orderBtn.disabled = false;
                orderBtn.style.opacity = '1';
                orderBtn.style.cursor = 'pointer';
            }
        }, 5000);
    }
};
function getCartTotalPrice() { const items = getCartItems(); let total = 0; items.forEach(item => { const priceNum = parseInt(item.price.replace(/[^\d]/g, ''), 10) || 0; total += priceNum * item.qty; }); return total; }

// ============================================================
// RESET HESLA - JEDINÁ SPRÁVNÁ VERZE
// ============================================================
window.showResetPasswordForm = function(token) {
    document.body.classList.add('light-mode');
    document.body.classList.remove('dark-mode');
    localStorage.setItem('theme', 'light');
    const modeBtn = document.getElementById('mode-toggle');
    if (modeBtn) modeBtn.innerText = ' ☀️ ';
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute('content', '#f5f2ed');
    const shop = document.getElementById('shop');
    const blogSection = document.getElementById('blog-section');
    const aboutSection = document.getElementById('about');
    const searchContainer = document.querySelector('.search-container');
    const filters = document.getElementById('filters');
    const productCount = document.getElementById('product-count');
    const priceFilterToggle = document.getElementById('price-filter-toggle');
    const portfolioSection = document.getElementById('portfolio-container');
    const navLinks = document.querySelector('.nav-links');
    const chatToggleBtn = document.getElementById('chat-toggle-btn');
    const floatingCartBtn = document.getElementById('floating-cart-btn');
    const reviewsSidebar = document.getElementById('reviewsSidebar');
    const cartIcon = document.querySelector('.header-actions .icon-btn');
    const backToTop = document.getElementById('back-to-top');
    const socialProof = document.getElementById('social-proof');
    const gdprBanner = document.getElementById('gdpr-banner');
    if (shop) shop.style.display = 'none';
    if (searchContainer) searchContainer.style.display = 'none';
    if (filters) filters.style.display = 'none';
    if (productCount) productCount.style.display = 'none';
    if (priceFilterToggle) priceFilterToggle.style.display = 'none';
    if (blogSection) blogSection.style.display = 'none';
    if (aboutSection) aboutSection.style.display = 'none';
    if (portfolioSection) portfolioSection.style.display = 'none';
    if (navLinks) navLinks.style.display = 'none';
    if (chatToggleBtn) chatToggleBtn.style.display = 'none';
    if (floatingCartBtn) floatingCartBtn.style.display = 'none';
    if (reviewsSidebar) reviewsSidebar.style.display = 'none';
    if (cartIcon) cartIcon.style.display = 'none';
    if (backToTop) backToTop.style.display = 'none';
    if (socialProof) socialProof.style.display = 'none';
    if (gdprBanner) gdprBanner.style.display = 'none';
    const userSection = document.getElementById('user-section');
    if (userSection) userSection.style.display = 'none';
    let resetContainer = document.getElementById('reset-password-container');
    if (!resetContainer) {
        resetContainer = document.createElement('div');
        resetContainer.id = 'reset-password-container';
        resetContainer.style.cssText = 'max-width: 450px; margin: 100px auto; padding: 30px; background: var(--card); border-radius: 24px; border: 1px solid var(--border); text-align: center;';
        document.body.appendChild(resetContainer);
    }
    resetContainer.style.display = 'block';
    resetContainer.innerHTML = `
        <h2 style="color: var(--accent); margin-bottom: 20px;">🔐 Obnova hesla</h2>
        <p style="margin-bottom: 25px; color: var(--text-dim);">Zadejte nové heslo (min. 6 znaků)</p>
        <div class="form-group" style="margin-bottom: 15px;">
            <input type="password" id="reset-new-password" placeholder="Nové heslo" style="width:100%; padding: 14px; border-radius: 12px; border: 1px solid var(--border); background: var(--bg); color: var(--text); outline: none;">
        </div>
        <div class="form-group" style="margin-bottom: 25px;">
            <input type="password" id="reset-confirm-password" placeholder="Potvrďte heslo" style="width:100%; padding: 14px; border-radius: 12px; border: 1px solid var(--border); background: var(--bg); color: var(--text); outline: none;">
        </div>
        <button onclick="window.submitResetPassword()" class="btn btn-main" style="width:100%; padding: 14px; border-radius: 12px; font-weight: bold; cursor: pointer;">Změnit heslo</button>
    `;
};

window.submitResetPassword = async function() {
    const newPassword = document.getElementById('reset-new-password').value;
    const confirmPassword = document.getElementById('reset-confirm-password').value;
    
    let token = localStorage.getItem('woodisek_reset_token');
    if (!token) token = sessionStorage.getItem('woodisek_reset_token');
    
    if (!token) {
        import('./ui.js').then(ui => ui.showToast("Neplatný nebo chybějící token", "❌"));
        return;
    }
    
    if (!newPassword || !confirmPassword) {
        import('./ui.js').then(ui => ui.showToast("Vyplňte obě pole", "❌"));
        return;
    }
    
    if (newPassword.length < 6) {
        import('./ui.js').then(ui => ui.showToast("Heslo musí mít alespoň 6 znaků", "❌"));
        return;
    }
    
    if (newPassword !== confirmPassword) {
        import('./ui.js').then(ui => ui.showToast("Zadaná hesla se neshodují", "❌"));
        return;
    }
    
    import('./ui.js').then(ui => ui.showToast("Odesílám...", "⏳"));
    
    try {
        const response = await fetch(`${CONFIG.APPS_SCRIPT_URL}?action=resetPassword&token=${encodeURIComponent(token)}&newPassword=${encodeURIComponent(newPassword)}`);
        const data = await response.json();
        
        if (data.success) {
            // ============================================
            // VYČIŠTĚNÍ VŠECH PŘIHLÁŠOVACÍCH ÚDAJŮ
            // ============================================
            localStorage.removeItem('woodisek_token');
            localStorage.removeItem('woodisek_userId');
            localStorage.removeItem('woodisek_user');
            localStorage.removeItem('woodisek_reset_token');
            sessionStorage.removeItem('woodisek_reset_token');
            sessionStorage.removeItem('woodisek_user_phone');
            sessionStorage.removeItem('woodisek_user_name');
            
            // Vyčištění cache profilu
            cachedUserProfile = null;
            cachedUserOrders = null;
            
            import('./ui.js').then(ui => ui.showToast("Heslo bylo změněno! Nyní se přihlaste znovu. ✅", "🎉"));
            
            setTimeout(() => {
                window.location.href = window.location.origin + window.location.pathname + "?theme=light";
            }, 2000);
        } else {
            import('./ui.js').then(ui => ui.showToast(data.error || "Neplatný nebo expirovaný token", "❌"));
        }
    } catch (err) {
        import('./ui.js').then(ui => ui.showToast("Chyba připojení", "❌"));
    }
};

window.checkNewsletterStatus = async function(forceRefresh = false) { const user = JSON.parse(localStorage.getItem('woodisek_user') || '{}'); const email = user.email; if (!email) return; const now = Date.now(); if (!forceRefresh && cachedNewsletterStatus !== null && (now - lastNewsletterFetch) < CACHE_TTL) { applyNewsletterButtonState(cachedNewsletterStatus); return; } try { const response = await fetch(`${CONFIG.APPS_SCRIPT_URL}?action=newsletterStatus&email=${encodeURIComponent(email)}`); const data = await response.json(); cachedNewsletterStatus = data.subscribed === true; lastNewsletterFetch = now; applyNewsletterButtonState(cachedNewsletterStatus); } catch (err) { console.error("Chyba při kontrole newsletteru:", err); } };
function applyNewsletterButtonState(isSubscribed) { const subscribeBtn = document.getElementById('newsletter-subscribe-btn'); const unsubscribeBtn = document.getElementById('newsletter-unsubscribe-btn'); if (subscribeBtn && unsubscribeBtn) { if (isSubscribed) { subscribeBtn.style.display = 'none'; unsubscribeBtn.style.display = 'flex'; } else { subscribeBtn.style.display = 'flex'; unsubscribeBtn.style.display = 'none'; } } }
window.subscribeNewsletter = async function() { const user = JSON.parse(localStorage.getItem('woodisek_user') || '{}'); const email = user.email; if (!email) { import('./ui.js').then(ui => ui.showToast("Nejste přihlášeni", "❌")); return; } import('./ui.js').then(ui => ui.showToast("Přihlašuji k odběru...", "⏳")); try { const response = await fetch(`${CONFIG.APPS_SCRIPT_URL}?action=newsletter&email=${encodeURIComponent(email)}`); const data = await response.json(); if (data.success) { import('./ui.js').then(ui => ui.showToast("Přihlášeni k odběru novinek! ✅", "📧")); window.checkNewsletterStatus(true); } else { import('./ui.js').then(ui => ui.showToast(data.error || "Chyba", "❌")); } } catch (err) { import('./ui.js').then(ui => ui.showToast("Chyba připojení", "❌")); } };
window.unsubscribeNewsletter = async function() { const user = JSON.parse(localStorage.getItem('woodisek_user') || '{}'); const email = user.email; if (!email) { import('./ui.js').then(ui => ui.showToast("Nejste přihlášeni", "❌")); return; } import('./ui.js').then(ui => ui.showToast("Odhlašuji z odběru...", "⏳")); try { const response = await fetch(`${CONFIG.APPS_SCRIPT_URL}?action=newsletterUnsub&email=${encodeURIComponent(email)}`); const data = await response.json(); if (data.success) { import('./ui.js').then(ui => ui.showToast("Odhlášeni z odběru ✅", "📧")); window.checkNewsletterStatus(true); } else { import('./ui.js').then(ui => ui.showToast(data.error || "Chyba", "❌")); } } catch (err) { import('./ui.js').then(ui => ui.showToast("Chyba připojení", "❌")); } };
window.submitRating = async function(productId, idx) { const userId = localStorage.getItem('woodisek_userId'); if (!userId) { import('./ui.js').then(ui => ui.showToast("Nejste přihlášeni", "❌")); return; } const rating = parseInt(document.getElementById(`selected-rating-${idx}`).value) || 5; const comment = document.getElementById(`rating-comment-${idx}`).value; import('./ui.js').then(ui => ui.showToast("Odesílám hodnocení...", "⏳")); try { const response = await fetch(`${CONFIG.APPS_SCRIPT_URL}?action=addRatingIfNotRated&productId=${encodeURIComponent(productId)}&userId=${encodeURIComponent(userId)}&rating=${rating}&comment=${encodeURIComponent(comment)}`); const data = await response.json(); if (data.success) { clearRatingCache(productId); import('./ui.js').then(ui => ui.showToast("Děkuji za hodnocení! ✅", "⭐")); window.loadRatingsToModal(productId, idx, true); } else { import('./ui.js').then(ui => ui.showToast(data.error || "Chyba při ukládání", "❌")); } } catch (err) { import('./ui.js').then(ui => ui.showToast("Chyba připojení", "❌")); } };
window.appliedDiscount = null;
window.applyDiscount = async function() { const codeInput = document.getElementById('discount-code'); const code = codeInput?.value.trim(); const messageDiv = document.getElementById('discount-message'); if (!code) { if (messageDiv) messageDiv.innerHTML = '<span style="color: #dc2626;">❌ Zadejte slevový kód</span>'; return; } const cartItems = getCartItems(); let cartTotal = 0; let nonSaleTotal = 0; let hasSaleItems = false; cartItems.forEach(item => { const product = allProducts?.find(p => p.id === item.id); const priceNum = parseInt(item.price.replace(/[^\d]/g, ''), 10) || 0; const itemTotal = priceNum * item.qty; cartTotal += itemTotal; if (product && product.sale && product.sale !== "0") hasSaleItems = true; else nonSaleTotal += itemTotal; }); if (hasSaleItems && nonSaleTotal === 0) { if (messageDiv) messageDiv.innerHTML = '<span style="color: #dc2626;">❌ Slevový kód nelze použít na produkty, které jsou již ve slevě</span>'; return; } try { const response = await fetch(`${CONFIG.APPS_SCRIPT_URL}?action=validateDiscount&code=${encodeURIComponent(code)}&total=${cartTotal}&nonSaleTotal=${nonSaleTotal}&hasSaleItems=${hasSaleItems}`); const data = await response.json(); if (data.valid) { window.appliedDiscount = data; if (messageDiv) messageDiv.innerHTML = `<span style="color: #10b981;">✅ Sleva uplatněna: ${data.type === 'percent' ? data.value + '%' : data.value + ' Kč'}</span>`; if (codeInput) codeInput.disabled = true; const applyBtn = document.getElementById('apply-discount-btn'); if (applyBtn) applyBtn.disabled = true; renderCart(); } else { window.appliedDiscount = null; if (messageDiv) messageDiv.innerHTML = `<span style="color: #dc2626;">❌ ${data.error}</span>`; } } catch (err) { if (messageDiv) messageDiv.innerHTML = '<span style="color: #dc2626;">❌ Chyba připojení</span>'; } };
window.getDiscountedTotal = function() { const cartItems = getCartItems(); let cartTotal = 0; cartItems.forEach(item => { const priceNum = parseInt(item.price.replace(/[^\d]/g, ''), 10) || 0; cartTotal += priceNum * item.qty; }); if (window.appliedDiscount && window.appliedDiscount.valid) return cartTotal - window.appliedDiscount.discountAmount; return cartTotal; };
function setupBannerLinks() { const bannerText = document.querySelector('.welcome-banner-text'); if (!bannerText) return; bannerText.querySelectorAll('strong').forEach(link => { link.style.cursor = 'pointer'; link.addEventListener('click', (e) => { e.stopPropagation(); const text = link.innerText.toLowerCase(); if (text.includes('přihlas') || text.includes('přihlaš')) window.showLoginForm(); else if (text.includes('registruj') || text.includes('zaregistruj')) window.showRegisterForm(); }); }); }
window.applyFilters = applyFilters;
window.applyAllFilters = window.applyAllFilters || function() { if (typeof applyFilters === 'function') applyFilters(); };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initStatsFlip); else initStatsFlip();

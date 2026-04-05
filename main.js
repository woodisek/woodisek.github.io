import { CONFIG, loadSettings } from './config.js';
import { initProducts, allProducts, portfolioImages, categories } from './api.js';
import { 
    cart, gdprConsent, setCartUpdateCallback, getCartTotalItems, 
    getCartItems, generateCartWhatsAppMessage, openWhatsApp,
    initGDPR, acceptGDPR, declineGDPR, initShipping, setShipping,
    getShippingPrice, getShippingText, selectedShipping, removeFromCart as removeFromCartModule,
    changeCartItemQty
} from './cart.js';
import { 
    renderSkeletons, renderFilters, applyFilters, showToast,
    setCartBadgeCallback, activeOverlayIdx, scrollStartPos,
    initInfiniteScroll, updateNavButtonsVisibility  // ← PŘIDAT DO IMPORTU
} from './ui.js';
import { initPortfolio, initGlobalSwipeDetection } from './gallery.js';
import { createWoodShavings, initSocialProof } from './features.js';
import { loadBlogPosts, renderBlogPosts } from './blog.js';
import './chat.js';

// ============================================================
// REŽIM ÚDRŽBY - KOMPLETNÍ ZABLOKOVÁNÍ STRÁNKY
// ============================================================

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
            <div class="maintenance-progress">
                <div class="maintenance-progress-bar"></div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    document.body.classList.add('maintenance-active');
    
    // Skryj všechna tlačítka a interaktivní prvky
    const interactiveElements = document.querySelectorAll('.icon-btn, #floating-cart-btn, #chat-toggle-btn, .nav-link-btn, .f-btn, #search-input, .price-filter-btn');
    interactiveElements.forEach(el => {
        if (el) el.style.pointerEvents = 'none';
    });
}

function formatPhoneNumber(phone) {
    // Odstraní vše kromě čísel
    let clean = phone.toString().replace(/\D/g, '');
    
    // Pokud začíná 420, přidá + a mezery
    if (clean.startsWith('420')) {
        return `+420 ${clean.slice(3, 6)} ${clean.slice(6, 9)} ${clean.slice(9, 12)}`;
    }
    
    // Jinak jen přidá +
    return `+${clean}`;
}

function hideMaintenanceMode() {
    const overlay = document.getElementById('maintenance-overlay');
    if (overlay) {
        overlay.remove();
        document.body.classList.remove('maintenance-active');
    }
    
    // Obnov interaktivitu
    const interactiveElements = document.querySelectorAll('.icon-btn, #floating-cart-btn, #chat-toggle-btn, .nav-link-btn, .f-btn, #search-input, .price-filter-btn');
    interactiveElements.forEach(el => {
        if (el) el.style.pointerEvents = '';
    });
}
// ============================================================
// VYPNUTÍ CONSOLE.LOG V PRODUKCI (zrychlení)
// ============================================================
if (window.location.hostname !== 'localhost' && 
    !window.location.hostname.includes('127.0.0.1') &&
    !window.location.hostname.includes('file://')) {
    console.log = () => {};
    console.warn = () => {};
    console.info = () => {};
}

window.showProductsAndResetFilter = function() {
    // Pokud je obchod zavřený, jen zobrazíme zprávu a nehledáme tlačítka
    if (CONFIG.Enable_Shop === false) {
        window.showProducts();  // Tohle už zobrazí jen zprávu
        return;
    }
    
    // Normální chování
    window.showProducts();
    const allBtn = document.querySelector('.f-btn[data-cat="Vše"]');
    if (allBtn) {
        window.filterData('Vše', allBtn);
    }
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

// ============================================================
// MODAL PRO DETAILY PRODUKTU (místo flip karet)
// ============================================================

let currentModalProduct = null;
let currentModalImageIndex = 0;

window.openProductModal = function(idx) {
    const product = allProducts?.find(x => x.idx === idx);
    if (!product) return;
    
    currentModalProduct = product;
    currentModalImageIndex = product.cur || 0;
    
    // Naplnění modalu
    document.getElementById('modal-product-title').innerText = product.name;
    
    const isStock = product.stock && product.stock !== "0";
    const stockHtml = isStock 
        ? `<span class="in-stock">📦 ${product.stock} ks skladem</span>`
        : `<span class="out-stock">📝 Na zakázku</span>`;
    document.getElementById('modal-stock').innerHTML = stockHtml;
    
    const isSale = product.sale && product.sale !== "0";
    const finalPrice = isSale ? product.sale : product.price;
    const priceHtml = isSale
        ? `<span class="sale-price">${finalPrice}</span><span class="old-price">${product.price}</span>`
        : `<span>${finalPrice}</span>`;
    document.getElementById('modal-price').innerHTML = priceHtml;
    
    document.getElementById('modal-desc').innerHTML = product.desc || 'Žádný popis';
    document.getElementById('modal-ship').innerHTML = `<strong>Dodatečné info:</strong><br>${product.ship || 'Standardní doručení do 3-5 dnů'}`;
    
    // Obrázky
    updateModalImage();
    
    // Tlačítka
    const orderBtn = document.getElementById('modal-order-btn');
    const cartBtn = document.getElementById('modal-cart-btn');
    const offerBtn = document.getElementById('modal-offer-btn');
    
    // Nastavení textu a stylu primárního tlačítka
    if (isStock) {
        orderBtn.innerHTML = '💰 Koupit teď';
        orderBtn.className = 'btn btn-main';
    } else {
        orderBtn.innerHTML = '📝 Objednat na zakázku';
        orderBtn.className = 'btn btn-main';
    }
    
    orderBtn.onclick = () => {
        window.orderProduct(idx);
        closeProductModal();
    };
    
cartBtn.onclick = (e) => {
    e.stopPropagation();
    window.addToCart(idx, e);
    showToast("Přidáno do košíčku!", " 🛒 ");
    // closeProductModal();  ← ZAKOMENTUJ NEBO SMAŽ TENTO ŘÁDEK
};
    
    // Tlačítko nabídnout cenu
    if (isSale) {
        offerBtn.style.display = 'none';
    } else {
        offerBtn.style.display = 'flex';
        offerBtn.innerHTML = '🏷️ Nabídnout vlastní cenu';
        offerBtn.onclick = () => {
            closeProductModal();
            setTimeout(() => window.openOffer(idx), 100);
        };
    }
    
    // Zobrazení modalu
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
    const counter = document.getElementById('modal-counter');
    const images = currentModalProduct.imgs;
    
    img.src = images[currentModalImageIndex];
    counter.innerText = `${currentModalImageIndex + 1} / ${images.length}`;
    
    // Schovat šipky pokud je jen jeden obrázek
    const prevBtn = document.querySelector('.modal-slider-prev');
    const nextBtn = document.querySelector('.modal-slider-next');
    if (images.length <= 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'flex';
        nextBtn.style.display = 'flex';
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

// Přepíšeme toggleOver aby otevíral modal
window.toggleOver = function(idx, show) {
    if (show) {
        window.openProductModal(idx);
    }
    // Pokud show === false, jen zavřeme modal (už je zavírací tlačítko)
};

// Klik na kartu (mimo tlačítka) otevře modal
document.getElementById('shop')?.addEventListener('click', (e) => {
    // Pokud klik na tlačítko nebo obrázek, necháme to zpracovat jinde
    if (e.target.closest('[data-action]')) return;
    if (e.target.closest('.nav-btn')) return;
    if (e.target.closest('.share-btn')) return;
    if (e.target.closest('.btn-cart-small')) return;
    if (e.target.closest('.btn-offer-small')) return;
    
    // Najdi kartu produktu
    const card = e.target.closest('.product-card');
    if (card) {
        const idx = card.getAttribute('data-product-idx');
        if (idx) window.openProductModal(parseInt(idx));
    }
});

window.orderCart = () => {
    if (navigator.vibrate) navigator.vibrate(10);
    
    const message = generateCartWhatsAppMessage();
    if (message) {
        createWoodShavings({ target: document.querySelector('#cart-modal .btn-main') });
        openWhatsApp(message);
    } else {
        showToast("Váš košíček je prázdný, přidejte něco...", " 🪵 ");
    }
};

window.shareCart = () => {
    const cartItems = getCartItems();
    if (cartItems.length === 0) {
        showToast("Košíček je prázdný, není co sdílet.", "🪵");
        return;
    }
    
    let message = "🛒 Můj košík z Woodisek:\n\n";
    let totalSum = 0;
    
    cartItems.forEach(item => {
        const priceNum = parseInt(item.price.replace(/[^\d]/g, ''), 10) || 0;
        totalSum += priceNum * item.qty;
        const productLink = `${CONFIG.BASE_URL}#${item.id}`;
        message += `* ${item.qty}x ${item.name} - ${item.price}\n   Odkaz: ${productLink}\n\n`;
    });
    
    const totalText = totalSum > 0 ? `${totalSum.toLocaleString('cs-CZ')} Kč + poštovné` : '';
    message += `Celkem: ${totalText}\n\nObjednat: ${CONFIG.BASE_URL}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Můj košík - Woodisek',
            text: message
        }).catch(err => {
            if (err.name !== 'AbortError') {
                copyToClipboard(message);
            }
        });
    } else {
        copyToClipboard(message);
    }
};

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast("Obsah košíku zkopírován do schránky! 📋", "📋");
    }).catch(() => {
        showToast("Nepodařilo se zkopírovat.", "❌");
    });
}

window.scrollToAbout = () => {
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
        if (navigator.vibrate) navigator.vibrate(10);
        
        // Dočasně zakážeme infinite scroll
        window.isInfiniteScrollDisabled = true;
        
        aboutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        aboutSection.classList.add('section-highlight');
        
        // Po 2 sekundách zase povolíme
        setTimeout(() => {
            aboutSection.classList.remove('section-highlight');
            window.isInfiniteScrollDisabled = false;
        }, 2000);
    }
};

window.acceptGDPR = () => {
    acceptGDPR();
    const banner = document.getElementById('gdpr-banner');
    if (banner) banner.style.display = 'none';
    showToast("Děkuji za souhlas! 🍪", "✅");
    updateCartBadge();
    renderCart();
};

window.declineGDPR = () => {
    declineGDPR();
    const banner = document.getElementById('gdpr-banner');
    if (banner) banner.style.display = 'none';
    showToast("Košíček není ukládán. Pro uložení košíčku prosím přijměte cookies.", "🍪");
    updateCartBadge();
    renderCart();
};

window.toggleReviews = () => {
    const sidebar = document.getElementById('reviewsSidebar');
    if (sidebar) sidebar.classList.toggle('active');
};

window.handleScroll = () => {
    const backToTopBtn = document.getElementById("back-to-top");
    const floatingCartBtn = document.getElementById("floating-cart-btn");
    const scrollY = window.scrollY;
    const SCROLL_THRESHOLD = 400;
    
    if (backToTopBtn) {
        backToTopBtn.style.display = scrollY > SCROLL_THRESHOLD ? "flex" : "none";
    }
    
    if (floatingCartBtn) {
        if (scrollY > SCROLL_THRESHOLD) {
            floatingCartBtn.classList.add('show');
        } else {
            floatingCartBtn.classList.remove('show');
        }
    }
    
    if (activeOverlayIdx !== null && Math.abs(scrollY - scrollStartPos) > 25) {
        import('./ui.js').then(ui => ui.toggleOver(activeOverlayIdx, false));
    }
};

window.toggleMode = () => {
    const isLight = document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    const modeBtn = document.getElementById('mode-toggle');
    if (modeBtn) modeBtn.innerText = isLight ? ' ☀️ ' : ' 🌙 ';
    
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) {
        themeColor.setAttribute('content', isLight ? '#f5f2ed' : '#0d0d0d');
    }
};

window.togglePriceFilter = () => {
    const panel = document.getElementById('price-filter-panel');
    if (navigator.vibrate) navigator.vibrate(10);
    if (panel) {
        panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex';
    }
};

// ============================================================
// CHAT - STEJNÉ CHOVÁNÍ JAKO KOŠÍK
// ============================================================

window.toggleChatPanel = () => {
    const modal = document.getElementById('chat-modal');
    const bg = document.getElementById('chat-overlay-bg');
    const chatBtn = document.getElementById('chat-toggle-btn');
    
    if (!modal || !bg) return;
    
    if (modal.classList.contains('open')) {
        modal.classList.remove('open');
        bg.style.display = 'none';
        document.body.style.overflow = '';
        if (chatBtn) chatBtn.style.display = 'flex';
    } else {
        modal.classList.add('open');
        bg.style.display = 'block';
        document.body.style.overflow = 'hidden';
        if (chatBtn) chatBtn.style.display = 'none';
        
        // Inicializace chatu
        if (window.initChat && document.getElementById('chat-body')?.children.length === 0) {
            window.initChat();
        }
    }
};

window.closeChatPanel = () => {
    const modal = document.getElementById('chat-modal');
    const bg = document.getElementById('chat-overlay-bg');
    const chatBtn = document.getElementById('chat-toggle-btn');
    
    if (modal) modal.classList.remove('open');
    if (bg) bg.style.display = 'none';
    document.body.style.overflow = '';
    if (chatBtn) chatBtn.style.display = 'flex';
};

// Zavření ESC klávesou
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('chat-modal');
        if (modal && modal.classList.contains('open')) {
            window.closeChatPanel();
        }
    }
});

window.switchCategoryBySwipe = (direction) => {
    const filterButtons = Array.from(document.querySelectorAll('.f-btn'));
    if (filterButtons.length === 0) return;
    
    const activeButton = filterButtons.find(btn => btn.classList.contains('active'));
    let currentIndex = filterButtons.indexOf(activeButton);
    if (currentIndex === -1) currentIndex = 0;
    
    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = filterButtons.length - 1;
    if (newIndex >= filterButtons.length) newIndex = 0;
    
    const targetButton = filterButtons[newIndex];
    if (targetButton) {
        const category = targetButton.getAttribute('data-cat') || targetButton.innerText;
        if (typeof window.filterDataFromUI === 'function') {
            window.filterDataFromUI(category, targetButton);
        } else if (typeof window.filterData === 'function') {
            window.filterData(category, targetButton);
        } else {
            import('./ui.js').then(ui => ui.filterData(category, targetButton));
        }
        setTimeout(() => {
            targetButton.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }, 50);
    }
};

function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    const floatingBadge = document.getElementById('floating-cart-badge');
    const total = getCartTotalItems();
    
    if (badge) {
        badge.innerText = total;
        badge.style.display = total > 0 ? 'flex' : 'none';
    }
    
    if (floatingBadge) {
        floatingBadge.innerText = total;
        floatingBadge.style.display = total > 0 ? 'flex' : 'none';
    }
}

function renderCart() {
    const container = document.getElementById('cart-items-container');
    if (!container) return;
    
    const cartItems = getCartItems();
    const shippingPrice = getShippingPrice();
    const shippingText = getShippingText();
    
    let itemsHtml = '';
    let totalSum = 0;
    
if (cartItems.length === 0) {
    if (CONFIG.Enable_Empty_Cart_Message === false) {
        itemsHtml = `<div class="cart-empty" style="min-height: 200px;"></div>`;
    } else {
        const emptyText = CONFIG.Cart_Empty_Text || "Váš košíček je prázdný.";
        const emptyIcon = CONFIG.Cart_Empty_Icon || "🪵";
        itemsHtml = `
            <div class="cart-empty">
                <span class="cart-empty-icon">${emptyIcon}</span>
                <span class="cart-empty-text">${emptyText}</span>
            </div>
        `;
    }
} else {
        cartItems.forEach(item => {
            const priceNum = parseInt(item.price.replace(/[^\d]/g, ''), 10) || 0;
            totalSum += priceNum * item.qty;
            itemsHtml += `
                <div class="cart-item" data-id="${item.id}">
                    <button class="cart-remove" onclick="window.handleRemoveFromCart('${item.id}')"> ✕ </button>
                    <img src="${item.img}">
                    <div class="cart-item-info">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="st-line" style="margin: 2px 0;">
                            <span class="${item.stock !== "0" ? 'st-ok' : 'st-none'}">${item.stock !== "0" ? item.stock + ' ks' : 'Na zakázku'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div class="cart-item-price">${item.price}</div>
                            <div class="cart-controls">
                                <button class="qty-btn" onclick="window.handleChangeQty('${item.id}', -1)">-</button>
                                <span class="qty-val">${item.qty}</span>
                                <button class="qty-btn" onclick="window.handleChangeQty('${item.id}', 1)">+</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    container.innerHTML = itemsHtml;
    
    const totalWithShipping = totalSum + shippingPrice;
    const totalDisplay = totalWithShipping > 0 ? totalWithShipping.toLocaleString('cs-CZ') + ' Kč' : '';
    
    const totalPriceEl = document.getElementById('cart-total-price');
    if (totalPriceEl) {
        totalPriceEl.innerText = totalDisplay;
    }
    
    let shippingOptionsHtml = '';
    
    if (CONFIG.ShippingOptions && CONFIG.ShippingOptions.length > 0) {
        shippingOptionsHtml = `
            <div class="cart-shipping-section">
                <div class="cart-shipping-header" onclick="toggleShippingDropdown()">
                    <span>🚚 <strong id="selected-shipping-text">${shippingText}</strong></span>
                    <span class="shipping-dropdown-arrow">▼</span>
                </div>
                <div class="shipping-dropdown" id="shipping-dropdown" style="display: none;">
        `;
        
        CONFIG.ShippingOptions.forEach(opt => {
            const isSelected = selectedShipping && selectedShipping.id === opt.id;
            const priceText = opt.type === 'custom' ? 'Cena dle domluvy' : `${opt.price} Kč`;
            shippingOptionsHtml += `
                <div class="shipping-option ${isSelected ? 'selected' : ''}" onclick="selectShipping('${opt.id}')">
                    <div class="shipping-option-info">
                        <div class="shipping-option-name">${opt.name}</div>
                        <div class="shipping-option-price">${priceText}</div>
                    </div>
                    ${isSelected ? '<span class="shipping-option-check">✓</span>' : ''}
                </div>
            `;
        });
        
        shippingOptionsHtml += `</div></div>`;
    }
    
    const footer = document.querySelector('.cart-footer');
    if (footer) {
        footer.innerHTML = `
            ${shippingOptionsHtml}
            <div class="cart-total">
                <span>Celkem včetně dopravy:</span>
                <span id="cart-total-price-display">${totalDisplay}</span>
            </div>
            <button class="btn btn-main btn-pulse" onclick="orderCart()">${CONFIG.Cart_Button_Text}</button>
        `;
    }
}

window.handleRemoveFromCart = function(id) {
    if (navigator.vibrate) navigator.vibrate(10);
    removeFromCartModule(id);
    renderCart();
    updateCartBadge();
    showToast("Položka odebrána z košíčku", "🗑️");
};

window.handleChangeQty = function(id, delta) {
    if (navigator.vibrate) navigator.vibrate(10);
    changeCartItemQty(id, delta);
    renderCart();
    updateCartBadge();
};

setCartUpdateCallback(() => {
    updateCartBadge();
    renderCart();
});
setCartBadgeCallback(updateCartBadge);

function applyTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        const modeBtn = document.getElementById('mode-toggle');
        if (modeBtn) modeBtn.innerText = ' ☀️ ';
        const themeColor = document.querySelector('meta[name="theme-color"]');
        if (themeColor) themeColor.setAttribute('content', '#f5f2ed');
    } else {
        document.body.classList.remove('light-mode');
        const modeBtn = document.getElementById('mode-toggle');
        if (modeBtn) modeBtn.innerText = ' 🌙 ';
        const themeColor = document.querySelector('meta[name="theme-color"]');
        if (themeColor) themeColor.setAttribute('content', '#0d0d0d');
    }
}

window.toggleShippingDropdown = function() {
    if (navigator.vibrate) navigator.vibrate(10);
    const dropdown = document.getElementById('shipping-dropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
};

window.selectShipping = function(shippingId) {
    if (navigator.vibrate) navigator.vibrate(10);
    
    const success = setShipping(shippingId);
    if (success) {
        const shippingTextEl = document.getElementById('selected-shipping-text');
        if (shippingTextEl) {
            shippingTextEl.innerText = getShippingText();
        }
        const dropdown = document.getElementById('shipping-dropdown');
        if (dropdown) dropdown.style.display = 'none';
        renderCart();
        showToast(`Doprava změněna`, "🚚");
    }
};

document.addEventListener('click', function(event) {
    const shippingSection = document.querySelector('.cart-shipping-section');
    const dropdown = document.getElementById('shipping-dropdown');
    if (shippingSection && dropdown && !shippingSection.contains(event.target)) {
        dropdown.style.display = 'none';
    }
});

let blogScrollAttempts = 0;
const MAX_BLOG_SCROLL_ATTEMPTS = 10;

function handleHashScroll() {
    const hash = window.location.hash.substring(1);
    if (!hash || ['blog', 'about'].includes(hash)) return;

    const performScroll = () => {
        const target = document.getElementById(hash);
        if (target) {
            const offset = 100;
            const elementPosition = target.getBoundingClientRect().top + window.pageYOffset;
            window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
            target.classList.add('section-highlight');
            setTimeout(() => target.classList.remove('section-highlight'), 2000);
            return true;
        }
        return false;
    };

    // 1. POKUS: Je produkt už na stránce?
    if (performScroll()) return;

    // 2. POKUS: Produkt tu není. Najdeme ho v datech a vložíme ho na začátek!
    console.log("🔍 Produkt nenalezen v DOMu, vynucuji zobrazení...");
    
    if (typeof allProducts !== 'undefined' && allProducts.length > 0) {
        const productData = allProducts.find(p => p.id === hash);
        
        if (productData) {
            // Resetujeme filtry a limit, aby se mohl vykreslit
            window.currentCategory = 'Vše'; 
            
            // TADY JE TEN TRIK: Zavoláme render se všemi produkty
            // Tím se v HTML vytvoří úplně všechno a ID bude existovat.
            if (typeof renderProducts === 'function') {
                renderProducts(allProducts); 
                
                // Teď už tam je, tak srolujeme
                setTimeout(performScroll, 200);
            }
        }
    }
}

// ============================================================
// EVENT DELEGATION - JEDEN GLOBÁLNÍ LISTENER PRO VŠECHNY PRODUKTY
// ============================================================

document.getElementById('shop')?.addEventListener('click', (e) => {
    // Najdi nejbližší element s data-action
    const target = e.target.closest('[data-action]');
    if (!target) return;
    
    const action = target.getAttribute('data-action');
    const idx = target.getAttribute('data-idx');
    const productId = target.getAttribute('data-id');
    const productName = target.getAttribute('data-name');
    
    // Haptická odezva pro všechny akce
    if (navigator.vibrate) navigator.vibrate(10);
    
    switch(action) {
        case 'add-to-cart':
            if (idx) window.addToCart(parseInt(idx), e);
            break;
            
        case 'order-product':
            if (idx) window.orderProduct(parseInt(idx), e);
            break;
            
        case 'show-details':
            if (idx) window.toggleOver(parseInt(idx), true);
            break;
            
        case 'close-details':
            if (idx) window.toggleOver(parseInt(idx), false);
            break;
            
        case 'open-offer':
            if (idx) window.openOffer(parseInt(idx));
            break;
            
        case 'open-gallery':
            if (idx) window.openGal(parseInt(idx));
            break;
            
        case 'share-product':
            if (productId && productName) window.shareProduct(productId, productName, e);
            break;
            
        case 'prev-image':
            if (idx) window.chImg(parseInt(idx), -1, e);
            e.stopPropagation();
            break;
            
        case 'next-image':
            if (idx) window.chImg(parseInt(idx), 1, e);
            e.stopPropagation();
            break;
            
        default:
            console.log('Neznámá akce:', action);
    }
});

// ============================================================
// FALLBACK PRO toggleOver (když se karta nenačte)
// ============================================================

const originalToggleOver = window.toggleOver;
window.toggleOver = function(idx, show) {
    const p = allProducts?.find(x => x.idx === idx);
    if (!p) return;
    
    const card = document.getElementById(p.id);
    if (!card) {
        // Zkus to znovu za 100ms - karta se možná ještě nerenderovala
        setTimeout(() => window.toggleOver(idx, show), 100);
        return;
    }
    
    originalToggleOver(idx, show);
};

window.addEventListener('load', handleHashScroll);
window.addEventListener('hashchange', handleHashScroll);


function applyTextsFromSettings() {
    const logoImg = document.getElementById('about-logo');
    if (logoImg) logoImg.src = CONFIG.Logo_URL;

    // ============================================================
// KONTAKTNÍ SEKCE V ABOUT (telefon, WhatsApp, email)
// ============================================================
if (CONFIG.Show_Contact_Section) {
    // Zkontrolujeme, jestli už kontaktní sekce existuje
    let contactSection = document.getElementById('contact-section');
    
    if (!contactSection) {
        // Vytvoříme novou sekci
        const aboutDiv = document.getElementById('about');
        if (aboutDiv) {
            const portfolioSection = document.getElementById('portfolio-container');
            
            contactSection = document.createElement('div');
            contactSection.id = 'contact-section';
            contactSection.className = 'contact-section';
            contactSection.style.cssText = 'margin-top: 30px; padding: 20px; background: var(--card); border-radius: var(--border-radius); border: 1px solid var(--border);';
            
contactSection.innerHTML = `
    <h3 style="color: var(--accent); margin-bottom: 15px; font-size: 16px;">📞 Kontakt</h3>
    <div class="contact-links" style="display: flex; flex-direction: column; gap: 12px;">
        ${CONFIG.Contact_Phone ? `<a href="tel:+${CONFIG.Contact_Phone}" class="contact-link" style="display: flex; align-items: center; gap: 10px; color: var(--text); text-decoration: none; padding: 8px; background: #1a1a1a0a; border-radius: 12px;"><span>📱</span> ${formatPhoneNumber(CONFIG.Contact_Phone)}</a>` : ''}
        ${CONFIG.Contact_WhatsApp ? `<a href="https://wa.me/${CONFIG.Contact_WhatsApp}" target="_blank" class="contact-link" style="display: flex; align-items: center; gap: 10px; color: var(--text); text-decoration: none; padding: 8px; background: #1a1a1a0a; border-radius: 12px;"><span>💬</span> WhatsApp</a>` : ''}
        ${CONFIG.Contact_Email ? `<a href="mailto:${CONFIG.Contact_Email}" class="contact-link" style="display: flex; align-items: center; gap: 10px; color: var(--text); text-decoration: none; padding: 8px; background: #1a1a1a0a; border-radius: 12px;"><span>📧</span> ${CONFIG.Contact_Email}</a>` : ''}
    </div>
`;
            
            // Vložíme za portfolio slider
            if (portfolioSection) {
                portfolioSection.insertAdjacentElement('afterend', contactSection);
            } else {
                aboutDiv.appendChild(contactSection);
            }
        }
    } else {
contactSection.innerHTML = `
    <h3 style="color: var(--accent); margin-bottom: 15px; font-size: 16px;">📞 Kontakt</h3>
    <div class="contact-links" style="display: flex; flex-direction: column; gap: 12px;">
        ${CONFIG.Contact_Phone ? `<a href="tel:+${CONFIG.Contact_Phone}" class="contact-link" style="display: flex; align-items: center; gap: 10px; color: var(--text); text-decoration: none; padding: 8px; background: #1a1a1a0a; border-radius: 12px;"><span>📱</span> ${formatPhoneNumber(CONFIG.Contact_Phone)}</a>` : ''}
        ${CONFIG.Contact_WhatsApp ? `<a href="https://wa.me/${CONFIG.Contact_WhatsApp}" target="_blank" class="contact-link" style="display: flex; align-items: center; gap: 10px; color: var(--text); text-decoration: none; padding: 8px; background: #1a1a1a0a; border-radius: 12px;"><span>💬</span> WhatsApp</a>` : ''}
        ${CONFIG.Contact_Email ? `<a href="mailto:${CONFIG.Contact_Email}" class="contact-link" style="display: flex; align-items: center; gap: 10px; color: var(--text); text-decoration: none; padding: 8px; background: #1a1a1a0a; border-radius: 12px;"><span>📧</span> ${CONFIG.Contact_Email}</a>` : ''}
    </div>
`;
    }
} else {
    // Skryjeme kontaktní sekci pokud existuje
    const contactSection = document.getElementById('contact-section');
    if (contactSection) {
        contactSection.style.display = 'none';
    }
}

    
    const logoText = document.querySelector('.logo');
    if (logoText) logoText.innerText = CONFIG.Nazev_Firmy;
    
    const aboutTitle = document.getElementById('about-title');
    const aboutText = document.getElementById('about-text');
    const customTitle = document.getElementById('custom-title');
    const customText = document.getElementById('custom-text');
    const customBtn = document.getElementById('custom-wa-btn');
    
    const cartTitle = document.getElementById('cart-title');
    if (cartTitle) cartTitle.innerHTML = CONFIG.Cart_Title;
    
    if (aboutTitle) aboutTitle.innerText = CONFIG.About_Titulek;
    
    const chatBtn = document.getElementById('chat-toggle-btn');
if (chatBtn) {
    chatBtn.style.display = CONFIG.Enable_Chat ? 'flex' : 'none';
}

    if (aboutText) {
        let formattedText = CONFIG.About_Text;
        if (formattedText) {
            formattedText = formattedText.replace(/\n/g, '<br>');
            aboutText.innerHTML = formattedText;
        }
    }
    
        // ============================================================
    // NOVÉ: Aktualizace tlačítek v navigaci
    // ============================================================
    const productsBtn = document.getElementById('nav-products-btn');
    const blogBtn = document.getElementById('nav-blog-btn');
    const aboutBtn = document.getElementById('nav-about-btn');
    
    if (productsBtn && CONFIG.Menu_Button_Text_Products) {
        productsBtn.innerHTML = CONFIG.Menu_Button_Text_Products;
    }
    if (blogBtn && CONFIG.Menu_Button_Text_Blog) {
        blogBtn.innerHTML = CONFIG.Menu_Button_Text_Blog;
    }
    if (aboutBtn && CONFIG.Menu_Button_Text_About) {
        aboutBtn.innerHTML = CONFIG.Menu_Button_Text_About;
    }
const blogBtnNav = document.getElementById('nav-blog-btn');
const aboutBtnNav = document.getElementById('nav-about-btn');

if (blogBtnNav) {
    blogBtnNav.style.display = CONFIG.Show_Blog ? 'flex' : 'none';
}
if (aboutBtnNav) {
    aboutBtnNav.style.display = CONFIG.Show_About ? 'flex' : 'none';
}

console.log('🔧 Viditelnost tlačítek:', {
    Show_Blog: CONFIG.Show_Blog,
    Show_About: CONFIG.Show_About,
    Enable_Shop: CONFIG.Enable_Shop
});

console.log('🔧 Nastavení viditelnosti:', {
    Show_Blog: CONFIG.Show_Blog,
    Show_About: CONFIG.Show_About,
    blogBtn: blogBtnNav?.style.display,
    aboutBtn: aboutBtnNav?.style.display
});
    // ============================================================
    // NOVÉ: Aktualizace favicon
    // ============================================================
    if (CONFIG.Favicon_URL) {
        const favicon = document.querySelector('link[rel="icon"]');
        if (favicon) {
            favicon.href = CONFIG.Favicon_URL;
        }
    }
    
    // ============================================================
    // NOVÉ: Aktualizace meta tagů (SEO a sociální sítě)
    // ============================================================
    if (CONFIG.Meta_Description) {
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', CONFIG.Meta_Description);
        
        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) ogDesc.setAttribute('content', CONFIG.Meta_Description);
        
        const twitterDesc = document.querySelector('meta[name="twitter:description"]');
        if (twitterDesc) twitterDesc.setAttribute('content', CONFIG.Meta_Description.substring(0, 200));
    }
    
    if (CONFIG.OG_Image_URL) {
        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage) ogImage.setAttribute('content', CONFIG.OG_Image_URL);
        
        const twitterImage = document.querySelector('meta[name="twitter:image"]');
        if (twitterImage) twitterImage.setAttribute('content', CONFIG.OG_Image_URL);
    }
    
    // ============================================================
    // NOVÉ: Aktualizace GDPR banner textu
    // ============================================================
    const gdprText = document.getElementById('gdpr-banner-text');
    if (gdprText && CONFIG.GDPR_Banner_Text) {
        gdprText.innerHTML = CONFIG.GDPR_Banner_Text;
    
}
    const reviewsPanelText = document.getElementById('reviews-panel-text');
    if (reviewsPanelText && CONFIG.Reviews_Panel_Text) reviewsPanelText.innerHTML = CONFIG.Reviews_Panel_Text;
    
    const reviewsBtnText = document.getElementById('reviews-btn-text');
    if (reviewsBtnText && CONFIG.Reviews_Button_Text) reviewsBtnText.innerText = CONFIG.Reviews_Button_Text;
    
    const blogTitleText = document.getElementById('blog-title-text');
    if (blogTitleText && CONFIG.Blog_Title) blogTitleText.innerHTML = CONFIG.Blog_Title;
    
    const offerBtnText = document.getElementById('offer-btn-text');
    if (offerBtnText && CONFIG.Offer_Button_Text) offerBtnText.innerText = CONFIG.Offer_Button_Text;
    
    const productCountEl = document.getElementById("product-count");
    if (productCountEl && allProducts) {
        productCountEl.innerHTML = `${allProducts.length} ${CONFIG.Product_Count_Text || "🪵 produktů"}`;
    }
    
    if (customTitle) customTitle.innerText = CONFIG.Zakazkova_Tvorba_Titulek;
    if (customText) customText.innerText = CONFIG.Zakazkova_Tvorba_Text;
    
    if (customBtn) {
        customBtn.innerText = CONFIG.Custom_Order_Button_Text;
        customBtn.onclick = () => {
            const message = encodeURIComponent(CONFIG.Custom_Order_Message);
            window.open(`https://wa.me/${CONFIG.WhatsApp_Cislo_Zakazka}?text=${message}`);
        };
    }
    
    const footer = document.querySelector('footer');
    if (footer) footer.innerText = CONFIG.Footer_Text;
}

// ============================================================
// RYCHLÁ ANIMACE PRO VŠECHNA TLAČÍTKA (GLOBÁLNÍ)
// ============================================================

function addQuickTapAnimation(selector) {
    const buttons = document.querySelectorAll(selector);
    buttons.forEach(btn => {
        if (btn.hasAttribute('data-quick-animation')) return;
        btn.setAttribute('data-quick-animation', 'true');
        
        btn.addEventListener('mousedown', function() {
            this.style.transform = 'scale(0.92)';
        });
        
        btn.addEventListener('mouseup', function() {
            this.style.transform = '';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
        
        btn.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.92)';
        });
        
        btn.addEventListener('touchend', function() {
            this.style.transform = '';
        });
        
        btn.addEventListener('touchcancel', function() {
            this.style.transform = '';
        });
    });
}

// Inicializace pro všechna tlačítka
function initQuickAnimations() {
    const selectors = [
        '.btn-offer-small',
        '.btn-cart-small',
        '.btn.btn-main',
        '.btn.btn-sec',
        '#modal-order-btn',
        '#modal-cart-btn',
        '#modal-offer-btn',
        '#custom-wa-btn',
        '.btn.btn-main.btn-pulse',
        '.share-cart-btn'
    ];
    
    selectors.forEach(selector => {
        addQuickTapAnimation(selector);
    });
}

// Spuštění při načtení
document.addEventListener('DOMContentLoaded', initQuickAnimations);

// Pro dynamicky přidané prvky (např. po renderování produktů)
const observer = new MutationObserver(() => {
    initQuickAnimations();
});
observer.observe(document.body, { childList: true, subtree: true });


async function init() {
    applyTheme();
    await loadBlogPosts();
    renderBlogPosts();
    await loadSettings();        // ← 1. NAČTE SE CSV (včetně PortfolioImages)
    applyTextsFromSettings();
    updateNavButtonsVisibility();
    handleHashScroll();

    if (CONFIG.Maintenance_Mode === true) {
        showMaintenanceMode();
        return; // Zastaví načítání zbytku webu, takže zbyde jen obrazovka údržby
    }
    // ============================================================
    // NASTAVENÍ PORTFOLIO OBRÁZKŮ Z CONFIG (PŘED initPortfolio)
    // ============================================================
    if (CONFIG.PortfolioImages && Array.isArray(CONFIG.PortfolioImages) && CONFIG.PortfolioImages.length > 0) {
        portfolioImages.length = 0;
        CONFIG.PortfolioImages.forEach(img => portfolioImages.push(img));
        console.log('🖼️ PortfolioImages nastaveno z CONFIG před initPortfolio:', portfolioImages.length);
    } else if (typeof CONFIG.PortfolioImages === 'string' && CONFIG.PortfolioImages) {
        const images = CONFIG.PortfolioImages.match(/https?:\/\/[^\s,;"']+/g) || [];
        portfolioImages.length = 0;
        images.forEach(img => portfolioImages.push(img));
        console.log('🖼️ PortfolioImages nastaveno z stringu před initPortfolio:', portfolioImages.length);
    }
    
    // ============================================================
    // TEĎ UŽ MÁ portfolioImages DATA - MŮŽE SE INICIALIZOVAT
    // ============================================================
    handleHashScroll();
    initGDPR();
    initShipping();
    initPortfolio();              // ← TEĎ UŽ BUDE FUNGOVAT!
    initGlobalSwipeDetection((direction) => {
        window.switchCategoryBySwipe(direction);
    });
    initSocialProof();
    
    // ============================================================
    // KONTROLA OBCHODU
    // ============================================================
    if (CONFIG.Enable_Shop === false) {
    console.log("🚫 Obchod je vypnutý");
    
    // ZOBRAZÍME VYHLEDÁVÁNÍ A FILTRY
    const searchContainer = document.querySelector(".search-container");
    if (searchContainer) searchContainer.style.display = "block";
    
    const filtersContainer = document.getElementById("filters");
    if (filtersContainer) filtersContainer.style.display = "flex";
    
    const priceFilterBtn = document.getElementById("price-filter-toggle");
    if (priceFilterBtn) priceFilterBtn.style.display = "flex";
    
    // MALÝ TEXT POD LOGEM
    //const productCountEl = document.getElementById("product-count");
    //if (productCountEl) {
        productCountEl.style.display = 'block';
        productCountEl.innerHTML = '🪵 Obchod je dočasně zavřený...';
    ///}
    
    // VELKÁ ZPRÁVA V KARTĚ
    const shopContainer = document.getElementById("shop");
    if (shopContainer) {
        shopContainer.style.display = 'grid';
        shopContainer.innerHTML = `
            <div class="product-card" style="grid-column: 1 / -1; display: flex; align-items: center; justify-content: center; min-height: 300px;">
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 64px; margin-bottom: 20px;">🪵</div>
                    <h3 style="color: var(--accent); margin-bottom: 10px; font-size: 24px;">Obchod je dočasně zavřený</h3>
                    <p style="color: var(--text-dim); font-size: 16px;">Brzy tu bude veselo! Koukněte na můj blog :)</p>
                </div>
            </div>
        `;
    }
    shopContainer.innerHTML = `
<div class="product-card" style="grid-column: 1 / -1; display: flex; align-items: center; justify-content: center; min-height: 300px; cursor: default; transform: none !important; transition: none !important; box-shadow: none !important; outline: none !important; border: none !important;">
    <div style="text-align: center; padding: 40px;">
        <div class="shop-closed-icon" style="font-size: 64px; margin-bottom: 20px; display: inline-block;">🪵</div>
        <h3 class="shop-closed-title" style="color: var(--accent); margin-bottom: 10px; font-size: 24px;">Obchod je dočasně zavřený</h3>
        <p style="color: var(--text-dim); font-size: 16px;">Brzy tu bude veselo! Koukněte na můj blog :)</p>
    </div>
</div>
`;
    
    // Košík a ostatní
    const cartIconBtn = document.querySelector('.header-actions .icon-btn');
    if (cartIconBtn) cartIconBtn.style.display = 'flex';
    
    const floatingCartBtn = document.getElementById("floating-cart-btn");
    if (floatingCartBtn) floatingCartBtn.style.display = 'flex';
    
    // Portfolio, atd.
    initPortfolio();
    
    return;
}
    
    // ============================================================
    // ZBYTEK INICIALIZACE PRODUKTŮ
    // ============================================================
    const shopContainer = document.getElementById("shop");

    
    try {
        const data = await initProducts();
        
        // PortfolioImages už jsou nastavené, ale pokud initProducts() něco přepíše:
        if (CONFIG.PortfolioImages && Array.isArray(CONFIG.PortfolioImages) && CONFIG.PortfolioImages.length > 0) {
            portfolioImages.length = 0;
            CONFIG.PortfolioImages.forEach(img => portfolioImages.push(img));
        }
        
        renderFilters();
        applyFilters();
        handleHashScroll();
        initInfiniteScroll();
        
        // ... zbytek kódu ...
        
    } catch (error) {
        console.error("Chyba při inicializaci produktů:", error);
    }
    
    renderCart();
    setTimeout(() => {
    handleHashScroll();
}, 3000);
    updateCartBadge();
}

document.addEventListener('DOMContentLoaded', () => {
    init();
    window.addEventListener('load', () => {
    setTimeout(() => {
        handleHashScroll();
    }, 1500);
});
});

document.addEventListener('click', (event) => {
    const sidebar = document.getElementById('reviewsSidebar');
    if (sidebar && !sidebar.contains(event.target) && sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
    }
});

document.getElementById("galImg")?.addEventListener("load", function() {
    const spinner = document.getElementById("gal-spinner");
    if (spinner) spinner.style.display = "none";
    this.style.opacity = "1";
});

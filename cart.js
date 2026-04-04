import { CONFIG } from './config.js';

export let cart = [];
export let gdprConsent = null;
export let selectedShipping = null;
let onCartUpdate = null;

export function setCartUpdateCallback(callback) {
    onCartUpdate = callback;
}

export function saveCart() {
    if (gdprConsent === 'accepted') {
        const saveData = {
            cart: cart,
            shipping: selectedShipping
        };
        localStorage.setItem('woodisek_cart', JSON.stringify(saveData));
    }
    if (onCartUpdate) onCartUpdate();
}

export function loadCartFromStorage() {
    const savedData = localStorage.getItem('woodisek_cart');
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            cart = parsed.cart || [];
            if (parsed.shipping) {
                selectedShipping = parsed.shipping;
            } else {
                initShipping();
            }
        } catch(e) {
            cart = [];
            initShipping();
        }
    } else {
        cart = [];
        initShipping();
    }
    if (onCartUpdate) onCartUpdate();
}

export function initShipping() {
    if (!selectedShipping && CONFIG.ShippingOptions && CONFIG.ShippingOptions.length > 0) {
        const defaultShipping = CONFIG.ShippingOptions.find(opt => opt.id === CONFIG.DefaultShippingId);
        selectedShipping = defaultShipping || CONFIG.ShippingOptions[0];
    }
    if (onCartUpdate) onCartUpdate();
}

export function setShipping(shippingId) {
    const shipping = CONFIG.ShippingOptions.find(opt => opt.id === shippingId);
    if (shipping) {
        selectedShipping = shipping;
        saveCart();
        if (onCartUpdate) onCartUpdate();
        return true;
    }
    return false;
}

export function getShippingPrice() {
    if (!selectedShipping) return 0;
    return selectedShipping.type === "custom" ? 0 : selectedShipping.price;
}

export function getShippingText() {
    if (!selectedShipping) return "Nezvoleno";
    if (selectedShipping.type === "custom") {
        return `${selectedShipping.name} (cena bude upřesněna)`;
    }
    return `${selectedShipping.name} - ${selectedShipping.price} Kč`;
}

export function getOrderNumber() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 4).toUpperCase();
    return hours + minutes + random;
}

export function addToCart(product, event) {
    if (gdprConsent !== 'accepted') {
        return { success: false, reason: 'no_gdpr' };
    }
    const finalPrice = (product.sale && product.sale !== "0") ? product.sale : product.price;
    const existing = cart.find(i => i.id === product.id);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: finalPrice,
            stock: product.stock || "0",
            img: product.imgs[0],
            qty: 1
        });
    }
    saveCart();
    return { success: true };
}

export function changeCartItemQty(id, delta) {
    const item = cart.find(x => x.id === id);
    if (item) {
        item.qty += delta;
        if (item.qty <= 0) {
            cart = cart.filter(x => x.id !== id);
        }
        saveCart();
    }
}

export function removeFromCart(id) {
    cart = cart.filter(x => x.id !== id);
    saveCart();
}

export function generateCartWhatsAppMessage() {
    if (cart.length === 0) return null;
    let itemsText = "";
    let totalSum = 0;
    cart.forEach(item => {
        const priceNum = parseInt(item.price.replace(/[^\d]/g, ''), 10) || 0;
        totalSum += priceNum * item.qty;
        const stockInfo = (item.stock !== "0") ? `${item.stock} ks Skladem` : 'Na zakázku';
        const link = `${CONFIG.BASE_URL}#${item.id}`;
        itemsText += `- ${item.qty}x ${item.name} (${item.id}) [${item.price}]\n  Stav: ${stockInfo}\n  Odkaz: ${link}\n\n`;
    });
    const shippingPrice = getShippingPrice();
    const shippingText = getShippingText();
    const totalWithShipping = totalSum + shippingPrice;
    const totalText = totalSum > 0 ? `${totalWithShipping.toLocaleString('cs-CZ')} Kč` : 'Cena na zakázku';
    const orderNumber = getOrderNumber();
    let message = CONFIG.WhatsApp_Sablona
        .replace('{items}', itemsText)
        .replace('{shipping}', shippingText)
        .replace('{total}', totalText)
        .replace('{order_number}', orderNumber);
    return message;
}

export function openWhatsApp(message) {
    if (!message) return false;
    window.open(`https://wa.me/${CONFIG.PHONE}?text=${encodeURIComponent(message)}`);
    return true;
}

export function initGDPR() {
    gdprConsent = localStorage.getItem('gdpr_consent');
    if (gdprConsent === null) {
        return { needsConsent: true };
    } else if (gdprConsent === 'accepted') {
        loadCartFromStorage();
        return { needsConsent: false, consentGiven: true };
    } else {
        cart = [];
        if (onCartUpdate) onCartUpdate();
        return { needsConsent: false, consentGiven: false };
    }
}

export function acceptGDPR() {
    localStorage.setItem('gdpr_consent', 'accepted');
    gdprConsent = 'accepted';
    loadCartFromStorage();
    return true;
}

export function declineGDPR() {
    localStorage.setItem('gdpr_consent', 'declined');
    gdprConsent = 'declined';
    cart = [];
    saveCart();
    return true;
}

export function getCartTotalItems() {
    return cart.reduce((sum, item) => sum + item.qty, 0);
}

export function getCartItems() {
    return [...cart];
}

export function generateProductWhatsAppMessage(product) {
    console.warn('generateProductWhatsAppMessage je zastaralá, používá se košík');
    return '';
}
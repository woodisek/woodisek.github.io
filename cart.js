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
    
    // ZOHLEDNĚNÍ SLEVY (pokud je aplikovaná)
    let finalTotal = totalSum;
    let discountText = '';
    if (window.appliedDiscount && window.appliedDiscount.valid) {
        finalTotal = window.appliedDiscount.newTotal;
        discountText = `\n\nSleva: ${window.appliedDiscount.type === 'percent' ? window.appliedDiscount.value + '%' : window.appliedDiscount.value + ' Kč'} (kód: ${window.appliedDiscount.code})`;
    }
    
    const totalWithShipping = finalTotal + shippingPrice;
    const totalText = finalTotal > 0 ? `${totalWithShipping.toLocaleString('cs-CZ')} Kč` : 'Cena na zakázku';
    const orderNumber = getOrderNumber();
    
    let message = CONFIG.WhatsApp_Sablona
        .replace('{items}', itemsText)
        .replace('{shipping}', shippingText)
        .replace('{total}', totalText)
        .replace('{order_number}', orderNumber);
    
    // Přidáme informaci o slevě
    if (discountText) {
        message += discountText;
    }
    
    return message;
}

export function generateCartWhatsAppMessageWithOrderNumber(orderNumber, userAddress = "", userEmail = "") {
    if (cart.length === 0) return null;
    let itemsText = "";
    let totalSum = 0;
    cart.forEach(item => {
        const priceNum = parseInt(item.price.replace(/[^\d]/g, ''), 10) || 0;
        totalSum += priceNum * item.qty;
        const stockInfo = (item.stock !== "0") ? `${item.stock} ks Skladem` : 'Na zakázku';
        const link = `${CONFIG.BASE_URL}#${item.id}`;
        itemsText += `• ${item.qty}x ${item.name} (${item.id}) [${item.price}]\nStav: ${stockInfo}\nOdkaz: ${link}\n\n`;
    });
    
    const shippingPrice = getShippingPrice();
    const shippingText = getShippingText();
    
    // Výpočet cen pro variantu 1 (přehledný rozpis)
    let finalTotal = totalSum;
    let discountAmount = 0;
    let discountPercent = 0;
    let discountText = '';
    
    if (window.appliedDiscount && window.appliedDiscount.valid) {
        finalTotal = window.appliedDiscount.newTotal;
        discountAmount = totalSum - finalTotal;
        if (window.appliedDiscount.type === 'percent') {
            discountPercent = window.appliedDiscount.value;
            discountText = `Sleva: -${discountAmount.toLocaleString('cs-CZ')} Kč (${discountPercent}%) (kód: ${window.appliedDiscount.code})`;
        } else {
            discountText = `Sleva: -${discountAmount.toLocaleString('cs-CZ')} Kč (kód: ${window.appliedDiscount.code})`;
        }
    }
    
    const productsTotal = totalSum;
    const shippingPriceNum = shippingPrice;
    const totalWithShipping = finalTotal + shippingPrice;
    const totalText = finalTotal > 0 ? `${totalWithShipping.toLocaleString('cs-CZ')} Kč` : 'Cena na zakázku';
    
    // ZÍSKÁNÍ ÚDAJŮ Z PROFILU (jméno, telefon, email, adresa)
    let userName = "";
    let userPhone = "";
    let userEmailFromProfile = "";
    let userAddressFromProfile = "";
    
    // 1. Nejdříve zkusíme sessionStorage (nejrychlejší, vydrží i po refreshi)
    const cachedName = sessionStorage.getItem('woodisek_user_name');
    const cachedPhone = sessionStorage.getItem('woodisek_user_phone');
    const cachedEmail = sessionStorage.getItem('woodisek_user_email');
    const cachedAddress = sessionStorage.getItem('woodisek_user_address');
    
    if (cachedName) userName = cachedName;
    if (cachedPhone) userPhone = cachedPhone;
    if (cachedEmail) userEmailFromProfile = cachedEmail;
    if (cachedAddress) userAddressFromProfile = cachedAddress;
    
    // 2. Pokud v sessionStorage není, zkusíme localStorage
    if (!userName || !userPhone || !userEmailFromProfile || !userAddressFromProfile) {
        try {
            const userData = localStorage.getItem('woodisek_user');
            if (userData) {
                const user = JSON.parse(userData);
                if (!userName && user.name) userName = user.name;
                if (!userPhone && user.phone) userPhone = user.phone;
                if (!userEmailFromProfile && user.email) userEmailFromProfile = user.email;
                if (!userAddressFromProfile && user.address) userAddressFromProfile = user.address;
            }
        } catch(e) {}
    }
    
    // 3. Pokud stále není, zkusíme window.cachedUserProfile
    if ((!userName || !userPhone || !userEmailFromProfile || !userAddressFromProfile) && 
        typeof window !== 'undefined' && window.cachedUserProfile) {
        if (!userName && window.cachedUserProfile.name) userName = window.cachedUserProfile.name;
        if (!userPhone && window.cachedUserProfile.phone) userPhone = window.cachedUserProfile.phone;
        if (!userEmailFromProfile && window.cachedUserProfile.email) userEmailFromProfile = window.cachedUserProfile.email;
        if (!userAddressFromProfile && window.cachedUserProfile.address) userAddressFromProfile = window.cachedUserProfile.address;
    }
    
    // 4. Pokud máme email z parametru funkce, použijeme ten (přednost)
    if (userEmail && userEmail.trim() !== "") {
        userEmailFromProfile = userEmail;
    }
    
    // 5. Pokud máme adresu z parametru funkce, použijeme ten (přednost)
    if (userAddress && userAddress.trim() !== "") {
        userAddressFromProfile = userAddress;
    }
    
    // SESTAVENÍ ZPRÁVY - Varianta 1 (přehledný rozpis)
    let message = itemsText.trim();
    
    message += `\n\nČíslo objednávky: ${orderNumber}`;
    message += `\n${shippingText}`;
    
    if (discountText) {
        message += `\n\nMezisoučet (produkty): ${productsTotal.toLocaleString('cs-CZ')} Kč`;
        message += `\nDoprava: ${shippingPriceNum.toLocaleString('cs-CZ')} Kč`;
        message += `\n${discountText}`;
        message += `\nCelkem: ${totalText}`;
    } else {
        message += `\n\nMezisoučet (produkty): ${productsTotal.toLocaleString('cs-CZ')} Kč`;
        message += `\nDoprava: ${shippingPriceNum.toLocaleString('cs-CZ')} Kč`;
        message += `\nCelkem: ${totalText}`;
    }
    
    if (userName && userName.trim() !== "") {
        message += `\n\nJméno: ${userName}`;
    }
    
    if (userPhone && userPhone.trim() !== "") {
        message += `\nTelefon: ${userPhone}`;
    }
    
    if (userEmailFromProfile && userEmailFromProfile.trim() !== "") {
        message += `\nEmail: ${userEmailFromProfile}`;
    }
    
    if (userAddressFromProfile && userAddressFromProfile.trim() !== "") {
        message += `\nDoručovací adresa:\n${userAddressFromProfile}`;
    }
    
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

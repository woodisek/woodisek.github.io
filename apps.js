console.log('✅ apps.js loaded');
console.log('📦 initAppsGrid:', typeof initAppsGrid);
console.log('📦 apps manifest:', apps?.length);
import { initAppsGrid } from './app-loader.js';
import { apps } from './apps-manifest.js';

// Globální přístup
window.appsManifest = apps;

window.showApps = function() {
    
        console.log('🛠️ showApps called');
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
    const wishlistSection = document.getElementById('wishlist-section');
    
    if (shop) shop.style.display = 'none';
    if (searchContainer) searchContainer.style.display = 'none';
    if (filters) filters.style.display = 'none';
    if (productCount) productCount.style.display = 'none';
    if (priceFilterToggle) priceFilterToggle.style.display = 'none';
    if (blogSection) blogSection.style.display = 'none';
    if (aboutSection) aboutSection.style.display = 'none';
    if (portfolioSection) portfolioSection.style.display = 'none';
    if (wishlistSection) wishlistSection.style.display = 'none';
    if (userSection) userSection.style.display = 'none';
    
    // Vytvoř nebo zobraz apps sekci
    let appsSection = document.getElementById('apps-section');
    if (!appsSection) {
        appsSection = document.createElement('div');
        appsSection.id = 'apps-section';
        appsSection.className = 'apps-section';
        appsSection.style.cssText = 'max-width: 1200px; margin: 40px auto; padding: 20px; display: block;';
        document.body.appendChild(appsSection);
    } else {
        appsSection.style.display = 'block';
    }
    
    // Inicializuj grid aplikací pomocí app-loader systému
    if (typeof initAppsGrid === 'function') {
               console.log('📦 Calling initAppsGrid...');
        initAppsGrid();
    } else {
           console.error('❌ initAppsGrid is not a function');
        appsSection.innerHTML = '<p style="color: red; text-align: center;">❌ Chyba: app-loader.js nebyl načten</p>';
    }
};
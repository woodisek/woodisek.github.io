import { allProducts, portfolioImages } from './api.js';

let activeGalProdIdx = null;
let portIdx = 0;
let isSwiping = false;
let touchStartX = 0;
let touchStartY = 0;

let activeGalleryImages = [];
let activeGalleryIndex = 0;
let activeGalleryType = null;

window.openGal = function(idx) {
    if (isSwiping) return;
    
    if (!allProducts || allProducts.length === 0) return;
    
    activeGalProdIdx = idx;
    const p = allProducts.find(x => x.idx === idx);
    if (!p) return;
    
    const gal = document.getElementById("gal");
    const galImg = document.getElementById("galImg");
    const galSpinner = document.getElementById("gal-spinner");
    if (!gal || !galImg) return;
    
    if (galSpinner) galSpinner.style.display = "block";
    galImg.style.opacity = "0";
    galImg.loading = "lazy";
    galImg.src = p.imgs[p.cur];
    gal.style.display = "flex";
    
    const galPrev = document.getElementById("galPrev");
    const galNext = document.getElementById("galNext");
    if (galPrev) galPrev.style.display = p.imgs.length > 1 ? "flex" : "none";
    if (galNext) galNext.style.display = p.imgs.length > 1 ? "flex" : "none";
    
    activeGalleryImages = [];
    activeGalleryIndex = 0;
    activeGalleryType = null;
    
    // Reset zoom při otevření
    if (window.resetGalleryZoom) window.resetGalleryZoom();
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
        // Reset zoom při změně obrázku
        if (window.resetGalleryZoom) window.resetGalleryZoom();
    }
};

export function initPortfolio() {
    const portfolioContainer = document.getElementById("portfolio-container");
    if (!portfolioContainer) return;
    
    if (portfolioImages && portfolioImages.length > 0) {
        portfolioContainer.style.display = "block";
        portIdx = 0;
        updatePortfolioImage();
    } else {
        portfolioContainer.style.display = "none";
    }
}

function updatePortfolioImage() {
    const img = document.getElementById("port-img");
    const spin = document.getElementById("port-spin");
    const tag = document.getElementById("port-tag");
    
    if (!img || !spin || !tag) return;
    if (!portfolioImages || portfolioImages.length === 0) return;
    
    if (portIdx < 0) portIdx = 0;
    if (portIdx >= portfolioImages.length) portIdx = portfolioImages.length - 1;
    
    const imgUrl = portfolioImages[portIdx];
    if (!imgUrl) return;
    
    spin.style.display = "block";
    img.style.opacity = "0";
    img.style.display = "block";
    
    tag.innerText = `${portIdx + 1} / ${portfolioImages.length}`;
    
    img.onload = () => {
        spin.style.display = "none";
        img.style.opacity = "1";
    };
    
    img.onerror = () => {
        spin.style.display = "none";
        img.style.display = "none";
    };
    
    img.loading = "lazy";
    img.src = imgUrl;
}

window.navPort = function(step) {
    if (!portfolioImages || portfolioImages.length === 0) return;
    
    const newIndex = portIdx + step;
    if (newIndex >= 0 && newIndex < portfolioImages.length) {
        portIdx = newIndex;
    } else if (newIndex < 0) {
        portIdx = portfolioImages.length - 1;
    } else if (newIndex >= portfolioImages.length) {
        portIdx = 0;
    }
    
    updatePortfolioImage();
    
    const gal = document.getElementById("gal");
    if (gal && gal.style.display === "flex" && activeGalleryType === 'portfolio') {
        activeGalleryIndex = portIdx;
        const galImg = document.getElementById("galImg");
        const galSpinner = document.getElementById("gal-spinner");
        if (galSpinner) galSpinner.style.display = "block";
        if (galImg) {
            galImg.style.opacity = "0";
            galImg.src = portfolioImages[portIdx];
        }
        // Reset zoom
        if (window.resetGalleryZoom) window.resetGalleryZoom();
    }
};

window.openPortfolioZoom = function() {
    if (!portfolioImages || portfolioImages.length === 0) return;
    
    activeGalleryImages = [...portfolioImages];
    activeGalleryIndex = portIdx;
    activeGalleryType = 'portfolio';
    
    const gal = document.getElementById("gal");
    const galImg = document.getElementById("galImg");
    const galSpinner = document.getElementById("gal-spinner");
    
    if (!gal || !galImg) return;
    
    if (galSpinner) galSpinner.style.display = "block";
    galImg.style.opacity = "0";
    galImg.src = portfolioImages[portIdx];
    gal.style.display = "flex";
    
    const galPrev = document.getElementById("galPrev");
    const galNext = document.getElementById("galNext");
    if (galPrev) galPrev.style.display = portfolioImages.length > 1 ? "flex" : "none";
    if (galNext) galNext.style.display = portfolioImages.length > 1 ? "flex" : "none";
    
    galImg.onload = function() {
        if (galSpinner) galSpinner.style.display = "none";
        galImg.style.opacity = "1";
    };
    
    if (galImg.complete) {
        if (galSpinner) galSpinner.style.display = "none";
        galImg.style.opacity = "1";
    }
    
    activeGalProdIdx = null;
    
    // Reset zoom
    if (window.resetGalleryZoom) window.resetGalleryZoom();
};

window.openQrZoom = function() {
    activeGalProdIdx = 9999;
    activeGalleryImages = [];
    activeGalleryType = null;
    
    const gal = document.getElementById("gal");
    const galImg = document.getElementById("galImg");
    const galSpinner = document.getElementById("gal-spinner");
    if (!gal || !galImg) return;
    
    if (galSpinner) galSpinner.style.display = "block";
    galImg.style.opacity = "0";
    galImg.src = "https://i.ibb.co/qF1FyvG2/mbank.jpg";
    gal.style.display = "flex";
    
    const galPrev = document.getElementById("galPrev");
    const galNext = document.getElementById("galNext");
    if (galPrev) galPrev.style.display = "none";
    if (galNext) galNext.style.display = "none";
    
    // Reset zoom
    if (window.resetGalleryZoom) window.resetGalleryZoom();
};

window.navGal = function(step, e) {
    if (e) e.stopPropagation();
    
    if (activeGalleryImages && activeGalleryImages.length > 0) {
        const newIndex = (activeGalleryIndex + step + activeGalleryImages.length) % activeGalleryImages.length;
        activeGalleryIndex = newIndex;
        
        if (activeGalleryType === 'portfolio') {
            portIdx = newIndex;
            updatePortfolioImage();
        }
        
        const galImg = document.getElementById("galImg");
        const galSpinner = document.getElementById("gal-spinner");
        
        if (galSpinner) galSpinner.style.display = "block";
        if (galImg) {
            galImg.style.opacity = "0";
            galImg.src = activeGalleryImages[newIndex];
        }
        
        // Reset zoom
        if (window.resetGalleryZoom) window.resetGalleryZoom();
        return;
    }
    
    if (activeGalProdIdx === null) {
        if (portfolioImages.length === 0) return;
        navPortfolio(step);
        const galImg = document.getElementById("galImg");
        const galSpinner = document.getElementById("gal-spinner");
        if (galImg && portfolioImages[portIdx]) {
            if (galSpinner) galSpinner.style.display = "block";
            galImg.style.opacity = "0";
            galImg.src = portfolioImages[portIdx];
        }
        // Reset zoom
        if (window.resetGalleryZoom) window.resetGalleryZoom();
    } else if (activeGalProdIdx === 9999) {
        return;
    } else {
        window.chImg(activeGalProdIdx, step);
    }
};

function navPortfolio(step) {
    if (!portfolioImages || portfolioImages.length === 0) return;
    
    const newIndex = portIdx + step;
    if (newIndex >= 0 && newIndex < portfolioImages.length) {
        portIdx = newIndex;
    } else if (newIndex < 0) {
        portIdx = portfolioImages.length - 1;
    } else if (newIndex >= portfolioImages.length) {
        portIdx = 0;
    }
    
    updatePortfolioImage();
}

window.closeGal = function() {
    if (!isSwiping) {
        const gal = document.getElementById("gal");
        if (gal) gal.style.display = "none";
        
        const galImg = document.getElementById("galImg");
        const currentSrc = galImg ? galImg.src : '';
        
        // Synchronizace s modalem
        if (currentSrc && currentSrc !== window.location.href) {
            const modalImg = document.getElementById('modal-main-img');
            const modalSpinner = document.getElementById('modal-spinner');
            const modalCounter = document.getElementById('modal-counter');
            
            if (modalImg) {
                if (modalSpinner) modalSpinner.style.display = 'block';
                modalImg.style.opacity = '0';
                modalImg.src = currentSrc;
                
                // Aktualizovat čítač
                if (window.allProducts && window.activeProductId) {
                    const product = window.allProducts.find(p => p.idx === window.activeProductId);
                    if (product && product.imgs && modalCounter) {
                        const newIndex = product.imgs.findIndex(img => img === currentSrc);
                        if (newIndex !== -1) {
                            modalCounter.innerText = `${newIndex + 1} / ${product.imgs.length}`;
                            product.cur = newIndex;
                        }
                    }
                }
                
                modalImg.onload = function() {
                    if (modalSpinner) modalSpinner.style.display = 'none';
                    modalImg.style.opacity = '1';
                };
            }
        }
        
        // Vyčistit
        activeGalProdIdx = null;
        activeGalleryImages = [];
        activeGalleryIndex = 0;
        activeGalleryType = null;
        window.activeProductId = null;
        window.modalProductImages = null;
        
        const galSpinner = document.getElementById("gal-spinner");
        if (galSpinner) galSpinner.style.display = "none";
        
        // Reset zoom při zavření
        if (window.resetGalleryZoom) window.resetGalleryZoom();
    }
};

window.handleTouchStart = function(e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    
    // 👇 PŘESUNUTO DOVNITŘ FUNKCE 👇
    const img = document.getElementById('galImg');
    if (img && img.contains(e.target)) {
        // Nechat zoom fungovat - neukládat pozici pro swipe
        touchStartX = 0;
        touchStartY = 0;
    }
};

window.handleTouchEnd = function(e, idx, isModal) {
    // Ignorovat pokud se dotýkáme obrázku
    const img = document.getElementById('galImg');
    if (img && img.contains(e.target)) {
        return;
    }
    
    // Pokud touchStartX je 0, znamená to že swipe byl zablokován
    if (touchStartX === 0) return;
    
    const diffX = touchStartX - e.changedTouches[0].screenX;
    const diffY = touchStartY - e.changedTouches[0].screenY;
    const SWIPE_THRESHOLD = 50;
    
    if (Math.abs(diffX) > SWIPE_THRESHOLD && Math.abs(diffX) > Math.abs(diffY)) {
        isSwiping = true;
        setTimeout(() => isSwiping = false, 150);
        
        const direction = diffX > 0 ? 1 : -1;
        
        if (activeGalleryImages && activeGalleryImages.length > 0) {
            const newIndex = (activeGalleryIndex + direction + activeGalleryImages.length) % activeGalleryImages.length;
            activeGalleryIndex = newIndex;
            
            if (activeGalleryType === 'portfolio') {
                portIdx = newIndex;
                updatePortfolioImage();
            }
            
            const galImg = document.getElementById("galImg");
            const galSpinner = document.getElementById("gal-spinner");
            if (galSpinner) galSpinner.style.display = "block";
            if (galImg) {
                galImg.style.opacity = "0";
                galImg.src = activeGalleryImages[newIndex];
            }
            // Reset zoom
            if (window.resetGalleryZoom) window.resetGalleryZoom();
            return;
        }
        
        const gal = document.getElementById("gal");
        const isGalOpen = gal && gal.style.display === "flex";
        
        if (isGalOpen) {
            if (activeGalProdIdx === null) {
                navPortfolio(direction);
                const galImg = document.getElementById("galImg");
                const galSpinner = document.getElementById("gal-spinner");
                if (galImg && portfolioImages[portIdx]) {
                    if (galSpinner) galSpinner.style.display = "block";
                    galImg.style.opacity = "0";
                    galImg.src = portfolioImages[portIdx];
                }
                // Reset zoom
                if (window.resetGalleryZoom) window.resetGalleryZoom();
            } else if (activeGalProdIdx !== 9999) {
                window.chImg(activeGalProdIdx, direction);
            }
        }
    }
};

let globalTouchStartX = 0;
let globalTouchStartY = 0;
let startedOnFilters = false;
let lastSwipeTime = 0;
let lastSwipeDirection = 0;

export function initGlobalSwipeDetection(switchCategoryCallback) {
    document.addEventListener('touchstart', function(e) {
        const touch = e.changedTouches[0];
        globalTouchStartX = touch.clientX;
        globalTouchStartY = touch.clientY;
        
        // Kontrola na tlačítka kategorií (filters)
        const filtersContainer = document.getElementById('filters');
        if (filtersContainer) {
            const rect = filtersContainer.getBoundingClientRect();
            startedOnFilters = (
                touch.clientX >= rect.left && 
                touch.clientX <= rect.right && 
                touch.clientY >= rect.top && 
                touch.clientY <= rect.bottom
            );
        }
        
        // 👇 PŘIDAT: Kontrola na panel filtrů (cena, řazení)
        const priceFilterPanel = document.getElementById('price-filter-panel');
        if (priceFilterPanel && priceFilterPanel.style.display === 'flex') {
            const panelRect = priceFilterPanel.getBoundingClientRect();
            const touchedOnPanel = (
                touch.clientX >= panelRect.left && 
                touch.clientX <= panelRect.right && 
                touch.clientY >= panelRect.top && 
                touch.clientY <= panelRect.bottom
            );
            if (touchedOnPanel) {
                startedOnFilters = true;  // Zabrání swipování kategorií
                return;
            }
        }
    }, { passive: true });
    
    document.addEventListener('touchend', function(e) {
        const touch = e.changedTouches[0];
        const diffX = globalTouchStartX - touch.clientX;
        const diffY = globalTouchStartY - touch.clientY;
        const SWIPE_THRESHOLD = 50;
        
        if (startedOnFilters) {
            startedOnFilters = false;
            return;
        }
        
        const gal = document.getElementById("gal");
        const isGalOpen = gal && gal.style.display === "flex";
        
        if (isGalOpen) {
            startedOnFilters = false;
            return;
        }
        
        const now = Date.now();
        if (now - lastSwipeTime < 300) {
            startedOnFilters = false;
            return;
        }
        
        if (Math.abs(diffX) > SWIPE_THRESHOLD && Math.abs(diffX) > Math.abs(diffY)) {
            const direction = diffX > 0 ? 1 : -1;
            
            if (direction === lastSwipeDirection && (now - lastSwipeTime) < 500) {
                startedOnFilters = false;
                return;
            }
            
            lastSwipeTime = now;
            lastSwipeDirection = direction;
            
            switchCategoryCallback(direction);
        }
        
        startedOnFilters = false;
    });
}

window.openImageGallery = function(images, startIndex = 0, type = 'blog') {
    if (!images || images.length === 0) return;
    
    activeGalleryImages = images;
    activeGalleryIndex = startIndex;
    activeGalleryType = type;
    
    const gal = document.getElementById("gal");
    const galImg = document.getElementById("galImg");
    const galSpinner = document.getElementById("gal-spinner");
    
    if (!gal || !galImg) return;
    
    if (galSpinner) galSpinner.style.display = "block";
    galImg.style.opacity = "0";
    galImg.src = images[startIndex];
    
    // Reset zoom
    if (window.resetGalleryZoom) {
        window.resetGalleryZoom();
    } else {
        galImg.style.transform = 'scale(1)';
    }
    
    gal.style.display = "flex";
    
    const galPrev = document.getElementById("galPrev");
    const galNext = document.getElementById("galNext");
    if (galPrev) galPrev.style.display = images.length > 1 ? "flex" : "none";
    if (galNext) galNext.style.display = images.length > 1 ? "flex" : "none";
    
    activeGalProdIdx = null;
    
    galImg.onload = function() {
        if (galSpinner) galSpinner.style.display = "none";
        galImg.style.opacity = "1";
    };
    
    if (galImg.complete) {
        if (galSpinner) galSpinner.style.display = "none";
        galImg.style.opacity = "1";
    }
};

// ========================================
// PINCH ZOOM + PAN PRO GALERII
// ========================================
(function initGalleryZoom() {
    // Počkáme až DOM bude připravený
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupGalleryZoom);
    } else {
        setupGalleryZoom();
    }
    
    function setupGalleryZoom() {
        const container = document.querySelector('.gal-zoom-container');
        const img = document.getElementById('galImg');
        const gal = document.getElementById('gal');  // 👈 PŘIDAT TENTO ŘÁDEK
        
        if (!container || !img || !gal) return;     // 👈 PŘIDAT gal DO KONTROLY
        
        // Swipe na pozadí galerie
        let galTouchStartX = 0;
        
        gal.addEventListener('touchstart', function(e) {
            // Jen pokud se nedotýkáme obrázku
            if (!img.contains(e.target)) {
                galTouchStartX = e.changedTouches[0].screenX;
            }
        }, { passive: true });
        
        gal.addEventListener('touchend', function(e) {
            // Jen pokud se nedotýkáme obrázku
            if (!img.contains(e.target) && galTouchStartX > 0) {
                const diffX = galTouchStartX - e.changedTouches[0].screenX;
                const SWIPE_THRESHOLD = 50;
                
                if (Math.abs(diffX) > SWIPE_THRESHOLD) {
                    const direction = diffX > 0 ? 1 : -1;
                    window.navGal(direction, e);
                }
                galTouchStartX = 0;
            }
        });

        let panning = false;
        let startX = 0, startY = 0, scrollLeft = 0, scrollTop = 0;
        let startDistance = 0;
        
        img.addEventListener('touchstart', function(e) {
            if (e.touches.length === 2) {
                e.preventDefault();
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                startDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
            } else if (e.touches.length === 1) {
                panning = true;
                startX = e.touches[0].pageX - container.offsetLeft;
                startY = e.touches[0].pageY - container.offsetTop;
                scrollLeft = container.scrollLeft;
                scrollTop = container.scrollTop;
            }
        }, { passive: false });
        
        img.addEventListener('touchmove', function(e) {
            if (e.touches.length === 2) {
                e.preventDefault();
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                
                // Střed mezi dvěma prsty
                const centerX = (touch1.clientX + touch2.clientX) / 2;
                const centerY = (touch1.clientY + touch2.clientY) / 2;
                
                const currentDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
                
                if (startDistance > 0) {
                    const newScale = Math.min(Math.max(currentDistance / startDistance, 1), 3);
                    
                    // Nastavit transform-origin na střed prstů
                    const rect = this.getBoundingClientRect();
                    const originX = ((centerX - rect.left) / rect.width) * 100;
                    const originY = ((centerY - rect.top) / rect.height) * 100;
                    
                    this.style.transformOrigin = `${originX}% ${originY}%`;
                    this.style.transform = `scale(${newScale})`;
                }
            } else if (e.touches.length === 1 && panning) {
                const x = e.touches[0].pageX - container.offsetLeft;
                const y = e.touches[0].pageY - container.offsetTop;
                const walkX = (x - startX) * 1.5;
                const walkY = (y - startY) * 1.5;
                container.scrollLeft = scrollLeft - walkX;
                container.scrollTop = scrollTop - walkY;
            }
        }, { passive: false });
        
        img.addEventListener('touchend', function() {
            panning = false;
            startDistance = 0;
        });
        
        // Reset zoom funkce
        window.resetGalleryZoom = function() {
            if (img) {
                img.style.transform = 'scale(1)';
                img.style.transformOrigin = 'center center';
                if (container) {
                    container.scrollLeft = 0;
                    container.scrollTop = 0;
                }
            }
        };
    }
})();

export { activeGalProdIdx, portIdx, isSwiping };
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
        activeGalProdIdx = null;
        
        activeGalleryImages = [];
        activeGalleryIndex = 0;
        activeGalleryType = null;
        
        const galSpinner = document.getElementById("gal-spinner");
        if (galSpinner) galSpinner.style.display = "none";
    }
};

window.handleTouchStart = function(e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
};

window.handleTouchEnd = function(e, idx, isModal) {
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

export { activeGalProdIdx, portIdx, isSwiping };
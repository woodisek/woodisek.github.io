export let blogPosts = [];

export async function loadBlogPosts() {
    try {
        const BLOG_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTDLmB1BcPIJvI1rVpHHK59r7zTfZJVmQ30BofKB2wszp8aZxJBwLhjwTwbzHkZ1kiozdl7YDQO2cVI/pub?gid=102891134&single=true&output=csv";
        
        const url = BLOG_URL + "&t=" + Date.now();
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const csvText = await response.text();
        blogPosts = parseBlogCSV(csvText);
        return blogPosts;
        
    } catch (error) {
        blogPosts = [];
        return [];
    }
}

function parseBlogCSV(csvText) {
    const rows = csvText.split("\n");
    const posts = [];
    
    for (let i = 1; i < rows.length; i++) {
        if (!rows[i].trim()) continue;
        
        const columns = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(s => s.replace(/^"|"$/g, '').trim());
        
        if (columns.length < 7) continue;
        
        const isActive = columns[6] === "TRUE" || columns[6] === "true" || columns[6] === "ANO";
        if (!isActive) continue;
        
        let images = [];
        let videoUrl = null;
        const type = columns[3];
        
        if (columns[4]) {
            const urls = columns[4].split(/\s+/).filter(url => url && url.trim() !== "");
            
            if (type === 'video' && urls.length > 0) {
                videoUrl = urls[0];
                images = urls.slice(1);
            } else {
                images = urls.filter(url => url.match(/^https?:\/\//i));
            }
        }
        
        if (images.length === 0 && type !== 'video') {
            images = ['https://via.placeholder.com/400x400?text=No+Image'];
        }
        
        posts.push({
            id: columns[0],
            title: columns[1],
            text: columns[2].replace(/\\n/g, '<br>'),
            type: type,
            images: images,
            videoUrl: videoUrl,
            order: parseInt(columns[5]) || 999,
            active: isActive
        });
    }
    
    posts.sort((a, b) => a.order - b.order);
    
    return posts;
}

// Handler pro video v modalu (NEPOUŽÍVÁ stopPropagation - fullscreen bude fungovat)
window.handleModalVideoClick = function(event) {
    // Zastavíme propagaci JEN aby se neotevřel modal znovu (ale neblokujeme fullscreen)
    event.stopPropagation();
    
    const placeholder = event.target.closest('.video-placeholder');
    if (!placeholder) return;
    
    // Pokud už je video načtené, neděláme nic (YouTube ovládání přebere klik)
    if (placeholder.querySelector('iframe')) return;
    
    // Načti video
    loadVideo(placeholder);
};

function highlightLinks(text) {
    if (!text) return '';
    const urlRegex = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi;
    return text.replace(urlRegex, (url) => {
        let href = url;
        if (!href.startsWith('http')) {
            href = 'https://' + href;
        }
        return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="blog-link">${url}</a>`;
    });
}

window.openBlogImageFromModal = function(postId, event) {
    if (event) event.stopPropagation();
    
    const post = blogPosts.find(p => p.id === postId);
    if (!post || !post.images || post.images.length === 0) return;
    
    const container = document.querySelector(`.modal-img-box[data-modal-post-id="${postId}"]`);
    let currentIndex = container ? parseInt(container.getAttribute('data-modal-current-index')) || 0 : 0;
    
    if (typeof window.openImageGallery === 'function') {
        window.openImageGallery(post.images, currentIndex, 'blog');
    } else {
        window.open(post.images[currentIndex], '_blank');
    }
};

window.closeBlogModal = function() {
    const modal = document.getElementById('blog-modal-overlay');
    if (modal) {
        // Najdi video v modalu a zastav ho
        const videoPlaceholder = modal.querySelector('.video-placeholder');
        if (videoPlaceholder) {
            stopVideo(videoPlaceholder);
        }
        
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
};

function createSliderHTML(postId, images, currentIndex = 0) {
    if (!images || images.length === 0) return '';
    
    return `
        <div class="blog-slider" data-post-id="${postId}" data-current-index="${currentIndex}">
            <div class="img-box" onclick="window.openBlogImageGallery('${postId}', event)" ontouchstart="window.handleTouchStart(event)" ontouchend="window.handleTouchEnd(event, null, true)">
                <div class="spinner" id="blog-spin-${postId}"></div>
                <img class="main-img" id="blog-img-${postId}" src="${images[currentIndex]}" loading="lazy" decoding="async" alt="">
                ${images.length > 1 ? `
                    <button class="nav-btn btn-prev" onclick="window.navigateBlogSlider('${postId}', -1, event)">‹</button>
                    <button class="nav-btn btn-next" onclick="window.navigateBlogSlider('${postId}', 1, event)">›</button>
                    <div class="cnt-tag" id="blog-ct-${postId}">${currentIndex + 1} / ${images.length}</div>
                ` : ''}
            </div>
        </div>
    `;
}

window.navigateModalSlider = function(postId, direction, event) {
    if (event) event.stopPropagation();
    
    const post = blogPosts.find(p => p.id === postId);
    if (!post || !post.images || post.images.length <= 1) return;
    
    const container = document.querySelector(`.modal-img-box[data-modal-post-id="${postId}"]`);
    if (!container) return;
    
    let currentIndex = parseInt(container.getAttribute('data-modal-current-index')) || 0;
    const newIndex = (currentIndex + direction + post.images.length) % post.images.length;
    
    container.setAttribute('data-modal-current-index', newIndex);
    
    const img = document.getElementById(`modal-img-${postId}`);
    const spinner = document.getElementById(`modal-spin-${postId}`);
    const counter = document.getElementById(`modal-ct-${postId}`);
    
    if (spinner) spinner.style.display = 'block';
    if (img) {
        img.style.opacity = '0';
        img.src = post.images[newIndex];
        img.onload = function() {
            if (spinner) spinner.style.display = 'none';
            img.style.opacity = '1';
        };
    }
    if (counter) counter.innerText = `${newIndex + 1} / ${post.images.length}`;
};

window.navigateBlogSlider = function(postId, direction, event) {
    if (event) event.stopPropagation();
    
    const post = blogPosts.find(p => p.id === postId);
    if (!post || !post.images || post.images.length <= 1) return;
    
    const sliderDiv = document.querySelector(`.blog-slider[data-post-id="${postId}"]`);
    if (!sliderDiv) return;
    
    let currentIndex = parseInt(sliderDiv.getAttribute('data-current-index')) || 0;
    const newIndex = (currentIndex + direction + post.images.length) % post.images.length;
    
    sliderDiv.setAttribute('data-current-index', newIndex);
    
    const img = document.getElementById(`blog-img-${postId}`);
    const spinner = document.getElementById(`blog-spin-${postId}`);
    const counter = document.getElementById(`blog-ct-${postId}`);
    
    if (spinner) spinner.style.display = "block";
    if (img) {
        img.style.opacity = "0";
        img.src = post.images[newIndex];
    }
    if (counter) counter.innerText = `${newIndex + 1} / ${post.images.length}`;
    
    img.onload = function() {
        if (spinner) spinner.style.display = "none";
        img.style.opacity = "1";
    };
};

window.openBlogImageGallery = function(postId, event) {
    if (event?.target?.closest('.share-blog-btn')) return;
    if (event?.target?.closest('.nav-btn')) return;
    
    const post = blogPosts.find(p => p.id === postId);
    if (!post || !post.images || post.images.length === 0) return;
    
    const sliderDiv = document.querySelector(`.blog-slider[data-post-id="${postId}"]`);
    let currentIndex = sliderDiv ? parseInt(sliderDiv.getAttribute('data-current-index')) || 0 : 0;
    
    if (typeof window.openImageGallery === 'function') {
        window.openImageGallery(post.images, currentIndex, 'blog');
    } else {
        window.open(post.images[currentIndex], '_blank');
    }
};

window.openBlogModalOnCard = function(postId, event) {
    if (event.target.closest('.blog-slider')) return;
    if (event.target.closest('.nav-btn')) return;
    if (event.target.closest('.blog-read-more')) return;
    if (event.target.closest('.share-blog-btn')) return;
    window.openBlogModal(postId, event);
};

window.shareBlogPost = function(postId, event) {
    if (event) event.stopPropagation();
    
    const post = blogPosts.find(p => p.id === postId);
    if (!post) return;
    
    let cleanId = post.id;
    if (cleanId.startsWith('blog_')) {
        cleanId = cleanId.substring(5);
    }
    
    const shareUrl = `${window.location.origin}${window.location.pathname}#blog_${cleanId}`;
    
    if (navigator.share) {
        navigator.share({
            title: post.title,
            text: `📖 ${post.title}`,
            url: shareUrl
        }).catch(err => {
            if (err.name !== 'AbortError') {
                copyToClipboard(shareUrl);
            }
        });
    } else {
        copyToClipboard(shareUrl);
    }
};

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showBlogToast("Odkaz zkopírován! 📋");
    }).catch(() => {
        showBlogToast("Nepodařilo se zkopírovat.");
    });
}

function showBlogToast(message) {
    const existingToast = document.getElementById('toast-container');
    if (existingToast) {
        const toastText = document.getElementById('toast-text');
        const toastIcon = document.getElementById('toast-icon');
        if (toastText) toastText.innerText = message;
        if (toastIcon) toastIcon.innerText = "📖";
        existingToast.classList.add('show');
        setTimeout(() => existingToast.classList.remove('show'), 3000);
    }
}

window.openBlogModal = function(postId, event) {
    if (event) event.stopPropagation();
    
    // Zastav VŠECHNA videa na hlavní stránce a obnov placeholdery
    const allVideosOnPage = document.querySelectorAll('.video-placeholder');
    allVideosOnPage.forEach(placeholder => {
        const iframe = placeholder.querySelector('iframe');
        if (iframe) {
            // Použijeme stopVideo na každý placeholder
            // Ale potřebujeme jinou verzi pro hlavní stránku
            const thumbnailUrl = placeholder.getAttribute('data-thumbnail-url') || 
                                 (placeholder.querySelector('img')?.src) || 
                                 'https://via.placeholder.com/400x225?text=Video';
            const videoUrl = placeholder.getAttribute('data-video-url');
            
            placeholder.innerHTML = `
                <img src="${thumbnailUrl}" style="width: 100%; height: 100%; object-fit: cover; pointer-events: none;" alt="Video náhled">
                <button class="video-play-btn" onclick="window.handleVideoClick(event)" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.7); border: none; width: 60px; height: 60px; border-radius: 50%; font-size: 30px; color: white; cursor: pointer;"></button>
            `;
        }
    });
    
    if (!blogPosts || blogPosts.length === 0) {
        loadBlogPosts().then(() => window.openBlogModal(postId, event));
        return;
    }
    
    const post = blogPosts.find(p => p.id === postId);
    if (!post) return;
    
    const modal = document.getElementById('blog-modal-overlay');
    const titleEl = document.getElementById('blog-modal-title');
    const bodyEl = document.getElementById('blog-modal-body');
    
    if (modal && titleEl && bodyEl) {
        titleEl.innerHTML = post.title;
        
        let mediaHtml = '';
        
        if (post.type === 'video' && post.videoUrl) {
            let embedUrl = post.videoUrl;
            let thumbnailUrl = 'https://via.placeholder.com/400x225?text=Video';
            let videoId = null;
            
            if (embedUrl.includes('youtube.com') || embedUrl.includes('youtu.be')) {
                if (embedUrl.includes('embed/')) {
                    videoId = embedUrl.split('embed/')[1].split('?')[0];
                } else if (embedUrl.includes('watch?v=')) {
                    videoId = embedUrl.split('watch?v=')[1].split('&')[0];
                } else {
                    videoId = embedUrl.split('/').pop().split('?')[0];
                }
                embedUrl = `https://www.youtube.com/embed/${videoId}`;
                thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            } else if (embedUrl.includes('vimeo.com')) {
                videoId = embedUrl.split('/').pop();
                embedUrl = `https://player.vimeo.com/video/${videoId}`;
                thumbnailUrl = `https://vumbnail.com/${videoId}.jpg`;
            }
            
            mediaHtml = `
    <div class="modal-video-container">
        <div class="video-placeholder" data-video-url="${embedUrl}" onclick="window.handleModalVideoClick(event)" style="position: relative; cursor: pointer; width: 100%; height: 100%; background: #000; aspect-ratio: 16/9;">
            <img src="${thumbnailUrl}" style="width: 100%; height: 100%; object-fit: cover; pointer-events: none;" alt="Video náhled">
            <button class="video-play-btn" onclick="window.handleModalVideoClick(event)"></button>
        </div>
    </div>
`;

        } else if (post.images && post.images.length > 0) {
            const hasMultiple = post.images.length > 1;
            
            mediaHtml = `
                <div class="modal-img-box" data-modal-post-id="${post.id}" data-modal-current-index="0">
                    <div class="modal-spinner" id="modal-spin-${post.id}" style="display: block;"></div>
                    <img 
                        class="modal-main-img" 
                        id="modal-img-${post.id}" 
                        src="${post.images[0]}" 
                        loading="lazy" 
                        alt="${post.title}"
                        onclick="window.openBlogImageFromModal('${post.id}', event)"
                        style="opacity: 0;"
                    >
                    ${hasMultiple ? `
                        <button class="modal-nav-btn modal-btn-prev" onclick="window.navigateModalSlider('${post.id}', -1, event)">‹</button>
                        <button class="modal-nav-btn modal-btn-next" onclick="window.navigateModalSlider('${post.id}', 1, event)">›</button>
                        <div class="modal-cnt-tag" id="modal-ct-${post.id}">1 / ${post.images.length}</div>
                    ` : ''}
                </div>
            `;
        }
        
        bodyEl.innerHTML = `
            ${mediaHtml}
            <div class="modal-text">${highlightLinks(post.text)}</div>
        `;
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        if (post.images && post.images.length > 0) {
            const img = document.getElementById(`modal-img-${post.id}`);
            const spinner = document.getElementById(`modal-spin-${post.id}`);
            if (img) {
                img.onload = function() {
                    if (spinner) spinner.style.display = 'none';
                    img.style.opacity = '1';
                };
                if (img.complete) {
                    if (spinner) spinner.style.display = 'none';
                    img.style.opacity = '1';
                }
            }
        }
    }
};

export function renderBlogPosts(containerId = 'blog-container') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (blogPosts.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    
    let html = '<div class="blog-grid">';
    
    blogPosts.forEach(post => {
        const plainText = post.text.replace(/<br>/g, ' ').replace(/<[^>]*>/g, '');
        const previewText = plainText.length > 120 ? plainText.substring(0, 120) + '...' : plainText;
        const highlightedPreview = highlightLinks(previewText);
        
        // ============================================
        // VIDEO BLOGY
        // ============================================
        if (post.type === 'video' && post.videoUrl) {
            let embedUrl = post.videoUrl;
            
            let thumbnailUrl = 'https://via.placeholder.com/400x225?text=Video';
            let videoId = null;
            
            if (embedUrl.includes('youtube.com') || embedUrl.includes('youtu.be')) {
                if (embedUrl.includes('embed/')) {
                    videoId = embedUrl.split('embed/')[1].split('?')[0];
                } else if (embedUrl.includes('watch?v=')) {
                    videoId = embedUrl.split('watch?v=')[1].split('&')[0];
                } else {
                    videoId = embedUrl.split('/').pop().split('?')[0];
                }
                thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                embedUrl = `https://www.youtube.com/embed/${videoId}`;
            }
            
            html += `
    <div class="blog-card" data-id="${post.id}" onclick="window.openBlogModalOnCard('${post.id}', event)">
        <div class="video-placeholder" data-video-url="${embedUrl}" onclick="window.handleVideoClick(event)" style="position: relative; cursor: pointer; aspect-ratio: 16/9; background: #000;">
            <img src="${thumbnailUrl}" style="width: 100%; height: 100%; object-fit: cover; pointer-events: none;" alt="Video náhled">
            <button class="video-play-btn" onclick="window.handleVideoClick(event)" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.7); border: none; width: 60px; height: 60px; border-radius: 50%; font-size: 30px; color: white; cursor: pointer;"></button>
        </div>
        <div class="blog-content">
            <h3 class="blog-title">${escapeHtml(post.title)}</h3>
            <div class="blog-text">${highlightedPreview}</div>
            <button class="blog-read-more" onclick="window.openBlogModal('${post.id}', event)">📖 Číst dále</button>
        </div>
    </div>
`;
        }
        
        // ============================================
        // TEXT / OBRÁZKOVÉ BLOGY (PŘIDAT)
        // ============================================
        else if (post.type === 'text' && post.images && post.images.length > 0) {
    const imageCount = post.images.length;
    const indicatorHtml = imageCount > 1 ? `<div class="blog-image-counter">1 / ${imageCount}</div>` : '';
    
    html += `
        <div class="blog-card" data-id="${post.id}" onclick="window.openBlogModalOnCard('${post.id}', event)">
            <div class="blog-image-container" style="position: relative;">
                <img class="blog-card-img" src="${post.images[0]}" loading="lazy" alt="${escapeHtml(post.title)}" style="width: 100%; aspect-ratio: 16/9; object-fit: cover;">
                ${indicatorHtml}
            </div>
            <div class="blog-content">
                <h3 class="blog-title">${escapeHtml(post.title)}</h3>
                <div class="blog-text">${highlightedPreview}</div>
                <button class="blog-read-more" onclick="window.openBlogModal('${post.id}', event)">📖 Číst dále</button>
            </div>
        </div>
    `;
}
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Pro obrázky – schovat spinner
    document.querySelectorAll('.blog-card-img').forEach(img => {
        img.addEventListener('load', function() {
            this.style.opacity = '1';
        });
        if (img.complete) {
            img.style.opacity = '1';
        }
    });

    
    html += '</div>';
    container.innerHTML = html;
    
    document.querySelectorAll('.blog-slider .main-img').forEach(img => {
        img.addEventListener('load', function() {
            const spinner = this.parentElement?.querySelector('.spinner');
            if (spinner) spinner.style.display = 'none';
            this.style.opacity = '1';
        });
        
        if (img.complete) {
            const spinner = img.parentElement?.querySelector('.spinner');
            if (spinner) spinner.style.display = 'none';
            img.style.opacity = '1';
        }
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Funkce pro lazy loading videa – nahradí placeholder iframem
function loadVideo(placeholder) {
    const videoUrl = placeholder.getAttribute('data-video-url');
    if (!videoUrl) return;
    
    // Uložíme si thumbnail URL před tím, než ho přepíšeme
    const existingImg = placeholder.querySelector('img');
    if (existingImg) {
        placeholder.setAttribute('data-thumbnail-url', existingImg.src);
    }
    
    const iframe = document.createElement('iframe');
    iframe.src = videoUrl + (videoUrl.includes('?') ? '&autoplay=1' : '?autoplay=1');
    iframe.frameborder = '0';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
    iframe.allowfullscreen = true;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.position = 'absolute';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.border = 'none';
    
    placeholder.style.position = 'relative';
    placeholder.innerHTML = '';
    placeholder.appendChild(iframe);
}

// Zastavení videa v placeholderu a obnovení původního stavu
function stopVideo(placeholder) {
    if (!placeholder) return;
    
    const iframe = placeholder.querySelector('iframe');
    if (!iframe) return;
    
    // Uložíme si thumbnail URL
    let thumbnailUrl = placeholder.getAttribute('data-thumbnail-url');
    if (!thumbnailUrl) {
        thumbnailUrl = 'https://via.placeholder.com/400x225?text=Video';
    }
    
    const videoUrl = placeholder.getAttribute('data-video-url');
    
    // Kompletně obnovíme placeholder do původního stavu
    placeholder.innerHTML = `
        <img src="${thumbnailUrl}" style="width: 100%; height: 100%; object-fit: cover; pointer-events: none;" alt="Video náhled">
        <button class="video-play-btn" onclick="window.handleModalVideoClick(event)" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.7); border: none; width: 60px; height: 60px; border-radius: 50%; font-size: 30px; color: white; cursor: pointer;"></button>
    `;
}

// Zastaví všechna videa kromě aktuálního a vrátí je do původního stavu
function stopAllOtherVideos(currentPlaceholder) {
    const allPlaceholders = document.querySelectorAll('.video-placeholder');
    
    allPlaceholders.forEach(placeholder => {
        if (placeholder === currentPlaceholder) return; // Přeskočíme aktuální
        
        const iframe = placeholder.querySelector('iframe');
        if (iframe) {
            // Uložíme si potřebné údaje
            const videoUrl = placeholder.getAttribute('data-video-url');
            
            // Najdeme původní thumbnail URL (můžeme ji uložit do data atributu)
            let thumbnailUrl = placeholder.getAttribute('data-thumbnail-url');
            if (!thumbnailUrl) {
                // Pokud nemáme uložený thumbnail, zkusíme ho najít v obrázku
                const existingImg = placeholder.querySelector('img');
                thumbnailUrl = existingImg ? existingImg.src : 'https://via.placeholder.com/400x225?text=Video';
                // Uložíme si ho pro příště
                placeholder.setAttribute('data-thumbnail-url', thumbnailUrl);
            }
            
            // Kompletně obnovíme placeholder do původního stavu
            placeholder.innerHTML = `
                <img src="${thumbnailUrl}" style="width: 100%; height: 100%; object-fit: cover; pointer-events: none;" alt="Video náhled">
                <button class="video-play-btn" onclick="window.handleVideoClick(event)" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.7); border: none; width: 60px; height: 60px; border-radius: 50%; font-size: 30px; color: white; cursor: pointer;"></button>
            `;
        }
    });
}

// Handler pro video na hlavní stránce (blog karty)
window.handleVideoClick = function(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const clickedPlaceholder = event.target.closest('.video-placeholder');
    if (!clickedPlaceholder) return;
    
    if (clickedPlaceholder.querySelector('iframe')) return;
    
    // Zastav všechna ostatní videa
    stopAllOtherVideos(clickedPlaceholder);
    
    // Načti nové video
    loadVideo(clickedPlaceholder);
};

export { createSliderHTML, highlightLinks };

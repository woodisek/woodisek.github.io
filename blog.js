export let blogPosts = [];

export async function loadBlogPosts() {
    try {
        const BLOG_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTDLmB1BcPIJvI1rVpHHK59r7zTfZJVmQ30BofKB2wszp8aZxJBwLhjwTwbzHkZ1kiozdl7YDQO2cVI/pub?gid=102891134&single=true&output=csv";
        
        const url = BLOG_URL + "&t=" + Date.now();
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const csvText = await response.text();
        blogPosts = parseBlogCSV(csvText);
        
        console.log(`✅ Načteno ${blogPosts.length} blogových příspěvků`);
        return blogPosts;
        
    } catch (error) {
        console.warn("⚠️ Blog se nepodařilo načíst:", error.message);
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
        console.warn('Univerzální galerie není k dispozici');
        window.open(post.images[currentIndex], '_blank');
    }
};
window.openBlogModalOnCard = function(postId, event) {
    // Pokud klik na slider, šipky, tlačítko "Číst dále" nebo sdílení – neotvírat modal
    if (event.target.closest('.blog-slider')) return;
    if (event.target.closest('.nav-btn')) return;
    if (event.target.closest('.blog-read-more')) return;
    if (event.target.closest('.share-blog-btn')) return;
    
    // Jinak otevři modal
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
    } else {
        console.log(message);
    }
}

window.openBlogModal = function(postId, event) {
    if (event) event.stopPropagation();
    
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
            // VIDEO - 16:9
            let embedUrl = post.videoUrl;
            if (embedUrl.includes('youtube.com') || embedUrl.includes('youtu.be')) {
                const videoId = embedUrl.split('/').pop().split('?')[0];
                embedUrl = `https://www.youtube.com/embed/${videoId}`;
            } else if (embedUrl.includes('vimeo.com')) {
                const videoId = embedUrl.split('/').pop();
                embedUrl = `https://player.vimeo.com/video/${videoId}`;
            }
            
            mediaHtml = `
                <div class="modal-video-container">
                    <iframe 
                        src="${embedUrl}" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>
            `;
        } else if (post.images && post.images.length > 0) {
            // OBRAZOVÝ SLIDER - PŘESNĚ JAKO PRODUKTOVÝ
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
        
        // Načtení prvního obrázku
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

window.closeBlogModal = function() {
    const modal = document.getElementById('blog-modal-overlay');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
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
        
        if (post.type === 'video' && post.videoUrl) {
            let embedUrl = post.videoUrl;
            
            html += `
    <div class="blog-card" data-id="${post.id}" onclick="window.openBlogModalOnCard('${post.id}', event)">
                    <div class="blog-video" style="position: relative;">
                        
                        <iframe 
                            src="${embedUrl}" 
                            frameborder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen>
                        </iframe>
                    </div>
                    <div class="blog-content">
                        <h3 class="blog-title">${escapeHtml(post.title)}</h3>
                        <div class="blog-text">${highlightedPreview}</div>
                        <button class="blog-read-more" onclick="window.openBlogModal('${post.id}', event)">📖 Číst dále</button>
                    </div>
                </div>
            `;
        } else {
            html += `
    <div class="blog-card" data-id="${post.id}" onclick="window.openBlogModalOnCard('${post.id}', event)">
        ${createSliderHTML(post.id, post.images, 0)}
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

export { createSliderHTML, highlightLinks };

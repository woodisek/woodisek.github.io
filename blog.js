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
                    <div class="video-placeholder" data-video-url="${embedUrl}" style="position: relative; cursor: pointer; width: 100%; height: 100%; background: #000; aspect-ratio: 16/9;">
                        <img src="${thumbnailUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="Video náhled">
                        <button class="video-play-btn" onclick="window.handleVideoClick(event)"></button>
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
        
        if (post.type === 'video' && post.videoUrl) {
            let embedUrl = post.videoUrl;
            
            // Získání náhledového obrázku
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
                    <div class="video-placeholder" data-video-url="${embedUrl}" style="position: relative; cursor: pointer; aspect-ratio: 16/9; background: #000;">
                        <img src="${thumbnailUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="Video náhled">
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
    
    const iframe = document.createElement('iframe');
    iframe.src = videoUrl + (videoUrl.includes('?') ? '&autoplay=1' : '?autoplay=1');
    iframe.frameborder = '0';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
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

// Globální handler pro kliknutí na tlačítko videa
window.handleVideoClick = function(event) {
    const playBtn = event.target.closest('.video-play-btn');
    if (!playBtn) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const placeholder = playBtn.closest('.video-placeholder');
    if (placeholder) {
        loadVideo(placeholder);
    }
};

export { createSliderHTML, highlightLinks };
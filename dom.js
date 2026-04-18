// Bezpečné vytváření elementů
export function createElement(tag, options = {}) {
    const element = document.createElement(tag);
    
    if (options.className) {
        element.className = options.className;
    }
    if (options.id) {
        element.id = options.id;
    }
    if (options.text) {
        element.textContent = options.text;
    }
    if (options.html) {
        element.innerHTML = options.html;
    }
    if (options.attributes) {
        Object.entries(options.attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
    }
    if (options.events) {
        Object.entries(options.events).forEach(([event, handler]) => {
            element.addEventListener(event, handler);
        });
    }
    
    return element;
}

// Bezpečné přidání stylů
export function addStyles(element, styles) {
    Object.assign(element.style, styles);
}

// Čištění elementu
export function clearElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

// Zobrazení/skrytí
export function hide(element) {
    element.style.display = 'none';
}

export function show(element, display = 'block') {
    element.style.display = display;
}
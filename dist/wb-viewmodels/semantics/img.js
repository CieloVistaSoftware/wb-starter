/**
 * Image - Enhanced <img> element
 * Adds lazy loading, zoom/lightbox, fallback, aspect ratio
 * Helper Attribute: [x-behavior="img"]
 */
export function img(element, options = {}) {
    const config = {
        lazy: options.lazy ?? element.hasAttribute('data-lazy'),
        zoomable: options.zoomable ?? element.hasAttribute('data-zoomable'),
        placeholder: options.placeholder || element.dataset.placeholder || '',
        fallback: options.fallback || element.dataset.fallback || '',
        aspectRatio: options.aspectRatio || element.dataset.aspectRatio || '',
        ...options
    };
    element.classList.add('wb-img');
    if (config.lazy) {
        element.loading = 'lazy';
    }
    if (config.aspectRatio) {
        element.style.aspectRatio = config.aspectRatio;
        element.style.objectFit = 'cover';
    }
    if (config.fallback) {
        element.onerror = () => { element.src = config.fallback; };
    }
    if (config.zoomable) {
        element.classList.add('wb-img--zoomable');
        element.style.cursor = 'zoom-in';
        element.onclick = () => openLightbox(element.src, element.alt);
    }
    element.dataset.wbReady = 'img';
    return () => element.classList.remove('wb-img', 'wb-img--zoomable');
}
function openLightbox(src, alt = '') {
    const overlay = document.createElement('div');
    overlay.className = 'wb-lightbox';
    Object.assign(overlay.style, {
        position: 'fixed',
        inset: '0',
        background: 'rgba(0,0,0,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '9999',
        cursor: 'zoom-out',
        padding: '2rem'
    });
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    img.className = 'wb-lightbox__img';
    Object.assign(img.style, {
        maxWidth: '90vw',
        maxHeight: '90vh',
        objectFit: 'contain',
        borderRadius: '8px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
    });
    overlay.appendChild(img);
    overlay.onclick = () => overlay.remove();
    // Close on Escape
    const handleKey = (e) => {
        if (e.key === 'Escape') {
            overlay.remove();
            document.removeEventListener('keydown', handleKey);
        }
    };
    document.addEventListener('keydown', handleKey);
    document.body.appendChild(overlay);
}
export default { img };
//# sourceMappingURL=img.js.map
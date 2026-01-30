/**
 * Figure - Enhanced <figure> element
 * Adds lightbox, lazy loading, caption animation, zoom
 *
 * Supports pure attribute-driven usage (no child tags needed):
 *   <figure data-img-src="photo.jpg" data-alt="Description" data-caption="Caption">
 *   </figure>
 *
 * Or traditional HTML with enhancements:
 *   <figure data-caption="Caption">
 *     <img src="photo.jpg" alt="Description">
 *   </figure>
 *
 * Helper Attribute: [x-behavior="figure"]
 */
export function figure(element, options = {}) {
    const config = {
        imgSrc: options.imgSrc || element.dataset.imgSrc,
        alt: options.alt || element.dataset.alt,
        lightbox: options.lightbox ?? element.hasAttribute('data-lightbox'),
        lazy: options.lazy ?? element.hasAttribute('data-lazy'),
        zoom: options.zoom ?? element.hasAttribute('data-zoom'),
        captionPosition: options.captionPosition || element.dataset.captionPosition || 'bottom',
        ...options
    };
    element.classList.add('wb-figure');
    // Basic styling
    Object.assign(element.style, {
        position: 'relative',
        display: 'block',
        margin: '0',
        overflow: 'hidden',
        borderRadius: '8px'
    });
    // Auto-generate img from data-img-src if no img child exists
    let img = element.querySelector('img');
    if (!img && config.imgSrc) {
        img = document.createElement('img');
        img.src = config.imgSrc;
        img.alt = config.alt || config.imgSrc; // Fallback alt to src
        element.insertBefore(img, element.firstChild);
    }
    // Ensure img fills the figure
    if (img) {
        Object.assign(img.style, {
            display: 'block',
            width: '100%',
            height: 'auto'
        });
    }
    let figcaption = element.querySelector('figcaption');
    // Handle data-caption
    const captionText = options.caption || element.dataset.caption;
    if (captionText) {
        if (!figcaption) {
            figcaption = document.createElement('figcaption');
            element.appendChild(figcaption);
        }
        figcaption.textContent = captionText;
    }
    // Lazy loading
    if (config.lazy && img) {
        img.loading = 'lazy';
    }
    // Caption styling
    if (figcaption) {
        figcaption.classList.add('wb-figure__caption');
        Object.assign(figcaption.style, {
            padding: '0.75rem 1rem',
            background: config.captionPosition === 'overlay'
                ? 'linear-gradient(transparent, rgba(0,0,0,0.7))'
                : 'var(--bg-secondary, #1f2937)',
            color: 'var(--text-primary, #f9fafb)',
            fontSize: '0.875rem'
        });
        if (config.captionPosition === 'overlay') {
            Object.assign(figcaption.style, {
                position: 'absolute',
                bottom: '0',
                left: '0',
                right: '0'
            });
        }
    }
    // Lightbox
    if (config.lightbox && img) {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', () => openLightbox(img.src, figcaption?.textContent));
    }
    // Zoom on hover
    if (config.zoom && img) {
        img.style.transition = 'transform 0.3s ease';
        element.addEventListener('mouseenter', () => {
            img.style.transform = 'scale(1.05)';
        });
        element.addEventListener('mouseleave', () => {
            img.style.transform = '';
        });
    }
    // API
    element.wbFigure = {
        openLightbox: () => openLightbox(img?.src, figcaption?.textContent),
        getImage: () => img,
        getCaption: () => figcaption?.textContent
    };
    element.dataset.wbReady = 'figure';
    return () => element.classList.remove('wb-figure');
}
function openLightbox(src, caption = '') {
    if (!src)
        return;
    const overlay = document.createElement('div');
    overlay.className = 'wb-lightbox';
    Object.assign(overlay.style, {
        position: 'fixed',
        inset: '0',
        background: 'rgba(0,0,0,0.9)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '9999',
        cursor: 'zoom-out',
        padding: '2rem'
    });
    const img = document.createElement('img');
    img.src = src;
    Object.assign(img.style, {
        maxWidth: '90vw',
        maxHeight: caption ? '80vh' : '90vh',
        objectFit: 'contain',
        borderRadius: '8px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
    });
    overlay.appendChild(img);
    if (caption) {
        const captionEl = document.createElement('div');
        captionEl.textContent = caption;
        Object.assign(captionEl.style, {
            marginTop: '1rem',
            color: 'white',
            fontSize: '1rem',
            textAlign: 'center',
            maxWidth: '80vw'
        });
        overlay.appendChild(captionEl);
    }
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    Object.assign(closeBtn.style, {
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        background: 'none',
        border: 'none',
        color: 'white',
        fontSize: '2rem',
        cursor: 'pointer'
    });
    closeBtn.onclick = () => overlay.remove();
    overlay.appendChild(closeBtn);
    overlay.onclick = (e) => {
        if (e.target === overlay)
            overlay.remove();
    };
    const handleKey = (e) => {
        if (e.key === 'Escape') {
            overlay.remove();
            document.removeEventListener('keydown', handleKey);
        }
    };
    document.addEventListener('keydown', handleKey);
    document.body.appendChild(overlay);
}
export default { figure };
//# sourceMappingURL=figure.js.map
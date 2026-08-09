/**
 * Image - Enhanced <img> element
 * Adds lazy loading, zoom/lightbox, fallback, aspect ratio
 * Helper Attribute: [x-image]
 *
 * Migrated from the old media.js grab-bag file (image()) to match this
 * project's one-file-per-semantic-element convention (audio.js, table.js,
 * progress.js, ...). A parallel, never-wired-up version of this file
 * already existed with a nicer openLightbox (Escape-to-close, alt text)
 * but the same missing-bare-attribute-fallback bug media.js's version
 * had before this session's fix — merged the two: media.js's correct
 * config reads + aspect-ratio support, this file's better lightbox.
 */
import { attachImageLoadRetry } from '../media-load-retry.js';

export function img(element, options = {}) {
  const config = {
    lazy: options.lazy ?? (element.hasAttribute('lazy') || element.hasAttribute('data-lazy')),
    zoomable: options.zoomable ?? (element.hasAttribute('zoomable') || element.hasAttribute('data-zoomable')),
    placeholder: options.placeholder || element.getAttribute('placeholder') || '',
    fallback: options.fallback || element.getAttribute('fallback') || '',
    aspectRatio: options.aspectRatio || element.getAttribute('aspect-ratio') || '',
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

  let retryCleanup = null;
  if (config.fallback) {
    // An explicit fallback image is a deliberate, more specific choice than
    // a blind retry -- swap immediately rather than racing retry attempts
    // against it.
    element.onerror = () => { element.src = config.fallback; };
  } else {
    retryCleanup = attachImageLoadRetry(element);
  }

  if (config.zoomable) {
    element.classList.add('wb-img--zoomable');
    element.style.cursor = 'zoom-in';
    element.onclick = () => openLightbox(element.src, element.alt);
  }

  return () => { element.classList.remove('wb-img', 'wb-img--zoomable'); if (retryCleanup) retryCleanup(); };
}

export function openLightbox(src, alt = '') {
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

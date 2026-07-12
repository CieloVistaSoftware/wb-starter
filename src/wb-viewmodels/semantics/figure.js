/**
 * Figure - Enhanced figure with caption positioning and zoom
 * Custom Tag: <wb-figure>, or auto-injected onto native <figure>
 *
 * Migrated from the old media.js grab-bag file to match this project's
 * one-file-per-semantic-element convention (audio.js, table.js, ...).
 */
import { openLightbox } from './img.js';

export function figure(element, options = {}) {
  const config = {
    zoom: options.zoom ?? (element.getAttribute('zoom') === 'true' || element.hasAttribute('zoom')),
    // Default true — lightbox is opt-OUT (lightbox="false"), not opt-in.
    lightbox: options.lightbox ?? (element.getAttribute('lightbox') !== 'false'),
    captionPosition: options.captionPosition || element.getAttribute('caption-position') || 'bottom',
    caption: options.caption || element.getAttribute('caption'),
    ...options
  };

  element.classList.add('wb-figure');

  let caption = element.querySelector('figcaption');
  if (config.caption) {
    if (!caption) {
      caption = document.createElement('figcaption');
      element.appendChild(caption);
    }
    caption.textContent = config.caption;
  }

  if (config.captionPosition === 'overlay') {
    element.classList.add('wb-figure--overlay');
    element.style.position = 'relative';
    if (caption) {
      Object.assign(caption.style, {
        position: 'absolute',
        bottom: '0',
        left: '0',
        right: '0',
        background: 'rgba(0,0,0,0.7)',
        color: '#fff',
        padding: '0.5rem 1rem',
        margin: '0'
      });
    }
  }

  const img = element.querySelector('img');
  if (img && (config.zoom || config.lightbox)) {
    img.style.cursor = 'zoom-in';
    img.onclick = () => openLightbox(img.src, img.alt);
  }

  return () => {
    element.classList.remove('wb-figure', 'wb-figure--overlay');
    if (img) img.onclick = null;
  };
}

export default { figure };

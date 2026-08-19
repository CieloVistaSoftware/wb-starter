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
        // #545: was '0.5rem 1rem' (8px vertical) -- below the site's 1rem
        // content-panel-edge minimum once the overlay bar is wide/tall
        // enough to read as a panel (confirmed live: a "Technology and
        // Nature" overlay caption flagged at 8px on its tightest side).
        padding: '1rem',
        margin: '0'
      });
      // #556: caption-position="overlay" means EXACTLY what it says -- the
      // caption is deliberately painted on top of the image's bottom edge
      // (a photo-caption bar, not a layout bug). no-element-overlap.spec.ts
      // (§22) has no way to know that from geometry alone, so it correctly
      // flagged demos/site/content.html's own "Overlay Caption" demo
      // (<img class="wb-img"> vs its <figcaption>) as a violation. Marking
      // the deliberately-overlapping element is this codebase's own
      // established escape hatch for exactly this case (see that spec's
      // "data-allow-overlap" doc comment) -- same category as
      // wb-card__overlay's scrim, just per-instance instead of a shared
      // class since only THIS caption-position value overlays.
      caption.setAttribute('data-allow-overlap', '');
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

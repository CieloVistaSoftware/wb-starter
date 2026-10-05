/**
 * Figure - Enhanced figure with caption positioning, zoom and width
 * Custom Tag: <figure>, or auto-injected onto native <figure>
 *
 * Migrated from the old media.js grab-bag file to match this project's
 * one-file-per-semantic-element convention (audio.js, table.js, ...).
 */
import { openLightbox } from './img.js';
import { setRule } from '../../core/dynamic-style.js';

/** width="240" means 240px; any other CSS length ("20rem", "50%") is kept. */
function toCssLength(value) {
  return /^\d+(\.\d+)?$/.test(value) ? `${value}px` : value;
}

export function figure(element, options = {}) {
  const config = {
    zoom: options.zoom ?? (element.getAttribute('zoom') === 'true' || element.hasAttribute('zoom')),
    // Default true — lightbox is opt-OUT (lightbox="false"), not opt-in.
    lightbox: options.lightbox ?? (element.getAttribute('lightbox') !== 'false'),
    captionPosition: options.captionPosition || element.getAttribute('caption-position') || 'bottom',
    caption: options.caption || element.getAttribute('caption'),
    width: options.width || element.getAttribute('width') || '',
    ...options
  };

  element.classList.add('x-figure');

  // <figure> has no native width attribute, so width="" is this behavior's.
  // The image inside already shrinks to fit (img { max-width: 100% }), and
  // the caption wraps at the same width. max-width keeps a wide figure
  // inside a narrow container. A runtime value, so a generated rule (#779).
  if (config.width) {
    setRule(element, 'size', { width: toCssLength(String(config.width)), maxWidth: '100%' });
  }

  let caption = element.querySelector('figcaption');
  if (config.caption) {
    if (!caption) {
      caption = document.createElement('figcaption');
      element.appendChild(caption);
    }
    caption.textContent = config.caption;
  }

  // #1279: "top" was declared and documented and rendered exactly like the
  // default. A <figcaption> may be a figure's first child or its last, so the
  // honest move is the DOM order itself, not a visual reordering.
  if (config.captionPosition === 'top' && caption && element.firstElementChild !== caption) {
    element.insertBefore(caption, element.firstChild);
  }

  if (config.captionPosition === 'overlay') {
    element.classList.add('x-figure--overlay');
    // position:relative and the caption bar are .x-figure--overlay rules in
    // image.css (#779: they were written onto element.style). #545's 1rem
    // padding went with them.
    if (caption) {
      // #556: caption-position="overlay" means EXACTLY what it says -- the
      // caption is deliberately painted on top of the image's bottom edge
      // (a photo-caption bar, not a layout bug). no-element-overlap.spec.ts
      // (§22) has no way to know that from geometry alone, so it correctly
      // flagged demos/site/content.html's own "Overlay Caption" demo
      // (<img class="x-img"> vs its <figcaption>) as a violation. Marking
      // the deliberately-overlapping element is this codebase's own
      // established escape hatch for exactly this case (see that spec's
      // "data-allow-overlap" doc comment) -- same category as
      // x-card__overlay's scrim, just per-instance instead of a shared
      // class since only THIS caption-position value overlays.
      caption.setAttribute('data-allow-overlap', '');
    }
  }

  const img = element.querySelector('img');
  if (img && (config.zoom || config.lightbox)) {
    img.classList.add('x-figure__zoomable');   // zoom-in cursor, image.css (#779)
    img.onclick = () => openLightbox(img.src, img.alt);
  }

  return () => {
    element.classList.remove('x-figure', 'x-figure--overlay');
    setRule(element, 'size', null);
    if (img) { img.onclick = null; img.classList.remove('x-figure__zoomable'); }
  };
}

export default { figure };

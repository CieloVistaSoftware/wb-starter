/**
 * Gallery - Image gallery
 * Custom Tag: <div x-gallery>
 *
 * Migrated from the old media.js grab-bag file to match this project's
 * one-file-per-semantic-element convention (audio.js, table.js, ...).
 */
export function gallery(element, options = {}) {
  const config = {
    columns: parseInt(options.columns || element.getAttribute('columns') || '3'),
    // Fixed thumbnail size (e.g. "150px") -- switches the grid to
    // auto-fill so every thumbnail is that size regardless of column
    // count/container width, instead of `columns` fluid-dividing the
    // container into N tracks. Wins over `columns` when both are set:
    // a fixed size is the more specific intent.
    size: options.size || element.getAttribute('size') || '',
    gap: options.gap || element.getAttribute('gap') || '1rem',
    lightbox: options.lightbox ?? element.getAttribute('lightbox') !== 'false',
    ...options
  };

  element.classList.add('x-gallery');
  element.style.display = 'grid';
  element.style.gridTemplateColumns = config.size
    ? `repeat(auto-fill, minmax(${config.size}, 1fr))`
    : `repeat(${config.columns}, 1fr)`;
  element.style.gap = config.gap;

  if (config.lightbox) {
    const images = element.querySelectorAll('img');
    images.forEach((img, i) => {
      img.classList.add('x-gallery__item');
      img.onclick = () => openGalleryLightbox(images, i);
    });
  }

  return () => element.classList.remove('x-gallery');
}

function openGalleryLightbox(images, index) {
  let current = index;
  const overlay = document.createElement('div');
  overlay.className = 'x-lightbox x-lightbox--gallery';

  const render = () => {
    overlay.innerHTML = `
      <button class="x-lightbox__prev">‹</button>
      <img src="${images[current].src}" class="x-lightbox__img">
      <button class="x-lightbox__next">›</button>
      <button class="x-lightbox__close">×</button>
      <div class="x-lightbox__counter">${current + 1} / ${images.length}</div>
    `;
    overlay.querySelector('.x-lightbox__prev').onclick = (e) => { e.stopPropagation(); current = (current - 1 + images.length) % images.length; render(); };
    overlay.querySelector('.x-lightbox__next').onclick = (e) => { e.stopPropagation(); current = (current + 1) % images.length; render(); };
    overlay.querySelector('.x-lightbox__close').onclick = () => overlay.remove();
  };

  render();
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  document.body.appendChild(overlay);
}

export default { gallery };

/**
 * Gallery - Image gallery
 * Custom Tag: <wb-gallery>
 *
 * Migrated from the old media.js grab-bag file to match this project's
 * one-file-per-semantic-element convention (audio.js, table.js, ...).
 */
export function gallery(element, options = {}) {
  const config = {
    columns: parseInt(options.columns || element.getAttribute('columns') || '3'),
    gap: options.gap || element.getAttribute('gap') || '1rem',
    lightbox: options.lightbox ?? element.getAttribute('lightbox') !== 'false',
    ...options
  };

  element.classList.add('wb-gallery');
  element.style.display = 'grid';
  element.style.gridTemplateColumns = `repeat(${config.columns}, 1fr)`;
  element.style.gap = config.gap;

  if (config.lightbox) {
    const images = element.querySelectorAll('img');
    images.forEach((img, i) => {
      img.classList.add('wb-gallery__item');
      img.onclick = () => openGalleryLightbox(images, i);
    });
  }

  return () => element.classList.remove('wb-gallery');
}

function openGalleryLightbox(images, index) {
  let current = index;
  const overlay = document.createElement('div');
  overlay.className = 'wb-lightbox wb-lightbox--gallery';

  const render = () => {
    overlay.innerHTML = `
      <button class="wb-lightbox__prev">‹</button>
      <img src="${images[current].src}" class="wb-lightbox__img">
      <button class="wb-lightbox__next">›</button>
      <button class="wb-lightbox__close">×</button>
      <div class="wb-lightbox__counter">${current + 1} / ${images.length}</div>
    `;
    overlay.querySelector('.wb-lightbox__prev').onclick = (e) => { e.stopPropagation(); current = (current - 1 + images.length) % images.length; render(); };
    overlay.querySelector('.wb-lightbox__next').onclick = (e) => { e.stopPropagation(); current = (current + 1) % images.length; render(); };
    overlay.querySelector('.wb-lightbox__close').onclick = () => overlay.remove();
  };

  render();
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  document.body.appendChild(overlay);
}

export default { gallery };

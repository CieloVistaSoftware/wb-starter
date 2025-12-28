// Hero behavior for builder: renders hero variant HTML structure and classes
// Usage: <div data-wb="hero" data-variant="cosmic" ...></div>

export function hero(element, options = {}) {
  // Merge options and data attributes
  const config = {
    variant: options.variant || element.dataset.variant || 'default',
    title: options.title || element.dataset.title || 'Hero Title',
    subtitle: options.subtitle || element.dataset.subtitle || '',
    cta: options.cta || element.dataset.cta || '',
    ctaHref: options.ctaHref || element.dataset.ctaHref || '#',
    image: options.image || element.dataset.image || '',
    background: options.background || element.dataset.background || '',
    height: options.height || element.dataset.height || '400px',
    align: options.align || element.dataset.align || 'center',
    overlay: options.overlay !== undefined ? options.overlay : (element.dataset.overlay !== 'false'),
    showBadge: options.showBadge !== undefined ? options.showBadge : (element.dataset.showBadge !== 'false'),
    badge: options.badge || element.dataset.badge || '',
    badgeColor: options.badgeColor || element.dataset.badgeColor || '',
    cosmicBg: options.cosmicBg || element.dataset.cosmicBg || '',
  };

  // Clear element
  element.innerHTML = '';
  element.className = `wb-hero wb-hero--${config.variant}`;
  element.style.minHeight = config.height;
  element.style.position = 'relative';
  element.style.display = 'flex';
  element.style.justifyContent = 'center';
  element.style.alignItems = 'center';
  element.style.textAlign = config.align;
  if (config.background) {
    element.style.backgroundImage = `url(${config.background})`;
    element.style.backgroundSize = 'cover';
    element.style.backgroundPosition = 'center';
  }

  // Overlay for readability
  if (config.overlay) {
    const overlay = document.createElement('div');
    overlay.className = 'wb-hero__overlay';
    overlay.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.4);z-index:0;';
    element.appendChild(overlay);
  }

  // Cosmic variant: space/nebula background
  if (config.variant === 'cosmic') {
    element.style.background = config.cosmicBg
      ? `url(${config.cosmicBg}) center/cover no-repeat`
      : 'radial-gradient(ellipse at 60% 40%, #3a1c71 0%, #d76d77 50%, #221c35 100%)';
    // Add extra cosmic orbs/stars if desired
    const orb = document.createElement('div');
    orb.className = 'wb-orb wb-orb--cosmic';
    orb.style.cssText = 'width:500px;height:500px;top:20%;left:10%;position:absolute;z-index:1;pointer-events:none;';
    element.appendChild(orb);
  }

  // Content
  const content = document.createElement('div');
  content.className = 'wb-hero__content';
  content.style.cssText = 'position:relative;z-index:2;padding:2rem;color:white;max-width:700px;margin:auto;';

  if (config.showBadge && config.badge) {
    const badge = document.createElement('span');
    badge.className = 'wb-badge-gradient';
    badge.style.marginBottom = '1rem';
    if (config.badgeColor) badge.style.background = config.badgeColor;
    badge.textContent = config.badge;
    content.appendChild(badge);
  }

  if (config.title) {
    const h1 = document.createElement('h1');
    h1.innerHTML = config.title.includes('<') ? config.title : `<span class="wb-gradient-text">${config.title}</span>`;
    content.appendChild(h1);
  }
  if (config.subtitle) {
    const p = document.createElement('p');
    p.className = 'wb-hero__subtitle';
    p.textContent = config.subtitle;
    content.appendChild(p);
  }
  if (config.cta) {
    const a = document.createElement('a');
    a.className = 'wb-btn-gradient';
    a.href = config.ctaHref;
    a.innerHTML = `<span style="position:relative;z-index:1;">${config.cta}</span>`;
    content.appendChild(a);
  }

  // Split variant: add image
  if (config.variant === 'split' && config.image) {
    const visual = document.createElement('div');
    visual.className = 'wb-hero__visual';
    const img = document.createElement('img');
    img.src = config.image;
    img.alt = 'Hero visual';
    visual.appendChild(img);
    content.appendChild(visual);
  }

  element.appendChild(content);
}

/**
 * Breadcrumb — navigation breadcrumbs.
 * Attribute: [x-breadcrumb]
 * TODO: Migrate inline styles to breadcrumb.css
 */
export function cc() {}

/**
 * Breadcrumb - Navigation breadcrumbs from data-items
 */
export function breadcrumb(element, options = {}) {
  const config = {
    items: (options.items || element.dataset.items || '').split(',').filter(Boolean),
    separator: options.separator || element.dataset.separator || '/',
    ...options
  };

  element.classList.add('wb-breadcrumb');
  element.setAttribute('aria-label', 'Breadcrumb');
  element.style.display = 'flex';
  element.style.alignItems = 'center';
  element.style.gap = '0.5rem';
  element.style.fontSize = '0.875rem';

  if (config.items.length > 0) {
    element.innerHTML = config.items.map((item, i) => {
      const isLast = i === config.items.length - 1;
      return `
        ${i > 0 ? `<span style="opacity:0.5;">${config.separator}</span>` : ''}
        <span class="wb-breadcrumb__item" style="${isLast ? 'font-weight:600;' : 'opacity:0.7;cursor:pointer;'}">${item.trim()}</span>
      `;
    }).join('');
  }

  element.dataset.wbReady = 'breadcrumb';
  return () => element.classList.remove('wb-breadcrumb');
}

export default breadcrumb;

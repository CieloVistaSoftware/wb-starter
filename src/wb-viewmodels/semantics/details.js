import { readFlag, readAttr } from '../../core/read-attr.js';
/**
 * Details - Enhanced <details> element
 * Helper Attribute: [x-behavior="details"]
 * 
 * Uses native HTML5 <details>/<summary> for:
 * - Built-in accessibility (no ARIA needed)
 * - Works without JavaScript
 * - Keyboard support (Enter/Space)
 * - Browser handles open/close state
 * 
 * JS adds: custom events, animations, programmatic API
 */
export function details(element, options = {}) {
  const config = {
    open: options.open ?? (element.hasAttribute('open') || readFlag(element, 'open')),
    animated: options.animated ?? readAttr(element, 'animated') !== 'false',
    ...options
  };

  // If not already a <details>, wrap content
  if (element.tagName !== 'DETAILS') {
    const summaryText = element.getAttribute('summary') || readAttr(element, 'summary') || readAttr(element, 'title') || 'Details';
    const contentHtml = element.innerHTML;
    
    const detailsEl = document.createElement('details');
    detailsEl.className = 'x-details ' + (element.className || '');
    if (config.open) detailsEl.open = true;
    
    detailsEl.innerHTML = `
      <summary class="x-details__summary">${summaryText}</summary>
      <div class="x-details__content">${contentHtml}</div>
    `;
    
    Object.keys(element.dataset).forEach(key => {
      detailsEl.dataset[key] = element.dataset[key];
    });
    
    // Add class to original element in case tests are checking it
    
    element.replaceWith(detailsEl);
    element = detailsEl;
  } else {
    if (config.open) element.open = true;

    // #689 -- John: "the gaps here are not right". A native <details> authored
    // with the summary as an ATTRIBUTE (<details summary="Trail conditions">)
    // got neither a <summary> element nor a .x-details__content wrapper, so
    // the styling below -- which is what applies the 1rem to each half -- had
    // nothing to find. The browser fell back to its own unpadded "Details"
    // label (dropping the authored text entirely), the <img> sat flush against
    // the 1px border, and a centred <p> kept its 48px auto margins: three
    // different insets in one box. Build the same structure the wrap path
    // above builds, so both paths end up styled identically.
    const ownSummary = [...element.children].find((c) => c.tagName === 'SUMMARY');
    if (!ownSummary) {
      const content = document.createElement('div');
      content.className = 'x-details__content';
      while (element.firstChild) content.appendChild(element.firstChild);

      const summaryEl = document.createElement('summary');
      summaryEl.className = 'x-details__summary';
      // textContent, not innerHTML: the attribute is author input and the
      // label is plain text -- there is nothing here that needs markup.
      summaryEl.textContent = element.getAttribute('summary') || 'Details';

      element.append(summaryEl, content);
    }
  }

  // #775 -- these were inline styles (Object.assign(element.style, ...)).
  //
  // Inline wins over every stylesheet rule, so a page could not restyle a
  // panel it owns: pages/behaviors.html had to x-ignore this behavior
  // outright just to put its own border on its own chrome (the "#746 edge").
  // A behavior should decorate with classes and let CSS decide the looks.
  //
  // The declarations moved verbatim into src/styles/behaviors/details.css,
  // so the default appearance is unchanged for anyone not overriding it.
  element.classList.add('x-details');

  const summary = element.querySelector('summary');
  if (summary) {
    summary.classList.add('x-details__summary');
    // #775: layout and colour live in details.css now, same reason.
    
    // Custom icon (guard against re-wrapping on a second scan — issue #131)
    if (!summary.querySelector(".x-details__label")) {
      const labelText = summary.textContent.trim();
      summary.innerHTML = `
        <span class="x-details__label">${labelText}</span>
        <span class="x-details__icon">▼</span>
      `;
    }
  }

  // Content styling
  const content = element.querySelector('.x-details__content') || element.querySelector('summary + *');
  if (content) {
    content.classList.add('x-details__content');
    // #775: padding and background live in details.css now.
  }

  // Animation
  const icon = element.querySelector('.x-details__icon');
  element.addEventListener('toggle', () => {
    if (icon) {
      // #775 -- John: "show the arrows - 90 degress to indicate collapsed.
      // then downward for expansion."
      //
      // This used to rotate 180deg when open, so CLOSED pointed down and OPEN
      // pointed up: the arrow read as a direction to travel rather than as a
      // state, and a stack of collapsed panels all pointed down as though they
      // were already open.
      //
      // The glyph is a down-pointing triangle, so open is its natural 0deg and
      // closed turns it -90deg to point right.
      icon.style.transform = element.open ? '' : 'rotate(-90deg)';
    }
    element.dispatchEvent(new CustomEvent('wb:details:toggle', {
      bubbles: true,
      detail: { open: element.open }
    }));
  });

  // API
  element.wbDetails = {
    toggle: () => { element.open = !element.open; },
    show: () => { element.open = true; },
    hide: () => { element.open = false; },
    get isOpen() { return element.open; }
  };

  return () => element.classList.remove('x-details');
}

export default { details };

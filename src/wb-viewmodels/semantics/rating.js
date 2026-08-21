import { readAttr } from '../../core/read-attr.js';
/**
 * Rating Behavior
 * ===============
 * 
 * Interactive star rating component.
 * 
 * ATTRIBUTES:
 * - data-max: Number of stars (default: 5)
 * - data-value: Initial value (default: 0)
 * - data-readonly: If "true", user cannot change value
 * - data-color: Color of filled stars (default: gold)
 * 
 * EVENTS:
 * - wb:rating:change: Dispatched when value changes. detail: { value: number }
 * Helper Attribute: [x-behavior="rating"]
 */

export function rating(element, options = {}) {
  // Read PLAIN attributes (v3 standard: value/max/icon/color) as well as the
  // legacy data-* form. Previously only data-*/options were read, so the
  // showcase markup `<wb-rating value="3" icon="❤️">` was ignored — stars never
  // filled on first paint and the custom icon was dropped. (#177)
  const attr = (name) => element.getAttribute(name);
  const authoredValue = (element._wbOriginalSlot || element.textContent || '').trim();
  const config = {
    max: parseInt(options.max || attr('max') || readAttr(element, 'max') || '5', 10),
    value: parseInt(options.value || attr('value') || readAttr(element, 'value') || authoredValue || '0', 10),
    readonly: options.readonly ?? (element.hasAttribute('readonly') || readAttr(element, 'readonly') === 'true'),
    icon: options.icon || attr('icon') || readAttr(element, 'icon') || '★',
    // Filled colour: theme's rating colour by default; override via color="…"
    // (e.g. color="var(--primary)" for blue). Empty colour from the theme too.
    color: options.color || attr('color') || readAttr(element, 'color') || 'var(--rating-active-color, #fbbf24)',
    emptyColor: options.emptyColor || attr('empty-color') || 'var(--border-color, #e5e7eb)',
    // rating.schema.json declares size (sm/md/lg, appliesClass:
    // "wb-rating--{{value}}"), but that's schema-builder's mechanism (never
    // runs on a wb-lazy.js-only page) AND this function never read the
    // attribute at all -- star font-size was unconditionally hardcoded
    // inline below regardless of size (confirmed live: size="sm"/"lg" both
    // rendered identical 1.5rem stars).
    size: options.size || attr('size') || readAttr(element, 'size') || 'md',
    ...options
  };

  // State
  let currentValue = config.value;
  let hoverValue = 0;

  // Clear element
  element.innerHTML = '';
  // #448: no bare 'wb-rating' token -- it just duplicated <wb-rating>'s own
  // tag name (no CSS selector depends on it; rating.css's `.wb-rating span`
  // rule is already dead/unmatched per its own comment). The size modifier
  // class is real and stays.
  element.classList.add(`wb-rating--${config.size}`);
  element.style.display = 'inline-flex';
  element.style.gap = '0.25rem';
  element.style.cursor = config.readonly ? 'default' : 'pointer';

  // Create stars
  const stars = [];
  for (let i = 1; i <= config.max; i++) {
    const star = document.createElement('span');
    star.className = 'wb-rating__star';
    star.dataset.value = i;
    star.innerHTML = config.icon; // honour custom icon (★ default, ❤️/👍/…)
    // font-size now comes from CSS (.wb-rating__star / .wb-rating--{size} .wb-rating__star,
    // rating.css) so the size attribute actually has an effect -- not hardcoded here.
    star.style.lineHeight = '1';
    star.style.transition = 'color 0.2s ease, transform 0.1s ease';
    star.style.color = config.emptyColor; // empty
    
    if (!config.readonly) {
      // Hover effects
      star.addEventListener('mouseenter', () => {
        hoverValue = i;
        updateStars();
      });
      
      // Click handler
      star.addEventListener('click', () => {
        currentValue = i;
        updateStars();
        
        // Dispatch event
        element.dispatchEvent(new CustomEvent('wb:rating:change', {
          bubbles: true,
          detail: { value: currentValue }
        }));
        
        // Animation
        star.style.transform = 'scale(1.2)';
        setTimeout(() => star.style.transform = 'scale(1)', 150);
      });
    }
    
    element.appendChild(star);
    stars.push(star);
  }

  // Reset hover on leave
  if (!config.readonly) {
    element.addEventListener('mouseleave', () => {
      hoverValue = 0;
      updateStars();
    });
  }

  // Update visual state
  function updateStars() {
    const targetValue = hoverValue > 0 ? hoverValue : currentValue;
    
    stars.forEach((star, index) => {
      const value = index + 1;
      const isFull = value <= targetValue;
      
      if (isFull) {
        star.classList.add('wb-rating__star--full');
        star.style.color = config.color;
      } else {
        star.classList.remove('wb-rating__star--full');
        star.style.color = config.emptyColor;
      }
    });
  }

  // Initial render
  updateStars();

  // Public API
  element.wbRating = {
    getValue: () => currentValue,
    setValue: (val) => {
      currentValue = Math.max(0, Math.min(val, config.max));
      updateStars();
    }
  };

  return () => {
    // Cleanup
    element.innerHTML = '';
    delete element.wbRating;
  };
}

export default rating;

import { readAttr, readFlag } from '../../core/read-attr.js';
import { setRule, clearRules, onlyChanged } from '../../core/dynamic-style.js';
import { themeColor } from '../../core/theme-color.js';
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
 * Helper Attribute: [x-rating]
 */

export function rating(element, options = {}) {
  // Read PLAIN attributes (v3 standard: value/max/icon/color) as well as the
  // legacy data-* form. Previously only data-*/options were read, so the
  // showcase markup `<span x-rating value="3" icon="❤️">` was ignored — stars never
  // filled on first paint and the custom icon was dropped. (#177)
  const attr = (name) => element.getAttribute(name);
  const authoredValue = (element._wbOriginalSlot || element.textContent || '').trim();
  // Declared in rating.schema.json / docs/behaviors/rating.md and read by
  // nothing until now: `half` (allow x.5 values) and `disabled` (no
  // interaction, dimmed, aria-disabled). Read first because `half` decides
  // how `value` parses -- parseInt dropped the .5 of value="3.5".
  const half = options.half ?? readFlag(element, 'half');
  const disabled = options.disabled ?? readFlag(element, 'disabled');
  const parseValue = (raw) => {
    const n = half ? Math.round(parseFloat(raw) * 2) / 2 : parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  };
  const config = {
    max: parseInt(options.max || attr('max') || readAttr(element, 'max') || '5', 10),
    value: parseValue(options.value || attr('value') || readAttr(element, 'value') || authoredValue || '0'),
    half,
    disabled,
    readonly: options.readonly ?? (element.hasAttribute('readonly') || readAttr(element, 'readonly') === 'true'),
    icon: options.icon || attr('icon') || readAttr(element, 'icon') || '★',
    // Filled colour: theme's rating colour by default; override via color="…"
    // (a theme name, color="primary", or any CSS colour; #907). Empty colour
    // from the theme too.
    // #779: the defaults are rating.css's; only an author colour travels (as a
    // generated rule setting --x-rating-color / --x-rating-empty-color), so a
    // theme's --rating-active-color still reaches every unconfigured rating.
    color: options.color || attr('color') || readAttr(element, 'color') || '',
    emptyColor: options.emptyColor || attr('empty-color') || '',
    // rating.schema.json declares size (sm/md/lg, appliesClass:
    // "x-rating--{{value}}"), but that's schema-builder's mechanism (never
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
  // #448: no bare '[x-rating]' token -- it just duplicated <span x-rating>'s own
  // tag name (no CSS selector depends on it; rating.css's `.x-rating span`
  // rule is already dead/unmatched per its own comment). The size modifier
  // class is real and stays.
  element.classList.add(`x-rating--${config.size}`);
  element.classList.toggle('x-rating--half', !!config.half);
  element.classList.toggle('x-rating--disabled', !!config.disabled);
  if (config.disabled) element.setAttribute('aria-disabled', 'true');
  // Disabled is readonly plus the disabled presentation (rating.css).
  const interactive = !config.readonly && !config.disabled;
  // #779: layout and the per-state cursor are rating.css, keyed on the
  // x-rating root class (the schema's compliance.baseClass) and --readonly /
  // --disabled. Skipped on a literal <x-rating> tag, where it would only
  // repeat the tag name (#448); rating.css selects the tag too.
  if (element.tagName !== 'X-RATING') element.classList.add('x-rating');
  element.classList.toggle('x-rating--readonly', !config.disabled && !!config.readonly);
  setRule(element, 'colors', onlyChanged({
    '--x-rating-color': themeColor(config.color),
    '--x-rating-empty-color': themeColor(config.emptyColor),
  }));

  // Create stars
  const stars = [];
  for (let i = 1; i <= config.max; i++) {
    const star = document.createElement('span');
    star.className = 'x-rating__star';
    star.dataset.value = i;
    star.innerHTML = config.icon; // honour custom icon (★ default, ❤️/👍/…)
    // font-size now comes from CSS (.x-rating__star / .x-rating--{size} .x-rating__star,
    // rating.css) so the size attribute actually has an effect -- not hardcoded here.
    // #779: so do line-height, the transition and the empty/full colours.

    if (interactive) {
      // With `half`, the left half of a star means i - 0.5.
      const valueAt = (e) => {
        if (!config.half) return i;
        const r = star.getBoundingClientRect();
        return (e.clientX - r.left) < r.width / 2 ? i - 0.5 : i;
      };

      // Hover effects
      star.addEventListener(config.half ? 'mousemove' : 'mouseenter', (e) => {
        hoverValue = valueAt(e);
        updateStars();
      });
      
      // Click handler
      star.addEventListener('click', (e) => {
        currentValue = valueAt(e);
        updateStars();
        
        // Dispatch event
        element.dispatchEvent(new CustomEvent('wb:rating:change', {
          bubbles: true,
          detail: { value: currentValue }
        }));
        
        // Animation: .x-rating__star--pop scales it up for 150ms (#779).
        star.classList.add('x-rating__star--pop');
        setTimeout(() => star.classList.remove('x-rating__star--pop'), 150);
      });
    }
    
    element.appendChild(star);
    stars.push(star);
  }

  // Reset hover on leave
  if (interactive) {
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
      const isHalf = !isFull && config.half && value - 0.5 === targetValue;
      
      // Full / half / empty colours, including the half star's two-stop
      // gradient clipped to the glyph, are these classes in rating.css (#779).
      star.classList.toggle('x-rating__star--full', isFull);
      star.classList.toggle('x-rating__star--half', isHalf);
    });
  }

  // Initial render
  updateStars();

  // Public API
  element.wbRating = {
    getValue: () => currentValue,
    setValue: (val) => {
      currentValue = Math.max(0, Math.min(parseValue(val), config.max));
      updateStars();
    }
  };

  return () => {
    // Cleanup
    element.innerHTML = '';
    clearRules(element);
    element.classList.remove('x-rating', 'x-rating--readonly');
    delete element.wbRating;
  };
}

export default rating;

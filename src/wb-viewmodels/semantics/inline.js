import { setRule, clearRules } from '../../core/dynamic-style.js';
/**
 * Inline Semantic Behaviors
 * =========================
 * Behaviors for inline semantic elements like <kbd> and <mark>
 */

/**
 * Kbd - Keyboard Input
 * Helper Attribute: [x-kbd]
 */
export function kbd(element, options = {}) {
  element.classList.add('x-kbd');
  
  // #779: the styling is .x-kbd in ui-utils.css (always loaded). This used
  // to write it onto element.style behind a --x-kbd-styled check that no
  // stylesheet ever defined, so it always ran.

  return () => element.classList.remove('x-kbd');
}

/**
 * Mark - Highlight text
 * Helper Attribute: [x-mark]
 *
 * `variant="success|warning|danger|info"` picks a themed highlight tint
 * (styling lives in inline.css). `color="blue"` / `color="#ff00ff"` sets an
 * arbitrary highlight — the one legitimate escape hatch for a literal color,
 * since it's an author-supplied value, not a hardcoded default — and the
 * text color is auto-contrasted (black/white) so it stays legible (#284).
 */
const MARK_VARIANTS = ['success', 'warning', 'danger', 'info'];

function contrastTextColor(color) {
  // The probe resolves any CSS color syntax to rgb(); it gets the color
  // through a generated rule rather than its style attribute (#779).
  const probe = document.createElement('span');
  setRule(probe, 'probe', { color });
  document.body.appendChild(probe);
  const match = getComputedStyle(probe).color.match(/\d+/g);
  document.body.removeChild(probe);
  clearRules(probe);
  if (!match) return 'inherit';
  const [r, g, b] = match.map(Number);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#000' : '#fff';
}

export function mark(element, options = {}) {
  const variant = options.variant || element.getAttribute('variant');
  const color = options.color || element.getAttribute('color');

  element.classList.add('x-mark');
  MARK_VARIANTS.forEach((v) => element.classList.remove(`x-mark--${v}`));

  if (color) {
    // An author-supplied color is a runtime value: a generated rule, not the
    // style attribute (#779). Weight 2 outranks the (0,1,1) highlight rules
    // card.css gives `header > mark`, which the inline value used to beat.
    setRule(element, 'color', { backgroundColor: color, color: contrastTextColor(color) }, { weight: 2 });
  } else {
    setRule(element, 'color', null);
    if (variant && MARK_VARIANTS.includes(variant)) element.classList.add(`x-mark--${variant}`);
  }

  return () => {
    element.classList.remove('x-mark', ...MARK_VARIANTS.map((v) => `x-mark--${v}`));
    setRule(element, 'color', null);
  };
}

export default { kbd, mark };

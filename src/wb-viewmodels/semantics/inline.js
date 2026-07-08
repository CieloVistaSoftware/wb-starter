/**
 * Inline Semantic Behaviors
 * =========================
 * Behaviors for inline semantic elements like <kbd> and <mark>
 */

/**
 * Kbd - Keyboard Input
 * Helper Attribute: [x-behavior="kbd"]
 */
export function kbd(element, options = {}) {
  element.classList.add('wb-kbd');
  
  // Basic styling if not in CSS
  if (!getComputedStyle(element).getPropertyValue('--wb-kbd-styled')) {
    Object.assign(element.style, {
      display: 'inline-block',
      padding: '0.15em 0.4em',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      fontSize: '0.85em',
      lineHeight: '1',
      color: 'var(--text-primary, #374151)',
      verticalAlign: 'middle',
      backgroundColor: 'var(--bg-secondary, #f3f4f6)',
      border: '1px solid var(--border-color, #d1d5db)',
      borderRadius: '4px',
      boxShadow: '0 1px 0 rgba(0,0,0,0.1)',
    });
  }

  return () => element.classList.remove('wb-kbd');
}

/**
 * Mark - Highlight text
 * Helper Attribute: [x-behavior="mark"]
 *
 * `variant="success|warning|danger|info"` picks a themed highlight tint
 * (styling lives in inline.css). `color="blue"` / `color="#ff00ff"` sets an
 * arbitrary highlight — the one legitimate escape hatch for a literal color,
 * since it's an author-supplied value, not a hardcoded default — and the
 * text color is auto-contrasted (black/white) so it stays legible (#284).
 */
const MARK_VARIANTS = ['success', 'warning', 'danger', 'info'];

function contrastTextColor(color) {
  const probe = document.createElement('span');
  probe.style.color = color;
  document.body.appendChild(probe);
  const match = getComputedStyle(probe).color.match(/\d+/g);
  document.body.removeChild(probe);
  if (!match) return 'inherit';
  const [r, g, b] = match.map(Number);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#000' : '#fff';
}

export function mark(element, options = {}) {
  const variant = options.variant || element.getAttribute('variant');
  const color = options.color || element.getAttribute('color');

  element.classList.add('wb-mark');
  MARK_VARIANTS.forEach((v) => element.classList.remove(`wb-mark--${v}`));

  if (color) {
    element.style.backgroundColor = color;
    element.style.color = contrastTextColor(color);
  } else {
    element.style.backgroundColor = '';
    element.style.color = '';
    if (variant && MARK_VARIANTS.includes(variant)) element.classList.add(`wb-mark--${variant}`);
  }

  return () => {
    element.classList.remove('wb-mark', ...MARK_VARIANTS.map((v) => `wb-mark--${v}`));
    element.style.backgroundColor = '';
    element.style.color = '';
  };
}

export default { kbd, mark };

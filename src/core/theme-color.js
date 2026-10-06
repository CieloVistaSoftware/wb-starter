/**
 * theme-color.js — an author names a colour by intent, never by token (#907).
 *
 * John: "the user must have ease of use no duplication or massive strings that
 * require internals knowledge". So `<button x-glow color="success">`, not
 * `color="var(--success-color)"`: the second form makes the author know the
 * token is `--success-color` (not `--success` or `--color-success`), and a
 * wrong guess renders nothing with no error.
 *
 * The names are the theme's own colour set (src/styles/themes.css). Anything
 * else -- a hex, rgb(), hsl() or a named CSS colour -- is a real colour the
 * author chose, and passes through unchanged (John: "color should allow hex
 * values too right?").
 */

/** Intent name -> the theme token that carries it. */
export const THEME_COLORS = Object.freeze({
  primary: '--primary',
  secondary: '--secondary',
  accent: '--accent',
  success: '--success-color',
  warning: '--warning-color',
  danger: '--danger-color',
  info: '--info-color',
  // The theme's three background shades, for surfaces (x-grid background,
  // x-stack bg): page, raised panel, and the panel inside a panel.
  'bg-primary': '--bg-primary',
  'bg-secondary': '--bg-secondary',
  'bg-tertiary': '--bg-tertiary',
});

/** Is `value` one of the theme's colour names? */
export function isThemeColor(value) {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(THEME_COLORS, value.trim());
}

/**
 * A CSS colour for an author's attribute value: a theme name becomes its
 * token, anything else is returned as written. Empty stays empty.
 *
 * @param {string|null|undefined} value
 * @returns {string}
 */
export function themeColor(value) {
  if (!value) return '';
  const name = String(value).trim();
  return isThemeColor(name) ? `var(${THEME_COLORS[name]})` : name;
}

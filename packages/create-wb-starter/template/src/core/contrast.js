/**
 * WCAG contrast-ratio utilities.
 *
 * "put a global configurable contrast ratio that affects every control...
 * tied into our theme generator automatically" -- the concrete bug that
 * prompted this (x-cardhero's title rendering in --text-primary instead
 * of the scrim's --text-on-accent, illegible over a busy photo) was fixed
 * directly in hero.css. This is the systemic half: a single place that
 * defines what "readable" means, so any theme -- the 23 that exist today
 * or any added later -- gets checked against the same number instead of
 * each page/behavior silently deciding contrast for itself.
 */

// WCAG 2.1 AA for normal-size text. Change this ONE value to retune the
// site-wide minimum; every consumer (tests, and any future runtime check)
// reads it from here rather than hardcoding its own threshold.
export const MIN_CONTRAST_RATIO = 4.5;

/** Parse "hsl(H, S%, L%)" (themes.css's format) into [h, s, l] (0-360, 0-100, 0-100). */
export function parseHsl(hslString) {
  const m = /hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)/i.exec(hslString);
  if (!m) return null;
  return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])];
}

/** HSL (0-360, 0-100, 0-100) -> sRGB [r, g, b] (0-255). */
export function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

/** WCAG relative luminance of an sRGB color. */
export function relativeLuminance([r, g, b]) {
  const [rs, gs, bs] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** WCAG contrast ratio (1-21) between two sRGB colors. */
export function contrastRatio(rgb1, rgb2) {
  const l1 = relativeLuminance(rgb1);
  const l2 = relativeLuminance(rgb2);
  const [lighter, darker] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

/** Contrast ratio between two "hsl(...)" strings, or null if either fails to parse. */
export function hslContrastRatio(hslA, hslB) {
  const a = parseHsl(hslA);
  const b = parseHsl(hslB);
  if (!a || !b) return null;
  return contrastRatio(hslToRgb(...a), hslToRgb(...b));
}

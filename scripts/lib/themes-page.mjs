/**
 * themes-page.mjs -- what the Themes page says, computed from the themes (#1025)
 *
 * pages/themes.html used to be hand-written: 23 cards, "23 beautiful themes",
 * 12 dark and 11 light, while themes.css had grown to 50. Nothing tied the
 * page to the themes, so every theme added after the 23rd went missing.
 *
 * Everything here is derived. The list is src/core/themes-registry.js; whether
 * a theme is dark or light is read from the lightness of its own --bg-primary
 * in src/styles/themes.css, not tagged by hand. Pure functions only: the
 * build script writes the result into the page, and the compliance test
 * compares the page against it.
 */

/** Each theme's --bg-primary lightness (0-100), keyed by id, from themes.css. */
export function backgroundLightness(css) {
  const out = new Map();
  for (const [, id, body] of css.matchAll(/\[data-theme="([a-z0-9-]+)"\][^{]*\{([^}]*)\}/g)) {
    if (out.has(id)) continue;
    const bg = body.match(/--bg-primary:\s*hsl\(\s*[\d.]+\s*,\s*[\d.]+%\s*,\s*([\d.]+)%\s*\)/);
    if (bg) out.set(id, Number(bg[1]));
  }
  return out;
}

/**
 * The registry with each theme's tone attached. Throws when a registered
 * theme has no block in themes.css, or no hsl() --bg-primary to read: a card
 * for a theme that does not render is worse than a failed build.
 */
export function classifyThemes(themes, css) {
  const lightness = backgroundLightness(css);
  return themes.map((t) => {
    if (!lightness.has(t.id)) {
      throw new Error(`theme "${t.id}" is in themes-registry.js but has no [data-theme="${t.id}"] block with an hsl() --bg-primary in themes.css`);
    }
    return { ...t, tone: lightness.get(t.id) >= 50 ? 'light' : 'dark' };
  });
}

/** The counts the hero and the stat cards show. */
export function themeCounts(classified) {
  const dark = classified.filter((t) => t.tone === 'dark').length;
  return { total: classified.length, dark, light: classified.length - dark };
}

const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * One card. data-theme makes the card render in that theme's own variables,
 * so its swatches and sample are a live preview, not copied colours.
 * x-themecontrol picks the theme when it is clicked; x-ignore keeps WB's
 * native-button enhancement off it.
 */
function card(t) {
  const name = escapeHtml(t.name);
  const tag = t.tone === 'light' ? '☀️ Light' : '🌙 Dark';
  return [
    `    <button type="button" x-ignore class="theme-card x-themecontrol__pick" id="theme-card-${t.id}" data-theme="${t.id}" title="Switch to ${name}">`,
    '      <span class="theme-card__preview">',
    '        <span class="theme-card__colors"><span></span><span></span><span></span></span>',
    '        <span class="theme-card__sample"><span class="sample-text">Aa</span></span>',
    '      </span>',
    '      <span class="theme-card__info">',
    `        <span class="theme-card__name">${name}</span>`,
    `        <span class="theme-card__description">${escapeHtml(t.description)}</span>`,
    `        <span class="theme-card__tag">${tag}</span>`,
    '      </span>',
    '    </button>',
  ].join('\n');
}

const START = '<!-- generated:theme-cards:start -- scripts/build-themes-page.mjs writes this; do not edit by hand -->';
const END = '<!-- generated:theme-cards:end -->';

/**
 * pages/themes.html with every derived part rewritten: the hero count, the
 * three stat cards, the grid title and the cards. Throws if an anchor the
 * page needs is missing, so a hand edit that removes one fails loudly.
 */
export function renderThemesPage(html, classified) {
  const { total, dark, light } = themeCounts(classified);
  const replaceOnce = (src, re, to, what) => {
    if (!re.test(src)) throw new Error(`pages/themes.html: cannot find ${what}`);
    return src.replace(re, to);
  };
  let out = html;
  out = replaceOnce(out, /(<p id="themes-hero-count">)\d+( beautiful themes)/, `$1${total}$2`, 'the hero count (#themes-hero-count)');
  out = replaceOnce(out, /(id="themes-stats-total" value=")\d+(")/, `$1${total}$2`, '#themes-stats-total');
  out = replaceOnce(out, /(id="themes-stats-dark" value=")\d+(")/, `$1${dark}$2`, '#themes-stats-dark');
  out = replaceOnce(out, /(id="themes-stats-light" value=")\d+(")/, `$1${light}$2`, '#themes-stats-light');
  out = replaceOnce(out, /(<h2 class="section-title" id="themes-grid-title">All )\d+( Themes<\/h2>)/, `$1${total}$2`, 'the grid title (#themes-grid-title)');
  const cards = `${START}\n${classified.map(card).join('\n')}\n    ${END}`;
  out = replaceOnce(out, /<!-- generated:theme-cards:start[^>]*-->[\s\S]*?<!-- generated:theme-cards:end -->/, () => cards, 'the generated:theme-cards markers');
  return out;
}

/**
 * pages/features.html with its theme count (the "Themes" stat card and the
 * Themes feature paragraph) set from the registry.
 */
export function renderFeaturesPage(html, classified) {
  const { total } = themeCounts(classified);
  const replaceOnce = (src, re, to, what) => {
    if (!re.test(src)) throw new Error(`pages/features.html: cannot find ${what}`);
    return src.replace(re, to);
  };
  let out = replaceOnce(html, /(id="features-div-7" value=")\d+(" label="Themes")/, `$1${total}$2`, 'the Themes stat card (#features-div-7)');
  out = replaceOnce(out, /(<p id="features-p-18">)\d+( beautiful themes)/, `$1${total}$2`, 'the Themes paragraph (#features-p-18)');
  return out;
}

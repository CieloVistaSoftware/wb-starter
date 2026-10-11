/**
 * Theme tokens (#1832): the source page's palette, type scale and spacing,
 * proposed as overrides of the theme tokens WB Starter already has.
 *
 * #982's rule: "Extract only tokens -- palette, type scale, spacing -- into
 * the theme system." No rule of theirs is copied. sampleStylesInPage() reads
 * the computed styles of the rendered source page; proposeTokens() maps what
 * it measured onto token names that src/styles/themes.css defines, and stops
 * the run if a mapping names a token themes.css does not have.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/* global document, getComputedStyle, Node, SVGElement -- sampleStylesInPage runs in the browser page. */
/**
 * Runs INSIDE the rendered source page, after the extractor. Self-contained:
 * Playwright sends its source text to the page.
 *
 * It reads every visible element twice: as the page renders, then with every
 * stylesheet and inline style switched off. A value counts only where the
 * source's own CSS changed the browser's default: the browser's blue links
 * and 2em headings are nobody's palette or type scale.
 */
export function sampleStylesInPage() {
  const px = (v) => parseFloat(v) || 0;
  const label = (el) => {
    const tag = el.tagName.toLowerCase();
    if (el.id) return `${tag}#${el.id}`;
    return el.classList[0] ? `${tag}.${el.classList[0]}` : tag;
  };
  const clear = (c) => !c || c === 'transparent' || c === 'rgba(0, 0, 0, 0)';
  const control = (el) => {
    const tag = el.tagName.toLowerCase();
    return tag === 'button' || tag === 'a' || el.getAttribute('role') === 'button' || /(^|\s)(btn|button)/i.test(el.className || '');
  };
  const SIDES = ['Top', 'Right', 'Bottom', 'Left'];
  const SPACING = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'marginTop', 'marginBottom', 'rowGap', 'columnGap'];
  const read = (el) => {
    const cs = getComputedStyle(el);
    return {
      color: cs.color,
      size: px(cs.fontSize),
      bg: cs.backgroundColor,
      border: SIDES.every((d) => px(cs[`border${d}Width`]) > 0 && cs[`border${d}Style`] !== 'none') ? cs.borderTopColor : null,
      spacing: SPACING.map((prop) => px(cs[prop])),
    };
  };
  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'LINK', 'META']);
  const els = [...document.body.querySelectorAll('*')].filter((el) => {
    if (SKIP.has(el.tagName) || el instanceof SVGElement) return false;
    const cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && el.getClientRects().length > 0;
  });
  const page = [document.documentElement, document.body].map((e) => getComputedStyle(e).backgroundColor);
  const styled = els.map((el) => {
    // Text sits on the page itself when nothing between it and <body> is filled.
    let onCanvas = true;
    for (let p = el; p && p !== document.body; p = p.parentElement) if (!clear(getComputedStyle(p).backgroundColor)) { onCanvas = false; break; }
    const r = el.getBoundingClientRect();
    const own = [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.data).join(' ').replace(/\s+/g, ' ').trim();
    return { ...read(el), onCanvas, area: Math.round(r.width * r.height), own };
  });

  // The browser's defaults: the same elements with no author CSS at all.
  for (const sheet of document.styleSheets) sheet.disabled = true;
  for (const el of [document.documentElement, document.body, ...els]) el.removeAttribute('style');
  const plain = els.map(read);
  const plainPage = [document.documentElement, document.body].map((e) => getComputedStyle(e).backgroundColor);

  const out = {
    page: { htmlBg: page[0] !== plainPage[0] ? page[0] : null, bodyBg: page[1] !== plainPage[1] ? page[1] : null },
    text: [], fills: [], borders: [], spacing: [],
  };
  els.forEach((el, i) => {
    const s = styled[i];
    const d = plain[i];
    const sel = label(el);
    if (s.own) {
      out.text.push({
        sel, weight: s.own.length, link: !!el.closest('a, button'), heading: /^H[1-6]$/.test(el.tagName), onCanvas: s.onCanvas,
        color: s.color !== d.color ? s.color : null, size: s.size !== d.size ? s.size : null,
      });
    }
    if (!clear(s.bg) && s.bg !== d.bg) out.fills.push({ sel, color: s.bg, area: s.area, control: control(el) });
    if (s.border && s.border !== d.border) out.borders.push({ sel, color: s.border, control: control(el) });
    SPACING.forEach((prop, k) => {
      if (s.spacing[k] > 0 && s.spacing[k] !== d.spacing[k]) out.spacing.push({ sel, prop, v: s.spacing[k] });
    });
  });
  return out;
}

// ------------------------------------------------------------------ Node side

const GOLDEN = 1.618;
/**
 * The scales as src/styles/themes.css defines them, in px at a 16px root:
 * xs/sm/md and xs/sm/base are set there, the steps above chain x1.618.
 */
const SPACE = [['--space-xs', 4], ['--space-sm', 8], ['--space-md', 16], ['--space-lg', 16 * GOLDEN],
  ['--space-xl', 16 * GOLDEN ** 2], ['--space-2xl', 16 * GOLDEN ** 3]];
const TEXT_BELOW = [['--text-xs', 12], ['--text-sm', 14]];
const TEXT_ABOVE = [['--text-lg', 16 * GOLDEN], ['--text-xl', 16 * GOLDEN ** 2], ['--text-2xl', 16 * GOLDEN ** 3], ['--text-3xl', 16 * GOLDEN ** 4]];

/** Every custom property src/styles/themes.css declares: the canonical token list. */
export function loadThemeTokens(repoRoot) {
  const file = resolve(repoRoot, 'src', 'styles', 'themes.css');
  if (!existsSync(file)) throw new Error(`no theme stylesheet at ${file}: run site-migrate from a checkout of the repo`);
  const names = new Set();
  for (const m of readFileSync(file, 'utf8').matchAll(/(--[a-z0-9-]+)\s*:/gi)) names.add(m[1]);
  return { names, source: 'src/styles/themes.css' };
}

function rgb(c) {
  const m = String(c).match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/);
  if (!m) return null;
  const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
  return { r: +m[1], g: +m[2], b: +m[3], a };
}
/** A computed colour as #rrggbb, or rgba() when it is see-through. */
export function hex(c) {
  const v = rgb(c);
  if (!v) return String(c);
  if (v.a < 1) return `rgba(${v.r}, ${v.g}, ${v.b}, ${v.a})`;
  return `#${[v.r, v.g, v.b].map((n) => Math.round(n).toString(16).padStart(2, '0')).join('')}`;
}
const luminance = (c) => {
  const v = rgb(c) || rgb(String(c).replace(/^#(..)(..)(..)$/, (_, r, g, b) => `rgb(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)})`));
  if (!v) return 0.5;
  const lin = (n) => { const s = n / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * lin(v.r) + 0.7152 * lin(v.g) + 0.0722 * lin(v.b);
};
/** HSL saturation, 0-1. */
function saturation(c) {
  const v = rgb(c);
  if (!v) return 0;
  const [r, g, b] = [v.r, v.g, v.b].map((n) => n / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  return max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
}
const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

/** Sum `weigh(item)` per `key(item)`, heaviest first; each entry keeps a few example selectors. */
function tally(items, key, weigh) {
  const m = new Map();
  for (const it of items) {
    const k = key(it);
    const e = m.get(k) || { key: k, weight: 0, count: 0, sels: [] };
    e.weight += weigh(it);
    e.count += 1;
    if (!e.sels.includes(it.sel) && e.sels.length < 3) e.sels.push(it.sel);
    m.set(k, e);
  }
  return [...m.values()].sort((a, b) => b.weight - a.weight
    || (typeof a.key === 'number' ? a.key - b.key : String(a.key).localeCompare(String(b.key))));
}

/**
 * Merge values within 10% of each other into the most used of them: 16px and
 * 17px (1em of a 17px paragraph) are one step of a scale, not two.
 */
function cluster(entries) {
  const kept = [];
  for (const e of entries) {
    const near = kept.find((k) => Math.max(k.key, e.key) / Math.min(k.key, e.key) < 1.1);
    if (!near) { kept.push({ ...e, sels: [...e.sels] }); continue; }
    near.weight += e.weight;
    near.count += e.count;
    for (const sel of e.sels) if (!near.sels.includes(sel) && near.sels.length < 3) near.sels.push(sel);
  }
  return kept.sort((a, b) => b.weight - a.weight || a.key - b.key);
}

/**
 * Assign measured values (ascending) to tokens (ascending defaults), keeping
 * their order, so that the total distance (in ratio) between each value and
 * its token's default is least. Returns [token, value] pairs.
 */
export function assignOrdered(values, tokens) {
  const v = [...values].sort((a, b) => a - b);
  const n = v.length;
  const t = tokens.length;
  if (!n) return [];
  if (n > t) throw new Error('more values than tokens');
  const cost = (i, j) => Math.abs(Math.log(v[i] / tokens[j][1]));
  // best[i][j]: least cost placing v[0..i] with v[i] on token j.
  const best = v.map(() => tokens.map(() => Infinity));
  const from = v.map(() => tokens.map(() => -1));
  for (let j = 0; j < t; j++) best[0][j] = cost(0, j);
  for (let i = 1; i < n; i++) {
    for (let j = i; j < t; j++) {
      for (let k = i - 1; k < j; k++) {
        const c = best[i - 1][k] + cost(i, j);
        if (c < best[i][j]) { best[i][j] = c; from[i][j] = k; }
      }
    }
  }
  let j = 0;
  for (let k = 1; k < t; k++) if (best[n - 1][k] < best[n - 1][j]) j = k;
  const out = [];
  for (let i = n - 1; i >= 0; i--) { out.unshift([tokens[j][0], v[i]]); j = from[i][j]; }
  return out;
}

const rem = (pxValue) => `${Number((pxValue / 16).toFixed(4))}rem`;
const round = (n) => Math.round(n * 2) / 2;
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/**
 * The proposed overrides: [{token, value, from, group}], plus what was
 * measured but left out and why.
 * @param {ReturnType<typeof sampleStylesInPage>} s
 * @param {{names: Set<string>, source: string}} theme
 */
export function proposeTokens(s, theme) {
  const tokens = [];
  const skipped = [];
  const add = (group, token, value, from) => {
    if (!theme.names.has(token)) throw new Error(`site-migrate proposed ${token}, which ${theme.source} does not define`);
    tokens.push({ group, token, value, from });
  };

  // ---------------------------------------------------------------- palette
  const pageBg = [s.page.bodyBg, s.page.htmlBg].find((c) => c && rgb(c) && rgb(c).a > 0);
  if (pageBg) add('Palette', '--bg-color', hex(pageBg), `the page background (${s.page.bodyBg === pageBg ? 'body' : 'html'})`);
  else skipped.push('--bg-color: the source does not set a page background');
  const canvas = pageBg || 'rgb(255, 255, 255)';
  // The page's text colours: text on the page itself, not on a filled hero or card.
  const body = tally(s.text.filter((t) => t.color && t.onCanvas && !t.link), (t) => hex(t.color), (t) => t.weight);
  if (body[0]) add('Palette', '--text-primary', body[0].key, `most of the text (${plural(body[0].count, 'element')}, e.g. ${body[0].sels.join(', ')})`);
  else skipped.push('--text-primary: the source does not set a text colour on the page');
  // Quieter than the main text, and still readable on the page (3:1).
  const muted = body[0] && body.slice(1).find((c) => contrast(c.key, canvas) < contrast(body[0].key, canvas) && contrast(c.key, canvas) >= 3);
  if (muted) add('Palette', '--text-muted', muted.key, `the quieter text (${plural(muted.count, 'element')}, e.g. ${muted.sels.join(', ')})`);
  // The brand colour is a colour: greys (a browser's own button face among
  // them) are left to the neutrals.
  const buttons = tally(s.fills.filter((f) => f.control && saturation(f.color) >= 0.2), (f) => hex(f.color), () => 1);
  const links = tally(s.text.filter((t) => t.color && t.link && saturation(t.color) >= 0.2), (t) => hex(t.color), (t) => t.weight);
  const primary = buttons[0] || links[0];
  if (primary) add('Palette', '--primary', primary.key, `${buttons[0] ? 'the filled buttons' : 'the links'} (${plural(primary.count, 'element')}, e.g. ${primary.sels.join(', ')})`);
  else skipped.push('--primary: the source gives no button or link a colour of its own');
  const surfaces = tally(s.fills.filter((f) => !f.control && hex(f.color) !== hex(canvas) && (!primary || hex(f.color) !== primary.key)), (f) => hex(f.color), (f) => f.area);
  if (surfaces[0]) add('Palette', '--bg-secondary', surfaces[0].key, `the largest tinted area (${plural(surfaces[0].count, 'element')}, e.g. ${surfaces[0].sels.join(', ')})`);
  const borders = tally(s.borders.filter((b) => !b.control), (b) => hex(b.color), () => 1);
  if (borders[0]) add('Palette', '--border-color', borders[0].key, `the bordered boxes (${plural(borders[0].count, 'element')}, e.g. ${borders[0].sels.join(', ')})`);

  // ---------------------------------------------------------------- type scale
  // The base is the size most of the running text has; the steps are the
  // other sizes the source set. A base the source left alone is the
  // browser's 16px, which is the theme's 1rem already.
  const running = cluster(tally(s.text.filter((t) => !t.heading && !t.link), (t) => round(t.size || 0), (t) => t.weight))[0];
  const base = running && running.key ? running : null;
  if (base) add('Type scale', '--text-base', rem(base.key), `${base.key}px, the size of most of the text (e.g. ${base.sels.join(', ')})`);
  else if (running) skipped.push('--text-base: the source leaves most of its text at the browser\'s 16px, which is the theme\'s 1rem already');
  const baseKey = base ? base.key : 16;
  const near = (k) => Math.max(k, baseKey) / Math.min(k, baseKey) < 1.1;
  const sizes = cluster(tally(s.text.filter((t) => t.size), (t) => round(t.size), (t) => t.weight)).filter((z) => !near(z.key));
  const pick = (list, scale) => {
    const kept = list.slice(0, scale.length);
    for (const z of list.slice(scale.length)) skipped.push(`${z.key}px text (e.g. ${z.sels.join(', ')}): the type scale has no step left for it`);
    return assignOrdered(kept.map((z) => z.key), scale).map(([token, v]) => [token, kept.find((z) => z.key === v)]);
  };
  for (const [token, z] of [...pick(sizes.filter((z) => z.key < baseKey), TEXT_BELOW), ...pick(sizes.filter((z) => z.key > baseKey), TEXT_ABOVE)]) {
    add('Type scale', token, rem(z.key), `${z.key}px (e.g. ${z.sels.join(', ')})`);
  }

  // ---------------------------------------------------------------- spacing
  // 1-2px is a hairline, not a step of a spacing scale (the px audit, #294, draws the same line).
  const steps = cluster(tally(s.spacing.filter((p) => p.v > 2 && p.v <= 160), (p) => round(p.v), () => 1));
  const keptSteps = steps.slice(0, SPACE.length);
  for (const z of steps.slice(SPACE.length)) skipped.push(`${z.key}px spacing (${plural(z.count, 'use')}, e.g. ${z.sels.join(', ')}): used less than the ${SPACE.length} spacing steps kept`);
  for (const [token, v] of assignOrdered(keptSteps.map((z) => z.key), SPACE)) {
    const z = keptSteps.find((k) => k.key === v);
    add('Spacing', token, rem(v), `${v}px, ${plural(z.count, 'use')} (e.g. ${z.sels.join(', ')})`);
  }
  // A light source page wants WB Starter's light theme under its tokens.
  const tone = pageBg ? (luminance(hex(pageBg)) > 0.5 ? 'light' : 'dark') : null;
  return { tokens, skipped, source: theme.source, tone };
}

/** The proposed styles/site.css snippet. */
export function tokenCss({ input, name, proposal }) {
  const lines = [
    `/* Proposed by site-migrate from ${input}: theme-token overrides measured from`,
    '   the rendered source page. No rule of theirs is copied; every name below is',
    `   a token ${proposal.source} defines. Review ${name}.migration.md, then merge`,
    '   what you keep into styles/site.css.',
    '',
    '   They apply to every theme. To keep the theme switcher\'s other themes as',
    '   they are, put them under [data-theme="light"] (or "dark") instead.',
    ...(proposal.tone ? [`   The source is a ${proposal.tone} page: set data-theme="${proposal.tone}" on <html> in index.html,`,
      '   so the colours these tokens leave alone (cards, headers) match them.'] : []),
    '*/',
    ':root, [data-theme] {',
  ];
  let group = '';
  for (const t of proposal.tokens) {
    if (t.group !== group) { if (group) lines.push(''); lines.push(`  /* ${t.group} */`); group = t.group; }
    lines.push(`  ${t.token}: ${t.value}; /* ${t.from.replace(/\*\//g, '* /')} */`);
  }
  lines.push('}', '');
  return lines.join('\n');
}

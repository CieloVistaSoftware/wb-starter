/**
 * site-migrate (#982, v1 #1832): propose a WB Starter page for one existing HTML page.
 *
 * Assisted, not autonomous. It renders the page in a headless browser (static
 * after render: the page's own scripts run, the network does not), maps what
 * it finds onto WB Starter's vocabulary, and lists every change with its
 * reason so a person can review it. What it cannot classify it leaves in
 * place under a TODO comment; it never writes content of its own.
 *
 * Node side: launch the browser, run the extractor (extract.js) and the style
 * sampler (tokens.js) in the page, serialize the proposed fragment, check it,
 * run it through the compliance checks in the site shell (compliance.js), and
 * write the report.
 */
import { copyFileSync, existsSync, mkdirSync, realpathSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve, sep, isAbsolute } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { extractInPage } from './extract.js';
import { sampleStylesInPage, loadThemeTokens, proposeTokens, tokenCss } from './tokens.js';
import { complianceRun } from './compliance.js';

const HERE = dirname(fileURLToPath(import.meta.url));
/** The checkout this package lives in: the registry, the themes and the checks come from it. */
export const REPO_ROOT = resolve(HERE, '..', '..', '..');

/**
 * The behavior registry: src/core/tag-map.js, read from the checkout this
 * package lives in. v0 runs from a checkout only (it is a private package).
 * @returns {Promise<{nativeMap: Record<string,string>, extensionMap: Record<string,string>, source: string}>}
 */
export async function loadRegistry() {
  const file = resolve(REPO_ROOT, 'src', 'core', 'tag-map.js');
  if (!existsSync(file)) throw new Error(`no behavior registry at ${file}: run site-migrate from a checkout of the repo`);
  const { nativeMap, extensionMap } = await import(pathToFileURL(file).href);
  return { nativeMap, extensionMap, source: 'src/core/tag-map.js' };
}

// ------------------------------------------------------------------ rendering

/**
 * Render `file` and run the extractor in it. Only file: URLs load; every
 * network request is refused, so the result depends on the file alone.
 */
export async function extract(file, registry, { browser } = {}) {
  let own = null;
  if (!browser) {
    const { chromium } = await import('playwright-core');
    own = await chromium.launch();
    browser = own;
  }
  const context = await browser.newContext({ javaScriptEnabled: true, offline: true });
  try {
    const page = await context.newPage();
    await page.route('**/*', (route) => (route.request().url().startsWith('file:') ? route.continue() : route.abort()));
    await page.goto(pathToFileURL(file).href, { waitUntil: 'load' });
    const result = await page.evaluate(extractInPage, { nativeMap: registry.nativeMap, extensionMap: registry.extensionMap });
    result.styles = await page.evaluate(sampleStylesInPage);
    return result;
  } finally {
    await context.close();
    if (own) await own.close();
  }
}

// ------------------------------------------------------------------ serializing

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'source', 'track', 'wbr']);
const INLINE = new Set(['a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'button', 'cite', 'code', 'data', 'dfn', 'em', 'i', 'img',
  'input', 'kbd', 'label', 'mark', 'output', 'q', 's', 'samp', 'small', 'span', 'strong', 'sub', 'sup', 'textarea',
  'time', 'u', 'var', 'wbr',
  // An inline SVG icon stays on its line, with the text beside it.
  'svg', 'g', 'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon', 'title', 'desc', 'use']);
const escText = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

function openTag(n) {
  // id first, then the behavior (x-*), then the rest in source order.
  const rank = ([k]) => (k === 'id' ? 0 : k.startsWith('x-') ? 1 : 2);
  const attrs = [...n.attrs].sort((a, b) => rank(a) - rank(b));
  return `<${[n.tag, ...attrs.map(([k, v]) => (v === '' ? k : `${k}="${escAttr(v)}"`))].join(' ')}>`;
}
const isInline = (n) => n.t === 'text' || (n.t === 'el' && INLINE.has(n.tag) && n.kids.every(isInline));
function inlineHtml(nodes) {
  return nodes.map((n) => (n.t === 'text' ? escText(n.v)
    : n.t === 'comment' ? `<!--${n.v}-->`
      : VOID.has(n.tag) ? openTag(n) : `${openTag(n)}${inlineHtml(n.kids)}</${n.tag}>`)).join('');
}
/** The fragment as indented HTML: one block per line, inline runs kept together. */
export function serialize(nodes, depth = 0) {
  const pad = '  '.repeat(depth);
  const lines = [];
  let run = [];
  const flush = () => {
    const html = inlineHtml(run).replace(/\s+/g, ' ').trim();
    if (html) lines.push(pad + html);
    run = [];
  };
  for (const n of nodes) {
    if (isInline(n)) { run.push(n); continue; }
    flush();
    if (n.t === 'comment') lines.push(`${pad}<!--${n.v}-->`);
    else if (VOID.has(n.tag)) lines.push(pad + openTag(n));
    else if (n.kids.every(isInline)) lines.push(`${pad}${openTag(n)}${inlineHtml(n.kids).replace(/\s+/g, ' ').trim()}</${n.tag}>`);
    else lines.push(pad + openTag(n), ...serialize(n.kids, depth + 1).split('\n').filter(Boolean), `${pad}</${n.tag}>`);
  }
  flush();
  return lines.join('\n');
}

// ------------------------------------------------------------------ checks

function walk(nodes, visit) {
  for (const n of nodes) { visit(n); if (n.t === 'el') walk(n.kids, visit); }
}
const normText = (s) => String(s).replace(/\s+/g, ' ').trim();

/**
 * The checks the proposed page must pass before it is written. A failure
 * means a rule in extract.js is wrong, so nothing is written.
 */
export function check(result, registry) {
  const xs = new Set();
  const natives = new Map();
  const bad = { xUnknown: [], attrs: [], tags: [], invented: [] };
  const source = normText(result.sourceText);
  // Attributes that carry the page's words: each must be in the source.
  const TEXT_ATTRS = new Set(['title', 'subtitle', 'author', 'role', 'alt', 'plan', 'price', 'period', 'description', 'cta', 'tab-title']);
  walk(result.nodes, (n) => {
    if (n.t === 'text' && normText(n.v) && !source.includes(normText(n.v))) bad.invented.push(normText(n.v));
    if (n.t !== 'el') return;
    if (['script', 'style', 'link', 'meta'].includes(n.tag)) bad.tags.push(n.tag);
    if (n.tag in registry.nativeMap) natives.set(n.tag, registry.nativeMap[n.tag]);
    for (const [k, v] of n.attrs) {
      if (k.startsWith('x-')) (k in registry.extensionMap ? xs.add(k) : bad.xUnknown.push(k));
      if (k === 'class' || k === 'style' || k.startsWith('data-') || /^on/.test(k)) bad.attrs.push(`${n.tag}[${k}]`);
      // role is the testimonial's attribution there, and an ARIA role anywhere else.
      const words = TEXT_ATTRS.has(k) && (k !== 'role' || n.attrs.some(([a]) => a === 'x-cardtestimonial'));
      if (words && normText(v) && !source.includes(normText(v))) bad.invented.push(`${k}="${v}"`);
      if (k === 'features') for (const f of v.split(',')) if (normText(f) && !source.includes(normText(f))) bad.invented.push(`features: "${normText(f)}"`);
    }
  });
  const checks = [
    { ok: !bad.xUnknown.length, text: bad.xUnknown.length ? `x-* attributes NOT in extensionMap: ${bad.xUnknown.join(', ')}` : `every x-* attribute is in extensionMap: ${[...xs].sort().join(', ') || '(none)'}` },
    { ok: true, text: `native elements that auto-inject a behavior (nativeMap): ${[...natives].sort().map(([t, b]) => `${t} → ${b}`).join(', ') || '(none)'}` },
    { ok: !bad.attrs.length, text: bad.attrs.length ? `class/style/data-*/on* attributes left: ${bad.attrs.join(', ')}` : 'no class, style, data-* or on* attributes' },
    { ok: !bad.tags.length, text: bad.tags.length ? `elements left that a page must not hold: ${bad.tags.join(', ')}` : 'no script, style, link or meta elements: the page is a fragment (Law 10)' },
    { ok: !bad.invented.length, text: bad.invented.length ? `text that is not in the source: ${bad.invented.map((t) => JSON.stringify(t)).join(', ')}` : 'every piece of text in the page is in the source page, word for word: nothing invented' },
  ];
  return { ok: checks.every((c) => c.ok), checks };
}

// ------------------------------------------------------------------ the report

/** The page name: index.html is the home page. */
export function pageName(file) {
  const name = basename(file, extname(file)).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
  return name === 'index' || !name ? 'home' : name;
}

/** An asset URL as a path relative to the page: no query, no fragment, no leading slash. */
const assetPath = (url) => {
  const bare = url.split(/[?#]/)[0];
  let decoded = bare;
  try { decoded = decodeURIComponent(bare); } catch { /* keep it as written */ }
  return decoded.replace(/^\/+/, '');
};
/** True when `rel`, taken from a folder, stays inside it. */
const staysInside = (rel) => {
  const probe = resolve(sep, 'site', rel);
  return probe.startsWith(resolve(sep, 'site') + sep);
};

export function assetRows(assets, inputDir) {
  return assets.map((a) => {
    const external = /^[a-z]+:/i.test(a.url) || a.url.startsWith('//');
    if (external) return { ...a, found: 'external: download it or link it' };
    const rel = assetPath(a.url);
    if (!existsSync(join(inputDir, rel))) return { ...a, found: 'missing next to the source' };
    if (!staysInside(rel)) return { ...a, found: 'found, but its path leaves the site folder: copy it by hand' };
    return { ...a, found: 'found', rel };
  });
}

/**
 * Copy every asset marked "found" into `outDir` at the same relative path.
 * Never writes outside `outDir`, and never over the input page.
 * @returns {{copied: string[], skipped: string[]}}
 */
export function copyAssets(rows, inputDir, outDir, input) {
  const copied = [];
  const skipped = [];
  const root = resolve(outDir);
  for (const a of rows) {
    if (a.found !== 'found' || copied.includes(a.rel)) continue;
    const from = resolve(inputDir, a.rel);
    const to = resolve(root, a.rel);
    const rel = relative(root, to);
    if (!rel || rel.startsWith('..') || isAbsolute(rel)) { skipped.push(`${a.url}: its path leaves ${root}`); continue; }
    if (from === to) { copied.push(a.rel); continue; }
    if (existsSync(to) && realpathSync(to) === input) { skipped.push(`${a.url}: it would overwrite the input`); continue; }
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(from, to);
    copied.push(a.rel);
  }
  return { copied, skipped };
}

/** The review list, as Markdown. */
export function report({ input, name, result, checks, inputDir, tokens, compliance }) {
  const { findings, unclassified, assets, shell } = result;
  const md = (s) => String(s).replace(/\|/g, '\\|');
  const code = (s) => `\`${String(s).replace(/`/g, "'")}\``;
  const siteJson = {
    branding: shell.companyName ? { companyName: shell.companyName } : undefined,
    navigationMenu: shell.navigationMenu.length ? shell.navigationMenu : undefined,
    footerSettings: shell.footerCopyrightText ? { footerCopyrightText: shell.footerCopyrightText } : undefined,
    searchEngineOptimization: shell.pageTitle || shell.pageDescription
      ? { pageTitle: shell.pageTitle || undefined, pageDescription: shell.pageDescription || undefined } : undefined,
  };
  const rows = assetRows(assets, inputDir);
  const found = rows.filter((a) => a.found === 'found').length;
  const passed = compliance.results.filter((r) => r.ok).length;
  const out = [
    `# site-migrate report: ${input}`,
    '',
    `Proposed page: \`pages/${name}.html\`. It is a proposal: review every change below before you use it.`,
    'site-migrate maps one static page onto WB Starter markup. It does not port CSS or scripts, and it never writes',
    'content of its own: what it cannot classify stays in the page, word for word, under a `TODO: unclassified` comment.',
    '',
    '## Summary',
    '',
    `- ${findings.length} changes, each with its reason`,
    `- ${unclassified.length} unclassified region${unclassified.length === 1 ? '' : 's'} for a person to decide`,
    `- ${shell.navigationMenu.length} menu item${shell.navigationMenu.length === 1 ? '' : 's'} and the page title proposed for \`config/site.json\``,
    `- ${tokens.tokens.length} theme token${tokens.tokens.length === 1 ? '' : 's'} proposed in \`${name}.site.css\``,
    `- ${rows.length} asset${rows.length === 1 ? '' : 's'}, ${found} found and copied by \`--write\``,
    `- checks: ${checks.ok ? 'all passed' : 'FAILED (nothing written)'}`,
    `- compliance run: ${passed} of ${compliance.results.length} passed`,
    '',
    '## Changes',
    '',
    ...findings.flatMap((f, i) => [
      `${i + 1}. ${code(f.path)}`,
      `   - Was: ${code(f.from)}`,
      `   - Now: ${code(f.to)}`,
      `   - Why: ${f.why}`,
    ]),
    '',
    '## Unclassified regions',
    '',
    ...(unclassified.length ? [
      '| Where | Was | Text | What to decide |',
      '|---|---|---|---|',
      ...unclassified.map((u) => `| ${code(u.path)} | ${code(u.from)} | ${md(u.text)} | ${md(u.why)} |`),
    ] : ['None.']),
    '',
    '## Site shell: proposed `config/site.json` entries',
    '',
    'Merge these into the site\'s `config/site.json` by hand; site-migrate does not edit it.',
    '',
    '```json',
    JSON.stringify(siteJson, null, 2),
    '```',
    '',
    ...(shell.notInMenu.length ? [
      'Links in the navigation that are not pages, so they are not in the menu:',
      '',
      ...shell.notInMenu.map((l) => `- ${md(l.text)} (${code(l.href)}): ${l.why}`),
      '',
    ] : []),
    '## Theme tokens: proposed `styles/site.css` overrides',
    '',
    `Measured from the computed styles of the rendered source page and mapped onto tokens that \`${tokens.source}\` defines.`,
    `No rule of theirs is copied. \`--write\` writes them to \`${name}.site.css\`; merge what you keep into \`styles/site.css\` by hand.`,
    '',
    ...(tokens.tokens.length ? [
      '| Token | Proposed | Measured from |',
      '|---|---|---|',
      ...tokens.tokens.map((t) => `| ${code(t.token)} | ${code(t.value)} | ${md(t.from)} |`),
    ] : ['None.']),
    '',
    ...(tokens.skipped.length ? [
      'Measured, but not proposed:',
      '',
      ...tokens.skipped.map((t) => `- ${md(t)}`),
      '',
    ] : []),
    '## Assets',
    '',
    `\`--write\` copies every asset marked found into \`--out\`, at the same relative path: a page is loaded into the site's \`index.html\`, so its relative URLs resolve from there.`,
    '',
    ...(rows.length ? [
      '| Kind | URL | Used by | Status |',
      '|---|---|---|---|',
      ...rows.map((a) => `| ${a.kind} | ${code(a.url)} | ${code(a.usedBy)} | ${a.found} |`),
    ] : ['None.']),
    '',
    '## Checks',
    '',
    'The proposed page must pass these before anything is written:',
    '',
    ...checks.checks.map((c) => `- ${c.ok ? 'PASS' : 'FAIL'}: ${c.text}`),
    '',
    '### Compliance run',
    '',
    `The proposed page, loaded into the site shell (the theme and stylesheets a new site's \`index.html\` loads, with the proposed tokens as \`styles/site.css\`, and the runtime) in headless Chromium at ${compliance.viewport.width}x${compliance.viewport.height}, measured with the same rule as each spec. The rule comes from the module the spec imports.`,
    '',
    ...compliance.results.flatMap((r) => [
      `- ${r.ok ? 'PASS' : 'FAIL'}: ${r.text}`,
      ...r.details.map((d) => `  - ${d}`),
    ]),
    '',
    'Not reproduced here: the specs run against every page in `pages/` and `demos/` on the dev server, inside the full site with its header, menu and footer; this run draws only `<main>`.',
    '',
    '## Not done yet',
    '',
    '- One page at a time; links between pages are not followed.',
    '- Hover and focus colours, fonts and shadows are not read for theme tokens, and stylesheets from other sites (a CDN)',
    '  do not load, so what they set is not measured.',
    '',
  ];
  return out.join('\n');
}

/** The proposed page: the fragment, with a first line saying where it came from. */
export function fragment({ input, name, result }) {
  return `<!-- Proposed by site-migrate from ${input}: review ${name}.migration.md before using it. -->\n${serialize(result.nodes)}\n`;
}

/**
 * Migrate one file. Returns the page, the proposed token stylesheet, the
 * asset list and the report; writes nothing.
 * @param {string} file
 * @param {{browser?: import('playwright-core').Browser}} [opts]
 */
export async function migrate(file, opts = {}) {
  const abs = realpathSync(resolve(file));
  const registry = await loadRegistry();
  const theme = loadThemeTokens(REPO_ROOT);
  let browser = opts.browser;
  let own = null;
  if (!browser) {
    const { chromium } = await import('playwright-core');
    own = await chromium.launch();
    browser = own;
  }
  try {
    const result = await extract(abs, registry, { browser });
    const name = pageName(abs);
    const input = basename(abs);
    const inputDir = dirname(abs);
    const checks = check(result, registry);
    const tokens = proposeTokens(result.styles, theme);
    const css = tokenCss({ input, name, proposal: tokens });
    const page = fragment({ input, name, result });
    const compliance = await complianceRun({ browser, fragment: page, siteCss: css, inputDir, repoRoot: REPO_ROOT, registry });
    return {
      name,
      input: abs,
      result,
      checks,
      tokens,
      compliance,
      css,
      page,
      assets: assetRows(result.assets, inputDir),
      report: report({ input, name, result, checks, inputDir, tokens, compliance }),
    };
  } finally {
    if (own) await own.close();
  }
}


/**
 * site-migrate v0 (#982): propose a WB Starter page for one existing HTML page.
 *
 * Assisted, not autonomous. It renders the page in a headless browser (static
 * after render: the page's own scripts run, the network does not), maps what
 * it finds onto WB Starter's vocabulary, and lists every change with its
 * reason so a person can review it. What it cannot classify it leaves in
 * place under a TODO comment; it never writes content of its own.
 *
 * Node side: launch the browser, run the extractor (extract.js) in the page,
 * then serialize the proposed fragment, check it, and write the report.
 */
import { existsSync, realpathSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { extractInPage } from './extract.js';

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * The behavior registry: src/core/tag-map.js, read from the checkout this
 * package lives in. v0 runs from a checkout only (it is a private package).
 * @returns {Promise<{nativeMap: Record<string,string>, extensionMap: Record<string,string>, source: string}>}
 */
export async function loadRegistry() {
  const file = resolve(HERE, '..', '..', '..', 'src', 'core', 'tag-map.js');
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
    return await page.evaluate(extractInPage, { nativeMap: registry.nativeMap, extensionMap: registry.extensionMap });
  } finally {
    await context.close();
    if (own) await own.close();
  }
}

// ------------------------------------------------------------------ serializing

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'source', 'track', 'wbr']);
const INLINE = new Set(['a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'button', 'cite', 'code', 'data', 'dfn', 'em', 'i', 'img',
  'input', 'kbd', 'label', 'mark', 'output', 'q', 's', 'samp', 'small', 'span', 'strong', 'sub', 'sup', 'textarea',
  'time', 'u', 'var', 'wbr']);
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
  const TEXT_ATTRS = new Set(['title', 'subtitle', 'author', 'role', 'alt']);
  walk(result.nodes, (n) => {
    if (n.t === 'text' && normText(n.v) && !source.includes(normText(n.v))) bad.invented.push(normText(n.v));
    if (n.t !== 'el') return;
    if (['script', 'style', 'link', 'meta'].includes(n.tag)) bad.tags.push(n.tag);
    if (n.tag in registry.nativeMap) natives.set(n.tag, registry.nativeMap[n.tag]);
    for (const [k, v] of n.attrs) {
      if (k.startsWith('x-')) (k in registry.extensionMap ? xs.add(k) : bad.xUnknown.push(k));
      if (k === 'class' || k === 'style' || k.startsWith('data-') || /^on/.test(k)) bad.attrs.push(`${n.tag}[${k}]`);
      if (TEXT_ATTRS.has(k) && normText(v) && !source.includes(normText(v))) bad.invented.push(`${k}="${v}"`);
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

function assetRows(assets, inputDir) {
  return assets.map((a) => {
    const external = /^[a-z]+:/i.test(a.url) || a.url.startsWith('//');
    const found = external ? 'external: download it or link it' : existsSync(join(inputDir, a.url.split(/[?#]/)[0])) ? 'found' : 'missing next to the source';
    return { ...a, found };
  });
}

/** The review list, as Markdown. */
export function report({ input, name, result, checks, inputDir }) {
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
  const out = [
    `# site-migrate report: ${input}`,
    '',
    `Proposed page: \`pages/${name}.html\`. It is a proposal: review every change below before you use it.`,
    'site-migrate v0 maps one static page onto WB Starter markup. It does not port CSS or scripts, and it never writes',
    'content of its own: what it cannot classify stays in the page, word for word, under a `TODO: unclassified` comment.',
    '',
    '## Summary',
    '',
    `- ${findings.length} changes, each with its reason`,
    `- ${unclassified.length} unclassified region${unclassified.length === 1 ? '' : 's'} for a person to decide`,
    `- ${shell.navigationMenu.length} menu item${shell.navigationMenu.length === 1 ? '' : 's'} and the page title proposed for \`config/site.json\``,
    `- ${rows.length} asset${rows.length === 1 ? '' : 's'} to copy`,
    `- checks: ${checks.ok ? 'all passed' : 'FAILED (nothing written)'}`,
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
    '## Assets',
    '',
    ...(rows.length ? [
      '| Kind | URL | Used by | Status |',
      '|---|---|---|---|',
      ...rows.map((a) => `| ${a.kind} | ${code(a.url)} | ${code(a.usedBy)} | ${a.found} |`),
    ] : ['None.']),
    '',
    '## Checks',
    '',
    ...checks.checks.map((c) => `- ${c.ok ? 'PASS' : 'FAIL'}: ${c.text}`),
    '',
    '## Not done by v0',
    '',
    '- Theme tokens (palette, type scale, spacing) are not extracted from their CSS.',
    '- The proposed page is not yet run through the compliance suite.',
    '- One page at a time; links between pages are not followed.',
    '',
  ];
  return out.join('\n');
}

/** The proposed page: the fragment, with a first line saying where it came from. */
export function fragment({ input, name, result }) {
  return `<!-- Proposed by site-migrate from ${input}: review ${name}.migration.md before using it. -->\n${serialize(result.nodes)}\n`;
}

/**
 * Migrate one file. Returns the page and the report; writes nothing.
 * @param {string} file
 * @param {{browser?: import('playwright-core').Browser}} [opts]
 */
export async function migrate(file, opts = {}) {
  const abs = realpathSync(resolve(file));
  const registry = await loadRegistry();
  const result = await extract(abs, registry, opts);
  const name = pageName(abs);
  const input = basename(abs);
  const checks = check(result, registry);
  return {
    name,
    input: abs,
    result,
    checks,
    page: fragment({ input, name, result }),
    report: report({ input, name, result, checks, inputDir: dirname(abs) }),
  };
}

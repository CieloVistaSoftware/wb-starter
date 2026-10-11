/* global window, document, requestAnimationFrame -- settle() and semanticInPage() run in the browser page. */
/**
 * The compliance run (#1832): load the proposed page into the site shell, in
 * the headless Chromium site-migrate already runs, and measure it with the
 * rules of the specs #982 named.
 *
 * It does not run Playwright test files. It runs the same rule each spec
 * applies, from the module the spec itself imports, so the two cannot drift:
 *
 *   no-data-attributes        scripts/lib/data-attributes.mjs     offenders()
 *   semantic-element-fidelity scripts/lib/semantic-elements.mjs   strictSemanticSchemas()
 *   demo-layout-standards     scripts/lib/layout-checks.mjs       panelPaddingViolations()
 *   no-element-overlap        scripts/lib/layout-checks.mjs       overlapViolations()
 *
 * Every request the shell makes is answered from the checkout (src/, assets/),
 * from the proposal (styles/site.css) or from the folder of the source page
 * (its images); nothing reaches the network.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const ORIGIN = 'http://site-migrate.invalid';
const VIEWPORT = { width: 1280, height: 720 };
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.md': 'text/markdown',
};

export const SPECS = {
  'no-data-attributes': 'tests/compliance/no-data-attributes.spec.ts',
  'semantic-element-fidelity': 'tests/regression/semantic-element-fidelity.spec.ts',
  'demo-layout-standards': 'tests/compliance/demo-layout-standards.spec.ts',
  'no-element-overlap': 'tests/compliance/no-element-overlap.spec.ts',
};

/** A file under `root`, or null: a request can never read outside it. */
function within(root, rel) {
  const file = resolve(root, `.${sep}${rel}`);
  if (file !== root && !file.startsWith(root.endsWith(sep) ? root : root + sep)) return null;
  return existsSync(file) && statSync(file).isFile() ? file : null;
}

/** The index.html a new site starts from: the one package in packages/ with a template/. */
export function siteTemplate(repoRoot) {
  const packages = join(repoRoot, 'packages');
  const found = readdirSync(packages).map((d) => join(packages, d, 'template', 'index.html')).filter((f) => existsSync(f));
  if (found.length !== 1) throw new Error(`expected one site template in ${packages}, found ${found.length}`);
  return found[0];
}

/**
 * The site shell: what a new site's index.html loads (the template of the
 * create package in packages/)
 * (its theme and its stylesheets, the site's own styles/site.css last),
 * around a <main> holding the page, with the runtime started the way the
 * v0 spec starts it.
 */
export function shellHtml(repoRoot, fragment) {
  const template = readFileSync(siteTemplate(repoRoot), 'utf8');
  const theme = (template.match(/<html[^>]*\sdata-theme="([^"]+)"/) || [])[1];
  const sheets = [...template.matchAll(/<link\s+rel="stylesheet"\s+href="([^"]+)"/g)].map((m) => m[1]);
  return `<!DOCTYPE html>
<html lang="en"${theme ? ` data-theme="${theme}"` : ''}>
<head>
<meta charset="utf-8">
<title>site-migrate compliance run</title>
${sheets.map((h) => `<link rel="stylesheet" href="/${h}">`).join('\n')}
</head>
<body>
<main id="migrated">
${fragment}
</main>
<script type="module">
  import WB from '/src/core/wb.js';
  window.__siteMigrateDone = false;
  WB.init({ autoInject: true })
    .then(() => WB.scan(document.body))
    .then(() => WB.settled({ timeout: 10000 }).catch(() => {}))
    .catch((err) => { window.__siteMigrateError = String(err); })
    .finally(() => { window.__siteMigrateDone = true; });
</script>
</body>
</html>
`;
}

/** Read the page the way the layout specs do: scroll it through, then let it finish loading and animating. */
async function settle(page) {
  await page.waitForFunction(() => window.__siteMigrateDone === true, null, { timeout: 30_000 });
  await page.evaluate(async () => {
    const frame = () => new Promise((r) => requestAnimationFrame(() => r()));
    const step = window.innerHeight + 2000;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await frame();
      await frame();
    }
    window.scrollTo(0, 0);
    await frame();
    // A behavior's module and stylesheet load on first use: wait until the
    // resource timeline has stopped growing, every stylesheet has loaded, and
    // every finite animation has ended.
    const count = () => performance.getEntriesByType('resource').length;
    const deadline = Date.now() + 10_000;
    for (let last = -1; Date.now() < deadline && count() !== last;) {
      last = count();
      await new Promise((r) => setTimeout(r, 300));
    }
    for (let i = 0; i < 50 && ![...document.querySelectorAll('link[rel="stylesheet"]')].every((l) => !!l.sheet); i++) await frame();
    await document.fonts.ready;
    for (let round = 0; round < 5; round += 1) {
      const running = document.getAnimations().filter((a) => {
        const timing = a.effect && a.effect.getComputedTiming();
        return !!timing && Number.isFinite(timing.endTime) && a.playState === 'running';
      });
      if (!running.length) break;
      await Promise.all(running.map((a) => a.finished.catch(() => undefined)));
    }
  });
}

/** In the page: every element whose behavior's schema promises a native tag, and whether it delivers it. */
function semanticInPage({ promises, nativeMap, extensionMap }) {
  const out = [];
  for (const el of document.querySelectorAll('#migrated *')) {
    const behaviors = new Set();
    for (const { name } of el.attributes) if (name in extensionMap) behaviors.add(extensionMap[name]);
    for (const [selector, behavior] of Object.entries(nativeMap)) {
      try { if (el.matches(selector)) behaviors.add(behavior); } catch { /* not a selector */ }
    }
    for (const b of behaviors) {
      const tag = promises[b];
      if (!tag) continue;
      const host = el.tagName.toLowerCase();
      out.push({ behavior: b, tag, host, delivered: host === tag || !!el.querySelector(tag) });
    }
  }
  return out;
}

/**
 * Run the four checks against `fragment`. Returns one result per spec:
 * {name, spec, ok, text, details[]}. Writes nothing.
 */
export async function complianceRun({ browser, fragment, siteCss, inputDir, repoRoot, registry }) {
  const [{ offenders, ALLOWED }, { strictSemanticSchemas, STRICT_TAGS }, layout] = await Promise.all([
    import(pathToFileURL(join(repoRoot, 'scripts', 'lib', 'data-attributes.mjs')).href),
    import(pathToFileURL(join(repoRoot, 'scripts', 'lib', 'semantic-elements.mjs')).href),
    import(pathToFileURL(join(repoRoot, 'scripts', 'lib', 'layout-checks.mjs')).href),
  ]);
  const results = [];
  const spec = (name) => `${name} (\`${SPECS[name]}\`)`;

  // no-data-attributes: the spec reads each file as text, so this reads the page as text.
  const data = offenders(fragment, false);
  results.push({
    name: 'no-data-attributes', ok: !data.length, details: data,
    text: `${spec('no-data-attributes')}: ${data.length ? `data-* attributes in the page: ${data.join(', ')}` : `no data-* attributes (the spec allows only ${[...ALLOWED].join(', ')}, which a page does not use)`}`,
  });

  const promises = Object.fromEntries(strictSemanticSchemas(join(repoRoot, 'src', 'wb-models')).map((s) => [s.schemaFor, s.tagName]));
  const context = await browser.newContext({ viewport: VIEWPORT });
  try {
    const page = await context.newPage();
    const shell = shellHtml(repoRoot, fragment);
    await page.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      if (url.origin !== ORIGIN) return route.abort();
      const path = decodeURIComponent(url.pathname).replace(/^\/+/, '');
      if (path === 'index.html') return route.fulfill({ status: 200, contentType: 'text/html', body: shell });
      if (path === 'styles/site.css') return route.fulfill({ status: 200, contentType: 'text/css', body: siteCss });
      const file = /^(src|assets)\//.test(path) ? within(repoRoot, path) : within(inputDir, path);
      if (!file) return route.fulfill({ status: 404, body: '' });
      return route.fulfill({ status: 200, contentType: TYPES[extname(file).toLowerCase()] || 'application/octet-stream', body: readFileSync(file) });
    });
    await page.goto(`${ORIGIN}/index.html`, { waitUntil: 'load' });
    await settle(page);
    const runtimeError = await page.evaluate(() => window.__siteMigrateError || null);
    if (runtimeError) throw new Error(`the WB Starter runtime failed in the site shell: ${runtimeError}`);

    // semantic-element-fidelity
    const sem = await page.evaluate(semanticInPage, { promises, nativeMap: registry.nativeMap, extensionMap: registry.extensionMap });
    const missing = sem.filter((s) => !s.delivered);
    const byTag = [...new Set(sem.map((s) => `${s.behavior} → <${s.tag}>`))].sort();
    const native = sem.filter((s) => s.host === s.tag).length;
    results.push({
      name: 'semantic-element-fidelity', ok: !missing.length, details: missing.map((s) => `<${s.host}> carries ${s.behavior}, which promises <${s.tag}>, and holds none`),
      text: `${spec('semantic-element-fidelity')}: ${!sem.length
        ? `no element's behavior promises one of ${[...STRICT_TAGS].join(', ')}, so there is nothing to check`
        : missing.length
          ? `${missing.length} of ${sem.length} elements do not deliver the native element their schema promises`
          : `all ${sem.length} elements whose schema promises a native element deliver it (${byTag.join(', ')})${native === sem.length ? '; each is that element already, so this holds by construction' : ''}`}`,
    });

    // demo-layout-standards: only the content-panel rule applies to a page without x-demo blocks.
    const demos = await page.locator('[x-demo]').count();
    const panels = await page.evaluate(layout.panelPaddingViolations, { minPad: layout.MIN_TEXT_EDGE_PX, minW: layout.MIN_PANEL_WIDTH, minH: layout.MIN_PANEL_HEIGHT });
    results.push({
      name: 'demo-layout-standards', ok: !panels.length && !demos, details: [...panels, ...(demos ? [`${demos} x-demo block(s): run the spec itself on this page`] : [])],
      text: `${spec('demo-layout-standards')}: ${panels.length ? `${panels.length} content panel(s) hold text within 1rem of their edge` : 'no text within 1rem of a content-panel edge'}. ${demos ? `NOT CHECKED: the page has ${demos} x-demo block(s), and the x-demo rules (§2, §7, §13 spacing) are not run here` : 'Its x-demo rules (§2, §7, §13 spacing) have nothing to measure: the page has no x-demo blocks, which the spec skips too'}`,
    });

    // no-element-overlap
    const overlaps = await page.evaluate(layout.overlapViolations, layout.MIN_OVERLAP_DIM);
    results.push({
      name: 'no-element-overlap', ok: !overlaps.length, details: overlaps,
      text: `${spec('no-element-overlap')}: ${overlaps.length ? `${overlaps.length} pair(s) of painted elements overlap` : 'no two painted elements overlap'}`,
    });
  } finally {
    await context.close();
  }
  return { results, ok: results.every((r) => r.ok), viewport: VIEWPORT };
}

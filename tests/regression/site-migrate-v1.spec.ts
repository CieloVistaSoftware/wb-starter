import { test, expect } from '../fixtures/offline';
import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { extensionMap } from '../../src/core/tag-map.js';
import { extract, loadRegistry, REPO_ROOT } from '../../packages/site-migrate/lib/migrate.js';
import { complianceRun } from '../../packages/site-migrate/lib/compliance.js';

/**
 * site-migrate v1 (#1832): what v0 (#982) left for later.
 *
 *   1. a compliance run of the proposed page in the site shell, with the rules
 *      of semantic-element-fidelity, demo-layout-standards, no-element-overlap
 *      and no-data-attributes, reported in the Checks section;
 *   2. theme tokens (palette, type scale, spacing) measured from the source's
 *      computed styles and proposed as overrides of tokens themes.css defines;
 *   3. --write copies every asset found next to the source into --out;
 *   4. pricing tables, video embeds, tabs and inline SVG icons.
 *
 * The sample for 2-4 is tests/fixtures/site-migrate/lakeside/lakeside-yoga.html;
 * its reviewed output is committed in tests/fixtures/site-migrate/expected/.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const BIN = path.join(ROOT, 'packages', 'site-migrate', 'bin', 'site-migrate.js');
const FIXTURES = path.join(ROOT, 'tests', 'fixtures', 'site-migrate');
const LAKESIDE = path.join(FIXTURES, 'lakeside', 'lakeside-yoga.html');
const RIVERBEND = path.join(FIXTURES, 'riverbend-bakery.html');
const EXPECTED = path.join(FIXTURES, 'expected');
const read = (file: string) => fs.readFileSync(file, 'utf8');

let work: string;
test.beforeEach(() => { work = fs.mkdtempSync(path.join(os.tmpdir(), 'site-migrate-v1-')); });
test.afterEach(() => { fs.rmSync(work, { recursive: true, force: true }); });

const run = (args: string[], cwd = work) => spawnSync(process.execPath, [BIN, ...args], { cwd, encoding: 'utf8', timeout: 90_000 });
// The CLI prints the OS's own separator (out\\images\\... on Windows).
const slashed = (s: string) => s.replace(/\\/g, '/');

test('it proposes the reviewed page, report and theme tokens for the second sample', () => {
  const r = run([LAKESIDE, '--out', 'out', '--write']);
  expect(r.status, r.stderr).toBe(0);
  const out = path.join(work, 'out');
  expect(read(path.join(out, 'pages', 'lakeside-yoga.html'))).toBe(read(path.join(EXPECTED, 'pages', 'lakeside-yoga.html')));
  expect(read(path.join(out, 'lakeside-yoga.migration.md'))).toBe(read(path.join(EXPECTED, 'lakeside-yoga.migration.md')));
  expect(read(path.join(out, 'lakeside-yoga.site.css'))).toBe(read(path.join(EXPECTED, 'lakeside-yoga.site.css')));
  expect(slashed(r.stdout)).toContain('wrote out/lakeside-yoga.site.css');
});

test('the first sample gets its theme tokens too', () => {
  const r = run([RIVERBEND, '--out', 'out', '--write']);
  expect(r.status, r.stderr).toBe(0);
  expect(read(path.join(work, 'out', 'riverbend-bakery.site.css'))).toBe(read(path.join(EXPECTED, 'riverbend-bakery.site.css')));
});

test('--write copies every asset found next to the source, at the same relative path, and nothing else', () => {
  const r = run([LAKESIDE, '--out', 'out', '--write']);
  expect(r.status, r.stderr).toBe(0);
  const src = path.dirname(LAKESIDE);
  const out = path.join(work, 'out');
  for (const rel of ['images/favicon.svg', 'images/lake.svg', 'images/teachers/maya.svg', 'files/timetable.csv']) {
    expect(fs.readFileSync(path.join(out, rel)).equals(fs.readFileSync(path.join(src, rel))), `${rel} is a copy of the source's`).toBe(true);
    expect(slashed(r.stdout)).toContain(`copied out/${rel}`);
  }
  // The missing one is reported, not invented; the stylesheet is not an asset (CSS is not ported).
  expect(fs.existsSync(path.join(out, 'images', 'mat-rack.jpg'))).toBe(false);
  expect(fs.existsSync(path.join(out, 'css'))).toBe(false);
  expect(read(path.join(out, 'lakeside-yoga.migration.md'))).toContain('| `images/mat-rack.jpg` | `body > section#teachers > div.container > p > img` | missing next to the source |');
});

test('an asset whose path leaves the site folder is never written outside --out', () => {
  const site = path.join(work, 'old', 'site');
  fs.mkdirSync(path.join(work, 'old', 'shared'), { recursive: true });
  fs.mkdirSync(site, { recursive: true });
  fs.writeFileSync(path.join(work, 'old', 'shared', 'logo.svg'), '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  fs.writeFileSync(path.join(site, 'about.html'), '<!DOCTYPE html><html><head><title>About</title></head><body><main><p><img src="../shared/logo.svg" alt="Logo"> About us.</p></main></body></html>');
  const out = path.join(work, 'deep', 'out');
  const r = run([path.join(site, 'about.html'), '--out', out, '--write']);
  expect(r.status, r.stderr).toBe(0);
  expect(read(path.join(out, 'about.migration.md'))).toContain('| `../shared/logo.svg` | `body > main > p > img` | found, but its path leaves the site folder: copy it by hand |');
  expect(fs.existsSync(path.join(work, 'deep', 'shared'))).toBe(false);
  expect(fs.readdirSync(out).sort()).toEqual(['about.migration.md', 'about.site.css', 'pages']);
});

test('pricing tables, video embeds, tabs and SVG icons map onto registered behaviors', () => {
  const page = read(path.join(EXPECTED, 'pages', 'lakeside-yoga.html'));
  expect(page).toContain('<article x-cardpricing plan="Drop-in" price="$18" period="/class" features="Any one class, Mat included" cta="Book a class" cta-href="classes.html#book"></article>');
  expect(page).toContain('<article x-cardpricing plan="Monthly" price="$120" period="/month" description="Our most flexible plan." features="Unlimited classes, One guest pass, Locker" cta="Join now" cta-href="join.html" featured></article>');
  // A feature with a comma cannot ride in features="...": that plan stays an ordinary card, word for word.
  expect(page).toContain('<article title="Ten-class pass">');
  expect(page).toContain('<li>Share with family, friends or partners</li>');
  expect(page).toContain('<div x-tabs active-tab="1">');
  expect(page).toContain('<div tab-title="Mornings">');
  expect(page).toContain('<div tab-title="Evenings">');
  expect(page).not.toMatch(/role="tablist"|Mornings<\/button>/);
  expect(page).toContain('<div x-youtube url="https://www.youtube.com/embed/aqz-KE-bpKQ?rel=0"></div>');
  expect(page).toContain('<div x-vimeo video-id="76979871" muted></div>');
  expect(page).not.toContain('<iframe');
  expect(page.match(/<span x-icon><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">/g)).toHaveLength(2);
  // The big drawing is not an icon: it stays, as it is, under a TODO.
  expect(page).toContain('<!-- TODO: unclassified (was an inline svg) -->\n  <svg width="600" height="120" viewBox="0 0 600 120" role="img" aria-label="A drawing of the lake">');
  const xs = new Set((page.replace(/<!--[\s\S]*?-->/g, '').match(/\sx-[a-z-]+/g) || []).map((a) => a.trim()));
  expect([...xs].sort()).toEqual(['x-cardpricing', 'x-grid', 'x-hero', 'x-icon', 'x-tabs', 'x-vimeo', 'x-youtube']);
  for (const a of xs) expect(a in extensionMap, `${a} is in extensionMap`).toBe(true);
  const report = read(path.join(EXPECTED, 'lakeside-yoga.migration.md'));
  expect(report).toContain('A pricing card, but not x-cardpricing: a feature has a comma in it');
  expect(report).toContain('- 1 unclassified region for a person to decide');
});

test('without x-icon in the registry, an SVG icon is kept as it is, and the report says why', async ({ browser }) => {
  const registry = await loadRegistry();
  const withoutIcon = Object.fromEntries(Object.entries(registry.extensionMap).filter(([k]) => k !== 'x-icon'));
  const result: any = await extract(LAKESIDE, { ...registry, extensionMap: withoutIcon }, { browser });
  const html = JSON.stringify(result.nodes);
  expect(html).not.toContain('x-icon');
  const icons = result.findings.filter((f: any) => f.path.endsWith('svg.icon'));
  expect(icons).toHaveLength(2);
  for (const f of icons) {
    expect(f.to).toBe('<svg> (kept as it is)');
    expect(f.why).toContain('The registry has no x-icon, so the SVG is kept as it is');
  }
});

test('the proposed theme tokens are token names themes.css defines, and copy no rule', () => {
  const themes = read(path.join(ROOT, 'src', 'styles', 'themes.css'));
  for (const file of ['lakeside-yoga.site.css', 'riverbend-bakery.site.css']) {
    const css = read(path.join(EXPECTED, file)).replace(/\/\*[\s\S]*?\*\//g, '');
    const decls = [...css.matchAll(/^\s*([^\s:{}]+)\s*:\s*([^;]+);/gm)];
    expect(decls.length).toBeGreaterThan(0);
    for (const [, name] of decls) {
      expect(name, `${file}: only custom properties`).toMatch(/^--/);
      expect(themes, `${file}: ${name} is a token src/styles/themes.css defines`).toContain(`${name}:`);
    }
    // One rule, the token block: none of the source's selectors.
    expect(css.match(/\{/g)).toHaveLength(1);
    expect(css).toContain(':root, [data-theme] {');
  }
  const lake = read(path.join(EXPECTED, 'lakeside-yoga.site.css'));
  // From css/studio.css as rendered: palette, type scale, spacing.
  for (const decl of ['--bg-color: #fbfaf7;', '--text-primary: #1f2d3d;', '--text-muted: #6b7a89;', '--primary: #2a7d6f;',
    '--bg-secondary: #eef4f2;', '--border-color: #d5dfdc;', '--text-base: 1.0625rem;', '--text-3xl: 2.75rem;',
    '--space-md: 1rem;', '--space-2xl: 3rem;']) expect(lake).toContain(decl);
  // Riverbend's stylesheets do not load (a CDN, a missing file), so the browser's
  // blue links and black text are not proposed as its palette.
  const river = read(path.join(EXPECTED, 'riverbend-bakery.site.css'));
  expect(river).not.toMatch(/--primary:|--text-primary:|#0000ee/);
  expect(read(path.join(EXPECTED, 'riverbend-bakery.migration.md'))).toContain('- --primary: the source gives no button or link a colour of its own');
});

test('the report holds the compliance run for each spec #982 named', () => {
  for (const file of ['lakeside-yoga.migration.md', 'riverbend-bakery.migration.md']) {
    const report = read(path.join(EXPECTED, file));
    const checks = report.slice(report.indexOf('## Checks'));
    expect(checks).toContain('### Compliance run');
    for (const [name, spec] of [
      ['no-data-attributes', 'tests/compliance/no-data-attributes.spec.ts'],
      ['semantic-element-fidelity', 'tests/regression/semantic-element-fidelity.spec.ts'],
      ['demo-layout-standards', 'tests/compliance/demo-layout-standards.spec.ts'],
      ['no-element-overlap', 'tests/compliance/no-element-overlap.spec.ts'],
    ]) {
      expect(checks).toContain(`- PASS: ${name} (\`${spec}\`)`);
      expect(fs.existsSync(path.join(ROOT, spec)), `${spec} exists`).toBe(true);
    }
    expect(report).toContain('- compliance run: 4 of 4 passed');
    expect(report).not.toContain('Not done by v0');
  }
  expect(read(path.join(EXPECTED, 'riverbend-bakery.migration.md'))).toContain('all 3 elements whose schema promises a native element deliver it (details → <details>, table → <table>)');
});

test('the compliance run catches what each spec catches', async ({ browser }) => {
  const registry = await loadRegistry();
  const fragment = `<p data-track="hero">Tracked</p>
<span x-table>Not a table</span>
<div style="background:#ddd;padding:2px;width:400px;height:60px">Cramped panel text</div>
<div style="background:#c00;width:300px;height:80px"></div>
<div style="background:#00c;width:300px;height:80px;margin-top:-40px;position:relative"></div>`;
  const run: any = await complianceRun({ browser, fragment, siteCss: '', inputDir: work, repoRoot: REPO_ROOT, registry });
  const by = Object.fromEntries(run.results.map((r: any) => [r.name, r]));
  expect(run.ok).toBe(false);
  expect(by['no-data-attributes'].details).toEqual(['data-track']);
  expect(by['semantic-element-fidelity'].details).toEqual(['<span> carries table, which promises <table>, and holds none']);
  expect(by['demo-layout-standards'].details).toEqual(['<div class=""> "Cramped panel text" has 2px padding on its tightest side < 16px']);
  expect(by['no-element-overlap'].details).toHaveLength(1);
  expect(by['no-element-overlap'].details[0]).toMatch(/^<div> "" overlaps <div> "" \(300x40px/);
});

test('the proposed page runs on WB Starter: pricing cards, tabs, players and icons', async ({ page }) => {
  // Missing sample images are not what this checks.
  const fragment = read(path.join(EXPECTED, 'pages', 'lakeside-yoga.html')).replace(/\ssrc="images\/[^"]+"/g, '');
  await page.goto('/tests/fixtures/blank.html');
  await page.setContent(`
    <link rel="stylesheet" href="/src/styles/normalize.css">
    <link rel="stylesheet" href="/src/styles/themes.css">
    <link rel="stylesheet" href="/src/styles/site.css">
    <main id="migrated">${fragment}</main>
    <script type="module">
      import WB from '/src/core/wb.js';
      window.__wbDone = false;
      WB.init({ autoInject: true }).then(() => WB.scan(document.body)).then(() => WB.settled({ timeout: 10000 }).catch(() => {})).then(() => { window.__wbDone = true; });
    </script>
  `);
  await page.waitForFunction(() => (window as any).__wbDone === true, { timeout: 15000 });

  const plans = page.locator('#pricing [x-cardpricing]');
  await expect(plans).toHaveCount(2);
  await expect(plans.first().locator('.x-card__plan')).toHaveText('Drop-in');
  await expect(plans.first().locator('.x-card__amount')).toHaveText('$18');
  await expect(plans.first().locator('.x-card__period')).toHaveText('/class');
  await expect(plans.first().locator('.x-card__feature')).toHaveCount(2);
  await expect(plans.nth(1)).toHaveClass(/x-cardpricing--featured/);
  await expect(plans.nth(1).locator('.x-card__description')).toHaveText('Our most flexible plan.');

  const tabs = page.locator('#schedule .x-tabs__tab');
  await expect(tabs).toHaveText(['Mornings', 'Evenings']);
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#schedule .x-tabs__panel--active')).toContainText('Vinyasa at 6:00');
  await tabs.first().click();
  await expect(page.locator('#schedule .x-tabs__panel--active')).toContainText('Sunrise flow at 6:30');

  await expect(page.locator('[x-youtube]')).toHaveClass(/\bx-youtube\b/);
  await expect(page.locator('[x-vimeo] iframe')).toHaveAttribute('src', /player\.vimeo\.com\/video\/76979871\?.*muted=1/);
  const icons = page.locator('#why [x-icon] svg.x-icon__svg');
  await expect(icons).toHaveCount(2);
  const size = await icons.first().evaluate((svg) => getComputedStyle(svg).width === getComputedStyle(svg.parentElement!).fontSize);
  expect(size, 'x-icon draws the SVG at the size of the text beside it').toBe(true);
});

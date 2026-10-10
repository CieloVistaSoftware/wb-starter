import { test, expect } from '../fixtures/offline';
import { spawnSync } from 'child_process';
import { createHash } from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { extensionMap, nativeMap } from '../../src/core/tag-map.js';
import { extract, loadRegistry } from '../../packages/site-migrate/lib/migrate.js';

/**
 * site-migrate v0 (#982): a CLI that proposes a WB Starter page for one existing
 * page. Assisted, not autonomous: it lists every change with its reason, and
 * writes only with --write, never over its input.
 *
 * The issue's own next step: "prototype the extractor against one real page
 * (single page, static after render) and look at what it outputs". That page
 * is tests/fixtures/site-migrate/riverbend-bakery.html, an ordinary Bootstrap
 * brochure page; what it output, reviewed, is committed beside it in expected/.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const BIN = path.join(ROOT, 'packages', 'site-migrate', 'bin', 'site-migrate.js');
const FIXTURES = path.join(ROOT, 'tests', 'fixtures', 'site-migrate');
const INPUT = path.join(FIXTURES, 'riverbend-bakery.html');
const EXPECTED_PAGE = path.join(FIXTURES, 'expected', 'pages', 'riverbend-bakery.html');
const EXPECTED_REPORT = path.join(FIXTURES, 'expected', 'riverbend-bakery.migration.md');

let work: string;
test.beforeEach(() => { work = fs.mkdtempSync(path.join(os.tmpdir(), 'site-migrate-')); });
test.afterEach(() => { fs.rmSync(work, { recursive: true, force: true }); });

const run = (args: string[], cwd = work) => spawnSync(process.execPath, [BIN, ...args], { cwd, encoding: 'utf8', timeout: 60_000 });
const sha = (file: string) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');

test('it proposes the reviewed page and report for the sample page', () => {
  const before = sha(INPUT);
  const r = run([INPUT, '--out', 'out', '--write']);
  expect(r.status, r.stderr).toBe(0);
  expect(r.stdout).toContain('wrote out/pages/riverbend-bakery.html');
  expect(fs.readFileSync(path.join(work, 'out', 'pages', 'riverbend-bakery.html'), 'utf8')).toBe(fs.readFileSync(EXPECTED_PAGE, 'utf8'));
  expect(fs.readFileSync(path.join(work, 'out', 'riverbend-bakery.migration.md'), 'utf8')).toBe(fs.readFileSync(EXPECTED_REPORT, 'utf8'));
  expect(sha(INPUT), 'the input is never changed').toBe(before);
});

test('without --write it prints the report and the page, and writes nothing', () => {
  const r = run([INPUT]);
  expect(r.status, r.stderr).toBe(0);
  expect(r.stdout).toContain('# site-migrate report: riverbend-bakery.html');
  expect(r.stdout).toContain(fs.readFileSync(EXPECTED_PAGE, 'utf8'));
  expect(r.stdout).toContain('Nothing was written.');
  expect(fs.readdirSync(work)).toEqual([]);
});

test('it refuses to write over its input', () => {
  // The input sits where --write would put the proposed page.
  const pages = path.join(work, 'site', 'pages');
  fs.mkdirSync(pages, { recursive: true });
  const input = path.join(pages, 'riverbend-bakery.html');
  fs.copyFileSync(INPUT, input);
  const r = run([input, '--out', path.join(work, 'site'), '--write']);
  expect(r.status).toBe(1);
  expect(r.stderr).toContain('would overwrite the input');
  expect(sha(input)).toBe(sha(INPUT));
  expect(fs.existsSync(path.join(work, 'site', 'riverbend-bakery.migration.md'))).toBe(false);
});

test('every change is listed with its reason, and every unclassified region is marked in the page', () => {
  const report = fs.readFileSync(EXPECTED_REPORT, 'utf8');
  const page = fs.readFileSync(EXPECTED_PAGE, 'utf8');
  const changes = report.split('\n').filter((l) => /^\d+\. `/.test(l));
  const whys = report.split('\n').filter((l) => /^ {3}- Why: \S/.test(l));
  expect(changes.length).toBeGreaterThan(20);
  expect(whys.length, 'one reason per change').toBe(changes.length);
  expect(report).toContain(`- ${changes.length} changes, each with its reason`);
  // The two body regions it could not classify are in the page under a TODO;
  // the footer's street address is listed for a person to place.
  expect(page.match(/<!-- TODO: unclassified/g)).toHaveLength(2);
  expect(report).toContain('| Free delivery on Fridays within five miles. |');
  expect(report).toContain('| Open the map to 12 Mill Lane |');
  expect(report).toContain('| 12 Mill Lane, Riverbend |');
});

test('the proposed page uses only registered behaviors, ports no CSS or scripts, and invents nothing', () => {
  const page = fs.readFileSync(EXPECTED_PAGE, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const tags = page.match(/<[a-z][^>]*>/g) || [];
  const xAttrs = new Set(tags.flatMap((t) => t.match(/\sx-[a-z-]+/g) || []).map((a) => a.trim()));
  expect([...xAttrs].sort()).toEqual(['x-cardtestimonial', 'x-grid', 'x-hero']);
  for (const a of xAttrs) expect(a in extensionMap, `${a} is in extensionMap`).toBe(true);
  for (const t of ['article', 'details', 'figure']) {
    expect(t in nativeMap, `<${t}> auto-injects`).toBe(true);
    expect(page).toContain(`<${t}`);
  }
  expect(page).not.toMatch(/\s(class|style|data-[\w-]+|on[a-z]+)=/);
  expect(page).not.toMatch(/<(script|style|link|meta|nav|footer|html|head|body)\b/);

  // Every run of text in the page is in the source page, word for word.
  const words = (html: string) => html.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, '\n')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&copy;/g, '©')
    .split('\n').map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const source = words(fs.readFileSync(INPUT, 'utf8')).join(' ');
  for (const w of words(page)) expect(source, `"${w}" is not in the source`).toContain(w);
  for (const [, v] of page.matchAll(/\s(?:title|subtitle|author|role)="([^"]*)"/g)) expect(source).toContain(v);
});

test('the rules refuse an x-* attribute the registry does not have', async ({ browser }) => {
  const registry = await loadRegistry();
  const withoutHero = Object.fromEntries(Object.entries(registry.extensionMap).filter(([k]) => k !== 'x-hero'));
  await expect(extract(INPUT, { ...registry, extensionMap: withoutHero }, { browser }))
    .rejects.toThrow('site-migrate rule asked for x-hero, which is not in extensionMap');
});

test('the proposed page runs on WB Starter: cards, testimonial, hero, grid and details', async ({ page }) => {
  // Missing sample images are not what this checks.
  const fragment = fs.readFileSync(EXPECTED_PAGE, 'utf8').replace(/\s(src|avatar)="images\/[^"]+"/g, '');
  await page.goto('/tests/fixtures/blank.html');
  // The stylesheets a created site's index.html loads (packages/create-wb-starter).
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

  await expect(page.locator('section[x-hero]')).toHaveClass(/\bx-hero\b/);
  const grid = page.locator('#bread [x-grid]');
  await expect(grid).toHaveCSS('display', 'grid');
  // Each <article> became a card: it built a header from title and subtitle.
  await expect(page.locator('#bread article > header')).toHaveCount(3);
  await expect(page.locator('#bread article > header h3').first()).toHaveText('Country sourdough');
  await expect(page.locator('#bread article > header p').first()).toHaveText('48-hour ferment');
  await expect(page.locator('#bread article > .x-card__body').first()).toContainText('A crackling crust and an open, tangy crumb.');
  // The testimonial card built its quote, stars and attribution.
  const quote = page.locator('#reviews article[x-cardtestimonial]');
  await expect(quote.locator('blockquote.x-card__quote')).toHaveText("The rye is the best I have had outside my grandmother's kitchen.");
  await expect(quote.locator('.x-card__rating')).toHaveText('★★★★★');
  await expect(quote.locator('cite.x-card__author')).toHaveText('Ana Ruiz');
  await expect(quote.locator('.x-card__author-role')).toHaveText('Regular since 2019');
  await expect(page.locator('#faq details').first()).toHaveAttribute('open', '');
  await page.locator('#faq details summary').nth(1).click();
  await expect(page.locator('#faq details').nth(1)).toHaveAttribute('open', '');
  await expect(page.locator('#faq details').nth(1)).toContainText('Not yet. Our kitchen uses wheat flour all day');
});

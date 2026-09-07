/**
 * SITE SMOKE TEST
 * ===============
 * Does the site actually boot, on the routes people use?
 *
 * #990: the site went completely dead (#988) and JOHN found it, not a test.
 * The deploy that broke it was "verified" by grepping the served HTML for a
 * flag string. The HTML was fine. The JavaScript was not, and nothing ever
 * loaded the page.
 *
 * The failure mode this exists to catch: a module-level SyntaxError anywhere
 * in the graph stops the whole app booting, and what a visitor sees is the
 * literal text "Loading..." forever. The HTML is served, the CSS is served,
 * every asset returns 200 — and the site is dead. Nothing that inspects
 * responses can see it. You have to run the page.
 *
 * Points at the local server by default. Set SMOKE_BASE_URL to run the exact
 * same assertions against the deployed origin AFTER a push:
 *
 *   SMOKE_BASE_URL=https://cielovistasoftware.github.io/wb-starter/ \
 *     npx playwright test site-smoke --project=compliance
 */

import { test, expect, type ConsoleMessage } from '@playwright/test';
import { readFileSync } from 'node:fs';

const BASE = process.env.SMOKE_BASE_URL?.replace(/\/$/, '') || '';

/** Routes a visitor actually lands on. Kept short — this must stay fast. */
const ROUTES = [
  { name: 'home', path: '/' },
  { name: 'behaviors', path: '/?page=behaviors' },
  { name: 'demos', path: '/?page=demos' },
  { name: "what's new", path: '/?page=whats-new' },
  { name: 'cards demo', path: '/demos/site/cards.html' },
];

/**
 * Errors that are noise, not a broken site. Deliberately narrow — anything not
 * listed here fails the build. A dead module graph must never be excusable.
 */
const IGNORABLE = [
  /favicon/i,
  /net::ERR_(ABORTED|BLOCKED_BY_CLIENT)/i,
  /Failed to load resource.*\b404\b.*\.(png|jpg|svg|ico|woff2?)/i,
];

const isFatal = (text: string) => !IGNORABLE.some((re) => re.test(text));

test.describe('site smoke', () => {
  for (const route of ROUTES) {
    test(`${route.name} boots with no console errors`, async ({ page }) => {
      const errors: string[] = [];

      page.on('console', (m: ConsoleMessage) => {
        if (m.type() === 'error' && isFatal(m.text())) errors.push(m.text());
      });
      // An uncaught module-level SyntaxError surfaces here, not on 'console'.
      page.on('pageerror', (e) => {
        if (isFatal(String(e))) errors.push(String(e));
      });

      await page.goto(BASE + route.path, { waitUntil: 'domcontentloaded' });

      // The app replaces the placeholder once the module graph completes. If it
      // never does, this is the exact text left on screen.
      await expect
        .poll(() => page.locator('body').innerText().catch(() => ''), {
          timeout: 15_000,
          message: `${route.name} never finished booting — still showing the loading placeholder`,
        })
        .not.toMatch(/^\s*Loading\.{3}\s*$/);

      const body = (await page.locator('body').innerText()).trim();
      expect(body.length, `${route.name} rendered an empty body`).toBeGreaterThan(50);

      expect(
        errors,
        errors.length
          ? `\n${route.name} (${BASE + route.path}) logged ${errors.length} error(s):\n` +
              errors.map((e) => `  ${e}`).join('\n') +
              `\n\nA module-level error here means the site does not boot at all.\n`
          : ''
      ).toEqual([]);
    });
  }

  test('the deployed version matches package.json', async ({ page }) => {
    // Guards the mismatch John hit: What's New said 4.0.1 while the navbar
    // still read v4.0.0, because the entry shipped and the version never moved.
    //
    // THIS COMPARED THE DEPLOY TO ITSELF. It fetched `BASE + '/package.json'` —
    // the package.json from the DEPLOYED build — and compared it against that
    // same build's version.js. Two values from one build always agree, so the
    // check could not fail, and if the site served no package.json it degraded
    // to `toBeTruthy()`, which is weaker still.
    //
    // Measured 2026-09-07: it PASSED while the deployed site served 4.0.1 and
    // the repo was at 4.0.2 — GitHub Pages had not rebuilt since 2026-09-03, so
    // the release was reported live for hours while the old build was serving.
    // The one gate Law 17 relies on confirmed a deploy that had not happened.
    //
    // The comparison that means something is deployed-vs-LOCAL: the version in
    // this working tree is the one being released, and it is not fetched from
    // the thing under test.
    const declared = JSON.parse(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
    ).version;
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });

    const shown = await page.evaluate(async () => {
      // Resolve against the PAGE, not the origin root: deployed, the site lives
      // under /wb-starter/, so an absolute '/src/...' is a 404 and this test
      // fails claiming the site is broken when it is fine.
      const href = new URL('./src/core/version.js', location.href).href;
      const m = await import(href).catch(() => null as any);
      return m?.VERSION?.version ?? null;
    });

    expect(shown, 'the deployed site served no version at all').toBeTruthy();
    expect(
      shown,
      `The deployed site is serving ${shown}, but this tree is at ${declared}.\n` +
      'Either the push did not deploy, or Pages has not rebuilt yet. Check:\n' +
      '  gh api repos/CieloVistaSoftware/wb-starter/pages/builds/latest\n' +
      'and force one with:\n' +
      '  gh api -X POST repos/CieloVistaSoftware/wb-starter/pages/builds\n' +
      'A green smoke against a stale build is the exact failure Law 17 exists to stop.',
    ).toBe(declared);
  });
});

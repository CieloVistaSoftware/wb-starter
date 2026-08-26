import { test, expect } from '@playwright/test';
import { readJson, safeScrollIntoView } from '../base';
import * as path from 'path';

/**
 * Phase 4: Multi-Page Site Generation Tests
 * ==========================================
 * Data-driven from data/site-generator-result.json
 * Validates:
 *   1. Index page loads with all category cards
 *   2. Each category page loads, has correct x-demo sections
 *   3. Components render inside x-demo containers
 *   4. No critical JS errors
 *   5. Back-to-index navigation works
 */

const SITE_DIR = '/demos/site';

interface SiteResult {
  summary: {
    totalPages: number;
    generated: number;
    totalComponents: number;
    totalSections: number;
    totalDemos: number;
  };
  pages: Array<{
    id: string;
    title: string;
    description?: string;
    icon?: string;
    status: string;
    filename: string;
    componentCount?: number;
    sectionCount?: number;
    totalDemos?: number;
    components?: Array<{
      name: string;
      status: string;
      sections: number;
      demos: number;
    }>;
  }>;
}

// Load build results — tests skip gracefully if site hasn't been generated
const resultPath = path.join(process.cwd(), 'data', 'site-generator-result.json');
const siteResult = readJson<SiteResult>(resultPath);

test.describe('Site Generation — Phase 4', () => {

  // #822: the guard used to be `!siteResult` alone, which only catches a
  // MISSING file. data/site-generator-result.json sat in the repo with every
  // count at zero, so the guard passed and the suite then asserted "0 pages"
  // against a real index page reading "8 pages · 70 components · 767 demos".
  // A stale artifact read as a product bug, and it blocked every commit.
  //
  // An empty result is not a reason to assert zeros — it means the artifact
  // was never regenerated, which is a different thing from the site not
  // having been generated at all. Both now skip, and both say what to run.
  test.skip(
    !siteResult || !siteResult.summary?.generated,
    'data/site-generator-result.json is missing or empty — run: '
    + 'node scripts/generate-site.mjs src/wb-models/pages/x-component-library.site.json',
  );

  // ─── Index Page ───

  test.describe('Index Page', () => {

    test('loads and displays site title', async ({ page }) => {
      await page.goto(`${SITE_DIR}/index.html`);
      await expect(page.locator('h1')).toContainText('WB Component Library');
    });

    test('shows correct stats', async ({ page }) => {
      await page.goto(`${SITE_DIR}/index.html`);
      const stats = page.locator('.site-stats');
      await expect(stats).toBeVisible();

      const text = await stats.textContent();
      // Should contain page count and demo count
      expect(text).toContain(`${siteResult!.summary.generated} pages`);
      expect(text).toContain(`${siteResult!.summary.totalDemos} demos`);
    });

    test('has a card for each generated page', async ({ page }) => {
      await page.goto(`${SITE_DIR}/index.html`);
      const cards = page.locator('.page-card');
      const okPages = siteResult!.pages.filter(p => p.status === 'ok');
      await expect(cards).toHaveCount(okPages.length);
    });

    test('each card links to the correct page', async ({ page }) => {
      await page.goto(`${SITE_DIR}/index.html`);
      const okPages = siteResult!.pages.filter(p => p.status === 'ok');

      for (const pg of okPages) {
        const link = page.locator(`.page-card a[href="${pg.filename}"]`);
        await expect(link).toBeVisible();
      }
    });

    test('no critical console errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', err => errors.push(err.message));

      await page.goto(`${SITE_DIR}/index.html`);
      await page.waitForTimeout(1000);

      const critical = errors.filter(e =>
        !e.includes('favicon') && !e.includes('404')
      );
      expect(critical, `Console errors: ${critical.join(', ')}`).toHaveLength(0);
    });
  });

  // ─── Category Pages (data-driven) ───

  const okPages = siteResult?.pages.filter(p => p.status === 'ok') || [];

  for (const pg of okPages) {

    test.describe(`${pg.icon || '📦'} ${pg.title} (${pg.id})`, () => {

      test('page loads with correct heading', async ({ page }) => {
        await page.goto(`${SITE_DIR}/${pg.filename}`);
        // The page's OWN heading, not any <h1>. content.html demos heading
        // behaviors, so a second <h1> appears at runtime once the demos
        // render and a bare `h1` locator hits a strict-mode violation (#837).
        const h1 = page.locator('h1').first();
        await expect(h1).toBeVisible();
        // Heading includes icon + title
        await expect(h1).toContainText(pg.title);
      });

      test('has back-to-index link', async ({ page }) => {
        await page.goto(`${SITE_DIR}/${pg.filename}`);
        const backLink = page.locator('a[href="index.html"]');
        await expect(backLink).toBeVisible();
      });

      test(`has [x-demo] sections`, async ({ page }) => {
        await page.goto(`${SITE_DIR}/${pg.filename}`);
        const demos = page.locator('[x-demo]');
        const count = await demos.count();
        // Should have at least 1 x-demo per page
        expect(count).toBeGreaterThan(0);
        // #837: this used to assert `count <= sectionCount`, which had the
        // generator backwards. #538/#563 made it emit one demo host PER
        // INSTANCE rather than one per section -- deliberately, so a section
        // sweeping enum variants does not bundle them into a single shared
        // code sample (the permutation-matrix anti-pattern). cards has 66
        // sections and 293 hosts, so the old bound could never hold. It never
        // failed only because the whole suite was skipping on a zeroed
        // data/site-generator-result.json.
        //
        // The invariant runs the other way: every section must render at
        // least one demo host. That is the thing worth catching -- a section
        // that generated nothing at all.
        if (pg.sectionCount) {
          expect(count, `${pg.id}: ${pg.sectionCount} sections produced only ${count} demo hosts`)
            .toBeGreaterThanOrEqual(pg.sectionCount);
        }
      });

      test('[x-demo] containers have child elements', async ({ page }) => {
        await page.goto(`${SITE_DIR}/${pg.filename}`);
        // Wait for WB init
        await page.waitForFunction(() => (window as any).WB, null, { timeout: 10000 }).catch(() => {});

        // Wait for at least one x-demo to finish init (demo() adds a .x-demo__grid child — #447 removed the redundant .x-demo class)
        await page.waitForSelector('[x-demo] .x-demo__grid', { timeout: 10000 }).catch(() => {});

        const demos = page.locator('[x-demo]:has(.x-demo__grid)');
        const count = await demos.count();
        let emptyCount = 0;

        // Spot-check first 5 initialized demos
        const checkCount = Math.min(count, 5);
        for (let i = 0; i < checkCount; i++) {
          const demo = demos.nth(i);
          await safeScrollIntoView(demo);
          // After demo() completes, x-demo has .x-demo__grid + <pre> children
          const hasGrid = await demo.locator('.x-demo__grid').count();
          if (hasGrid === 0) emptyCount++;
        }

        // At least 1 demo should have rendered
        expect(count, 'No initialized [x-demo] found — demo() may not have run').toBeGreaterThan(0);
        // Allow some empty (edge cases), but not all
        expect(emptyCount, `${emptyCount}/${checkCount} demos were empty`).toBeLessThan(checkCount);
      });

      // Per-component spot checks for pages with component data
      if (pg.components && pg.components.length > 0) {
        const okComponents = pg.components.filter(c => c.status === 'ok');

        test(`has a host for each of ${okComponents.length} behaviors`, async ({ page }) => {
          await page.goto(`${SITE_DIR}/${pg.filename}`);
          await page.waitForFunction(() => (window as any).WB, null, { timeout: 10000 }).catch(() => {});

          let foundCount = 0;
          for (const comp of okComponents) {
            // Components are gone: a behavior is an x- attribute on a neutral host,
              // so search for the attribute, not a <wb-*> tag that no longer exists.
              const elements = page.locator(`[x-${comp.name}]`);
            const elCount = await elements.count();
            if (elCount > 0) foundCount++;
          }

          // Most components should be present — allow a few missing
          // (some components might share a tag, e.g. drawerLayout → x-drawerlayout)
          const threshold = Math.max(1, Math.floor(okComponents.length * 0.6));
          expect(foundCount, `Only ${foundCount}/${okComponents.length} behavior hosts found`).toBeGreaterThanOrEqual(threshold);
        });
      }

      test('no critical page errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', err => errors.push(err.message));

        await page.goto(`${SITE_DIR}/${pg.filename}`);
        await page.waitForFunction(() => (window as any).WB, null, { timeout: 10000 }).catch(() => {});
        await page.waitForTimeout(500);

        const critical = errors.filter(e =>
          !e.includes('favicon') &&
          !e.includes('404') &&
          !e.includes('net::ERR') // network errors for missing assets like images
        );
        // Log but don't fail on non-critical errors
        if (critical.length > 0) {
          console.warn(`  ⚠️ ${pg.id}: ${critical.length} errors — ${critical[0].substring(0, 80)}`);
        }
        // Fail only if excessive
        expect(critical.length, `Too many errors on ${pg.id}: ${critical.join('\n')}`).toBeLessThan(10);
      });
    });
  }

  // ─── Cross-page Navigation ───

  test.describe('Cross-page Navigation', () => {

    test('can navigate from index to each page and back', async ({ page }) => {
      await page.goto(`${SITE_DIR}/index.html`);

      // Pick first 3 pages for speed
      const testPages = okPages.slice(0, 3);

      for (const pg of testPages) {
        // Click card link
        await page.locator(`.page-card a[href="${pg.filename}"]`).click();
        await expect(page.locator('h1')).toContainText(pg.title);

        // Click back link
        await page.locator('a[href="index.html"]').click();
        await expect(page.locator('h1')).toContainText('WB Component Library');
      }
    });
  });

  // ─── Build Integrity ───

  test.describe('Build Integrity', () => {

    test('site-generator-result.json has no errors', () => {
      const errPages = siteResult!.pages.filter(p => p.status === 'error');
      expect(errPages, `Failed pages: ${errPages.map(p => p.id).join(', ')}`).toHaveLength(0);
    });

    test('all pages in site schema were generated', () => {
      expect(siteResult!.summary.generated).toBe(siteResult!.summary.totalPages);
    });

    test('demo count matches expected', () => {
      // Verify the sum of page demos equals the total
      const sumDemos = siteResult!.pages.reduce((s, p) => s + (p.totalDemos || 0), 0);
      expect(sumDemos).toBe(siteResult!.summary.totalDemos);
    });
  });
});

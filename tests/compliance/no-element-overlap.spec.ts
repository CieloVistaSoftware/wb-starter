import { test, expect } from '../fixtures/offline';
import { globSync } from 'glob';

import { settlePage } from '../base';
import { overlapViolations, MIN_OVERLAP_DIM } from '../../scripts/lib/layout-checks.mjs';
/**
 * Standard §22 (new) — GitHub #274: "Elements must never visually overlap
 * unless intentionally layered." Scope matches demo-layout-standards.spec.ts's
 * own convention: every file under demos/**\/*.html and pages/**\/*.html.
 *
 * Originally spotted on pages/behaviors.html: the hero subtitle rendered
 * under/through the category-pills box. A first attempt at this test
 * (issue #274 comment, 2026-07-10) used a naive AABB (bounding-box)
 * intersection check across every element and found it produced false
 * positives that couldn't be allow-listed away cleanly, e.g.:
 *   - a page-container div "overlapping" the footer purely because its
 *     geometric box (sized for a flex-grow footer-push layout) extends into
 *     that region even though nothing is actually drawn there;
 *   - a resize-handle that's *supposed* to sit exactly on a boundary.
 * Both of those false positives came from treating every DOM node as a
 * paint candidate, when most nodes are pure layout wrappers that render
 * nothing of their own. This version fixes that by only comparing elements
 * that actually PAINT something visible of their own (background, border,
 * shadow, replaced media, or their own direct text) — a pure wrapper <div>
 * with no background/border/text can never visually occlude anything, so it
 * is excluded from the candidate set entirely (not just tolerated via a
 * bigger allow-list). Text-only elements (no background/border/shadow) use
 * the tight bounding box of their own actual text runs (via Range), not
 * their full block box, so a wide paragraph whose text only fills part of
 * its line doesn't "overlap" something sitting in the empty part of that
 * line.
 *
 * Intentional-layering exclusions:
 *   - position: fixed / position: sticky (headers, toasts, drawers, notes,
 *     mobile nav, backdrops — grep of src/styles confirms these are the
 *     only positioning scheme real overlays in this codebase use for
 *     document.body-appended overlays).
 *   - Known overlay/decoration classes (grepped from src/wb-viewmodels/
 *     tooltip.js, overlay.js and src/styles/behaviors/{dropdown,modal,
 *     popover,toast,dialog,drawer}.css, plus x-signature.css's glass
 *     variants) — these are position:absolute (not fixed), so the
 *     position check alone wouldn't catch them.
 *   - The `data-allow-overlap` escape hatch (on either element in the
 *     pair) for any other deliberate, verified-by-eye overlap (e.g. a
 *     decorative badge) that isn't already covered above.
 *   - DOM ancestor/descendant pairs — a parent can never meaningfully
 *     "collide" with its own content, however that content is positioned.
 */

// posix: forward slashes on every OS -- the file becomes part of each test's
// NAME, and a name must be the same test on Windows and on CI.
const FILES = [
  ...globSync('demos/**/*.html', { cwd: process.cwd(), posix: true }),
  ...globSync('pages/**/*.html', { cwd: process.cwd(), posix: true }),
].sort();

// MIN_OVERLAP_DIM (scripts/lib/layout-checks.mjs): the minimum overlap width
// AND height (px) to count as a real visual collision, not sub-pixel rounding
// noise at a shared/adjacent edge (e.g. collapsed table borders, hairline
// flex-item seams).

test.describe('No element overlap (§22) — project-wide detection', () => {
  for (const file of FILES) {
    test(`${file}: no unintentional element overlap`, async ({ page }) => {
      const urlPath = '/' + file.replace(/\\/g, '/');
      const errs: string[] = [];
      page.on('pageerror', (e) => errs.push(String(e)));

      // networkidle (not domcontentloaded) -- under concurrent-worker load
      // (many tests hitting the shared dev server at once), slow image
      // fetches finish AFTER the fixed settle timeout below, so an overlay
      // positioned against an image (e.g. x-card__overlay on a still-
      // loading card image) gets measured mid-layout-shift. Confirmed via
      // repeated runs: flaked only under full-suite concurrency, passed
      // every time in isolation -- a load-timing race, not a real defect.
      const response = await page.goto(urlPath, { waitUntil: 'networkidle' });

      // #863: the overlap sweep below can only report what it finds, and a page
      // that 404s has nothing to find -- page.goto() does NOT throw on a 404, so
      // a renamed or deleted file here produced an empty `violations` array and
      // a green test forever. Assert the page actually loaded before trusting a
      // clean sweep.
      expect(
        response?.status(),
        `${urlPath} did not load (status ${response?.status()}) -- a 404 makes `
        + 'the overlap sweep below pass vacuously, since there is nothing on the '
        + 'page to overlap.',
      ).toBeLessThan(400);

      // #1306: settle on SIGNALS, not on elapsed time. A fixed 800 ms sleep let the
      // sweep read a <details> mid-entrance on a slow runner: its content is animated
      // in (detailsOpen: translateY(-5px) -> 0, 0.2s), so a sample taken while the
      // animation was young reported the summary overlapping its own content
      // (316x4px on pages/behaviors.html, about 1 run in 40 under load). Reproduced
      // deterministically by stretching that animation to 60s: the unfixed spec fails
      // with exactly the nightly's message, this one passes.
      // WB.whenIdle() covers the lazy/eager scan; the loop waits for finite animations
      // and transitions to END. Infinite ones (spinners, rainbow) never finish, so
      // they are skipped, not awaited.
      await settlePage(page, { ifPresent: true });
      await page.evaluate(async () => {
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

      // The measurement itself, and the reason for every exclusion it makes,
      // is in scripts/lib/layout-checks.mjs: site-migrate runs the same rule
      // against the page it proposes (#1832).
      const violations = await page.evaluate(overlapViolations, MIN_OVERLAP_DIM);

      expect(violations, `${file}:\n${violations.join('\n')}`).toHaveLength(0);
    });
  }
});

import { test, expect, request as pwRequest } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * #262: the `Docs: wb-<comp>` links under every <div x-demo> must WORK. The old
 * '?page=docs#wb-…' hrefs were dead on every surface (page-relative + no such
 * anchors). Now each link opens the component's REAL doc in the doc-viewer,
 * resolved from docs/manifest.json; components with no doc get NO link.
 *
 * #388: cards no longer use the shared '.x-demo__links' line at all — each
 * card grid child gets its OWN link attached directly to it
 * ('.x-demo__card-doc-link', demo.js's attachCardDocLink). Non-card content
 * (badges, alerts, buttons, ...) is unchanged and still uses the shared
 * line. Collect BOTH kinds here so this test keeps covering its real intent
 * (no dead doc-reference link of either kind), not just the pre-#388 shape.
 *
 * #842: "the ?file target returns 200" was never enough, and this spec was
 * green throughout the entire life of that bug. Every 📖 on the site pointed at
 * docs/behaviors-reference.md — a file that EXISTS, so it 200s, so the only
 * check here passed — while being the ARCHIVE doc with 49 of its 58 relative
 * links dead. The label said "x-button docs" and the href was the same generic
 * reference for every behavior on the site. "Resolves to A doc" is not the
 * claim the title makes; a link is only correct when it opens the doc its own
 * label names. assertPerBehaviorDocs below asserts that label↔target agreement
 * against the real docs/behaviors/ tree ON DISK.
 *
 * Effect-based (§19/§14): every rendered doc-reference link's ?file target must
 * GET 200, must exist on disk, and must be the labelled behavior's OWN page
 * whenever that page exists; no '?page=docs#' href may remain — checked on
 * BOTH surfaces (SPA page and a doc rendered in the doc-viewer).
 */

const ROOT = process.cwd();

type DocLink = { href: string; label: string };

/** docs-relative value of a doc link's ?file param ('' when it has none). */
function fileTarget(href: string): string {
  const raw = new URL(href, 'http://x/').searchParams.get('file');
  return raw ? decodeURIComponent(raw) : '';
}

const SELECTOR = '.x-demo__links a, .x-demo__card-doc-link';

/**
 * The two link shapes carry their behavior name differently: the per-instance
 * corner badge (#388/#390) puts it in aria-label as "x-button docs", while the
 * shared "Docs: " line puts it in textContent as plain "x-button". Read either
 * and normalise to the bare label, so the #842 check covers both.
 */
const READ_LINKS = (as: Element[]) =>
  as.map((a) => ({
    href: a.getAttribute('href') || '',
    label: (a.getAttribute('aria-label') || a.textContent || '').replace(/\s*docs\s*$/i, '').trim(),
  }));

async function collectDocsLinks(page: import('@playwright/test').Page): Promise<DocLink[]> {
  // Cold-start under a parallel run: wb.js + the docs manifest fetch can take a
  // while before the async links fill in — wait for demo upgrade first, then links.
  await expect
    .poll(() => page.locator('[x-demo] .x-demo__grid').count(), { timeout: 30000 })
    .toBeGreaterThan(0);
  await expect
    .poll(() => page.locator(SELECTOR).count(), { timeout: 30000 })
    .toBeGreaterThan(0);
  return page.$$eval(SELECTOR, READ_LINKS);
}

async function assertAllResolve(links: DocLink[], baseURL: string | undefined) {
  const req = await pwRequest.newContext({ baseURL });
  const broken: string[] = [];
  const seen = new Set<string>();
  for (const { href } of links) {
    if (seen.has(href)) continue;
    seen.add(href);
    if (href.includes('?page=docs#')) { broken.push(`${href} → legacy dead anchor link`); continue; }
    const fileParam = fileTarget(href);
    if (!fileParam) { broken.push(`${href} → no ?file target`); continue; }
    const relTarget = fileParam.replace(/^\/+/, '');
    // HTTP 200 alone is a weak oracle for "this doc is real" — check the tree
    // too, so the target is a file that genuinely exists and not merely a path
    // the server happened to answer.
    if (!fs.existsSync(path.join(ROOT, relTarget))) {
      broken.push(`${href} → ${relTarget} does not exist on disk`);
      continue;
    }
    const res = await req.get('/' + relTarget);
    if (res.status() >= 400) broken.push(`${href} → HTTP ${res.status()}`);
  }
  await req.dispose();
  expect(broken, `dead Docs: links:\n  ${broken.join('\n  ')}`).toEqual([]);
}

/** The behavior's OWN generated page, docs-relative, or null when it has none. */
function ownBehaviorDoc(name: string): string | null {
  for (const candidate of [`behaviors/${name}.md`, `behaviors/x-${name}.md`]) {
    if (fs.existsSync(path.join(ROOT, 'docs', candidate))) return `docs/${candidate}`;
  }
  return null;
}

/**
 * #842: a link labelled `x-button` must open docs/behaviors/button.md — the
 * schema-generated per-behavior page — not the generic
 * docs/behaviors-reference.md catch-all.
 *
 * Only labels whose own page actually EXISTS on disk are held to this. A few
 * names (e.g. `wb-card`, which has no docs/behaviors/card.md) legitimately fall
 * back to the shared reference, and demanding a page that was never generated
 * would be asserting a fiction. That skip is exactly the shape that turns a
 * check vacuous, so `matched` is asserted separately: if every label were
 * skipped this would pass while proving nothing, which is the failure mode
 * tests/compliance/tests-must-assert.spec.ts exists to catch.
 */
function assertPerBehaviorDocs(links: DocLink[], surface: string) {
  const generic: string[] = [];
  let matched = 0;
  for (const { href, label } of links) {
    const m = label.match(/^(?:x|wb)-([a-z0-9-]+)$/i);
    if (!m) continue;
    const own = ownBehaviorDoc(m[1].toLowerCase());
    if (!own) continue;
    const target = fileTarget(href);
    if (target === own) matched++;
    else generic.push(`${label} → ${target || '(no ?file)'}   — its own page ${own} exists on disk`);
  }
  expect(
    generic,
    `#842 on ${surface}: doc links whose label names a behavior that HAS its own\n`
    + 'generated page, but which open something else (the generic\n'
    + `behaviors-reference.md archive is the usual culprit):\n  ${generic.join('\n  ')}`,
  ).toEqual([]);
  expect(
    matched,
    `#842 on ${surface}: not one link resolved to its own docs/behaviors/<name>.md,\n`
    + 'so the per-behavior check above skipped every link and proved nothing.',
  ).toBeGreaterThan(0);
}

test.describe('[x-demo] Docs: links resolve to real docs (#262)', () => {
  // Surface was '/?page=behaviors' until #666 moved all 88 <div x-demo> blocks
  // off that page into data/behavior-examples.json, rendered on demand by the
  // live-preview panel (see the comment at pages/behaviors.html:173). Measured
  // live: /?page=behaviors now yields [x-demo]=0, grids=0, links=0 — there was
  // nothing left for this test to look at, and because page.goto() returns 200
  // for a page that merely renders no demos, the only symptom was a 30s poll
  // timeout rather than anything naming the cause.
  //
  // /?page=demos is a live SPA surface that still renders demo blocks
  // (measured: [x-demo]=4, grids=4, links=2), so the test keeps its actual
  // intent — doc links must work on the SPA surface — instead of being retired
  // along with the page that used to host them.
  test('SPA components page: every Docs: link opens a real doc', async ({ page, baseURL }) => {
    await page.goto('/?page=demos', { waitUntil: 'domcontentloaded' });
    const links = await collectDocsLinks(page);
    // Coverage floor, asserted HERE in the body rather than only inside the
    // helpers: a surface that renders no doc links can't prove anything about
    // doc links, and tests-must-assert.spec.ts reads each test body on its own
    // (it cannot see into collectDocsLinks/assertAllResolve), so a test whose
    // every assertion is delegated reads to the gate as asserting nothing.
    expect(links.length, '/?page=demos rendered no doc links at all').toBeGreaterThan(0);
    await assertAllResolve(links, baseURL);
    assertPerBehaviorDocs(links, '/?page=demos');
  });

  // Surface was 'docs/behaviors/x-demo.md', WHICH DOES NOT EXIST — the file is
  // docs/behaviors/demo.md. doc-viewer.html itself still returns 200 with a
  // missing ?file (measured), so this navigated happily to a viewer that
  // rendered no document at all, and the test then polled 30s for demo blocks
  // that could never appear. Exactly the "page.goto() does not throw on a 404"
  // trap, one level down: the HTML shell is real, the content is not.
  //
  // demo.md is not a usable substitute (measured: 1 grid, 0 doc links — its one
  // demo has no doc-linkable behavior). docs/V3-GUIDE.md renders 9 grids and 11
  // doc links, every one a per-behavior page, which is what this surface is
  // supposed to be exercising.
  test('doc-viewer surface: every Docs: link opens a real doc', async ({ page, baseURL }) => {
    await page.goto('/public/doc-viewer.html?file=' + encodeURIComponent('docs/V3-GUIDE.md'), {
      waitUntil: 'domcontentloaded',
    });
    const links = await collectDocsLinks(page);
    // Same coverage floor as above — and here it also guards the loop below,
    // which would otherwise iterate zero times and assert nothing.
    expect(links.length, 'the doc-viewer surface rendered no doc links at all').toBeGreaterThan(0);
    await assertAllResolve(links, baseURL);
    assertPerBehaviorDocs(links, 'doc-viewer');
    // Root-awareness: from /public/… the href must point back to site root, not nest under /public/.
    for (const { href } of links) {
      expect(href, 'href must not nest doc-viewer under /public/public/').not.toMatch(/public\/public\//);
    }
  });

  // #454: siteRoot() (demo.js) only recognized public/, demos/, pages/,
  // articles/ as site-root-relative directories. Pages under tests/fixtures/
  // (e.g. this one) fell through to a fallback that left siteRoot() as
  // '/tests/fixtures/' instead of '/', 404ing the docs/manifest.json fetch
  // and silently suppressing every x-demo Docs: link/badge on the page even
  // though the markup was correctly wrapped in <div x-demo>...</div> (fixed
  // by adding 'tests/fixtures' to siteRoot()'s regex). Covers the per-card
  // badge form specifically ('.x-demo__card-doc-link') since every example
  // on this fixture is a real wb-* grid child, not the shared-line fallback.
  test('tests/fixtures/cards-permutation-matrix.html: every card doc-link badge opens a real doc', async ({
    page,
    baseURL,
  }) => {
    await page.goto('/tests/fixtures/cards-permutation-matrix.html', { waitUntil: 'domcontentloaded' });
    await expect
      .poll(() => page.locator('[x-demo] .x-demo__grid').count(), { timeout: 30000 })
      .toBeGreaterThan(0);
    await expect
      .poll(() => page.locator('.x-demo__card-doc-link').count(), { timeout: 30000 })
      .toBeGreaterThan(0);
    const links = await page.$$eval('.x-demo__card-doc-link', READ_LINKS);
    // Every one of the 65 <div x-demo> blocks on this page wraps a card, so this
    // must produce a real per-instance badge count, not just a nonzero one.
    //
    // CURRENTLY RED AT 64, AND THAT IS THE POINT — do not "fix" this by lowering
    // the number. Measured live: 65 blocks, 64 badges, and the 4 blocks with NO
    // badge are exactly the four base-card demos, whose grid child is a bare
    // `<article title subtitle footer>` / `<article variant>` / `<article size>`
    // / `<article elevated>` carrying no x-* attribute at all. (64 rather than
    // 61 because 3 blocks carry two badges each.)
    //
    // demo.js resolves a doc link down two paths: findWbComponents() matches
    // literal <wb-*> TAGS and findXBehaviors() matches x-* ATTRIBUTES. A demo
    // whose subject is a plain semantic element decorated by tag-map alone
    // matches NEITHER, so it gets no 📖 — even though docs/card.md exists on
    // disk. Note also that findBehaviorDocFile() keeps a behaviors-reference.md
    // last resort while findDocFile() does not, so the two paths disagree about
    // whether "no page of its own" means fallback or silence.
    //
    // That is a src/wb-viewmodels/demo.js defect, out of scope for this spec.
    // Lowering this floor to 64 would delete the only thing that reports it.
    expect(links.length).toBeGreaterThanOrEqual(65);
    await assertAllResolve(links, baseURL);
    assertPerBehaviorDocs(links, 'cards-permutation-matrix.html');
    for (const { href } of links) {
      expect(href, 'href must point back to site root, not nest under /tests/fixtures/').not.toMatch(
        /tests\/fixtures\/(public|docs)\//
      );
    }
  });
});

import { test, expect, request as pwRequest } from '@playwright/test';

/**
 * FUNCTIONAL TEST: the doc-viewer auto-links path references.
 *
 * Index/tier docs (e.g. docs/claude/TIER2-DOMAIN-GUIDES.md) list dozens of files
 * as `inline code` or **bold** rather than markdown [links](…), so nothing was
 * clickable. The viewer now wraps any <code>/<strong>/<b> whose whole text is a
 * repo path ending .md/.html in an <a class="wb-doc-pathlink"> — but ONLY when
 * the target actually resolves (GET 200), so a stale/missing reference stays
 * plain text and we never ship a dead link.
 *
 * This test pins that contract on TIER2 (which contains all three cases):
 *   - an EXISTING docs/ path   → linked, doc-relative href, inner <code> kept
 *   - an EXISTING non-docs path (data/…) → linked (routing not limited to docs/)
 *   - a MISSING path (docs/architecture.md) → NOT linked
 *   - every rendered path-link resolves (no 404).
 */
const DOC = 'docs/claude/TIER2-DOMAIN-GUIDES.md';

test.describe('doc-viewer auto-links path references (existing targets only)', () => {
  test('code/bold repo paths become resolvable links; missing ones stay plain', async ({ page, baseURL }) => {
    await page.goto(`/public/doc-viewer.html?file=${encodeURIComponent(DOC)}`, {
      waitUntil: 'domcontentloaded',
    });

    // An existing reference MUST become a link — wait for it. Once any
    // wb-doc-pathlink exists the linkifier's single wrapping pass is done
    // (all existence checks resolve together, then wrap synchronously).
    const v3 = page.locator('a.wb-doc-pathlink', { hasText: 'V3-STANDARDS.md' }).first();
    await expect(v3).toHaveCount(1, { timeout: 20000 });

    // 1) existing docs/ path: doc-relative href, code styling preserved inside the link
    expect(await v3.getAttribute('href')).toBe('../standards/V3-STANDARDS.md');
    await expect(v3.locator('code')).toHaveCount(1);

    // 2) existing NON-docs path (data/…) is linked too — routing isn't docs/-only
    const dataLink = page.locator('a.wb-doc-pathlink', { hasText: 'FUNCTIONAL-TEST-ANALYSIS.md' }).first();
    await expect(dataLink).toHaveCount(1);
    expect(await dataLink.getAttribute('href')).toBe('../../data/FUNCTIONAL-TEST-ANALYSIS.md');

    // 3) a MISSING reference (docs/architecture.md is gone) must NOT be linked
    const archLinked = await page
      .locator('a.wb-doc-pathlink', { hasText: 'docs/architecture.md' })
      .count();
    expect(archLinked, 'a missing target must never be linked (no dead links)').toBe(0);

    // 4) EVERY rendered path-link resolves (GET 200) — zero dead links overall
    const hrefs = await page.$$eval('a.wb-doc-pathlink[href]', (els) =>
      els.map((a) => a.getAttribute('href') || '')
    );
    const req = await pwRequest.newContext({ baseURL });
    const broken: string[] = [];
    for (const h of [...new Set(hrefs)]) {
      // Resolve the (doc-relative or already-absolute) href against the doc's
      // own directory, exactly like the browser would on click.
      const abs = new URL(h, `http://x/${DOC}`);
      const res = await req.get(abs.pathname);
      if (res.status() >= 400) broken.push(`${h} → HTTP ${res.status()}`);
    }
    await req.dispose();
    expect(broken, `doc-viewer rendered dead path-links:\n  ${broken.join('\n  ')}`).toEqual([]);
  });
});

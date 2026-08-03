import { test, expect } from '@playwright/test';

/**
 * #241 — frameworks.html code examples must be syntax-highlighted (theme colors)
 * and have a copy button. They shipped as plain, uncolored monospace text because
 * the `language="…"` / `copy="true"` shorthand on <pre> never mapped to a
 * highlighter.
 *
 * #449 — the page originally fixed this with its own hand-rolled highlighter +
 * `.code-copy-btn`, written under the (then-true, now-stale) assumption that
 * WB's own code behavior never activates on these hand-written blocks. It does
 * now, and running both systems on the same elements conflicted (a specificity
 * war left the line-number gutter overlapping the code text). The page now
 * defers entirely to the global pre.js/pre.css system -- same highlighting +
 * copy button + line numbers + language badge every other code panel gets,
 * via `.x-pre__copy` instead of the removed `.code-copy-btn`.
 *
 * #324 — the HTMX section moved to a real <wb-demo> (it's plain, build-step-free
 * HTML, so <wb-demo> can render it live AND show its exact source — see
 * DEMOS-AND-DOCS-STANDARDS.md §25). That drops the hand-rolled pre[language] count
 * from 6 to 5 (React, Vue, Svelte, Angular, SolidJS); HTMX is covered by the
 * separate <wb-demo> checks below instead.
 */
test.describe('frameworks demo: code examples highlighted + copyable (#241)', () => {
  test('every pre[language] block is highlighted, vertical, and has a copy button', async ({ page }) => {
    await page.goto('/demos/frameworks.html', { waitUntil: 'domcontentloaded' });

    const pres = page.locator('pre[language]');
    const n = await pres.count();
    expect(n, 'expected the framework code-example blocks').toBeGreaterThanOrEqual(5);

    // Every inner <code> is highlighted (hljs), not plain text.
    const codes = page.locator('pre[language] code');
    await expect(codes.first()).toHaveClass(/hljs/, { timeout: 15000 });
    for (let i = 0; i < n; i++) {
      await expect(codes.nth(i), `code block ${i} must be highlighted`).toHaveClass(/hljs/);
    }

    // Real tokens (colored spans), not one blob.
    expect(
      await codes.first().locator('span[class*="hljs-"]').count(),
      'code should be tokenized into colored spans'
    ).toBeGreaterThan(2);

    // A copy button on every block (#449: the global system's own button,
    // `.x-pre__copy`). It lives in the `.x-pre-wrapper` pre.js wraps each
    // block in, as a SIBLING of <pre> (not a child of it like the removed
    // `.code-copy-btn` was) -- select via the wrapper, not a `pre[language]`
    // descendant. The page's own script eager-scans each block sequentially,
    // so poll (like the hljs checks above) instead of a one-shot `.count()`
    // that could catch it mid-loop.
    await expect(page.locator('.x-pre-wrapper:has(pre[language]) .x-pre__copy')).toHaveCount(n, { timeout: 15000 });

    // Wrap-vs-scroll behavior for these blocks is covered by its own dedicated
    // regression test (tests/regression/frameworks-code-block-no-wrap.spec.ts)
    // -- this page is a documented §6 carve-out (scrolls, doesn't wrap), the
    // opposite of the site-wide default, so it doesn't belong duplicated here.
  });
});

/**
 * #324 — DEMOS-AND-DOCS-STANDARDS.md §1/§16/§25.
 *
 * HTMX needs no build step, so it's real, executable HTML and MUST use <wb-demo>
 * like any other component example (§25's own carve-out for what stays exempt).
 * The React/Vue/Svelte/Angular/SolidJS sections mount via framework-specific
 * script/build output that <wb-demo> can't represent as 1:1 source — they keep the
 * hand-rolled highlighted <pre> pattern (already covered by the #241 test above),
 * and the three that have no live render at all (Svelte/Angular/SolidJS) must carry
 * an explicit "no live render" label rather than silently omitting one.
 */
test.describe('frameworks demo: wb-demo / build-step exception (§25, #324)', () => {
  test('HTMX section renders as a real <wb-demo> (live control + matching source)', async ({ page }) => {
    const errs: string[] = [];
    page.on('pageerror', (e) => errs.push(String(e)));

    await page.goto('/demos/frameworks.html', { waitUntil: 'domcontentloaded' });

    const demo = page.locator('wb-demo').first();
    await expect(demo).toBeVisible();
    await expect(demo.locator('.wb-demo__grid')).toBeVisible({ timeout: 20000 });
    await expect(demo.locator('.wb-demo__code, pre').first()).toBeVisible();

    const button = demo.locator('.wb-demo__grid button[hx-post]').first();
    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute('hx-post', '/clicked');

    expect(errs, 'no page errors while rendering demos/frameworks.html').toEqual([]);
  });

  test('React and Vue sections have both a live render and a real source block, no <wb-demo>', async ({ page }) => {
    await page.goto('/demos/frameworks.html', { waitUntil: 'domcontentloaded' });

    // Live render: React mounts a real button into #react-root; Vue mounts its app.
    await expect(page.locator('#react-root button')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#vue-app button')).toBeVisible();

    // Source: each section's own highlighted pre[language] block, still present.
    await expect(page.locator('#react-demo pre[language]')).toBeVisible();
    await expect(page.locator('#vue-demo pre[language]')).toBeVisible();

    // Neither section is wrapped in <wb-demo> — that's the deliberate §25 exception.
    expect(await page.locator('#react-demo wb-demo').count()).toBe(0);
    expect(await page.locator('#vue-demo wb-demo').count()).toBe(0);
  });

  test('Svelte/Angular/SolidJS sections each carry an explicit "no live render" label', async ({ page }) => {
    await page.goto('/demos/frameworks.html', { waitUntil: 'domcontentloaded' });

    const notes = page.locator('.wb-demo-buildstep-note');
    await expect(notes).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      await expect(notes.nth(i)).toContainText('No live render');
      await expect(notes.nth(i)).toContainText('build step');
    }

    // Each still has its highlighted, copyable source (covered structurally by the
    // #241 test above) and no <wb-demo> wrapper (nothing here can execute live).
    expect(await page.locator('wb-demo').count()).toBe(1); // HTMX only
  });
});

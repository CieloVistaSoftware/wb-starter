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
 * #324 — the HTMX section moved to a real <div x-demo> (it's plain, build-step-free
 * HTML, so <div x-demo> can render it live AND show its exact source — see
 * DEMOS-AND-DOCS-STANDARDS.md §25). That drops the hand-rolled pre[language] count
 * from 6 to 5 (React, Vue, Svelte, Angular, SolidJS); HTMX is covered by the
 * separate <div x-demo> checks below instead.
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
      await expect(codes.nth(i), `code block ${i} must be highlighted`).toHaveClass(/hljs/, { timeout: 15000 });
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

  test('framework code blocks use the shared pre behavior without legacy controls (#449)', async ({ page }) => {
    await page.goto('/demos/frameworks.html', { waitUntil: 'domcontentloaded' });

    const blocks = page.locator('pre[language]');
    const count = await blocks.count();
    expect(count).toBeGreaterThanOrEqual(5);

    await expect(page.locator('pre[language][x-behavior="pre"][x-eager]')).toHaveCount(count);
    await expect(page.locator('pre[language].x-pre')).toHaveCount(count, { timeout: 15000 });
    await expect(page.locator('.code-copy-btn')).toHaveCount(0);
  });
});

/**
 * #324 / #460 — DEMOS-AND-DOCS-STANDARDS.md §1/§16/§25.
 *
 * HTMX needs no build step, so it's real, executable HTML and MUST use <div x-demo>
 * like any other behavior example (§25's own carve-out for what stays exempt).
 * The React/Vue/Svelte/Angular/SolidJS sections mount via framework-specific
 * script/compiler output that <div x-demo> can't represent as 1:1 source — they keep
 * the hand-rolled highlighted <pre> pattern (already covered by the #241 test
 * above) instead of <div x-demo>'s paired live+source.
 *
 * #460 now covers all five framework sections: React and Vue use CDN UMD builds;
 * Svelte and SolidJS compile client-side at runtime; Angular bootstraps a real
 * standalone behavior from its pinned browser ESM packages. None needs a repo
 * build dependency, and each keeps its author-facing source block below the live
 * mount because compiled framework output is not 1:1 with that source.
 */
test.describe('frameworks demo: x-demo / build-step exception (§25, #324, #460)', () => {
  test('HTMX section renders as a real <div x-demo> (live control + matching source)', async ({ page }) => {
    const errs: string[] = [];
    page.on('pageerror', (e) => errs.push(String(e)));

    await page.goto('/demos/frameworks.html', { waitUntil: 'domcontentloaded' });

    const demo = page.locator('x-demo').first();
    await expect(demo).toBeVisible();
    await expect(demo.locator('.x-demo__grid')).toBeVisible({ timeout: 20000 });
    await expect(demo.locator('.x-demo__code, pre').first()).toBeVisible();

    const button = demo.locator('.x-demo__grid button[hx-post]').first();
    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute('hx-post', '/clicked');

    // #591: the server's real /clicked handler (server.js) swaps the button's
    // outerHTML into a visible confirmation -- a reader can point at the
    // "✓ Swapped!" text as the event listener's result, not just infer it.
    await button.click();
    await expect(demo.locator('.x-demo__grid button')).toHaveText(/Swapped/, { timeout: 5000 });

    expect(errs, 'no page errors while rendering demos/frameworks.html').toEqual([]);
  });

  test('React and Vue sections have both a live render and a real source block, no <div x-demo>', async ({ page }) => {
    await page.goto('/demos/frameworks.html', { waitUntil: 'domcontentloaded' });

    // Live render: React mounts a real button into #react-root; Vue mounts its app.
    await expect(page.locator('#react-root button')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#vue-app button')).toBeVisible();

    // #591: each section's event listener must produce a visible, persistent
    // change to an on-page element a reader can point at as "the result".
    await expect(page.locator('#react-root h3')).toHaveText('React Counter: 0');
    await page.locator('#react-root button').click();
    await expect(page.locator('#react-root h3')).toHaveText('React Counter: 1');

    await expect(page.locator('#vue-app h3')).toHaveText('Vue Message: Hello Vue!');
    await page.locator('#vue-app button').click();
    await expect(page.locator('#vue-app h3')).toHaveText('Vue Message: !euV olleH');

    // Source: each section's own highlighted pre[language] block, still present.
    await expect(page.locator('#react-demo pre[language]')).toBeVisible();
    await expect(page.locator('#vue-demo pre[language]')).toBeVisible();

    // Neither section is wrapped in <div x-demo> — that's the deliberate §25 exception.
    expect(await page.locator('#react-demo x-demo').count()).toBe(0);
    expect(await page.locator('#vue-demo x-demo').count()).toBe(0);
  });

  test('Svelte section compiles client-side and renders live, interactively, with its real source shown (#460)', async ({ page }) => {
    const errs: string[] = [];
    page.on('pageerror', (e) => errs.push(String(e)));

    await page.goto('/demos/frameworks.html', { waitUntil: 'domcontentloaded' });

    const button = page.locator('#svelte-root button');
    await expect(button, 'svelte/compiler (loaded from esm.sh) must compile and mount a real behavior').toBeVisible({ timeout: 15000 });
    await expect(button).toHaveText('Svelte Button');

    // #591: clicking the button must also update a persistent, visible
    // on-page element -- not just an attribute a reader can't see -- so the
    // result of the event listener is something they can point at.
    await expect(page.locator('#svelte-root h3')).toHaveText('Svelte Count: 0');

    // Real Svelte reactivity: clicking increments `count`, re-rendering the
    // `tooltip="Count: {count}"` attribute — not a static/hand-written button.
    await expect(button).toHaveAttribute('tooltip', 'Count: 0');
    await button.click();
    await button.click();
    await expect(button).toHaveAttribute('tooltip', 'Count: 2');
    await expect(page.locator('#svelte-root h3')).toHaveText('Svelte Count: 2');

    // WB's own x-ripple behavior must have wired up on the compiled-and-mounted
    // button just like any other WB-enhanced element (adds the x-ripple class).
    await expect(button).toHaveClass(/x-ripple/);

    // x-toast must also have wired up and fire a real, live toast on click —
    // same "reads the current attribute at click time, not a stale bind-time
    // snapshot" contract #458's fix guarantees. Two clicks already happened
    // above, so a toast should already be in the container.
    await expect(page.locator('.x-toast-container .x-toast').last()).toBeVisible();

    // Source: the section's own highlighted pre[language] block, still present.
    await expect(page.locator('#svelte-demo pre[language]')).toBeVisible();

    // Not wrapped in <div x-demo> — compiled Svelte output isn't 1:1 with the
    // hand-authored .svelte-equivalent source shown below it.
    expect(await page.locator('#svelte-demo x-demo').count()).toBe(0);

    expect(errs, `no page errors while compiling/mounting the Svelte demo: ${errs.join(' | ')}`).toEqual([]);
  });

  test('SolidJS section compiles client-side and renders live, interactively, with its real source shown (#460)', async ({ page }) => {
    const errs: string[] = [];
    page.on('pageerror', (e) => errs.push(String(e)));

    await page.goto('/demos/frameworks.html', { waitUntil: 'domcontentloaded' });

    const button = page.locator('#solid-root button');
    await expect(button, 'babel-plugin-jsx-dom-expressions (loaded from esm.sh via @babel/standalone) must compile and mount a real behavior').toBeVisible({ timeout: 15000 });
    await expect(button).toHaveText('SolidJS Button');

    // #591: clicking the button must also update a persistent, visible
    // on-page element -- not just an attribute a reader can't see -- so the
    // result of the event listener is something they can point at.
    await expect(page.locator('#solid-root h3')).toHaveText('SolidJS Count: 0');

    // Real Solid fine-grained reactivity: clicking increments the createSignal-
    // backed `count`, re-rendering the `tooltip` attribute.
    await expect(button).toHaveAttribute('tooltip', 'Count: 0');
    await button.click();
    await button.click();
    await button.click();
    await expect(button).toHaveAttribute('tooltip', 'Count: 3');
    await expect(page.locator('#solid-root h3')).toHaveText('SolidJS Count: 3');

    // WB's own x-ripple behavior must have wired up on the compiled-and-mounted
    // button just like any other WB-enhanced element (adds the x-ripple class).
    await expect(button).toHaveClass(/x-ripple/);

    // Source: the section's own highlighted pre[language] block, still present.
    await expect(page.locator('#solid-demo pre[language]')).toBeVisible();

    // Not wrapped in <div x-demo> — compiled Solid output isn't 1:1 with the
    // hand-authored JSX source shown below it.
    expect(await page.locator('#solid-demo x-demo').count()).toBe(0);

    expect(errs, `no page errors while compiling/mounting the SolidJS demo: ${errs.join(' | ')}`).toEqual([]);
  });

  test('Angular section bootstraps a live standalone behavior from browser ESM packages (#460)', async ({ page }) => {
    const errs: string[] = [];
    page.on('pageerror', (e) => errs.push(String(e)));

    await page.goto('/demos/frameworks.html', { waitUntil: 'domcontentloaded' });

    const button = page.locator('#angular-root angular-demo button');
    try {
      await expect(button).toBeVisible({ timeout: 20000 });
    } catch (error) {
      throw new Error(`Angular must bootstrap and render a real behavior. ${error instanceof Error ? error.message : String(error)} Page errors: ${errs.join(' | ')}`);
    }
    await expect(button).toHaveText('Increment + WB Magic');
    await expect(page.locator('#angular-root h3')).toHaveText('Angular Count: 0');
    await expect(button).toHaveAttribute('tooltip', 'Count: 0');
    await button.click();
    await button.click();
    await expect(page.locator('#angular-root h3')).toHaveText('Angular Count: 2');
    await expect(button).toHaveAttribute('tooltip', 'Count: 2');
    await expect(button).toHaveClass(/x-ripple/);
    await expect(page.locator('#angular-demo pre[language]')).toBeVisible();

    expect(errs, `no page errors while bootstrapping the Angular demo: ${errs.join(' | ')}`).toEqual([]);
    expect(await page.locator('x-demo').count()).toBe(1); // HTMX only
  });
});

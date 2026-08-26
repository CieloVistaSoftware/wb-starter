import { test, expect } from '@playwright/test';

/**
 * docs/behavior-cross-reference.md must follow DEMOS-AND-DOCS-STANDARDS.md
 * §1/§16 — every renderable component example is a live <div x-demo> (renders
 * the control AND shows its source), never a static, non-live code fence.
 * Converted from 37 plain ```html fences to live <div x-demo> blocks (per
 * docs/code-examples-standard.md Rule 4); the remaining plain fences on this
 * page are the JS-only "Code Behind It" snippets and the ASCII
 * "How Custom Tags Work" pseudocode, which Rule 4 explicitly exempts.
 *
 * This page has MANY <div x-demo> blocks (158 as of this test's writing) on ONE
 * doc page, so — matching behaviors-reference-wb-demo.spec.ts's own
 * reasoning — everything below runs against a SINGLE page load rather than
 * one goto() per example.
 *
 * <div x-demo> (src/wb-viewmodels/x-demo.js) only builds its first
 * EAGER_BUILD_COUNT=5 blocks synchronously on connect; the rest are deferred
 * behind an IntersectionObserver (rootMargin 400px). A fixed-step
 * window.scrollTo() sweep was measured to miss a meaningful fraction of the
 * 158 blocks on this page (observer timing vs. scroll step size), so this
 * test scrolls EACH <div x-demo> individually into view via scrollIntoView()
 * before asserting — confirmed live to reliably build all 158.
 */

test.describe('docs/behavior-cross-reference.md: live <div x-demo> examples', () => {
  test('every <div x-demo> renders live grid + source, no page errors', async ({ page }) => {
    test.setTimeout(120000);

    const errs: string[] = [];
    page.on('pageerror', (e) => errs.push(String(e)));

    await page.goto('/public/doc-viewer.html?file=' + encodeURIComponent('docs/behavior-cross-reference.md'), {
      waitUntil: 'domcontentloaded',
    });

    const demos = page.locator('[x-demo]');
    await expect(demos.first().locator('.x-demo__grid')).toBeVisible({ timeout: 20000 });

    const count = await demos.count();
    // 158 <div x-demo> blocks as of this test's writing. Assert a floor rather
    // than an exact count so future additions don't need this test touched.
    expect(count).toBeGreaterThanOrEqual(150);

    // Scroll every <div x-demo> individually into view so each one's
    // IntersectionObserver fires and builds its grid + source panel.
    for (let i = 0; i < count; i++) {
      await demos.nth(i).scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
    }
    await page.waitForTimeout(500);

    // §1/§16: every <div x-demo> shows both a live grid and its source panel.
    for (let i = 0; i < count; i++) {
      const demo = demos.nth(i);
      await expect(demo.locator('.x-demo__grid')).toBeVisible({ timeout: 10000 });
      // x-demo's own auto-generated source panel is always `.x-demo__code`
      // (demo.js: `pre.className = '[x-demo]__code'`) -- NOT a bare `pre`
      // selector. This doc has a "details" example whose rendered content
      // legitimately contains its own <pre><code> inside a collapsed
      // <details> (hidden until expanded); a `.x-demo__code, pre` selector
      // matches that unrelated, intentionally-hidden <pre> first and fails.
      // Scoping to the real generated-source class avoids that false match.
      await expect(demo.locator('.x-demo__code').first()).toBeVisible();
    }

    expect(errs, 'no page errors while rendering docs/behavior-cross-reference.md').toEqual([]);
  });

  test('the [x-modal] dialog trigger pattern actually opens a working dialog', async ({ page }) => {
    // Regression guard for the mdhtml.js sanitizer bug found and fixed this
    // session: the on*= attribute-stripping regex's value-matching group
    // (`["'][^"']*["']`) didn't pair its closing quote with its opening one,
    // so a real `onclick="document.getElementById('x').open()"` (double-
    // quoted attribute, single-quoted JS string inside) corrupted the WHOLE
    // tag into `<buttonx').open()">` — confirmed live on
    // docs/behaviors-reference.md's own dialog demo before the fix. Because
    // ALL on*= handlers are intentionally stripped by design (basic XSS
    // protection), this doc's dialog examples were rewritten to use the
    // self-contained `<div x-modal modal-title modal-content>` trigger pattern
    // instead of onclick+showModal(), which needs no event-handler
    // attribute at all. This test asserts that pattern still renders an
    // un-mangled <div x-modal> tag and actually opens a dialog on click.
    const errs: string[] = [];
    page.on('pageerror', (e) => errs.push(String(e)));

    await page.goto('/public/doc-viewer.html?file=' + encodeURIComponent('docs/behavior-cross-reference.md'), {
      waitUntil: 'domcontentloaded',
    });

    const trigger = page.locator('[x-modal]', { hasText: 'Show Welcome' }).first();
    await trigger.scrollIntoViewIfNeeded();
    await expect(trigger).toBeVisible({ timeout: 10000 });

    // No mangled tag names anywhere on the page (the corrupted form was a
    // tag literally named e.g. "buttonx').open()" per the confirmed bug).
    const badTagCount = await page.evaluate(() => {
      let bad = 0;
      document.querySelectorAll('*').forEach((el) => {
        if (/[<>]/.test(el.tagName)) bad++;
      });
      return bad;
    });
    expect(badTagCount).toBe(0);

    await trigger.click();
    const dialog = page.locator('dialog.x-dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog).toContainText('Welcome!');
    await expect(dialog).toContainText('Thanks for visiting our site.');

    // Close via the auto-generated close button so it doesn't leak into the
    // next assertion.
    await dialog.locator('.x-dialog__close').click();
    await expect(dialog).toBeHidden({ timeout: 5000 });

    expect(errs, 'no page errors while opening/closing the [x-modal] dialog').toEqual([]);
  });
});

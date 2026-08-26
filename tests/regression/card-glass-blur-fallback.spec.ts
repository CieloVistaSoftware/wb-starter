import { test, expect, Page } from '@playwright/test';

/**
 * #351: `<article variant="glass">` showed no glassmorphism effect on a
 * Samsung phone. `.x-card--glass` (card.css) already declares
 * `backdrop-filter: blur(16px)` + the `-webkit-` prefix, but had NO
 * `@supports not (backdrop-filter: blur(1px))` fallback -- unlike
 * navbar.css, which has one for the same property. Some older/budget
 * Android WebViews silently ignore backdrop-filter, so without a fallback
 * the card degraded to a flat, barely-tinted box with no visual cue that
 * this was an intentional degradation rather than a broken feature.
 *
 * Fix: card.css now has an `@supports not (backdrop-filter: blur(1px))`
 * block (same pattern as navbar.css) that swaps in more-opaque
 * `--card-glass-bg-fallback` / `--card-glass-border-fallback` tokens
 * (themes.css) and disables the `::before` shimmer overlay, which would
 * otherwise animate across a flat, non-blurred surface and read as a
 * glitch rather than a glass highlight.
 *
 * Testing approach: this is fundamentally "does it look right on a real
 * Samsung device," which Playwright/Chromium cannot reproduce -- Chromium
 * always supports backdrop-filter, so the `@supports not (...)` block
 * never actually activates in a live computed-style check here. Instead:
 *   1. Confirm the NORMAL (supported) case still declares backdrop-filter,
 *      so the fix didn't regress the working path.
 *   2. Confirm the fallback CSS rule exists in the loaded stylesheet with
 *      the expected structure (selector, more-opaque background/border
 *      tokens, shimmer disabled) -- a structural check, not a live
 *      computed-style trigger, per the same pattern already used by
 *      tests/compliance/cross-browser-support.spec.ts for other
 *      `@supports`/utility-class rules.
 */

const HARNESS = '/demos/test-harness.html';

async function injectGlassCard(page: Page) {
  await page.goto(HARNESS);
  await page.waitForFunction(
    () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
    { timeout: 10000 }
  );
  await page.evaluate(async () => {
    const existing = document.getElementById('test-container');
    if (existing) existing.remove();
    const container = document.createElement('div');
    container.id = 'test-container';
    container.innerHTML = `<article id="glass-card" variant="glass">Glass card content</article>`;
    document.body.appendChild(container);
    await (window as any).WB.scan(container);
  });

  // card.js applies the x-card--glass class asynchronously (deferred via
  // IntersectionObserver, same as card-typed-variants-no-op.spec.ts) --
  // poll rather than assume it's present immediately.
  await page.waitForFunction(
    () => document.getElementById('glass-card')?.classList.contains('x-card--glass'),
    null,
    { timeout: 5000 }
  );

  // card.css itself loads just-in-time (style-loader.js's ensureBehaviorCss)
  // the first time the card behavior runs -- wait for the fallback rule's
  // custom properties to actually resolve on :root before reading the
  // stylesheet, so this isn't racing the JIT <link>/<style> injection.
  await page.waitForFunction(() => {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--card-glass-bg-fallback').trim();
    return v.length > 0;
  }, null, { timeout: 5000 });
}

test.describe('.x-card glass variant: backdrop-filter fallback (#351)', () => {
  test('normal case: glass card still declares backdrop-filter (blur) in its CSS', async ({ page }) => {
    await injectGlassCard(page);

    const declared = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules) as CSSStyleRule[]) {
            if (rule.selectorText === '.x-card--glass' && rule.style) {
              const bd = rule.style.getPropertyValue('backdrop-filter');
              const webkitBd = rule.style.getPropertyValue('-webkit-backdrop-filter');
              if (bd || webkitBd) return { backdropFilter: bd, webkitBackdropFilter: webkitBd };
            }
          }
        } catch {
          // Cross-origin stylesheets throw on .cssRules access -- skip them.
        }
      }
      return null;
    });

    expect(declared, '.x-card--glass rule with backdrop-filter must exist in a loaded stylesheet').not.toBeNull();
    // Chromium's CSSOM treats `-webkit-backdrop-filter` as an alias of the
    // canonical `backdrop-filter` longhand rather than a distinct stored
    // property, so only one of the two getPropertyValue() calls is
    // guaranteed to come back non-empty here -- assert on whichever one did,
    // not on both independently.
    expect(declared!.backdropFilter || declared!.webkitBackdropFilter).toContain('blur');

    // Also assert the live computed value in this Chromium runner (which
    // does support backdrop-filter), so the normal/supported path is
    // verified end-to-end, not just declared-but-unused CSS.
    const computed = await page.locator('#glass-card').evaluate((el) => getComputedStyle(el).backdropFilter);
    expect(computed).not.toBe('none');
    expect(computed).toContain('blur');
  });

  test('fallback case: @supports not (backdrop-filter) block exists with more-opaque tokens and disables the shimmer', async ({ page }) => {
    await injectGlassCard(page);

    const fallback = await page.evaluate(() => {
      const result: {
        found: boolean;
        background?: string;
        borderColor?: string;
        shimmerDisabled?: boolean;
      } = { found: false };

      for (const sheet of Array.from(document.styleSheets)) {
        let rules: CSSRuleList;
        try {
          rules = sheet.cssRules;
        } catch {
          continue; // cross-origin stylesheet, skip
        }
        for (const rule of Array.from(rules)) {
          const r = rule as CSSSupportsRule;
          if (
            r instanceof CSSSupportsRule &&
            r.conditionText &&
            r.conditionText.replace(/\s+/g, ' ').trim() === 'not (backdrop-filter: blur(1px))'
          ) {
            result.found = true;
            for (const inner of Array.from(r.cssRules) as CSSStyleRule[]) {
              const sel = inner.selectorText || '';
              if (sel.includes('.x-card--glass') && sel.includes('::before')) {
                result.shimmerDisabled = inner.style.getPropertyValue('display').trim() === 'none';
              } else if (sel.includes('.x-card--glass')) {
                const bg = inner.style.getPropertyValue('background');
                const bc = inner.style.getPropertyValue('border-color');
                if (bg) result.background = bg;
                if (bc) result.borderColor = bc;
              }
            }
          }
        }
      }
      return result;
    });

    expect(fallback.found, '@supports not (backdrop-filter: blur(1px)) block must exist (same pattern as navbar.css)').toBe(true);
    expect(fallback.background, 'fallback .x-card--glass background must be set').toContain('--card-glass-bg-fallback');
    expect(fallback.borderColor, 'fallback .x-card--glass border-color must be set').toContain('--card-glass-border-fallback');
    expect(fallback.shimmerDisabled, '::before shimmer must be disabled (display: none) inside the fallback block').toBe(true);

    // The fallback tokens themselves must resolve to a MORE opaque alpha
    // than the normal glass tokens, not just be present -- otherwise the
    // fallback swap would be a no-op dressed up as a fix.
    const alphas = await page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      const alphaOf = (value: string) => {
        const m = value.match(/\/\s*([\d.]+)\s*\)/);
        return m ? parseFloat(m[1]) : null;
      };
      return {
        bg: alphaOf(cs.getPropertyValue('--card-glass-bg').trim()),
        bgFallback: alphaOf(cs.getPropertyValue('--card-glass-bg-fallback').trim()),
        border: alphaOf(cs.getPropertyValue('--card-glass-border').trim()),
        borderFallback: alphaOf(cs.getPropertyValue('--card-glass-border-fallback').trim()),
      };
    });

    expect(alphas.bg).not.toBeNull();
    expect(alphas.bgFallback).not.toBeNull();
    expect(alphas.border).not.toBeNull();
    expect(alphas.borderFallback).not.toBeNull();
    expect(alphas.bgFallback!, 'fallback background alpha must be more opaque than the normal glass background').toBeGreaterThan(alphas.bg!);
    expect(alphas.borderFallback!, 'fallback border alpha must be more opaque than the normal glass border').toBeGreaterThan(alphas.border!);
  });
});

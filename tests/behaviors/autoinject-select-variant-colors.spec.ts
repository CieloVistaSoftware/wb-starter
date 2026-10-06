import { test, expect } from '../fixtures/offline';

/**
 * demos/autoinject.html's "Static Theme Variants" select examples used
 * hardcoded rgba() literals in their inline style attribute instead of the
 * theme's own translucent success/danger background variables. (#288,
 * partial — the full page-wide <div x-demo> conversion this issue also asks
 * for is tracked separately alongside #268's larger demos/ initiative.)
 */
test('theme-variant selects use theme vars, not hardcoded rgba() literals', async ({ page }) => {
  await page.goto('/demos/autoinject.html', { waitUntil: 'domcontentloaded' });

  const success = page.locator('#autoinject-select-success');
  const error = page.locator('#autoinject-select-error');

  // #779: the colours live in the page's <style> rule for each id, not in a
  // style= attribute, so read the rule that styles the element.
  const ruleFor = (id: string) => page.evaluate((sel) => {
    for (const sheet of [...document.styleSheets]) {
      let rules: CSSRuleList;
      try { rules = sheet.cssRules; } catch { continue; }
      for (const r of [...rules]) {
        if (r instanceof CSSStyleRule && r.selectorText === sel) return r.style.cssText;
      }
    }
    return null;
  }, '#' + id);

  expect(await success.getAttribute('style'), 'no inline style (#779)').toBeNull();
  expect(await error.getAttribute('style'), 'no inline style (#779)').toBeNull();
  const successRule = await ruleFor('autoinject-select-success');
  const errorRule = await ruleFor('autoinject-select-error');

  expect(successRule, 'success variant should use var(--alert-success-bg), not rgba()').not.toContain('rgba(');
  expect(successRule).toContain('var(--alert-success-bg)');
  expect(errorRule, 'error variant should use var(--alert-danger-bg), not rgba()').not.toContain('rgba(');
  expect(errorRule).toContain('var(--alert-danger-bg)');

  // Still visibly tinted — theme vars produce a real, non-transparent color.
  await expect(success).toBeVisible();
  const bg = await success.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).not.toBe('rgba(0, 0, 0, 0)');
});

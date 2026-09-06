/**
 * THE CODE-THEME CONTROL, AND WHAT x-code ACCEPTS AS A HOST
 * ========================================================
 * Three fixes that all landed on the same surface, each with its own failure
 * John saw on screen:
 *
 *   #1012  "put the codecolor behavior on the page or any page that shows code
 *           so user can swithc at will" — the code theme was reachable only
 *           from /themes, nowhere near the code it recolours.
 *   #1022  "there should not be two themes side by side anywhere" — codecontrol
 *           had no re-init guard, so a second WB pass appended a SECOND
 *           dropdown inside the same <div x-codecontrol>. Measured live: two
 *           .x-codecontrol__wrapper elements, 46 options each, in one host.
 *           themecontrol.js already had this exact guard; codecontrol never got
 *           it.
 *   #1016  x-code on a host that is not <code>/<pre> was refused outright, so
 *           the documented attribute form rendered nothing. It now wraps the
 *           host's content in a real <code> and applies the behavior to that —
 *           "code and x-code should render the same thing".
 */

import { test, expect } from '@playwright/test';

test.describe('code theme control + x-code host (#1012, #1016, #1022)', () => {
  test('the behaviors page carries exactly ONE code-theme control, beside the code', async ({ page }) => {
    await page.goto('/?page=behaviors', { waitUntil: 'domcontentloaded' });
    await page.locator('.behaviors-live__codebar').waitFor({ state: 'attached', timeout: 20_000 });

    // Force the live panel to re-render several times: that is what used to
    // append a second control, and a single page load would not have caught it.
    await page.waitForFunction(
      () => document.querySelectorAll('.behaviors-search-results__row').length > 0,
      undefined,
      { timeout: 20_000 },
    );
    await page.evaluate(async () => {
      const rows = [...document.querySelectorAll('.behaviors-search-results__row')] as HTMLElement[];
      for (const i of [3, 6, 1]) {
        rows[i]?.click();
        await new Promise((r) => setTimeout(r, 120));
      }
    });

    const counted = await page.evaluate(() => ({
      hosts: document.querySelectorAll('[x-codecontrol]').length,
      wrappers: document.querySelectorAll('.x-codecontrol__wrapper').length,
      selects: document.querySelectorAll('.x-codecontrol__select').length,
      insideCodebar: document.querySelectorAll('.behaviors-live__codebar .x-codecontrol__select').length,
    }));

    expect(
      counted.selects,
      'TWO CODE-THEME DROPDOWNS AGAIN: codecontrol() appended a second wrapper on a '
      + 're-init. Check the _wbCodeControlInit guard is still the first thing the '
      + 'function does (same pattern as themecontrol.js).',
    ).toBe(1);
    expect(counted.wrappers).toBe(1);
    expect(counted.hosts).toBe(1);
    // #1012: it belongs with the code, not up in the page header.
    expect(counted.insideCodebar).toBe(1);
  });

  test('picking a theme swaps the highlight stylesheet the page is using', async ({ page }) => {
    await page.goto('/?page=behaviors', { waitUntil: 'domcontentloaded' });
    const select = page.locator('.behaviors-live__codebar .x-codecontrol__select');
    await select.waitFor({ state: 'attached', timeout: 20_000 });

    const before = await page.evaluate(
      () => (document.querySelector('link[data-highlight-theme]') as HTMLLinkElement | null)?.href || '',
    );

    // Any option that is not the current one — the list is long and its contents
    // are data, so pick by position rather than hardcoding a theme name.
    const target = await page.evaluate(() => {
      const s = document.querySelector('.x-codecontrol__select') as HTMLSelectElement;
      const other = [...s.options].find((o) => o.value && o.value !== s.value);
      return other ? other.value : '';
    });
    expect(target, 'the theme list should offer more than one theme').not.toBe('');

    await select.selectOption(target);
    await page.waitForFunction(
      (was) => ((document.querySelector('link[data-highlight-theme]') as HTMLLinkElement | null)?.href || '') !== was,
      before,
      { timeout: 10_000 },
    );

    const after = await page.evaluate(
      () => (document.querySelector('link[data-highlight-theme]') as HTMLLinkElement | null)?.href || '',
    );
    expect(after).not.toBe(before);
    expect(after.toLowerCase()).toContain(target.toLowerCase().split('-')[0]);
  });

  test('x-code on a non-code host renders the code instead of refusing it', async ({ page }) => {
    await page.goto('/?page=behaviors', { waitUntil: 'domcontentloaded' });
    await page.locator('#behaviors-workspace').waitFor({ state: 'attached', timeout: 20_000 });

    const rendered = await page.evaluate(async () => {
      const host = document.createElement('div');
      host.setAttribute('x-code', '');
      host.setAttribute('language', 'javascript');
      host.textContent = 'const a = 1;\nconst b = 2;';
      document.body.appendChild(host);

      await (window as any).WB?.scan?.(document.body);
      await new Promise((r) => setTimeout(r, 400));

      const inner = host.querySelector('code');
      const out = {
        wrappedInRealCode: !!inner,
        text: (inner || host).textContent || '',
        // The point of #1013: presentation lives in the stylesheet, so the
        // rendered element carries no inline style of its own.
        inlineStyle: (inner || host).getAttribute('style') || '',
      };
      host.remove();
      return out;
    });

    expect(
      rendered.wrappedInRealCode,
      'x-code on a <div> host produced no <code>: the host was refused again (#1016).',
    ).toBe(true);
    expect(rendered.text).toContain('const a = 1;');
    expect(rendered.text).toContain('const b = 2;');
    expect(
      rendered.inlineStyle,
      'code.js is writing inline styles again (#1013) — presentation belongs in code.css, '
      + 'where a code theme can be seen past it.',
    ).toBe('');
  });
});

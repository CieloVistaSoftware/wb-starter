/**
 * Scratch audit script for issue #365 — NOT a real regression test, deleted
 * after the audit. Checks bare <wb-X> custom tags vs their x-* attribute
 * equivalents for the 15 remaining "inert" tags from the issue's list
 * (wb-behaviors/wb-views/wb-wizard/wb-search-index excluded — out of scope).
 */
import { test } from '@playwright/test';

const tags = ['autocomplete','behavior','colorpicker','counter','error','fieldset','file','fix-card','floatinglabel','formrow','help','inputgroup','label','masked','tags'];
const xAttrs = ['autocomplete','colorpicker','counter','error','fieldset','file','floatinglabel','formrow','help','inputgroup','label','masked','tags'];

test('audit 365 bare tags vs x-attrs', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push('console.error: ' + msg.text()); });

  await page.goto('/tests/fixtures/audit-365.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 20000 });
  await page.waitForFunction(() => (window as any).__wbDone === true, { timeout: 20000 });
  await page.waitForTimeout(500);

  console.log('=== Bare <wb-X> tags ===');
  for (const t of tags) {
    const sel = `#t-${t}`;
    const info = await page.locator(sel).evaluate((el: any) => ({
      className: el.className,
      childCount: el.children.length,
      innerHTML: el.innerHTML.trim().slice(0, 120),
      tagRegistered: !!customElements.get(el.tagName.toLowerCase())
    }));
    console.log(t.padEnd(14), JSON.stringify(info));
  }

  console.log('=== x-* attribute usage on native elements ===');
  for (const t of xAttrs) {
    const sel = `#x-${t}`;
    const info = await page.locator(sel).evaluate((el: any) => ({
      className: el.className,
      outerHTMLSnippet: el.outerHTML.slice(0, 160),
      parentChanged: el.parentElement ? el.parentElement.className : null,
    }));
    console.log(t.padEnd(14), JSON.stringify(info));
  }

  console.log('=== Console/page errors ===');
  console.log(errors.length ? errors.join('\n') : '(none)');
});

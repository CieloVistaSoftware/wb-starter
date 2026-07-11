import { test, expect, Page } from '@playwright/test';

/**
 * <wb-form> never worked at all — no mapping existed in tag-map.js or
 * wb-lazy.js's customElementMappings, so the `form` behavior never ran on
 * it (confirmed live: no class, no submit handler, completely inert).
 * Found while investigating docs/components/semantics/form.md, whose own
 * "AJAX Submission"/"Auto-Save"/"Custom Success Message" examples all use
 * <wb-form> exclusively.
 *
 * Fixed: registered wb-form -> form in both maps. Since <wb-form> is a
 * custom tag (not a real HTMLFormElement), form() now replaces it with a
 * genuine <form> carrying the same attributes and children before running
 * its usual ajax/validate logic — same wrapping approach as details.js.
 */
const BASE_URL = '/demos/test-harness.html';

async function injectAndScan(page: Page, html: string) {
  await page.goto(BASE_URL);
  await page.waitForFunction(
    () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
    { timeout: 10000 }
  );
  await page.evaluate((h: string) => {
    const container = document.createElement('div');
    container.id = 'wbform-test-container';
    container.innerHTML = h;
    document.body.appendChild(container);
  }, html);
  await page.locator('#wbform-test-container').scrollIntoViewIfNeeded();
  await page.evaluate(() => (window as any).WB.scan(document.getElementById('wbform-test-container')));
  await page.waitForTimeout(400);
}

test.describe('<wb-form> custom tag', () => {
  test('becomes a real <form> element, preserving attributes and children', async ({ page }) => {
    await injectAndScan(
      page,
      '<wb-form id="wf1" ajax action="/api/submit"><input name="email"><button type="submit">Send</button></wb-form>'
    );
    const tagName = await page.evaluate(() => document.getElementById('wf1')?.tagName);
    expect(tagName).toBe('FORM');
    await expect(page.locator('#wf1')).toHaveClass(/wb-form/);
    await expect(page.locator('#wf1 input[name="email"]')).toHaveCount(1);
    await expect(page.locator('#wf1 button[type="submit"]')).toHaveCount(1);
  });

  test('ajax submit dispatches wb:form:submit with real form data', async ({ page }) => {
    await injectAndScan(
      page,
      '<wb-form id="wf2" ajax action="/api/submit"><input name="email" value="a@b.com"><button type="submit">Send</button></wb-form>'
    );
    const result = await page.evaluate(() => {
      return new Promise((resolve) => {
        const el = document.getElementById('wf2')!;
        el.addEventListener('wb:form:submit', (e: any) => resolve(Object.fromEntries(e.detail.formData)));
        (el.querySelector('button') as HTMLButtonElement).click();
      });
    });
    expect(result).toEqual({ email: 'a@b.com' });
  });

  test('wbForm.getData() API works after the tag replacement', async ({ page }) => {
    await injectAndScan(
      page,
      '<wb-form id="wf3" action="/api/submit"><input name="name" value="Alice"></wb-form>'
    );
    const data = await page.evaluate(() => (document.getElementById('wf3') as any).wbForm.getData());
    expect(data).toEqual({ name: 'Alice' });
  });
});

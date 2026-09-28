/**
 * THE FORM · AJAX EXAMPLE SENDS, SAYS SO, AND THE EVENTS PANEL SHOWS THE ROUND TRIP
 * ================================================================================
 * #751 -- John: "Example should notify the user after it is sent. nothing
 * happens now." Closed 2026-09-07 with no test, and it never worked: the fix
 * (success message, wb:form:success) was written into
 * packages/create-wb-starter/template/src/wb-viewmodels/semantics/form.js,
 * a file no runtime loads -- both map `form` to wb-viewmodels/form.js.
 *
 * Reported again 2026-09-28 (screenshot of the Events panel): "are these the
 * right events?" They were not. Measured on the behaviors page:
 *
 *   before touching it   6 x wb:ready -- every child announcing it was built
 *   after Send           submit, wb:form:submit, wb:form:error -- no request
 *                        left the page: fetch() got method "get" (a <form>'s
 *                        .method property when no method= is written) with a
 *                        body, and threw
 *   button label         "action: /api/demo-form · successMessage: Sent —
 *                        check the events panel below." -- the form's own
 *                        attributes, written over the button's text
 */
import { test, expect, Page } from '../fixtures/offline';

async function showFormAjax(page: Page) {
  await page.goto('/?page=behaviors');
  const row = page.locator('.behaviors-search-results__row[data-label="form"][data-prop="ajax"]').first();
  await expect(row).toBeAttached({ timeout: 30_000 });
  const group = page.locator('#behaviors-search-results details', { has: row });
  if (!(await group.first().evaluate((d) => (d as HTMLDetailsElement).open))) {
    await group.first().locator(':scope > summary').click();
  }
  await row.click();
  const form = page.locator('#behaviors-live-example form');
  await expect(form).toHaveAttribute('x-ready', '');
  return form;
}

const loggedTypes = (page: Page) => page.$$eval(
  '#behaviors-live-events-log .behaviors-live__events-type', (els) => els.map((e) => e.textContent || ''));

test('the example\'s button says what it does, not the form\'s attributes', async ({ page }) => {
  const form = await showFormAjax(page);
  await expect(form.locator('button[type="submit"]')).toHaveText('Send');
});

test('the Events panel logs what the reader does, not every child being built', async ({ page }) => {
  await showFormAjax(page);
  expect(await loggedTypes(page), 'nothing has been touched yet').not.toContain('wb:ready');
});

test('Send posts, shows the success message, and logs submit -> wb:form:submit -> wb:form:success', async ({ page }) => {
  const form = await showFormAjax(page);
  await form.locator('input[type="email"]').fill('reader@example.com');
  await form.locator('textarea').fill('hello');

  const posted = page.waitForRequest((r) => r.method() === 'POST' && r.url().endsWith('/api/demo-form'));
  await form.locator('button[type="submit"]').click();
  await posted;

  await expect(form.locator('.x-form__message--success')).toHaveText('Sent — check the events panel below.');
  await expect.poll(() => loggedTypes(page)).toContain('wb:form:success');
  const types = await loggedTypes(page);
  expect(types, 'the error path must not run').not.toContain('wb:form:error');
  // Newest first: success after submit.
  expect(types.indexOf('wb:form:success')).toBeLessThan(types.indexOf('wb:form:submit'));
});

test('a <form ajax> with no method= submits as POST, not the .method default "get"', async ({ page }) => {
  await page.goto('/');
  await page.setContent(`
    <form ajax action="/api/demo-form" successmessage="Done">
      <input name="q" value="x"><button type="submit">Send</button>
    </form>`);
  await page.addScriptTag({
    type: 'module',
    content: `
      import WB from '/src/core/wb-lazy.js';
      await WB.init({ autoInject: true });
      await WB.scan(document.body, { eager: true });
      document.body.dataset.built = '1';
    `,
  });
  await page.waitForFunction(() => document.body.dataset.built === '1');
  const events: string[] = [];
  await page.exposeFunction('record', (t: string) => events.push(t));
  await page.evaluate(() => ['wb:form:submit', 'wb:form:success', 'wb:form:error']
    .forEach((t) => document.addEventListener(t, () => (window as any).record(t))));

  const posted = page.waitForRequest((r) => r.url().endsWith('/api/demo-form'));
  await page.locator('button').click();
  expect((await posted).method()).toBe('POST');
  await expect(page.locator('.x-form__message--success')).toHaveText('Done');
  await expect.poll(() => events).toEqual(['wb:form:submit', 'wb:form:success']);
});

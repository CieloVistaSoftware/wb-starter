import { test, expect } from '../fixtures/offline';

/**
 * A behavior that wraps a form control must not take the reader's focus (#961).
 *
 * input.js (and every other behavior that puts a control inside a wrapper)
 * re-parents the element with insertBefore + appendChild. Removing a focused
 * element blurs it, and re-inserting it does not focus it again, so a reader
 * who started typing into a freshly rendered form while it was still being
 * upgraded typed into <body>. Measured on demos/playground.html: Full Name was
 * focused, wrapped, and left empty; the form's `required` check then blocked
 * the submit and the "Endpoint sees" panel never appeared (2 runs in 40 under
 * CPU load, playground-endpoint-panel-reset.spec.ts).
 *
 * src/core/keep-focus.js restores focus and the caret in the same task as the
 * move. Each case focuses a control, puts the caret somewhere specific, lets
 * its behavior wrap it, and checks that typing would still land in it.
 */
const CASES: { name: string; markup: string; wrapper: string }[] = [
  { name: 'native <input> (input.js)', markup: '<input type="text" value="hello world">', wrapper: '.x-input__wrapper--native' },
  { name: '<input x-search> (search.js)', markup: '<input type="search" x-search value="hello world">', wrapper: '.x-search__wrapper' },
  { name: '<input type="password"> (password.js)', markup: '<input type="password" value="hello world">', wrapper: '.x-password' },
  { name: '<textarea show-count> (textarea.js)', markup: '<textarea show-count maxlength="40">hello world</textarea>', wrapper: '.x-textarea__wrapper' },
];

for (const c of CASES) {
  test(`${c.name}: wrapping it while it has focus keeps the focus and the caret`, async ({ page }) => {
    await page.goto('/demos/test-harness.html');
    await page.waitForFunction(() => (window as any).WB?.behaviors, null, { timeout: 20_000 });
    const r = await page.evaluate(async ({ markup, wrapper }) => {
      const host = document.createElement('div');
      host.innerHTML = markup;
      document.body.appendChild(host);
      const field = host.firstElementChild as HTMLInputElement;
      field.focus();
      field.setSelectionRange(2, 5);
      const { getConfig, setConfig } = await import('/src/core/config.js');
      const before = getConfig('autoInject');
      setConfig('autoInject', true);
      try {
        await (window as any).WB.scan(host, { eager: true });
      } finally {
        setConfig('autoInject', before);
      }
      return {
        wrapped: !!field.closest(wrapper),
        focused: document.activeElement === field,
        caret: [field.selectionStart, field.selectionEnd],
      };
    }, { markup: c.markup, wrapper: c.wrapper });
    expect(r.wrapped, `the behavior must have wrapped it (${c.wrapper}), or this checks nothing`).toBe(true);
    expect(r.focused, 'the field still has focus after the wrap').toBe(true);
    expect(r.caret, 'the caret and selection are where the reader left them').toEqual([2, 5]);
  });
}

test('a field typed into while its behavior wraps it keeps every character', async ({ page }) => {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, null, { timeout: 20_000 });
  await page.evaluate(() => {
    const host = document.createElement('div');
    host.id = 'typing-961';
    host.innerHTML = '<input type="text" name="fullName">';
    document.body.appendChild(host);
    (host.firstElementChild as HTMLInputElement).focus();
  });
  await page.keyboard.type('Test');
  await page.evaluate(async () => {
    const host = document.getElementById('typing-961')!;
    const { getConfig, setConfig } = await import('/src/core/config.js');
    const before = getConfig('autoInject');
    setConfig('autoInject', true);
    try {
      await (window as any).WB.scan(host, { eager: true });
    } finally {
      setConfig('autoInject', before);
    }
  });
  await page.keyboard.type(' User');
  const field = page.locator('#typing-961 input[name="fullName"]');
  await expect(field.locator('xpath=..'), 'the field was wrapped between the two halves').toHaveClass(/x-input__wrapper--native/);
  await expect(field).toHaveValue('Test User');
});

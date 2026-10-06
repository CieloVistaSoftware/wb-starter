import { test, expect, Page } from '../fixtures/offline';

/**
 * A dialog always has an exit (#794).
 *
 * John: "All dialogs must ... have an exit button", then "perhaps the user wants
 * to only allow esc press? to exit?", then the rule: "if showClose is false,
 * then using the esc button would be mandatory."
 *
 * So the one permutation that traps a user,
 *
 *   showClose="false" closeOnEscape="false" closeOnBackdrop="false"
 *
 * must still close on Escape, and say why in the console. Checked on both
 * paths dialog.js builds a dialog on: an authored <dialog> enhanced in place,
 * and a dialog built from a trigger button.
 */
const TRAP = 'showClose="false" closeOnEscape="false" closeOnBackdrop="false"';

async function setup(page: Page, html: string) {
  const warnings: string[] = [];
  page.on('console', (m) => { if (m.type() === 'warning') warnings.push(m.text()); });
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, null, { timeout: 20_000 });
  await page.evaluate(async (h) => {
    const host = document.createElement('div');
    host.id = 'exit-area';
    host.innerHTML = h;
    document.body.appendChild(host);
    await (window as any).WB.scan(host, { eager: true });
  }, html);
  return warnings;
}

test('an authored <dialog> with every exit turned off still closes on Escape', async ({ page }) => {
  const warnings = await setup(page, `<dialog id="trap" ${TRAP}><h2>Trap</h2><p>body</p></dialog>`);
  await expect(page.locator('#trap > header.x-dialog__header')).toHaveCount(1);
  await page.evaluate(() => (document.getElementById('trap') as HTMLDialogElement).showModal());
  await expect(page.locator('#trap .x-dialog__close'), 'showClose="false" is honoured').toHaveCount(0);

  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => (document.getElementById('trap') as HTMLDialogElement).open))
    .toBe(false);
  expect(warnings.some((w) => w.includes('#794')), 'the author is told why Escape stayed on').toBe(true);
});

test('a dialog built from a trigger with every exit turned off still closes on Escape', async ({ page }) => {
  await setup(page, `<button id="opener" x-dialog modalTitle="Trap" modalContent="body" ${TRAP}>Open</button>`);
  await page.locator('#opener').click();
  const dlg = page.locator('dialog.x-dialog[open]');
  await expect(dlg).toHaveCount(1);
  await expect(dlg.locator('.x-dialog__close')).toHaveCount(0);

  await page.keyboard.press('Escape');
  await expect(page.locator('dialog.x-dialog[open]')).toHaveCount(0);
});

test('closeOnEscape="false" is still honoured while the close button shows', async ({ page }) => {
  const warnings = await setup(page, '<dialog id="keep" closeOnEscape="false"><h2>Keep</h2><p>body</p></dialog>');
  await expect(page.locator('#keep > header.x-dialog__header')).toHaveCount(1);
  await page.evaluate(() => (document.getElementById('keep') as HTMLDialogElement).showModal());
  await expect(page.locator('#keep .x-dialog__close')).toHaveCount(1);
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => (document.getElementById('keep') as HTMLDialogElement).open)).toBe(true);
  expect(warnings.filter((w) => w.includes('#794'))).toEqual([]);
});

test('the content part is <main class="x-dialog__main">, the name every card uses', async ({ page }) => {
  await setup(page, '<dialog id="parts"><h2>Parts</h2><p>body</p></dialog>');
  await expect(page.locator('#parts > main.x-dialog__main')).toHaveCount(1);
  await expect(page.locator('#parts .x-dialog__body')).toHaveCount(0);
});

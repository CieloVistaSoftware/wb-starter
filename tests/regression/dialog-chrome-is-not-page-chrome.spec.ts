import { test, expect } from '../fixtures/offline';

/**
 * A DIALOG'S HEADER AND FOOTER ARE ITS OWN CHROME, NOT THE PAGE'S (#874)
 * =====================================================================
 * dialog.js builds the dialog chrome from real <header> and <footer> elements.
 * Those tags also map to the page-level header() and footer() behaviors, and
 * wb.js only kept a landmark out of them when it sat inside an article, a card
 * or a BEM part -- not inside a <dialog>. So every dialog header came out
 * class="x-dialog__header x-header" and took the page navbar's styling: 0.8em
 * text, min-height 60px, and (until header.css was fixed) zero vertical
 * padding, which put a wrapped title 0.74px from the edge. The footer got
 * x-footer the same way, harmless only while footer.css set no padding.
 *
 * See it by hand: open /demos/test-harness.html, add
 * <button x-modal modal-title="Hello">Open</button>, click it, and inspect the
 * dialog's header. Before: class "x-dialog__header x-header" and 12.8px text.
 * Now: class "x-dialog__header" and the page's own text size.
 */

test.describe('dialog chrome is not page chrome (#874)', () => {
  test('the x-modal dialog header and footer get no page header/footer behavior', async ({ page }) => {
    await page.goto('/demos/test-harness.html', { waitUntil: 'load' });
    await page.waitForFunction(() => !!(window as any).WB?.scan, null, { timeout: 15_000 });

    const chrome = await page.evaluate(async () => {
      const btn = document.createElement('button');
      btn.setAttribute('x-modal', '');
      btn.setAttribute('size', 'sm');
      btn.setAttribute('modal-title', 'A deliberately long dialog title that wraps onto several lines in a narrow box');
      btn.setAttribute('modal-content', '<p>body</p>');
      btn.textContent = 'Open';
      document.body.appendChild(btn);
      await (window as any).WB.scan(btn.parentElement, { eager: true });
      btn.click();
      await new Promise((r) => setTimeout(r, 50));
      // Let any auto-inject pass that would reach the chrome finish first.
      await (window as any).WB.settled?.({ timeout: 5000 });
      const dialog = document.querySelector('dialog[open]');
      const header = dialog?.querySelector('.x-dialog__header') as HTMLElement | null;
      const footer = dialog?.querySelector('.x-dialog__footer') as HTMLElement | null;
      return {
        open: !!dialog,
        header: header?.className ?? null,
        footer: footer?.className ?? null,
        headerFont: header ? getComputedStyle(header).fontSize : null,
        dialogFont: dialog ? getComputedStyle(dialog).fontSize : null,
      };
    });

    expect(chrome.open, 'the dialog never opened').toBe(true);
    expect(chrome.header, 'the dialog header took the page navbar behavior').not.toMatch(/(^|\s)x-header(\s|$)/);
    expect(chrome.footer, 'the dialog footer took the page footer behavior').not.toMatch(/(^|\s)x-footer(\s|$)/);
    expect(chrome.headerFont, 'the dialog header text was shrunk by the navbar rule (0.8em)').toBe(chrome.dialogFont);
  });

  test('a page-level <header> still gets the header behavior', async ({ page }) => {
    await page.goto('/demos/test-harness.html', { waitUntil: 'load' });
    await page.waitForFunction(() => !!(window as any).WB?.scan, null, { timeout: 15_000 });
    const cls = await page.evaluate(async () => {
      const h = document.createElement('header');
      h.textContent = 'Site';
      document.body.prepend(h);
      await (window as any).WB.scan(document.body, { eager: true });
      return h.className;
    });
    expect(cls, 'the change must not stop page landmarks from getting their behavior').toMatch(/(^|\s)x-header(\s|$)/);
  });
});

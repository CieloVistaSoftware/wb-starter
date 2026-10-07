import { test, expect } from '../fixtures/offline';

/**
 * #702 -- x-dropdown position start/end render 2px apart.
 *
 * dropdown() added `.x-dropdown--trigger` (button padding and border) to the
 * host even after it had built a real `<button class="x-dropdown__trigger">`
 * inside it. The host became a padded button around a button, grew to the
 * menu's width, and `left: 0` / `right: 0` -- bottom-start / bottom-end --
 * resolved against a box barely wider than the menu: 2px apart.
 *
 * The class belongs only to a host whose own text IS the trigger (no label,
 * no element children). Both halves are held here.
 *
 * See it by hand: Open Behaviors (?page=behaviors), pick dropdown and compare
 * position="bottom-start" with position="bottom-end". Before: both menus
 * opened in nearly the same place, 2px apart. Now: one hangs from the host's
 * left edge and the other from its right edge.
 */
test.describe('x-dropdown host styling (#702)', () => {
  test('a host with a built trigger is not padded as one, and start/end visibly differ', async ({ page }) => {
    await page.goto('/demos/site/overlays.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => (window as any).WB?.scan, undefined, { timeout: 20000 });

    const result = await page.evaluate(async () => {
      const host = document.createElement('div');
      host.innerHTML =
        '<div id="dd702-start" x-dropdown label="Go" position="bottom-start" ' +
        'items="A much longer menu item,Settings,Logout"></div> ' +
        '<div id="dd702-end" x-dropdown label="Go" position="bottom-end" ' +
        'items="A much longer menu item,Settings,Logout"></div>';
      document.body.appendChild(host);
      await (window as any).WB.scan(host, { eager: true });

      const measure = async (id: string) => {
        const dd = document.getElementById(id)!;
        (dd.querySelector('.x-dropdown__trigger') as HTMLElement).click();
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const menu = dd.querySelector('.x-dropdown__menu') as HTMLElement;
        const h = dd.getBoundingClientRect();
        const m = menu.getBoundingClientRect();
        return {
          hostClassed: dd.classList.contains('x-dropdown--trigger'),
          hostWidth: h.width,
          menuWidth: m.width,
          menuLeftFromHost: m.left - h.left,
        };
      };
      return { start: await measure('dd702-start'), end: await measure('dd702-end') };
    });

    expect(result.start.hostClassed, 'a host with a built trigger must not carry .x-dropdown--trigger').toBe(false);
    expect(result.end.hostClassed).toBe(false);
    // With the menu wider than the host, bottom-start hangs from the left edge
    // and bottom-end from the right, so their offsets differ by the overhang.
    expect(result.start.menuWidth, 'precondition: the menu is wider than its host').toBeGreaterThan(result.start.hostWidth + 10);
    expect(
      Math.abs(result.start.menuLeftFromHost - result.end.menuLeftFromHost),
      `bottom-start and bottom-end must land visibly apart (${JSON.stringify(result)})`,
    ).toBeGreaterThan(10);
  });

  test('a bare-text host keeps its button affordance', async ({ page }) => {
    await page.goto('/demos/site/overlays.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => (window as any).WB?.scan, undefined, { timeout: 20000 });

    const classed = await page.evaluate(async () => {
      const host = document.createElement('div');
      host.innerHTML = '<div id="dd702-bare" x-dropdown items="One,Two">Open me</div>';
      document.body.appendChild(host);
      await (window as any).WB.scan(host, { eager: true });
      return document.getElementById('dd702-bare')!.classList.contains('x-dropdown--trigger');
    });
    expect(classed, 'the host whose own text is the trigger must keep .x-dropdown--trigger').toBe(true);
  });
});

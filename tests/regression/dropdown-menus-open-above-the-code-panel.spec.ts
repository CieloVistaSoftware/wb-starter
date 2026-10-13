/**
 * An open dropdown in a doc example is drawn on top, whole (#1862).
 *
 * John, 2026-10-13: "every dropdown example on dropdown.md opens behind the
 * code window." `.x-demo__grid` has `contain: layout` (#647), which makes it a
 * stacking context, so the menu's z-index only counted inside the grid and the
 * source panel after it painted over the open menu. The bottom-end example's
 * menu also ran past the page content's left edge and was cut off there.
 *
 * Every dropdown example on the page is opened, and every item of its menu must
 * be the topmost thing at its own position, and the menu must lie inside the
 * box that would cut it off (its nearest clipping ancestor, or the viewport).
 */
import { test, expect } from '../fixtures/offline';
import { settlePage } from '../base';

test('every dropdown example on dropdown.md opens above the code panel, inside the page', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/public/doc-viewer.html?file=docs/behaviors/dropdown.md');
  await settlePage(page);

  const hosts = page.locator('#content [x-dropdown]');
  await expect(hosts.first()).toBeVisible();
  const count = await hosts.count();
  expect(count, 'dropdown examples on dropdown.md').toBeGreaterThan(3);

  const problems: string[] = [];
  for (let i = 0; i < count; i++) {
    const host = hosts.nth(i);
    // The control a reader clicks: the host itself when it is the trigger,
    // otherwise the trigger the behavior built inside it.
    const trigger = (await host.getAttribute('aria-expanded')) !== null
      ? host
      : host.locator('[aria-expanded]').first();
    if (!(await trigger.isVisible())) continue;
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    const menu = host.locator('.x-dropdown__menu--open');
    await expect(menu, `example ${i + 1} opens`).toBeVisible();

    const label = ((await trigger.textContent()) || '').trim();
    const found = await menu.evaluate((m) => {
      const out: string[] = [];
      // What would cut it off: the nearest ancestor that clips horizontally,
      // or the viewport.
      let box = { left: 0, right: document.documentElement.clientWidth, name: 'the viewport' };
      for (let a = m.parentElement?.parentElement; a && a !== document.body; a = a.parentElement) {
        if (getComputedStyle(a).overflowX !== 'visible') {
          const b = a.getBoundingClientRect();
          box = { left: b.left, right: b.right, name: `<${a.tagName.toLowerCase()} class="${a.className}">` };
          break;
        }
      }
      const r = m.getBoundingClientRect();
      if (r.left < box.left - 1) out.push(`menu starts ${Math.round(box.left - r.left)}px left of ${box.name}, which cuts it off`);
      if (r.right > box.right + 1) out.push(`menu ends ${Math.round(r.right - box.right)}px right of ${box.name}, which cuts it off`);
      for (const item of Array.from(m.children) as HTMLElement[]) {
        const b = item.getBoundingClientRect();
        if (!b.width || !b.height) continue;
        const x = b.left + b.width / 2;
        const y = b.top + b.height / 2;
        if (y < 0 || y > innerHeight) continue;
        const top = document.elementFromPoint(x, y);
        if (!top || !m.contains(top)) {
          out.push(`"${(item.textContent || '').trim()}" is covered by <${top?.tagName.toLowerCase()} class="${top?.className}">`);
        }
      }
      return out;
    });
    for (const f of found) problems.push(`"${label}": ${f}`);
    await page.keyboard.press('Escape');
    await page.mouse.click(5, 5);
  }
  expect(problems, 'open dropdown menus that are covered or cut off').toEqual([]);
});

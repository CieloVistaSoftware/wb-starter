import { test, expect } from '@playwright/test';

/**
 * REGRESSION (#1034): the API and Docs panels must open OVER the live pane.
 *
 * John, twice, with an arrow drawn from the header buttons to the preview pane:
 * "Open in this element only." — "i don't want them to open anywhere but here."
 *
 * WHY THIS GUARD DID NOT EXIST, AND WHY THAT MATTERED. The fix landed twice and
 * was reported broken twice. The verification recorded in f47e46ba's own commit
 * message was "API covers the stage exactly (960px over a 258px stage)" — a
 * WIDTH comparison, which passes just as happily when the box is 276px to the
 * left of the thing it is supposed to cover. This asserts the whole rectangle.
 *
 * It also opens the panels the way a person does — clicking the <summary> —
 * rather than setting `.open`, because the toggle path carries real logic
 * (exclusivePanels closes the sibling, and a measured header height is
 * published to CSS on every toggle).
 *
 * TOLERANCE. 2px, for sub-pixel layout rounding. Not more: the failure this
 * pins was a quarter of the viewport out of place, and a generous tolerance is
 * how "tall in the header" passed for "over the pane" the first time.
 */

const TOL = 2;
const PANE = '.behaviors-live__body';

for (const [label, panelId, bodyId] of [
  ['API', '#behaviors-live-api', '#behaviors-live-api-body'],
  ['Docs', '#behaviors-live-doc', '#behaviors-live-doc-body'],
] as const) {
  test(`${label} opens over the live pane, not somewhere else`, async ({ page }) => {
    await page.goto('/?page=behaviors');

    // The pane only exists once the workspace has rendered a behavior.
    const pane = page.locator(PANE);
    await expect(pane, 'the pane the panels must cover must exist').toBeVisible({ timeout: 15000 });

    const summary = page.locator(`${panelId} > summary`);
    await expect(summary, `${label} must have a clickable summary`).toBeVisible();

    // Precondition: closed panels are not showing.
    await expect(page.locator(bodyId)).toBeHidden();

    await summary.click();

    const body = page.locator(bodyId);
    await expect(body, `${label} must be visible after its summary is clicked`).toBeVisible();

    const [panelBox, paneBox] = await Promise.all([body.boundingBox(), pane.boundingBox()]);
    expect(panelBox, 'the panel must have a box').not.toBeNull();
    expect(paneBox, 'the pane must have a box').not.toBeNull();

    const delta = {
      left: Math.round(panelBox!.x - paneBox!.x),
      top: Math.round(panelBox!.y - paneBox!.y),
      width: Math.round(panelBox!.width - paneBox!.width),
      height: Math.round(panelBox!.height - paneBox!.height),
    };

    expect(
      Math.abs(delta.left) <= TOL && Math.abs(delta.top) <= TOL &&
      Math.abs(delta.width) <= TOL && Math.abs(delta.height) <= TOL,
      `${label} must cover the pane exactly. delta=${JSON.stringify(delta)} ` +
      `panel=${JSON.stringify(panelBox)} pane=${JSON.stringify(paneBox)}`
    ).toBe(true);

    // Covering is not only about the rectangle: the panel must actually be ON
    // TOP. A correctly sized box painted underneath the example is still the
    // bug. Hit-test the pane's centre.
    const topmostIsPanel = await page.evaluate(({ sel, paneSel }) => {
      const p = document.querySelector(paneSel)!.getBoundingClientRect();
      const el = document.elementFromPoint(Math.round(p.left + p.width / 2), Math.round(p.top + p.height / 2));
      const panel = document.querySelector(sel)!;
      return !!el && (el === panel || panel.contains(el));
    }, { sel: bodyId, paneSel: PANE });

    expect(topmostIsPanel, `${label} must be the topmost element at the centre of the pane`).toBe(true);

    // And it closes again from the same control, which is the only way back.
    await summary.click();
    await expect(body, `${label} must close from its own summary`).toBeHidden();
  });
}

test('opening one panel closes the other — two overlays would stack', async ({ page }) => {
  await page.goto('/?page=behaviors');
  await expect(page.locator(PANE)).toBeVisible({ timeout: 15000 });

  await page.locator('#behaviors-live-api > summary').click();
  await expect(page.locator('#behaviors-live-api-body')).toBeVisible();

  await page.locator('#behaviors-live-doc > summary').click();
  await expect(page.locator('#behaviors-live-doc-body')).toBeVisible();
  await expect(
    page.locator('#behaviors-live-api-body'),
    'the API panel must close when Docs opens, or the lower overlay is unreachable'
  ).toBeHidden();
});

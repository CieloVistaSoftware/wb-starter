import { test, expect } from '../fixtures/offline';

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

    // Both boxes from ONE frame, polled until the panel has finished opening:
    // two boundingBox() round trips caught the pane mid-resize in the loaded
    // pre-commit gate (height 13px apart). Covering the pane once open is the
    // requirement; a frame of the open transition is not.
    const read = () => page.evaluate(([b, p]) => {
      const r = (q: string) => { const x = document.querySelector(q)!.getBoundingClientRect(); return { x: x.x, y: x.y, width: x.width, height: x.height }; };
      return { panelBox: r(b), paneBox: r(p) };
    }, [bodyId, PANE] as const);
    const covers = (s: { panelBox: any; paneBox: any }) =>
      ['x', 'y', 'width', 'height'].every((k) => Math.abs(s.panelBox[k] - s.paneBox[k]) <= TOL);
    await expect.poll(async () => covers(await read())).toBe(true);
    const { panelBox, paneBox } = await read();

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
    // bug. Hit-test the centre of the part of the pane that is ON SCREEN
    // (#1175): elementFromPoint returns null for a point outside the viewport,
    // and the pane's height follows the loaded example, so its own centre was
    // sometimes below the fold -- 3 of 18 runs "hit nothing" with the panel
    // visible and on top. No on-screen part at all is its own failure.
    const probe = await page.evaluate(({ sel, paneSel }) => {
      // No scrolling: moving the page here pushed the panel's own summary out
      // from under the pointer, and the close click after this waited forever.
      // The visible part of the pane is what a reader sees anyway.
      const p = document.querySelector(paneSel)!.getBoundingClientRect();
      const left = Math.max(p.left, 0), right = Math.min(p.right, window.innerWidth);
      const top = Math.max(p.top, 0), bottom = Math.min(p.bottom, window.innerHeight);
      if (right <= left || bottom <= top) return { onScreen: false, topmost: false };
      const el = document.elementFromPoint(Math.round((left + right) / 2), Math.round((top + bottom) / 2));
      const panel = document.querySelector(sel)!;
      return { onScreen: true, topmost: !!el && (el === panel || panel.contains(el)) };
    }, { sel: bodyId, paneSel: PANE });

    expect(probe.onScreen, `${label}: no part of the pane is on screen to hit-test`).toBe(true);
    expect(probe.topmost, `${label} must be the topmost element over the visible pane`).toBe(true);

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

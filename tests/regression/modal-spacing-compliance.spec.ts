/**
 * Modal / Dialog Spacing Compliance — rewritten under #871
 * =========================================================
 * The rule: a WB dialog must never look cramped —
 *   - at least 1rem of padding around its content
 *   - at least 0.5rem between adjacent action buttons
 *   - at least 1rem between the title and the body content
 *
 * WHY THIS FILE WAS REWRITTEN (#871)
 * ----------------------------------
 * As committed (3d6fd912) this spec never navigated anywhere, and — unlike the
 * rest of the about:blank family — it was not vacuously green. It was RED, and
 * had been since the day it landed: 3 failed / 1 passed on `--project=regression`.
 *
 * Three of the four tests built a bare <dialog>, styled it with deliberately
 * non-compliant inline values (the source annotated them `// FAIL: less than
 * 1rem`), and then asserted compliance on the element they had just made
 * non-compliant. page.evaluate() works fine on about:blank, so they really ran
 * and really failed — 12px is never >= 16px. They measured the test's own
 * inline styles and never touched a shipped WB component. The fourth was the
 * vacuous one: `page.locator('dialog, .modal, [role="dialog"]').count()` is 0
 * on about:blank, so its loop never ran and it asserted that an empty array is
 * empty.
 *
 * WHAT IT ASSERTS NOW
 * -------------------
 * The real component. src/wb-viewmodels/semantics/dialog.js builds
 *
 *   dialog.x-dialog
 *     header.x-dialog__header  >  h2.x-dialog__title + button.x-dialog__close
 *     main.x-dialog__body
 *     footer.x-dialog__footer  >  button.x-dialog__cancel + button.x-dialog__ok
 *
 * and src/styles/behaviors/dialog.css sets the spacing: header `1rem 1.5rem`,
 * body `1.5rem`, footer `1rem 1.5rem` with `gap: 1rem`.
 *
 * Two deliberate departures from the original assertions, both because the old
 * ones demanded the opposite of what ships:
 *
 *   - `.x-dialog` itself has `padding: 0` by design; the padding lives on the
 *     three regions. `dialog { padding >= 1rem }` can never pass.
 *   - `.x-dialog__title` has `margin: 0` by design; its separation from the
 *     body comes from the header's padding-bottom plus its border-bottom.
 *     `h2 { margin-bottom >= 1rem }` can never pass either, so the measured
 *     distance is asserted instead.
 *
 * KNOWN FAILURE — see the last test
 * ---------------------------------
 * The final test is red against a real product defect found while writing this
 * file, not against the test. dialog.js creates a native <header>, WB's
 * autoInject gives it the `header` behavior, and `.x-header`'s
 * `padding: 0 1.5rem` (src/styles/behaviors/header.css) overrides
 * `.x-dialog__header`'s `padding: 1rem 1.5rem`. The dialog header therefore has
 * ZERO vertical padding; it only looks correct because `.x-header` also brings
 * `min-height: 60px`, which happens to leave room for a single-line title. Give
 * the dialog a title that wraps and the text sits flush against the header
 * edges — measured at 0.74px above and 0.86px below. Fixing it means touching
 * src/, which is outside this change; the test names the defect rather than
 * being weakened to accommodate it.
 */

import { test, expect, type Page, type Locator } from '@playwright/test';

/** Boots WB, and carries data-x-expected-errors. */
const HARNESS = '/demos/test-harness.html';

/** 1rem and 0.5rem at the default 16px root. */
const MIN_PADDING = 16;
const MIN_GAP = 8;

const SIZES = ['sm', 'md', 'lg', 'xl'] as const;

const SHORT_TITLE = 'Spacing Check';
/**
 * Long enough to wrap past the height of the close button, which is what makes
 * the header's missing vertical padding visible: below that height the row is
 * held open by `.x-header`'s min-height and the button, and the title looks fine
 * by accident.
 */
const WRAPPING_TITLE =
  'A deliberately very long dialog title that will certainly wrap onto several lines inside a narrow dialog box';

interface Rect { top: number; right: number; bottom: number; left: number; width: number; height: number }
interface Padding { top: number; right: number; bottom: number; left: number }

/**
 * page.goto() resolves happily on a 404, so a green run against a page that no
 * longer exists proves nothing. Assert the status, then wait for WB.
 */
async function gotoHarness(page: Page): Promise<void> {
  const response = await page.goto(HARNESS, { waitUntil: 'domcontentloaded' });
  expect(response, `no response for ${HARNESS}`).not.toBeNull();
  expect(
    response!.status(),
    `${HARNESS} must exist — page.goto() does not throw on a 404, so a missing harness would look like a pass`,
  ).toBe(200);
  await page.waitForFunction(() => typeof (window as never as { WB?: { scan?: unknown } }).WB?.scan === 'function');
}

/**
 * Author the shipped trigger form, hydrate it, click it, and wait for the real
 * dialog. WB.scan() is async, so the wait is an auto-retrying matcher rather
 * than a one-shot count().
 */
async function openDialog(page: Page, size: string = 'md', title: string = SHORT_TITLE): Promise<Locator> {
  await page.evaluate(async ({ sizeVal, titleVal }) => {
    const host = document.createElement('div');
    host.id = 'x-871-trigger-host';
    const trigger = document.createElement('button');
    trigger.setAttribute('x-modal', '');
    trigger.setAttribute('size', sizeVal);
    trigger.setAttribute('modal-title', titleVal);
    trigger.setAttribute('modal-content', '<p>Dialog body content that must not sit against the edge.</p>');
    trigger.textContent = 'Open';
    host.appendChild(trigger);
    document.body.appendChild(host);
    await (window as unknown as { WB: { scan: (r: Element, o: object) => Promise<void> } }).WB.scan(host, { eager: true });
  }, { sizeVal: size, titleVal: title });

  const trigger = page.locator('#x-871-trigger-host button');
  await expect(trigger, 'x-modal must hydrate its trigger').toHaveClass(/x-dialog-trigger/);
  await trigger.click();

  const dialog = page.locator('dialog.x-dialog[open]');
  await expect(dialog, 'clicking an x-modal trigger must open the shipped dialog').toHaveCount(1);
  await expect(dialog.locator('.x-dialog__title'), 'the dialog must carry the authored title').toHaveText(title);
  return dialog;
}

/** Close and clear, so the next open measures its own dialog rather than stacking. */
async function closeDialog(page: Page, dialog: Locator): Promise<void> {
  await dialog.evaluate((el: HTMLDialogElement) => { el.close(); el.remove(); });
  await page.evaluate(() => document.getElementById('x-871-trigger-host')?.remove());
  await expect(page.locator('dialog.x-dialog[open]')).toHaveCount(0);
}

const paddingOf = (el: Locator): Promise<Padding> =>
  el.evaluate((node) => {
    const s = getComputedStyle(node);
    return {
      top: parseFloat(s.paddingTop),
      right: parseFloat(s.paddingRight),
      bottom: parseFloat(s.paddingBottom),
      left: parseFloat(s.paddingLeft),
    };
  });

const rectOf = (el: Locator): Promise<Rect> =>
  el.evaluate((node) => {
    const r = node.getBoundingClientRect();
    return { top: r.top, right: r.right, bottom: r.bottom, left: r.left, width: r.width, height: r.height };
  });

/**
 * How much clear space a child leaves inside its container, per side.
 *
 * Rounded to whole pixels: line-height resolves to fractional values, so a
 * button whose box ends 0.25px past its container's padding box is a rounding
 * artifact, not a spacing violation. Nothing here rounds away as much as a
 * pixel of real space.
 */
function insets(container: Rect, child: Rect): Padding {
  return {
    top: Math.round(child.top - container.top),
    right: Math.round(container.right - child.right),
    bottom: Math.round(container.bottom - child.bottom),
    left: Math.round(child.left - container.left),
  };
}

/**
 * The body is where authored content lands, so it must clear 1rem on every
 * side. The header and footer are fixed-height chrome rows whose vertical
 * breathing room is asserted by measurement below; here they are checked for
 * the horizontal padding that keeps text off the dialog's edges.
 */
async function collectPaddingViolations(dialog: Locator, label: string): Promise<string[]> {
  const found: string[] = [];

  const body = dialog.locator('.x-dialog__body');
  await expect(body, `${label}: dialog.js must build a body`).toHaveCount(1);
  const bodyPadding = await paddingOf(body);
  for (const [side, value] of Object.entries(bodyPadding)) {
    if (value < MIN_PADDING) found.push(`${label} body padding-${side} = ${value}px`);
  }

  const footer = dialog.locator('.x-dialog__footer');
  await expect(footer, `${label}: dialog.js must build a footer`).toHaveCount(1);
  const footerPadding = await paddingOf(footer);
  for (const [side, value] of Object.entries(footerPadding)) {
    if (value < MIN_PADDING) found.push(`${label} footer padding-${side} = ${value}px`);
  }

  // Header: horizontal only here. Its vertical spacing has its own test at the
  // bottom of this file, because it is currently defective and needs to fail
  // with a message that names the cause rather than being buried in this list.
  const header = dialog.locator('.x-dialog__header');
  await expect(header, `${label}: dialog.js must build a header`).toHaveCount(1);
  const headerPadding = await paddingOf(header);
  for (const side of ['left', 'right'] as const) {
    if (headerPadding[side] < MIN_PADDING) found.push(`${label} header padding-${side} = ${headerPadding[side]}px`);
  }

  return found;
}

test.describe('Modal spacing compliance — the shipped x-dialog', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHarness(page);
  });

  test('the body clears 1rem on every side and the chrome rows clear 1rem horizontally', async ({ page }) => {
    const dialog = await openDialog(page);

    const violations = await collectPaddingViolations(dialog, 'md');
    expect(
      violations,
      'Dialog content must never sit against the edge.\n'
      + 'Spacing lives on the three regions, not on .x-dialog — dialog.css gives .x-dialog padding: 0 by design.',
    ).toEqual([]);

    // The padding is only worth anything if the content actually sits inside
    // it, so measure the rendered result too rather than trusting the
    // declaration: an overflowing or negatively-offset child would pass the
    // computed-style check above and still look broken.
    const body = dialog.locator('.x-dialog__body');
    const content = body.locator('> *').first();
    await expect(content, 'the authored modal-content must render into the body').toHaveCount(1);
    const measured = insets(await rectOf(body), await rectOf(content));
    for (const side of ['top', 'right', 'bottom', 'left'] as const) {
      expect(
        measured[side],
        `body content is ${measured[side]}px from the ${side} edge (needs >= ${MIN_PADDING}px)`,
      ).toBeGreaterThanOrEqual(MIN_PADDING);
    }
  });

  test('the footer action buttons clear 1rem vertically and are 0.5rem apart', async ({ page }) => {
    const dialog = await openDialog(page);

    const footer = dialog.locator('.x-dialog__footer');
    const cancel = footer.locator('.x-dialog__cancel');
    const ok = footer.locator('.x-dialog__ok');
    await expect(cancel, 'the footer must carry a Cancel button').toHaveCount(1);
    await expect(ok, 'the footer must carry an OK button').toHaveCount(1);

    const gap = await footer.evaluate((el) => parseFloat(getComputedStyle(el).columnGap));
    expect(gap, `.x-dialog__footer column-gap = ${gap}px`).toBeGreaterThanOrEqual(MIN_GAP);

    // The computed gap can be right while the buttons still touch — a stretched
    // flex item, a negative margin or a transform all defeat it. Measure the
    // real distance too, so only the rendered result can pass.
    const footerRect = await rectOf(footer);
    const cancelRect = await rectOf(cancel);
    const okRect = await rectOf(ok);
    expect(cancelRect.width, 'Cancel must be laid out').toBeGreaterThan(0);

    const ordered = [cancelRect, okRect].sort((a, b) => a.left - b.left);
    const measuredGap = Math.round(ordered[1].left - ordered[0].right);
    expect(
      measuredGap,
      `Cancel and OK are ${measuredGap}px apart on screen (needs >= ${MIN_GAP}px)`,
    ).toBeGreaterThanOrEqual(MIN_GAP);

    // The buttons must sit inside the footer's own padding box, not overhang
    // it. Asserted as containment rather than as a second 1rem measurement:
    // the footer's vertical padding is checked as a computed value in the
    // padding test, and re-measuring it here only re-reads the same 16px
    // through a subpixel-noisy line-height.
    for (const rect of [cancelRect, okRect]) {
      const measured = insets(footerRect, rect);
      expect(measured.top, `a footer button overhangs the top of the footer by ${-measured.top}px`).toBeGreaterThanOrEqual(0);
      expect(measured.bottom, `a footer button overhangs the bottom of the footer by ${-measured.bottom}px`).toBeGreaterThanOrEqual(0);
      expect(measured.right, `a footer button overhangs the right edge by ${-measured.right}px`).toBeGreaterThanOrEqual(0);
    }
  });

  test('the title is separated from the body content by at least 1rem', async ({ page }) => {
    const dialog = await openDialog(page);

    const title = dialog.locator('.x-dialog__title');
    const body = dialog.locator('.x-dialog__body');
    await expect(title).toHaveCount(1);
    await expect(body).toHaveCount(1);

    // Measured, not margin-based: .x-dialog__title has `margin: 0` on purpose.
    // The separation is the header's padding-bottom plus its border-bottom plus
    // the body's padding-top, which no single declaration reports.
    const titleRect = await rectOf(title);
    const bodyRect = await rectOf(body);
    const separation = Math.round(bodyRect.top - titleRect.bottom);
    expect(titleRect.height, 'the title must be laid out').toBeGreaterThan(0);
    expect(
      separation,
      `Only ${separation}px between the title and the body (needs >= ${MIN_PADDING}px).\n`
      + 'The old assertion here demanded h2 { margin-bottom >= 1rem }, which .x-dialog__title\n'
      + 'will never satisfy — it is margin: 0 by design (#871).',
    ).toBeGreaterThanOrEqual(MIN_PADDING);
  });

  test('the spacing rules hold at every dialog size, not just the default', async ({ page }) => {
    const violations: string[] = [];

    for (const size of SIZES) {
      const dialog = await openDialog(page, size);

      // dialog.js maps sm/md/lg/xl to 320/480/640/800px, so the four runs really
      // are four different boxes rather than the same one measured four times.
      const width = (await rectOf(dialog)).width;
      expect(width, `size="${size}" must lay out`).toBeGreaterThan(0);

      violations.push(...(await collectPaddingViolations(dialog, `size="${size}"`)));

      const gap = await dialog.locator('.x-dialog__footer').evaluate((el) => parseFloat(getComputedStyle(el).columnGap));
      if (gap < MIN_GAP) violations.push(`size="${size}" footer gap = ${gap}px`);

      await closeDialog(page, dialog);
    }

    expect(
      violations,
      `Spacing must not depend on the size variant — checked ${SIZES.join(', ')}.`,
    ).toEqual([]);
  });

  test('a title that wraps still keeps 1rem above and below it', async ({ page }) => {
    // KNOWN RED — this names a real product defect, not a test defect. See the
    // file header: WB's autoInject puts `.x-header` on the <header> dialog.js
    // creates, and header.css's `padding: 0 1.5rem` beats dialog.css's
    // `padding: 1rem 1.5rem`. The dialog header has no vertical padding at all;
    // a single-line title only looks right because `.x-header` also carries
    // `min-height: 60px`. As soon as the title wraps, min-height stops
    // governing and the text goes flush to the edges.
    const dialog = await openDialog(page, 'sm', WRAPPING_TITLE);

    const header = dialog.locator('.x-dialog__header');
    const title = dialog.locator('.x-dialog__title');
    const headerRect = await rectOf(header);
    const titleRect = await rectOf(title);

    // Taller than both the close button (~49px) and .x-header's 60px min-height,
    // so the header row is sized by the title and nothing else is propping it
    // open. Without this the test could pass on accidental space.
    expect(
      titleRect.height,
      `the title must wrap past the rest of the header for this test to mean anything — it measured ${titleRect.height}px tall`,
    ).toBeGreaterThan(70);

    const measured = insets(headerRect, titleRect);
    expect(
      measured.top,
      `A wrapped title sits ${measured.top}px from the top of the header (needs >= ${MIN_PADDING}px).\n`
      + 'Cause: .x-header { padding: 0 1.5rem } overrides .x-dialog__header { padding: 1rem 1.5rem }.',
    ).toBeGreaterThanOrEqual(MIN_PADDING);
    expect(
      measured.bottom,
      `A wrapped title sits ${measured.bottom}px from the bottom of the header (needs >= ${MIN_PADDING}px).`,
    ).toBeGreaterThanOrEqual(MIN_PADDING);
  });
});

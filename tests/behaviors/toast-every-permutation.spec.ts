import { test, expect, type Page, type Locator } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * x-toast — EVERY permutation the schema declares (#1109).
 *
 * GENERATED FROM scripts/toast-permutations.schema.json, which is itself
 * derived from src/wb-models/toast.schema.json. No case is hand-picked: the
 * loops below walk the schema's own values, so a new enum member in the model
 * becomes a new test without editing this file — and the coverage test at the
 * bottom fails if a property is added to the model with no permutation.
 *
 * John, on the Behaviors page listing every x-toast permutation: "these are
 * all broken". He was right. Four of the nine declared attributes — position,
 * dismissible, title, icon — were declared and never read, and the four the
 * page generates permutations for are exactly those four.
 *
 * METHOD (the trained one): params -> one simple working case -> a schema of
 * values including min/max/edges plus an oracle -> tests generated from it.
 * What was wrong before the fix is recorded in the permutation schema's
 * oracle.expectedRedOnCurrentCode and is asserted here as real behaviour.
 *
 * THE ORACLE IS MEASURED, NOT DECLARED. Two assertions in particular are
 * deliberately not class checks:
 *   - position asserts the container's RECTANGLE against the viewport, and
 *     that all six rectangles differ. Before #1109 every position carried its
 *     own class-less container in the one top-right corner, so a class check
 *     is exactly the test that would have passed while the bug was live.
 *   - variant asserts four DISTINCT computed background colours.
 *     tests/behaviors/toast-color.spec.ts asserts class names and compares
 *     only two of the four, so a regression painting all four identically
 *     passes it today.
 *
 * NO SLEEPS FOR READINESS: every wait is on a locator, or on the element's own
 * animations (`.x-toast` has `animation: x-toast-in 0.3s ease`, so colours and
 * rectangles are sampled only after getAnimations() has finished). The only
 * timed waits are the ones the FEATURE is about — duration / auto-dismiss —
 * where the passing of time is the thing under test.
 */

// Read, not imported. package.json is "type": "module", so a bare JSON import
// would need an import attribute under Node's ESM loader; the tooltip suite
// (#1107) and button-permutations.spec.ts read their source the same way,
// from the repo root.
const schema: any = JSON.parse(
  readFileSync(join(process.cwd(), 'scripts/toast-permutations.schema.json'), 'utf8')
);
// The model schema too, so the permutation source is checked against the file
// the docs, the IntelliSense manifest and the Behaviors page are generated
// FROM — the divergence between those two files IS #1109.
const model: any = JSON.parse(
  readFileSync(join(process.cwd(), 'src/wb-models/toast.schema.json'), 'utf8')
);

const P: any = schema.params;
const TOAST = '.x-toast';
const CONTAINER = '.x-toast-container';

/** 1rem of edge inset (toast.css) plus room for a --site-header-height offset. */
const EDGE_GAP = 48;
const TOP_EDGE_GAP = 96;
/** Longer than the 3000ms default, so "no auto-dismiss" cannot pass by luck. */
const PAST_DEFAULT_DURATION = 3400;

type Attrs = Record<string, string>;

async function harness(page: Page): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 15000 });
}

/**
 * Build one trigger with the given attributes and return its locator.
 *
 * A DIV, not a BUTTON: tag-map.js's nativeMap auto-injects the `button`
 * behavior into every <button>, and that behavior reads `variant` and `icon`
 * too — so a <button x-toast icon="🔔"> would prove nothing about which
 * behavior built the icon. toast.schema.json's semanticElement is div and its
 * own test.setup authors <div x-toast>.
 */
async function trigger(
  page: Page,
  attrs: Attrs,
  opts: { reset?: boolean; id?: string } = {}
): Promise<Locator> {
  const id = opts.id || 'toast-trigger';
  const reset = opts.reset !== false;
  await page.evaluate(
    async ({ attrs, id, reset }: { attrs: Attrs; id: string; reset: boolean }) => {
      if (reset) {
        // Containers are created once per position and never removed by the
        // behavior — clearing them is what keeps one test's corner out of the
        // next test's measurements. Removing a container removes its toasts.
        document.querySelectorAll('.x-toast-container').forEach((el) => el.remove());
        document.getElementById('toast-host')?.remove();
      }
      let host = document.getElementById('toast-host');
      if (!host) {
        host = document.createElement('div');
        host.id = 'toast-host';
        // Parked mid-height on the left, clear of all six corner stacks: a
        // block-level trigger spans the page width, and a toast pinned in a
        // corner with pointer-events:auto would otherwise be able to sit over
        // the point Playwright clicks — a failure about layering, not about
        // the attribute under test.
        host.setAttribute('style', 'position:fixed;top:45%;left:1rem;width:200px');
        document.body.appendChild(host);
      }
      const el = document.createElement('div');
      el.id = id;
      el.setAttribute('x-toast', '');
      el.textContent = 'Show';
      // setAttribute, not an innerHTML string: the values under test include
      // quotes, angle brackets and emoji, and escaping them into markup would
      // test the escaping rather than the attribute.
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
      host.appendChild(el);
      const WB = (window as any).WB;
      await WB.scan(host, { eager: true });
      if (WB.whenIdle) await WB.whenIdle({ timeout: 10000 });
    },
    { attrs, id, reset }
  );
  return page.locator(`#${id}`);
}

/**
 * Wait out the element's own animations. `.x-toast` enters with
 * `animation: x-toast-in 0.3s ease`, which translates it — sampling a colour
 * or a rectangle mid-flight measures the animation, not the attribute.
 * Rejections are swallowed: a cancelled animation (element removed) is a
 * finished one for our purposes.
 */
async function settled(target: Locator): Promise<void> {
  await target.evaluate(async (el: Element) => {
    await Promise.all(el.getAnimations().map((a) => a.finished.then(() => {}, () => {})));
  });
}

/** Build a trigger, click it, and return the toast it produced, fully entered. */
async function show(
  page: Page,
  attrs: Attrs,
  opts: { reset?: boolean; id?: string } = {}
): Promise<Locator> {
  const t = await trigger(page, attrs, opts);
  await t.click();
  const toast = page.locator(TOAST).last();
  await expect(toast).toBeVisible({ timeout: 5000 });
  await settled(toast);
  return toast;
}

/** textContent of one part of the toast, exactly as built — no trimming. */
function partText(toast: Locator, selector: string): Promise<string | null> {
  return toast.evaluate((el: Element, s: string) => {
    const part = el.querySelector(s);
    return part ? part.textContent : null;
  }, selector);
}

/** Start counting wb:toast:show, which the trigger fires synchronously on click. */
async function countShows(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as any).__toastShows = 0;
    document.addEventListener('wb:toast:show', () => { (window as any).__toastShows++; });
  });
}

function shows(page: Page): Promise<number> {
  return page.evaluate(() => (window as any).__toastShows);
}

/** The measured gaps between a position's container and the four viewport edges. */
async function containerGaps(page: Page, position: string) {
  const box = await page.locator(`${CONTAINER}--${position}`).boundingBox();
  expect(box, `position="${position}" built no .x-toast-container--${position}`).not.toBeNull();
  // clientWidth/Height, not innerWidth/Height: fixed positioning resolves
  // against the viewport MINUS scrollbars, which is what these report.
  const vp = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight,
  }));
  return {
    box: box!,
    left: box!.x,
    right: vp.width - (box!.x + box!.width),
    top: box!.y,
    bottom: vp.height - (box!.y + box!.height),
  };
}

// ---------------------------------------------------------------------------

test.describe('x-toast — the simple working case', () => {
  test('clicking a trigger shows one toast with its message, close control and container', async ({ page }) => {
    await harness(page);
    const toast = await show(page, { message: 'Saved' });
    await expect(page.locator(TOAST)).toHaveCount(1);
    expect(await partText(toast, '.x-toast__message')).toBe('Saved');
    expect(await toast.locator('.x-toast__close').count(),
      'dismissible defaults to true in the schema').toBe(1);
    expect(await toast.evaluate((el) => el.parentElement?.classList.contains('x-toast-container')),
      'the toast lives in the container, not in the trigger').toBe(true);
    expect(await page.locator('#toast-trigger').evaluate((el) => el.classList.contains('x-toast-trigger')),
      'the host is the TRIGGER; .x-toast is the popup').toBe(true);
  });
});

test.describe('x-toast — message', () => {
  for (const value of P.message.values as string[]) {
    const expected = value === '' ? 'Notification' : value;
    test(`message=${JSON.stringify(value)} renders as its own .x-toast__message`, async ({ page }) => {
      await harness(page);
      const toast = await show(page, { message: value, duration: '0' });
      expect(await partText(toast, '.x-toast__message'),
        value === ''
          ? 'an empty message falls through to the literal "Notification"'
          : 'the message is rendered exactly as authored').toBe(expected);
      expect(await toast.locator('b').count(),
        'author content is text, never parsed as HTML').toBe(0);
    });
  }

  test(`${P.message.alsoAccepts[0]} is honoured too (documented spelling)`, async ({ page }) => {
    await harness(page);
    const toast = await show(page, { [P.message.alsoAccepts[0]]: 'alt spelling', duration: '0' });
    expect(await partText(toast, '.x-toast__message')).toBe('alt spelling');
  });
});

test.describe('x-toast — title (declared, never read before #1109)', () => {
  for (const value of P.title.values as string[]) {
    test(`title=${JSON.stringify(value)} is its own element, not folded into the message`, async ({ page }) => {
      await harness(page);
      const toast = await show(page, { message: 'Body text', 'toast-title': value, duration: '0' });
      if (!value) {
        expect(await toast.locator('.x-toast__title').count(),
          'an empty title must build no title element').toBe(0);
      } else {
        expect(await toast.locator('.x-toast__title').count()).toBe(1);
        expect(await partText(toast, '.x-toast__title')).toBe(value);
        expect(await toast.locator('em').count(),
          'a title is text, never parsed as HTML').toBe(0);
      }
      // The point of the whole attribute: createToast() used to be
      // `toast.textContent = message`, so a title had nowhere to go but into
      // the message. It must not have landed there.
      expect(await partText(toast, '.x-toast__message'),
        'the message must be the message alone — never title+message concatenated').toBe('Body text');
    });
  }

  test('a bare native title attribute is honoured, and toast-title wins over it', async ({ page }) => {
    await harness(page);
    const bare = await show(page, { message: 'm', title: 'Native title', duration: '0' });
    expect(await partText(bare, '.x-toast__title')).toBe('Native title');

    const both = await show(page, { message: 'm', title: 'Native title', 'toast-title': 'Schema title', duration: '0' });
    expect(await partText(both, '.x-toast__title'),
      'toast-title exists so a trigger\'s own browser tooltip is not promoted into the heading').toBe('Schema title');
  });
});

test.describe('x-toast — icon (declared, never read before #1109)', () => {
  for (const value of P.icon.values as string[]) {
    test(`icon=${JSON.stringify(value)} is its own element, not folded into the message`, async ({ page }) => {
      await harness(page);
      const toast = await show(page, { message: 'Body text', icon: value, duration: '0' });
      if (!value) {
        expect(await toast.locator('.x-toast__icon').count(),
          'an empty icon must build no icon element').toBe(0);
      } else {
        expect(await toast.locator('.x-toast__icon').count()).toBe(1);
        expect(await partText(toast, '.x-toast__icon')).toBe(value);
        expect(await toast.locator('.x-toast__icon').getAttribute('aria-hidden'),
          'the icon is decoration beside the message, not something to announce').toBe('true');
        expect(await toast.evaluate((el) => el.firstElementChild?.classList.contains('x-toast__icon')),
          'the icon leads the toast, per the structure the schema described').toBe(true);
      }
      expect(await partText(toast, '.x-toast__message'),
        'the message must be the message alone — never icon+message concatenated').toBe('Body text');
    });
  }
});

test.describe('x-toast — variant (4 declared values)', () => {
  for (const v of P.variant.values as string[]) {
    test(`variant="${v}" reaches the toast as x-toast--${v}`, async ({ page }) => {
      await harness(page);
      const toast = await show(page, { message: v, 'toast-variant': v, duration: '0' });
      await expect(toast).toHaveClass(new RegExp(`x-toast--${v}(\\s|$)`));
    });
  }

  test(`${P.variant.alsoAccepts[0]} is honoured too (documented spelling)`, async ({ page }) => {
    await harness(page);
    const toast = await show(page, { message: 'v', [P.variant.alsoAccepts[0]]: 'success', duration: '0' });
    await expect(toast).toHaveClass(/x-toast--success(\s|$)/);
  });

  test('the 4 variants paint 4 DISTINCT computed background colours', async ({ page }) => {
    await harness(page);
    const seen: Record<string, string> = {};
    for (const v of P.variant.values as string[]) {
      const toast = await show(page, { message: v, 'toast-variant': v, duration: '0' });
      // After the entry animation, and via getComputedStyle: the class is not
      // the oracle. toast-color.spec.ts checks classes and compares two of the
      // four, so a regression that painted all four the same passes it (#1109).
      seen[v] = await toast.evaluate((el) => getComputedStyle(el).backgroundColor);
    }
    expect(new Set(Object.values(seen)).size,
      `each variant must paint a different colour, got ${JSON.stringify(seen)}`)
      .toBe((P.variant.values as string[]).length);
  });
});

test.describe('x-toast — position (6 declared values, declared and never read before #1109)', () => {
  for (const pos of P.position.values as string[]) {
    const [vertical, horizontal] = pos.split('-');
    test(`position="${pos}" places the container in the ${pos} corner (measured)`, async ({ page }) => {
      await harness(page);
      const toast = await show(page, { message: pos, position: pos, duration: '0' });

      await expect(page.locator(`${CONTAINER}--${pos}`),
        'one container per position, created on first use').toHaveCount(1);
      expect(await toast.evaluate((el) => el.parentElement?.className),
        `the toast must go into the ${pos} stack`).toContain(`x-toast-container--${pos}`);

      const g = await containerGaps(page, pos);
      const where = `position="${pos}" must put the container in the ${pos} corner, measured gaps ` +
        `L=${Math.round(g.left)} R=${Math.round(g.right)} T=${Math.round(g.top)} B=${Math.round(g.bottom)}`;

      if (horizontal === 'left') {
        expect(g.left, where).toBeLessThanOrEqual(EDGE_GAP);
        expect(g.left, where).toBeLessThan(g.right);
      } else if (horizontal === 'right') {
        expect(g.right, where).toBeLessThanOrEqual(EDGE_GAP);
        expect(g.right, where).toBeLessThan(g.left);
      } else {
        // Centred against the INITIAL CONTAINING BLOCK, measured -- not guessed.
        //
        // A fixed element's `left: 50%` resolves against the ICB, which is not
        // necessarily `documentElement.clientWidth`: measured live 2026-09-12,
        // computed left was 596px (50% of 1192) while clientWidth read 1207,
        // and in the test context the asymmetry was 15px while
        // `innerWidth - clientWidth` reported 0. So neither width is a reliable
        // stand-in, and a tolerance picked to cover the difference would be a
        // number chosen to make the test pass.
        //
        // A `position: fixed; left: 0; right: 0` probe IS the ICB, by
        // definition. Comparing centres against it asks the only question that
        // matters -- is the container centred in the box it is positioned
        // against -- and needs no fudge factor.
        const centreOffset = await page.evaluate((sel) => {
          const probe = document.createElement('div');
          probe.style.cssText = 'position:fixed;left:0;right:0;top:0;height:0;pointer-events:none;visibility:hidden';
          document.body.appendChild(probe);
          const icb = probe.getBoundingClientRect();
          probe.remove();
          const c = document.querySelector(sel)!.getBoundingClientRect();
          return Math.abs((c.left + c.width / 2) - (icb.left + icb.width / 2));
        }, `${CONTAINER}--${pos}`);
        expect(centreOffset, `${where} — centre offset from the containing block`)
          .toBeLessThanOrEqual(2);
      }

      if (vertical === 'top') {
        expect(g.top, where).toBeLessThanOrEqual(TOP_EDGE_GAP);
        expect(g.top, where).toBeLessThan(g.bottom);
      } else {
        expect(g.bottom, where).toBeLessThanOrEqual(EDGE_GAP);
        expect(g.bottom, where).toBeLessThan(g.top);
      }
    });
  }

  test('the 6 positions produce 6 DIFFERENT container rectangles', async ({ page }) => {
    await harness(page);
    const positions = P.position.values as string[];
    // The defect John saw: six permutations, six identical boxes. One measured
    // rectangle per position, all live at once, all required to differ.
    for (const [i, pos] of positions.entries()) {
      const t = await trigger(page, { message: pos, position: pos, duration: '0' },
        { reset: i === 0, id: `toast-trigger-${i}` });
      await t.click();
      const toast = page.locator(`${CONTAINER}--${pos} ${TOAST}`).first();
      await expect(toast).toBeVisible({ timeout: 5000 });
      await settled(toast);
    }
    await expect(page.locator(CONTAINER)).toHaveCount(positions.length);

    const rects: Record<string, string> = {};
    for (const pos of positions) {
      const g = await containerGaps(page, pos);
      rects[pos] = `${Math.round(g.box.x)},${Math.round(g.box.y)}`;
    }
    expect(new Set(Object.values(rects)).size,
      `every declared position must land somewhere different, got ${JSON.stringify(rects)}`)
      .toBe(positions.length);
  });

  test('an undeclared position falls back to the default corner, it does not invent a stack', async ({ page }) => {
    await harness(page);
    const bad = (P.position.edges as string[]).find((e) => !(P.position.values as string[]).includes(e))!;
    const toast = await show(page, { message: 'x', position: bad, duration: '0' });
    expect(await toast.evaluate((el) => el.parentElement?.className))
      .toContain(`x-toast-container--${P.position.default}`);
    await expect(page.locator(CONTAINER)).toHaveCount(1);
  });

  test('a position\'s container is reused, not rebuilt, on every toast', async ({ page }) => {
    await harness(page);
    const t = await trigger(page, { message: 'twice', position: 'bottom-left', duration: '0' });
    await t.click();
    await t.click();
    await expect(page.locator(`${CONTAINER}--bottom-left ${TOAST}`)).toHaveCount(2);
    await expect(page.locator(CONTAINER), 'two toasts, one stack').toHaveCount(1);
  });
});

test.describe('x-toast — dismissible (declared, never read before #1109)', () => {
  for (const on of P.dismissible.values as boolean[]) {
    test(`dismissible="${on}" ${on ? 'builds' : 'omits'} the close control`, async ({ page }) => {
      await harness(page);
      const toast = await show(page, { message: 'd', dismissible: String(on), duration: '0' });
      expect(await toast.locator('.x-toast__close').count()).toBe(on ? 1 : 0);
      if (!on) {
        expect(await toast.locator('.x-toast__actions').count(),
          'no action and no close control means no actions wrapper at all').toBe(0);
      }
    });
  }

  for (const edge of P.dismissible.edges as string[]) {
    const expected = edge === 'false' || edge === '0' ? 0 : 1;
    test(`dismissible=${JSON.stringify(edge)} reads as ${expected ? 'ON' : 'OFF'} (the #747 trap)`, async ({ page }) => {
      await harness(page);
      const toast = await show(page, { message: 'd', dismissible: edge, duration: '0' });
      expect(await toast.locator('.x-toast__close').count(),
        `a bare hasAttribute() check would read ${JSON.stringify(edge)} as ON`).toBe(expected);
    });
  }

  test('the close control actually dismisses: the toast leaves the DOM and wb:toast:hide fires', async ({ page }) => {
    await harness(page);
    const toast = await show(page, { message: 'Saved', duration: '0' });
    await page.evaluate(() => {
      (window as any).__toastHides = 0;
      document.addEventListener('wb:toast:hide', () => { (window as any).__toastHides++; });
    });
    await toast.locator('.x-toast__close').click();
    await expect(page.locator(TOAST),
      'clicking close must REMOVE the toast, not just fade it').toHaveCount(0, { timeout: 3000 });
    expect(await page.evaluate(() => (window as any).__toastHides),
      'the schema has declared wb:toast:hide since it was written').toBe(1);
  });

  test('the close glyph is CSS, so the toast\'s text stays the message', async ({ page }) => {
    await harness(page);
    const toast = await show(page, { message: 'Saved', duration: '0' });
    expect(await toast.evaluate((el) => el.textContent),
      'a ✕ text node would make every toast.textContent read "Saved✕"').toBe('Saved');
    expect(await toast.locator('.x-toast__close').getAttribute('aria-label')).toBe('Dismiss notification');
  });
});

test.describe('x-toast — duration (the only place a timed wait is the feature)', () => {
  for (const value of P.duration.values as number[]) {
    if (value === 0) {
      test('duration="0" never auto-dismisses', async ({ page }) => {
        await harness(page);
        await show(page, { message: 'stay', duration: '0' });
        await page.waitForTimeout(PAST_DEFAULT_DURATION);   // the feature IS the passing of time
        await expect(page.locator(TOAST),
          'duration=0 is the declared minimum and means "wait for the close button"').toHaveCount(1);
      });
      continue;
    }

    if (value <= 1000) {
      test(`duration="${value}" auto-dismisses and leaves nothing behind`, async ({ page }) => {
        await harness(page);
        const t = await trigger(page, { message: 'go', duration: String(value) });
        // A short-lived toast can be gone before a visibility poll lands, so
        // its EXISTENCE is proven by the event it fires, not by catching it on
        // screen — otherwise "it never appeared" and "it auto-dismissed" are
        // the same green.
        await countShows(page);
        await t.click();
        expect(await shows(page), 'the toast must have been created at all').toBe(1);
        await expect(page.locator(TOAST),
          `duration=${value} must remove the toast from the DOM`).toHaveCount(0, { timeout: 5000 });
      });
      continue;
    }

    test(`duration="${value}" does NOT fire early`, async ({ page }) => {
      await harness(page);
      await show(page, { message: 'later', duration: String(value) });
      await page.waitForTimeout(900);                        // the feature IS the passing of time
      await expect(page.locator(TOAST),
        `duration=${value} must not dismiss after 900ms`).toHaveCount(1);
    });
  }

  // The edges that are NOT a positive number: -1 and "abc". 0 is an edge too,
  // but it is already covered by the values loop above.
  const inertDurations = (P.duration.edges as Array<string | number>)
    .filter((e) => e !== 0 && !(Number(e) > 0));
  for (const bad of inertDurations) {
    test(`duration=${JSON.stringify(bad)} means no auto-dismiss, never a NaN timer`, async ({ page }) => {
      await harness(page);
      const toast = await show(page, { message: 'edge', duration: String(bad) });
      await page.waitForTimeout(PAST_DEFAULT_DURATION);      // the feature IS the passing of time
      await expect(page.locator(TOAST),
        `duration=${JSON.stringify(bad)} is not > 0, so nothing should dismiss it`).toHaveCount(1);
      await toast.locator('.x-toast__close').click();
      await expect(page.locator(TOAST),
        'and it must still be dismissible by hand').toHaveCount(0, { timeout: 3000 });
    });
  }
});

test.describe('x-toast — action and actionHref', () => {
  test('action with no href is a button that fires wb:toast:action', async ({ page }) => {
    await harness(page);
    const toast = await show(page, { message: 'Deleted', action: 'Undo', duration: '0' });
    const action = toast.locator('.x-toast__action');
    await expect(action).toHaveCount(1);
    expect(await action.evaluate((el) => el.tagName)).toBe('BUTTON');
    expect(await action.getAttribute('type')).toBe('button');
    expect(await partText(toast, '.x-toast__message'),
      'the action is its own control, never folded into the message').toBe('Deleted');

    await page.evaluate(() => {
      (window as any).__toastActions = 0;
      document.addEventListener('wb:toast:action', () => { (window as any).__toastActions++; });
    });
    await action.click();
    expect(await page.evaluate(() => (window as any).__toastActions)).toBe(1);
  });

  for (const href of (P.actionHref.values as string[]).filter(Boolean)) {
    test(`action-href="${href}" makes the action a link`, async ({ page }) => {
      await harness(page);
      const toast = await show(page, { message: 'm', action: 'Undo', 'action-href': href, duration: '0' });
      const action = toast.locator('.x-toast__action');
      expect(await action.evaluate((el) => el.tagName),
        'a control that navigates must be an <a>: middle-click and open-in-new-tab are not optional').toBe('A');
      expect(await action.getAttribute('href')).toBe(href);
    });
  }

  test('an href with no action text builds no control', async ({ page }) => {
    await harness(page);
    const toast = await show(page, { message: 'm', 'action-href': '#target', duration: '0' });
    expect(await toast.locator('.x-toast__action').count(),
      'the text is what makes the action exist').toBe(0);
  });
});

test.describe('x-toast — no leaks', () => {
  test('showing and dismissing 5 times leaves no toast and no extra container', async ({ page }) => {
    await harness(page);
    const t = await trigger(page, { message: 'leak', duration: '0' });
    for (let i = 0; i < 5; i++) {
      await t.click();
      const toast = page.locator(TOAST).first();
      await expect(toast).toBeVisible({ timeout: 5000 });
      await settled(toast);
      await toast.locator('.x-toast__close').click();
      await expect(page.locator(TOAST)).toHaveCount(0, { timeout: 3000 });
    }
    expect(await page.locator(TOAST).count(), 'toasts must be removed, not stacked').toBe(0);
    expect(await page.locator(CONTAINER).count(), 'the stack is reused, never re-created').toBe(1);
  });

  test('an auto-dismissed toast is gone from the DOM, not merely invisible', async ({ page }) => {
    await harness(page);
    const t = await trigger(page, { message: 'auto', duration: '400' });
    await countShows(page);
    await t.click();
    expect(await shows(page), 'the toast must have been created at all').toBe(1);
    await expect(page.locator(TOAST)).toHaveCount(0, { timeout: 5000 });
    expect(await page.locator(`${CONTAINER} > *`).count(),
      'the container must be left empty, with no hidden husk inside').toBe(0);
  });
});

test.describe('x-toast — the permutation source agrees with the model', () => {
  test('every property the model declares has a permutation here', () => {
    // Adding a property to src/wb-models/toast.schema.json without adding it
    // here fails this test — which is how #1109 (four declared, never-read
    // attributes advertised for as long as the schema existed) stops repeating.
    expect(Object.keys(P).sort()).toEqual(Object.keys(model.properties).sort());
  });

  for (const name of Object.keys(model.properties)) {
    test(`${name}: the permutation source carries the model's declared default`, () => {
      expect(P[name].default,
        'the docs and the Behaviors page are generated from the model schema')
        .toEqual(model.properties[name].default);
    });
  }

  for (const name of ['variant', 'position']) {
    test(`${name}: the permutation source covers the model's whole enum`, () => {
      expect(P[name].values).toEqual(model.properties[name].enum);
    });
  }

  test('duration: the declared minimum and maximum are the ones tested', () => {
    expect(P.duration.minimum).toBe(model.properties.duration.minimum);
    expect(P.duration.maximum).toBe(model.properties.duration.maximum);
    expect(P.duration.values, 'min and max must both appear as values')
      .toEqual(expect.arrayContaining([model.properties.duration.minimum, model.properties.duration.maximum]));
  });

  test('$view stays empty: the behavior owns the toast\'s DOM', () => {
    // The second half of #1109. The schema's $view described
    // container > icon + content(title, message) + actions(action, close) and
    // the lazy runtime built it INTO THE TRIGGER before the behavior ran, so a
    // trigger was repainted as a static look-alike toast with an inert ✕.
    // createToast() now builds exactly that structure on the popup. One
    // definition of a toast; re-filling $view brings the look-alike back.
    expect(model.$view, 'createToast() is the one definition of a toast (#1109)').toEqual([]);
  });
});

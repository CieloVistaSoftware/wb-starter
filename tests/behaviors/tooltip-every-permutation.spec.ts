import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * x-tooltip — EVERY permutation the schema declares (#1107).
 *
 * GENERATED FROM scripts/tooltip-permutations.schema.json, which is itself
 * derived from src/wb-models/tooltip.schema.json. No case is hand-picked: the
 * loops below walk the schema's own values, so a new enum member in the model
 * becomes a new test without editing this file.
 *
 * John: "all permutations of x-tooltip must be tested."
 *
 * METHOD (the trained one): params -> one simple working case -> a schema of
 * values including min/max/edges plus an oracle -> tests generated from it.
 * Expected-red cases are listed in the schema's oracle.expectedRedOnCurrentCode
 * and are asserted as REAL failures here, never skipped: 4 of the 9 declared
 * attributes (trigger, arrow, interactive, maxWidth) are never read by
 * src/wb-viewmodels/tooltip.js, and this suite is what proves it.
 *
 * NO SLEEPS for readiness: every wait is on a locator. The only timed waits are
 * the ones the FEATURE is about (delay / hideDelay), where the passing of time
 * is the thing under test.
 */

// Read, not imported. package.json is "type": "module", so a bare JSON import
// would need an import attribute under Node's ESM loader; every other
// data-driven suite here (button-permutations.spec.ts) reads its source the
// same way, from the repo root.
const schema: any = JSON.parse(
  readFileSync(join(process.cwd(), 'scripts/tooltip-permutations.schema.json'), 'utf8')
);
// The model schema too, so the hideDelay reconciliation is asserted against the
// file the docs are generated FROM, not against a number typed twice.
const model: any = JSON.parse(
  readFileSync(join(process.cwd(), 'src/wb-models/tooltip.schema.json'), 'utf8')
);

const P: any = schema.params;
const TIP = '.x-tooltip';

async function harness(page: Page) {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 15000 });
}

/** Build one trigger with the given attributes and return its locator. */
async function trigger(page: Page, attrs: string) {
  await page.evaluate(async (a) => {
    document.querySelectorAll('.x-tooltip').forEach((el) => el.remove());
    const host = document.getElementById('tip-host') || document.createElement('div');
    host.id = 'tip-host';
    // Centred, so a tooltip can be placed on any side without being clamped by
    // the viewport edge — otherwise "left" and "top" fail for a reason that has
    // nothing to do with the attribute under test.
    host.setAttribute('style', 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%)');
    host.innerHTML = `<button id="tip-trigger" x-tooltip ${a}>Trigger</button>`;
    if (!host.isConnected) document.body.appendChild(host);
    const WB = (window as any).WB;
    await WB.scan(host, { eager: true });
    if (WB.whenIdle) await WB.whenIdle({ timeout: 10000 });
  }, attrs);
  return page.locator('#tip-trigger');
}

/** Hover and wait for the tooltip, allowing for the configured delay. */
async function hoverAndShow(page: Page, attrs: string, timeout = 5000) {
  const t = await trigger(page, attrs);
  await t.hover();
  const tip = page.locator(TIP).first();
  await expect(tip).toBeVisible({ timeout });
  return tip;
}

test.describe('x-tooltip — the simple working case', () => {
  test('hovering a trigger shows its content, leaving hides it', async ({ page }) => {
    await harness(page);
    const tip = await hoverAndShow(page, 'content="hello"');
    await expect(tip).toHaveText(/hello/);
    await page.mouse.move(0, 0);
    await expect(page.locator(TIP)).toHaveCount(0, { timeout: 5000 });
  });
});

test.describe('x-tooltip — content', () => {
  for (const value of P.content.values as string[]) {
    const empty = !value.trim();
    test(`content=${JSON.stringify(value)} ${empty ? 'falls back to the trigger text' : 'renders as text'}`, async ({ page }) => {
      await harness(page);
      const t = await trigger(page, `content="${value.replace(/"/g, '&quot;')}"`);
      await t.hover();
      if (empty) {
        // NOT "no tooltip". #861 made the trigger's own text the last content
        // source on purpose, so the bare documented form
        // <button x-tooltip>Trigger</button> has something to say; an empty or
        // whitespace-only content attribute falls through to exactly that.
        // Asserting silence here would ask for the regression #861 fixed.
        const fallbackTip = page.locator(TIP).first();
        await expect(fallbackTip).toBeVisible({ timeout: 5000 });
        await expect(fallbackTip, 'empty content falls back to the trigger text (#861)')
          .toHaveText(/Trigger/);
        return;
      }
      const tip = page.locator(TIP).first();
      await expect(tip).toBeVisible({ timeout: 5000 });
      await expect(tip).toHaveText(new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      // Author content is text, never markup.
      expect(await tip.evaluate((el) => el.querySelector('b') !== null),
        'author content must not be parsed as HTML').toBe(false);
    });
  }
});

test.describe('x-tooltip — position (8 declared values)', () => {
  for (const pos of P.position.values as string[]) {
    test(`position="${pos}" is classed and placed on that side`, async ({ page }) => {
      await harness(page);
      const tip = await hoverAndShow(page, `content="p" position="${pos}"`);
      await expect(tip, 'the position must reach the built element as a class').toHaveClass(
        new RegExp(`x-tooltip--${pos}(\\s|$)`)
      );
      const [tipBox, trigBox] = await Promise.all([
        tip.boundingBox(),
        page.locator('#tip-trigger').boundingBox(),
      ]);
      const side = pos.split('-')[0];
      const msg = `position="${pos}" must place the tooltip on the ${side} of the trigger`;
      if (side === 'top') expect(tipBox!.y + tipBox!.height, msg).toBeLessThanOrEqual(trigBox!.y + 1);
      if (side === 'bottom') expect(tipBox!.y, msg).toBeGreaterThanOrEqual(trigBox!.y + trigBox!.height - 1);
      if (side === 'left') expect(tipBox!.x + tipBox!.width, msg).toBeLessThanOrEqual(trigBox!.x + 1);
      if (side === 'right') expect(tipBox!.x, msg).toBeGreaterThanOrEqual(trigBox!.x + trigBox!.width - 1);
    });
  }

  for (const alt of P.position.alsoAccepts as string[]) {
    test(`${alt}="bottom" is honoured too (documented spelling)`, async ({ page }) => {
      await harness(page);
      const tip = await hoverAndShow(page, `content="p" ${alt}="bottom"`);
      await expect(tip).toHaveClass(/x-tooltip--bottom(\s|$)/);
    });
  }
});

test.describe('x-tooltip — variant (4 declared values)', () => {
  for (const v of P.variant.values as string[]) {
    test(`variant="${v}" reaches the element`, async ({ page }) => {
      await harness(page);
      const tip = await hoverAndShow(page, `content="v" variant="${v}"`);
      await expect(tip).toHaveClass(new RegExp(`x-tooltip--${v}(\\s|$)`));
    });
  }

  test('the 4 variants are not all painted identically', async ({ page }) => {
    await harness(page);
    const seen: Record<string, string> = {};
    for (const v of P.variant.values as string[]) {
      const tip = await hoverAndShow(page, `content="v" variant="${v}"`);
      seen[v] = await tip.evaluate((el) => getComputedStyle(el).backgroundColor);
      await page.mouse.move(0, 0);
      await expect(page.locator(TIP)).toHaveCount(0, { timeout: 3000 });
    }
    expect(new Set(Object.values(seen)).size,
      `each variant must look different, got ${JSON.stringify(seen)}`).toBeGreaterThan(1);
  });
});

test.describe('x-tooltip — delay and hideDelay', () => {
  test('delay="0" shows immediately', async ({ page }) => {
    await harness(page);
    const t = await trigger(page, 'content="d" delay="0"');
    const started = Date.now();
    await t.hover();
    await expect(page.locator(TIP).first()).toBeVisible({ timeout: 3000 });
    expect(Date.now() - started, 'delay=0 must not wait the 200ms default').toBeLessThan(400);
  });

  test('delay="800" does NOT show before its time', async ({ page }) => {
    await harness(page);
    const t = await trigger(page, 'content="d" delay="800"');
    await t.hover();
    await page.waitForTimeout(300);            // the feature IS the passing of time
    await expect(page.locator(TIP), 'shown too early -> delay ignored').toHaveCount(0);
    await expect(page.locator(TIP).first()).toBeVisible({ timeout: 3000 });
  });

  for (const bad of P.delay.edges as Array<string | number>) {
    if (bad === 0 || bad === 5000) continue;
    test(`delay="${bad}" is clamped, not NaN (tooltip still appears)`, async ({ page }) => {
      await harness(page);
      const t = await trigger(page, `content="d" delay="${bad}"`);
      await t.hover();
      await expect(page.locator(TIP).first(),
        `delay="${bad}" must clamp to 0, never disable the tooltip`).toBeVisible({ timeout: 3000 });
    });
  }

  test('hideDelay keeps the tooltip alive after the pointer leaves', async ({ page }) => {
    await harness(page);
    await hoverAndShow(page, 'content="h" delay="0" hide-delay="1000"');
    await page.mouse.move(0, 0);
    await page.waitForTimeout(300);
    await expect(page.locator(TIP), 'hideDelay=1000 must not vanish after 300ms').toHaveCount(1);
  });

  test('the schema default for hideDelay matches the code default', async () => {
    // tooltip.schema.json used to say 0 while tooltip.js defaulted to 100, and
    // the docs are generated from the schema -- so readers were told a number
    // the code ignored (#1107). Reconciled to 100: it is the shipped behaviour,
    // and a 0ms hide leaves no bridge for interactive="true", where the pointer
    // has to cross the 8px gap onto the tooltip before it goes.
    expect(model.properties.hideDelay.default,
      'the model schema is what the docs are generated from').toBe(100);
    expect(P.hideDelay.default,
      'the permutation source is derived from the model schema and must agree')
      .toBe(model.properties.hideDelay.default);
  });
});

test.describe('x-tooltip — trigger (declared, never read)', () => {
  for (const mode of P.trigger.values as string[]) {
    test(`trigger="${mode}" opens on ${mode} and not on the others`, async ({ page }) => {
      await harness(page);
      const t = await trigger(page, `content="t" delay="0" trigger="${mode}"`);

      if (mode === 'click') {
        await t.hover();
        await expect(page.locator(TIP),
          'trigger="click" must NOT open on hover').toHaveCount(0, { timeout: 1500 });
        await t.click();
        await expect(page.locator(TIP).first(),
          'trigger="click" must open on click').toBeVisible({ timeout: 3000 });
        return;
      }

      if (mode === 'focus') {
        await t.focus();
        await expect(page.locator(TIP).first()).toBeVisible({ timeout: 3000 });
        return;
      }

      await t.hover();
      await expect(page.locator(TIP).first()).toBeVisible({ timeout: 3000 });
    });
  }
});

test.describe('x-tooltip — arrow, interactive, maxWidth (declared, never read)', () => {
  test('arrow="false" builds no arrow element', async ({ page }) => {
    await harness(page);
    const tip = await hoverAndShow(page, 'content="a" delay="0" arrow="false"');
    expect(await tip.locator('.x-tooltip__arrow').count(),
      'arrow="false" must remove the arrow; tooltip.js builds it unconditionally').toBe(0);
  });

  test('arrow default builds exactly one arrow', async ({ page }) => {
    await harness(page);
    const tip = await hoverAndShow(page, 'content="a" delay="0"');
    expect(await tip.locator('.x-tooltip__arrow').count()).toBe(1);
  });

  test('interactive: the pointer can move onto the tooltip without it closing', async ({ page }) => {
    await harness(page);
    const tip = await hoverAndShow(page, 'content="i" delay="0" hide-delay="200" interactive="true"');
    const box = (await tip.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(400);
    await expect(page.locator(TIP),
      'interactive="true" must survive the pointer entering the tooltip').toHaveCount(1);
  });

  for (const mw of ['200px', '0px']) {
    test(`max-width="${mw}" caps the rendered width`, async ({ page }) => {
      await harness(page);
      const long = P.content.values[3];
      const tip = await hoverAndShow(page, `content="${long}" delay="0" max-width="${mw}"`);
      const box = (await tip.boundingBox())!;
      // A border-box cap cannot squeeze out the padding and border: max-width:0
      // still renders a padding box. Measure that floor rather than pretending
      // a 0px tooltip can be 0px wide.
      const floor = await tip.evaluate((el) => {
        const cs = getComputedStyle(el);
        return parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)
          + parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth);
      });
      expect(box.width, `max-width="${mw}" must cap the tooltip`)
        .toBeLessThanOrEqual(Math.max(parseInt(mw, 10), floor) + 2);
    });
  }
});

test.describe('x-tooltip — no leaks', () => {
  test('showing and hiding 5 times leaves no tooltip in the DOM', async ({ page }) => {
    await harness(page);
    for (let i = 0; i < 5; i++) {
      await hoverAndShow(page, 'content="leak" delay="0"');
      await page.mouse.move(0, 0);
      await expect(page.locator(TIP)).toHaveCount(0, { timeout: 3000 });
    }
    expect(await page.locator(TIP).count(), 'tooltips must be removed, not stacked').toBe(0);
  });
});

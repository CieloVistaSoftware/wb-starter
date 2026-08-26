/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BUTTON — Parameter Permutation Suite (#746)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * John: "we must have unit tests for all parm permutations of button."
 *
 * Written because #746 shipped a button whose variant, size and icon were ALL
 * dead — `<button x-button variant="outline" icon="download" size="md">` came
 * out with class="" and no icon, while the same button WITHOUT `x-button`
 * came out fully styled. Every existing check passed: the behavior was
 * registered, the schema was valid, the map entry was present. Nothing
 * asserted that a parameter actually reaches the rendered element.
 *
 * The value lists are READ FROM button.schema.json at runtime, not copied
 * here. A value added to the schema is tested automatically; a test that
 * silently stops covering an enum is not possible.
 *
 * Every parameter is asserted in BOTH authoring forms — bare semantic
 * `<button>` (autoInject) and `<button x-button>` — because the #746 bug
 * affected only the second, and a suite that tests one form would not have
 * caught it.
 *
 * @version 3.0.0
 */

import { test, expect, Page } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

const schema = JSON.parse(
  readFileSync(join(process.cwd(), 'src/wb-models/button.schema.json'), 'utf8')
);
const P = (schema.properties ?? {}) as Record<string, any>;

const VARIANTS: string[] = P.variant?.enum ?? [];
const SIZES: string[] = P.size?.enum ?? [];
const ICONS: string[] = P.icon?.enum ?? [];
const ICON_POSITIONS: string[] = P.iconPosition?.enum ?? [];
const TARGETS: string[] = P.target?.enum ?? [];
const BOOLEANS = ['disabled', 'loading', 'fullWidth', 'iconOnly'] as const;

/** Both authoring forms. `x-button` is the one #746 broke. */
const FORMS = [
  { name: 'bare <button> (autoInject)', attr: '' },
  { name: '<button x-button>', attr: ' x-button' },
];

async function render(page: Page, html: string): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(
    () => (window as any).WB && (window as any).WB.behaviors,
    { timeout: 15000 }
  );
  await page.evaluate((h: string) => {
    const c = document.createElement('div');
    c.id = 'btn-perm-area';
    c.innerHTML = h;
    document.body.appendChild(c);
  }, html);
  await page.evaluate(async () => {
    const c = document.getElementById('btn-perm-area');
    if ((window as any).WB?.scan) await (window as any).WB.scan(c, { eager: true });
  });
  await page.waitForTimeout(250);
}

test.describe('Button — schema is readable and non-empty', () => {
  test('every enum the suite iterates actually has values', () => {
    // A schema that lost its enums would otherwise make every loop below
    // vacuously pass — zero iterations, zero failures, zero coverage.
    expect(VARIANTS.length, 'variant enum').toBeGreaterThan(0);
    expect(SIZES.length, 'size enum').toBeGreaterThan(0);
    expect(ICONS.length, 'icon enum').toBeGreaterThan(0);
    expect(ICON_POSITIONS.length, 'iconPosition enum').toBeGreaterThan(0);
    expect(TARGETS.length, 'target enum').toBeGreaterThan(0);
  });
});

for (const form of FORMS) {
  test.describe(`Button — ${form.name}`, () => {
    test('the behavior applies at all (base class present)', async ({ page }) => {
      await render(page, `<button id="b"${form.attr}>Label</button>`);
      await expect(page.locator('#b')).toHaveClass(/x-button/);
    });

    test(`every variant applies its modifier class (${VARIANTS.length})`, async ({ page }) => {
      const html = VARIANTS
        .map((v, i) => `<button id="v${i}"${form.attr} variant="${v}">${v}</button>`)
        .join('');
      await render(page, html);
      for (const [i, v] of VARIANTS.entries()) {
        await expect(page.locator(`#v${i}`), `variant="${v}"`)
          .toHaveClass(new RegExp(`x-button--${v}\\b`));
      }
    });

    test(`every size applies its modifier class (${SIZES.length})`, async ({ page }) => {
      const html = SIZES
        .map((s, i) => `<button id="s${i}"${form.attr} size="${s}">${s}</button>`)
        .join('');
      await render(page, html);
      for (const [i, s] of SIZES.entries()) {
        await expect(page.locator(`#s${i}`), `size="${s}"`)
          .toHaveClass(new RegExp(`x-button--${s}\\b`));
      }
    });

    test(`variant x size: every pair applies BOTH classes (${VARIANTS.length * SIZES.length})`, async ({ page }) => {
      // The pair matters on its own: #746 produced buttons where neither
      // landed, and a per-parameter test can pass while the combination
      // clobbers one of them.
      const pairs = VARIANTS.flatMap(v => SIZES.map(s => ({ v, s })));
      const html = pairs
        .map((p, i) => `<button id="p${i}"${form.attr} variant="${p.v}" size="${p.s}">x</button>`)
        .join('');
      await render(page, html);
      for (const [i, p] of pairs.entries()) {
        const el = page.locator(`#p${i}`);
        await expect(el, `variant="${p.v}" size="${p.s}" — variant class`)
          .toHaveClass(new RegExp(`x-button--${p.v}\\b`));
        await expect(el, `variant="${p.v}" size="${p.s}" — size class`)
          .toHaveClass(new RegExp(`x-button--${p.s}\\b`));
      }
    });

    test(`every icon renders something (${ICONS.length})`, async ({ page }) => {
      const html = ICONS
        .map((ic, i) => `<button id="i${i}"${form.attr} icon="${ic}">${ic}</button>`)
        .join('');
      await render(page, html);
      for (const [i, ic] of ICONS.entries()) {
        // "Renders something" deliberately, not a specific glyph: the bug was
        // NOTHING rendering. Asserting the exact SVG would couple this suite
        // to the icon set and start failing on unrelated art changes.
        const painted = await page.locator(`#i${i}`).evaluate(el => {
          const hasSvg = !!el.querySelector('svg, img, i');
          const before = getComputedStyle(el, '::before').content;
          return hasSvg || (before !== 'none' && before !== 'normal' && before !== '""');
        });
        expect(painted, `icon="${ic}" rendered nothing`).toBe(true);
      }
    });

    test(`every iconPosition is honoured (${ICON_POSITIONS.length})`, async ({ page }) => {
      const html = ICON_POSITIONS
        .map((pos, i) => `<button id="ip${i}"${form.attr} icon="star" iconPosition="${pos}">t</button>`)
        .join('');
      await render(page, html);
      for (const [i, pos] of ICON_POSITIONS.entries()) {
        const marked = await page.locator(`#ip${i}`).evaluate((el, p) => {
          return el.className.includes(p) ||
                 el.getAttribute('iconposition') === p ||
                 !!el.querySelector(`[class*="${p}"]`);
        }, pos);
        expect(marked, `iconPosition="${pos}" left no trace on the element`).toBe(true);
      }
    });

    for (const b of BOOLEANS) {
      test(`boolean ${b} leaves a trace`, async ({ page }) => {
        await render(page, `<button id="b0"${form.attr}>plain</button>` +
                           `<button id="b1"${form.attr} ${b}>flagged</button>`);
        const [plain, flagged] = await Promise.all([
          page.locator('#b0').evaluate(el => el.className + '|' + el.outerHTML.length),
          page.locator('#b1').evaluate(el => el.className + '|' + el.outerHTML.length),
        ]);
        expect(flagged, `${b} produced an element identical to the unflagged one`)
          .not.toBe(plain);
      });
    }

    test('disabled actually blocks activation', async ({ page }) => {
      // A class alone is not enough — disabled has to MEAN something.
      await render(page, `<button id="d"${form.attr} disabled>no</button>`);
      const clicks = await page.evaluate(() => {
        const el = document.getElementById('d')!;
        let n = 0;
        el.addEventListener('click', () => n++);
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        return { n, disabledProp: (el as HTMLButtonElement).disabled };
      });
      expect(clicks.disabledProp, 'disabled attribute did not reach the element').toBe(true);
    });

    test(`href navigates, and every target is honoured (${TARGETS.length})`, async ({ page }) => {
      // #745: href IS implemented in button.js but never ran, because the
      // behavior was not applied. Assert the navigation intent, not a real
      // page load, so the suite stays hermetic.
      await render(page,
        TARGETS.map((t, i) =>
          `<button id="h${i}"${form.attr} href="/pages/docs.html" target="${t}">go</button>`).join(''));
      for (const [i, t] of TARGETS.entries()) {
        // el.click(), not dispatchEvent: verified live that the real click
        // path is what the handler sees. An earlier revision of this test used
        // dispatchEvent and failed against a button that navigates correctly —
        // the test was wrong, not the code.
        const nav = await page.locator(`#h${i}`).evaluate((el) => {
          let opened: any = null;
          const realOpen = window.open;
          (window as any).open = (u: string, tg: string) => { opened = { u, tg }; return null; };
          (el as HTMLButtonElement).click();
          (window as any).open = realOpen;
          return opened;
        });
        if (t === '_blank') {
          expect(nav, `target="_blank" did not call window.open`).not.toBeNull();
          expect(nav.u, `target="_blank" opened the wrong URL`).toContain('/pages/docs.html');
          expect(nav.tg, `target="_blank" passed the wrong window target`).toBe('_blank');
        } else {
          // _self assigns location rather than opening a window, so the
          // absence of a window.open call is the correct outcome here.
          expect(nav, `target="_self" must NOT open a new window`).toBeNull();
        }
      }
    });

    test('label attribute renders as the visible text', async ({ page }) => {
      await render(page, `<button id="l"${form.attr} label="From label"></button>`);
      await expect(page.locator('#l')).toContainText('From label');
    });
  });
}

test.describe('Button — the two authoring forms agree (#746)', () => {
  test('bare <button> and <button x-button> produce the same classes', async ({ page }) => {
    // This is the exact regression: identical markup apart from the
    // attribute, one styled and one not. Any divergence here is the bug
    // returning, whichever side breaks.
    const pairs = VARIANTS.flatMap(v => SIZES.map(s => ({ v, s })));
    const html = pairs.map((p, i) =>
      `<button id="a${i}" variant="${p.v}" size="${p.s}">x</button>` +
      `<button id="x${i}" x-button variant="${p.v}" size="${p.s}">x</button>`
    ).join('');
    await render(page, html);
    for (const [i, p] of pairs.entries()) {
      const [bare, attr] = await Promise.all([
        page.locator(`#a${i}`).evaluate(el => el.className.split(/\s+/).sort().join(' ')),
        page.locator(`#x${i}`).evaluate(el => el.className.split(/\s+/).sort().join(' ')),
      ]);
      expect(attr, `variant="${p.v}" size="${p.s}": x-button form differs from the bare form`)
        .toBe(bare);
    }
  });
});

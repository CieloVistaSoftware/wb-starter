import { test, expect, type Page } from '../fixtures/offline';
import { injectAndScan } from '../helpers/inject-and-scan';

/**
 * #1095 batch 1: the form-control classes behaviors add, each given the rule it
 * was missing.
 *
 * Before this, inputgroup.js and formrow.js added their classes and no
 * stylesheet defined them. Neither behavior was in behavior-css-manifest.js
 * either, so nothing was loaded for them. The docs promise "one visually
 * joined control" and a label and control "on one line". What rendered was
 * the `$` on one line, the input on the next and `USD` on a third, and an
 * "inline" row stacked exactly like a plain one. A colour picker was the
 * browser's light-grey default box inside a dark theme, a loading
 * autocomplete looked idle, and autosize's resting overflow came from a
 * generated rule rather than a stylesheet.
 *
 * Each test proves three things about a class:
 *   1. the element carries no style attribute, so nothing is inline;
 *   2. a rule in a LOADED stylesheet names the class, so the look is findable;
 *   3. the look follows the theme or yields to an author rule, which an inline
 *      value never does.
 */

/** Does a loaded stylesheet hold a rule whose selector names `.cls`? */
async function ruleNames(page: Page, cls: string): Promise<boolean> {
  return page.evaluate((c) => {
    const re = new RegExp(`\\.${c}(?![\\w-])`);
    const walk = (rules: CSSRuleList): boolean => [...rules].some((r: any) =>
      (r.selectorText && re.test(r.selectorText)) || (r.cssRules && walk(r.cssRules)));
    return [...document.styleSheets].some((s) => { try { return walk(s.cssRules); } catch { return false; } });
  }, cls);
}

/** A token's current value, resolved the way the browser resolves it for `prop`. */
async function token(page: Page, prop: string, name: string): Promise<string> {
  return page.evaluate(({ p, n }) => {
    const probe = document.createElement('div');
    probe.style.setProperty(p, `var(${n})`);
    document.body.appendChild(probe);
    const v = getComputedStyle(probe).getPropertyValue(p);
    probe.remove();
    return v;
  }, { p: prop, n: name });
}

const css = (page: Page, sel: string, prop: string, pseudo?: string) =>
  page.locator(sel).first().evaluate((el, a) => getComputedStyle(el, a.pseudo).getPropertyValue(a.prop), { prop, pseudo: pseudo ?? null });
const box = (page: Page, sel: string) => page.locator(sel).first().evaluate((el) => {
  const r = el.getBoundingClientRect();
  return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width };
});
const noStyleAttr = (page: Page, sel: string) =>
  page.locator(sel).evaluateAll((els) => els.filter((e) => e.hasAttribute('style')).map((e) => e.outerHTML));

test.describe('#1095 form-control classes are styled by stylesheet rules', () => {
  // The autocomplete test holds its fetch with page.route(); a live service
  // worker would answer first and the mock would never apply (#1349).
  test.use({ serviceWorkers: 'block' });

  test('x-inputgroup joins its addons and control into one row, themed', async ({ page }) => {
    await injectAndScan(page, `
      <div x-inputgroup id="ig"><span data-prepend>$</span><input type="number" placeholder="0.00"><span data-append>USD</span></div>`);
    for (const c of ['x-inputgroup', 'x-inputgroup__prepend', 'x-inputgroup__append']) {
      expect(await ruleNames(page, c), `a loaded stylesheet styles .${c}`).toBe(true);
    }
    expect(await noStyleAttr(page, '#ig, #ig *')).toEqual([]);

    expect(await css(page, '#ig', 'display')).toBe('flex');
    const pre = await box(page, '#ig .x-inputgroup__prepend');
    const ctl = await box(page, '#ig input');
    const app = await box(page, '#ig .x-inputgroup__append');
    // One row, edge to edge: the addons sit level with the control and touch it.
    expect(Math.abs(pre.top - ctl.top)).toBeLessThanOrEqual(1);
    expect(Math.abs(app.top - ctl.top)).toBeLessThanOrEqual(1);
    expect(Math.abs(pre.right - ctl.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(ctl.right - app.left)).toBeLessThanOrEqual(1);
    // Joined: the control's corners against an addon are square, its own outer corners are not touched.
    expect(await css(page, '#ig input', 'border-top-left-radius')).toBe('0px');
    expect(await css(page, '#ig input', 'border-top-right-radius')).toBe('0px');
    expect(await css(page, '#ig .x-inputgroup__prepend', 'border-top-left-radius')).not.toBe('0px');

    // The addon's fill is the theme's tertiary background, and follows a theme switch.
    const dark = await css(page, '#ig .x-inputgroup__prepend', 'background-color');
    expect(dark).toBe(await token(page, 'background-color', '--bg-tertiary'));
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    const light = await css(page, '#ig .x-inputgroup__prepend', 'background-color');
    expect(light).toBe(await token(page, 'background-color', '--bg-tertiary'));
    expect(light).not.toBe(dark);

    // An author rule wins on ordinary specificity -- impossible against an inline value.
    await page.addStyleTag({ content: '#ig .x-inputgroup__append { background-color: rgb(1, 2, 3); }' });
    expect(await css(page, '#ig .x-inputgroup__append', 'background-color')).toBe('rgb(1, 2, 3)');
  });

  test('x-formrow stacks label over control, and inline puts them on one line', async ({ page }) => {
    await injectAndScan(page, `
      <div x-formrow id="fr"><label>Name</label><input type="text"></div>
      <div x-formrow data-inline id="fri"><label>Email</label><input type="email"></div>`);
    for (const c of ['x-formrow', 'x-formrow--inline']) {
      expect(await ruleNames(page, c), `a loaded stylesheet styles .${c}`).toBe(true);
    }
    expect(await noStyleAttr(page, '#fr, #fr *, #fri, #fri *')).toEqual([]);

    expect(await css(page, '#fr', 'display')).toBe('flex');
    expect(await css(page, '#fr', 'flex-direction')).toBe('column');
    const lab = await box(page, '#fr label');
    const inp = await box(page, '#fr input');
    expect(lab.bottom).toBeLessThanOrEqual(inp.top + 1);

    expect(await css(page, '#fri', 'flex-direction')).toBe('row');
    const ilab = await box(page, '#fri label');
    const iinp = await box(page, '#fri input');
    // Same line: the label sits within the control's height, to its left.
    expect(ilab.top).toBeGreaterThanOrEqual(iinp.top - 1);
    expect(ilab.bottom).toBeLessThanOrEqual(iinp.bottom + 1);
    expect(ilab.right).toBeLessThanOrEqual(iinp.left);

    await page.addStyleTag({ content: '#fri.x-formrow--inline { flex-direction: column; }' });
    expect(await css(page, '#fri', 'flex-direction')).toBe('column');
  });

  test('x-colorpicker is a themed swatch, not the browser default box', async ({ page }) => {
    await injectAndScan(page, `
      <input type="text" x-colorpicker value="#ff0000" id="cp">
      <div x-colorpicker id="cp2" value="#00ff00"></div>`);
    for (const c of ['x-colorpicker', 'x-colorpicker__input']) {
      expect(await ruleNames(page, c), `a loaded stylesheet styles .${c}`).toBe(true);
    }
    expect(await noStyleAttr(page, '#cp, #cp2, #cp2 *')).toEqual([]);
    for (const sel of ['#cp', '#cp2 .x-colorpicker__input']) {
      expect(await css(page, sel, 'cursor')).toBe('pointer');
      expect(await css(page, sel, 'background-color')).toBe(await token(page, 'background-color', '--bg-secondary'));
      expect(await css(page, sel, 'border-top-color')).toBe(await token(page, 'border-top-color', '--border-color'));
    }
    const dark = await css(page, '#cp', 'background-color');
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    const light = await css(page, '#cp', 'background-color');
    expect(light).toBe(await token(page, 'background-color', '--bg-secondary'));
    expect(light).not.toBe(dark);
  });

  test('x-autocomplete shows that it is loading while its remote items are in flight', async ({ page }) => {
    let release!: () => void;
    const held = new Promise<void>((r) => { release = r; });
    await page.route('**/ac-items-1095.json', async (route) => {
      await held;
      await route.fulfill({ contentType: 'application/json', body: '["Apple","Banana"]' });
    });
    await injectAndScan(page, '<input x-autocomplete src="/ac-items-1095.json" id="ac">');
    expect(await ruleNames(page, 'x-autocomplete--loading')).toBe(true);
    const wrap = '.x-autocomplete:has(> #ac)';
    await expect(page.locator(wrap)).toHaveClass(/x-autocomplete--loading/);
    expect(await noStyleAttr(page, `${wrap}, ${wrap} *`)).toEqual([]);
    expect(await css(page, wrap, 'cursor')).toBe('progress');
    expect(await css(page, wrap, 'content', '::after')).not.toBe('none');
    expect(await css(page, wrap, 'border-top-color', '::after')).toBe(await token(page, 'border-top-color', '--primary'));

    release();
    await expect(page.locator(wrap)).not.toHaveClass(/x-autocomplete--loading/);
    expect(await css(page, wrap, 'content', '::after')).toBe('none');
    expect(await css(page, wrap, 'cursor')).not.toBe('progress');
  });

  test('x-select searchable stacks its filter box over the field from a stylesheet rule', async ({ page }) => {
    await injectAndScan(page, `<div x-select searchable id="ss" options='[{"value":"1","label":"One"}]'></div>`);
    expect(await ruleNames(page, 'x-select--searchable')).toBe(true);
    expect(await noStyleAttr(page, '#ss, #ss *')).toEqual([]);
    expect(await css(page, '#ss', 'display')).toBe('flex');
    expect(await css(page, '#ss', 'flex-direction')).toBe('column');
    const search = await box(page, '#ss .x-select__search');
    const field = await box(page, '#ss select');
    const host = await box(page, '#ss');
    // Search above the field, and the field keeps its own width rather than stretching.
    expect(search.bottom).toBeLessThanOrEqual(field.top);
    expect(field.width).toBeLessThan(host.width / 2);
  });

  test('x-textarea autosize rests at overflow hidden from the stylesheet, not a generated rule', async ({ page }) => {
    await injectAndScan(page, '<textarea x-textarea autosize id="ta"></textarea>');
    expect(await ruleNames(page, 'x-textarea--autosize')).toBe(true);
    expect(await noStyleAttr(page, '#ta')).toEqual([]);
    expect(await css(page, '#ta', 'overflow-y')).toBe('hidden');
    // The resting overflow is the stylesheet's: the per-element generated rule
    // carries only the measured height (and overflow:auto once the text is
    // taller than max-rows), so it no longer restates what the class says.
    const generated = await page.locator('#ta').evaluate((el) => {
      const tokens = (el.getAttribute('data-x-style') || '').split(/\s+/).filter(Boolean);
      const sheets = [...document.adoptedStyleSheets, ...[...document.styleSheets]];
      const texts: string[] = [];
      for (const sh of sheets) {
        let rules: CSSRuleList; try { rules = sh.cssRules; } catch { continue; }
        for (const r of [...rules] as CSSStyleRule[]) {
          if (r.selectorText && tokens.some((t) => r.selectorText.includes(t))) texts.push(r.cssText);
        }
      }
      return texts;
    });
    expect(generated.length, 'autosize still generates its measured height').toBeGreaterThan(0);
    expect(generated.filter((t) => /overflow/.test(t))).toEqual([]);
  });
});

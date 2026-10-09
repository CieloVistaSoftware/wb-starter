import { test, expect, type Page } from '../fixtures/offline';
import { injectAndScan } from '../helpers/inject-and-scan';

/**
 * #1095 batches 3 and 4: identity classes behaviors add that no stylesheet defined.
 * Each class here now has a rule that changes what the reader sees; the ones
 * that need no rule are recorded, with the reason, in NEEDS_NO_RULE in
 * tests/compliance/behavior-classes-have-a-rule.spec.ts.
 *
 * Every test proves the same three things as batch 2's
 * state-classes-have-rules.spec.ts:
 *   1. no style attribute on the element (nothing inline);
 *   2. a rule in a LOADED stylesheet names the class (the look is findable);
 *   3. the computed look is the rule's: a theme token's value, or a value the
 *      element did not have before.
 */

async function ruleNames(page: Page, cls: string): Promise<boolean> {
  return page.evaluate((c) => {
    const re = new RegExp(`\\.${c}(?![\\w-])`);
    const walk = (rules: CSSRuleList): boolean => [...rules].some((r: any) =>
      (r.selectorText && re.test(r.selectorText)) || (r.cssRules && walk(r.cssRules))
      || (r.styleSheet && walk(r.styleSheet.cssRules)));
    return [...document.styleSheets].some((s) => { try { return walk(s.cssRules); } catch { return false; } });
  }, cls);
}

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

const css = (page: Page, sel: string, prop: string) =>
  page.locator(sel).first().evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);
const hasStyleAttr = (page: Page, sel: string) =>
  page.locator(sel).evaluateAll((els) => els.filter((e) => e.hasAttribute('style')).map((e) => e.outerHTML.slice(0, 120)));

/**
 * Apply a behavior with WB.inject() to a host that does NOT carry its
 * attribute -- the path a script or a schema-built host takes. The behavior
 * adds its class either way; only a rule on the class reaches this host.
 */
async function injectWithoutAttribute(page: Page, tag: string, id: string, behavior: string, text = ''): Promise<void> {
  await injectAndScan(page, '');
  await page.evaluate(async ({ t, i, b, x }) => {
    const el = document.createElement(t);
    el.id = i;
    el.textContent = x;
    document.getElementById('test-container')!.appendChild(el);
    await (window as any).WB.inject(el, b);
  }, { t: tag, i: id, b: behavior, x: text });
}

test.describe('#1095 batch 3: identity classes are styled by stylesheet rules', () => {
  test.describe('the host look follows the class, not only the attribute', () => {
    test('x-avatar: an avatar applied by WB.inject() is a circle', async ({ page }) => {
      await injectWithoutAttribute(page, 'span', 'av', 'avatar');
      await expect(page.locator('#av')).toHaveClass(/x-avatar/);
      expect(await page.locator('#av').getAttribute('x-avatar')).toBeNull();
      expect(await ruleNames(page, 'x-avatar')).toBe(true);
      expect(await hasStyleAttr(page, '#av')).toEqual([]);
      expect(await css(page, '#av', 'border-radius')).toBe('50%');
      const w = await css(page, '#av', 'width');
      expect(parseFloat(w), 'a sized box, not an empty inline span').toBeGreaterThan(0);
      expect(await css(page, '#av', 'height')).toBe(w);
      expect(await css(page, '#av', 'background-color')).toBe(await token(page, 'background-color', '--primary'));
    });

    test('x-chip: a chip applied by WB.inject() is a pill', async ({ page }) => {
      await injectWithoutAttribute(page, 'span', 'ch', 'chip', 'Tag');
      await expect(page.locator('#ch')).toHaveClass(/x-chip/);
      expect(await ruleNames(page, 'x-chip')).toBe(true);
      expect(await hasStyleAttr(page, '#ch')).toEqual([]);
      expect(await css(page, '#ch', 'border-radius')).toBe('999px');
      expect(await css(page, '#ch', 'display')).toBe('inline-flex');
      expect(await css(page, '#ch', 'background-color')).toBe(await token(page, 'background-color', '--bg-tertiary'));
    });

    test('x-collapse: a collapse applied by WB.inject() to a <span> is a block', async ({ page }) => {
      await injectWithoutAttribute(page, 'span', 'co', 'collapse', 'Body');
      await expect(page.locator('#co')).toHaveClass(/x-collapse/);
      expect(await ruleNames(page, 'x-collapse')).toBe(true);
      expect(await hasStyleAttr(page, '#co')).toEqual([]);
      expect(await css(page, '#co', 'display')).toBe('block');
    });

    test('x-themecontrol: a theme control applied by WB.inject() sits inline', async ({ page }) => {
      await injectWithoutAttribute(page, 'div', 'tc', 'themecontrol');
      await expect(page.locator('#tc')).toHaveClass(/x-themecontrol/);
      expect(await ruleNames(page, 'x-themecontrol')).toBe(true);
      expect(await hasStyleAttr(page, '#tc')).toEqual([]);
      expect(await css(page, '#tc', 'display')).toBe('inline-block');
    });

    // #1095 batch 4: demo.css styled only [x-demo], so a demo applied by
    // WB.inject() got none of its box: content flush to the edge, nothing
    // clipping a wide code sample.
    test('x-demo: a demo applied by WB.inject() keeps its padded, clipped box', async ({ page }) => {
      await injectAndScan(page, '');
      await page.evaluate(async () => {
        const el = document.createElement('div');
        el.id = 'dm';
        el.innerHTML = '<button>Hi</button>';
        document.getElementById('test-container')!.appendChild(el);
        await (window as any).WB.inject(el, 'demo');
      });
      await expect(page.locator('#dm')).toHaveClass(/(^|\s)x-demo(\s|$)/);
      expect(await page.locator('#dm').getAttribute('x-demo')).toBeNull();
      expect(await ruleNames(page, 'x-demo')).toBe(true);
      expect(await hasStyleAttr(page, '#dm')).toEqual([]);
      expect(await css(page, '#dm', 'padding-left')).toBe('16px');
      expect(await css(page, '#dm', 'margin-bottom')).toBe('16px');
      expect(await css(page, '#dm', 'overflow-x')).toBe('hidden');
    });
  });

  test('x-fieldset: the group frame takes the theme border colour, not the browser groove', async ({ page }) => {
    await injectAndScan(page, '<fieldset x-fieldset id="fs"><legend>Contact</legend><input name="n"></fieldset>');
    await expect(page.locator('#fs')).toHaveClass(/x-fieldset/);
    expect(await ruleNames(page, 'x-fieldset')).toBe(true);
    expect(await hasStyleAttr(page, '#fs')).toEqual([]);
    expect(await css(page, '#fs', 'border-top-style')).toBe('solid');
    expect(await css(page, '#fs', 'border-top-color')).toBe(await token(page, 'border-top-color', '--border-color'));
  });

  test('x-help: hint text is quieter than body text', async ({ page }) => {
    await injectAndScan(page, '<p id="body">Body</p><span x-help id="hp">Find this under Developer.</span>');
    await expect(page.locator('#hp')).toHaveClass(/x-help/);
    expect(await ruleNames(page, 'x-help')).toBe(true);
    expect(await hasStyleAttr(page, '#hp')).toEqual([]);
    const secondary = await token(page, 'color', '--text-secondary');
    expect(await css(page, '#hp', 'color')).toBe(secondary);
    expect(parseFloat(await css(page, '#hp', 'font-size'))).toBeLessThan(parseFloat(await css(page, '#body', 'font-size')));
  });

  test('x-error: an error message reads in the danger colour', async ({ page }) => {
    await injectAndScan(page, '<p id="body">Body</p><span x-error id="er">Email is required.</span>');
    await expect(page.locator('#er')).toHaveClass(/x-error/);
    expect(await ruleNames(page, 'x-error')).toBe(true);
    expect(await hasStyleAttr(page, '#er')).toEqual([]);
    const danger = await token(page, 'color', '--danger-color');
    expect(danger).not.toBe(await css(page, '#body', 'color'));
    expect(await css(page, '#er', 'color')).toBe(danger);
  });

  test('x-file: the picker is a dashed drop area in theme colours', async ({ page }) => {
    await injectAndScan(page, '<div x-file id="fl">Attach a file</div>');
    await expect(page.locator('#fl')).toHaveClass(/x-file/);
    expect(await ruleNames(page, 'x-file')).toBe(true);
    expect(await hasStyleAttr(page, '#fl, #fl *')).toEqual([]);
    expect(await css(page, '#fl', 'border-top-style')).toBe('dashed');
    expect(await css(page, '#fl', 'border-top-color')).toBe(await token(page, 'border-top-color', '--border-color'));
    expect(await css(page, '#fl', 'background-color')).toBe(await token(page, 'background-color', '--bg-secondary'));
  });

  test('x-masked and x-countup: digits are all one width', async ({ page }) => {
    await injectAndScan(page, '<input x-masked mask="(999) 999-9999" id="mk"><span x-countup to="100" id="cu">0</span>');
    for (const [sel, cls] of [['#mk', 'x-masked'], ['#cu', 'x-countup']]) {
      await expect(page.locator(sel)).toHaveClass(new RegExp(cls));
      expect(await ruleNames(page, cls), cls).toBe(true);
      expect(await hasStyleAttr(page, sel), cls).toEqual([]);
      expect(await css(page, sel, 'font-variant-numeric'), cls).toBe('tabular-nums');
    }
  });

  test('x-relativetime: "3 days ago" never breaks across lines', async ({ page }) => {
    await injectAndScan(page, '<div id="rt-box"><span x-relativetime date="2020-01-01" id="rt"></span></div>');
    // A column narrower than the phrase: without the rule it wraps at each space.
    await page.addStyleTag({ content: '#rt-box { width: 3rem; }' });
    await expect(page.locator('#rt')).toHaveClass(/x-relativetime/);
    expect(await ruleNames(page, 'x-relativetime')).toBe(true);
    expect(await hasStyleAttr(page, '#rt')).toEqual([]);
    expect(await css(page, '#rt', 'white-space')).toBe('nowrap');
    const lines = await page.locator('#rt').evaluate((el) => el.getClientRects().length);
    expect(lines).toBe(1);
  });

  test('x-gallery__item: a lightbox image shows the zoom-in cursor', async ({ page }) => {
    const img = '<img src="/images/placeholder.svg" alt="">';
    await injectAndScan(page, `<div x-gallery id="gl">${img}${img}</div><div x-gallery lightbox="false" id="gn">${img}</div>`);
    await expect(page.locator('#gl img').first()).toHaveClass(/x-gallery__item/);
    expect(await ruleNames(page, 'x-gallery__item')).toBe(true);
    expect(await hasStyleAttr(page, '#gl img')).toEqual([]);
    expect(await css(page, '#gl img', 'cursor')).toBe('zoom-in');
    // Without the lightbox nothing opens, and the cursor does not claim it.
    expect(await css(page, '#gn img', 'cursor')).not.toBe('zoom-in');
  });

  test('x-pre__line-number--placed: a number shows only once it sits on its line', async ({ page }) => {
    await injectAndScan(page, '');
    const early = await page.evaluate(async () => {
      const WB = (window as any).WB;
      const pre = document.createElement('pre');
      pre.id = 'lp';
      pre.setAttribute('x-pre', '');
      pre.textContent = 'first line\nsecond line\nthird line';
      // Hold the code on one row: pre.js will not place numbers it cannot tell apart.
      pre.style.setProperty('white-space', 'normal', 'important');
      document.getElementById('test-container')!.appendChild(pre);
      await WB.scan(pre.parentElement, { eager: true });
      for (let i = 0; i < 6; i++) await new Promise((r) => requestAnimationFrame(r));
      const nums = [...pre.parentElement!.querySelectorAll('.x-pre__line-numbers > div')];
      return {
        count: nums.length,
        placed: nums.filter((n) => n.classList.contains('x-pre__line-number--placed')).length,
        visible: nums.filter((n) => getComputedStyle(n).visibility === 'visible').length,
      };
    });
    expect(early.count, 'the pre behavior did not build a gutter, so this proves nothing').toBe(3);
    expect(early.placed).toBe(0);
    expect(early.visible, 'unplaced numbers piled onto line 1 were visible').toBe(0);
    expect(await ruleNames(page, 'x-pre__line-number--placed')).toBe(true);

    await page.evaluate(() => document.getElementById('lp')!.style.removeProperty('white-space'));
    const nums = page.locator('#lp').locator('xpath=..').locator('.x-pre__line-numbers > div');
    await expect(nums.and(page.locator('.x-pre__line-number--placed'))).toHaveCount(3);
    expect(await nums.evaluateAll((els) => els.map((e) => getComputedStyle(e).visibility))).toEqual(['visible', 'visible', 'visible']);
  });

  test('click-to-open triggers show the pointer cursor', async ({ page }) => {
    await injectAndScan(page, [
      '<span x-popover popover-title="Hi" content="More" id="t-popover">Info</span>',
      '<span x-offcanvas id="t-offcanvas">Menu</span>',
      '<span x-sheet id="t-sheet">Sheet</span>',
      '<span x-confirm message="Sure?" id="t-confirm">Delete</span>',
      '<span x-prompt message="Name?" id="t-prompt">Rename</span>',
      '<span x-toast message="Saved" id="t-toast">Save</span>',
    ].join(''));
    for (const name of ['popover', 'offcanvas', 'sheet', 'confirm', 'prompt', 'toast']) {
      const cls = `x-${name}--trigger`;
      const sel = `#t-${name}`;
      await expect(page.locator(sel), cls).toHaveClass(new RegExp(cls));
      expect(await ruleNames(page, cls), cls).toBe(true);
      expect(await hasStyleAttr(page, sel), cls).toEqual([]);
      expect(await css(page, sel, 'cursor'), cls).toBe('pointer');
    }
  });
});

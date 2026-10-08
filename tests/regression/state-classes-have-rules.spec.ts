import { test, expect, type Page } from '../fixtures/offline';
import { injectAndScan } from '../helpers/inject-and-scan';

/**
 * #1095 batch 2: state classes that behaviors toggle but no stylesheet defined,
 * so the state was invisible -- an errored stats card looked healthy, a box
 * being resized gave no sign of it, a lazy image popped in instead of fading.
 * Each now has a rule; one test per class proves:
 *   1. no style attribute on the element (nothing inline);
 *   2. a rule in a LOADED stylesheet names the class (the look is findable);
 *   3. the computed look is the theme token's value, or yields to an author
 *      rule -- which an inline value never would.
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

const css = (page: Page, sel: string, prop: string, pseudo?: string) =>
  page.locator(sel).first().evaluate((el, a) => getComputedStyle(el, a.pseudo).getPropertyValue(a.prop), { prop, pseudo: pseudo ?? null });
const hasStyleAttr = (page: Page, sel: string) =>
  page.locator(sel).evaluateAll((els) => els.filter((e) => e.hasAttribute('style')).map((e) => e.outerHTML.slice(0, 120)));

/** Declarations in the per-element generated rules (dynamic-style.js) on `sel`. */
const generatedRules = (page: Page, sel: string) => page.locator(sel).first().evaluate((el) => {
  const tokens = (el.getAttribute('data-x-style') || '').split(/\s+/).filter(Boolean);
  const out: string[] = [];
  for (const sh of [...document.adoptedStyleSheets, ...document.styleSheets]) {
    let rules: CSSRuleList; try { rules = sh.cssRules; } catch { continue; }
    for (const r of [...rules] as CSSStyleRule[]) {
      if (r.selectorText && tokens.some((t) => r.selectorText.includes(t))) out.push(r.cssText);
    }
  }
  return out;
});

test.describe('#1095 batch 2: state classes are styled by stylesheet rules', () => {
  // The lazy-image test holds its request with page.route(); a live service
  // worker would answer first and the hold would never apply (#1349).
  test.use({ serviceWorkers: 'block' });

  test('x-card--expanded: the open height comes from card.css, not a generated rule', async ({ page }) => {
    await injectAndScan(page, `<article x-cardexpandable id="ce" title="Details" max-height="40px">${'Long body text. '.repeat(40)}</article>`);
    expect(await ruleNames(page, 'x-card--expanded')).toBe(true);
    const body = '#ce > .x-card__expandable-content';
    expect(await css(page, body, 'max-height')).toBe('40px');

    await page.locator('#ce .x-card__expand-btn').click();
    await expect(page.locator('#ce')).toHaveClass(/x-card--expanded/);
    expect(await hasStyleAttr(page, `#ce, ${body}`)).toEqual([]);
    await expect.poll(() => css(page, body, 'max-height')).toBe('1000px');
    // The generated rule now carries only the collapsed height; open is the class's.
    expect((await generatedRules(page, body)).filter((t) => /max-height/.test(t))).toEqual([]);
    await page.addStyleTag({ content: '#ce.x-card--expanded > .x-card__expandable-content { max-height: 77px; }' });
    await expect.poll(() => css(page, body, 'max-height')).toBe('77px');

    await page.locator('#ce .x-card__expand-btn').click();
    await expect(page.locator('#ce')).not.toHaveClass(/x-card--expanded/);
    await expect.poll(() => css(page, body, 'max-height')).toBe('40px');
  });

  test('x-card--expanded leaves a lines= card uncapped when open, as before', async ({ page }) => {
    await injectAndScan(page, `<article x-cardexpandable id="cl" title="Details" lines="2">${'Long body text. '.repeat(200)}</article>`);
    await page.locator('#cl .x-card__expand-btn').click();
    await expect(page.locator('#cl')).toHaveClass(/x-card--expanded/);
    expect(await css(page, '#cl > .x-card__expandable-content', 'max-height')).toBe('none');
  });

  test('x-cardstats--error: a stats card that failed to build says so, in the danger colour', async ({ page }) => {
    await injectAndScan(page, '<article x-cardstats id="cs-ok" value="42" label="Healthy"></article><article id="cs"></article>');
    // A value that is not a string makes cardstats() throw inside its guarded init.
    await page.evaluate(async () => {
      const m = await import('/src/wb-viewmodels/card.js');
      const el = document.getElementById('cs')!;
      el.setAttribute('x-cardstats', '');
      m.cardstats(el, { value: {} as unknown as string });
    });
    await expect(page.locator('#cs')).toHaveClass(/x-cardstats--error/);
    expect(await ruleNames(page, 'x-cardstats--error')).toBe(true);
    expect(await hasStyleAttr(page, '#cs')).toEqual([]);
    const danger = await token(page, 'border-left-color', '--danger-color');
    await expect.poll(() => css(page, '#cs', 'border-left-color')).toBe(danger);
    expect(await css(page, '#cs', 'border-left-width')).toBe('4px');
    expect(await css(page, '#cs', 'content', '::after')).toContain(await page.locator('#cs').getAttribute('x-error') as string);
    expect(await css(page, '#cs', 'color', '::after')).toBe(await token(page, 'color', '--danger-color'));
    // The healthy card beside it carries none of it.
    expect(await css(page, '#cs-ok', 'content', '::after')).toBe('none');
  });

  test('x-copy--copied: the "Copied!" feedback takes the success colour', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await injectAndScan(page, '<button x-copy text="hello" id="cp">Copy</button>');
    expect(await ruleNames(page, 'x-copy--copied')).toBe(true);
    const idle = await css(page, '#cp', 'color');
    await page.locator('#cp').click();
    await expect(page.locator('#cp')).toHaveClass(/x-copy--copied/);
    expect(await hasStyleAttr(page, '#cp')).toEqual([]);
    const success = await token(page, 'color', '--success-color');
    expect(success).not.toBe(idle);
    await expect.poll(() => css(page, '#cp', 'color')).toBe(success);
  });

  test('x-lazy--loading dims the placeholder; x-lazy--loaded fades the image in', async ({ page }) => {
    let release!: () => void;
    const held = new Promise<void>((r) => { release = r; });
    await page.route('**/lazy-1095.svg', async (route) => {
      await held;
      await route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40"/></svg>' });
    });
    await injectAndScan(page, '<img x-lazy src="/lazy-1095.svg" alt="" id="lz" width="40" height="40">');
    for (const c of ['x-lazy--loading', 'x-lazy--loaded']) expect(await ruleNames(page, c), c).toBe(true);
    await expect(page.locator('#lz')).toHaveClass(/x-lazy--loading/);
    expect(await hasStyleAttr(page, '#lz')).toEqual([]);
    expect(await css(page, '#lz', 'opacity')).toBe('0.6');

    release();
    await expect(page.locator('#lz')).toHaveClass(/x-lazy--loaded/);
    await expect.poll(() => css(page, '#lz', 'opacity')).toBe('1');
    expect(await css(page, '#lz', 'transition-property')).toContain('opacity');
  });

  test('x-resizable--resizing: a box being dragged is outlined in the primary colour', async ({ page }) => {
    await injectAndScan(page, '<div x-resizable id="rz">Resize me from the corner</div>');
    expect(await ruleNames(page, 'x-resizable--resizing')).toBe(true);
    expect(await css(page, '#rz', 'outline-style')).toBe('none');
    const h = await page.locator('#rz .x-resizable__handle--se').boundingBox();
    await page.mouse.move(h!.x + h!.width / 2, h!.y + h!.height / 2);
    await page.mouse.down();
    await expect(page.locator('#rz')).toHaveClass(/x-resizable--resizing/);
    expect(await hasStyleAttr(page, '#rz')).toEqual([]);
    expect(await css(page, '#rz', 'outline-style')).toBe('dashed');
    expect(await css(page, '#rz', 'outline-color')).toBe(await token(page, 'outline-color', '--primary'));
    expect(await css(page, '#rz', 'user-select')).toBe('none');
    await page.mouse.up();
    await expect(page.locator('#rz')).not.toHaveClass(/x-resizable--resizing/);
    expect(await css(page, '#rz', 'outline-style')).toBe('none');
  });

  test('x-rating--half: the stars touch, so every point along the row picks a half', async ({ page }) => {
    await injectAndScan(page, '<span x-rating half value="2.5" id="rh"></span><span x-rating value="2" id="rf"></span>');
    expect(await ruleNames(page, 'x-rating--half')).toBe(true);
    expect(await hasStyleAttr(page, '#rh, #rh *')).toEqual([]);
    expect(await css(page, '#rh', 'column-gap')).toBe('0px');
    const rects = await page.locator('#rh .x-rating__star').evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => [r.left, r.right]));
    for (let i = 1; i < rects.length; i++) expect(Math.abs(rects[i][0] - rects[i - 1][1])).toBeLessThanOrEqual(0.5);
    // Same spacing between glyphs as a whole-star rating: the gap became padding.
    const pitch = (sel: string) => page.locator(`${sel} .x-rating__star`).evaluateAll((els) => els[1].getBoundingClientRect().left - els[0].getBoundingClientRect().left);
    expect(Math.abs((await pitch('#rh')) - (await pitch('#rf')))).toBeLessThanOrEqual(0.5);
  });

  test('x-textarea--has-counter: the field cannot be widened past its counter', async ({ page }) => {
    await injectAndScan(page, '<div id="host"><textarea x-textarea show-count maxlength="20" resize="both" id="tc"></textarea></div>');
    expect(await ruleNames(page, 'x-textarea--has-counter')).toBe(true);
    expect(await hasStyleAttr(page, '#tc')).toEqual([]);
    // A horizontal resize drag (or any wider author width) used to push the
    // field past the wrapper, leaving the counter stranded at the old edge.
    await page.addStyleTag({ content: '#host .x-textarea { width: 3000px; }' });
    const field = await page.locator('#tc').boundingBox();
    const counter = await page.locator('#host > .x-textarea__wrapper > .x-textarea__counter').boundingBox();
    expect(Math.abs((field!.x + field!.width) - (counter!.x + counter!.width))).toBeLessThanOrEqual(1);
  });
});

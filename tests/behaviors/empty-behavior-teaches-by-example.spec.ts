/**
 * AN EMPTY BEHAVIOR TEACHES BY EXAMPLE
 * ====================================
 * #1102, and the first test of any kind over `src/core/teach-by-example.js` —
 * the feature shipped in `bbb9e9f9` with no spec at all.
 *
 * `<div x-cardhero></div>` applies the behavior and always did: x-card--hero,
 * three children, min-height 400px. It is simply EMPTY, so it renders a 400px
 * blank box, nothing throws, and nothing reports. The fill answers that.
 *
 * WHAT IS GUARANTEED HERE
 * -----------------------
 *   1. an empty invocation is filled from the CURATED example — real copy, not
 *      field names. "while this is better it does no teaching" (John) was said
 *      about a first version that wrote `title="title — Hero headline"`: a
 *      labelled skeleton proves the behavior ran and teaches nothing.
 *   2. the names it teaches are the names that are TYPED — `cta-href`, never
 *      the squashed `ctahref` that writing a camelCase schema property
 *      produces once the DOM lower-cases it (#952's disease, 23 properties).
 *   3. it does NOT fire when the author supplied something. A deliberately
 *      minimal usage is never overwritten.
 *
 * BOTH RUNTIMES, DELIBERATELY
 * ---------------------------
 * `index.html` loads wb.js; the demo pages load wb-lazy.js. The feature was
 * written in wb-lazy first and did nothing in the doc viewer, which is why it
 * lives in one shared module. Asserting it in one runtime would let the other
 * drift, and that drift is precisely #333 and #1056.
 */
import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** The curated hero copy, read from the catalogue the runtime fills from. */
function curatedHero(): Record<string, string> {
  const raw = fs.readFileSync(path.join(ROOT, 'data', 'behavior-examples.json'), 'utf8');
  const entry = JSON.parse(raw).examples['x-cardhero'];
  expect(entry, 'x-cardhero must have a curated example for this spec to mean anything').toBeTruthy();

  const open = String(entry.source).match(/<[a-zA-Z][\w-]*([\s\S]*?)\/?>/);
  expect(open, 'the curated example must be markup with an opening tag').toBeTruthy();

  const attrs: Record<string, string> = {};
  const re = /([a-zA-Z_:][-\w:.]*)\s*=\s*"([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(open![1])) !== null) {
    if (m[1].startsWith('x-')) { continue; }
    attrs[m[1]] = m[2];
  }
  expect(Object.keys(attrs).length, 'the curated hero must carry attributes').toBeGreaterThan(2);
  return attrs;
}

/** Drop an element into the page and let the runtime decorate it. */
async function inject(page: Page, html: string): Promise<void> {
  await page.evaluate(async (markup: string) => {
    const host = document.createElement('div');
    host.id = 'teach-host';
    host.innerHTML = markup;
    document.body.appendChild(host);
    await (window as any).WB.scan(host, { eager: true });
  }, html);
}

async function attributesOf(page: Page, selector: string): Promise<Record<string, string>> {
  return page.evaluate((sel: string) => {
    const el = document.querySelector(sel)!;
    const out: Record<string, string> = {};
    for (const a of Array.from(el.attributes)) { out[a.name] = a.value; }
    return out;
  }, selector);
}

/** wb.js — the runtime index.html and the doc viewer load. */
test.describe('eager runtime (wb.js)', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('index.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors);
  });

  test('an empty x-cardhero fills itself with the curated example', async ({ page }: { page: Page }) => {
    const expected = curatedHero();
    await inject(page, '<div id="empty-hero" x-cardhero></div>');

    const attrs = await attributesOf(page, '#empty-hero');

    for (const [name, value] of Object.entries(expected)) {
      expect(attrs[name], `${name} should carry the curated value`).toBe(value);
    }

    // The example is the lesson, so it must not be the field's own name back.
    expect(attrs.title).not.toMatch(/^title\b/);
    expect(attrs.title).not.toContain('—');

    // And it says where the full reference is.
    expect(attrs['x-docs']).toBe('docs/behaviors/cardhero.md');
    expect(attrs['x-teaching-example']).toBe('cardhero');
  });

  test('the filled copy actually renders', async ({ page }: { page: Page }) => {
    const expected = curatedHero();
    await inject(page, '<div id="rendered-hero" x-cardhero></div>');

    const hero = page.locator('#rendered-hero');
    await expect(hero).toHaveClass(/x-card--hero/);
    await expect(hero.locator('.x-card__hero-title')).toHaveText(expected.title);
  });

  test('every taught attribute name is one a person can type', async ({ page }: { page: Page }) => {
    await inject(page, '<div id="spelling-hero" x-cardhero></div>');
    const attrs = await attributesOf(page, '#spelling-hero');

    // A camelCase schema property written with setAttribute lands squashed:
    // ctaSecondary -> ctasecondary, which no doc, example or IntelliSense entry
    // uses. Nothing the fill wrote may be spelled that way.
    const squashed = Object.keys(attrs).filter((n) => /^(ctahref|ctasecondary|ctasecondaryhref|headinglevel|fullheight)$/.test(n));
    expect(squashed, `squashed attribute names: ${squashed.join(', ')}`).toEqual([]);

    // The kebab spelling is the documented one, and it is what card.js reads.
    expect(attrs).toHaveProperty('cta-href');
  });

  test('a hero authored in the data- spelling is left alone too', async ({ page }: { page: Page }) => {
    // read-attr.js honours `data-title` as one of the three spellings a value
    // can be authored in, so this element is NOT empty. Treating `data-` as
    // plumbing made the fill run and write the curated title over the author's,
    // which the commit gate caught across cardhero, cardprofile and cardlink:
    // Expected "Hero Title", received "Zero build. Real components.".
    await inject(page, '<div id="data-hero" x-cardhero data-title="Big Hero"></div>');
    const attrs = await attributesOf(page, '#data-hero');

    expect(attrs['data-title']).toBe('Big Hero');
    expect(attrs, 'a data- attribute is authored content, not plumbing').not.toHaveProperty('x-teaching-example');
    expect(attrs).not.toHaveProperty('title');
    await expect(page.locator('#data-hero .x-card__hero-title')).toHaveText('Big Hero');
  });

  test('a hero the author wrote is left exactly as written', async ({ page }: { page: Page }) => {
    await inject(page, '<div id="authored-hero" x-cardhero title="Mine"></div>');
    const attrs = await attributesOf(page, '#authored-hero');

    expect(attrs.title).toBe('Mine');
    expect(attrs, 'an authored element must not be filled in').not.toHaveProperty('x-teaching-example');
    expect(attrs, 'and must not be handed a docs link').not.toHaveProperty('x-docs');
    expect(attrs).not.toHaveProperty('subtitle');
  });
});

/** wb-lazy.js — the runtime every demo page loads. Same module, same result. */
test.describe('lazy runtime (wb-lazy.js)', () => {
  test('an empty x-cardhero fills itself there too', async ({ page }: { page: Page }) => {
    const expected = curatedHero();

    await page.goto('demos/site/cards.html');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.scan);

    await inject(page, '<div id="lazy-hero" x-cardhero></div>');

    const attrs = await attributesOf(page, '#lazy-hero');
    expect(attrs.title, 'wb-lazy must teach the same lesson wb.js does').toBe(expected.title);
    expect(attrs['x-teaching-example']).toBe('cardhero');
  });
});

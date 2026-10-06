import { test, expect } from '../fixtures/offline';
import { waitForWB } from '../base';

/**
 * #945 -- no <main> inside a card.
 *
 * John: "the main context should fit without needing a main tag."
 *
 * It is stronger than taste: the HTML spec only allows a <main> whose
 * ancestors are html, body, div or form, so a <main> inside an <article>,
 * <section> or <aside> is invalid, and a page carrying one per card exposes
 * hundreds of "main" landmarks where there should be one. Measured on
 * demos/site/cards.html before the fix: 273 <main> elements, every one of them
 * inside a card.
 *
 * card.js built the card body as a <main> at eight sites. The body is now one
 * element with one class everywhere -- <div class="x-card__body"> -- and an
 * AUTHORED <main> inside a card is adopted into that same element.
 *
 * Every card behavior is rendered on the three hosts the spec forbids a <main>
 * under, with attributes broad enough that each builds its body, and the
 * whole stage is then counted with the issue's own detect expression.
 */

const HARNESS = '/demos/test-harness.html';

/** Every behavior that index.js routes to card.js. */
const CARDS = [
  'card', 'cardimage', 'cardvideo', 'cardbutton', 'cardhero', 'cardprofile',
  'cardpricing', 'cardstats', 'cardtestimonial', 'cardproduct', 'cardnotification',
  'cardfile', 'cardlink', 'cardhorizontal', 'carddraggable', 'cardexpandable',
  'cardminimizable', 'cardoverlay', 'cardportfolio',
];

const HOSTS = ['article', 'section', 'aside'];

/** Attributes broad enough that every variant renders a body. */
const COMMON =
  'title="Upgrade to Team" subtitle="Team plan" ' +
  'content="Shared workspaces, audit history and SSO." ' +
  'label="Team" value="42" icon="i" primary="Start" secondary="Compare" ' +
  'price="$19" features="One,Two" name="Ada Lovelace" role="Engineer" ' +
  'bio="Writes the first program." skills="Math,Engines" ' +
  'quote="It just works." author="Ada" message="Everything is fine." ' +
  'filename="report.pdf" href="/x" footer="Footer text"';

/** The issue's detect expression. */
const DETECT = 'article main, section main, aside main';

test.describe('a card body is not a <main> (#945)', () => {
  test('no card behavior builds a <main> inside its host', async ({ page }) => {
    await page.goto(HARNESS);
    await waitForWB(page);

    const result = await page.evaluate(async ({ cards, hosts, common, detect }) => {
      const stage = document.createElement('div');
      // On screen and a real width: the harness runs the lazy runtime, which
      // only builds what it can see.
      stage.style.cssText = 'position:absolute;top:0;left:0;width:640px;z-index:99999';
      stage.innerHTML = cards.flatMap((name) => hosts.map((tag) =>
        `<${tag} x-${name} ${common}>Authored body text</${tag}>`)).join('');
      document.body.appendChild(stage);
      await (window as any).WB.scan(stage, { eager: true });
      if ((window as any).WB.settled) await (window as any).WB.settled();

      const offenders = Array.from(stage.querySelectorAll(detect)).map((m) => {
        const host = m.closest('article, section, aside') as HTMLElement;
        const name = Array.from(host.attributes).find((a) => /^x-card/.test(a.name))?.name;
        return `<${host.tagName.toLowerCase()} ${name}> builds <main${m.className ? ` class="${m.className}"` : ''}>`;
      });
      return { offenders, bodies: stage.querySelectorAll('.x-card__body').length };
    }, { cards: CARDS, hosts: HOSTS, common: COMMON, detect: DETECT });

    expect(result.offenders, `a <main> inside a card is invalid HTML:\n${result.offenders.join('\n')}`).toEqual([]);
    // Not vacuous: the cards did build bodies, as the one class they all share.
    expect(result.bodies).toBeGreaterThan(CARDS.length);
  });

  test('an authored <main> inside an <article> becomes the card body, content kept', async ({ page }) => {
    await page.goto(HARNESS);
    await waitForWB(page);

    const result = await page.evaluate(async (detect) => {
      const stage = document.createElement('div');
      stage.style.cssText = 'position:absolute;top:0;left:0;width:640px';
      stage.innerHTML =
        '<article id="authored"><header><h3>Title</h3></header>' +
        '<main id="authored-body" data-note="kept">Authored body <b>live</b></main>' +
        '<footer>Foot</footer></article>';
      document.body.appendChild(stage);
      await (window as any).WB.scan(stage, { eager: true });
      if ((window as any).WB.settled) await (window as any).WB.settled();

      const card = document.getElementById('authored')!;
      const body = card.querySelector(':scope > .x-card__body') as HTMLElement | null;
      return {
        mains: stage.querySelectorAll(detect).length,
        tag: body?.tagName.toLowerCase() ?? null,
        id: body?.id ?? null,
        note: body?.getAttribute('data-note') ?? null,
        text: body?.innerText.trim() ?? null,
        order: Array.from(card.children).map((c) => c.tagName.toLowerCase()),
      };
    }, DETECT);

    expect(result.mains).toBe(0);
    expect(result.tag).toBe('div');
    // The author's element keeps its id, attributes and content.
    expect(result.id).toBe('authored-body');
    expect(result.note).toBe('kept');
    expect(result.text).toBe('Authored body live');
    expect(result.order).toEqual(['header', 'div', 'footer']);
  });
});

import { test, expect, newOfflinePage } from '../fixtures/offline';

// One browser context is built in beforeAll and shared by every test below
// (#1112): the per-test light trace is off for this file; WB_TRACE still forces one.
test.use({ trace: (process.env.WB_TRACE as 'on' | 'off' | 'retain-on-failure') || 'off' });

/**
 * A card's title is styled by the card, not by the page (#887).
 *
 * site.css styles every bare `h3` as a page heading: `color: var(--primary)`
 * and `margin: 1.5rem 0 0.75rem`. A card title that only that rule reaches
 * renders accent-blue (read as a link) with 1.5rem of dead space above it.
 * cardlink still did on 2026-10-05.
 *
 * Measuring it found a second fault in the same place: card.css's variant
 * title-tint block listed a bare `.x-card__title` and a bare `> header > h3`,
 * so every card title, variant or not, rendered --success-color green.
 *
 * Measured over every card behavior on the test harness, which loads site.css.
 */

// Cards that render title= as a heading. pricing, stats, testimonial, file and
// notification show other fields in that place.
const CARDS = [
  'card', 'cardimage', 'cardvideo', 'cardbutton', 'cardprofile', 'cardproduct',
  'cardlink', 'cardhorizontal', 'carddraggable', 'cardexpandable',
  'cardminimizable', 'cardportfolio',
];
const TITLE = 'Headphones';

type Row = { name: string; found: boolean; color: string; marginTop: string; textPrimary: string; success: string; variantColor: string };

test.describe('card titles are the card\'s, not the page\'s (#887)', () => {
  let rows: Row[];
  let page: { color: string; marginTop: string };

  test.beforeAll(async ({ browser }) => {
    const p = await newOfflinePage(browser);
    await p.goto('/demos/test-harness.html');
    await p.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });

    ({ rows, page } = await p.evaluate(async ({ list, title }) => {
      // What a bare page <h3> looks like: the style that leaked.
      const bare = document.createElement('h3');
      bare.textContent = 'Page heading';
      document.body.appendChild(bare);
      const page = { color: getComputedStyle(bare).color, marginTop: getComputedStyle(bare).marginTop };
      bare.remove();

      const colourOf = (el: HTMLElement, value: string) => {
        const probe = document.createElement('span');
        probe.style.color = value;
        el.appendChild(probe);
        const c = getComputedStyle(probe).color;
        probe.remove();
        return c;
      };
      const render = async (name: string, extra: string) => {
        const host = document.createElement('div');
        host.style.cssText = 'position:fixed;top:0;left:0;width:640px;z-index:99999';
        host.innerHTML = `<article x-${name} title="${title}" name="${title}" ${extra}></article>`;
        document.body.appendChild(host);
        await (window as any).WB.scan(host, { eager: true });
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const card = host.firstElementChild as HTMLElement;
        const heading = [...card.querySelectorAll('h1, h2, h3, h4')]
          .find((h) => (h.textContent || '').trim() === title) as HTMLElement | undefined;
        return { host, card, heading };
      };

      const out: any[] = [];
      for (const name of list) {
        const plain = await render(name, '');
        const textPrimary = colourOf(plain.card, 'var(--text-primary)');
        const success = colourOf(plain.card, 'var(--success-color)');
        const row: any = {
          name,
          found: !!plain.heading,
          color: plain.heading ? getComputedStyle(plain.heading).color : '',
          marginTop: plain.heading ? getComputedStyle(plain.heading).marginTop : '',
          textPrimary,
          success,
        };
        plain.host.remove();

        const tinted = await render(name, 'variant="success"');
        row.variantColor = tinted.heading ? getComputedStyle(tinted.heading).color : '';
        tinted.host.remove();
        out.push(row);
      }
      return { rows: out, page };
    }, { list: CARDS, title: TITLE }));

    await p.close();
  });

  test('the sweep found the title heading in every card', () => {
    expect(rows.filter((r) => !r.found).map((r) => r.name), 'cards with no title heading').toEqual([]);
  });

  test('the leaked values differ from the card\'s own, so the checks can fail', () => {
    expect(page.color).not.toBe(rows[0].textPrimary);
    expect(rows[0].success).not.toBe(rows[0].textPrimary);
    expect(page.marginTop).not.toBe('0px');
  });

  test('every card title uses --text-primary: not the page heading colour, not the success tint', () => {
    const wrong = rows.filter((r) => r.color !== r.textPrimary)
      .map((r) => `${r.name}: ${r.color} (want ${r.textPrimary}; page ${page.color}; success ${r.success})`);
    expect(wrong).toEqual([]);
  });

  test('no card title carries the page heading\'s top margin', () => {
    const wrong = rows.filter((r) => r.marginTop === page.marginTop).map((r) => `${r.name}: margin-top ${r.marginTop}`);
    expect(wrong).toEqual([]);
  });

  test('variant="success" still tints the title of a card that builds a header', () => {
    const headerCards = ['card', 'cardimage', 'cardvideo', 'cardbutton', 'carddraggable', 'cardexpandable'];
    const wrong = rows.filter((r) => headerCards.includes(r.name) && r.variantColor !== r.success)
      .map((r) => `${r.name}: ${r.variantColor} (want ${r.success})`);
    expect(wrong).toEqual([]);
  });
});

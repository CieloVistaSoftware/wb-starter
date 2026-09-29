import { test, expect } from '../fixtures/offline';
import { showBehavior, pickBehavior } from '../helpers/behaviors-page';

/**
 * #202 REGRESSION — runs in the gate, ALWAYS. The card double/quadruple title kept
 * coming back because TWO renderers built a card: the card behavior (.x-card__*)
 * AND a legacy MVVM template (schema $view / views-registry / partial → .card__*),
 * nesting → duplicate title/footer.
 *
 * It only reproduced on a SCHEMA-PROCESSED page (the SPA components page, where WB
 * assigns x-schema="card"), NOT the playground — the earlier test missed it by not
 * exercising that path (and by having its duplicate assertion trimmed out). These
 * assert on the schema-processed page.
 */
// The behaviors page is a searchable BROWSER now (#910): nothing is on the stage
// until a behavior is picked, so both tests pick the card they inspect instead
// of waiting for a gallery that no longer renders on load. And cards no longer
// carry .x-card / .x-card__title (a8a7362e -- card.css names the parts by tag),
// so a card is found by its behavior attribute and its title as `header > h3`.
const STAGE = '#behaviors-live-example';

test('x-card injects no phantom placeholder content (no "Lorem ipsum") (#202)', async ({ page }) => {
  await showBehavior(page, 'x-cardimage');

  // The demo's own text changes with the docs ("Image Card" once, "Harbour at
  // first light" now); the claim is about ANY image card, so no title filter.
  const imgCard = page.locator(`${STAGE} [x-cardimage]`).first();
  await expect(imgCard).toBeVisible({ timeout: 20000 });

  const text = (await imgCard.textContent()) || '';
  expect(text, 'card must not inject placeholder text (Lorem ipsum)').not.toMatch(/Lorem ipsum/i);
});

// The card family on the behaviors page. Each one is picked in turn, because
// the stage only ever holds one behavior's example.
const CARD_TOKENS = [
  'x-card', 'x-cardimage', 'x-cardvideo', 'x-cardhorizontal',
  'x-cardprofile', 'x-cardportfolio', 'x-carddraggable', 'x-cardhero',
];

test('cards render title/footer exactly once on the schema-processed page (#202)', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/?page=behaviors', { waitUntil: 'domcontentloaded' });

  const problems: string[] = [];
  let titledCards = 0;
  for (const token of CARD_TOKENS) {
    await pickBehavior(page, token);
    // <article> is the card's own form (x-card is auto-injected onto it), so
    // the host is either the attribute or the tag.
    const host = token === 'x-card' ? `${STAGE} article, ${STAGE} [x-card]` : `${STAGE} [${token}]`;
    const report = await page.evaluate((sel) => {
      const cards = [...document.querySelectorAll(sel)];
      const overCounted: { title: string; count: number }[] = [];
      let titled = 0;
      for (const c of cards) {
        const title = c.getAttribute('title');
        if (!title) continue;
        titled++;
        const re = new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const count = (c.textContent!.match(re) || []).length;
        if (count > 1) overCounted.push({ title, count });
      }
      return {
        titled,
        overCounted,
        // Zero LEGACY .card__* -- the behavior is the card's only renderer.
        legacyCardTitles: cards.reduce((n, c) => n + c.querySelectorAll('.card__title').length, 0),
        legacyCardHeaders: cards.reduce((n, c) => n + c.querySelectorAll('.card__header').length, 0),
      };
    }, host);
    titledCards += report.titled;
    for (const o of report.overCounted) problems.push(`${token}: "${o.title}" appears ${o.count}x`);
    if (report.legacyCardTitles) problems.push(`${token}: ${report.legacyCardTitles} legacy .card__title`);
    if (report.legacyCardHeaders) problems.push(`${token}: ${report.legacyCardHeaders} legacy .card__header`);
  }

  // A sweep that found no titled card asserted nothing (#863).
  expect(titledCards, 'no titled card was inspected at all').toBeGreaterThan(0);
  expect(problems, `cards whose title repeats, or that carry legacy .card__* chrome:\n${problems.join('\n')}`).toEqual([]);
});

import { test, expect } from '../fixtures/offline';
import { injectAndScan } from '../helpers/inject-and-scan';

/**
 * #1831: wb-lazy pages never applied declared modifier classes.
 *
 * applyDeclaredModifiers() (#770, #1147) turns each declared enum or boolean
 * property into its `{baseClass}--{value}` class, when a stylesheet defines
 * that class. It lived only in wb.js, so on every page that loads wb-lazy.js
 * -- demos/test-harness.html, everything under demos/, the behaviors page
 * stage -- `elevated` or `featured-tone="success"` did nothing unless the
 * behavior happened to hand-roll the class itself. It is shared now
 * (src/core/declared-modifiers.js) and both runtimes call it.
 *
 * Checked on the test harness, which loads wb-lazy.js, against behaviors whose
 * own JS does NOT add the class: only the shared applier can put it there.
 * Each case checks what a reader sees as well as the class.
 */
test('wb-lazy applies declared modifier classes, with the same rules as wb.js (#1831)', async ({ page }) => {
  await injectAndScan(page, [
    // boolean, stylesheet defines .x-cardnotification--elevated (notification.css)
    '<div id="noteElevated" x-cardnotification variant="warning" elevated title="Raised">msg</div>',
    '<div id="notePlain" x-cardnotification variant="warning" title="Flat">msg</div>',
    // boolean written "false" means OFF (#747)
    '<div id="noteFalse" x-cardnotification variant="warning" elevated="false" title="Off">msg</div>',
    // boolean on x-card: card.css styles `.x-card--elevated, [elevated]` in
    // one rule, so the attribute already does the job and a8a7362e's
    // "specificity, not class injection" holds -- no class, same look.
    '<article id="cardElevated" x-card elevated title="Card">Body</article>',
    // enum: featured-tone="success" -> .x-card--success (card.css accent stripe)
    '<article id="cardTone" x-card featured-tone="success" title="Toned">Body</article>',
    '<article id="cardNoTone" x-card title="Plain">Body</article>',
    // an undeclared enum value never mints a class
    '<article id="cardTypo" x-card featured-tone="sucess" title="Typo">Body</article>',
  ].join(''));

  // The index is fetched once and elements built before it arrives are
  // queued, so wait for the class rather than sampling once.
  const has = (id: string, cls: string) =>
    page.evaluate(([i, c]) => document.getElementById(i)!.classList.contains(c), [id, cls] as const);
  await expect.poll(() => has('noteElevated', 'x-cardnotification--elevated'),
    'elevated on x-cardnotification lands .x-cardnotification--elevated under wb-lazy').toBe(true);
  await expect.poll(() => has('cardTone', 'x-card--success'),
    'featured-tone="success" lands .x-card--success under wb-lazy').toBe(true);

  // Cards and notifications carry `transition: all 0.2s` (card.css), so the
  // border and shadow the class brings ANIMATE in. Read mid-transition, the
  // stripe measured 1px on CI's Windows runner and 3px here. Wait for the
  // elements' own transitions to finish -- the event, not a duration.
  await page.evaluate(() => Promise.all(['noteElevated', 'cardTone', 'cardElevated'].flatMap((id) =>
    document.getElementById(id)!.getAnimations().map((a) => a.finished.catch(() => undefined)))));

  const m = await page.evaluate(() => {
    const el = (id: string) => document.getElementById(id)!;
    const cs = (id: string) => getComputedStyle(el(id));
    return {
      noteFalseClass: el('noteFalse').classList.contains('x-cardnotification--elevated'),
      cardElevatedClass: el('cardElevated').classList.contains('x-card--elevated'),
      cardElevatedShadow: cs('cardElevated').boxShadow,
      cardPlainShadow: cs('cardNoTone').boxShadow,
      typoClasses: [...el('cardTypo').classList].filter((c) => /^x-card--suc/.test(c)),
      noteElevatedShadow: cs('noteElevated').boxShadow,
      notePlainShadow: cs('notePlain').boxShadow,
      toneBorder: cs('cardTone').borderLeftWidth,
      noToneBorder: cs('cardNoTone').borderLeftWidth,
    };
  });

  expect.soft(m.noteFalseClass, 'elevated="false" means off: no modifier class').toBe(false);
  expect.soft(m.cardElevatedClass, 'a8a7362e: x-card elevated is styled by [elevated]; .x-card--elevated is not injected').toBe(false);
  expect.soft(m.cardElevatedShadow, 'the elevated card still casts card.css\'s elevated shadow').not.toBe(m.cardPlainShadow);
  expect.soft(m.typoClasses, 'an undeclared value (a typo) never becomes a class').toEqual([]);
  // What a reader sees: notification.css's own elevated shadow, which only
  // the class selects (#1831: before, card.css's generic [elevated] shadow).
  expect.soft(m.noteElevatedShadow, 'the elevated notification wears .x-cardnotification--elevated\'s shadow')
    .toBe('rgba(0, 0, 0, 0.15) 0px 4px 12px 0px');
  expect.soft(m.notePlainShadow, 'a plain notification casts no elevated shadow').not.toBe(m.noteElevatedShadow);
  // card.css's --x-card-accent-width stripe (4px) against a plain card's 1px edge.
  expect.soft(m.toneBorder, 'featured-tone draws card.css\'s 4px accent stripe').toBe('4px');
  expect.soft(parseFloat(m.toneBorder), 'the accent stripe is wider than a plain card\'s edge')
    .toBeGreaterThan(parseFloat(m.noToneBorder));
});

/**
 * Found by the before/after sweep on demos/site/cards.html: once
 * .x-hero--cosmic landed on a cosmic x-cardhero, hero.css's
 * `.x-hero.x-hero--cosmic > * { position: relative }` outranked the scrim's
 * `[x-cardhero] .x-card__overlay { position: absolute; inset: 0 }` and
 * collapsed it to 0x0 (it was already broken on wb.js pages, which applied the
 * class all along). The scrim is a layer, so the content lift skips it.
 */
test('a cosmic x-cardhero gets .x-hero--cosmic and keeps its legibility scrim (#1831)', async ({ page }) => {
  await injectAndScan(page,
    '<section id="cosmic" x-cardhero variant="cosmic" background="https://picsum.photos/seed/cardhero/600/400" title="Cosmic">Body</section>');

  await expect.poll(() => page.evaluate(() => document.getElementById('cosmic')!.classList.contains('x-hero--cosmic')),
    'variant="cosmic" on x-cardhero lands .x-hero--cosmic under wb-lazy').toBe(true);

  const m = await page.evaluate(() => {
    const hero = document.getElementById('cosmic')!;
    const scrim = hero.querySelector(':scope > .x-card__overlay') as HTMLElement | null;
    const h = hero.getBoundingClientRect();
    const s = scrim?.getBoundingClientRect();
    return {
      hasScrim: !!scrim,
      position: scrim ? getComputedStyle(scrim).position : '',
      widthRatio: s ? s.width / h.width : 0,
      heightRatio: s ? s.height / h.height : 0,
    };
  });
  expect(m.hasScrim, 'x-cardhero builds its .x-card__overlay scrim').toBe(true);
  expect.soft(m.position, 'the scrim stays an absolutely positioned layer').toBe('absolute');
  expect.soft(m.widthRatio, 'the scrim covers the hero\'s full width').toBeCloseTo(1, 1);
  expect.soft(m.heightRatio, 'the scrim covers the hero\'s full height').toBeCloseTo(1, 1);
});

/**
 * Found by the same sweep, on the behaviors page stage: two enum properties of
 * one schema that both declare a value name the SAME modifier class.
 * x-cardportfolio size="full" minted .x-cardportfolio--full -- variant="full"'s
 * whole look (an 800px card, a larger header) -- so asking for a full-width
 * card silently swapped in a different variant. A class two options share
 * cannot say which one asked for it, so the shared applier leaves it to the
 * behavior that owns it (card.js stamps the variant class from `variant`).
 */
test('a value two properties share does not mint the other property\'s class (#1831)', async ({ page }) => {
  await injectAndScan(page, [
    '<article id="sizeFull" x-cardportfolio size="full" name="Ada Lovelace" title="Engineer"></article>',
    '<article id="variantFull" x-cardportfolio variant="full" name="Ada Lovelace" title="Engineer"></article>',
  ].join(''));

  // Wait for the applier to have run on the size card: it gets its own size
  // class from the same pass (card.css .x-card--full).
  await expect.poll(() => page.evaluate(() => document.getElementById('variantFull')!.classList.contains('x-cardportfolio--full')),
    'variant="full" keeps its own class').toBe(true);
  await expect.poll(() => page.evaluate(() => document.getElementById('sizeFull')!.classList.contains('x-card--full')),
    'size="full" gets the size class').toBe(true);

  const sizeHasVariantClass = await page.evaluate(() => document.getElementById('sizeFull')!.classList.contains('x-cardportfolio--full'));
  expect(sizeHasVariantClass, 'size="full" must not pick up variant="full"\'s .x-cardportfolio--full').toBe(false);
});

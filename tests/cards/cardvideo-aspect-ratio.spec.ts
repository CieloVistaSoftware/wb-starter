/**
 * Card Video Aspect Ratio (#482) — restored under #871
 * =====================================================
 * #482's claim is parity: `x-cardvideo` must size its figure exactly the way
 * `x-cardimage` does, so a video card holds a deterministic box no matter what
 * the media does. That is live in src/wb-viewmodels/card.js —
 *
 *   cardimage()  aspect: getAttr(...) || '16/9'   figure.style.aspectRatio = config.aspect
 *   cardvideo()  aspect: getAttr(...) || '16/9'   coverFigure.style.aspectRatio = config.aspect
 *
 * — and it is the whole point: without it a <video> whose source never arrives
 * falls back to the UA's intrinsic ~300x150 and the card collapses.
 *
 * WHY THIS FILE WAS REWRITTEN (#871)
 * ----------------------------------
 * As committed (0bd25182) this spec had NO navigation anywhere — no goto, no
 * setContent, no beforeEach, no helper. All four tests ran against about:blank,
 * where every locator matches nothing. They then looked for a `card-video`
 * TAG, which 4.0.0 removed (the authoring form is the `[x-cardvideo]`
 * attribute), and wrapped every assertion in `if (await x.count() > 0)`, which
 * is indistinguishable from a pass when the locator finds nothing. Four green
 * tests, zero coverage.
 *
 * Everything below navigates to a page whose existence is asserted (goto does
 * not throw on a 404), uses same-origin media so no remote host can make it
 * flaky, and contains no count-guards.
 */

import { test, expect, type Page, type Locator } from '@playwright/test';

/** Boots WB, and carries data-x-expected-errors so a deliberate 404 is not a page failure. */
const HARNESS = '/demos/test-harness.html';

/**
 * Same-origin, in-repo, so no remote host can make these flaky. Both shipped
 * assets are tiny placeholders rather than decodable media, so nothing below
 * asserts on decode state — only on what is served and on the resulting box.
 * A missing path 404s for real: server.js 404s anything naming a file.
 */
const GOOD_VIDEO = '/demos/movie.mp4';
const GOOD_IMAGE = '/demos/image.jpg';
const MISSING_VIDEO = '/demos/no-such-video-871.mp4';

/** The five ratios demos/site/cards.html actually ships at #cardvideo-aspect-variants. */
const ASPECTS = ['16/9', '4/3', '1/1', '21/9', '9/16'] as const;

const CARD_WIDTH = 400;

/**
 * page.goto() resolves happily on a 404, so a green run against a page that no
 * longer exists proves nothing — that is exactly how #869/#871 happened.
 * Assert the status, then wait for WB to be on the page.
 */
async function gotoHarness(page: Page): Promise<void> {
  const response = await page.goto(HARNESS, { waitUntil: 'domcontentloaded' });
  expect(response, `no response for ${HARNESS}`).not.toBeNull();
  expect(
    response!.status(),
    `${HARNESS} must exist — page.goto() does not throw on a 404, so a missing harness would look like a pass`,
  ).toBe(200);
  await page.waitForFunction(() => typeof (window as never as { WB?: { scan?: unknown } }).WB?.scan === 'function');
}

/**
 * Inject markup and hydrate it.
 *
 * WB.scan() is async and the harness also runs a MutationObserver, so nothing
 * below one-shots `await locator.count()` — every assertion uses an
 * auto-retrying matcher or expect.poll.
 */
async function injectAndScan(page: Page, markup: string): Promise<void> {
  await page.evaluate(async (html) => {
    const host = document.createElement('div');
    host.id = 'x-871-host';
    host.style.width = '100%';
    host.innerHTML = html;
    document.body.appendChild(host);
    await (window as unknown as { WB: { scan: (r: Element, o: object) => Promise<void> } }).WB.scan(host, { eager: true });
  }, markup);
}

/** A fixed-width box, so the figure's height is a pure function of its aspect-ratio. */
const box = (id: string, inner: string): string =>
  `<div id="${id}" style="width:${CARD_WIDTH}px">${inner}</div>`;

const ratioOf = (figure: Locator): Promise<string> =>
  figure.evaluate((el) => getComputedStyle(el).aspectRatio);

test.describe('[x-cardvideo] aspect-ratio parity with [x-cardimage] (#482)', () => {
  test('figure keeps the authored aspect-ratio whether the source is served or 404s', async ({ page }) => {
    await gotoHarness(page);

    // The differentiator is the HTTP response, recorded here rather than
    // inferred from decode state: demos/movie.mp4 is a 13-byte placeholder, so
    // asserting readyState would only prove Chromium cannot decode a stub.
    // What the figure must be independent of is the RESPONSE, and that is
    // observable exactly.
    const status = new Map<string, number>();
    page.on('response', (r) => {
      const p = new URL(r.url()).pathname;
      if (p === GOOD_VIDEO || p === MISSING_VIDEO) status.set(p, r.status());
    });

    await injectAndScan(page, [
      box('good', `<article x-cardvideo src="${GOOD_VIDEO}" aspect="16/9" title="Served">Served.</article>`),
      box('bad', `<article x-cardvideo src="${MISSING_VIDEO}" aspect="16/9" title="404s">Never arrives.</article>`),
    ].join(''));

    const goodFigure = page.locator('#good figure.x-card__figure');
    const badFigure = page.locator('#bad figure.x-card__figure');
    await expect(goodFigure).toHaveCount(1);
    await expect(badFigure).toHaveCount(1);

    // Prove the two really are in DIFFERENT load states. Without this, "both
    // boxes match" would be trivially true with neither video doing anything.
    // Chromium range-requests media, so a served file comes back 206 Partial
    // Content as often as 200 — either way it was found, which is the thing
    // being contrasted with the 404 below.
    await expect
      .poll(() => status.get(GOOD_VIDEO) ?? 599, {
        message: `${GOOD_VIDEO} must be requested and served (200 or 206) — otherwise this test compares two 404s`,
        timeout: 15000,
      })
      .toBeLessThan(300);
    await expect
      .poll(() => status.get(MISSING_VIDEO), {
        message: `${MISSING_VIDEO} must 404 — server.js 404s any path naming a file (server.js:963)`,
        timeout: 15000,
      })
      .toBe(404);
    await expect
      .poll(() => page.locator('#bad video').evaluate((v: HTMLVideoElement) => v.error !== null), {
        message: 'the 404 must surface as a media error on the <video>',
        timeout: 15000,
      })
      .toBe(true);

    expect(await ratioOf(goodFigure)).toBe('16 / 9');
    expect(await ratioOf(badFigure)).toBe('16 / 9');

    const goodBox = (await goodFigure.boundingBox())!;
    const badBox = (await badFigure.boundingBox())!;
    expect(goodBox.width, 'figure must fill its 400px container').toBeGreaterThan(0);
    expect(
      Math.abs(goodBox.width - badBox.width),
      'a failed video must not change the figure width',
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(goodBox.height - badBox.height),
      'a failed video must not change the figure height — that collapse IS #482',
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(badBox.height - badBox.width * (9 / 16)),
      'the 404 figure must still be 16:9, not the UA video default',
    ).toBeLessThanOrEqual(1);
  });

  test('an authored aspect reaches the figure, and matches x-cardimage for every value', async ({ page }) => {
    await gotoHarness(page);
    await injectAndScan(
      page,
      ASPECTS.map((aspect, i) =>
        box(
          `pair-${i}`,
          `<article x-cardvideo id="v-${i}" src="${GOOD_VIDEO}" aspect="${aspect}">Video.</article>` +
            `<article x-cardimage id="i-${i}" src="${GOOD_IMAGE}" alt="" aspect="${aspect}">Image.</article>`,
        ),
      ).join(''),
    );

    for (let i = 0; i < ASPECTS.length; i++) {
      const aspect = ASPECTS[i];
      const expected = aspect.replace('/', ' / ');
      const videoFigure = page.locator(`#v-${i} figure.x-card__figure`);
      const imageFigure = page.locator(`#i-${i} figure.x-card__figure`);
      await expect(videoFigure, `x-cardvideo aspect="${aspect}" must build a figure`).toHaveCount(1);
      await expect(imageFigure, `x-cardimage aspect="${aspect}" must build a figure`).toHaveCount(1);

      const videoRatio = await ratioOf(videoFigure);
      const imageRatio = await ratioOf(imageFigure);
      expect(videoRatio, `x-cardvideo must honour aspect="${aspect}"`).toBe(expected);
      expect(imageRatio, `x-cardimage must honour aspect="${aspect}"`).toBe(expected);
      expect(videoRatio, `#482 parity: cardvideo and cardimage must agree on aspect="${aspect}"`).toBe(imageRatio);

      // The computed string can be right while the box is wrong, so measure it.
      const [w, h] = aspect.split('/').map(Number);
      const rect = (await videoFigure.boundingBox())!;
      expect(rect.width, `aspect="${aspect}" figure must have width`).toBeGreaterThan(0);
      expect(
        Math.abs(rect.height - rect.width * (h / w)),
        `aspect="${aspect}" figure measured ${rect.width}x${rect.height}`,
      ).toBeLessThanOrEqual(1);
    }
  });

  test('with no aspect authored, cardvideo defaults to 16/9 — the same default as cardimage', async ({ page }) => {
    await gotoHarness(page);
    await injectAndScan(
      page,
      box(
        'defaults',
        `<article x-cardvideo id="v-default" src="${GOOD_VIDEO}" title="Default">Video.</article>` +
          `<article x-cardimage id="i-default" src="${GOOD_IMAGE}" alt="" title="Default">Image.</article>`,
      ),
    );

    const videoFigure = page.locator('#v-default figure.x-card__figure');
    const imageFigure = page.locator('#i-default figure.x-card__figure');
    await expect(videoFigure).toHaveCount(1);
    await expect(imageFigure).toHaveCount(1);

    const videoRatio = await ratioOf(videoFigure);
    const imageRatio = await ratioOf(imageFigure);
    expect(videoRatio, "cardvideo's documented default is 16/9").toBe('16 / 9');
    expect(imageRatio, "cardimage's documented default is 16/9").toBe('16 / 9');
    expect(videoRatio, '#482 parity: the two defaults must be the same').toBe(imageRatio);

    const rect = (await videoFigure.boundingBox())!;
    expect(rect.width).toBeGreaterThan(0);
    expect(Math.abs(rect.height - rect.width * (9 / 16))).toBeLessThanOrEqual(1);
  });

  test('the figure box does not collapse once the video load finally gives up', async ({ page }) => {
    // media-load-retry.js runs 5 attempts with exponential backoff (500/1000/
    // 2000/4000ms) before giving up, then hides the <video> with display:none
    // and injects a sibling "unavailable" message. That teardown is the moment
    // a ratio-less figure would collapse, so the test has to reach it.
    test.setTimeout(60000);

    await gotoHarness(page);
    await injectAndScan(
      page,
      box('collapse', `<article x-cardvideo id="dead" src="${MISSING_VIDEO}" aspect="16/9" title="Gone">Gone.</article>`),
    );

    const figure = page.locator('#dead figure.x-card__figure');
    await expect(figure).toHaveCount(1);

    const before = (await figure.boundingBox())!;
    expect(before.width, 'figure must have laid out before the retries finish').toBeGreaterThan(0);
    expect(Math.abs(before.height - before.width * (9 / 16))).toBeLessThanOrEqual(1);

    const video = page.locator('#dead video');
    await expect(video, 'media-load-retry must exhaust its attempts and mark the video failed')
      .toHaveClass(/x-video--load-failed/, { timeout: 40000 });
    await expect(page.locator('#dead .x-media-load-failed'), 'the "unavailable" fallback replaces the video')
      .toHaveCount(1);

    const after = (await figure.boundingBox())!;
    expect(Math.abs(after.width - before.width), 'width must survive the give-up').toBeLessThanOrEqual(1);
    expect(Math.abs(after.height - before.height), 'height must survive the give-up').toBeLessThanOrEqual(1);
    expect(
      Math.abs(after.height - after.width * (9 / 16)),
      `figure was ${after.width}x${after.height} after give-up — it must still be 16:9, not the UA ~300x150 default`,
    ).toBeLessThanOrEqual(1);
  });
});

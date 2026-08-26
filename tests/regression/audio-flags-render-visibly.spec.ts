import { test, expect, type Page } from '@playwright/test';

/**
 * #669 — every audio flag must produce a VISIBLE result.
 *
 * This spec exists because of a specific failure mode. `buildTransportUI()`
 * appended the transport and EQ INTO the host element, and a native <audio>
 * element's children are FALLBACK CONTENT that browsers never render. Measured
 * at the time:
 *
 *     .x-audio__eq-container   present in the DOM
 *     16 band inputs            present in the DOM
 *     computed size             0 x 0
 *     parent <audio>            computed display: none
 *
 * Every DOM-presence check passed. Nothing appeared on screen, twice reported.
 *
 * So EVERY assertion here is about rendered geometry, never `toBeAttached()` or
 * a node count. If an element is in the DOM at 0x0, these tests fail — which is
 * the entire point.
 *
 * Flags covered: src, showEq, showDisplay, showPlayButton, autoplay, loop,
 * plus the <audio> tag form and the native-passthrough case.
 */

const FIXTURE = '/tests/fixtures/blank.html';
const SRC = '/demos/sample.wav';

/** Render markup through WB in a clean page and return the container selector. */
async function render(page: Page, markup: string) {
  await page.goto(FIXTURE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async (html) => {
    const host = document.createElement('div');
    host.id = 'harness';
    // A real width: the EQ lays out horizontally, and a 0-width parent would
    // produce a 0-height EQ for reasons unrelated to the flag under test.
    host.style.cssText = 'width: 720px;';
    document.body.appendChild(host);
    host.innerHTML = html;
    const mod: any = await import('/src/core/wb-lazy.js');
    const WB = mod.default || mod.WB;
    await WB.scan(host, { eager: true });
  }, markup);
  // The transport is built synchronously by scan(), but the EQ attaches its
  // AudioContext graph on a microtask; one frame is enough and keeps the test
  // deterministic without a fixed sleep.
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
  return '#harness';
}

/** Rendered size, or null when the element is absent. 0x0 counts as rendered-but-invisible. */
async function box(page: Page, selector: string) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  }, selector);
}

/** The assertion this whole spec is built around. */
function expectVisible(size: { w: number; h: number } | null, what: string) {
  expect(size, `${what} should exist`).not.toBeNull();
  expect(size!.w, `${what} should have real width, not 0 (the invisible-EQ bug)`).toBeGreaterThan(0);
  expect(size!.h, `${what} should have real height, not 0 (the invisible-EQ bug)`).toBeGreaterThan(0);
}

test.describe('audio: the custom UI renders outside the native element (#669)', () => {
  test('showEq renders a real, sized equalizer with its band sliders', async ({ page }) => {
    await render(page, `<audio src="${SRC}" showeq="true">fallback</audio>`);

    expectVisible(await box(page, '.x-audio__eq-container'), 'the EQ container');
    expectVisible(await box(page, '.x-audio__transport'), 'the transport');

    // The sliders must be real controls, not just present.
    const sliders = await page.evaluate(() =>
      [...document.querySelectorAll('#harness input[type="range"]')]
        .map((el) => { const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; })
    );
    expect(sliders.length, 'the 15-band EQ should render its band sliders').toBeGreaterThan(10);
    expect(sliders.every((s) => s.w > 0 && s.h > 0), 'every band slider should be visible').toBe(true);
  });

  test('the custom UI is NOT a child of the native <audio>', async ({ page }) => {
    // The root cause, pinned directly: <audio> children are fallback content
    // and never render, so mounting the UI inside guarantees invisibility.
    await render(page, `<audio src="${SRC}" showeq="true">fallback</audio>`);

    const parents = await page.evaluate(() => {
      const names = ['.x-audio__transport', '.x-audio__eq-container', '.x-audio__display', '.x-audio__play-btn'];
      return names.map((sel) => {
        const el = document.querySelector(sel);
        return { sel, parent: el?.parentElement?.tagName.toLowerCase() ?? null };
      });
    });

    for (const p of parents) {
      if (p.parent === null) continue;
      expect(p.parent, `${p.sel} must not be mounted inside <audio> — its children never render`).not.toBe('audio');
    }
  });

  test('showDisplay=true shows the display; =false hides it, transport intact', async ({ page }) => {
    await render(page, `<audio src="${SRC}" showplaybutton="true" showdisplay="true">x</audio>`);
    expectVisible(await box(page, '.x-audio__display'), 'the display');

    await render(page, `<audio src="${SRC}" showplaybutton="true" showdisplay="false">x</audio>`);
    expect(await box(page, '.x-audio__display'), 'display should be gone when off').toBeNull();
    // The companion keeps the transport alive, so absence is observable rather
    // than the whole UI disappearing.
    expectVisible(await box(page, '.x-audio__transport'), 'the transport');
    expectVisible(await box(page, '.x-audio__play-btn'), 'the play button');
  });

  test('showPlayButton=true shows the button; =false hides it, display intact', async ({ page }) => {
    await render(page, `<audio src="${SRC}" showdisplay="true" showplaybutton="true">x</audio>`);
    expectVisible(await box(page, '.x-audio__play-btn'), 'the play button');

    await render(page, `<audio src="${SRC}" showdisplay="true" showplaybutton="false">x</audio>`);
    expect(await box(page, '.x-audio__play-btn'), 'play button should be gone when off').toBeNull();
    expectVisible(await box(page, '.x-audio__display'), 'the display');
  });

  test('both attribute spellings work (schema publishes showEq, code read show-eq)', async ({ page }) => {
    // The schema published `showEq` while the behavior only ever read `show-eq`,
    // so the DOCUMENTED name silently did nothing.
    await render(page, `<audio src="${SRC}" showeq="true">x</audio>`);
    const viaSchemaSpelling = await box(page, '.x-audio__eq-container');
    expectVisible(viaSchemaSpelling, 'EQ via the schema spelling (showeq)');

    await render(page, `<audio src="${SRC}" show-eq="true">x</audio>`);
    const viaHyphenSpelling = await box(page, '.x-audio__eq-container');
    expectVisible(viaHyphenSpelling, 'EQ via the hyphenated spelling (show-eq)');

    // #872: "both spellings WORK" is a claim about EQUIVALENCE, and two
    // independent visibility checks do not make it — an alias that built a
    // different or degraded EQ would satisfy both while the DOCUMENTED name
    // still did not mean what the docs say. Same harness, same 720px host, so
    // the two renders must measure identically.
    //
    // This assertion is also the one the "every test contains at least one
    // expect()" gate can see: it matches /expect\s*[.(]/ on the test body, and
    // `expectVisible(` does not match (the character after "expect" is "V"),
    // so a body whose only assertion is that helper reads as vacuous.
    expect(
      viaHyphenSpelling,
      'showeq and show-eq must build the SAME EQ — an alias that renders something '
      + 'different is still a broken alias',
    ).toEqual(viaSchemaSpelling);
  });

  test('a bare <audio src> stays native — no custom UI is imposed', async ({ page }) => {
    await render(page, `<audio src="${SRC}" controls>x</audio>`);
    expect(await box(page, '.x-audio__transport'), 'no flags should mean no custom transport').toBeNull();
    expect(await box(page, '.x-audio__eq-container'), 'and no EQ').toBeNull();

    // The native element itself must still be there and playable.
    const audio = await page.evaluate(() => {
      const el = document.querySelector('#harness audio') as HTMLAudioElement | null;
      return el ? { src: el.getAttribute('src'), controls: el.controls } : null;
    });
    expect(audio?.src).toContain('sample.wav');
    expect(audio?.controls, 'native controls should survive').toBe(true);
  });

  test('<audio> renders its custom UI visibly too', async ({ page }) => {
    // The tag form always built custom UI — it is the case that always worked,
    // and it must keep working now that the mount point moved.
    await render(page, `<audio src="${SRC}" showeq="true"></audio>`);
    expectVisible(await box(page, '.x-audio__transport'), 'transport on <audio>');
    expectVisible(await box(page, '.x-audio__eq-container'), 'EQ on <audio>');

    // #872: a sized EQ CONTAINER is not a rendered EQ. The original bug put
    // the UI inside <audio>, where children are fallback content and never
    // render — and the container could regain a box while the controls inside
    // it stayed at 0x0, which is the same invisibility with a passing test.
    // Measure the band sliders themselves, and pin the mount point, since this
    // is the tag form the fix moved.
    const sliders = await page.evaluate(() =>
      [...document.querySelectorAll('#harness input[type="range"]')]
        .map((el) => { const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; })
    );
    expect(sliders.length, 'the EQ on <audio> should render its band sliders').toBeGreaterThan(10);
    expect(sliders.every((s) => s.w > 0 && s.h > 0), 'every band slider should be visible').toBe(true);

    const eqParent = await page.evaluate(() =>
      document.querySelector('.x-audio__eq-container')?.parentElement?.tagName.toLowerCase() ?? null);
    expect(eqParent, 'the EQ must not be mounted inside <audio> — its children never render').not.toBe('audio');
  });

  test('native passthrough flags reach the media element', async ({ page }) => {
    await render(page, `<audio src="${SRC}" loop autoplay muted>x</audio>`);
    const state = await page.evaluate(() => {
      const el = document.querySelector('#harness audio') as HTMLAudioElement;
      return { loop: el.loop, autoplay: el.autoplay, hasMuted: el.hasAttribute('muted') };
    });
    expect(state.loop, 'loop should reach the media element').toBe(true);
    expect(state.autoplay, 'autoplay should reach the media element').toBe(true);
    // muted is declared in the schema but not read by the behavior (#669);
    // asserted as the ATTRIBUTE so this test documents today's reality without
    // pretending the property is wired.
    expect(state.hasMuted, 'muted is currently attribute-only — see #669').toBe(true);
  });

  test('a src that exists does not log an error', async ({ page }) => {
    // audio.js throws "no src provided" and reports it; a valid src must not.
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(e.message));

    await render(page, `<audio src="${SRC}" showeq="true">x</audio>`);

    const audioErrors = errors.filter((e) => /audio|src/i.test(e));
    expect(audioErrors, `a valid src should produce no audio errors:\n${audioErrors.join('\n')}`).toEqual([]);
  });
});

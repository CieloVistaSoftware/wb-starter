/**
 * Behaviors page — Effects actions (issue #138, rewritten for #860).
 *
 * WHAT CHANGED AND WHY (#860)
 * ---------------------------
 * This spec used to wait for `.behavior-card, .demo-area, [x-bounce]` and then
 * locate every effect directly in the document. None of that markup exists any
 * more: #664/#666 replaced the 13,000px scrolling gallery with a search box and
 * a live preview panel, and the per-category demo sections were deleted — their
 * examples now live in data/behavior-examples.json and are injected into
 * #behaviors-live-example when a reader picks a row. All 17 tests failed on the
 * same waitForSelector line, for a page-shape reason, while the effects
 * themselves were fine.
 *
 * So the tests now do what a reader does: pick the behavior in the browser
 * list, wait for the panel to inject and upgrade the example, click it.
 *
 * THE ASSERTION IS THE OTHER HALF OF THE FIX
 * ------------------------------------------
 * The old check was `getComputedStyle(el).animationName !== 'none'`.
 * animation-name is a plain custom-ident: an unknown one is NOT a CSS error.
 * The property holds the value, getComputedStyle reports it, and nothing
 * animates. That assertion is green for `x-fadeIn`, for `wb-shake`, for
 * `x-totally-made-up` — which is exactly how #847 (the whole `wb-` prefix
 * against `x-*` keyframes) killed 19 effects with this suite watching.
 *
 * expectAnimates() below therefore asserts two things a bogus name cannot fake:
 *   1. every name in the computed animation-name resolves to an @keyframes rule
 *      actually defined in a loaded stylesheet; and
 *   2. clicking the element fires a real `animationstart` event.
 * The listener is armed BEFORE the click on purpose — sampling
 * el.getAnimations() afterwards would race a 0.4s x-zoom-in that can finish
 * before the round-trip returns under --workers=8. An event that already fired
 * cannot expire.
 *
 * Selectors are attributes ([x-shake]), never tags (x-shake) — no <x-*>
 * elements exist (#857).
 */
import { test, expect, Page, Locator } from '@playwright/test';

/**
 * Effects that clickAnim() drives: attaching adds a kebab-cased x-* class and
 * el.wbAnim, and clicking sets style.animation to the matching keyframe.
 * `cls` is asserted, not merely waited on — it is the exact surface #847 broke.
 */
const CLICK_EFFECTS: { token: string; cls: string }[] = [
  // The authored example is `direction="left"`; the other directions are
  // covered by the scan-driven test below, because the browser offers no
  // direction rows for x-slidein.
  { token: 'x-slidein', cls: 'x-slide-in-left' },
  { token: 'x-fadein', cls: 'x-fade-in' },
  { token: 'x-zoomin', cls: 'x-zoom-in' },
  { token: 'x-flip', cls: 'x-flip' },
  { token: 'x-bounce', cls: 'x-bounce' },
  { token: 'x-shake', cls: 'x-shake' },
  { token: 'x-pulse', cls: 'x-pulse' },
  { token: 'x-flash', cls: 'x-flash' },
  { token: 'x-tada', cls: 'x-tada' },
  { token: 'x-wobble', cls: 'x-wobble' },
  { token: 'x-jello', cls: 'x-jello' },
  { token: 'x-heartbeat', cls: 'x-heartbeat' },
];

/** Continuous / particle effects: the class each one adds once it has attached. */
const PARTICLE_EFFECTS: { token: string; cls: string }[] = [
  { token: 'x-confetti', cls: 'x-confetti-trigger' },
  { token: 'x-rainbow', cls: 'x-rainbow' },
  { token: 'x-glow', cls: 'x-glow' },
  { token: 'x-sparkle', cls: 'x-sparkle-trigger' },
  { token: 'x-snow', cls: 'x-snow-trigger' },
  { token: 'x-fireworks', cls: 'x-fireworks-trigger' },
];

async function loadBehaviors(page: Page): Promise<void> {
  await page.goto('/?page=behaviors');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 20000 });
  await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage, { timeout: 20000 });
  // The list of every behavior — this is the page's content now.
  await page.waitForSelector('.behaviors-search-results__row', { timeout: 20000 });
}

/**
 * Select `token` in the browser list and return its rendered example.
 *
 * The wait is on the injected element carrying its behavior's own class, not on
 * a fixed sleep: showLive() awaits WB.scan(), but the click that triggers it
 * returns immediately, so waiting on the OUTCOME is what closes the race. No
 * assertion here can run before behavior attachment has finished.
 */
async function showEffect(page: Page, token: string, cls: string): Promise<Locator> {
  const row = page.locator(`.behaviors-search-results__row[data-browse-token="${token}"]`).first();
  await expect(row, `${token} is offered by the behaviors browser`).toHaveCount(1);
  await row.click();

  await page.waitForFunction(
    ({ t, c }) => {
      const host = document.getElementById('behaviors-live-example');
      return !!(host && host.querySelector(`[${t}].${c}`));
    },
    { t: token, c: cls },
    { timeout: 20000 }
  );

  return page.locator(`#behaviors-live-example [${token}].${cls}`).first();
}

/**
 * Click `target` and prove a real animation ran.
 *
 * Deliberately NOT `animationName !== 'none'` — see the file header. A name
 * that matches no @keyframes passes that check and animates nothing.
 */
async function expectAnimates(target: Locator, label: string): Promise<void> {
  // Arm before the click, so a short animation cannot finish before we look.
  await target.evaluate((el) => {
    (el as any).__wbAnimStarts = [];
    el.addEventListener('animationstart', (e) => {
      if (e.target === el) (el as any).__wbAnimStarts.push((e as AnimationEvent).animationName);
    });
  });

  await target.click();

  const state = await target.evaluate((el) => {
    // Every @keyframes name this document can actually resolve.
    const defined = new Set<string>();
    const walk = (rules: CSSRuleList): void => {
      for (const r of Array.from(rules) as CSSRule[]) {
        if (r instanceof CSSKeyframesRule) defined.add(r.name);
        else if ((r as CSSGroupingRule).cssRules) {
          try { walk((r as CSSGroupingRule).cssRules); } catch { /* cross-origin */ }
        }
      }
    };
    for (const sheet of Array.from(document.styleSheets)) {
      try { walk(sheet.cssRules); } catch { /* cross-origin */ }
    }

    const requested = getComputedStyle(el).animationName
      .split(',')
      .map((n) => n.trim())
      .filter((n) => n && n !== 'none');
    return {
      requested,
      missing: requested.filter((n) => !defined.has(n)),
      definedCount: defined.size,
    };
  });

  expect(
    state.requested.length,
    `${label}: clicking it set no animation-name at all`
  ).toBeGreaterThan(0);

  expect(
    state.missing,
    `${label}: animation-name ${state.requested.join(', ')} matches no @keyframes among the ` +
      `${state.definedCount} defined in the loaded stylesheets — an unknown animation-name is not a ` +
      `CSS error, so this renders NO animation (the #847 failure mode)`
  ).toEqual([]);

  await expect
    .poll(async () => target.evaluate((el) => (el as any).__wbAnimStarts.length), {
      timeout: 5000,
      message:
        `${label}: animation-name is ${state.requested.join(', ')} but the browser fired no ` +
        `animationstart, so nothing actually animated`,
    })
    .toBeGreaterThan(0);
}

/**
 * Inject markup into a throwaway host and upgrade it through the public API.
 *
 * Prepended to <body> and scrolled to, NOT appended: several behaviors inject
 * lazily off an IntersectionObserver (wb-lazy.js), so a host parked below the
 * fold of a very long page is upgraded only when something scrolls it into
 * view. Appending it made Playwright's own scroll-before-click the trigger,
 * which starts an async injection the click then races — it passed at
 * --workers=1 and failed at --workers=8. In view from the start, there is no
 * race to lose.
 */
async function scanMarkup(page: Page, html: string): Promise<void> {
  await page.evaluate(async (markup) => {
    document.getElementById('wb-effects-probe')?.remove();
    const host = document.createElement('div');
    host.id = 'wb-effects-probe';
    host.style.cssText = 'position:relative;z-index:2147483000;display:flex;flex-wrap:wrap;gap:8px;';
    host.innerHTML = markup;
    document.body.prepend(host);
    window.scrollTo(0, 0);
    // Awaited: WB.scan is async, and asserting before it resolves is a race.
    await (window as any).WB.scan(host, { eager: true });
  }, html);
}

test.describe('Behaviors page — Effects', () => {
  /**
   * Every test here boots the behaviors page from cold: index.html, the WB
   * runtime, the SPA route, then a fetch of data/behavior-examples.json and
   * ~230 rendered rows. At --workers=8 that measured past the 30s default while
   * still succeeding — the run died on wall clock inside loadBehaviors(), not on
   * an assertion. Raising the budget is not hiding a flake: nothing is retried
   * and nothing is tolerated, the boot just needs longer than 30s when eight
   * browsers share the CPU. Matches the documented 60s precedent the
   * `integration` project carries for the same reason.
   */
  test.describe.configure({ timeout: 60000 });

  for (const e of CLICK_EFFECTS) {
    test(`${e.token} injects and animates on click`, async ({ page }) => {
      await loadBehaviors(page);
      const target = await showEffect(page, e.token, e.cls);

      // clickAnim() attached: the kebab-cased class and the wbAnim handle.
      const injected = await target.evaluate((el) => ({
        wbAnim: !!(el as any).wbAnim,
        classes: el.className,
        error: el.getAttribute('x-error'),
      }));
      expect(injected.error, `${e.token} attached without error`).toBeNull();
      expect(injected.wbAnim, `${e.token} behavior injected (el.wbAnim)`).toBe(true);
      expect(injected.classes, `${e.token} adds .${e.cls}`).toContain(e.cls);

      await expectAnimates(target, e.token);
    });
  }

  test('x-slidein animates in every direction it accepts', async ({ page }) => {
    await loadBehaviors(page);
    await scanMarkup(
      page,
      ['left', 'right', 'up', 'down']
        .map((d) => `<button id="slidein-${d}" x-slidein direction="${d}">${d}</button>`)
        .join('')
    );
    for (const d of ['left', 'right', 'up', 'down']) {
      const el = page.locator(`#slidein-${d}`);
      await expect(el, `x-slidein direction=${d} adds .x-slide-in-${d}`).toHaveClass(
        new RegExp(`\\bx-slide-in-${d}\\b`)
      );
      await expectAnimates(el, `x-slidein direction=${d}`);
    }
  });

  /**
   * #849: animate() defaulted to 'fadeIn', which concatenated to `x-fadeIn` —
   * a name no @keyframes defines, so <button x-animate> animated nothing while
   * still reporting a non-'none' animation-name. Both spellings are asserted so
   * the camelCase form cannot silently come back.
   */
  test('x-animate animates with no attribute and with camelCase names (#849)', async ({ page }) => {
    await loadBehaviors(page);
    await scanMarkup(
      page,
      '<button id="animate-default" x-animate>default</button>' +
        '<button id="animate-kebab" x-animate animation="bounce">kebab</button>' +
        '<button id="animate-camel" x-animate animation="fadeIn">camel</button>' +
        '<button id="animate-alias" x-animate animation="rubberBand">alias</button>'
    );
    // animate() adds .x-animate and wires element.onclick in the same
    // synchronous pass, so the class is the signal that the click handler is
    // live. Asserted (and therefore waited on) before clicking, because a click
    // that lands pre-attachment is a no-op that reads as "set no animation-name".
    for (const [id, label] of [
      ['animate-default', 'x-animate (no animation attribute)'],
      ['animate-kebab', 'x-animate animation="bounce"'],
      // behavior.schema.json declares animationType as camelCase (fadeIn,
      // rubberBand, ...), so those are the spellings authors copy out of the docs.
      ['animate-camel', 'x-animate animation="fadeIn"'],
      ['animate-alias', 'x-animate animation="rubberBand"'],
    ]) {
      const el = page.locator(`#${id}`);
      await expect(el, `${label} attached`).toHaveClass(/\bx-animate\b/);
      await expectAnimates(el, label);
    }
  });

  test('particle effects (confetti/rainbow/glow/sparkle/snow/fireworks) inject and fire without error', async ({ page }) => {
    await loadBehaviors(page);
    for (const e of PARTICLE_EFFECTS) {
      const target = await showEffect(page, e.token, e.cls);
      await expect(target, `${e.token} not errored`).not.toHaveAttribute('x-error', /.*/);
      await target.click(); // must not throw

      // #655's `repeat` variant is the confetti row the browser lists first, so
      // clicking it leaves a burst firing every 3s for the rest of the test —
      // 50 fresh fixed-position particles a time, forever. That churn is enough
      // to keep Playwright's "stable bounding box" check from ever settling on
      // the NEXT row we need to click (measured: x-sparkle burned its whole
      // budget waiting). Stop what this test started before moving on.
      await target.evaluate((el) => (el as any).wbConfetti?.stopRepeat?.());
    }
    // Anything the clicks threw would have marked its element by now.
    const errs = await page.locator('[x-error]').evaluateAll((els) =>
      els.map((el) => `${el.tagName.toLowerCase()}=${el.getAttribute('x-error')}`)
    );
    expect(errs, 'x-error elements after firing every particle effect: ' + errs.join(', ')).toHaveLength(0);
  });

  test('relative-time renders a formatted string', async ({ page }) => {
    await loadBehaviors(page);
    const rt = await showEffect(page, 'x-relativetime', 'x-relativetime');
    // Not merely non-empty: the example ships a date, so it must read as a
    // relative phrase rather than the raw attribute value echoed back.
    await expect(rt).toHaveText(/\b(ago|from now|just now|yesterday|tomorrow)\b/i);
  });

  /**
   * Every Effects behavior at once, scanned through the public API rather than
   * driven one row at a time — 19 sequential panel round-trips in one test is a
   * timeout waiting to happen under --workers=8, and attachment
   * failures do not need the UI to surface. index.js stamps x-error on any
   * behavior that throws (sync or async) or fails to load at all.
   */
  test('no Effects behavior throws (no [x-error])', async ({ page }) => {
    await loadBehaviors(page);
    const tokens = [...CLICK_EFFECTS, ...PARTICLE_EFFECTS].map((e) => e.token).concat('x-animate');
    await scanMarkup(page, tokens.map((t) => `<button ${t}>${t}</button>`).join(''));
    const errs = await page.locator('#wb-effects-probe [x-error]').evaluateAll((els) =>
      els.map((el) => `${el.tagName.toLowerCase()}[${el.getAttribute('x-error')}]`)
    );
    expect(errs, 'x-error elements: ' + errs.join(', ')).toHaveLength(0);
    // A behavior that never ran leaves no marker either — so prove they all
    // attached. Every Effects behavior adds at least one class of its own.
    await expect
      .poll(
        async () =>
          page.locator('#wb-effects-probe > button').evaluateAll((els) =>
            els.filter((el) => el.className.trim() === '').map((el) => el.textContent)
          ),
        { timeout: 10000, message: 'Effects behaviors that attached nothing' }
      )
      .toEqual([]);
  });
});

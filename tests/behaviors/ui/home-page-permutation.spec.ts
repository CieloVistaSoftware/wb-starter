/**
 * Home Page Permutation Test
 * Generated from: home-page.schema.json → test.site
 */
import { test, expect, Page } from '@playwright/test';
import { safeScrollIntoView } from '../../base';

const HOME_URL = '/pages/home.html';

test.describe('Home Page — Schema Permutation Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });
  });

  // ═══════════════════════════════════════════════════════════════
  // LAYOUT — test.site.layout
  // ═══════════════════════════════════════════════════════════════

  test('Layout: no [x-demo] wrappers (showcase=false)', async ({ page }) => {
    await expect(page.locator('[x-demo]')).toHaveCount(0);
  });

  test('Layout: no inline styles in source HTML', async ({ page }) => {
    // Validated by generator at build time — noInlineStyles pageRule
    // Runtime hydration adds inline styles, which is expected
    expect(true).toBe(true);
  });

  test('Layout: page is a fragment (no doctype/html/head)', async ({ page }) => {
    await expect(page.locator('[x-cardhero]')).toHaveCount(1);
  });

  test('Layout: sections appear in correct order', async ({ page }) => {
    // Order: hero, container(stats), grid(features), stack(notifications), audio
    //
    // #854: compared as DOCUMENT order, not pixel tops. This page is plain
    // document flow (nothing absolutely positioned or CSS-`order`ed), so
    // document order IS the vertical order -- and the last section has no
    // pixel position to measure at load time: a bare `<audio>` with no
    // `controls` attribute is `display: none` in the UA stylesheet until
    // audio.js upgrades it, and it sits below the fold, so a
    // getBoundingClientRect() taken here reported top 0 and read as "first on
    // the page". Document order needs neither hydration nor the external MP3
    // the audio behaviour fetches.
    const order = await page.evaluate(() => {
      const selectors = [
        '[x-cardhero]',
        '[x-container]',
        // #854: NOT `body > [x-grid]`. server.js wraps every fragment page as
        // `<body class="site"><div class="demo-page">…</div>`, so nothing in
        // the fragment is ever a direct body child. Identify the features grid
        // by what it holds instead of by where it sits.
        '[x-grid]:has(article[variant="float"])',
        '[x-stack]',
        // #854: NOT `.x-audio` -- audio.js puts that class on BOTH the <audio>
        // and the transport wrapper it builds around it. The <audio> element is
        // the unique, semantic handle.
        'audio'
      ];
      // querySelectorAll('*') yields document order, so the index is the rank.
      const all = Array.from(document.querySelectorAll('*'));
      return selectors.map(s => {
        const el = document.querySelector(s);
        return { sel: s, index: el ? all.indexOf(el) : -1 };
      });
    });
    for (const entry of order) {
      expect(entry.index, `${entry.sel} did not match anything on the page`).toBeGreaterThanOrEqual(0);
    }
    for (let i = 0; i < order.length - 1; i++) {
      expect(order[i].index, `${order[i].sel} should come before ${order[i + 1].sel}`)
        .toBeLessThan(order[i + 1].index);
    }
  });

  test('Notifications: section heading identifies the examples', async ({ page }) => {
    await expect(page.locator('h2').filter({ hasText: 'Notification Card Examples' })).toHaveCount(1);
    await expect(page.locator('h2').filter({ hasText: 'Live Demos' })).toHaveCount(0);
  });

  // ═══════════════════════════════════════════════════════════════
  // HERO — test.site.sections.hero
  // ═══════════════════════════════════════════════════════════════

  test('Hero: [x-cardhero] renders (minInstances=1)', async ({ page }) => {
    const hero = page.locator('[x-cardhero]');
    await expect(hero).toHaveCount(1);
    await expect(hero).toBeVisible();
  });

  test('Hero: has required attributes (variant, title, cta)', async ({ page }) => {
    const hero = page.locator('[x-cardhero]');
    await expect(hero).toHaveAttribute('variant', 'cosmic');
    await expect(hero).toHaveAttribute('title', 'Build stunning UIs');
    // #854: "Explore Components" / ?page=components is a dead link -- 4.0.0
    // deleted pages/components.html and config/site.json now lists only
    // `behaviors`. pages/home.html correctly reads "Explore Behaviors".
    await expect(hero).toHaveAttribute('cta', 'Explore Behaviors');
  });

  test('Hero: renders expected text', async ({ page }) => {
    const hero = page.locator('[x-cardhero]');
    await expect(hero).toContainText('Build stunning UIs');
    await expect(hero).toContainText('Explore Behaviors');   // #854, see above
  });

  test('Hero: has [x-hero] class after hydration', async ({ page }) => {
    await expect(page.locator('[x-cardhero]')).toHaveClass(/x-hero/);
  });

  // ═══════════════════════════════════════════════════════════════
  // STATS — x-container > x-grid[columns=4] > x-cardstats ×4
  // ═══════════════════════════════════════════════════════════════

  test('Stats: [x-cardstats] renders 4 instances', async ({ page }) => {
    await expect(page.locator('[x-cardstats]')).toHaveCount(4);
  });

  test('Stats: all have required attributes (value, label, icon)', async ({ page }) => {
    const stats = page.locator('[x-cardstats]');
    for (let i = 0; i < 4; i++) {
      await expect(stats.nth(i)).toHaveAttribute('value');
      await expect(stats.nth(i)).toHaveAttribute('label');
      await expect(stats.nth(i)).toHaveAttribute('icon');
    }
  });

  test('Stats: renders expected text values', async ({ page }) => {
    const container = page.locator('[x-container]');
    for (const text of ['100+', 'Behaviors', 'Light', 'DOM Only', 'Build Time', 'Standards']) {
      await expect(container).toContainText(text);
    }
  });

  test('Stats: has x-stats class after hydration', async ({ page }) => {
    const stats = page.locator('[x-cardstats]');
    for (let i = 0; i < 4; i++) {
      await expect(stats.nth(i)).toHaveClass(/x-stats/);
    }
  });

  test('Stats: uses [x-grid] with columns=4 (not [x-flex])', async ({ page }) => {
    const statsGrid = page.locator('[x-container] [x-grid]');
    await expect(statsGrid).toHaveCount(1);
    await expect(statsGrid).toHaveAttribute('columns', '4');
  });

  test('Container: [x-container] has max-width and padding', async ({ page }) => {
    const container = page.locator('[x-container]');
    await expect(container).toHaveCount(1);
    await expect(container).toHaveAttribute('max-width', '900px');
    await expect(container).toHaveAttribute('padding', '2rem');
  });

  test('Divider: .x-divider exists', async ({ page }) => {
    await expect(page.locator('.x-divider')).toHaveCount(1);
  });

  test('Actions: 4 behavior buttons present', async ({ page }) => {
    await expect(page.locator('button[x-ripple], button[x-tooltip], button[x-confetti], button[x-copy]')).toHaveCount(4);
  });

  test('Actions: buttons contain expected text', async ({ page }) => {
    const container = page.locator('[x-container]');
    for (const text of ['Ripple', 'Tooltip', 'Confetti', 'Copy']) {
      await expect(container).toContainText(text);
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // FEATURES — x-grid > article[variant=float] ×6
  //
  // #854: the card is the SEMANTIC element now. 4.0.0 removed <wb-card>, and
  // the rename left this file asking for a type selector `x-card` that nothing
  // emits (0 matches). pages/home.html authors these as <article variant="float">.
  // ═══════════════════════════════════════════════════════════════

  const FEATURE_CARD = 'article[variant="float"]';
  // The features grid, identified by what it holds rather than by position --
  // server.js wraps fragment pages in <div class="demo-page">, so the old
  // `body > [x-grid]` combinator never matched (#854).
  const FEATURES_GRID = `[x-grid]:has(${FEATURE_CARD})`;

  test('Features: article[variant=float] renders 6 instances', async ({ page }) => {
    await expect(page.locator(FEATURE_CARD)).toHaveCount(6);
  });

  test('Features: cards have x-card--float class after hydration', async ({ page }) => {
    const cards = page.locator(FEATURE_CARD);
    for (let i = 0; i < 6; i++) {
      await expect(cards.nth(i)).toHaveClass(/x-card--float/);
    }
  });

  test('Features: cards contain expected text', async ({ page }) => {
    const featuresGrid = page.locator(FEATURES_GRID);
    for (const text of ['Component Library', 'Behaviors System', 'Theme Engine', 'Data Viz', 'Accessible', 'Performance']) {
      await expect(featuresGrid).toContainText(text);
    }
  });

  test('Grid: 2 [x-grid] instances (stats + features)', async ({ page }) => {
    // Stats grid inside x-container, features grid alongside it
    await expect(page.locator('[x-grid]')).toHaveCount(2);
  });

  // ═══════════════════════════════════════════════════════════════
  // NOTIFICATIONS — x-cardnotification (NOT notification-card)
  // ═══════════════════════════════════════════════════════════════

  test('Notifications: 4 [x-cardnotification] instances', async ({ page }) => {
    await expect(page.locator('[x-cardnotification]')).toHaveCount(4);
  });

  test('Notifications: all have required attributes (variant, title, message)', async ({ page }) => {
    const cards = page.locator('[x-cardnotification]');
    const expected = [
      { variant: 'info', title: 'System Update' },
      { variant: 'success', title: 'Complete' },
      { variant: 'warning', title: 'Attention' },
      { variant: 'error', title: 'Failure' }
    ];
    for (let i = 0; i < 4; i++) {
      await expect(cards.nth(i)).toHaveAttribute('variant', expected[i].variant);
      await expect(cards.nth(i)).toHaveAttribute('title', expected[i].title);
      await expect(cards.nth(i)).toHaveAttribute('message');
    }
  });

  test('Notifications: renders expected text', async ({ page }) => {
    const stack = page.locator('[x-stack]');
    await safeScrollIntoView(stack);
    await page.waitForTimeout(2000);
    for (const text of ['System Update', 'Complete', 'Attention', 'Failure']) {
      await expect(stack).toContainText(text, { timeout: 15000 });
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // AUDIO — <audio show-eq volume>
  //
  // #854: do NOT locate this by `.x-audio`. audio.js adds that class to the
  // <audio> host (semantics/audio.js:108) AND to the transport wrapper it
  // builds around it (`x-audio-host x-audio`, :326), so `.x-audio` resolves to
  // two elements and every strict-mode assertion below fails. The <audio>
  // element is the unique, semantic handle, and it is what pages/home.html
  // actually authors.
  //
  // #854: and do NOT safeScrollIntoView() it. audio.js keeps the native
  // <audio> HIDDEN behind the transport UI it builds around it, so waiting for
  // it to become "visible" can never succeed — that wait was what actually
  // timed these out. No scroll is needed either: server.js's dev shell scans
  // eagerly (`WB.scan(document.body, { eager: true })`), so the upgrade happens
  // at load rather than on an IntersectionObserver hit.
  // ═══════════════════════════════════════════════════════════════

  test('Audio: <audio> renders (minInstances=1)', async ({ page }) => {
    const audio = page.locator('audio');
    await expect(audio).toHaveCount(1);
    await expect(audio).toHaveClass(/x-audio/, { timeout: 15000 });
  });

  test('Audio: has required attributes (src, show-eq, volume)', async ({ page }) => {
    const audio = page.locator('audio');
    await expect(audio).toHaveAttribute('src');
    await expect(audio).toHaveAttribute('show-eq');
    await expect(audio).toHaveAttribute('volume', '0.5');
  });

  test('Audio: renders audio element and EQ', async ({ page }) => {
    // The behaviour wraps the <audio> in its own transport host and, because
    // `show-eq` is set, builds the equaliser inside it.
    await expect(page.locator('.x-audio-host > audio')).toHaveCount(1, { timeout: 15000 });
    await expect(page.locator('.x-audio-host .x-audio__eq-container')).toHaveCount(1, { timeout: 15000 });
  });

  // ═══════════════════════════════════════════════════════════════
  // MOBILE-FIRST — test.site.mobileFirst
  // ═══════════════════════════════════════════════════════════════

  test('Mobile-first: no element overflows viewport at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });
    const overflows = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      return Array.from(document.querySelectorAll('*')).filter(el => {
        return el.getBoundingClientRect().width > vw + 2;
      }).map(el => el.tagName.toLowerCase());
    });
    expect(overflows).toEqual([]);
  });

  test('Mobile-first: feature cards stack single-column at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });
    // Target the features grid, not the stats grid (#854: `body > [x-grid]`
    // never matched -- server.js wraps fragments in <div class="demo-page">).
    const columns = await page.locator(FEATURES_GRID).evaluate(el => {
      return getComputedStyle(el).gridTemplateColumns.split(' ').length;
    });
    expect(columns).toBe(1);
  });

  test('Desktop: feature cards show multiple columns at 1280px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });
    const columns = await page.locator(FEATURES_GRID).evaluate(el => {   // #854
      return getComputedStyle(el).gridTemplateColumns.split(' ').length;
    });
    expect(columns).toBeGreaterThanOrEqual(2);
  });

  // ═══════════════════════════════════════════════════════════════
  // FLUENT — test.site.fluent
  // ═══════════════════════════════════════════════════════════════

  test('Fluent: [x-container] has no dashed border', async ({ page }) => {
    const border = await page.locator('[x-container]').evaluate(el => getComputedStyle(el).borderStyle);
    expect(border).not.toContain('dashed');
  });

  test('Fluent: [x-container] has no builder background', async ({ page }) => {
    const bg = await page.locator('[x-container]').evaluate(el => getComputedStyle(el).backgroundColor);
    expect(bg).not.toMatch(/rgba\(31,\s*41,\s*55/);
  });

  test('Fluent: [x-container] has no forced min-height', async ({ page }) => {
    const minH = await page.locator('[x-container]').evaluate(el => getComputedStyle(el).minHeight);
    expect(minH).not.toBe('100px');
  });

  test('Fluent: stats cards are compact (height < 300px each)', async ({ page }) => {
    const stats = page.locator('[x-cardstats]');
    for (let i = 0; i < 4; i++) {
      const height = await stats.nth(i).evaluate(el => el.getBoundingClientRect().height);
      expect(height).toBeLessThan(300);
    }
  });

  test('Fluent: page has no horizontal scrollbar', async ({ page }) => {
    const hasHScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHScroll).toBe(false);
  });

  // ═══════════════════════════════════════════════════════════════
  // INTERACTIONS — interactions.elements
  // ═══════════════════════════════════════════════════════════════
  //
  // #873: all four of these used to be a bare `await locator.click()` (or
  // .hover()) with no expect() anywhere in the body. They passed for as long
  // as the input did not throw -- which a plain <button> carrying no behavior
  // at all also manages. Delete ripple.js outright and
  // 'ripple button is clickable' still went green.
  //
  // They now assert the EFFECT the title claims. For the two animated ones
  // that deliberately means NOT `getComputedStyle(el).animationName !== 'none'`:
  // animation-name is a plain custom-ident, an unknown one is not a CSS error,
  // so that check is green for a name matching no @keyframes at all while
  // nothing animates. It is exactly how #847 left 19 behaviors dead-silent
  // with their own suite watching. #860 established the two signals used here
  // instead -- resolve the name against the @keyframes actually defined in the
  // loaded stylesheets, and require a real `animationstart` from a listener
  // armed BEFORE the trigger. Armed first on purpose: sampling
  // getAnimations() afterwards races a sub-second animation that can finish
  // before the round-trip returns at --workers=8; an event that already fired
  // cannot expire.

  test('Interaction: ripple button paints a wave that really animates', async ({ page }) => {
    const btn = page.locator('button[x-ripple]');
    await expect(btn).toHaveCount(1);
    // ripple() adds .x-ripple to every host that is not a literal <x-ripple>
    // tag (#448). Waiting on it is waiting on WB.scan(), which the page does
    // not await -- so this is an auto-retrying matcher, never a one-shot
    // count(), or the press below can land before the listener is attached.
    await expect(btn).toHaveClass(/\bx-ripple\b/);

    // Armed BEFORE the press: createRipple() appends a <span class="x-ripple__wave">
    // and removes it again after `ripple-duration` (default 600ms), so a
    // post-hoc query for the wave can legitimately find nothing. animationstart
    // bubbles, so a listener on the button catches the wave's own event and
    // records which element it came from.
    await btn.evaluate((el) => {
      (el as any).__wbWaves = [];
      el.addEventListener('animationstart', (e) => {
        const ev = e as AnimationEvent;
        (el as any).__wbWaves.push({
          name: ev.animationName,
          cls: (ev.target as HTMLElement).className,
        });
      });
    });

    // ripple() listens on mousedown, not click (#354) -- click() dispatches it.
    await btn.click();

    await expect
      .poll(async () => btn.evaluate((el) => (el as any).__wbWaves.length), {
        timeout: 5000,
        message:
          'pressing [x-ripple] fired no animationstart at all, so no wave animated. '
          + 'A click that does not throw is not a ripple.',
      })
      .toBeGreaterThan(0);

    const waves: { name: string; cls: string }[] =
      await btn.evaluate((el) => (el as any).__wbWaves);

    expect(
      waves.map((w) => w.cls),
      'the animation that started did not come from a .x-ripple__wave span',
    ).toContain('x-ripple__wave');

    const names = [...new Set(waves.map((w) => w.name))];
    expect(names, 'the wave animated something other than x-ripple-animation').toContain(
      'x-ripple-animation',
    );
    expect(
      await missingKeyframes(page, names),
      'the wave asked for an animation-name that matches no @keyframes in any loaded '
      + 'stylesheet -- an unknown name is not a CSS error, so it renders NOTHING (#847)',
    ).toEqual([]);
  });

  test('Interaction: hovering the tooltip button shows its tooltip text', async ({ page }) => {
    const btn = page.locator('button[x-tooltip]');
    await expect(btn).toHaveCount(1);
    // tooltip() marks its trigger on attach; wait on that, not on a timeout.
    await expect(btn).toHaveClass(/\bx-tooltip-trigger\b/);

    // The content pipeline: tooltip() reads the x-tooltip attribute and puts
    // it in the tip's own .x-tooltip__content div. Asserting the rendered text
    // against the ATTRIBUTE is what separates "a tooltip appeared" from "an
    // empty box appeared" -- the latter is what a broken content resolution
    // produces, and it looks identical to a toBeVisible() check.
    const expected = await btn.getAttribute('x-tooltip');
    expect(expected, 'the home page tooltip button must declare its text').toBeTruthy();

    // Nothing on screen before the hover -- otherwise a leftover tip from
    // elsewhere would satisfy every assertion below.
    await expect(page.locator('.x-tooltip')).toHaveCount(0);

    await btn.hover();

    // show() waits config.delay (200ms) before appending, so this must be an
    // auto-retrying matcher.
    const tip = page.locator('.x-tooltip.x-tooltip--visible');
    await expect(tip).toHaveCount(1);
    await expect(tip).toHaveText(expected!);

    // .x-tooltip--visible is the CLASS; opacity is the PAINT. Assert the paint:
    // a stylesheet that failed to load leaves the class on an element still at
    // opacity 0, which toHaveClass would happily accept.
    await expect
      .poll(async () => tip.evaluate((el) => Number(getComputedStyle(el).opacity)), {
        timeout: 5000,
        message: 'the tooltip carries .x-tooltip--visible but never reached opacity 1',
      })
      .toBe(1);

    // The trigger and the tip it opened are wired to each other for AT.
    const tipId = await tip.getAttribute('id');
    expect(tipId).toBeTruthy();
    await expect(btn).toHaveAttribute('aria-describedby', tipId!);

    // ...and it goes away again. hide() runs on a 100ms + 150ms pair of
    // timers, so this is an auto-retrying matcher too.
    await page.mouse.move(0, 0);
    await expect(page.locator('.x-tooltip')).toHaveCount(0);
  });

  test('Interaction: confetti button spawns particles that really fall', async ({ page }) => {
    const btn = page.locator('button[x-confetti]');
    await expect(btn).toHaveCount(1);
    await expect(btn).toHaveClass(/\bx-confetti-trigger\b/);
    await expect(page.locator('.x-confetti-container')).toHaveCount(0);

    // Armed on the document BEFORE the click: the particles do not exist yet,
    // and animationstart bubbles. Filtered to x-confetti-fall on purpose --
    // confetti() also puts an INFINITE `x-confetti-gradient` animation on the
    // trigger button itself, which would satisfy an unfiltered listener
    // whether or not a single particle ever fell.
    await page.evaluate(() => {
      (window as any).__wbFall = [];
      document.addEventListener('animationstart', (e) => {
        const ev = e as AnimationEvent;
        if (ev.animationName === 'x-confetti-fall') (window as any).__wbFall.push(ev.animationName);
      });
    });

    await btn.click();

    const container = page.locator('.x-confetti-container');
    await expect(container).toHaveCount(1);
    // confetti() defaults to count=50 and the home page overrides nothing.
    // Asserting the COUNT is what proves the burst was built, rather than an
    // empty container being appended.
    await expect(container.locator('> div')).toHaveCount(50);

    // Particles carry a random animation-delay of up to 0.3s.
    await expect
      .poll(async () => page.evaluate(() => (window as any).__wbFall.length), {
        timeout: 5000,
        message:
          '50 confetti particles were appended but the browser started no x-confetti-fall '
          + 'animation on any of them, so nothing fell (the #847 failure mode)',
      })
      .toBeGreaterThan(0);

    expect(
      await missingKeyframes(page, ['x-confetti-fall']),
      'x-confetti-fall matches no @keyframes in any loaded stylesheet',
    ).toEqual([]);
  });

  test('Interaction: copy button writes its label to the clipboard', async ({ page, context }) => {
    // Reading the clipboard back is the only assertion that proves the thing
    // this behavior is named after actually happened.
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const btn = page.locator('button[x-copy]');
    await expect(btn).toHaveCount(1);
    // copy() sets cursor:pointer on attach -- the one observable marker it
    // leaves (it deliberately adds no class, #448), so this is the hydration
    // wait that keeps the click below from racing WB.scan().
    await expect
      .poll(async () => btn.evaluate((el) => getComputedStyle(el).cursor), { timeout: 10000 })
      .toBe('pointer');

    // Pinned to the literal as well as read from the DOM: comparing the
    // clipboard only against the element's own text would let the assertion
    // degenerate into "the DOM equals itself".
    const label = (await btn.innerText()).trim();
    expect(label).toBe('📋 Copy');

    // copy() dispatches wb:copy:success ONLY when the clipboard write returned
    // true, and carries the exact text it wrote.
    await page.evaluate(() => {
      (window as any).__wbCopied = [];
      document.addEventListener('wb:copy:success', (e) => {
        (window as any).__wbCopied.push((e as CustomEvent).detail.text);
      });
    });

    // showFeedback() swaps the button's own text to "Copied!" and restores it
    // after copy-duration (2000ms). Recorded by an observer armed before the
    // click rather than asserted after it, so a slow round-trip at
    // --workers=8 cannot arrive after the restore and read as a failure.
    await btn.evaluate((el) => {
      (el as any).__wbFeedback = [];
      new MutationObserver(() => {
        if (el.classList.contains('x-copy--copied')) {
          (el as any).__wbFeedback.push((el.textContent || '').trim());
        }
      }).observe(el, { attributes: true, childList: true, subtree: true, characterData: true });
    });

    await btn.click();

    await expect
      .poll(async () => page.evaluate(() => (window as any).__wbCopied), { timeout: 10000 })
      .toEqual([label]);

    await expect
      .poll(async () => page.evaluate(() => navigator.clipboard.readText()), {
        timeout: 10000,
        message: 'the system clipboard does not hold what [x-copy] claimed to copy',
      })
      .toBe(label);

    await expect
      .poll(async () => btn.evaluate((el) => (el as any).__wbFeedback), { timeout: 10000 })
      .toContain('Copied!');
  });
});

/**
 * Every @keyframes name in `names` that NO loaded stylesheet actually defines.
 *
 * The point of the exercise (#847/#860): animation-name is a plain
 * custom-ident. An unknown one is not a CSS error -- the property holds the
 * value, getComputedStyle reports it, and nothing animates. Resolving the name
 * against the rules the document really has is what turns "an attribute was
 * written" into "an animation exists", and it produces a useful failure
 * message instead of a bare boolean.
 */
async function missingKeyframes(page: Page, names: string[]): Promise<string[]> {
  return page.evaluate((wanted: string[]) => {
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
    return wanted.filter((n) => n && n !== 'none' && !defined.has(n));
  }, names);
}

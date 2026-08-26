import { test, expect } from '@playwright/test';

// Historically this suite used page.setContent() with its own <script
// src="/src/index.js"> to bootstrap WB from scratch per test. That's dead
// infrastructure: index.js isn't the site's real entry point (index.html
// loads main.js; only one unrelated demo page still references index.js),
// it boots a second, independent WBSite that immediately throws (no #app
// in the setContent fixture), and mixing that with a real page.goto('/')
// left an orphaned wb.js bootstrap chain racing the setContent()'d
// content -- some behaviors happened to get picked up by leftover global
// state, others (rating/list/desclist) silently never did. Loading the
// real app once and injecting test elements into its live document.body,
// then explicitly awaiting await WB.scan() on them, is the same reliable
// pattern already used by tests/behaviors/permutation-compliance.spec.ts.
test.describe('Fix Verification Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 20000 });
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage, { timeout: 20000 });
  });

  async function mount(page, html: string) {
    return page.evaluate(async (h: string) => {
      document.getElementById('fixes-verification-mount')?.remove();
      const c = document.createElement('div');
      c.id = 'fixes-verification-mount';
      c.innerHTML = h;
      document.body.appendChild(c);
      await (window as any).WB.scan(c);
    }, html);
  }

  // WB_CARD_BOOLEAN_PARSING_030
  test('Card handles empty boolean attributes correctly', async ({ page }) => {
    // data-behavior="X" is a dead attribute -- nothing in the current
    // runtime reads it (await WB.scan()/WB.observe() dispatch off the <wb-X> tag
    // itself, x-X attributes, or {prefix}-X shorthand, never data-behavior).
    // <article> is schema-excluded (card.js builds its own DOM) and reads
    // bare attribute names, matching every real usage elsewhere (e.g.
    // demos/site/cards.html).
    await mount(page, `<article id="test-card-bool" clickable title="Boolean Test"></article>`);

    const card = page.locator('#test-card-bool');
    await expect(card).toHaveClass(/x-card--clickable/);
    await expect(card).toHaveAttribute('role', 'button');
  });

  // WB_CARD_CLICKABLE_TOGGLE_025
  test('Clickable card toggles active state on click', async ({ page }) => {
    await mount(page, `<article id="test-card-toggle" clickable title="Toggle Test"></article>`);

    const card = page.locator('#test-card-toggle');
    await expect(card).not.toHaveClass(/x-card--active/);

    await card.click();
    await expect(card).toHaveClass(/x-card--active/);

    await card.click();
    await expect(card).not.toHaveClass(/x-card--active/);
  });

  // WB_FIGURE_CAPTION_021
  test('Figure component renders caption from caption attribute', async ({ page }) => {
    // x-media doesn't exist -- media.js was split into per-tag
    // semantics/img.js, video.js, audio.js, figure.js (behaviorModules,
    // src/wb-viewmodels/index.js); figure.js reads a bare `caption`
    // attribute, not `data-caption`.
    await mount(page, `
      <figure id="test-figure" caption="Test Caption" x-figure>
        <img src="/assets/images/placeholder.jpg" alt="Test">
      </figure>
    `);

    const figure = page.locator('#test-figure');
    const caption = figure.locator('figcaption');
    await expect(caption).toBeVisible();
    await expect(caption).toHaveText('Test Caption');
  });

  // WB_AUDIO_EQ_CONTROLS_022
  test('EQ panel contains play button and volume slider', async ({ page }) => {
    // media.js (the old grab-bag `x-media`/data-type dispatcher this test
    // used) was retired and split into per-tag files (behaviorModules,
    // src/wb-viewmodels/index.js) -- audio is now semantics/audio.js, driven
    // off a real <audio> element with a bare `show-eq` attribute (not
    // data-eq). buildEqUI()/createVolumeRow() there build
    // .x-audio__eq-container with a master-volume row containing an
    // (unclassed) play/pause button and .x-audio__master-vol.
    // audio() (semantics/audio.js) hides the underlying <audio> tag itself
    // (display:none) once it builds the custom "Marantz transport" UI --
    // when given a bare <audio> directly, that self-hide takes the
    // transport/EQ container down with it (both got appendChild'd onto the
    // element being hidden). Every real usage (pages/behaviors.html,
    // pages/behaviors.html) uses the <audio> wrapper tag instead, where
    // the internal <audio> is a separate hidden child and the custom UI
    // stays visible. demos/audio.mp3 is a real local asset.
    await mount(page, `<audio id="test-eq" src="/demos/audio.mp3" show-eq controls></audio>`);

    // Scoped to the mount container -- the real homepage (loaded by
    // beforeEach's goto('/')) has its own <audio show-eq> too, and an
    // unscoped locator hits both (strict-mode violation).
    const eqContainer = page.locator('#fixes-verification-mount .x-audio__eq-container');
    await expect(eqContainer).toBeVisible();

    const masterVol = eqContainer.locator('.x-audio__master-vol');
    await expect(masterVol).toBeVisible();

    // The volume row's play/pause button has no class of its own; it's the
    // first <button> in the same row as the master-vol slider.
    const playBtn = masterVol.locator('xpath=../button').first();
    await expect(playBtn).toBeVisible();
  });

  // ==========================================================================
  // COLOR PICKER TESTS (001-014)
  // ==========================================================================
  test('Colorpicker converts input to native type=color', async ({ page }) => {
    // colorpicker() (src/wb-viewmodels/colorpicker.js) is a plain behavior
    // function, not a class-based <div x-colorpicker> custom element -- it was
    // rewritten to convert a real <input> into the browser's own native
    // <input type="color"> (light DOM, no shadow root, no custom
    // open/close/toggle API -- the native picker owns that), per this
    // project's "enhance native elements, never reinvent them" rule. The
    // original 001-014 checks (customElements.get, .services, .open/.close/
    // .toggle/.copyToClipboard, role=button trigger) tested an
    // architecture that no longer exists.
    await mount(page, `<input id="test-picker" type="text" x-colorpicker value="#6366f1">`);

    const picker = page.locator('#test-picker');
    await expect(picker).toHaveClass(/x-colorpicker/);
    await expect(picker).toHaveClass(/x-colorpicker__input/);
    await expect(picker).toHaveAttribute('type', 'color');

    const hasShadow = await page.evaluate(() => !!document.querySelector('#test-picker').shadowRoot);
    expect(hasShadow).toBe(false);

    const eventFired = await page.evaluate(() => {
      return new Promise(resolve => {
        const el = document.querySelector('#test-picker');
        el.addEventListener('wb:colorpicker:change', (e: any) => resolve(e.detail));
        (el as HTMLInputElement).value = '#00ff00';
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });
    expect(eventFired).toEqual({ value: '#00ff00' });
  });

  // ==========================================================================
  // SEMANTICS & BEHAVIORS (036-039, 041-044)
  // ==========================================================================
  test('New semantic behaviors render correctly', async ({ page }) => {
    // data-behavior="X" is dead (see the card test above); x-X is the real
    // dispatch attribute for enhancing a native tag in place.
    await mount(page, `
      <ul id="test-list" x-list data-items='["A", "B", "C"]'></ul>
      <dl id="test-desclist" x-desclist></dl>
      <div id="test-empty" x-empty></div>
      <pre id="test-code">const x = 1;</pre>
      <div id="test-stat" x-stat></div>
      <div id="test-timeline" x-timeline></div>
      <div id="test-json" x-json></div>
    `);

    // 036, 041: List with JSON items
    const listItems = page.locator('#test-list li');
    await expect(listItems).toHaveCount(3);
    await expect(listItems.first()).toHaveText('A');

    // 037: Desclist -- actual class is x-dl (desclist.js), not x-desclist
    await expect(page.locator('#test-desclist')).toHaveClass(/x-dl/);

    // 038: Empty
    await expect(page.locator('#test-empty')).toHaveClass(/x-empty/);

    // 039: <pre> is auto-enhanced by its native-tag mapping (tag-map.js)
    // without needing an explicit x-code attribute -- x-code is for a
    // <code> nested inside a <pre> (see semantic-attributes.js /
    // demo.js's own <pre x-behavior="pre"><code x-behavior="code">
    // convention), not the <pre> itself. pre.js adds x-pre, not x-code.
    await expect(page.locator('#test-code')).toHaveClass(/x-pre/);

    // 042: Stat
    await expect(page.locator('#test-stat')).toHaveClass(/x-stat/);

    // 043: Timeline
    await expect(page.locator('#test-timeline')).toHaveClass(/x-timeline/);

    // 044: JSON
    await expect(page.locator('#test-json')).toHaveClass(/x-json/);
  });

  // ==========================================================================
  // CARD FIXES (023, 024, 027)
  // ==========================================================================
  test('Card behavior fixes', async ({ page }) => {
    // cardproduct() (card.js) is its own self-sufficient tag -- it builds
    // its own .x-card__cta button internally from `title`/`price`/etc
    // attributes, same as every real usage (e.g. demos/site/cards.html).
    await mount(page, `<div x-cardproduct id="test-card" title="Test Product" price="$10"></div>`);

    const card = page.locator('#test-card');

    // 023: No crash -- WB.inject() marks a failed behavior with x-error
    // (wb.js), not data-x-error.
    await expect(card).not.toHaveAttribute('x-error', 'true');

    // 027: Compliance classes
    await expect(card).toHaveClass(/x-card/);

    // 024: Product event
    const eventFired = await page.evaluate(async () => {
      return new Promise(resolve => {
        const card = document.querySelector('#test-card');
        let fired = false;
        card.addEventListener('wb:cardproduct:addtocart', () => { fired = true; });

        // cardproduct()'s real CTA class is x-card__product-cta, not the
        // generic x-card__cta.
        const btn = card.querySelector('.x-card__product-cta');
        if (btn) (btn as HTMLElement).click();

        setTimeout(() => resolve(fired), 100);
      });
    });
    expect(eventFired).toBe(true);
  });

  // ==========================================================================
  // CORE FIXES (028, 029, 032, 040)
  // ==========================================================================
  test('Core behaviors work correctly', async ({ page }) => {
    await mount(page, `<div id="test-rating" x-rating></div>`);

    // 029: Rating implemented
    const rating = page.locator('#test-rating');
    await expect(rating).toHaveClass(/x-rating/);
    // Should have stars
    await expect(rating.locator('.x-rating__star').first()).toBeVisible();

    // 028, 040: Missing behaviors and aliases
    // We check if we can import them dynamically without error.
    // src/behaviors/js/ was renamed to src/wb-viewmodels/.
    const importsWork = await page.evaluate(async () => {
      try {
        await import('/src/wb-viewmodels/globe.js');
        await import('/src/wb-viewmodels/scroll-progress.js');
        await import('/src/wb-viewmodels/slider.js');
        return true;
      } catch (e) {
        return false;
      }
    });
    expect(importsWork).toBe(true);

    // 032: Async loading (WB.inject/scan) -- .x-ready was never a real
    // class any behavior adds (confirmed: no such classList.add anywhere in
    // src/); the x-rating assertion above already proves async
    // scan()/inject() completed successfully for this element.
  });

  test('Syntax fixes verification', async ({ page }) => {
    // 016, 020, 026, 033: Import modules to ensure no syntax errors.
    // src/behaviors/js/ was renamed to src/wb-viewmodels/; code.js moved
    // under semantics/.
    const syntaxCheck = await page.evaluate(async () => {
      try {
        await import('/src/wb-viewmodels/semantics/code.js');
        await import('/src/wb-viewmodels/semantics/table.js');
        await import('/src/wb-viewmodels/card.js');
        await import('/src/wb-viewmodels/semantics/textarea.js');
        return true;
      } catch (e) {
        return e.toString();
      }
    });
    expect(syntaxCheck).toBe(true);
  });

  test('Demo files load without error (031)', async ({ page }) => {
    // demos/card.html doesn't exist; demos/site/cards.html is the current
    // card-family demo page.
    const response = await page.goto('/demos/site/cards.html');
    expect(response.status()).toBe(200);

    // Check for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    // Wait a bit for scripts to run
    await page.waitForTimeout(1000);

    // Should be no syntax errors
    const syntaxErrors = errors.filter(e => e.includes('SyntaxError'));
    expect(syntaxErrors).toEqual([]);
  });

  test('Media behavior export (017)', async ({ page }) => {
    // media.js (the single grab-bag file this test targeted) was retired
    // and split into one file per tag (behaviorModules, src/wb-viewmodels/
    // index.js: image -> semantics/img.js, video -> semantics/video.js,
    // audio -> semantics/audio.js) -- each exports its own named function.
    const exports = await page.evaluate(async () => {
      const [imgM, videoM, audioM] = await Promise.all([
        import('/src/wb-viewmodels/semantics/img.js'),
        import('/src/wb-viewmodels/semantics/video.js'),
        import('/src/wb-viewmodels/semantics/audio.js'),
      ]);
      return {
        img: Object.keys(imgM),
        video: Object.keys(videoM),
        audio: Object.keys(audioM),
      };
    });
    expect(exports.img).toContain('img');
    expect(exports.img).toContain('default');
    expect(exports.video).toContain('video');
    expect(exports.audio).toContain('audio');
  });

});

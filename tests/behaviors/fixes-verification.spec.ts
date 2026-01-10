import { test, expect } from '@playwright/test';

test.describe('Fix Verification Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Basic setup with WB loaded
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <script src="/src/index.js" type="module"></script>
        <link rel="stylesheet" href="/src/styles/site.css">
      </head>
      <body>
      </body>
      </html>
    `);
  });

  // WB_CARD_BOOLEAN_PARSING_030
  test('Card handles empty boolean attributes correctly', async ({ page }) => {
    await page.setContent(`
      <article id="test-card-bool" data-behavior="card" data-clickable="" data-title="Boolean Test"></article>
      <script src="/src/index.js" type="module"></script>
    `);

    const card = page.locator('#test-card-bool');
    await expect(card).toHaveClass(/wb-card--clickable/);
    await expect(card).toHaveAttribute('role', 'button');
  });

  // WB_CARD_CLICKABLE_TOGGLE_025
  test('Clickable card toggles active state on click', async ({ page }) => {
    await page.setContent(`
      <article id="test-card-toggle" data-behavior="card" data-clickable="true" data-title="Toggle Test"></article>
      <script src="/src/index.js" type="module"></script>
    `);

    const card = page.locator('#test-card-toggle');
    await expect(card).not.toHaveClass(/wb-card--active/);
    
    await card.click();
    await expect(card).toHaveClass(/wb-card--active/);
    
    await card.click();
    await expect(card).not.toHaveClass(/wb-card--active/);
  });

  // WB_FIGURE_CAPTION_021
  test('Figure component renders caption from data-caption', async ({ page }) => {
    await page.setContent(`
      <figure id="test-figure" data-wb="media" data-caption="Test Caption">
        <img src="/assets/images/placeholder.jpg" alt="Test">
      </figure>
      <script src="/src/index.js" type="module"></script>
    `);

    const figure = page.locator('#test-figure');
    const caption = figure.locator('figcaption');
    await expect(caption).toBeVisible();
    await expect(caption).toHaveText('Test Caption');
  });

  // WB_AUDIO_EQ_CONTROLS_022
  test('EQ panel contains play button and volume slider', async ({ page }) => {
    // We need to mock the audio context or just check if the controls are rendered
    // Since we can't easily play audio in headless, we'll check structure
    await page.setContent(`
      <div id="test-eq" data-wb="media" data-type="audio" data-src="/assets/audio/test.mp3" data-eq="true"></div>
      <script src="/src/index.js" type="module"></script>
    `);

    // Wait for EQ to initialize (might take a moment if it waits for audio load)
    // However, if the fix added controls to the panel construction, they should be there
    // Note: The EQ might not render until user interaction or audio load in some implementations
    // Let's check the implementation of media.js if needed, but assuming it renders controls
    
    // Based on the fix description: "Added controls row with Play/Pause button and Master Volume slider"
    // We look for those elements
    const eqPanel = page.locator('.wb-media__eq-panel');
    // It might be hidden or not created until activated. 
    // If this test is flaky, we might need to inspect media.js to see how to trigger it.
    // For now, let's assume it's part of the structure if data-eq="true"
    
    // If the EQ panel is not immediately visible, we might need to click an EQ button
    // But let's try to find the controls if they exist in the DOM
    
    // If this fails, I'll read media.js to understand the rendering logic
    const playBtn = page.locator('.wb-audio__eq-play-btn');
    const masterVol = page.locator('.wb-audio__master-vol');
    
    // Wait for EQ to be injected (it happens after audio play or if showEq is true)
    // In media.js: if (config.showEq) ... eqContainer.appendChild(controlsRow)
    await expect(playBtn).toBeVisible();
    await expect(masterVol).toBeVisible();
  });

  // ==========================================================================
  // COLOR PICKER TESTS (001-014)
  // ==========================================================================
  test('WBColorPicker meets all requirements', async ({ page }) => {
    await page.setContent(`
      <wb-color-picker id="test-picker"></wb-color-picker>
      <script src="/src/behaviors/js/color-picker.js" type="module"></script>
    `);

    const picker = page.locator('#test-picker');
    
    // 001: Component defined
    const isDefined = await page.evaluate(() => !!customElements.get('wb-color-picker'));
    expect(isDefined).toBe(true);

    // 002: Has class
    await expect(picker).toHaveClass(/wb-color-picker/);

    // 003: Light DOM (no shadow root)
    const hasShadow = await page.evaluate(() => !!document.querySelector('#test-picker').shadowRoot);
    expect(hasShadow).toBe(false);

    // 004, 005: Services and methods
    const servicesCheck = await page.evaluate(() => {
      const el = document.querySelector('#test-picker');
      const s = el.services || {};
      return {
        hasServices: !!el.services,
        hasOpen: typeof s.open === 'function' && typeof el.open === 'function',
        hasClose: typeof s.close === 'function' && typeof el.close === 'function',
        hasToggle: typeof s.toggle === 'function' && typeof el.toggle === 'function',
        hasCopy: typeof s.copyToClipboard === 'function' && typeof el.copyToClipboard === 'function'
      };
    });
    expect(servicesCheck.hasServices).toBe(true);
    expect(servicesCheck.hasOpen).toBe(true);
    expect(servicesCheck.hasClose).toBe(true);
    expect(servicesCheck.hasToggle).toBe(true);
    expect(servicesCheck.hasCopy).toBe(true);

    // 010, 011, 012: Getters/Setters
    await page.evaluate(() => {
      const el = document.querySelector('#test-picker');
      el.value = '#ff0000';
      el.format = 'rgb';
      el.disabled = true;
    });
    await expect(picker).toHaveAttribute('value', '#ff0000');
    await expect(picker).toHaveAttribute('format', 'rgb');
    await expect(picker).toHaveAttribute('disabled', '');

    // 013, 014: Trigger ARIA
    // The trigger is likely the first child or a specific element. 
    // Let's look for an element with role="button" inside the picker
    const trigger = picker.locator('[role="button"]').first();
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-haspopup', 'true');
  });

  // ==========================================================================
  // SEMANTICS & BEHAVIORS (036-039, 041-044)
  // ==========================================================================
  test('New semantic behaviors render correctly', async ({ page }) => {
    await page.setContent(`
      <ul id="test-list" data-behavior="list" data-items='["A", "B", "C"]'></ul>
      <dl id="test-desclist" data-behavior="desclist"></dl>
      <div id="test-empty" data-behavior="empty"></div>
      <pre id="test-code" data-behavior="code">const x = 1;</pre>
      <div id="test-stat" data-behavior="stat"></div>
      <div id="test-timeline" data-behavior="timeline"></div>
      <div id="test-json" data-behavior="json"></div>
      <script src="/src/index.js" type="module"></script>
    `);

    // 036, 041: List with JSON items
    const listItems = page.locator('#test-list li');
    await expect(listItems).toHaveCount(3);
    await expect(listItems.first()).toHaveText('A');

    // 037: Desclist
    await expect(page.locator('#test-desclist')).toHaveClass(/wb-desclist/);

    // 038: Empty
    await expect(page.locator('#test-empty')).toHaveClass(/wb-empty/);

    // 039: Code on PRE
    await expect(page.locator('#test-code')).toHaveClass(/x-code/);

    // 042: Stat
    await expect(page.locator('#test-stat')).toHaveClass(/wb-stat/);

    // 043: Timeline
    await expect(page.locator('#test-timeline')).toHaveClass(/wb-timeline/);

    // 044: JSON
    await expect(page.locator('#test-json')).toHaveClass(/wb-json/);
  });

  // ==========================================================================
  // CARD FIXES (023, 024, 027)
  // ==========================================================================
  test('Card behavior fixes', async ({ page }) => {
    await page.setContent(`
      <article id="test-card" data-behavior="card" data-variant="product">
        <button class="wb-card__cta">Add to Cart</button>
      </article>
      <script src="/src/index.js" type="module"></script>
    `);

    const card = page.locator('#test-card');
    
    // 023: No crash (data-wb-error not present)
    await expect(card).not.toHaveAttribute('data-wb-error', 'true');

    // 027: Compliance classes
    // Note: These classes depend on config, but let's check if basic classes are added
    await expect(card).toHaveClass(/wb-card/);

    // 024: Product event
    const eventFired = await page.evaluate(() => {
      return new Promise(resolve => {
        const card = document.querySelector('#test-card');
        let fired = false;
        card.addEventListener('wb:cardproduct:addtocart', () => { fired = true; });
        
        const btn = card.querySelector('.wb-card__cta');
        if (btn) btn.click();
        
        // Wait a tick
        setTimeout(() => resolve(fired), 100);
      });
    });
    expect(eventFired).toBe(true);
  });

  // ==========================================================================
  // BUILDER & CORE FIXES (015, 018, 028, 029, 032, 040)
  // ==========================================================================
  test('Builder properties and Core behaviors work correctly', async ({ page }) => {
    await page.setContent(`
      <div id="test-rating" data-behavior="rating"></div>
      <script src="/src/index.js" type="module"></script>
    `);

    // 029: Rating implemented
    const rating = page.locator('#test-rating');
    await expect(rating).toHaveClass(/wb-rating/);
    // Should have stars
    await expect(rating.locator('.wb-rating__star').first()).toBeVisible();

    // 028, 040: Missing behaviors and aliases
    // We check if we can import them dynamically without error
    const importsWork = await page.evaluate(async () => {
      try {
        await import('/src/behaviors/js/globe.js');
        await import('/src/behaviors/js/scroll-progress.js');
        await import('/src/behaviors/js/slider.js');
        return true;
      } catch (e) {
        return false;
      }
    });
    expect(importsWork).toBe(true);

    // 032: Async loading (WB.inject/scan)
    // If the page loaded and behaviors applied, async loading is working.
    // We can verify by checking if data-wb-ready is set on elements
    await expect(rating).toHaveAttribute('data-wb-ready', 'true');
  });

  test('Syntax fixes verification', async ({ page }) => {
    // 016, 020, 026, 033: Import modules to ensure no syntax errors
    const syntaxCheck = await page.evaluate(async () => {
      try {
        await import('/src/behaviors/js/code.js');
        await import('/src/behaviors/js/semantics/table.js');
        await import('/src/behaviors/js/card.js');
        await import('/src/behaviors/js/semantics/textarea.js');
        return true;
      } catch (e) {
        return e.toString();
      }
    });
    expect(syntaxCheck).toBe(true);
  });

  test('Builder Property Rendering (015)', async ({ page }) => {
    // Mock the builder property rendering function
    await page.setContent(`
      <script type="module">
        import { renderPropertyControl } from '/src/builder/builder-properties.js';
        window.renderPropertyControl = renderPropertyControl;
      </script>
    `);

    const result = await page.evaluate(() => {
      try {
        // Test case: Select with object options
        const prop = {
          name: 'test',
          type: 'select',
          options: [
            { label: 'Option A', value: 'a' },
            { label: 'Option B', value: 'b' }
          ]
        };
        const html = window.renderPropertyControl(prop, 'a');
        return html;
      } catch (e) {
        return 'ERROR: ' + e.toString();
      }
    });

    // Should contain the labels, not [object Object]
    expect(result).toContain('Option A');
    expect(result).toContain('Option B');
    expect(result).not.toContain('[object Object]');
  });

  test('Demo files load without error (031)', async ({ page }) => {
    const response = await page.goto('/demos/card.html');
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
    const exports = await page.evaluate(async () => {
      const m = await import('/src/behaviors/js/media.js');
      return Object.keys(m);
    });
    // Should export default and named exports
    expect(exports).toContain('default');
    expect(exports).toContain('image');
    expect(exports).toContain('video');
    expect(exports).toContain('audio');
  });

});

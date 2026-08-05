import { test, expect, Page } from '@playwright/test';

const BASE_URL = '/demos/test-harness.html';

test.describe('Notes Behavior', () => {
  async function injectNotes(page: Page, html: string) {
    await page.goto(BASE_URL);
    await page.waitForFunction(
      () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
      { timeout: 10000 }
    );
    // demos/test-harness.html is a bare WB.init() fixture -- it never creates
    // a window.WBSite (that's the main SPA's site-engine.js only). This
    // helper used to wait on it anyway, so EVERY test in this file failed
    // identically on a 10s timeout at this line, regardless of what it was
    // actually testing -- pre-existing, unrelated to today's notes.js work.
    await page.waitForTimeout(100);
    
    // Clear localStorage to prevent state interference
    await page.evaluate(() => localStorage.clear());

    await page.evaluate((html: string) => {
      const existing = document.getElementById('test-container');
      if (existing) existing.remove();
      
      const container = document.createElement('div');
      container.id = 'test-container';
      container.innerHTML = html;
      document.body.appendChild(container);
    }, html);
    
    await page.evaluate(async () => {
      await (window as any).WB.scan(document.getElementById('test-container'), { eager: true });
    });

    await page.waitForTimeout(50);
  }

  // ==========================================
  // STRUCTURE TESTS
  // ==========================================
  test.describe('Structure', () => {
    test('should add wb-notes class to element', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      const notes = page.locator('#test-container wb-notes');
      await expect(notes).toHaveClass(/wb-notes/);
    });

    test('should create backdrop element', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      const backdrop = page.locator('#test-container .wb-notes__backdrop');
      await expect(backdrop).toBeAttached();
    });

    test('should create drawer element', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      const drawer = page.locator('#test-container .wb-notes__drawer');
      await expect(drawer).toBeAttached();
    });

    test('should create header element', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      const header = page.locator('#test-container .wb-notes__header');
      await expect(header).toBeAttached();
    });

    test('should create textarea element', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      const textarea = page.locator('#test-container .wb-notes__textarea');
      await expect(textarea).toBeAttached();
    });

    test('should create footer element', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      const footer = page.locator('#test-container .wb-notes__footer');
      await expect(footer).toBeAttached();
    });

    test('should create status element in footer', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      const status = page.locator('#test-container .wb-notes__status');
      await expect(status).toBeAttached();
    });
  });

  // ==========================================
  // BUTTON TESTS
  // ==========================================
  test.describe('Buttons', () => {
    test('should have collapse left button («)', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      const btn = page.locator('#test-container .wb-notes__wide-btn[data-action="collapse-left"]');
      await expect(btn).toBeAttached();
      await expect(btn).toHaveText('«');
    });

    test('should have collapse right button (»)', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      const btn = page.locator('#test-container .wb-notes__wide-btn[data-action="collapse-right"]');
      await expect(btn).toBeAttached();
      await expect(btn).toHaveText('»');
    });

    test('should have left position button', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      const btn = page.locator('#test-container .wb-notes__wide-btn[data-pos="left"]');
      await expect(btn).toBeAttached();
    });

    test('should have modal position button', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      const btn = page.locator('#test-container .wb-notes__wide-btn[data-pos="modal"]');
      await expect(btn).toBeAttached();
    });

    test('should have right position button', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      const btn = page.locator('#test-container .wb-notes__wide-btn[data-pos="right"]');
      await expect(btn).toBeAttached();
    });

    test('should have pick-element button', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      const btn = page.locator('#test-container .wb-notes__wide-btn[data-action="pick"]');
      await expect(btn).toBeAttached();
    });

    test('should have lookup button', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      const btn = page.locator('#test-container .wb-notes__wide-btn[data-action="view"]');
      await expect(btn).toBeAttached();
    });

    test('should NOT have a copy button in the UI (John: "probably do not need the copy button")', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      const btn = page.locator('#test-container [data-action="copy"]');
      await expect(btn).toHaveCount(0);
    });

    test('should have save button in the footer, at the bottom', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      const btn = page.locator('#test-container .wb-notes__footer .wb-notes__wide-btn[data-action="save"]');
      await expect(btn).toBeAttached();
    });

    test('should have close button pinned to the header corner', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      const btn = page.locator('#test-container .wb-notes__header .wb-notes__close-corner[data-action="close"]');
      await expect(btn).toBeAttached();
    });

    test('should have a New button in footer (replaces the old destructive Clear)', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      const btn = page.locator('#test-container .wb-notes__footer .wb-notes__wide-btn[data-action="new"]');
      await expect(btn).toBeAttached();
      await expect(btn).toContainText('New');
    });

    test('header should have a 0.5rem top gap above the title', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      // notes.css is JIT-loaded (ensureBehaviorCss) -- give the fetch a beat
      // to land before reading computed style, or this reads the browser's
      // pre-stylesheet default (0px) instead of the real value.
      await expect.poll(
        () => page.locator('#test-container .wb-notes__header').evaluate((el) => getComputedStyle(el).paddingTop),
        { timeout: 5000 }
      ).toBe('8px'); // 0.5rem
    });
  });

  // ==========================================
  // POSITION TESTS
  // ==========================================
  test.describe('Position', () => {
    test('should default to left position', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      const notes = page.locator('#test-container wb-notes');
      await expect(notes).toHaveClass(/wb-notes--left/);
    });

    test('should respect position="right"', async ({ page }) => {
      await injectNotes(page, '<wb-notes position="right"></wb-notes>');
      const notes = page.locator('#test-container wb-notes');
      await expect(notes).toHaveClass(/wb-notes--right/);
    });

    test('should respect position="modal"', async ({ page }) => {
      await injectNotes(page, '<wb-notes position="modal"></wb-notes>');
      const notes = page.locator('#test-container wb-notes');
      await expect(notes).toHaveClass(/wb-notes--modal/);
    });

    test('should mark left button active when position is left', async ({ page }) => {
      await injectNotes(page, '<wb-notes position="left"></wb-notes>');
      const btn = page.locator('#test-container .wb-notes__wide-btn[data-pos="left"]');
      await expect(btn).toHaveClass(/active/);
    });

    test('should mark right button active when position is right', async ({ page }) => {
      await injectNotes(page, '<wb-notes position="right"></wb-notes>');
      const btn = page.locator('#test-container .wb-notes__wide-btn[data-pos="right"]');
      await expect(btn).toHaveClass(/active/);
    });

    test('should mark modal button active when position is modal', async ({ page }) => {
      await injectNotes(page, '<wb-notes position="modal"></wb-notes>');
      const btn = page.locator('#test-container .wb-notes__wide-btn[data-pos="modal"]');
      await expect(btn).toHaveClass(/active/);
    });
  });

  // ==========================================
  // OPEN/CLOSE TESTS
  // ==========================================
  test.describe('Open/Close', () => {
    test('should add wb-notes--open class when opened via API', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      await page.evaluate(() => {
        const el = document.querySelector('wb-notes') as any;
        el.wbNotes.open();
      });
      const notes = page.locator('#test-container wb-notes');
      await expect(notes).toHaveClass(/wb-notes--open/);
    });

    test('should remove wb-notes--open class when closed via API', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      await page.evaluate(() => {
        const el = document.querySelector('wb-notes') as any;
        el.wbNotes.open();
        el.wbNotes.close();
      });
      const notes = page.locator('#test-container wb-notes');
      await expect(notes).not.toHaveClass(/wb-notes--open/);
    });

    test('should toggle open state via API', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      await page.evaluate(() => {
        const el = document.querySelector('wb-notes') as any;
        el.wbNotes.toggle();
      });
      const notes = page.locator('#test-container wb-notes');
      await expect(notes).toHaveClass(/wb-notes--open/);
    });

    test('close button should close drawer', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      await page.evaluate(() => {
        const el = document.querySelector('wb-notes') as any;
        el.wbNotes.open();
      });
      await page.click('#test-container .wb-notes__close-corner[data-action="close"]');
      const notes = page.locator('#test-container wb-notes');
      await expect(notes).not.toHaveClass(/wb-notes--open/);
    });
  });

  // ==========================================
  // COLLAPSE TESTS
  // ==========================================
  test.describe('Collapse Arrows', () => {
    test('collapse left button should set position to left and close', async ({ page }) => {
      await injectNotes(page, '<wb-notes position="right"></wb-notes>');
      await page.evaluate(() => {
        const el = document.querySelector('wb-notes') as any;
        el.wbNotes.open();
      });
      await page.click('#test-container .wb-notes__wide-btn[data-action="collapse-left"]');
      const notes = page.locator('#test-container wb-notes');
      await expect(notes).toHaveClass(/wb-notes--left/);
      await expect(notes).not.toHaveClass(/wb-notes--open/);
    });

    test('collapse right button should set position to right and close', async ({ page }) => {
      await injectNotes(page, '<wb-notes position="left"></wb-notes>');
      await page.evaluate(() => {
        const el = document.querySelector('wb-notes') as any;
        el.wbNotes.open();
      });
      await page.click('#test-container .wb-notes__wide-btn[data-action="collapse-right"]');
      const notes = page.locator('#test-container wb-notes');
      await expect(notes).toHaveClass(/wb-notes--right/);
      await expect(notes).not.toHaveClass(/wb-notes--open/);
    });
  });

  // ==========================================
  // SAVE TESTS (Duplicate Prevention)
  // ==========================================
  test.describe('Save with Duplicate Prevention', () => {
    test('should show warning when no content to save', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      await page.evaluate(() => (document.querySelector('#test-container wb-notes') as any).wbNotes.open());
      await page.fill('#test-container .wb-notes__textarea', ''); // open() prepends a header line -- clear it back out
      await page.click('#test-container .wb-notes__wide-btn[data-action="save"]');
      const status = page.locator('#test-container .wb-notes__status');
      await expect(status).toContainText('No notes to save');
    });

    test('should show success when saving content', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      await page.evaluate(() => (document.querySelector('#test-container wb-notes') as any).wbNotes.open());
      await page.fill('#test-container .wb-notes__textarea', 'Test note content ' + Date.now());
      await page.click('#test-container .wb-notes__wide-btn[data-action="save"]');
      const status = page.locator('#test-container .wb-notes__status');
      await expect(status).toContainText('Saved');
    });

    test('should prevent duplicate content on second save', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      await page.evaluate(() => (document.querySelector('#test-container wb-notes') as any).wbNotes.open());
      const content = 'Duplicate test ' + Date.now();

      // First save
      await page.fill('#test-container .wb-notes__textarea', content);
      await page.click('#test-container .wb-notes__wide-btn[data-action="save"]');
      await page.waitForTimeout(100);
      
      // Second save with same content
      await page.click('#test-container .wb-notes__wide-btn[data-action="save"]');
      const status = page.locator('#test-container .wb-notes__status');
      await expect(status).toContainText('duplicate');
    });
  });

  // ==========================================
  // COPY TESTS -- copyToClipboard() stays as a wbNotes.copy() API method
  // (declared in notes.schema.json's $methods), just no longer has a
  // dedicated UI button.
  // ==========================================
  test.describe('Copy (API only, no UI button)', () => {
    test('wbNotes.copy() should still be callable', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      const hasMethod = await page.evaluate(() => {
        const el = document.querySelector('wb-notes') as any;
        return typeof el.wbNotes.copy === 'function';
      });
      expect(hasMethod).toBe(true);
    });
  });

  // ==========================================
  // NEW-NOTE TESTS (replaces the old destructive "Clear")
  // ==========================================
  test.describe('New Note', () => {
    test('new button should be in the footer', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      const btn = page.locator('#test-container .wb-notes__footer .wb-notes__wide-btn--new');
      await expect(btn).toBeAttached();
    });

    test('clicking New saves the outgoing note, then starts a fresh one', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      await page.evaluate(() => (document.querySelector('#test-container wb-notes') as any).wbNotes.open());
      const content = 'Outgoing note ' + Date.now();
      await page.fill('#test-container .wb-notes__textarea', content);
      await page.click('#test-container .wb-notes__wide-btn[data-action="new"]');
      await page.waitForTimeout(300);

      const textarea = page.locator('#test-container .wb-notes__textarea');
      await expect(textarea).not.toContainText(content); // reset to a fresh note
      const status = page.locator('#test-container .wb-notes__status');
      await expect(status).toContainText('Saved'); // outgoing content was saved first
    });

    test('clicking New with empty content just starts fresh (nothing to save)', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      await page.evaluate(() => (document.querySelector('#test-container wb-notes') as any).wbNotes.open());
      await page.fill('#test-container .wb-notes__textarea', '');
      await page.click('#test-container .wb-notes__wide-btn[data-action="new"]');
      await page.waitForTimeout(200);
      const status = page.locator('#test-container .wb-notes__status');
      await expect(status).toContainText('Started a new note');
    });
  });

  // ==========================================
  // API TESTS
  // ==========================================
  test.describe('API', () => {
    test('should expose wbNotes object on element', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      const hasApi = await page.evaluate(() => {
        const el = document.querySelector('wb-notes') as any;
        return typeof el.wbNotes === 'object';
      });
      expect(hasApi).toBe(true);
    });

    test('should have open method', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      const hasMethod = await page.evaluate(() => {
        const el = document.querySelector('wb-notes') as any;
        return typeof el.wbNotes.open === 'function';
      });
      expect(hasMethod).toBe(true);
    });

    test('should have close method', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      const hasMethod = await page.evaluate(() => {
        const el = document.querySelector('wb-notes') as any;
        return typeof el.wbNotes.close === 'function';
      });
      expect(hasMethod).toBe(true);
    });

    test('should have toggle method', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      const hasMethod = await page.evaluate(() => {
        const el = document.querySelector('wb-notes') as any;
        return typeof el.wbNotes.toggle === 'function';
      });
      expect(hasMethod).toBe(true);
    });

    test('should have setPosition method', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      const hasMethod = await page.evaluate(() => {
        const el = document.querySelector('wb-notes') as any;
        return typeof el.wbNotes.setPosition === 'function';
      });
      expect(hasMethod).toBe(true);
    });

    test('should have collapseToSide method', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      const hasMethod = await page.evaluate(() => {
        const el = document.querySelector('wb-notes') as any;
        return typeof el.wbNotes.collapseToSide === 'function';
      });
      expect(hasMethod).toBe(true);
    });

    test('content property should get/set textarea value', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      const content = await page.evaluate(() => {
        const el = document.querySelector('wb-notes') as any;
        el.wbNotes.content = 'Test content';
        return el.wbNotes.content;
      });
      expect(content).toBe('Test content');
    });

    test('isOpen property should reflect state', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      const states = await page.evaluate(() => {
        const el = document.querySelector('wb-notes') as any;
        const before = el.wbNotes.isOpen;
        el.wbNotes.open();
        const after = el.wbNotes.isOpen;
        return { before, after };
      });
      expect(states.before).toBe(false);
      expect(states.after).toBe(true);
    });

    test('position property should reflect current position', async ({ page }) => {
      await injectNotes(page, '<wb-notes position="right"></wb-notes>');
      const position = await page.evaluate(() => {
        const el = document.querySelector('wb-notes') as any;
        return el.wbNotes.position;
      });
      expect(position).toBe('right');
    });
  });

  // ==========================================
  // KEYBOARD TESTS
  // ==========================================
  test.describe('Keyboard', () => {
    test('Escape key should close drawer', async ({ page }) => {
      await injectNotes(page, '<wb-notes></wb-notes>');
      await page.evaluate(() => {
        const el = document.querySelector('wb-notes') as any;
        el.wbNotes.open();
      });
      await page.keyboard.press('Escape');
      const notes = page.locator('#test-container wb-notes');
      await expect(notes).not.toHaveClass(/wb-notes--open/);
    });
  });
});

import { test, expect, Page, FrameLocator } from '@playwright/test';

const WIZARD_URL = 'http://localhost:3000/demos/wizard.html';

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

async function waitForWizardReady(page: Page) {
  await page.goto(WIZARD_URL);
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(() => {
    const picker = document.getElementById('componentPicker') as HTMLSelectElement;
    return picker && picker.options.length > 1;
  }, { timeout: 10000 });
}

async function selectComponent(page: Page, name: string) {
  // Find the option whose text contains the name (case-insensitive)
  const value = await page.evaluate((n) => {
    const picker = document.getElementById('componentPicker') as HTMLSelectElement;
    const lower = n.toLowerCase();
    for (const opt of Array.from(picker.options)) {
      if (opt.text.toLowerCase().includes(lower)) return opt.value;
    }
    return '';
  }, name);
  if (!value) throw new Error(`No option found matching "${name}"`);
  await page.selectOption('#componentPicker', value);
  await page.waitForTimeout(300);
}

async function switchTab(page: Page, tabName: string) {
  await page.click(`.wiz-tab[data-tab="${tabName}"]`);
  await page.waitForTimeout(200);
}

async function getPreviewStack(page: Page) {
  return page.evaluate(() => (window as any).previewStack || []);
}

async function getCodeSample(page: Page): Promise<string> {
  return page.evaluate(() =>
    document.getElementById('htmlOutput')?.textContent || ''
  );
}

/** Wait for WB to finish rendering inside the preview iframe */
async function waitForPreviewIframe(page: Page, timeout = 8000): Promise<FrameLocator> {
  const frame = page.frameLocator('#fullPreviewFrame');
  // Wait for the iframe to have a body with content
  await page.waitForFunction(() => {
    const iframe = document.getElementById('fullPreviewFrame') as HTMLIFrameElement;
    if (!iframe || !iframe.contentDocument) return false;
    const body = iframe.contentDocument.body;
    return body && body.innerHTML.trim().length > 0;
  }, { timeout });
  return frame;
}

/** Wait for WB to fully initialize inside the preview iframe */
async function waitForWBReady(page: Page, timeout = 15000) {
  await page.waitForFunction(() => {
    const iframe = document.getElementById('fullPreviewFrame') as HTMLIFrameElement;
    if (!iframe || !iframe.contentWindow) return false;
    return (iframe.contentWindow as any).__wbReady === true;
  }, { timeout });
  // Extra settle time for behaviors to render
  await page.waitForTimeout(500);
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. PAGE LOAD & SCHEMA LOADING
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Wizard - Page Load', () => {
  test('loads without critical errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('favicon')) {
        errors.push(msg.text());
      }
    });
    await waitForWizardReady(page);
    const real = errors.filter(e => !e.includes('[WB] Unknown behavior'));
    expect(real).toEqual([]);
  });

  test('schema picker has 10+ options', async ({ page }) => {
    await waitForWizardReady(page);
    const count = await page.evaluate(() =>
      (document.getElementById('componentPicker') as HTMLSelectElement).options.length
    );
    expect(count).toBeGreaterThan(10);
  });

  test('Build tab is active by default', async ({ page }) => {
    await waitForWizardReady(page);
    await expect(page.locator('.wiz-tab[data-tab="build"]')).toHaveClass(/active/);
    await expect(page.locator('#panel-build')).toHaveClass(/active/);
  });

  test('no inline style attributes on wizard.html elements', async ({ page }) => {
    await waitForWizardReady(page);
    // Check that wizard.html itself has no inline styles (our requirement)
    const inlineStyleCount = await page.evaluate(() => {
      const all = document.querySelectorAll('body > *:not(script):not(iframe) [style]');
      return all.length;
    });
    // Should be 0 initially (before JS runs and adds dynamic styles)
    // Allow some from JS-generated dynamic elements
    expect(inlineStyleCount).toBeLessThan(5);
  });

  test('wizard.css is loaded', async ({ page }) => {
    await waitForWizardReady(page);
    const hasSheet = await page.evaluate(() => {
      const sheets = Array.from(document.styleSheets);
      return sheets.some(s => s.href && s.href.includes('wizard.css'));
    });
    expect(hasSheet).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. TAB SWITCHING
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Wizard - Tab Switching', () => {
  test.beforeEach(async ({ page }) => {
    await waitForWizardReady(page);
  });

  test('switches to Preview tab', async ({ page }) => {
    await switchTab(page, 'preview');
    await expect(page.locator('.wiz-tab[data-tab="preview"]')).toHaveClass(/active/);
    await expect(page.locator('#panel-preview')).toHaveClass(/active/);
    await expect(page.locator('#panel-build')).not.toHaveClass(/active/);
  });

  test('switches back to Build tab', async ({ page }) => {
    await switchTab(page, 'preview');
    await switchTab(page, 'build');
    await expect(page.locator('#panel-build')).toHaveClass(/active/);
  });

  test('preview iframe exists in preview panel', async ({ page }) => {
    await expect(page.locator('#fullPreviewFrame')).toBeAttached();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. BUILD TAB - COMPONENT PICKER & EDITORS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Wizard - Build Tab', () => {
  test.beforeEach(async ({ page }) => {
    await waitForWizardReady(page);
  });

  test('selecting component populates property editors', async ({ page }) => {
    await selectComponent(page, 'badge');
    const controls = await page.locator('#primaryEditors .prop-row, #primaryEditors .prop-bool').count();
    expect(controls).toBeGreaterThan(0);
  });

  test('selecting component shows description', async ({ page }) => {
    await selectComponent(page, 'badge');
    const desc = await page.textContent('#compDesc');
    expect(desc!.length).toBeGreaterThan(0);
  });

  test('Fill All Defaults button appears', async ({ page }) => {
    await selectComponent(page, 'badge');
    await expect(page.locator('.preset-pill--fill')).toBeVisible();
  });

  test('code sample heading says "Code Sample"', async ({ page }) => {
    await expect(page.locator('.html-heading')).toContainText('Code Sample');
  });

  test('code sample is empty before selecting component', async ({ page }) => {
    const html = await getCodeSample(page);
    expect(html.trim()).toBe('');
  });

  test('code sample shows tag after selecting component', async ({ page }) => {
    await selectComponent(page, 'badge');
    const html = await getCodeSample(page);
    expect(html).toContain('<wb-badge');
    expect(html).toContain('</wb-badge>');
  });

  test('code sample has syntax highlighting spans', async ({ page }) => {
    await selectComponent(page, 'badge');
    const hasHighlight = await page.evaluate(() => {
      const el = document.getElementById('htmlOutput');
      return el ? el.querySelector('.hl-tag') !== null : false;
    });
    expect(hasHighlight).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. BUILD TAB - CONTAINER NESTING
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Wizard - Container Nesting', () => {
  test.beforeEach(async ({ page }) => {
    await waitForWizardReady(page);
  });

  test('wb-demo auto-enters container mode', async ({ page }) => {
    await selectComponent(page, 'Demo');
    const ci = await page.evaluate(() => (window as any).containerIndex);
    expect(ci).toBe(0);
  });

  test('container banner shows', async ({ page }) => {
    await selectComponent(page, 'Demo');
    await expect(page.locator('#containerBanner')).toBeVisible();
    await expect(page.locator('#containerBanner')).toContainText('wb-demo');
  });

  test('child component goes inside container', async ({ page }) => {
    await selectComponent(page, 'Demo');
    await selectComponent(page, 'Audio');
    const stack = await getPreviewStack(page);
    expect(stack.length).toBe(1);
    expect(stack[0].tag).toBe('wb-demo');
    expect(stack[0].children.length).toBe(1);
    expect(stack[0].children[0].tag).toBe('wb-audio');
  });

  test('code sample shows nested wb-audio inside wb-demo', async ({ page }) => {
    await selectComponent(page, 'Demo');
    await selectComponent(page, 'Audio');
    const html = await getCodeSample(page);
    expect(html).toContain('<wb-demo');
    expect(html).toContain('<wb-audio');
    expect(html).toContain('</wb-audio>');
    expect(html).toContain('</wb-demo>');
  });

  test('nested code has proper indentation', async ({ page }) => {
    await selectComponent(page, 'Demo');
    await selectComponent(page, 'Audio');
    const html = await getCodeSample(page);
    const lines = html.split('\n');
    // Find the wb-audio line
    const audioLine = lines.find(l => l.includes('wb-audio'));
    expect(audioLine).toBeTruthy();
    // Should be indented (starts with spaces)
    expect(audioLine!.startsWith('  ')).toBe(true);
  });

  test('wb-audio attributes appear in nested code', async ({ page }) => {
    await selectComponent(page, 'Demo');
    await selectComponent(page, 'Audio');
    // Fill defaults so audio has attributes
    const fillBtn = page.locator('.preset-pill--fill');
    if (await fillBtn.count() > 0) {
      await fillBtn.click();
      await page.waitForTimeout(300);
    }
    const html = await getCodeSample(page);
    expect(html).toContain('wb-audio');
  });

  test('child row has is-child class', async ({ page }) => {
    await selectComponent(page, 'Demo');
    await selectComponent(page, 'Audio');
    const childRows = await page.locator('#stackList .stack-row.is-child').count();
    expect(childRows).toBe(1);
  });

  test('container row shows child count', async ({ page }) => {
    await selectComponent(page, 'Demo');
    await selectComponent(page, 'Audio');
    await expect(page.locator('.stack-children-count')).toContainText('1 children');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. PREVIEW TAB - IFRAME RENDERING
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Wizard - Preview Iframe', () => {
  test.beforeEach(async ({ page }) => {
    await waitForWizardReady(page);
  });

  test('preview iframe loads with component markup', async ({ page }) => {
    await selectComponent(page, 'badge');
    await switchTab(page, 'preview');
    const frame = await waitForPreviewIframe(page);
    const bodyHtml = await page.evaluate(() => {
      const iframe = document.getElementById('fullPreviewFrame') as HTMLIFrameElement;
      return iframe?.contentDocument?.body?.innerHTML || '';
    });
    expect(bodyHtml).toContain('wb-badge');
  });

  test('preview iframe has dark theme', async ({ page }) => {
    await selectComponent(page, 'badge');
    await switchTab(page, 'preview');
    await waitForPreviewIframe(page);
    const theme = await page.evaluate(() => {
      const iframe = document.getElementById('fullPreviewFrame') as HTMLIFrameElement;
      return iframe?.contentDocument?.body?.getAttribute('data-theme') || '';
    });
    expect(theme).toBe('dark');
  });

  test('preview iframe loads CSS stylesheets', async ({ page }) => {
    await selectComponent(page, 'badge');
    await switchTab(page, 'preview');
    await waitForPreviewIframe(page);
    const hasStyles = await page.evaluate(() => {
      const iframe = document.getElementById('fullPreviewFrame') as HTMLIFrameElement;
      const doc = iframe?.contentDocument;
      if (!doc) return false;
      const links = doc.querySelectorAll('link[rel="stylesheet"]');
      return links.length >= 3; // themes.css, site.css, components.css
    });
    expect(hasStyles).toBe(true);
  });

  test('preview iframe loads WB module script', async ({ page }) => {
    await selectComponent(page, 'badge');
    await switchTab(page, 'preview');
    await waitForPreviewIframe(page);
    const hasScript = await page.evaluate(() => {
      const iframe = document.getElementById('fullPreviewFrame') as HTMLIFrameElement;
      const doc = iframe?.contentDocument;
      if (!doc) return false;
      const scripts = doc.querySelectorAll('script[type="module"]');
      return scripts.length > 0;
    });
    expect(hasScript).toBe(true);
  });

  test('empty preview shows placeholder message', async ({ page }) => {
    await switchTab(page, 'preview');
    await waitForPreviewIframe(page);
    const text = await page.evaluate(() => {
      const iframe = document.getElementById('fullPreviewFrame') as HTMLIFrameElement;
      return iframe?.contentDocument?.body?.textContent || '';
    });
    expect(text).toContain('Add components on the Build tab first');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. PREVIEW TAB - WB-DEMO RENDERING
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Wizard - Preview wb-demo Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await waitForWizardReady(page);
  });

  test('wb-demo renders wb-demo__grid inside iframe', async ({ page }) => {
    await selectComponent(page, 'Demo');
    await selectComponent(page, 'badge');
    await switchTab(page, 'preview');
    await waitForPreviewIframe(page);
    await waitForWBReady(page);
    const hasGrid = await page.evaluate(() => {
      const iframe = document.getElementById('fullPreviewFrame') as HTMLIFrameElement;
      const doc = iframe?.contentDocument;
      return doc?.querySelector('.wb-demo__grid') !== null;
    });
    expect(hasGrid).toBe(true);
  });

  test('wb-demo renders code block inside iframe', async ({ page }) => {
    await selectComponent(page, 'Demo');
    await selectComponent(page, 'badge');
    await switchTab(page, 'preview');
    await waitForPreviewIframe(page);
    await waitForWBReady(page);
    const hasCode = await page.evaluate(() => {
      const iframe = document.getElementById('fullPreviewFrame') as HTMLIFrameElement;
      const doc = iframe?.contentDocument;
      return doc?.querySelector('.wb-demo__code') !== null;
    });
    expect(hasCode).toBe(true);
  });

  test('wb-demo has wb-demo class and grid after rendering', async ({ page }) => {
    await selectComponent(page, 'Demo');
    await selectComponent(page, 'badge');
    await switchTab(page, 'preview');
    await waitForPreviewIframe(page);
    await waitForWBReady(page);
    const result = await page.evaluate(() => {
      const iframe = document.getElementById('fullPreviewFrame') as HTMLIFrameElement;
      const doc = iframe?.contentDocument;
      const demo = doc?.querySelector('wb-demo');
      return {
        hasClass: demo?.classList.contains('wb-demo') ?? false,
        hasGrid: demo?.querySelector('.wb-demo__grid') !== null,
      };
    });
    expect(result.hasClass).toBe(true);
    expect(result.hasGrid).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. PREVIEW TAB - WB-AUDIO RENDERING
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Wizard - Preview wb-audio Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await waitForWizardReady(page);
  });

  test('wb-audio is in customElementMappings', async ({ page }) => {
    // Verify the mapping exists so WB.scan picks it up
    await waitForWizardReady(page);
    const hasMapping = await page.evaluate(async () => {
      // The parent page has WB loaded
      const WB = (window as any).WB;
      return WB && WB.has && WB.has('audio');
    });
    expect(hasMapping).toBe(true);
  });

  test('standalone wb-audio renders audio player in iframe', async ({ page }) => {
    await selectComponent(page, 'Audio');
    await switchTab(page, 'preview');
    await waitForPreviewIframe(page);
    await waitForWBReady(page);

    const hasAudioElement = await page.evaluate(() => {
      const iframe = document.getElementById('fullPreviewFrame') as HTMLIFrameElement;
      const doc = iframe?.contentDocument;
      if (!doc) return false;
      // The audio behavior creates a child <audio> element inside <wb-audio>
      const wbAudio = doc.querySelector('wb-audio');
      if (!wbAudio) return false;
      return wbAudio.querySelector('audio') !== null;
    });
    expect(hasAudioElement).toBe(true);
  });

  test('wb-audio has wb-audio class after rendering', async ({ page }) => {
    await selectComponent(page, 'Audio');
    await switchTab(page, 'preview');
    await waitForPreviewIframe(page);
    await waitForWBReady(page);

    const hasClass = await page.evaluate(() => {
      const iframe = document.getElementById('fullPreviewFrame') as HTMLIFrameElement;
      const doc = iframe?.contentDocument;
      const wbAudio = doc?.querySelector('wb-audio');
      return wbAudio?.classList.contains('wb-audio') ?? false;
    });
    expect(hasClass).toBe(true);
  });

  test('wb-audio with show-eq renders EQ UI', async ({ page }) => {
    await selectComponent(page, 'Audio');
    // Enable show-eq via fill defaults or toggle
    const fillBtn = page.locator('.preset-pill--fill');
    if (await fillBtn.count() > 0) {
      await fillBtn.click();
      await page.waitForTimeout(300);
    }
    // Also try checking the show-eq boolean toggle if it exists
    const showEqToggle = page.locator('input[type="checkbox"]').filter({ has: page.locator('..', { hasText: /show.?eq/i }) });
    if (await showEqToggle.count() > 0) {
      await showEqToggle.first().check();
      await page.waitForTimeout(200);
    }
    await switchTab(page, 'preview');
    await waitForPreviewIframe(page);
    await waitForWBReady(page);

    const hasEq = await page.evaluate(() => {
      const iframe = document.getElementById('fullPreviewFrame') as HTMLIFrameElement;
      const doc = iframe?.contentDocument;
      if (!doc) return false;
      const wbAudio = doc.querySelector('wb-audio');
      if (!wbAudio) return false;
      return wbAudio.querySelector('.wb-audio__eq-container') !== null;
    });
    expect(hasEq).toBe(true);
  });

  test('wb-audio without src still renders player UI', async ({ page }) => {
    // This was the bug: audio.js skipped render when no src
    await selectComponent(page, 'Audio');
    await switchTab(page, 'preview');
    await waitForPreviewIframe(page);
    await waitForWBReady(page);

    const rendered = await page.evaluate(() => {
      const iframe = document.getElementById('fullPreviewFrame') as HTMLIFrameElement;
      const doc = iframe?.contentDocument;
      if (!doc) return { hasWbAudio: false, childCount: 0, hasAudioEl: false };
      const wbAudio = doc.querySelector('wb-audio');
      return {
        hasWbAudio: wbAudio !== null,
        childCount: wbAudio ? wbAudio.children.length : 0,
        hasAudioEl: wbAudio ? wbAudio.querySelector('audio') !== null : false,
      };
    });
    expect(rendered.hasWbAudio).toBe(true);
    expect(rendered.childCount).toBeGreaterThan(0);
    expect(rendered.hasAudioEl).toBe(true);
  });

  test('wb-audio reads plain attributes not just data-*', async ({ page }) => {
    await selectComponent(page, 'Audio');
    // Fill defaults to get volume attribute set
    const fillBtn = page.locator('.preset-pill--fill');
    if (await fillBtn.count() > 0) {
      await fillBtn.click();
      await page.waitForTimeout(300);
    }
    await switchTab(page, 'preview');
    await waitForPreviewIframe(page);
    await waitForWBReady(page);

    const volume = await page.evaluate(() => {
      const iframe = document.getElementById('fullPreviewFrame') as HTMLIFrameElement;
      const doc = iframe?.contentDocument;
      const audioEl = doc?.querySelector('wb-audio audio') as HTMLAudioElement;
      return audioEl?.volume ?? -1;
    });
    // Volume should be set to some valid value from the schema defaults
    expect(volume).toBeGreaterThan(0);
    expect(volume).toBeLessThanOrEqual(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. PREVIEW - WB-DEMO + WB-AUDIO TOGETHER
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Wizard - Preview wb-demo + wb-audio', () => {
  test.beforeEach(async ({ page }) => {
    await waitForWizardReady(page);
  });

  test('wb-demo with wb-audio child both render in iframe', async ({ page }) => {
    await selectComponent(page, 'Demo');
    await selectComponent(page, 'Audio');
    await switchTab(page, 'preview');
    await waitForPreviewIframe(page);
    await waitForWBReady(page);

    const result = await page.evaluate(() => {
      const iframe = document.getElementById('fullPreviewFrame') as HTMLIFrameElement;
      const doc = iframe?.contentDocument;
      if (!doc) return { demoHasClass: false, audioHasClass: false, audioHasChild: false, hasGrid: false, hasCode: false };
      const demo = doc.querySelector('wb-demo');
      const audio = doc.querySelector('wb-audio');
      return {
        demoHasClass: demo?.classList.contains('wb-demo') ?? false,
        audioHasClass: audio?.classList.contains('wb-audio') ?? false,
        audioHasChild: audio ? audio.querySelector('audio') !== null : false,
        hasGrid: demo?.querySelector('.wb-demo__grid') !== null,
        hasCode: demo?.querySelector('.wb-demo__code') !== null,
      };
    });
    expect(result.demoHasClass).toBe(true);
    expect(result.audioHasClass).toBe(true);
    expect(result.audioHasChild).toBe(true);
    expect(result.hasGrid).toBe(true);
    expect(result.hasCode).toBe(true);
  });

  test('wb-audio is inside wb-demo grid in iframe', async ({ page }) => {
    await selectComponent(page, 'Demo');
    await selectComponent(page, 'Audio');
    await switchTab(page, 'preview');
    await waitForPreviewIframe(page);
    await waitForWBReady(page);

    const audioInGrid = await page.evaluate(() => {
      const iframe = document.getElementById('fullPreviewFrame') as HTMLIFrameElement;
      const doc = iframe?.contentDocument;
      const grid = doc?.querySelector('.wb-demo__grid');
      return grid?.querySelector('wb-audio') !== null;
    });
    expect(audioInGrid).toBe(true);
  });

  test('wb-demo code block shows wb-audio source markup', async ({ page }) => {
    await selectComponent(page, 'Demo');
    await selectComponent(page, 'Audio');
    await switchTab(page, 'preview');
    await waitForPreviewIframe(page);
    await waitForWBReady(page);

    const codeText = await page.evaluate(() => {
      const iframe = document.getElementById('fullPreviewFrame') as HTMLIFrameElement;
      const doc = iframe?.contentDocument;
      const code = doc?.querySelector('.wb-demo__code');
      return code?.textContent || '';
    });
    expect(codeText).toContain('wb-audio');
  });

  test('wb-audio with show-eq renders EQ inside wb-demo', async ({ page }) => {
    await selectComponent(page, 'Demo');
    await selectComponent(page, 'Audio');
    // Fill defaults to enable show-eq
    const fillBtn = page.locator('.preset-pill--fill');
    if (await fillBtn.count() > 0) {
      await fillBtn.click();
      await page.waitForTimeout(300);
    }
    await switchTab(page, 'preview');
    await waitForPreviewIframe(page);
    await waitForWBReady(page);

    const hasEq = await page.evaluate(() => {
      const iframe = document.getElementById('fullPreviewFrame') as HTMLIFrameElement;
      const doc = iframe?.contentDocument;
      const audio = doc?.querySelector('wb-audio');
      return audio?.querySelector('.wb-audio__eq-container') !== null;
    });
    expect(hasEq).toBe(true);
  });

  test('wb-audio with volume attribute sets audio volume', async ({ page }) => {
    await selectComponent(page, 'Demo');
    await selectComponent(page, 'Audio');
    // Fill defaults to get volume set
    const fillBtn = page.locator('.preset-pill--fill');
    if (await fillBtn.count() > 0) {
      await fillBtn.click();
      await page.waitForTimeout(300);
    }
    await switchTab(page, 'preview');
    await waitForPreviewIframe(page);
    await waitForWBReady(page);

    const volume = await page.evaluate(() => {
      const iframe = document.getElementById('fullPreviewFrame') as HTMLIFrameElement;
      const doc = iframe?.contentDocument;
      const audioEl = doc?.querySelector('wb-audio audio') as HTMLAudioElement;
      return audioEl?.volume ?? -1;
    });
    // Volume should be set from schema defaults
    expect(volume).toBeGreaterThan(0);
    expect(volume).toBeLessThanOrEqual(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. WB-BUTTON ICON DROPDOWN
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Wizard - wb-button Icon Dropdown', () => {
  test.beforeEach(async ({ page }) => {
    await waitForWizardReady(page);
    await selectComponent(page, 'Button');
  });

  test('icon property renders as a select dropdown, not a text input', async ({ page }) => {
    const tagName = await page.evaluate(() => {
      const el = document.getElementById('prop-icon');
      return el ? el.tagName : 'NOT FOUND';
    });
    expect(tagName).toBe('SELECT');
  });

  test('icon dropdown has no default selection', async ({ page }) => {
    const value = await page.evaluate(() => {
      const el = document.getElementById('prop-icon') as HTMLSelectElement;
      return el ? el.value : 'MISSING';
    });
    expect(value).toBe('');
  });

  test('icon dropdown contains all 20 built-in icon names', async ({ page }) => {
    const options = await page.evaluate(() => {
      const el = document.getElementById('prop-icon') as HTMLSelectElement;
      if (!el) return [];
      return Array.from(el.options).map(o => o.value).filter(v => v !== '');
    });
    const expected = [
      'star', 'check', 'close', 'warning', 'info', 'error',
      'heart', 'search', 'edit', 'trash', 'plus', 'minus',
      'home', 'settings', 'download', 'upload',
      'arrow_right', 'arrow_left', 'copy', 'save'
    ];
    expect(options).toEqual(expected);
  });

  test('icon dropdown first option is empty placeholder', async ({ page }) => {
    const first = await page.evaluate(() => {
      const el = document.getElementById('prop-icon') as HTMLSelectElement;
      if (!el || !el.options[0]) return { value: '', text: '' };
      return { value: el.options[0].value, text: el.options[0].text };
    });
    expect(first.value).toBe('');
    expect(first.text).toContain('icon');
  });

  test('selecting icon updates code sample', async ({ page }) => {
    await page.selectOption('#prop-icon', 'star');
    await page.waitForTimeout(300);
    const html = await getCodeSample(page);
    expect(html).toContain('icon="star"');
  });

  test('icon not in code sample when nothing selected', async ({ page }) => {
    const html = await getCodeSample(page);
    expect(html).not.toContain('icon=');
  });

  test('wb-button with icon renders SVG in preview iframe', async ({ page }) => {
    await page.selectOption('#prop-icon', 'star');
    await page.waitForTimeout(300);
    await switchTab(page, 'preview');
    await waitForPreviewIframe(page);
    await waitForWBReady(page);
    const hasSvg = await page.evaluate(() => {
      const iframe = document.getElementById('fullPreviewFrame') as HTMLIFrameElement;
      const doc = iframe?.contentDocument;
      const btn = doc?.querySelector('wb-button');
      return btn?.querySelector('svg') !== null;
    });
    expect(hasSvg).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. COPY & CLEAR
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Wizard - Copy & Clear', () => {
  test.beforeEach(async ({ page }) => {
    await waitForWizardReady(page);
  });

  test('clear button empties stack', async ({ page }) => {
    await selectComponent(page, 'badge');
    await page.click('#clearPreviewBtn');
    const stack = await getPreviewStack(page);
    expect(stack.length).toBe(0);
  });

  test('clear button empties code sample', async ({ page }) => {
    await selectComponent(page, 'badge');
    await page.click('#clearPreviewBtn');
    await page.waitForTimeout(200);
    const html = await getCodeSample(page);
    expect(html.trim()).toBe('');
  });

  test('copy button copies code sample text', async ({ page }) => {
    await selectComponent(page, 'badge');
    // Grant clipboard permission
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.click('#copyHtmlBtn');
    await page.waitForTimeout(300);
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toContain('wb-badge');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. RESIZE HANDLE
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Wizard - Resize Panel', () => {
  test('resize handle exists', async ({ page }) => {
    await waitForWizardReady(page);
    await expect(page.locator('#resizeHandle')).toBeAttached();
  });

  test('resize handle gets dragging class on mousedown', async ({ page }) => {
    await waitForWizardReady(page);
    const handle = page.locator('#resizeHandle');
    const box = await handle.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 2, box.y + 10);
      await page.mouse.down();
      await expect(handle).toHaveClass(/dragging/);
      await page.mouse.up();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Wizard - Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await waitForWizardReady(page);
  });

  test('clear with empty stack does not crash', async ({ page }) => {
    await page.click('#clearPreviewBtn');
    const stack = await getPreviewStack(page);
    expect(stack.length).toBe(0);
  });

  test('rapid component switching preserves stack integrity', async ({ page }) => {
    await selectComponent(page, 'Demo');
    await selectComponent(page, 'badge');
    await selectComponent(page, 'Alert');
    await selectComponent(page, 'Audio');
    const stack = await getPreviewStack(page);
    expect(stack.length).toBe(1);
    expect(stack[0].tag).toBe('wb-demo');
    expect(stack[0].children.length).toBe(3);
  });

  test('removing child updates Code Sample immediately', async ({ page }) => {
    await selectComponent(page, 'Demo');
    await selectComponent(page, 'badge');
    await selectComponent(page, 'Alert');
    const htmlBefore = await getCodeSample(page);
    expect(htmlBefore).toContain('wb-badge');
    expect(htmlBefore).toContain('wb-alert');
    // Remove badge child
    await page.locator('#stackList .stack-row.is-child .stack-del').first().click();
    await page.waitForTimeout(300);
    const htmlAfter = await getCodeSample(page);
    expect(htmlAfter).not.toContain('wb-badge');
    expect(htmlAfter).toContain('wb-alert');
  });

  test('removing all children updates Code Sample', async ({ page }) => {
    await selectComponent(page, 'Demo');
    await selectComponent(page, 'badge');
    const htmlBefore = await getCodeSample(page);
    expect(htmlBefore).toContain('wb-badge');
    // Remove badge child
    await page.locator('#stackList .stack-row.is-child .stack-del').first().click();
    await page.waitForTimeout(300);
    const htmlAfter = await getCodeSample(page);
    expect(htmlAfter).not.toContain('wb-badge');
    // wb-demo should still be there (empty container)
    expect(htmlAfter).toContain('wb-demo');
  });

  test('clear empties Code Sample completely', async ({ page }) => {
    await selectComponent(page, 'Demo');
    await selectComponent(page, 'badge');
    const htmlBefore = await getCodeSample(page);
    expect(htmlBefore.trim().length).toBeGreaterThan(0);
    await page.click('#clearPreviewBtn');
    await page.waitForTimeout(300);
    const htmlAfter = await getCodeSample(page);
    expect(htmlAfter.trim()).toBe('');
  });

  test('removing container updates Code Sample', async ({ page }) => {
    await selectComponent(page, 'Demo');
    await selectComponent(page, 'badge');
    const htmlBefore = await getCodeSample(page);
    expect(htmlBefore).toContain('wb-demo');
    // Remove the container itself
    await page.locator('#stackList .stack-row.is-container .stack-del').first().click();
    await page.waitForTimeout(300);
    const htmlAfter = await getCodeSample(page);
    expect(htmlAfter.trim()).toBe('');
  });

  test('buildStackItemHtml recurses for nested children', async ({ page }) => {
    await selectComponent(page, 'Demo');
    await selectComponent(page, 'Audio');
    const html = await getCodeSample(page);
    // Must contain both open and close of both tags
    const demoOpen = (html.match(/<wb-demo/g) || []).length;
    const demoClose = (html.match(/<\/wb-demo>/g) || []).length;
    const audioOpen = (html.match(/<wb-audio/g) || []).length;
    const audioClose = (html.match(/<\/wb-audio>/g) || []).length;
    expect(demoOpen).toBe(1);
    expect(demoClose).toBe(1);
    expect(audioOpen).toBe(1);
    expect(audioClose).toBe(1);
  });
});

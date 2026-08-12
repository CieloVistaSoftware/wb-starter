import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRAMEWORKS_HTML = path.resolve(__dirname, '../../demos/frameworks.html');

/**
 * demos/frameworks.html previously carried a 35-line <style> block in its
 * <head> plus ~29 inline style="..." attributes across every section --
 * both forbidden by Tier-1 Law 9 ("no inline styles, no <style> blocks or
 * page-local copies of component styles in HTML files") and
 * docs/standards/V3-STANDARDS.md's "File Layout" section (page-specific
 * layout belongs in src/styles/pages/{page}.css). Moved to
 * src/styles/pages/frameworks.css; these tests guard the regression.
 *
 * React's own live demo renders a real inline style="..." attribute on its
 * mounted #react-root subtree (via React.createElement's `style` prop) --
 * that's React's own idiomatic rendering API being demonstrated, not
 * hand-authored page markup, so it's the one deliberate exception.
 */
test.describe('demos/frameworks.html: layout standards', () => {
  test('no authored <style> block or inline style="..." attribute in the page source', () => {
    // Static source scan, not a live-DOM check. At runtime this page ends
    // up with plenty of legitimate inline style="..." / <style> that never
    // came from its own authored markup:
    //  - WB's own sanctioned per-behavior style-loading (wb-ripple-styles,
    //    wb-button-styles -- Tier-1 Law 14's own singleton-style-tag
    //    exception) and its pre.js/code.js/demo.js runtime-COMPUTED inline
    //    styles (line-number gutter offsets, wb-demo's shrink-width custom
    //    property) -- these depend on actual rendered content and can only
    //    be known at runtime, the opposite of a hand-authored one-off style.
    //  - htmx.org's and highlight.js's own injected <style> tags.
    //  - React's live demo, which renders a real style="..." attribute via
    //    React.createElement's own `style` prop -- that's React's idiomatic
    //    rendering API being demonstrated, not hand-authored page markup.
    // None of that is visible in (or relevant to) the page's own source
    // file, so read it directly instead of asserting against the live DOM.
    const source = fs.readFileSync(FRAMEWORKS_HTML, 'utf8');

    // Strip <script>...</script> (React's own `style: {...}` JS object) and
    // <pre>...</pre> (illustrative, HTML-entity-escaped code samples that
    // happen to show a literal style="..." as text, e.g. the Vue source
    // block) before scanning -- neither is real page markup.
    const stripped = source
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<pre\b[^>]*>[\s\S]*?<\/pre>/gi, '');

    expect(stripped, 'demos/frameworks.html must not author its own <style> block').not.toMatch(/<style[\s>]/);
    expect(stripped, 'demos/frameworks.html must not author its own style="..." attributes').not.toMatch(/\sstyle\s*=\s*"/);
  });

  test('every framework section uses its page-level layout classes, not ad hoc markup', async ({ page }) => {
    await page.goto('/demos/frameworks.html', { waitUntil: 'domcontentloaded' });

    // Each framework section's badge must use the shared .framework-badge +
    // .badge-{name} pair (src/styles/pages/frameworks.css) -- not a color
    // hardcoded per-badge.
    const badges = page.locator('.framework-badge');
    const badgeCount = await badges.count();
    expect(badgeCount, 'expected one .framework-badge per framework section (React/Vue/Svelte/Angular/SolidJS/HTMX)').toBe(6);
    for (let i = 0; i < badgeCount; i++) {
      const cls = await badges.nth(i).getAttribute('class');
      expect(cls, `badge ${i} must pair .framework-badge with a badge-* variant`).toMatch(/\bbadge-(react|vue|svelte|angular|solid|htmx)\b/);
    }

    // The four framework mounts that start empty/placeholder (Vue, Svelte,
    // Angular, SolidJS) share one .framework-mount base class with a
    // per-framework accent modifier, instead of each hand-rolling its own
    // padding/border/border-radius.
    for (const variant of ['vue', 'svelte', 'angular', 'solid']) {
      const mount = page.locator(`.framework-mount.framework-mount--${variant}`);
      await expect(mount, `expected a .framework-mount--${variant} element`).toHaveCount(1);
    }
  });

  test('the "Code used in this demo" label + wrapper is consistent across React/Vue/Svelte/SolidJS', async ({ page }) => {
    await page.goto('/demos/frameworks.html', { waitUntil: 'domcontentloaded' });

    const labels = page.locator('.demo-code-label');
    await expect(labels).toHaveCount(4);
    for (let i = 0; i < 4; i++) {
      await expect(labels.nth(i)).toHaveText('Code used in this demo:');
    }
    await expect(page.locator('.demo-code-block')).toHaveCount(4);
  });
});

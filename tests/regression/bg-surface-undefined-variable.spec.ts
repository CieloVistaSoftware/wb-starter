import { test, expect } from '@playwright/test';

/**
 * `--bg-surface` never existed anywhere in src/styles/themes.css (grep
 * confirmed 0 definitions), but was used as a fallback in 4 places across
 * 3 behavior CSS files -- every one of those `var(--x, var(--bg-surface,
 * #ffffff))` chains silently bottomed out at the literal white fallback
 * in EVERY theme, including dark. Live symptom: "why do the two drawer
 * demos render only in white?" -- demos/site/overlays.html's x-drawer
 * panels rendered solid white regardless of the page's dark theme.
 * Fixed by pointing at --bg-primary, the real theme-defined variable
 * every other overlay panel already uses.
 */

test('demos/site/overlays.html: [x-drawer] panel uses a real theme background, not the dead --bg-surface white fallback', async ({ page }) => {
  await page.goto('/demos/site/overlays.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 20000 });
  await page.waitForTimeout(1000);

  const trigger = page.locator('[x-drawer]').first();
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();

  const panel = page.locator('.x-drawer__panel--open');
  await expect(panel).toBeVisible({ timeout: 5000 });
  const bg = await panel.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg, 'drawer panel must not fall back to literal white').not.toBe('rgb(255, 255, 255)');
});

test('no CSS file references the nonexistent --bg-surface variable', async ({}) => {
  // Shell `grep` isn't reliably available via execSync in this environment
  // (confirmed: "'grep' is not recognized" on this Windows dev box) -- a
  // caught non-zero exit was being misread as "no matches found" instead
  // of "grep itself failed to run," making the original version of this
  // test a silent false-pass that never actually scanned anything. Walk
  // the files directly in Node instead, matching the pattern every other
  // CSS-source compliance test in this repo already uses (e.g.
  // demo-container-spacing.spec.ts).
  const fs = await import('fs');
  const path = await import('path');

  const STYLES_DIR = path.resolve(process.cwd(), 'src/styles');
  const offenders: string[] = [];

  function walk(dir: string): void {
    let entries: import('fs').Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(abs);
      } else if (entry.name.endsWith('.css')) {
        // Strip comments first -- the fix commits for this exact bug left
        // explanatory comments mentioning "--bg-surface" by name (to
        // document why it was removed), which a naive substring check
        // flags as if the dead variable were still actually used.
        const content = fs.readFileSync(abs, 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '');
        if (content.includes('--bg-surface')) {
          offenders.push(path.relative(process.cwd(), abs));
        }
      }
    }
  }

  walk(STYLES_DIR);
  expect(offenders, `files still referencing the dead --bg-surface variable:\n${offenders.join('\n')}`).toEqual([]);
});

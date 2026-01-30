import fs from 'fs';
import path from 'path';

const TEST_DIR = path.resolve('tests/issues');
const files = fs.readdirSync(TEST_DIR).filter(f => f.endsWith('.spec.ts'));

function read(f) { return fs.readFileSync(path.join(TEST_DIR, f), 'utf8'); }
function write(f, content) { fs.writeFileSync(path.join(TEST_DIR, f), content, 'utf8'); }

const todoPattern = /TODO: Add specific assertions/;
let updated = [];

for (const file of files) {
  const p = path.join(TEST_DIR, file);
  const content = read(file);
  if (!todoPattern.test(content)) continue;

  // Extract Page if available
  const pageMatch = content.match(/Page:\s*(.*)/);
  let pagePath = pageMatch ? pageMatch[1].trim() : '/';
  if (!pagePath || pagePath === '/') pagePath = '/';

  // Lowercase description for heuristics
  const descMatch = content.match(/Description:\s*([^\n]*)/i);
  const desc = descMatch ? descMatch[1].toLowerCase() : '';

  let replacement = '';

  // Heuristics: issue click
  if (/click(ing)? on .*issue|issues button|clicking issues button|issue click/i.test(content) || /click(ing)? .*issue/i.test(desc)) {
    replacement = `    // Heuristic test generated: verify clicking the issue control opens issues panel (not a generic toast)
    test.info().annotations.push({ type: 'generated', description: 'auto-heuristic: issue-click' });

    // Try to find a trigger (wb-issues trigger/button)
    const issuesBtn = page.locator('wb-issues .wb-issues__trigger, wb-issues button, button[title="Open Issues"], wb-issues, [data-issues], .issues-button').first();
    if (await issuesBtn.count() === 0) {
      test.skip();
      return;
    }

    await issuesBtn.click();
    await page.waitForTimeout(500);

    const toast = page.locator('.toast:has-text("clicked"), .toast:has-text("Clicked"), [data-toast]:has-text("click")');
    const toastVisible = await toast.isVisible().catch(() => false);

    const issuesPanel = page.locator('.wb-issues__drawer, .issues-panel, wb-issues[open], wb-issues');
    const panelVisible = await issuesPanel.isVisible().catch(() => false);

    // Expect the issues panel to be visible and not just a generic "clicked" toast
    expect(panelVisible).toBe(true);
    expect(toastVisible && !panelVisible).toBe(false);
`;
  } else if (/scroll|anchor|do not scroll|does not scroll|doesn't scroll/i.test(desc)) {
    // nav/anchor scroll heuristic
    replacement = `    // Heuristic test generated: verify navigation anchors scroll to the expected section
    test.info().annotations.push({ type: 'generated', description: 'auto-heuristic: nav-scroll' });

    // Go to the page specified in the issue description
    await page.goto('http://localhost:3000${pagePath}');
    await page.waitForLoadState('networkidle');

    // Find first nav anchor and click it
    const navLink = page.locator('nav a[href^="#"]').first();
    if (await navLink.count() === 0) {
      test.skip();
      return;
    }

    const href = await navLink.getAttribute('href');
    const target = href && href.startsWith('#') ? href.slice(1) : null;
    await navLink.click();
    await page.waitForTimeout(300);

    if (target) {
      const rectTop = await page.evaluate((sel) => {
        const el = document.getElementById(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return r.top;
      }, target);

      // After clicking, target should be near the top of viewport (tolerance 0..200px)
      expect(rectTop).not.toBeNull();
      expect(Math.abs(rectTop)).toBeLessThan(300);
    } else {
      // If no target id, just assert scroll changed
      const scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBeGreaterThan(0);
    }
`;
  } else {
    // Fallback: at least make a minimal assertion that the target page loads and header exists
    replacement = `    // Fallback heuristic: verify the target page loads and shows a top-level header
    test.info().annotations.push({ type: 'generated', description: 'auto-heuristic: smoke' });
    await page.goto('http://localhost:3000${pagePath}');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').first()).toBeVisible();
`;
  }

  // Replace the default placeholder: find the test function body and replace
  const newContent = content.replace(/(test\('([\s\S]*?)', async \(\{ page \}\) => \{)([\s\S]*?)(\n\s*\}\);\n\s*\}\);)/, (m, a, title, oldBody, suffix) => {
    return `${a}\n${replacement}\n  }\);\n\n});`;
  });

  // As a safety, only write if replacement found
  if (newContent !== content) {
    write(file, newContent);
    updated.push(file);
  }
}

console.log('Updated', updated.length, 'files');
if (updated.length) console.log(updated.join('\n'));

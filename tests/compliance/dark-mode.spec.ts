/**
 * Dark Mode Compliance Tests
 * Verifies all HTML pages render correctly in dark mode
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find all HTML files in project
function findHtmlFiles(dir: string, files: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    // Skip node_modules, .git, data, etc. -- .claude/worktrees holds full
    // checkouts for OTHER agent sessions; without excluding it this walked
    // into every one of them and re-rendered their entire HTML surface a
    // second (third, fourth...) time -- hundreds of duplicate page loads,
    // 21+ minutes for a "fast subset" compliance run (confirmed live).
    if (entry.isDirectory()) {
      if (!['node_modules', '.git', '.claude', 'x-overlay-ext', 'data', 'test-results', 'tmp'].includes(entry.name)) {
        findHtmlFiles(fullPath, files);
      }
    } else if (entry.name.endsWith('.html')) {
      // Exclude tests that intentionally error
      if (!entry.name.includes('legacy-syntax-check.html')) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

const projectRoot = path.resolve(__dirname, '../..');
const htmlFiles = findHtmlFiles(projectRoot);

// Convert to relative paths for cleaner test names
const relativeHtmlFiles = htmlFiles.map(f => path.relative(projectRoot, f).replace(/\\/g, '/'));

// Known issues to skip (not dark mode related)
const knownWarnings = [
  '[WB:card] Invalid container tag',  // Custom element warning, not dark mode issue
  'Failed to load docs manifest',      // Network issue, not dark mode
  'Failed to fetch manifest',          // Network issue
  'Failed to load data',              // Dashboard JSON loading, not dark mode
  '[Demo] Failed',                    // Demo module loading, not dark mode
];

// Pages that redirect/navigate destroying execution context
const SKIP_DARK_MODE = [

  'pages/themes.html',                     // Heavy JS with page transitions
  'demos/card.html',                       // Redirects during init
  'demos/wb-views-demo.html',              // Missing module import
  'public/performance-dashboard.html',     // Fetches JSON that may not exist
];

// #546: pages/issues.html (and its template copy) call the unauthenticated
// GitHub REST API (60 requests/hour per source IP) to list live issues.
// GitHub Actions runners share IP ranges with countless other unauthenticated
// callers and can start a job already near/at that limit, well before this
// page ever loads -- there's no way to attach a token client-side on a
// static site. When that happens, the request comes back 403 and Chromium's
// own network layer logs "Failed to load resource: the server responded
// with a status of 403 ()" to the console regardless of how gracefully
// issues.html's own try/catch handles the response (that message is emitted
// by the browser for the failed resource load itself, not by application
// code, so there is no app-level fix that suppresses it). That makes this an
// inherent CI-environment limitation rather than a real bug -- scoped to
// just the page(s) that make this call so a genuine 403 elsewhere still
// fails the test.
const GITHUB_API_PAGES = ['pages/issues.html'];

test.describe('Dark Mode Compliance', () => {

  for (const htmlFile of relativeHtmlFiles) {
    // Skip pages known to redirect/navigate and destroy context
    if (SKIP_DARK_MODE.some(skip => htmlFile.includes(skip))) continue;

    test(`${htmlFile} renders in dark mode without errors`, async ({ page }) => {
      // Set dark mode before navigation
      await page.emulateMedia({ colorScheme: 'dark' });

      // Collect console errors
      const errors: string[] = [];
      const isGithubApiPage = GITHUB_API_PAGES.some(p => htmlFile.endsWith(p));
      page.on('console', msg => {
        if (msg.type() === 'error') {
          const text = msg.text();
          // Skip known warnings that aren't dark-mode related
          const isKnownWarning = knownWarnings.some(w => text.includes(w));
          // Skip GitHub API rate-limit 403s on the pages that call it (#546)
          const isGithubRateLimit = isGithubApiPage && text.includes('403');
          if (!isKnownWarning && !isGithubRateLimit) {
            errors.push(text);
          }
        }
      });
      
      // Navigate to the page
      const url = `/${htmlFile}`;
      const response = await page.goto(url);
      
      // Page should load
      expect(response?.status()).toBeLessThan(400);
      
      // Wait for navigation to settle (some pages redirect)
      await page.waitForLoadState('domcontentloaded').catch(() => {});
      await page.waitForTimeout(500);
      
      // Set dark theme attribute (may fail if page navigated away)
      try {
        await page.evaluate(() => {
          document.documentElement.setAttribute('data-theme', 'dark');
        });
      } catch (e) {
        // Page navigated — re-wait and retry
        await page.waitForLoadState('domcontentloaded').catch(() => {});
        await page.waitForTimeout(300);
        await page.evaluate(() => {
          document.documentElement.setAttribute('data-theme', 'dark');
        }).catch(() => {});
      }
      
      await page.waitForTimeout(300);
      
      // Check for elements with missing/broken colors
      const colorIssues = await page.evaluate(() => {
        const issues: string[] = [];
        const elements = document.querySelectorAll('*');
        
        elements.forEach(el => {
          const styles = getComputedStyle(el);
          const color = styles.color;
          const bg = styles.backgroundColor;
          
          // Check for white text on white background (invisible)
          if (color === 'rgb(255, 255, 255)' && bg === 'rgb(255, 255, 255)') {
            issues.push(`Invisible text (white on white): ${el.tagName}${el.id ? '#' + el.id : ''}`);
          }
          
          // Check for black text on black background (invisible)
          if (color === 'rgb(0, 0, 0)' && bg === 'rgb(0, 0, 0)') {
            issues.push(`Invisible text (black on black): ${el.tagName}${el.id ? '#' + el.id : ''}`);
          }
        });
        
        return issues.slice(0, 10); // Limit to first 10 issues
      });
      
      // Report color issues as warnings but don't fail
      if (colorIssues.length > 0) {
        console.warn(`⚠️ ${htmlFile} has potential dark mode issues:\n  ${colorIssues.join('\n  ')}`);
      }
      
      // Filter for critical errors only
      const criticalErrors = errors.filter(e => 
        !e.includes('favicon') && 
        !e.includes('404') &&
        !e.includes('net::ERR') &&
        !e.includes('Cannot read properties of null')  // Skip init errors for pages without #app
      );
      
      expect(criticalErrors, `JS errors in ${htmlFile}:\n${criticalErrors.join('\n')}`).toEqual([]);
    });
  }
  
  // #547: this used to be ONE test that looped over all main pages
  // internally, sharing a single 30s test timeout across ~20 sequential
  // page.goto() calls. Under full-suite parallel load, cumulative per-page
  // latency blew that shared budget and the whole test timed out (not an
  // assertion failure -- a hang). Splitting into one test() per page,
  // matching the "renders in dark mode without errors" pattern above,
  // gives every page its own full timeout AND lets Playwright's worker
  // parallelism run them concurrently instead of serially -- removing the
  // cumulative-budget failure mode instead of just raising the timeout on
  // top of it.
  const mainSitePages = relativeHtmlFiles.filter(f =>
    (f.startsWith('pages/') || f === 'index.html') &&
    !SKIP_DARK_MODE.some(skip => f.includes(skip))
  );

  // #863: every one of these tests asserted nothing. A missing data-theme
  // produced a console.warn and a PASS, and the bare catch swallowed navigation
  // failures into a second console.warn and a PASS -- so this loop reported
  // every main page as themed whether it was, whether it 404'd, or whether it
  // failed to load at all. It is the exact shape #863 was opened for.
  //
  // Now asserted: the page must load, and site-engine must have stamped
  // data-theme on <html> by the time it settles. Measured when turned on: all
  // main pages pass.
  for (const htmlFile of mainSitePages) {
    test(`${htmlFile} has data-theme attribute`, async ({ page }) => {
      const response = await page.goto(`/${htmlFile}`);
      expect(
        response?.status(),
        `/${htmlFile} did not load (status ${response?.status()})`,
      ).toBeLessThan(400);

      await page.waitForTimeout(300);

      // Poll rather than snapshot once: site-engine stamps the attribute during
      // init, and under full-suite worker load that can land after a fixed
      // wait. A fixed wait here would be flaky in exactly one direction --
      // reporting a themed page as unthemed.
      await expect
        .poll(
          () => page.evaluate(() => document.documentElement.hasAttribute('data-theme')),
          {
            message:
              `${htmlFile}: <html> has no data-theme attribute. Main pages must `
              + 'be themed by site-engine on load; without it the page renders '
              + 'against whatever the browser default happens to be.',
            timeout: 5000,
          },
        )
        .toBe(true);
    });
  }
  
  test('theme variables are defined in dark mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    
    // Ensure dark mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    
    await page.waitForTimeout(100);
    
    // Check critical theme variables exist
    const variables = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      return {
        bgColor: root.getPropertyValue('--bg-color').trim(),
        textPrimary: root.getPropertyValue('--text-primary').trim(),
        primary: root.getPropertyValue('--primary').trim(),
      };
    });
    
    expect(variables.bgColor, '--bg-color should be defined').not.toBe('');
    expect(variables.textPrimary, '--text-primary should be defined').not.toBe('');
    expect(variables.primary, '--primary should be defined').not.toBe('');
  });
  
  test('dark mode has dark background colors', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    
    // Set dark mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    
    await page.waitForTimeout(100);
    
    // Check background is actually dark
    const bgColor = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      return root.getPropertyValue('--bg-color').trim();
    });
    
    // Dark backgrounds should not be white or very light
    expect(bgColor).not.toBe('#ffffff');
    expect(bgColor).not.toBe('white');
    expect(bgColor).not.toBe('rgb(255, 255, 255)');
  });

});

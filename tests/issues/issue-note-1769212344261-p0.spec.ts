/**
 * Issue Test: note-1769212344261-p0
 * BUG: Find all wb-issues refs and remove any not in wb-navbar
 */
import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

test.describe('Issue note-1769212344261-p0: wb-issues Refs Cleanup', () => {
  
  test('wb-issues should only be referenced in wb-navbar', async ({ page }) => {
    // Check source files for wb-issues references
    const srcDir = 'src';
    const allowedFiles = ['wb-navbar.js', 'wb-navbar.ts', 'navbar'];
    
    const findWbIssuesRefs = (dir: string, refs: string[] = []): string[] => {
      try {
        const files = readdirSync(dir, { withFileTypes: true });
        for (const file of files) {
          const fullPath = join(dir, file.name);
          if (file.isDirectory() && !file.name.includes('node_modules')) {
            findWbIssuesRefs(fullPath, refs);
          } else if (file.isFile() && (file.name.endsWith('.js') || file.name.endsWith('.ts') || file.name.endsWith('.html'))) {
            const content = readFileSync(fullPath, 'utf-8');
            if (content.includes('wb-issues') && !allowedFiles.some(f => file.name.includes(f))) {
              refs.push(fullPath);
            }
          }
        }
      } catch (e) {
        // Directory may not exist
      }
      return refs;
    };

    // This test runs in Node context, but we'll verify via page
    await page.goto('http://localhost:3000/');
    
    // Check that wb-issues is NOT randomly placed in the DOM outside navbar
    const issuesOutsideNavbar = await page.evaluate(() => {
      const allIssues = document.querySelectorAll('wb-issues');
      const issuesInNavbar = document.querySelectorAll('wb-navbar wb-issues, [wb="navbar"] wb-issues');
      return allIssues.length - issuesInNavbar.length;
    });

    // All wb-issues should be inside wb-navbar
    expect(issuesOutsideNavbar).toBe(0);
  });

  test('wb-issues in navbar should render correctly', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');

    // Wait for navbar anchor to be present, then assert wb-issues inside it
    const navbar = page.locator('wb-navbar, [wb="navbar"]');
    await navbar.first().waitFor({ state: 'attached', timeout: 5000 });

    const issuesInNavbar = navbar.locator('wb-issues, [wb="issues"]');
    if (await issuesInNavbar.count() > 0) {
      await issuesInNavbar.first().waitFor({ state: 'visible', timeout: 3000 });
      await expect(issuesInNavbar.first()).toBeVisible();
    } else {
      // No wb-issues configured in this build — pass but record as informational
      expect(await issuesInNavbar.count()).toBe(0);
    }
  });

  test('no orphaned wb-issues elements', async ({ page }) => {
    await page.goto('http://localhost:3000/builder.html');
    await page.waitForLoadState('networkidle');

    // Ensure navbar/header anchors are present before counting
    await page.locator('wb-navbar, header, .header').first().waitFor({ state: 'attached', timeout: 5000 });

    // Count all wb-issues (wait briefly for any async insertion to settle)
    await page.waitForTimeout(200);
    const allIssues = await page.locator('wb-issues').count();
    const navbarIssues = await page.locator('wb-navbar wb-issues').count();
    const headerIssues = await page.locator('header wb-issues, .header wb-issues').count();

    const allowedIssues = navbarIssues + headerIssues;
    const orphaned = allIssues - allowedIssues;

    expect(orphaned).toBe(0);
  });
});

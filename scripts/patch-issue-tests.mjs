import fs from 'fs';
import path from 'path';

const TEST_DIR = path.resolve('tests/issues');
const files = fs.readdirSync(TEST_DIR).filter(f => f.endsWith('.spec.ts'));
let patched = [];

for (const file of files) {
  const filePath = path.join(TEST_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  if (content.includes('auto-heuristic: issue-click')) {
    // Ensure navigation to pagePath if a Page is present in comment
    const pageMatch = content.match(/Page:\s*(.*)/);
    const pagePath = pageMatch ? pageMatch[1].trim() : '/';
    const gotoStr = `await page.goto('http://localhost:3000${pagePath}');\n    await page.waitForLoadState('networkidle');`;

    // If the test body doesn't already navigate to the target pagePath, insert after annotations push
    if (pagePath && pagePath !== '/' && !content.includes(`http://localhost:3000${pagePath}`)) {
      content = content.replace(/(test.info\(\)\.annotations\.push\([\s\S]*?\);)/, `$1\n    ${gotoStr}`);
      changed = true;
    }

    // Add an explicit waitForSelector for the issues trigger
    if (!content.includes("waitForSelector('wb-issues .wb-issues__trigger")) {
      content = content.replace(/(const issuesBtn = page\.locator\([\s\S]*?\)\.first\(\);)/, `$1\n    await page.waitForSelector('wb-issues .wb-issues__trigger, wb-issues button, button[title="Open Issues"], [data-issues], .issues-button', { timeout: 2500 }).catch(() => null);`);
      changed = true;
    }
  }

  if (content.includes('auto-heuristic: nav-scroll')) {
    const pageMatch = content.match(/goto\('http:\/\/localhost:3000([^']*)'\)/);
    if (!pageMatch) {
      // Insert navigation using Page: comment
      const pageMatch2 = content.match(/Page:\s*(.*)/);
      const pagePath = pageMatch2 ? pageMatch2[1].trim() : '/';
      const navGoto = `await page.goto('http://localhost:3000${pagePath}');\n    await page.waitForLoadState('networkidle');`;
      content = content.replace(/(test.info\(\)\.annotations\.push\([\s\S]*?\);)/, `$1\n    ${navGoto}`);
      changed = true;
    }

    if (!content.includes("await page.waitForSelector('nav a[href^=\"#\"]'")) {
      content = content.replace(/(const navLink = page\.locator\('[\s\S]*?'\)\.first\(\);)/, `$1\n    await page.waitForSelector('nav a[href^="#"]', { timeout: 2500 }).catch(() => null);`);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    patched.push(file);
  }
}

console.log('Patched', patched.length, 'files');
if (patched.length) console.log(patched.join('\n'));

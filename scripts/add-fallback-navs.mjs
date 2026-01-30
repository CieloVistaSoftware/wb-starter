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
    if (content.includes('test.skip();\n      return;')) {
      content = content.replace(/if \(await issuesBtn.count\(\) === 0\) \{[\s\S]*?test\.skip\(\)\;[\s\S]*?\}\n\n    await issuesBtn.click\(\);/,
`if (await issuesBtn.count() === 0) {
      // Attempt fallback pages where an issues control may exist
      const FALLBACKS = ['/?page=behaviors','/builder.html','/'];
      let _found = false;
      for (const p of FALLBACKS) {
        await page.goto('http://localhost:3000' + p);
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('wb-issues .wb-issues__trigger, wb-issues button, button[title="Open Issues"], [data-issues], .issues-button', { timeout: 1000 }).catch(() => null);
        if (await page.locator('wb-issues .wb-issues__trigger, wb-issues button, button[title="Open Issues"], [data-issues], .issues-button').count() > 0) {
          _found = true;
          break;
        }
      }
      if (!_found) {
        test.skip();
        return;
      }
    }

    await issuesBtn.click();`);
      changed = true;
    }
  }

  if (content.includes('auto-heuristic: nav-scroll')) {
    if (content.includes('if (await navLink.count() === 0)')) {
      content = content.replace(/if \(await navLink.count\(\) === 0\) \{[\s\S]*?test\.skip\(\)\;[\s\S]*?\}\n\n    const href = await navLink.getAttribute\('href'\);/,
`if (await navLink.count() === 0) {
      // Try fallback to behaviors page and retry
      const FALLBACKS = ['/?page=behaviors','/builder.html','/'];
      let _found = false;
      for (const p of FALLBACKS) {
        await page.goto('http://localhost:3000' + p);
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('nav a[href^="#"]', { timeout: 1000 }).catch(() => null);
        if (await page.locator('nav a[href^="#"]').count() > 0) {
          _found = true;
          break;
        }
      }
      if (!_found) {
        test.skip();
        return;
      }

      // Re-query nav link after fallback navigation
      navLink = page.locator('nav a[href^="#"]').first();
    }

    const href = await navLink.getAttribute('href');`);
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

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * COMPLIANCE GATE (#214): in the behaviors showcase, code examples must put each
 * `<span x-kbd>` on its own line for readability — never several crammed on one
 * line. Scoped to ```html example fences (the live prose can keep keys inline).
 */
const FILE = path.join(process.cwd(), 'demos', 'behaviors-showcase.html');

test('keyboard-key examples put each <span x-kbd> on its own line (#214)', () => {
  const lines = fs.readFileSync(FILE, 'utf8').split('\n');
  let inHtmlFence = false;
  const offenders: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (/^\s*```html\b/.test(ln)) { inHtmlFence = true; continue; }
    if (/^\s*```\s*$/.test(ln)) { inHtmlFence = false; continue; }
    if (!inHtmlFence) continue;
    const count = (ln.match(/<span\s+x-kbd\b/g) || []).length;
    if (count > 1) offenders.push(`  L${i + 1}: ${ln.trim().slice(0, 90)}`);
  }

  expect(
    offenders,
    `Keyboard-key example crams multiple <span x-kbd> on one line — put each on its own line:\n${offenders.join('\n')}`
  ).toEqual([]);
});

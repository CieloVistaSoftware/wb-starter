import { test, expect } from '../fixtures/offline';
import { readJson, DATA_FILES } from '../base';

test.describe('Fix Registry Data Integrity', () => {
  const data = readJson<any>(DATA_FILES.fixes);
  
  // #1861: data/fixes.json is the table traced from git (scripts/lib/fixes.mjs),
  // written by the stamp workflow, one row per issue. The 13 hand-written
  // entries (id, title, problem, fix) it replaced are gone, so these are the
  // fields the Fix Viewer reads from a row: the issue, its title, its state, and
  // the commits that fixed it. (fix-data-integrity.spec.ts checks the rest of
  // the shape and that the file is regenerated.)
  const fixes: any[] = Array.isArray(data?.rows) ? data.rows : [];
  const REQUIRED_FIELDS = ['number', 'title', 'state', 'commits'];

  test('fixes.json exists and is valid', () => {
    expect(data, 'fixes.json should be parseable').toBeTruthy();
    expect(fixes.length, 'fixes.json should have entries').toBeGreaterThan(0);

    const incomplete: string[] = [];
    for (const fix of fixes) {
      const label = fix.number ? `#${fix.number}` : 'unknown';
      const missing = REQUIRED_FIELDS.filter(f => !fix[f]);
      if (missing.length > 0) incomplete.push(`${label}: missing ${missing.join(', ')}`);
    }
    expect(
      incomplete,
      `Every fix entry must carry ${REQUIRED_FIELDS.join(', ')}:\n${incomplete.join('\n')}`,
    ).toEqual([]);
  });
});

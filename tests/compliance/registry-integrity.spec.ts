import { test, expect } from '@playwright/test';
import { readJson, DATA_FILES } from '../base';

test.describe('Fix Registry Data Integrity', () => {
  const data = readJson<any>(DATA_FILES.fixes);
  
  // Support both old format (fixes as object with errorId) and new format (fixes as array with id)
  const fixes: any[] = data?.fixes
    ? (Array.isArray(data.fixes) ? data.fixes : Object.values(data.fixes))
    : [];

  // #863: this file used to also generate one `Fix <id> should have lastTested
  // date` test per entry, guarded by `fixes.filter(f => f.lastTested)`. That
  // filter has been empty for as long as the current format has existed -- none
  // of the entries carry `lastTested`, so the loop produced ZERO tests and the
  // whole date check was unreachable code enforcing a field the format no
  // longer has. Deleted rather than resurrected: re-adding `lastTested` to
  // every entry is a data decision, not a test one.
  //
  // What replaces it is a check of the shape the registry ACTUALLY has, so the
  // "Data Integrity" in this describe's title means something: the file parses,
  // is non-empty, and every entry carries the fields the fix registry is read
  // for. Measured at the time of this change: 13/13 entries complete.
  const REQUIRED_FIELDS = ['id', 'title', 'problem', 'fix'];

  test('fixes.json exists and is valid', () => {
    expect(data, 'fixes.json should be parseable').toBeTruthy();
    expect(fixes.length, 'fixes.json should have entries').toBeGreaterThan(0);

    const incomplete: string[] = [];
    for (const fix of fixes) {
      const label = fix.errorId || fix.id || 'unknown';
      const missing = REQUIRED_FIELDS.filter(f => !fix[f]);
      if (missing.length > 0) incomplete.push(`${label}: missing ${missing.join(', ')}`);
    }
    expect(
      incomplete,
      `Every fix entry must carry ${REQUIRED_FIELDS.join(', ')}:\n${incomplete.join('\n')}`,
    ).toEqual([]);
  });
});

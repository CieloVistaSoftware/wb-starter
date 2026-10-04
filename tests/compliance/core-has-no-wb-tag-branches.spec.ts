import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * #1170: 4.0.0 removed every wb- tag, but the schema builder kept a lookup
 * table keyed by wb- tag names and two branches that only ran for a tag
 * starting with wb-. No markup can reach them, so they were dead code that
 * read as live to anyone tracing how a schema reaches an element.
 *
 * Code lines only: comments may still explain the history.
 */
const DEAD_FORMS: Array<[string, RegExp]> = [
  ['branches on a wb- tag name', /startsWith\(\s*['"]wb-['"]\s*\)/],
  ['builds a wb- name in a template literal', /`wb-\$\{/],
  ['builds a wb- name by concatenation', /['"]wb-['"]\s*\+/],
];

function codeFiles(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) codeFiles(p, out);
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}

// #1422: the same leftovers lived in src/wb-viewmodels -- an uppercase
// tagName test (startsWith('WB-')) and a regex that harvested wb- tags from
// demo source -- so both directories are scanned, for both spellings.
DEAD_FORMS.push(
  ['branches on an uppercase WB- tagName', /startsWith\(\s*['"]WB-['"]\s*\)/],
  ['matches a wb- tag with a regex', /\/<wb-/],
);

// #1068: the third spelling -- an exact tagName comparison
// (tagName === 'WB-MODAL', tagName !== 'WB-BUTTON'). wb.js processSchema
// carried eleven of them, plus button, dialog and collapse.
DEAD_FORMS.push(
  ['compares tagName to a WB- tag', /tagName\s*[!=]==?\s*['"]WB-/i],
);

for (const dir of ['src/core', 'src/wb-viewmodels']) {
  test(`${dir} has no branch or key for a wb- tag (#1170, #1422)`, () => {
    const files = codeFiles(path.join(process.cwd(), ...dir.split('/')));
    expect(files.length, `the scan found ${dir}`).toBeGreaterThan(20);
    const hits: string[] = [];
    for (const file of files) {
      fs.readFileSync(file, 'utf8').split(/\r?\n/).forEach((line, i) => {
        if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
        for (const [what, re] of DEAD_FORMS) {
          if (re.test(line)) hits.push(`${path.relative(process.cwd(), file).split(path.sep).join('/')}:${i + 1} ${what}`);
        }
      });
    }
    expect(hits, `dead wb- tag handling in ${dir}`).toEqual([]);
  });
}

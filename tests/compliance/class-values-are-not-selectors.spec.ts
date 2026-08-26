import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * A class NAME is never a class SELECTOR.
 *
 * `classList.add('x-card')` adds a class. `'.x-card'` and `'[x-card]'` are
 * ways of MATCHING that class. They are trivially different to a person and
 * indistinguishable to a search-and-replace, which is why every prefix
 * migration in this project has produced at least one of them:
 *
 *   classList.add('wb-card')  ->  classList.add('.wb-card')     203 sites
 *   tip.className = `wb-tooltip …`  ->  `[x-tooltip] …`         #858
 *   `${isActive ? 'wb-tabs__tab--active' : ''}`  ->  `[x-tabs]__…`  #859
 *
 * Every one is SILENT. `.x-card` and `[x-tabs]__tab--active` are perfectly
 * legal class-attribute values -- they simply match no rule ever written, so
 * the element renders unstyled with nothing thrown and nothing logged. The
 * tooltip one shipped a raw unstyled line into document flow on hover; the
 * tabs one made the active tab look exactly like an inactive one.
 *
 * Static, no browser: it reads source. A runtime test cannot catch this
 * reliably because the failure is "an element looks wrong", which is only
 * detectable if some assertion happens to check that exact computed style.
 */

const ROOT = process.cwd();
const SKIP = new Set(['node_modules', '.git', 'out', 'dist', '.claude', 'vendor', 'lib', 'test-results']);

/**
 * A class-valued expression containing selector punctuation.
 *
 * Deliberately anchored to the ASSIGNMENT, not to the string: a bare
 * `'.x-card'` elsewhere in a file is usually a real selector for
 * querySelector, and flagging those would make this gate noise.
 */
const OFFENDERS = [
  { name: 'classList call', re: /classList\.(?:add|remove|toggle|contains|replace)\(([^)]*)\)/g },
  { name: 'className assignment', re: /className\s*=\s*([^;\n]+)/g },
  { name: 'setAttribute("class")', re: /setAttribute\(\s*['"]class['"]\s*,([^)]*)\)/g },
];

/** Selector punctuation that must never appear inside a class VALUE. */
const SELECTOR_SHAPED = /(?:^|[\s'"`])[.[][a-zA-Z[]/;

function walk(dir: string, out: string[] = []): string[] {
  let entries: fs.Dirent[];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(js|mjs|ts)$/.test(e.name)) out.push(p);
  }
  return out;
}

test.describe('class values are never selectors', () => {
  const findings: string[] = [];

  for (const file of walk(path.join(ROOT, 'src'))) {
    let text: string;
    try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }

    const lines = text.split(/\r?\n/);
    lines.forEach((line, i) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;   // prose may describe the bug
      for (const { name, re } of OFFENDERS) {
        re.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = re.exec(line))) {
          if (!SELECTOR_SHAPED.test(m[1])) continue;
          findings.push(
            `${path.relative(ROOT, file).split(path.sep).join('/')}:${i + 1}  ${name}\n`
            + `      ${line.trim().slice(0, 120)}`,
          );
        }
      }
    });
  }

  test('no class name is written as a selector', () => {
    expect(
      findings,
      'A class VALUE contains selector punctuation (a leading "." or "[").\n\n'
      + 'This is always a bug and always silent: the value is a legal class\n'
      + 'attribute, so nothing throws — it just matches no stylesheet rule and\n'
      + 'the element renders unstyled.\n\n'
      + 'Every prefix migration in this project has produced one (#858, #859,\n'
      + 'and 203 sites in the 4.0.0 pass). Write the bare name:\n'
      + '  classList.add("x-card")        not  classList.add(".x-card")\n'
      + '  className = `x-tabs__tab`      not  `[x-tabs]__tab`\n\n'
      + findings.join('\n\n'),
    ).toEqual([]);
  });
});

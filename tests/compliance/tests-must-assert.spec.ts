import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { stripJsComments } from '../../scripts/lib/js-scanner.mjs';

/**
 * A green test must have asserted something.
 *
 * John: "before running tests we need compliance to catch these 48 vacuous
 * passes — tests that were green while asserting nothing."
 *
 * A FAILING test tells you something. A vacuously passing one tells you
 * nothing while looking like success, so it is strictly worse: it occupies the
 * slot where real coverage would have been, and it reports that the thing it
 * never checked is fine.
 *
 * The 48 found in #863 came in three shapes, all of which this catches
 * statically — no browser, no server, so it can run before the suite does:
 *
 *   NO ASSERTION      a test body with no expect() at all. One had only the
 *                     original author's unresolved commentary.
 *
 *   NO NAVIGATION     `all-components.spec.ts` had no goto ANYWHERE. A commit
 *                     stripped `page.goto('/demos/behaviors.html')` when it
 *                     deleted that page and left the 13 test bodies behind, so
 *                     every one ran against about:blank. Every locator matched
 *                     nothing; every guarded assertion was skipped.
 *
 *   GUARDED ASSERTION `if (await x.count() > 0) { expect(...) }`. 41 of the 47
 *                     were this. The guard is indistinguishable from a pass
 *                     when the locator matches nothing — which is exactly what
 *                     happens on a 404 page, and page.goto() does NOT throw on
 *                     a 404.
 *
 * The first two are unambiguous defects and are asserted at zero.
 *
 * The third is baselined rather than banned. A guard is occasionally
 * legitimate (genuinely optional markup), and a gate that cannot be satisfied
 * gets bypassed. So the count may fall and never rise: lower BASELINE when you
 * remove one, never raise it to go green.
 */

const ROOT = process.cwd();
const TESTS = path.join(ROOT, 'tests');

/**
 * Guarded assertions present when this gate was written. Ratchet DOWN only.
 * Raising this to make a build pass is the moment the gate stops meaning
 * anything.
 */
const GUARDED_BASELINE = 400;

function walk(dir: string, out: string[] = []): string[] {
  let entries: fs.Dirent[];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.spec\.ts$/.test(e.name)) out.push(p);
  }
  return out;
}

/** Body of each `test(...)` call, found by brace matching rather than regex. */
function testBodies(raw: string): { title: string; body: string }[] {
  const src = stripJsComments(raw);
  const out: { title: string; body: string }[] = [];
  const re = /\btest(?:\.only|\.fixme)?\s*\(\s*(['"`])([^'"`]*)\1/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    // The body brace, not the destructuring one. `test('x', async ({ page })
    // => {` has TWO braces after the title: `{ page }` comes first, and
    // matching on it captures the parameter list instead of the body -- which
    // reports every well-written test as having no expect(). Anchor to `=>`.
    const arrow = src.indexOf('=>', m.index);
    if (arrow < 0) continue;
    const open = src.indexOf('{', arrow);
    if (open < 0) continue;
    let depth = 0;
    let end = -1;
    for (let i = open; i < src.length; i++) {
      const c = src[i];
      if (c === '{') depth++;
      else if (c === '}') { if (--depth === 0) { end = i; break; } }
      else if (c === "'" || c === '"' || c === '`') {
        const q = c;
        i++;
        while (i < src.length && src[i] !== q) { if (src[i] === '\\') i++; i++; }
      }
    }
    if (end < 0) continue;
    // Slice from the STRIPPED source, not raw: stripJsComments() removes
    // comments rather than blanking them, so lengths differ and raw offsets
    // would be wrong. Slicing the stripped copy is also what we want — an
    // expect() that appears only inside a comment must not count as an
    // assertion.
    out.push({ title: m[2], body: src.slice(open, end) });
  }
  return out;
}

const rel = (f: string) => path.relative(ROOT, f).split(path.sep).join('/');

const noAssertion: string[] = [];
const noNavigation: string[] = [];
let guarded = 0;

for (const file of walk(TESTS)) {
  let src: string;
  try { src = fs.readFileSync(file, 'utf8'); } catch { continue; }

  const bodies = testBodies(src);

  for (const { title, body } of bodies) {
    // test.skip()/fixme bodies are deliberately inert.
    if (/^\s*test\.(skip|fixme)\s*\(/m.test(body)) continue;
    // Also `expect.poll(` / `expect.soft(`. Matching only `expect(` reports
    // every poll-based assertion as missing -- and poll is the CORRECT form
    // for anything that hydrates asynchronously, so the naive pattern
    // penalises exactly the best-written tests.
    if (!/expect\s*[.(]/.test(body)) {
      noAssertion.push(`${rel(file)}  ›  ${title}`);
    }
  }

  // A spec that drives `page` must navigate somewhere. goto may live in a
  // beforeEach or a helper, so this is a whole-file check.
  const usesPage = /\bpage\.(locator|getByRole|getByText|getByTestId|evaluate|click)\b/.test(src);
  // Navigation is often delegated: `setupBehaviorTest(page)` in a beforeEach,
  // imported from a shared helper. Checking only this file's own text reported
  // 22 perfectly good specs as running against about:blank. Follow local
  // imports one level — enough for the helper pattern this suite uses, and it
  // errs toward NOT flagging, which is the right direction for a gate.
  const NAV = /\.goto\s*\(|setContent\s*\(/;
  let navigates = NAV.test(src);
  if (!navigates) {
    for (const im of src.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
      for (const ext of ['', '.ts', '.js', '/index.ts']) {
        try {
          const target = path.resolve(path.dirname(file), im[1] + ext);
          if (NAV.test(fs.readFileSync(target, 'utf8'))) navigates = true;
        } catch { /* not this extension */ }
      }
    }
  }
  if (usesPage && !navigates && bodies.length > 0) {
    noNavigation.push(`${rel(file)}  (${bodies.length} test(s) against about:blank)`);
  }

  guarded += (src.match(/if\s*\(\s*(?:await\s+)?[^)]*\.count\(\)\s*[>!=]/g) || []).length;
}

test.describe('tests must assert', () => {
  test('every test contains at least one expect()', () => {
    expect(
      noAssertion,
      'A test with no expect() cannot fail, so it reports success for something\n'
      + 'it never checked. Either assert the thing the title claims, or delete it.\n\n'
      + noAssertion.join('\n'),
    ).toEqual([]);
  });

  test('every spec that drives a page navigates somewhere', () => {
    expect(
      noNavigation,
      'This spec uses page.locator()/getByRole() but never calls goto() or\n'
      + 'setContent(). Every test in it runs against about:blank, so every\n'
      + 'locator matches nothing and every guarded assertion is skipped.\n\n'
      + 'This is exactly how all-components.spec.ts ran 13 tests green while\n'
      + 'testing nothing: a commit removed the goto and left the bodies (#863).\n\n'
      + noNavigation.join('\n'),
    ).toEqual([]);
  });

  test('guarded assertions do not increase', () => {
    expect(
      guarded,
      `if (await x.count() > 0) { expect(...) } rose to ${guarded}, above the\n`
      + `${GUARDED_BASELINE} ceiling. That shape passes when the locator matches\n`
      + `NOTHING — indistinguishable from a real pass, and what a 404 page\n`
      + `produces, since page.goto() does not throw on one.\n\n`
      + `Prefer asserting the count you expect:\n`
      + `  await expect(x).toHaveCount(3)   then assert on the items\n\n`
      + `This ceiling exists to come down. Lower it when you remove one; never\n`
      + `raise it to go green.`,
    ).toBeLessThanOrEqual(GUARDED_BASELINE);
  });
});

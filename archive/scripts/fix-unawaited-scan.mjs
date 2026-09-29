/**
 * Await every WB.scan() call in the test suite.
 *
 * John: "there is no such thing as flaky, it either works or fails."
 *
 * `scan()` is declared `async` (src/core/wb.js:766) and loads behavior modules
 * dynamically. 103 test call sites fired it and asserted immediately; 66
 * awaited it correctly. The 103 are races, not flakiness:
 *
 *     page.evaluate(() => { ...; WB.scan(el); });   // returns before scan ends
 *     await expect(el).toHaveClass(/x-help/);       // asserts on an un-enhanced node
 *
 * `expect` polls for 5s, which usually hides it -- on a warm, idle machine the
 * module resolves in milliseconds. Under 8 parallel workers the dynamic import
 * can lose that race, the assertion sees `class=""`, and the retry then passes
 * because the second run is warm. That is precisely the shape reported as
 * "flaky": failed once, passed on retry, gate green over a real defect.
 *
 * Two edits per site, because one without the other does not compile:
 *   1. `await` the scan call
 *   2. mark the enclosing callback `async`
 *
 * The callback is found by brace-matching from `page.evaluate(`, not by regex
 * across the whole body -- nested arrow functions inside the callback would
 * otherwise capture the wrong scope.
 */
import fs from 'fs';
import path from 'path';

const APPLY = process.argv.includes('--apply');
const ROOT = process.cwd();
const TESTS = path.join(ROOT, 'tests');

function walk(dir, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.spec\.ts$/.test(e.name)) out.push(p);
  }
  return out;
}

/** Index just past the matching close paren for the `(` at `open`. */
function matchParen(s, open) {
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    const c = s[i];
    if (c === '(') depth++;
    else if (c === ')') { if (--depth === 0) return i; }
    // Skip string and template literals so a paren inside one cannot unbalance us.
    else if (c === "'" || c === '"' || c === '`') {
      const quote = c;
      i++;
      while (i < s.length && s[i] !== quote) { if (s[i] === '\\') i++; i++; }
    }
  }
  return -1;
}

let files = 0, awaited = 0, asyncified = 0;
const changed = [];

for (const file of walk(TESTS)) {
  const raw = fs.readFileSync(file, 'utf8');
  if (!raw.includes('WB.scan(')) continue;

  let s = raw;
  let n = 0;

  // 1. await the scan calls that lack it.
  //
  // ONE pass, not two. A first pass for the cast form followed by a second for
  // the bare form re-matches the first's output -- `await (window as any).WB
  // .scan(` still contains a bare `WB.scan(` -- and yields
  // `await (window as any).await WB.scan(`, a syntax error. The dry run caught
  // that before it reached 155 files.
  //
  // Two lookbehinds make the pass idempotent: `(?<!await )` skips calls that
  // are already awaited, and `(?<![.\w])` stops the bare-form branch from
  // matching the `WB.scan(` that sits inside a receiver it just handled.
  const SCAN = /(?<!await )(?<![.\w])((?:\(\s*window as any\s*\)\s*\.\s*|window\s*\.\s*)?WB\.scan\()/g;
  s = s.replace(SCAN, (whole) => { n++; awaited++; return `await ${whole}`; });

  // 2. Any evaluate/waitForFunction callback now containing `await` must be async.
  for (const fn of ['page.evaluate(', 'page.evaluateHandle(']) {
    let idx = 0;
    while ((idx = s.indexOf(fn, idx)) !== -1) {
      const open = idx + fn.length - 1;
      const close = matchParen(s, open);
      if (close < 0) { idx += fn.length; continue; }

      const body = s.slice(open + 1, close);
      const head = body.slice(0, 40);

      if (/\bawait\b/.test(body) && !/^\s*async\b/.test(head)) {
        // Only the arrow forms `() =>` and `(args) =>`; leave anything else alone.
        const m = /^(\s*)(\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/.exec(body);
        if (m) {
          const replaced = body.replace(m[0], `${m[1]}async ${m[2]} =>`);
          s = s.slice(0, open + 1) + replaced + s.slice(close);
          asyncified++;
          idx = open + 1 + replaced.length;
          continue;
        }
      }
      idx = close;
    }
  }

  if (s !== raw) {
    files++;
    changed.push([path.relative(ROOT, file).split(path.sep).join('/'), n]);
    if (APPLY) {
      const crlf = /\r\n/.test(raw);
      fs.writeFileSync(file, crlf ? s.replace(/(?<!\r)\n/g, '\r\n') : s);
    }
  }
}

console.log(`\n${APPLY ? 'APPLIED' : 'DRY RUN'} — ${awaited} scan call(s) awaited, `
  + `${asyncified} callback(s) made async, across ${files} file(s)\n`);
changed.sort((a, b) => b[1] - a[1]).slice(0, 15)
  .forEach(([f, n]) => console.log(`  ${String(n).padStart(3)}  ${f}`));

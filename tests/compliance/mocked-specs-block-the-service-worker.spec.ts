/**
 * A ROUTE MOCK THAT A SERVICE WORKER ANSWERS FIRST IS NOT A MOCK
 * ==============================================================
 * #1349. src/main.js registers sw.js on every page load, and sw.js answers
 * EVERY GET from a page it controls with its own fetch(). Playwright cannot
 * route a service worker's requests, so page.route() / context.route() is
 * never consulted: the request goes to the real server, the fixture never
 * applies, and the assertions that follow describe live data. No error, no
 * warning, nothing in the report.
 *
 * Measured on main c55145e3: 25 specs intercepted with page.route, ONE of them
 * blocked the worker. The other 24 were measuring the real server.
 *
 * It is worse than a weak test. A mocked test that silently reaches the real
 * server is NON-DETERMINISTIC -- its verdict depends on what the server
 * answered at that moment, which is the signature of the #961 flapping.
 *
 * How it was proved (so nobody has to lose the rounds again): the same route
 * was registered four ways at once -- string glob, RegExp, a url.pathname
 * predicate and a String(url) predicate. None fired, while page.on('request')
 * recorded the request going out and the panel filled with live server data.
 * The failure mode is total and identical for every matcher form.
 *
 * THE FIX, in the spec that mocks:
 *
 *   test.use({ serviceWorkers: 'block' });
 *
 * A spec that genuinely needs the worker (one that tests the worker, or offline
 * cache fallback) opts out with a marker comment carrying a reason:
 *
 *   // wb-service-worker-required: this spec measures sw.js cache fallback
 *
 * This guard is deliberately a STATIC scan, not a runtime check: the runtime
 * symptom is invisible by construction, so the only place it can be caught is
 * in the source. And per #863 it asserts it scanned a plausible number of
 * files before it is allowed to report "all clear" -- a scan that matches
 * nothing must fail loudly, not pass vacuously.
 */
import { test, expect } from '../fixtures/offline';
import { readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TESTS_DIR = path.resolve(HERE, '..');

/** Every *.spec.ts under tests/, absolute, sorted. */
export function specsOnDisk(dir: string = TESTS_DIR): string[] {
  const out: string[] = [];
  const walk = (d: string): void => {
    for (const name of readdirSync(d)) {
      if (name === 'node_modules' || name === 'test-results' || name === 'playwright-report') continue;
      const abs = path.join(d, name);
      if (statSync(abs).isDirectory()) walk(abs);
      else if (name.endsWith('.spec.ts')) out.push(abs);
    }
  };
  walk(dir);
  return out.sort();
}

/**
 * Source with comments removed. A commented-out page.route() is not a mock,
 * and tests/fixtures/offline.ts only ever MENTIONS page.route in prose -- a
 * scanner that matched raw text would have called that file an offender and
 * the first thing anyone would have learned is not to trust this guard.
 *
 * A CHARACTER SCANNER, not two regexes. The regex version -- one pass
 * replacing a lazy block-comment match, then one replacing a line comment
 * guarded against a preceding colon so an http:// URL survived --
 * read a line comment that happens to contain a block-comment opener -- a real
 * line, written while fixing #1349: "the real server's 404 for /gone/* instead
 * of a refused connection" -- as the START of a block comment, and swallowed
 * the live code after it, including that file's own test.use. One false
 * offender, reported with total confidence. String and template literals have
 * to be tracked for the same reason: 'http://x' is not a comment.
 */
export function stripComments(src: string): string {
  let out = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const next = src[i + 1];
    if (c === '/' && next === '/') {
      while (i < n && src[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && next === '*') {
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++;
      i += 2;
      out += ' ';
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      const quote = c;
      out += c;
      i++;
      while (i < n && src[i] !== quote) {
        if (src[i] === '\\') { out += src[i]; i++; }
        if (i < n) { out += src[i]; i++; }
      }
      out += quote;
      i++;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

/** Does this source intercept the network with a Playwright route? */
export function interceptsNetwork(src: string): boolean {
  return /\b(?:page|context|ctx)\s*(?:\.\s*context\s*\(\s*\))?\s*\.\s*route\s*\(/.test(stripComments(src));
}

/** Does this source take the service worker out of the picture? */
export function blocksServiceWorker(src: string): boolean {
  return /serviceWorkers\s*:\s*['"]block['"]/.test(stripComments(src));
}

/**
 * An explicit, reasoned opt-out. The reason is required: an unexplained
 * marker is how an exemption list turns into a place to hide.
 */
export function workerOptOutReason(src: string): string | null {
  const m = /wb-service-worker-required\s*:\s*(.+)/.exec(src);
  const reason = m?.[1]?.trim().replace(/\*\/\s*$/, '').trim();
  return reason ? reason : null;
}

type Scan = {
  total: number;
  intercepting: string[];
  blocking: string[];
  exempt: { file: string; reason: string }[];
  offenders: string[];
};

export function scan(files: string[] = specsOnDisk()): Scan {
  const result: Scan = { total: files.length, intercepting: [], blocking: [], exempt: [], offenders: [] };
  for (const abs of files) {
    const src = readFileSync(abs, 'utf8');
    if (!interceptsNetwork(src)) continue;
    const rel = path.relative(TESTS_DIR, abs).replace(/\\/g, '/');
    result.intercepting.push(rel);
    if (blocksServiceWorker(src)) { result.blocking.push(rel); continue; }
    const reason = workerOptOutReason(src);
    if (reason) { result.exempt.push({ file: rel, reason }); continue; }
    result.offenders.push(rel);
  }
  return result;
}

const HOW_TO_FIX = [
  '',
  'Each file above calls page.route() / context.route() to mock the network,',
  'and does not block the service worker. sw.js (registered by src/main.js on',
  'every page load) answers the page fetch itself, Playwright cannot route a',
  'service worker request, so the mock NEVER APPLIES and the spec silently',
  'measures the real server instead. It fails and passes with the weather.',
  '',
  'Fix, inside the describe (or at the top of the file):',
  '',
  "    test.use({ serviceWorkers: 'block' });",
  '',
  'If the spec genuinely needs the worker, say so and why:',
  '',
  '    // wb-service-worker-required: <reason>',
  '',
  'Background: #1349.',
].join('\n');

test.describe('#1349 — a spec that mocks the network must block the service worker', () => {
  test('the scan is not vacuous — it really walked the specs', () => {
    const files = specsOnDisk();
    // 684 spec files on main at the time of writing. A walk that finds a
    // handful has pointed at the wrong directory, and every assertion below
    // it would be "all clear" over nothing.
    expect(files.length, 'walked almost no specs — wrong rootDir?').toBeGreaterThan(300);
    const found = scan(files);
    // 26 specs intercept the network on main. If this ever reads near zero the
    // DETECTOR broke, not the repo.
    expect(
      found.intercepting.length,
      'no spec appears to intercept the network — the detector is broken, not the repo',
    ).toBeGreaterThan(15);
  });

  test('the detector agrees with hand-read source', () => {
    // Positive forms, all of which occur in tests/ today.
    expect(interceptsNetwork("await page.route('**/api/x', r => r.fulfill({}));")).toBe(true);
    expect(interceptsNetwork('await context.route(/api/, (route) => route.abort());')).toBe(true);
    expect(interceptsNetwork("await page.context().route('**/api/issues', f);")).toBe(true);
    // Prose and dead code are not mocks, and both really occur: the header of
    // tests/fixtures/offline.ts MENTIONS page.route (it routes the context,
    // not the page), and tests/behaviors/r3-inert-attributes-now-work.spec.ts
    // carries a comment saying page.route did not fire for its fetch — itself
    // a casualty of #1349. A raw-text grep calls both of them offenders, and
    // the first thing anyone would learn is not to trust this guard.
    expect(interceptsNetwork('/**\n * route every request, and any page.route() a spec adds\n */\n')).toBe(false);
    expect(interceptsNetwork("// await page.route('**/api/x', f); // disabled")).toBe(false);
    expect(interceptsNetwork('/* await page.route("**", f); */')).toBe(false);
    // The false offender the first draft produced: a LINE comment carrying a
    // block-comment opener must not swallow the code after it.
    expect(
      interceptsNetwork("// the 404 for /gone/* instead\ntest.use({ serviceWorkers: 'block' });\nawait page.route('x', f);"),
      'a line comment containing a block-comment opener ends at the newline',
    ).toBe(true);
    expect(
      blocksServiceWorker("// the 404 for /gone/* instead\ntest.use({ serviceWorkers: 'block' });"),
      'and the test.use after it is still live code',
    ).toBe(true);
    // A URL in a string is not a comment either.
    expect(interceptsNetwork("const u = 'http://localhost/x'; await page.route(u, f);")).toBe(true);
    // Blocking, and NOT-blocking, are both read from live syntax.
    expect(blocksServiceWorker("test.use({ serviceWorkers: 'block' });")).toBe(true);
    expect(blocksServiceWorker('test.use({ serviceWorkers: "block" });')).toBe(true);
    expect(blocksServiceWorker("test.use({ serviceWorkers: 'allow' });")).toBe(false);
    // playwright.config.ts:228's own line. A worker blocked only when an env
    // var happens to be set is not blocked, and must not read as compliant.
    expect(blocksServiceWorker("serviceWorkers: process.env.WB_BLOCK_SW ? 'block' : 'allow',")).toBe(false);
    expect(blocksServiceWorker("// test.use({ serviceWorkers: 'block' });")).toBe(false);
    // An opt-out needs a reason. A bare marker is not an exemption.
    expect(workerOptOutReason('// wb-service-worker-required: measures sw.js cache fallback'))
      .toBe('measures sw.js cache fallback');
    expect(workerOptOutReason('// wb-service-worker-required:')).toBe(null);
    expect(workerOptOutReason('// nothing to see here')).toBe(null);
  });

  test('the anchor case is read correctly', () => {
    // tests/compliance/dark-mode.spec.ts has mocked AND blocked since #961.
    // If the scan stops seeing it as compliant, the reader changed meaning.
    const found = scan();
    expect(found.intercepting).toContain('compliance/dark-mode.spec.ts');
    expect(found.blocking).toContain('compliance/dark-mode.spec.ts');
  });

  test('no spec mocks the network while the service worker answers first', () => {
    const found = scan();
    expect(
      found.offenders,
      `${found.offenders.length} spec(s) mock the network with the service worker still live:\n  `
        + found.offenders.join('\n  ') + '\n' + HOW_TO_FIX,
    ).toEqual([]);
  });

  test('every opt-out carries a reason worth reading', () => {
    const found = scan();
    for (const { file, reason } of found.exempt) {
      expect(reason.length, `${file}: wb-service-worker-required needs a real reason`).toBeGreaterThan(15);
    }
  });
});

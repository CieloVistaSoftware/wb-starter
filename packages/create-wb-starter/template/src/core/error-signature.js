/**
 * Error signatures — the identity an error is remembered by.
 *
 * John: "our error log for each error 1) requires analysis 2) must get a
 * solution on what to do 3) set the fixable flag and then 4) fix the error."
 *
 * Steps 1 and 2 happen once per SIGNATURE, not once per error. Five identical
 * "Unable to Load Documentation" rows are one analysis and one solution; without
 * a stable identity they are five, forever.
 *
 * WHAT NORMALISATION HAS TO ACHIEVE
 * ---------------------------------
 * Too specific and every occurrence is unique, so nothing ever matches. Too
 * loose and unrelated failures collide, so the registry starts lying. The rule
 * used here: keep what identifies the FAULT, mask what identifies the OCCASION.
 *
 *   keep   the error kind, the owning module, the shape of the message
 *   mask   numbers, ids, hashes, timestamps, ports, query strings, absolute
 *          paths -- everything that differs between two occurrences of the
 *          same fault
 *
 * Line numbers are masked deliberately: they move with every edit above them,
 * and a signature that changes when an unrelated line is inserted is not an
 * identity. The module is kept, because it does not.
 */

/** Framework frames that never identify the fault's owner. */
const FRAMEWORK_FRAME = /(error-logger|events|wb-lazy|wb)\.js/;

/**
 * Mask the parts of a message that vary between occurrences of one fault.
 *
 * Order matters: URLs before numbers, or the port and query string are already
 * gone by the time the URL rule runs and it no longer recognises them.
 */
export function normalizeMessage(message) {
  return String(message || '')
    .replace(/https?:\/\/[^\s'"]+/g, '<url>')
    // Element mentions are the OCCASION, not the fault. Without this,
    // "<article x-card> says the same thing twice" and "<button x-button> says
    // the same thing twice" are two signatures for one defect, and the registry
    // needs an entry per tag forever. Measured: this is exactly what happened on
    // the first run -- the replacement-guard entry missed because its key had
    // been written by hand against one example.
    .replace(/<\/?[a-z][a-z0-9]*(\s+[^>]*)?>/gi, '<el>')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '<uuid>')
    .replace(/\b[0-9a-f]{7,40}\b/gi, '<hash>')
    .replace(/\d{4}-\d{2}-\d{2}T[\d:.]+Z?/g, '<timestamp>')
    .replace(/(?:[A-Za-z]:)?[\\/][\w.\-\\/]+\.(js|ts|css|html|json|mjs|png|jpg|svg|md)/g, '<path>')
    .replace(/\b\d+(\.\d+)?(px|ms|s|%|KB|MB)?\b/g, '<n>')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * The first stack frame that is not framework plumbing.
 *
 * The point is to name the code that HAS the problem, not the code that
 * reported it -- error-logger.js is in every stack and identifies nothing.
 */
export function firstMeaningfulFrame(stack) {
  if (!stack) return null;
  for (const raw of String(stack).split('\n')) {
    const line = raw.trim();
    if (!line.startsWith('at ')) continue;
    if (FRAMEWORK_FRAME.test(line)) continue;
    // "at fn (url:line:col)" or "at url:line:col"
    const m = line.match(/at\s+(?:([\w.<>$]+)\s+\()?([^\s()]+?):(\d+):(\d+)\)?/);
    if (!m) continue;
    const [, fn, file, lineNo, col] = m;
    return {
      function: fn || '(anonymous)',
      file: file.replace(/^https?:\/\/[^/]+/, '').split('?')[0],
      line: Number(lineNo),
      column: Number(col),
    };
  }
  return null;
}

/**
 * A stable key for one fault.
 *
 * `<module>|<kind>|<normalised message>` — readable on purpose. A hash would be
 * shorter and would make every registry entry unreadable in a diff, which is
 * where these are actually reviewed.
 */
export function computeSignature({ message, module: mod, level, stack, code } = {}) {
  const frame = firstMeaningfulFrame(stack);
  const owner = (mod || (frame && frame.file) || 'unknown')
    .split('/')
    .filter(Boolean)
    .pop() || 'unknown';

  // PREFER AN EXPLICIT CODE. Normalising English prose can only ever approximate
  // an identity, and the limit showed up immediately: masking element mentions
  // collapsed "<article x-card>" and "<button x-button>" to one shape, but the
  // messages still differ at "the CARD behavior" / "the BUTTON behavior", so one
  // defect class would still need an entry per behavior forever. No general
  // normaliser can know those two words are the variable part.
  //
  // The emitter knows. `code` lets it say so once, and the message stays free to
  // be as specific and human as it likes -- which is the whole point of the
  // message. Prose remains the fallback for the callers that have not been given
  // a code yet.
  if (code) return `${owner}|${level || 'error'}|${String(code).trim().toLowerCase()}`;

  return `${owner}|${level || 'error'}|${normalizeMessage(message)}`;
}

/**
 * Is this error the app's own, or a test's?
 *
 * `definitely-missing-image.png?_retry=…` on port 3310 is a fixture from
 * image-failures-raise-runtime-errors.spec.ts, deliberately requested to prove
 * the retry logic reports failure. Nothing is broken. Merging that into the log
 * a person reads makes five real-looking errors out of a passing test, so it is
 * marked rather than hidden -- hiding it would be its own way of lying.
 */
export function isTestOrigin({ message, url, details } = {}) {
  const haystack = `${message || ''} ${url || ''} ${(details && details.src) || ''}`;
  if (/definitely-missing|__test__|\btest-fixture\b/i.test(haystack)) return true;
  // Playwright's servers run on ephemeral ports; the app's own does not.
  const port = (haystack.match(/localhost:(\d+)/) || [])[1];
  if (port && Number(port) >= 3100) return true;
  return false;
}

/**
 * duplicate-ids.js (#730)
 *
 * John: "if all elements on the page have an id then duplicate work would have
 * a run time error."
 *
 * #724 rendered the whole SPA twice — two navbars, two sidebars, two heroes —
 * and said nothing. Everything "worked", twice, and every getElementById
 * quietly returned the first of two. The only reason anyone knew was that
 * somebody looked at the screen.
 *
 * Every element the showcase renders carries an id (#675), so duplicate ids are
 * a precise signal that something rendered twice — and they are invalid HTML in
 * any case. This turns that silence into a real, logged runtime error.
 *
 * It reports; it never breaks the page. A detector that can take the site down
 * is worse than the bug it watches for.
 */
import { logError } from './error-logger.js';

/** Ids the page legitimately repeats, if any ever need to be tolerated. */
const ALLOWED = new Set();

/**
 * Every id that appears more than once, as `{ id, count }`, worst first.
 * @param {ParentNode} [root=document]
 */
export function findDuplicateIds(root = document) {
  const counts = new Map();
  for (const el of root.querySelectorAll('[id]')) {
    const id = el.id;
    if (!id || ALLOWED.has(id)) continue;
    counts.set(id, (counts.get(id) || 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Check the document and raise a logged runtime error if anything is doubled.
 * @param {string} when - what had just happened, so the log says where to look
 * @returns {{id: string, count: number}[]} the duplicates found (empty when clean)
 */
export function reportDuplicateIds(when = 'render') {
  let duplicates = [];
  try {
    duplicates = findDuplicateIds();
    if (!duplicates.length) return duplicates;

    const summary = duplicates.slice(0, 10)
      .map((d) => `#${d.id} x${d.count}`)
      .join(', ');
    const more = duplicates.length > 10 ? ` (+${duplicates.length - 10} more)` : '';
    const message =
      `Duplicate element id(s) ${when}: ${summary}${more}. ` +
      'An id appearing twice means something rendered twice — see #724/#730. ' +
      'Every getElementById for these returns the first copy only.';

    // A real error, not a console.warn: warnings get scrolled past, and this
    // one needs to reach the Error Log page like any other runtime failure.
    console.error('[WB:DUPLICATE-ID]', message);
    void logError(message, {
      source: 'duplicate-ids',
      when,
      duplicates: duplicates.slice(0, 25),
      total: duplicates.length,
    });
  } catch (err) {
    // Never let the detector be the thing that breaks the page.
    console.warn('[WB] duplicate-id check failed', err);
  }
  return duplicates;
}

export default { findDuplicateIds, reportDuplicateIds };

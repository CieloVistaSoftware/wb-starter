/**
 * Add one entry to data/errors.json's list: a repeat is counted, not re-listed
 * (#1010), across page loads too (#1029).
 *
 * error-logger.js counts repeats within one page load and re-POSTs the same
 * entry (same `id`) with its new count. A second page load starts its count
 * again under a new `id`, and the route used to add a second row for the same
 * fault: identical message, url and signature, five minutes apart, each with
 * count 1.
 *
 * The stored row now keeps one count per page load (`counts`, keyed by the
 * client's id) and `count` is their sum, so a re-POST replaces its own share
 * instead of being added twice. Same-occurrence is the browser's own rule
 * (isSameOccurrence: everything a reader would compare is equal).
 */
import { isSameOccurrence } from '../../src/core/error-signature.js';

const sameRow = (e, incoming) =>
  e && ((e.id === incoming.id && e.message === incoming.message && e.source === incoming.source)
    || (e.counts && Object.hasOwn(e.counts, String(incoming.id)) && e.message === incoming.message)
    || isSameOccurrence(e, incoming));

const earliest = (...ts) => ts.filter(Boolean).sort()[0];
const latest = (...ts) => ts.filter(Boolean).sort().pop();

/** @returns {object[]} the new list (the input is not modified) */
export function mergeIntoLog(errors, incoming) {
  const at = errors.findIndex((e) => sameRow(e, incoming));
  if (at === -1) return [...errors, incoming];
  const prev = errors[at];
  const counts = { ...(prev.counts || { [String(prev.id)]: prev.count || 1 }) };
  counts[String(incoming.id)] = incoming.count || 1;
  const merged = {
    ...prev,
    ...incoming,
    id: prev.id,
    counts,
    count: Object.values(counts).reduce((a, b) => a + b, 0),
    firstSeen: earliest(prev.firstSeen, prev.timestamp, incoming.firstSeen, incoming.timestamp),
    lastSeen: latest(prev.lastSeen, prev.timestamp, incoming.lastSeen, incoming.timestamp),
  };
  return errors.map((e, i) => (i === at ? merged : e));
}

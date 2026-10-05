/**
 * #1029: #1010's rule -- repeats are counted, not re-listed -- held only
 * within one page load. The same fault from a second page load (new client
 * id) became a second row: identical message, url and signature
 * (replacement-guard|error|redundant-behavior-attribute), five minutes apart,
 * each with count 1. /api/error-log/append now merges by the browser's own
 * same-occurrence rule (scripts/lib/error-log-merge.mjs).
 */
import { test, expect } from '@playwright/test';
import { mergeIntoLog } from '../../scripts/lib/error-log-merge.mjs';
import { isSameOccurrence } from '../../src/core/error-signature.js';

const fault = {
  message: 'redundant behavior attribute x-card on <article>',
  level: 'error', source: 'replacement-guard', url: 'http://localhost:3000/?page=behaviors',
  signature: 'replacement-guard|error|redundant-behavior-attribute',
};

test('the same fault from two page loads is one row counting both', () => {
  let log = mergeIntoLog([], { ...fault, id: 101, count: 1, timestamp: '2026-09-05T22:52:05Z' });
  log = mergeIntoLog(log, { ...fault, id: 202, count: 1, timestamp: '2026-09-05T22:56:54Z' });
  expect(log).toHaveLength(1);
  expect(log[0].count).toBe(2);
  expect(log[0].firstSeen).toBe('2026-09-05T22:52:05Z');
  expect(log[0].lastSeen).toBe('2026-09-05T22:56:54Z');
});

test("a page re-sending its own row replaces its share, it is not added twice", () => {
  let log = mergeIntoLog([], { ...fault, id: 101, count: 1, timestamp: '2026-09-05T22:52:05Z' });
  log = mergeIntoLog(log, { ...fault, id: 202, count: 1, timestamp: '2026-09-05T22:56:54Z' });
  // Page 202 sees it twice more and re-POSTs its row with count 3.
  log = mergeIntoLog(log, { ...fault, id: 202, count: 3, timestamp: '2026-09-05T22:57:10Z' });
  expect(log).toHaveLength(1);
  expect(log[0].count).toBe(4); // 1 from page 101 + 3 from page 202
});

test('anything a reader would compare that differs keeps its own row', () => {
  const a = { ...fault, id: 1, count: 1, timestamp: '2026-09-05T22:52:05Z' };
  const otherPage = { ...a, id: 2, url: 'http://localhost:3000/?page=docs' };
  const otherMessage = { ...a, id: 3, message: 'redundant behavior attribute x-card on <section>' };
  expect(isSameOccurrence(a, otherPage)).toBe(false);
  let log = mergeIntoLog([], a);
  log = mergeIntoLog(log, otherPage);
  log = mergeIntoLog(log, otherMessage);
  expect(log).toHaveLength(3);
});

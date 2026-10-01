import { test, expect } from '../fixtures/offline';
import { readFileSync } from 'node:fs';

/**
 * The dev server never waits on `gh` with a synchronous call.
 *
 * /api/fixes, /api/activity and /api/issues ran `gh issue list` through
 * execFileSync with a 30s timeout. A synchronous child process freezes Node's
 * event loop, so while gh hung (unauthenticated, no network: every CI runner)
 * the server answered nothing at all. The first time the compliance project
 * ran on its own runner, four dark-mode.spec.ts pages timed out in page.goto
 * inside that window. Measured with a gh that sleeps 20s: a static page took
 * 19.0s to serve with execFileSync, 0.008s with the async call.
 *
 * Structural, because the failure needs a hanging gh and the right timing to
 * show up in a browser test, and this is the line that causes it.
 */
test('the server runs gh asynchronously, never through execFileSync', () => {
  const server = readFileSync('server.js', 'utf8');
  const blocking = [...server.matchAll(/execFileSync\(\s*'gh'\s*,\s*\[\s*'issue'\s*,\s*'list'/g)];
  expect(
    blocking.length,
    'server.js runs `gh issue list` with execFileSync. It freezes the whole server for as long as\n' +
    'gh takes (up to its timeout when gh hangs), so every request in that window stalls.\n' +
    'Use execFileAsync (promisified execFile) instead.',
  ).toBe(0);
  expect(server).toMatch(/await execFileAsync\(\s*'gh'/);
});

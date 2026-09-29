/**
 * server-down.mjs — tell "our own server was unreachable" apart from a test
 * failure (#1074).
 *
 * A test that could not reach the run's own dev server did not test anything.
 * Before this, data/test-status.json counted it exactly like an assertion
 * failure: one measured run reported 228 failures, 120 of which were
 * `net::ERR_CONNECTION_REFUSED` against localhost — a single dead server read
 * as 120 verdicts about the code.
 *
 * Pure functions, no I/O except readServerLogPort. Shapes matched are the ones
 * found in data/test-results/archive/ (2026-09-13):
 *
 *   Chromium  Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3310/x
 *   WebKit    Error: page.goto: Could not connect to server
 *             Call log:  - navigating to "http://localhost:3310/x"
 *   Node      Error: apiRequestContext.get: connect ECONNREFUSED ::1:3310
 *   Firefox   NS_ERROR_CONNECTION_REFUSED
 */

import { readFileSync } from "fs";

const REFUSED = /net::ERR_CONNECTION_REFUSED|NS_ERROR_CONNECTION_REFUSED|Could not connect to server|\bECONNREFUSED\b/;

/** Loopback host references, with the port each one names (if any). */
const LOOPBACK = /(?:https?:\/\/)?(?:localhost|127\.0\.0\.1|\[::1\]|::1)(?::(\d+))?/g;

/**
 * Classify one failure's error text.
 *
 * @param {string|null|undefined} error  the failure's error text
 * @param {number|null|undefined} port   the run's server port, when known
 * @returns {"server-down"|"test"}
 *
 * A refusal only counts as server-down when it names a loopback host — and,
 * when the port is known, that port. A refusal from a remote host, or from some
 * other local port a test deliberately probes, is a real result.
 */
export function classifyFailure(error, port) {
  if (!error || !REFUSED.test(error)) return "test";
  const hosts = [...String(error).matchAll(LOOPBACK)];
  if (hosts.length === 0) return "test";
  if (!port) return "server-down";
  const wanted = String(port);
  return hosts.some((m) => m[1] === wanted) ? "server-down" : "test";
}

/**
 * Classify a run's failures and decide what the run may honestly claim.
 *
 * @param {{ exitCode: number|null, failures: Array<{error?: string|null}>, port?: number|null }} run
 * @returns {{ state: "passed"|"failed"|"unreliable", serverDown: number, testFailed: number,
 *             reliable: boolean, failures: Array<object> }}
 *
 * state:
 *   passed      exit 0
 *   failed      at least one failure that is a real test result
 *   unreliable  non-zero exit and EVERY recorded failure is server-down — the
 *               run measured the server's absence, not the code
 *
 * reliable is false whenever any failure is server-down: the tests that failed
 * that way never ran, so the pass/fail totals are incomplete either way.
 */
export function classifyRun({ exitCode, failures, port }) {
  const categorized = (failures || []).map((f) => ({
    ...f,
    category: classifyFailure(f && f.error, port),
  }));
  const serverDown = categorized.filter((f) => f.category === "server-down").length;
  const testFailed = categorized.length - serverDown;

  let state;
  if (exitCode === 0) state = "passed";
  else if (serverDown > 0 && testFailed === 0) state = "unreliable";
  else state = "failed";

  return { state, serverDown, testFailed, reliable: serverDown === 0, failures: categorized };
}

/**
 * Read the port the dev server was started on from the header that
 * scripts/serve-with-log.mjs writes. Null when the log is absent or has no
 * header yet (e.g. the run never started a server).
 *
 * @param {string|null|undefined} logPath
 * @returns {number|null}
 */
export function readServerLogPort(logPath) {
  if (!logPath) return null;
  try {
    const head = readFileSync(logPath, "utf-8").slice(0, 2000);
    const m = head.match(/^# .*\bport (\d+)\b/m);
    return m ? Number(m[1]) : null;
  } catch {
    return null;
  }
}

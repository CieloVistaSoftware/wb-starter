/**
 * PROTOCOL ERROR RECORDER (#961)
 * ==============================
 * Playwright's Chromium driver turns EVERY protocol error from an evaluate into
 * one sentence. playwright-core/lib/server/chromium/crExecutionContext.js:
 *
 *   function rewriteError(error) {
 *     ...
 *     if (!js.isJavaScriptErrorInEvaluate(error) && !isSessionClosedError(error))
 *       throw new Error("Execution context was destroyed, most likely because of a navigation.");
 *
 * So "Promise was collected", "Cannot find context with specified id",
 * "Could not find object with given id" and a real context teardown all reach
 * the test as the same "Execution context was destroyed", and the browser's own
 * reason is thrown away. Measured (#961): a page.evaluate awaiting a promise
 * that gets garbage-collected fails with exactly that message while the page
 * never navigated -- the shape of every unexplained instance on record.
 *
 * This keeps the browser's answer. It wraps the driver's CRSession.send once
 * per worker process and remembers each Runtime.* / Page.* call the browser
 * answered with an error. The offline fixture attaches the ones a failing test
 * saw, and wbIdle() names them in its error, so the next "context destroyed"
 * says which of those it really was. Recording only: every call, result and
 * rejection reaches the driver exactly as before.
 *
 * It reaches into playwright-core's internals (by file path, past the package's
 * "exports"), so it is written to fail closed: if the file or the class moves in
 * a Playwright upgrade, install() returns false and nothing else changes.
 */
import { createRequire } from 'module';
import { dirname, join } from 'path';

export interface ProtocolErrorRecord {
  /** Date.now() when the error came back */
  at: number;
  /** the protocol method, e.g. Runtime.callFunctionOn */
  method: string;
  /** the browser's own message, e.g. "Promise was collected" */
  message: string;
}

const MAX = 200;
const records: ProtocolErrorRecord[] = [];
let state: 'untried' | 'installed' | 'unavailable' = 'untried';
let why = '';

/** Errors that are part of normal operation and say nothing about a failure. */
const ROUTINE = [
  /Invalid InterceptionId/,          // a route answered after its request went away
  /Session with given id not found/, // a detached frame's session
];

/** Install the recorder in this worker process. Idempotent; false if it could not be. */
export function installProtocolErrorRecorder(): boolean {
  if (state !== 'untried') return state === 'installed';
  try {
    const req = createRequire(import.meta.url);
    const root = dirname(req.resolve('playwright-core/package.json'));
    const mod = req(join(root, 'lib', 'server', 'chromium', 'crConnection.js'));
    const proto = mod?.CRSession?.prototype;
    if (!proto || typeof proto.send !== 'function') throw new Error('CRSession.prototype.send not found');
    if (proto.__wbProtocolRecorder) { state = 'installed'; return true; }
    const original = proto.send;
    proto.send = function send(this: unknown, method: string, params: unknown) {
      const result = original.call(this, method, params);
      if (/^(Runtime|Page)\./.test(method) && result && typeof result.catch === 'function') {
        // A side branch: the caller still gets `result` itself, rejection and all.
        result.catch((err: Error) => {
          const raw = String(err?.message ?? err).replace(/^Protocol error \([^)]*\):\s*/, '');
          if (ROUTINE.some((re) => re.test(raw))) return;
          records.push({ at: Date.now(), method, message: raw });
          if (records.length > MAX) records.shift();
        });
      }
      return result;
    };
    Object.defineProperty(proto, '__wbProtocolRecorder', { value: true });
    state = 'installed';
  } catch (err) {
    state = 'unavailable';
    why = (err as Error).message;
  }
  return state === 'installed';
}

/** The protocol errors recorded at or after `since` (Date.now() ms). */
export function protocolErrorsSince(since: number): ProtocolErrorRecord[] {
  return records.filter((r) => r.at >= since);
}

/** One line per record, for an error message or an attachment. */
export function describeProtocolErrors(list: ProtocolErrorRecord[], since: number): string {
  if (state !== 'installed') return `(protocol error recorder unavailable: ${why || 'not installed'})`;
  if (!list.length) return '(the browser answered no Runtime/Page call with an error)';
  return list.map((r) => `+${r.at - since}ms ${r.method}: ${r.message}`).join('\n');
}

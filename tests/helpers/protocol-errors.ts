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
    installLifecycleLog(proto);
    Object.defineProperty(proto, '__wbProtocolRecorder', { value: true });
    state = 'installed';
  } catch (err) {
    state = 'unavailable';
    why = (err as Error).message;
  }
  return state === 'installed';
}

/** `+123ms`: the one clock every #961 record is written in (Date.now() minus the test's start). */
export function stamp(at: number, since: number): string {
  return `+${Math.round(at - since)}ms`;
}

/** The protocol errors recorded at or after `since` (Date.now() ms). */
export function protocolErrorsSince(since: number): ProtocolErrorRecord[] {
  return records.filter((r) => r.at >= since);
}

/** One line per record, for an error message or an attachment. */
export function describeProtocolErrors(list: ProtocolErrorRecord[], since: number): string {
  if (state !== 'installed') return `(protocol error recorder unavailable: ${why || 'not installed'})`;
  if (!list.length) return '(the browser answered no Runtime/Page call with an error)';
  return list.map((r) => `${stamp(r.at, since)} ${r.method}: ${r.message}`).join('\n');
}

// ── page lifecycle log (#961) ──────────────────────────────────────────────
//
// "Promise was collected" for a promise a live timer holds means the page's
// script context went away while its DOM stayed. The browser says when a
// context or frame comes and goes; Playwright's own page session already
// receives every one of those events (it enables Runtime, Page with lifecycle
// events, and Inspector itself). So this enables NOTHING: it reads the events
// off the sessions as they arrive, keeps the last LIFECYCLE_MAX per session,
// and stamps them with the same Date.now() clock as the errors above. The cost
// on the hot path is one Set lookup per protocol message.

const LIFECYCLE_EVENTS = new Set([
  'Runtime.executionContextCreated', 'Runtime.executionContextDestroyed', 'Runtime.executionContextsCleared',
  'Page.frameNavigated', 'Page.frameDetached', 'Page.frameRequestedNavigation', 'Page.lifecycleEvent',
  'Page.frameStartedLoading', 'Page.frameStoppedLoading',
  'Inspector.targetCrashed', 'Inspector.detached',
  'Target.attachedToTarget', 'Target.detachedFromTarget',
]);
const LIFECYCLE_MAX = 200;
const MAX_SESSIONS = 64;

interface SessionLog {
  /** what the session is attached to, e.g. "page http://localhost:3000/x" */
  label: string;
  lastAt: number;
  lines: { at: number; text: string }[];
  /** context id -> "main"/world name and origin, so a Destroyed line names its world */
  contexts: Map<number, string>;
  mainFrame: string;
}

const sessionLogs = new Map<string, SessionLog>();
/** child session id -> "type url", learned from Target.attachedToTarget on its parent */
const targetLabels = new Map<string, string>();

const shortId = (id: unknown) => (id ? `…${String(id).slice(-6)}` : '?');
const clip = (s: unknown, n = 120) => { const t = String(s ?? ''); return t.length > n ? t.slice(0, n) + '…' : t; };

function logFor(sessionId: string): SessionLog {
  let log = sessionLogs.get(sessionId);
  if (!log) {
    log = { label: targetLabels.get(sessionId) || (sessionId ? `session ${shortId(sessionId)}` : 'browser'), lastAt: Date.now(), lines: [], contexts: new Map(), mainFrame: '' };
    sessionLogs.set(sessionId, log);
    if (sessionLogs.size > MAX_SESSIONS) {
      const oldest = [...sessionLogs.entries()].sort((a, b) => a[1].lastAt - b[1].lastAt)[0];
      sessionLogs.delete(oldest[0]);
    }
  }
  return log;
}

function frameName(log: SessionLog, frameId: unknown): string {
  return frameId && frameId === log.mainFrame ? 'main-frame' : `frame ${shortId(frameId)}`;
}

function describeEvent(log: SessionLog, method: string, p: any): string {
  const name = method;
  switch (method) {
    case 'Runtime.executionContextCreated': {
      const c = p?.context || {};
      const world = c.auxData?.isDefault ? 'main world' : c.auxData?.type === 'isolated' ? `isolated "${clip(c.name, 40)}"` : `${c.auxData?.type || 'world'} "${clip(c.name, 40)}"`;
      const desc = `${world} ${frameName(log, c.auxData?.frameId)} origin=${c.origin || '-'}`;
      log.contexts.set(c.id, desc);
      if (log.contexts.size > 200) log.contexts.delete(log.contexts.keys().next().value as number);
      return `${name} #${c.id} ${desc}`;
    }
    case 'Runtime.executionContextDestroyed':
      return `${name} #${p?.executionContextId} ${log.contexts.get(p?.executionContextId) || '(world not seen)'}`;
    case 'Page.frameNavigated': {
      const f = p?.frame || {};
      if (!f.parentId) { log.mainFrame = f.id; log.label = `page ${clip(f.url)}`; }
      return `${name} ${frameName(log, f.id)}${p?.type ? ' ' + p.type : ''} ${clip(f.url)}`;
    }
    case 'Page.frameDetached': return `${name} ${frameName(log, p?.frameId)} reason=${p?.reason || '-'}`;
    case 'Page.frameRequestedNavigation': return `${name} ${frameName(log, p?.frameId)} reason=${p?.reason} ${clip(p?.url)}`;
    case 'Page.lifecycleEvent': return `${name} ${p?.name} ${frameName(log, p?.frameId)}`;
    case 'Page.frameStartedLoading':
    case 'Page.frameStoppedLoading': return `${name} ${frameName(log, p?.frameId)}`;
    case 'Inspector.detached': return `${name} reason=${p?.reason}`;
    case 'Target.detachedFromTarget': return `${name} ${targetLabels.get(p?.sessionId) || shortId(p?.targetId)}`;
    default: return name;
  }
}

function recordEvent(sessionId: string, method: string, params: any): void {
  const at = Date.now();
  if (method === 'Target.attachedToTarget') {
    const t = params?.targetInfo;
    if (params?.sessionId && t) {
      targetLabels.set(params.sessionId, `${t.type} ${clip(t.url) || '(blank)'}`);
      // A page target's id is its main frame's id.
      if (t.type === 'page') logFor(params.sessionId).mainFrame = t.targetId;
      if (targetLabels.size > 256) targetLabels.delete(targetLabels.keys().next().value as string);
    }
    return;
  }
  // A detach arrives on the PARENT; it belongs in the log of the session that went.
  const owner = method === 'Target.detachedFromTarget' && params?.sessionId && sessionLogs.has(params.sessionId) ? params.sessionId : sessionId;
  const log = logFor(owner);
  log.lastAt = at;
  log.lines.push({ at, text: describeEvent(log, method, params) });
  if (log.lines.length > LIFECYCLE_MAX) log.lines.shift();
}

function installLifecycleLog(proto: any): void {
  const original = proto._onMessage;
  if (typeof original !== 'function') return; // fail closed: the errors still record
  proto._onMessage = function _onMessage(this: any, object: any) {
    const method = object?.method;
    if (method && LIFECYCLE_EVENTS.has(method)) {
      try {
        // Only pages and frames: a worker's contexts say nothing about the page's main world.
        const label = targetLabels.get(this._sessionId) || '';
        if (!/^(service_worker|worker|shared_worker)\b/.test(label)) recordEvent(this._sessionId || '', method, object.params);
      } catch { /* recording must never break the driver */ }
    }
    return original.call(this, object);
  };
}

/**
 * The lifecycle events of every page/frame session that saw one at or after
 * `since`, one block per session, stamped like describeProtocolErrors().
 */
export function describePageLifecycle(since: number): string {
  if (state !== 'installed') return `(page lifecycle log unavailable: ${why || 'not installed'})`;
  const blocks: string[] = [];
  for (const log of sessionLogs.values()) {
    if (!log.lines.some((l) => l.at >= since)) continue;
    const lines = log.lines.filter((l) => l.at >= since);
    const dropped = log.lines.length >= LIFECYCLE_MAX && log.lines[0].at >= since ? ` (last ${LIFECYCLE_MAX} kept)` : '';
    blocks.push(`[${log.label}]${dropped}\n` + lines.map((l) => `${stamp(l.at, since)} ${l.text}`).join('\n'));
  }
  return blocks.length ? blocks.join('\n\n') : '(no page lifecycle events in this test)';
}

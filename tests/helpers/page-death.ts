/**
 * PAGE DEATH DIAGNOSTICS (#961)
 * =============================
 * On CI, page.evaluate fails with "Runtime.callFunctionOn: Promise was
 * collected" even for promises a live timer holds, which cannot happen while
 * the main world's script context is alive. The DOM survives; the page's
 * JavaScript stopped. This names which of three things happened:
 *
 *   - main world dead     its own timers stopped firing (the heartbeat below);
 *   - page frozen         the page got a `freeze` event and no `resume`;
 *   - main world alive    the heartbeat still runs, so the page is fine and the
 *                         promise was simply orphaned: an app-level hang.
 *
 * HEARTBEAT. An init script in the top frame stamps `<html>` every 100ms:
 *   data-pw-heartbeat        "<count> <Math.round(performance.now())>"
 *   data-pw-lifecycle        "freeze@1234 resume@1300 ..." (last 20 records)
 * `data-pw-` (Playwright harness) is used by nothing in src/, pages/ or demos/:
 * no behavior gate looks at it (they look for `x-*`), no app observer watches
 * <html> attributes without an attributeFilter, and no spec compares <html>'s
 * attributes or outerHTML. tests/regression/page-death-diagnostics-name-the-cause.spec.ts
 * checks that a passing test carries none of this.
 *
 * DIAGNOSIS runs only for a failing test whose errors say "Promise was
 * collected" or "context was destroyed". It reads the heartbeat from a fresh
 * isolated world over its own CDP session (that still answers when the main
 * world does not), reads it again 400ms later, then tries one main-world
 * evaluate with a short timeout and, when that answers, dumps
 * WB.pendingBehaviors and the tail of WB.flowTrace().
 */
import type { BrowserContext, Page } from '@playwright/test';
import { stamp } from './protocol-errors';

const BEAT = 'data-pw-heartbeat';
const LIFE = 'data-pw-lifecycle';
const INTERVAL = 100;

/** Matches the errors this diagnosis is for, in a test error or a protocol error. */
export const PAGE_DEATH_ERROR = /Promise was collected|context was destroyed|Cannot find context with specified id/i;

/** The init script, a string so it runs as written in every top-level document. */
const HEARTBEAT_SCRIPT = `(() => {
  if (window !== window.top || window.__pwHeartbeat) return;
  window.__pwHeartbeat = true;
  const root = () => document.documentElement;
  let n = 0;
  setInterval(() => { const h = root(); if (h) h.setAttribute(${JSON.stringify(BEAT)}, (++n) + ' ' + Math.round(performance.now())); }, ${INTERVAL});
  const note = (e) => {
    const h = root(); if (!h) return;
    const rec = (e.type === 'visibilitychange' ? 'visibility:' + document.visibilityState : e.type) + '@' + Math.round(performance.now());
    const prev = (h.getAttribute(${JSON.stringify(LIFE)}) || '').split(' ').filter(Boolean).slice(-19);
    h.setAttribute(${JSON.stringify(LIFE)}, prev.concat(rec).join(' '));
  };
  for (const t of ['freeze', 'resume', 'visibilitychange']) document.addEventListener(t, note, true);
  for (const t of ['pagehide', 'pageshow']) window.addEventListener(t, note, true);
})();`;

const armed = new WeakSet<BrowserContext>();
/** Start the heartbeat in every page of `context`. Idempotent. */
export async function armHeartbeat(context: BrowserContext): Promise<void> {
  if (armed.has(context)) return;
  armed.add(context);
  await context.addInitScript({ content: HEARTBEAT_SCRIPT });
}

function within<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const late = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(`${what}: no answer in ${ms}ms`)), ms); });
  return Promise.race([p, late]).finally(() => clearTimeout(timer));
}

interface Beat { count: number; pageNow: number; at: number | null; life: string; timeOrigin: number; now: number }

/** Read the heartbeat from a new isolated world; the main world is not involved. */
async function readBeat(page: Page): Promise<Beat> {
  const cdp = await within(page.context().newCDPSession(page), 2000, 'CDP attach');
  try {
    const { frameTree } = await within(cdp.send('Page.getFrameTree'), 2000, 'Page.getFrameTree');
    const { executionContextId } = await within(cdp.send('Page.createIsolatedWorld', { frameId: frameTree.frame.id, worldName: 'wb-page-death' }), 2000, 'Page.createIsolatedWorld');
    const expression = `(() => { const h = document.documentElement; return JSON.stringify({ beat: h && h.getAttribute(${JSON.stringify(BEAT)}), life: h && h.getAttribute(${JSON.stringify(LIFE)}), now: performance.now(), timeOrigin: performance.timeOrigin }); })()`;
    const res = await within(cdp.send('Runtime.evaluate', { expression, contextId: executionContextId, returnByValue: true }), 2000, 'Runtime.evaluate (isolated world)');
    if (res.exceptionDetails) throw new Error(res.exceptionDetails.text);
    const v = JSON.parse(String(res.result.value));
    const [count, at] = String(v.beat ?? '').split(' ').map(Number);
    return { count: count || 0, at: v.beat ? at : null, pageNow: v.now, life: v.life || '', timeOrigin: v.timeOrigin, now: v.now };
  } finally {
    cdp.detach().catch(() => {});
  }
}

/** A page-clock time (performance.now()) on the test's clock: "+1234ms". */
const onTestClock = (b: Beat, pageMs: number, since: number) => stamp(b.timeOrigin + pageMs, since);

/**
 * Diagnose one page: the verdict on the first line, the evidence after it.
 * Never throws; every step that fails says so in the text.
 */
export async function diagnosePageDeath(page: Page, since: number): Promise<string> {
  const lines: string[] = [];
  let first: Beat | null = null;
  let second: Beat | null = null;
  try {
    first = await readBeat(page);
    await new Promise((r) => setTimeout(r, 4 * INTERVAL));
    second = await readBeat(page);
  } catch (err) {
    lines.push(`heartbeat: unreadable (${(err as Error).message.split('\n')[0]})`);
  }

  let main = '';
  let alive = false;
  try {
    const one = await within(page.evaluate(() => 1), 1500, 'page.evaluate(() => 1)');
    alive = one === 1;
    main = alive ? 'answered' : `answered ${JSON.stringify(one)}`;
  } catch (err) {
    main = `failed: ${(err as Error).message.split('\n')[0]}`;
  }

  let verdict: string;
  if (!first || !second) {
    verdict = 'page unreachable (its isolated world did not answer either)';
  } else {
    const life = second.life.split(' ').filter(Boolean);
    const lastFreeze = life.map((r) => /^freeze@(\d+)$/.exec(r)).filter(Boolean).pop();
    const resumedAfter = lastFreeze && life.slice(life.findIndex((r) => r === lastFreeze[0]) + 1).some((r) => r.startsWith('resume@'));
    const running = second.count > first.count;
    if (lastFreeze && !resumedAfter) {
      verdict = `page frozen (freeze event at ${onTestClock(second, Number(lastFreeze[1]), since)})`;
    } else if (second.at === null) {
      verdict = 'main world dead (heartbeat never started)';
    } else if (!running) {
      verdict = `main world dead (heartbeat stopped at ${onTestClock(second, second.at, since)})`;
    } else {
      verdict = 'main world alive (heartbeat running) — app-level hang';
    }
    lines.push(`heartbeat: ${first.count} -> ${second.count} over ${Math.round(second.now - first.now)}ms` +
      (second.at !== null ? `, last beat at ${onTestClock(second, second.at, since)}, read at ${onTestClock(second, second.now, since)}` : ''));
    lines.push(`page lifecycle events: ${second.life ? second.life.split(' ').map((r) => { const [k, t] = r.split('@'); return `${k}@${onTestClock(second!, Number(t), since)}`; }).join(' ') : '(none)'}`);
  }
  lines.push(`main-world evaluate: ${main}`);

  if (alive) {
    try {
      const wb = await within(page.evaluate(() => {
        const WB = (window as unknown as { WB?: { pendingBehaviors?: unknown; flowTrace?: () => string[] } }).WB;
        if (!WB) return null;
        let flow: string[] | null = null;
        try { flow = typeof WB.flowTrace === 'function' ? WB.flowTrace().slice(-30) : null; } catch { flow = null; }
        return { pending: WB.pendingBehaviors ?? null, flow };
      }), 1500, 'WB dump');
      if (!wb) lines.push('WB: not on this page');
      else {
        lines.push(`WB.pendingBehaviors: ${JSON.stringify(wb.pending) || '(none)'}`);
        if (wb.flow) lines.push(`WB.flowTrace() last ${wb.flow.length}:\n  ${wb.flow.join('\n  ')}`);
      }
    } catch (err) {
      lines.push(`WB dump failed: ${(err as Error).message.split('\n')[0]}`);
    }
  }
  return [verdict, ...lines].join('\n');
}

/** diagnosePageDeath() for every open page of `context`, one block each. */
export async function diagnoseContext(context: BrowserContext, since: number): Promise<string> {
  const pages = context.pages().filter((p) => !p.isClosed());
  if (!pages.length) return '(no open page left to diagnose)';
  const out: string[] = [];
  for (const [i, p] of pages.entries()) {
    const body = await diagnosePageDeath(p, since);
    out.push(pages.length > 1 ? `[page ${i + 1}] ${p.url()}\n${body}` : body);
  }
  return out.join('\n\n');
}

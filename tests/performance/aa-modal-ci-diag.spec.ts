import { test } from '../fixtures/offline';
import { spawnSync } from 'node:child_process';

/**
 * TEMPORARY CI diagnostic for #961 (Modal should open in under 200ms), removed
 * before the PR is ready. Named aa- so it is the FIRST test of the performance
 * job, which is where both failures happened: the job's first browser launch,
 * seconds after `npx playwright install` and the server start.
 *
 * Per sample it records, for the modal click on the booting Behaviors page:
 *   - wall time of the click (what the test measures)
 *   - thread CPU time of the same click from a CDP trace (EventDispatch tdur):
 *     tdur far below dur means the renderer thread was descheduled, not busy
 *   - style/layout/GC inside the click
 *   - a fixed JS calibration loop's wall time (how fast this machine is right now)
 * and, around the whole run, which Windows processes used CPU.
 * Never fails: it is evidence.
 */
test.describe.configure({ timeout: 240_000 });

function topCpu(): Map<string, number> {
  const out = new Map<string, number>();
  if (process.platform !== 'win32') return out;
  const r = spawnSync('powershell', ['-NoProfile', '-Command',
    'Get-Process | Where-Object { $_.CPU } | ForEach-Object { "$($_.ProcessName)`t$($_.Id)`t$($_.CPU)" }'], { encoding: 'utf8' });
  for (const line of (r.stdout || '').split(/\r?\n/)) {
    const [name, id, cpu] = line.split('\t');
    if (name && cpu) out.set(`${name}#${id}`, Number(cpu));
  }
  return out;
}

test('modal click at job start: wall vs thread time (diagnostic, #961)', async ({ page }) => {
  const cpu0 = topCpu();
  const t0 = Date.now();
  for (let i = 0; i < 15; i++) {
    const cdp = await page.context().newCDPSession(page);
    const g0 = Date.now();
    await page.goto('/?page=behaviors');
    const gotoMs = Date.now() - g0;
    const w0 = Date.now();
    await page.waitForFunction(() => Boolean((window as any).WB));
    const wbWaitMs = Date.now() - w0;
    await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline', transferMode: 'ReturnAsStream' });
    const r = await page.evaluate(async () => {
      const W = window as any;
      const cal0 = performance.now();
      let x = 0; for (let k = 0; k < 3e6; k++) x = (x + k * 7) % 1000003;
      const calibrationMs = performance.now() - cal0;
      const host = document.createElement('div');
      host.id = 'perf-host';
      host.innerHTML = '<button x-modal modal-title="Perf" modal-content="Opened.">Open</button>';
      document.body.append(host);
      await W.WB.scan(host, { eager: true });
      const el = document.querySelector('#perf-host [x-modal]') as HTMLElement;
      const nodes = document.getElementsByTagName('*').length;
      const site = 'WBSite' in window;
      const c0 = performance.now();
      el.click();
      const syncMs = performance.now() - c0;
      const open = Boolean(document.querySelector('dialog[open]'));
      document.querySelector('dialog[open]')?.remove();
      return { calibrationMs: Math.round(calibrationMs), syncMs: Math.round(syncMs * 10) / 10, open, nodes, site, x };
    });
    const done = new Promise<any>((res) => cdp.once('Tracing.tracingComplete', res));
    await cdp.send('Tracing.end');
    const { stream } = await done;
    let data = '';
    for (;;) { const c: any = await cdp.send('IO.read', { handle: stream }); data += c.data; if (c.eof) break; }
    const ev: any[] = JSON.parse(data).traceEvents || JSON.parse(data);
    const click = ev.find((e) => e.name === 'EventDispatch' && e.ph === 'X' && e.args?.data?.type === 'click');
    const inside: Record<string, { dur: number; tdur: number }> = {};
    if (click) {
      for (const e of ev) {
        if (e.ph !== 'X' || e === click || e.pid !== click.pid || e.tid !== click.tid) continue;
        if (e.ts < click.ts || e.ts > click.ts + click.dur) continue;
        if (!['UpdateLayoutTree', 'Layout', 'MinorGC', 'MajorGC', 'FunctionCall', 'V8.GC_SCAVENGER', 'V8.GC_MARK_COMPACTOR'].includes(e.name)) continue;
        const a = (inside[e.name] ||= { dur: 0, tdur: 0 });
        a.dur += (e.dur || 0) / 1000; a.tdur += (e.tdur || 0) / 1000;
      }
    }
    const round = (o: any) => Object.fromEntries(Object.entries(o).map(([k, v]: any) => [k, { dur: Math.round(v.dur * 10) / 10, tdur: Math.round(v.tdur * 10) / 10 }]));
    console.log('MODAL-DIAG ' + JSON.stringify({
      i, atMs: Date.now() - t0, gotoMs, wbWaitMs, ...r,
      clickDur: click ? Math.round(click.dur / 100) / 10 : null, clickThread: click ? Math.round((click.tdur || 0) / 100) / 10 : null,
      inside: round(inside),
    }));
    await cdp.detach();
  }
  const cpu1 = topCpu();
  const deltas = [...cpu1].map(([k, v]) => [k, v - (cpu0.get(k) ?? 0)] as [string, number]).filter(([, d]) => d > 0.5).sort((a, b) => b[1] - a[1]).slice(0, 15);
  console.log('MODAL-DIAG-CPU over ' + (Date.now() - t0) + 'ms: ' + deltas.map(([k, d]) => `${k}=${d.toFixed(1)}s`).join(', '));
  const before = [...cpu0].sort((a, b) => b[1] - a[1]).slice(0, 12);
  console.log('MODAL-DIAG-CPU-TOTALS at start: ' + before.map(([k, v]) => `${k}=${v.toFixed(1)}s`).join(', '));
});

import { test, expect } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { killTree } from '../../scripts/claim-port.mjs';

/**
 * #1961: the WB Pro waitlist, end to end, the way John runs it -- on the
 * Windows CI runner, where his PC differs from the Linux box the earlier
 * checks ran on (IPv6 localhost, process lookup, taskkill).
 *
 * John, 2026-11-03: "that means our test set up is wrong". Every Windows-only
 * failure reached him first: a leftover Worker nobody could stop, a join that
 * hung on "Joining...". This spec reproduces his setup:
 *
 *   1. a Worker left running on 8787 from an earlier run;
 *   2. npm run pro:local's script (scripts/pro-local.mjs) must stop it by
 *      PID, start the site and a fresh Worker, and report "ready" only when
 *      the Worker answers at 127.0.0.1:8787 -- the address the page posts to;
 *   3. a real browser joins from the Pro page, and the green message shows
 *      within 2 seconds (a join takes ~0.1 s; the form gives up at 5 s).
 *
 * The site runs on PRO_SITE_PORT=3100: CI's own site server holds 3000.
 */

const ROOT = process.cwd();
const WIN = process.platform === 'win32';
const WRANGLER = path.join(ROOT, 'node_modules', '.bin', WIN ? 'wrangler.cmd' : 'wrangler');
const SITE = 'http://localhost:3100';

let stray: ChildProcess | null = null;
let proLocal: ChildProcess | null = null;
let output = '';

async function waitUntil(check: () => boolean | Promise<boolean>, ms: number): Promise<boolean> {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await check()) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function workerAnswers(): Promise<boolean> {
  try {
    const res = await fetch('http://127.0.0.1:8787/health', { signal: AbortSignal.timeout(2000) });
    return (await res.json()).app === 'pro-waitlist';
  } catch {
    return false;
  }
}

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  test.setTimeout(240_000);

  // 1. A Worker left over from an earlier run.
  // Its output is kept: if it never answers, the failure says why.
  let strayOutput = '';
  stray = spawn(WRANGLER, ['dev', '--port', '8787'], { cwd: path.join(ROOT, 'server', 'waitlist'), shell: WIN, stdio: ['ignore', 'pipe', 'pipe'] });
  stray.stdout?.on('data', (d) => { strayOutput += String(d); });
  stray.stderr?.on('data', (d) => { strayOutput += String(d); });
  stray.on('exit', (code) => { strayOutput += `\n[wrangler dev exited with code ${code}]`; });
  const strayUp = await waitUntil(workerAnswers, 120_000);
  expect(strayUp, `the leftover Worker started on 8787. wrangler dev printed:\n${strayOutput.slice(-4000)}`).toBe(true);

  // 2. pro:local, as John runs it (WB_NO_OPEN: no browser window on CI).
  proLocal = spawn(process.execPath, ['scripts/pro-local.mjs'], {
    cwd: ROOT,
    env: { ...process.env, PRO_SITE_PORT: '3100', WB_NO_OPEN: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  proLocal.stdout?.on('data', (d) => { output += String(d); });
  proLocal.stderr?.on('data', (d) => { output += String(d); });
  const ready = await waitUntil(() => output.includes('4/4 ready') || /did not answer|stopped \(exit|run this again/.test(output), 180_000);
  expect(ready, `pro:local finished starting. Output:\n${output}`).toBe(true);
});

test.afterAll(() => {
  for (const child of [proLocal, stray]) {
    if (child?.pid && child.exitCode === null) killTree(child.pid);
  }
});

test('pro:local stops a leftover Worker by PID and reports ready (#1961)', () => {
  expect(output, output).toMatch(/\[claim-port\] port 8787: stopped an older copy of the waitlist Worker \((PID \d+|workerd\.exe)\)/);
  expect(output, output).toContain('[pro:local] 4/4 ready');
});

test('a browser joins from the Pro page and sees the green message within 2 s (#1961)', async ({ page }) => {
  await page.goto(`${SITE}/?page=pro`);
  const form = page.locator('#pro-form-29');
  await expect(form).toHaveAttribute('x-ready', '', { timeout: 30_000 });
  await expect(form).toHaveAttribute('action', 'http://127.0.0.1:8787/join');

  await page.fill('#pro-input-31', `ci-${Date.now()}@example.com`);
  const started = Date.now();
  await page.click('#pro-button-35');
  const message = form.locator('.x-form__message');
  await expect(message).toBeVisible({ timeout: 5_000 });
  const tookMs = Date.now() - started;

  await expect(message).toHaveClass(/x-form__message--success/);
  await expect(message).toContainText('You are on the list');
  expect(tookMs, `the join answered in ${tookMs} ms`).toBeLessThan(2_000);
});

/**
 * Make a fixed port free for this run (#1961).
 *
 *   node scripts/claim-port.mjs 3000          the site's port
 *   node scripts/claim-port.mjs 3000 8787     the site's and the waitlist Worker's
 *
 * John, 2026-11-02: "the ports should always be known". npm run pro:local's
 * site came up on 3003 because older copies of the site still held
 * 3000-3002, and the waitlist refused it. A port is never skipped now:
 *
 *   - free: nothing to do;
 *   - held by a leftover copy of this site (its /health says
 *     app "cielovista-site", or the older {status, timestamp} answer) or of the
 *     waitlist Worker (404 "Not found" with its X-Frame-Options: DENY):
 *     that process is stopped, and this says which;
 *   - held by anything else: stop, naming the process, and touch nothing.
 *
 * Skipped on CI and test servers (WB_NO_OPEN=1), which pick their own ports.
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Print one line with this script's prefix. */
function say(message) {
  console.log(`[claim-port] ${message}`);
}

/**
 * The PIDs LISTENING on a port in Windows `netstat -ano` output, IPv4 and IPv6.
 * @param {string} out
 * @param {number} port
 * @returns {number[]}
 */
export function parseNetstat(out, port) {
  const pids = new Set();
  for (const line of out.split(/\r?\n/)) {
    const cols = line.trim().split(/\s+/);
    // Proto  Local Address  Foreign Address  State  PID   (Proto is TCP for IPv6 too)
    if (cols.length >= 5 && cols[0].startsWith('TCP') && cols[3] === 'LISTENING' && cols[1].endsWith(`:${port}`)) pids.add(Number(cols[4]));
  }
  return [...pids].filter((pid) => pid > 0);
}

/**
 * The PIDs listening on a TCP port, [] when it is free.
 * @param {number} port
 * @returns {number[]}
 */
export function listeningPids(port) {
  try {
    if (process.platform === 'win32') {
      // All protocols: Node listens on [::]:3000 (IPv6), which `-p tcp` (IPv4 only) never lists.
      // PowerShell first (what Windows itself reports for the port), netstat as a fallback.
      try {
        const ps = execFileSync('powershell', ['-NoProfile', '-Command',
          `(Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue).OwningProcess`],
        { encoding: 'utf8' });
        const pids = [...new Set(ps.split(/\s+/).filter(Boolean).map(Number))].filter((pid) => pid > 0);
        if (pids.length) return pids;
      } catch { /* no PowerShell: fall back */ }
      return parseNetstat(execFileSync('netstat', ['-ano'], { encoding: 'utf8' }), port);
    }
    const out = execFileSync('lsof', ['-t', `-iTCP:${port}`, '-sTCP:LISTEN'], { encoding: 'utf8' });
    return [...new Set(out.split(/\s+/).filter(Boolean).map(Number))];
  } catch {
    return []; // lsof exits 1 when nothing listens
  }
}

/**
 * Stop a process and everything it started. On Windows a launcher (cmd.exe,
 * npx) does not take its children down with it, so the whole tree goes.
 * @param {number} pid
 */
export function killTree(pid) {
  try {
    if (process.platform === 'win32') {
      return execFileSync('taskkill', ['/PID', String(pid), '/T', '/F'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    }
    process.kill(pid);
    return `sent SIGTERM to ${pid}`;
  } catch (error) {
    // What the OS said, for the message when the port stays held.
    return String(error.stderr || error.stdout || error.message || error).trim();
  }
}

/**
 * Name and command line of a process, for messages. Windows only; '' elsewhere.
 * @param {number} pid
 */
function describeProcess(pid) {
  if (process.platform !== 'win32') return '';
  try {
    return execFileSync('powershell', ['-NoProfile', '-Command',
      `$p = Get-CimInstance Win32_Process -Filter "ProcessId=${pid}"; if ($p) { "$($p.Name): $($p.CommandLine)" } else { 'no such process' }`],
    { encoding: 'utf8' }).trim().slice(0, 300);
  } catch (error) {
    return `could not look it up: ${String(error.message || error).slice(0, 120)}`;
  }
}

/**
 * On Windows, stop every workerd.exe (where wrangler dev runs a Worker).
 * @returns {string} what taskkill said
 */
function killWorkerd() {
  try {
    return execFileSync('taskkill', ['/IM', 'workerd.exe', '/T', '/F'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    return String(error.stderr || error.stdout || error.message || error).trim();
  }
}

/** Is anything still answering or listening on the port? */
async function stillHeld(port) {
  return listeningPids(port).length > 0 || (await whoIsOn(port)) !== 'none';
}

/**
 * What answers on the port: 'site', 'worker', 'other' or 'none'.
 * @param {number} port
 */
export async function whoIsOn(port) {
  try {
    const health = await fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(2000) });
    if (health.ok) {
      const body = await health.json().catch(() => null);
      if (body && body.app === 'pro-waitlist') return 'worker';
      if (body && (body.app === 'cielovista-site' || (body.status === 'ok' && typeof body.timestamp === 'string'))) return 'site';
    }
    const root = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(2000) });
    if (root.status === 404 && root.headers.get('x-frame-options') === 'DENY' && (await root.text()) === 'Not found\n') return 'worker';
    return 'other';
  } catch {
    return listeningPids(port).length ? 'other' : 'none';
  }
}

/**
 * Free one port, or explain why not. Returns true when it is free.
 * @param {number} port
 */
export async function claim(port) {
  const who = await whoIsOn(port);
  if (who === 'none') return true;
  let pids = listeningPids(port);
  if (!pids.length && who === 'site') {
    // A copy of the site reports its own pid on /health.
    const body = await fetch(`http://127.0.0.1:${port}/health`).then((r) => r.json()).catch(() => null);
    if (body && Number.isInteger(body.pid)) pids = [body.pid];
  }
  if (who === 'other') {
    say(`port ${port} is in use by another program (PID ${pids.join(', ') || 'unknown'}), not by this site. ` +
      'Close that program, then run this again. Nothing was stopped.');
    return false;
  }
  const what = who === 'site' ? 'an older copy of the site' : 'an older copy of the waitlist Worker';
  if (!pids.length && who === 'worker' && process.platform === 'win32') {
    // Windows sometimes reports no owner for wrangler's port. The Worker runs
    // in workerd.exe: stop those processes (local Cloudflare dev only).
    killWorkerd();
    for (let i = 0; i < 40 && (await stillHeld(port)); i += 1) await new Promise((r) => setTimeout(r, 250));
    if (!(await stillHeld(port))) {
      say(`port ${port}: stopped ${what} (workerd.exe), so this run uses ${port}.`);
      return true;
    }
  }
  if (!pids.length) {
    say(`port ${port} is held by ${what}, but its process could not be found to stop it. ` +
      'Close the terminal or VS Code task that started it, then run this again.');
    return false;
  }
  const holders = pids.map((pid) => `${pid} (${describeProcess(pid) || 'process'})`);
  const said = pids.map((pid) => killTree(pid));
  for (let i = 0; i < 40 && (await stillHeld(port)); i += 1) await new Promise((r) => setTimeout(r, 250));
  if ((await stillHeld(port)) && who === 'worker' && process.platform === 'win32') {
    // The PID Windows named did not free the port: stop wrangler's runtime itself.
    said.push(`taskkill /IM workerd.exe: ${killWorkerd()}`);
    for (let i = 0; i < 40 && (await stillHeld(port)); i += 1) await new Promise((r) => setTimeout(r, 250));
  }
  if (await stillHeld(port)) {
    const now = listeningPids(port);
    say(`port ${port}: could not stop ${what}. Held by: ${holders.join('; ')}. ` +
      `Stopping it said: ${said.join(' | ') || 'nothing'}. Still listening now: ${now.map((pid) => `${pid} (${describeProcess(pid) || 'process'})`).join('; ') || 'no PID found'}, answering as: ${await whoIsOn(port)}. ` +
      'Close it, then run this again.');
    return false;
  }
  say(`port ${port}: stopped ${what} (PID ${pids.join(', ')}), so this run uses ${port}.`);
  return true;
}

const ports = process.argv.slice(2).map(Number).filter((n) => Number.isInteger(n) && n > 0);
const runDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (runDirectly && ports.length) {
  if (process.env.CI || process.env.WB_NO_OPEN === '1') {
    say('test or CI server: not claiming ports');
  } else {
    for (const port of ports) {
      if (!(await claim(port))) process.exit(1);
    }
  }
}

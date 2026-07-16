#!/usr/bin/env node
/**
 * Audits how many GET /health requests scripts/start-mcp.js's
 * waitForHealth() polling loop makes before the MCP server (mcp-server/
 * server.js) becomes ready, and how long that takes.
 *
 * waitForHealth() polls every 500ms with no backoff until it gets a 200 or
 * hits its --wait timeout (default 20s) -- so the GET count is a direct
 * proxy for "how slow is MCP startup, and is the polling interval wasteful
 * once it's clearly going to take a while." This spawns mcp-server/server.js
 * directly (not the full start:mcp chain, which also launches the primary
 * web server afterward -- irrelevant to this audit and something we don't
 * want to leave running).
 *
 * Usage: node scripts/audit-mcp-startup-gets.mjs [--port 52100] [--wait 20] [--runs 3]
 */
import { spawn } from 'child_process';
import http from 'http';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.resolve(__dirname, '..');
const MCP_SCRIPT = path.join(PROJECT_DIR, 'mcp-server', 'server.js');

const argv = process.argv.slice(2);
let port = 52100;
let waitSeconds = 20;
let runs = 3;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--port') port = Number(argv[++i]);
  else if (argv[i] === '--wait') waitSeconds = Number(argv[++i]);
  else if (argv[i] === '--runs') runs = Number(argv[++i]);
}

function pollHealth(port, timeoutSec) {
  const start = Date.now();
  const timeout = timeoutSec * 1000;
  const gets = [];
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      const attemptStart = Date.now();
      const req = http.get({ host: '127.0.0.1', port, path: '/health', timeout: 2000 }, (res) => {
        const elapsed = Date.now() - attemptStart;
        gets.push({ n: gets.length + 1, statusCode: res.statusCode, elapsedMs: elapsed, atMs: attemptStart - start });
        res.resume(); // drain
        if (res.statusCode === 200) {
          clearInterval(interval);
          resolve({ gets, totalMs: Date.now() - start, healthy: true });
        }
      });
      req.on('error', (err) => {
        gets.push({ n: gets.length + 1, statusCode: null, error: err.code || err.message, atMs: attemptStart - start });
        if (Date.now() - start > timeout) {
          clearInterval(interval);
          reject({ gets, totalMs: Date.now() - start, healthy: false, reason: 'timeout' });
        }
      });
      req.on('timeout', () => req.destroy());
    }, 500);
  });
}

function runOnce(runIndex) {
  return new Promise((resolve) => {
    console.log(`\n--- Run ${runIndex + 1}/${runs}: spawning mcp-server/server.js (MCP_HEALTH_PORT=${port}) ---`);
    const spawnedAt = Date.now();
    const mcp = spawn(process.execPath, [MCP_SCRIPT], {
      cwd: PROJECT_DIR,
      stdio: ['ignore', 'ignore', 'pipe'], // MCP's real stdout is its stdio transport -- don't touch it
      env: { ...process.env, MCP_HEALTH_PORT: String(port) },
    });

    let stderrBuf = '';
    mcp.stderr.on('data', (d) => { stderrBuf += d.toString(); });

    pollHealth(port, waitSeconds)
      .then((result) => {
        const spawnToHealthyMs = Date.now() - spawnedAt;
        resolve({ ...result, spawnToHealthyMs, stderrBuf });
      })
      .catch((result) => {
        resolve({ ...result, spawnToHealthyMs: Date.now() - spawnedAt, stderrBuf });
      })
      .finally(() => {
        try { mcp.kill(); } catch { /* already dead */ }
      });
  });
}

const results = [];
for (let i = 0; i < runs; i++) {
  // eslint-disable-next-line no-await-in-loop
  const r = await runOnce(i);
  results.push(r);
  const status = r.healthy ? '✅ healthy' : '❌ ' + r.reason;
  console.log(`  ${status} — ${r.gets.length} GET(s), ${r.totalMs}ms polling / ${r.spawnToHealthyMs}ms spawn-to-healthy`);
  for (const g of r.gets) {
    const label = g.statusCode ? `status=${g.statusCode} (${g.elapsedMs}ms)` : `error=${g.error}`;
    console.log(`    GET #${g.n} @ +${g.atMs}ms — ${label}`);
  }
  // Let the port fully release before the next run.
  // eslint-disable-next-line no-await-in-loop
  await new Promise((r2) => setTimeout(r2, 500));
}

const getCounts = results.map((r) => r.gets.length);
const healthyRuns = results.filter((r) => r.healthy);
const avgGets = getCounts.reduce((a, b) => a + b, 0) / getCounts.length;
const avgTotalMs = healthyRuns.length
  ? healthyRuns.reduce((a, r) => a + r.spawnToHealthyMs, 0) / healthyRuns.length
  : null;

console.log('\n' + '='.repeat(60));
console.log('MCP STARTUP GET AUDIT');
console.log('='.repeat(60));
console.log(`Runs: ${runs} | Healthy: ${healthyRuns.length}/${runs}`);
console.log(`GET count per run: ${getCounts.join(', ')}`);
console.log(`Average GETs to become healthy: ${avgGets.toFixed(1)}`);
if (avgTotalMs !== null) {
  console.log(`Average spawn-to-healthy time: ${avgTotalMs.toFixed(0)}ms`);
}
console.log('='.repeat(60));

process.exit(healthyRuns.length === runs ? 0 : 1);

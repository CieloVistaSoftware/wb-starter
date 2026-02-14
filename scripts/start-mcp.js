#!/usr/bin/env node
import { spawn } from 'child_process';
import http from 'http';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const argv = process.argv.slice(2);
const forward = [];
let healthPort = process.env.MCP_HEALTH_PORT || process.env.MCP_PORT || 52100;
let waitSeconds = 20;

for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--port' && argv[i+1]) { healthPort = argv[i+1]; i++; continue; }
  if (a === '--wait' && argv[i+1]) { waitSeconds = Number(argv[i+1]); i++; continue; }
  forward.push(a);
}

healthPort = Number(healthPort);
waitSeconds = Number(waitSeconds) || 20;

const SPAWN_OPTS = { cwd: process.cwd(), shell: false, stdio: 'inherit' };

function spawnNode(scriptPath, args = []) {
  const node = process.execPath;
  return spawn(node, [scriptPath, ...args], SPAWN_OPTS);
}

function waitForHealth(port, timeoutSec) {
  const start = Date.now();
  const timeout = timeoutSec * 1000;
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      const req = http.get({ host: '127.0.0.1', port, path: '/health', timeout: 2000 }, (res) => {
        if (res.statusCode === 200) {
          clearInterval(interval);
          resolve(true);
        }
      });
      req.on('error', () => {
        if (Date.now() - start > timeout) {
          clearInterval(interval);
          reject(new Error('health probe timed out'));
        }
        // otherwise ignore and retry
      });
      req.on('timeout', () => req.destroy());
    }, 500);
  });
}

// Start MCP npm-runner (mcp-server/server.js) with health port
const mcpScript = path.join(process.cwd(), 'mcp-server', 'server.js');
console.log(`[start-mcp] launching mcp-server -> ${mcpScript} (MCP_HEALTH_PORT=${healthPort})`);
const mcp = spawn(process.execPath, [mcpScript], {
  cwd: process.cwd(),
  shell: false,
  stdio: 'inherit',
  env: { ...process.env, MCP_HEALTH_PORT: String(healthPort) },
});

mcp.on('exit', (code, sig) => {
  console.error(`[start-mcp] mcp-server exited (code=${code}, sig=${sig})`);
  process.exit(code || 1);
});

// Wait for MCP health (if port is configured)
waitForHealth(healthPort, waitSeconds).then(() => {
  console.log(`[start-mcp] mcp-server healthy on port ${healthPort}`);

  // Start primary web server (server.js) and forward remaining args
  const webScript = path.join(process.cwd(), 'server.js');
  console.log(`[start-mcp] launching web server -> ${webScript} ${forward.join(' ')}`);
  const web = spawnNode(webScript, forward);

  web.on('exit', (code, sig) => {
    console.log(`[start-mcp] web server exited (code=${code}, sig=${sig})`);
    // ensure mcp is killed when web server exits
    try { mcp.kill(); } catch (e) {}
    process.exit(code || 0);
  });

  // Forward signals
  ['SIGINT','SIGTERM','SIGHUP'].forEach(s => {
    process.on(s, () => {
      try { web.kill(s); } catch (e) {}
      try { mcp.kill(s); } catch (e) {}
      process.exit(0);
    });
  });
}).catch((err) => {
  console.error('[start-mcp] mcp-server failed to become healthy:', err && err.message);
  try { mcp.kill(); } catch (e) {}
  process.exit(1);
});

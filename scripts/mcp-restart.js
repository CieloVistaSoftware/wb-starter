#!/usr/bin/env node
/*
  scripts/mcp-restart.js
  - Cross-platform helper to stop any existing MCP server listening on the configured health port
    and start a new one. Suitable for CI and local development.
  - Usage:
      npm run start:mcp -- --port 52100        # restart background server on port 52100
      npm run start:mcp -- --foreground         # run in foreground (logs to console)
      node scripts/mcp-restart.js --port 52100 --wait 30
*/
import http from 'http';
import { spawn, execSync } from 'child_process';
import net from 'net';
import os from 'os';

const argv = process.argv.slice(2);
const argvToObj = (arr) => {
  const out = {};
  for (let i = 0; i < arr.length; i++) {
    const a = arr[i];
    if (a.startsWith('--')) {
      const k = a.replace(/^--/, '');
      const v = arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[++i] : true;
      out[k] = v;
    }
  }
  return out;
};

const opts = argvToObj(argv);
const port = Number(process.env.MCP_HEALTH_PORT || opts.port || process.env.npm_config_mcp_health_port || 52100);
const timeoutSec = Number(opts.wait || 20);
const foreground = Boolean(opts.foreground || opts.fg);

function getHealthUrl() {
  return `http://127.0.0.1:${port}/health`;
}

function requestHealth() {
  return new Promise((resolve, reject) => {
    const req = http.get(getHealthUrl(), (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          const j = JSON.parse(body);
          resolve({ status: res.statusCode, body: j });
        } catch (err) {
          resolve({ status: res.statusCode, body: body });
        }
      });
    });
    req.on('error', (err) => reject(err));
    req.setTimeout(2000, () => req.destroy(new Error('timeout')));
  });
}

async function probePortFree(retries = 40, delayMs = 250) {
  for (let i = 0; i < retries; i++) {
    const sock = new net.Socket();
    await new Promise((res) => {
      sock.setTimeout(300);
      sock.once('error', () => {
        sock.destroy();
        res(true); // connection refused -> port free
      });
      sock.once('timeout', () => {
        sock.destroy();
        res(true);
      });
      sock.connect(port, '127.0.0.1', () => {
        sock.end();
        res(false); // port in use
      });
    }).then((free) => {
      if (free) {
        // double-check by trying HTTP health; if success -> not free
      }
    });

    // quick check via TCP: if connection succeeded, port busy
    try {
      await new Promise((resolve, reject) => {
        const s = net.connect({ port, host: '127.0.0.1' }, () => { s.destroy(); resolve(false); });
        s.on('error', () => resolve(true));
        setTimeout(() => resolve(true), 300);
      }).then((free) => {
        if (free) throw 'free';
      });
    } catch (e) {
      return true;
    }

    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

async function killPid(pid) {
  try {
    if (os.platform() === 'win32') {
      // taskkill is robust on windows
      execSync(`taskkill /PID ${pid} /T /F`);
    } else {
      process.kill(pid, 'SIGTERM');
      // wait a moment, then SIGKILL if still alive
      await new Promise((r) => setTimeout(r, 600));
      try {
        process.kill(pid, 0);
        process.kill(pid, 'SIGKILL');
      } catch (err) {
        // already dead
      }
    }
    return true;
  } catch (err) {
    console.warn('[mcp-restart] failed to kill PID', pid, err && err.message);
    return false;
  }
}

async function stopExisting() {
  try {
    const res = await requestHealth();
    if (res && res.status === 200 && res.body && res.body.pid) {
      const pid = Number(res.body.pid);
      console.log(`[mcp-restart] found running MCP server (pid=${pid}) -> attempting shutdown`);
      const ok = await killPid(pid);
      if (!ok) {
        console.warn('[mcp-restart] kill attempt failed, continuing to probe port');
      }
      // wait for port to free
      const freed = await probePortFree(Math.max(40, timeoutSec * 4), 250);
      if (!freed) throw new Error('port-still-bound');
      console.log('[mcp-restart] previous MCP process stopped and port freed');
      return;
    }
  } catch (err) {
    console.log('[mcp-restart] no healthy MCP process detected on port (or health failed) — proceeding to start');
  }
}

async function startNew() {
  const env = { ...process.env, MCP_HEALTH_PORT: String(port) };
  if (foreground) {
    console.log('[mcp-restart] starting MCP server in foreground — logs will stream below');
    const proc = spawn(process.execPath, ['mcp-server/server.js'], { env, stdio: 'inherit', cwd: process.cwd() });
    proc.on('exit', (code) => process.exit(code ?? 0));
    return;
  }

  // background spawn
  const child = spawn(process.execPath, ['mcp-server/server.js'], {
    env,
    detached: true,
    stdio: 'ignore',
    cwd: process.cwd(),
  });
  child.unref();
  console.log(`[mcp-restart] spawned MCP server (detached) pid=${child.pid} health=http://127.0.0.1:${port}/health`);

  // wait for health
  const deadline = Date.now() + timeoutSec * 1000;
  while (Date.now() < deadline) {
    try {
      const r = await requestHealth();
      if (r && r.status === 200) {
        console.log('[mcp-restart] MCP health: OK', r.body);
        return;
      }
    } catch (err) {
      // still starting
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error('MCP server failed to become healthy within timeout');
}

(async function main() {
  try {
    console.log(`[mcp-restart] port=${port} foreground=${foreground} timeout=${timeoutSec}s`);
    await stopExisting();
    await startNew();
    console.log('[mcp-restart] done');
    process.exit(0);
  } catch (err) {
    console.error('[mcp-restart] error:', err && err.message ? err.message : err);
    process.exit(2);
  }
})();

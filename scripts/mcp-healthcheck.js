#!/usr/bin/env node
/* Cross-platform MCP healthcheck. Exits 0 when the TCP port is open. */
import net from 'net';

const argvPort = process.argv[2];
const PORT = Number(argvPort || process.env.MCP_HEALTH_PORT || 52100);
const HOST = process.env.MCP_HEALTH_HOST || '127.0.0.1';
const TIMEOUT = Number(process.env.MCP_HEALTH_TIMEOUT || 8000);

function checkPort(host, port, timeout) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let done = false;
    const onSuccess = () => { if (done) return; done = true; socket.destroy(); resolve(true); };
    const onFail = () => { if (done) return; done = true; try { socket.destroy(); } catch(e){} resolve(false); };

    socket.setTimeout(timeout);
    socket.on('connect', onSuccess);
    socket.on('timeout', onFail);
    socket.on('error', onFail);
    socket.connect(port, host);
  });
}

(async () => {
  const ok = await checkPort(HOST, PORT, TIMEOUT);
  if (ok) {
    console.log(`MCP health: OK (tcp://${HOST}:${PORT})`);
    process.exit(0);
  }
  console.error(`MCP health: failed to connect tcp://${HOST}:${PORT}`);
  process.exit(1);
})();

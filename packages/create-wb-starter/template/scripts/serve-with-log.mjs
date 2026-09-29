/**
 * serve-with-log.mjs — run the dev server for Playwright and keep its output (#1074).
 *
 * Usage (playwright.config.ts webServer.command):
 *   node scripts/serve-with-log.mjs npm start
 *
 * Everything after the script name is run as one shell command. With no
 * command, `npm start`.
 *
 * Why: Playwright's webServer discards the server's stdout by default and
 * nothing here ever kept stderr. When the server died mid-run there was no
 * record of why — only the hundred-odd ERR_CONNECTION_REFUSED failures that
 * followed. This wrapper tees both streams to a file under data/ and appends
 * a line recording how the server process ended, so the next death leaves its
 * stack and its exit code behind.
 *
 * Log path: $WB_SERVER_LOG when set (scripts/test-async.mjs sets it and records
 * it in the status file), else data/test-server-logs/server-<timestamp>-port<PORT>.log.
 * One file per run; nothing is ever overwritten or deleted.
 *
 * Writes are synchronous on purpose: at the end of a run Playwright kills the
 * whole process tree, and an async write queued at that moment is lost.
 */

import { spawn } from "child_process";
import { appendFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = process.env.PORT || "unknown";
const command = process.argv.slice(2).join(" ").trim() || "npm start";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const logPath = process.env.WB_SERVER_LOG
  || join(ROOT, "data", "test-server-logs", `server-${stamp}-port${port}.log`);

mkdirSync(dirname(logPath), { recursive: true });

const log = (text) => {
  try { appendFileSync(logPath, text); } catch { /* the server must not die because its log did */ }
};
const note = (text) => log(`# ${new Date().toISOString()} ${text}\n`);

const startedAt = Date.now();
note(`wb-starter test server (#1074) — wrapper pid ${process.pid}, port ${port}, cwd ${process.cwd()}, command: ${command}`);

const child = spawn(command, {
  cwd: process.cwd(),
  env: process.env,
  shell: true,
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true,
});
note(`server pid ${child.pid}`);

child.stdout.on("data", (buf) => {
  log(buf.toString());
  try { process.stdout.write(buf); } catch { /* stdout may be closed */ }
});
child.stderr.on("data", (buf) => {
  log(buf.toString());
  try { process.stderr.write(buf); } catch { /* stderr may be closed */ }
});

child.on("error", (err) => {
  note(`server failed to start: ${err.stack || err.message}`);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  const secs = ((Date.now() - startedAt) / 1000).toFixed(1);
  note(`server exited code=${code} signal=${signal} after ${secs}s`);
  process.exit(code ?? 1);
});

for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(sig, () => {
    note(`wrapper received ${sig}; stopping server`);
    try { child.kill(sig); } catch { /* already gone */ }
  });
}

process.on("uncaughtException", (err) => {
  note(`wrapper uncaughtException: ${err.stack || err.message}`);
  throw err;
});

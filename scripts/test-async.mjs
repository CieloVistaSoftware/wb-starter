/**
 * test-async.mjs — Global async test launcher
 * 
 * Two modes:
 *   SUITE — full or filtered runs (--project, --grep, no args)
 *     - Locked via data/test.lock (one at a time)
 *     - Status: data/test-status.json
 *   
 *   SINGLE — specific spec file (*.spec.ts)
 *     - No lock (parallel allowed)
 *     - Status: data/test-single/{specname}.json
 * 
 * Usage:
 *   npm run test:async                              → suite (all)
 *   npm run test:async -- --project=compliance      → suite (filtered)
 *   npm run test:async -- --grep "wb-card"          → suite (filtered)
 *   npm run test:async -- tests/behaviors/badge.spec.ts  → single (parallel)
 *   npm run test:async -- --stop                          → stop running suite
 * 
 * Architecture:
 *   Launcher (no --monitor flag) → writes initial status, spawns ITSELF
 *   with --monitor flag as a detached process with stdio:'ignore', then
 *   exits immediately (<1s). The monitor instance spawns Playwright with
 *   pipes and writes progress to the status file every 2 seconds.
 */

import { spawn, fork } from "child_process";
import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");
const DATA_DIR = join(ROOT, "data");
const SINGLE_DIR = join(DATA_DIR, "test-single");
const LOCK_FILE = join(DATA_DIR, "test.lock");
const STATUS_FILE = join(DATA_DIR, "test-status.json");
const RESULTS_FILE = join(DATA_DIR, "test-results.json");

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return false;
  }
}

async function removeLock() {
  try { await unlink(LOCK_FILE); } catch (e) { /* ignore */ }
}

function detectMode(args) {
  const specFile = args.find((a) => a.endsWith(".spec.ts"));
  if (specFile) {
    return { mode: "single", specFile };
  }
  return { mode: "suite", specFile: null };
}

function buildPlaywrightArgs(args) {
  const cmdArgs = ["playwright", "test"];
  const hasWorkers = args.some((a) => a.startsWith("--workers"));
  if (!hasWorkers) {
    cmdArgs.push("--workers=8");
  }
  cmdArgs.push(...args);
  return cmdArgs;
}

function makeStatus(startTime, cmdArgs, specFile) {
  return {
    state: "running",
    mode: specFile ? "single" : "suite",
    specFile: specFile || null,
    startedAt: startTime,
    updatedAt: startTime,
    command: `npx ${cmdArgs.join(" ")}`,
    pid: null,
    passed: 0,
    failed: 0,
    skipped: 0,
    total: 0,
    currentFile: null,
    output: "",
    errors: "",
  };
}

function killProcess(pid) {
  try {
    process.kill(pid, "SIGTERM");
    return true;
  } catch (e) {
    return false;
  }
}

// ─── ENTRY POINT ───────────────────────────────────────────────────
const allArgs = process.argv.slice(2);
const isMonitor = allArgs.includes("--monitor");
const isStop = allArgs.includes("--stop");
const passthroughArgs = allArgs.filter((a) => a !== "--monitor" && a !== "--stop");

if (isStop) {
  runStop().catch((err) => {
    console.error("Stop failed:", err.message);
    process.exit(1);
  });
} else if (isMonitor) {
  runMonitor(passthroughArgs).catch((err) => {
    console.error("Monitor fatal:", err.message);
    process.exit(1);
  });
} else {
  runLauncher(passthroughArgs).catch((err) => {
    console.error("Fatal:", err.message);
    process.exit(1);
  });
}

// ─── STOP ──────────────────────────────────────────────────────────
// Reads lock file, kills monitor + Playwright PIDs, updates status.
async function runStop() {
  if (!existsSync(LOCK_FILE)) {
    console.log("⚠️  No tests running (no lock file).");
    process.exit(0);
  }

  let lock;
  try {
    lock = JSON.parse(await readFile(LOCK_FILE, "utf-8"));
  } catch (e) {
    console.log("⚠️  Corrupt lock file. Removing.");
    await removeLock();
    process.exit(0);
  }

  const killed = [];
  // Kill Playwright first, then monitor
  if (lock.playwrightPid && isProcessRunning(lock.playwrightPid)) {
    killProcess(lock.playwrightPid);
    killed.push(`Playwright (PID: ${lock.playwrightPid})`);
  }
  if (lock.pid && isProcessRunning(lock.pid)) {
    killProcess(lock.pid);
    killed.push(`Monitor (PID: ${lock.pid})`);
  }

  // Update status file to reflect stopped state
  try {
    const status = JSON.parse(await readFile(STATUS_FILE, "utf-8"));
    status.state = "stopped";
    status.updatedAt = new Date().toISOString();
    status.completedAt = new Date().toISOString();
    status.exitCode = -1;
    await writeFile(STATUS_FILE, JSON.stringify(status, null, 2));
  } catch (e) { /* ignore */ }

  await removeLock();

  if (killed.length > 0) {
    console.log(`🛑 Stopped: ${killed.join(", ")}`);
  } else {
    console.log("⚠️  Lock existed but processes already dead. Cleaned up.");
  }
}

// ─── LAUNCHER ──────────────────────────────────────────────────────
// Writes initial status/lock, spawns monitor detached, exits immediately.
async function runLauncher(args) {
  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(SINGLE_DIR, { recursive: true });

  // Clear stale data from previous runs
  await writeFile(STATUS_FILE, "{}");
  await writeFile(RESULTS_FILE, "{}");

  const { mode, specFile } = detectMode(args);
  const cmdArgs = buildPlaywrightArgs(args);
  const startTime = new Date().toISOString();

  if (mode === "suite") {
    // Check lock
    if (existsSync(LOCK_FILE)) {
      try {
        const lock = JSON.parse(await readFile(LOCK_FILE, "utf-8"));
        if (lock.pid && isProcessRunning(lock.pid)) {
          console.error(`❌ Tests already running (PID: ${lock.pid}, started: ${lock.startedAt})`);
          console.error(`   Poll data/test-status.json for progress.`);
          process.exit(1);
        } else {
          console.log(`⚠️  Stale lock (PID: ${lock.pid} dead). Clearing.`);
          await removeLock();
        }
      } catch (e) {
        console.log(`⚠️  Corrupt lock file. Clearing.`);
        await removeLock();
      }
    }

    // Write initial status
    const status = makeStatus(startTime, cmdArgs, null);
    await writeFile(STATUS_FILE, JSON.stringify(status, null, 2));

    // Write lock (PID will be the monitor process)
    // We'll update it once monitor starts — for now use placeholder
    await writeFile(LOCK_FILE, JSON.stringify({
      pid: null,
      startedAt: startTime,
      command: status.command,
    }, null, 2));
  } else {
    const specName = basename(specFile, ".spec.ts");
    const singleStatusFile = join(SINGLE_DIR, `${specName}.json`);
    const status = makeStatus(startTime, cmdArgs, specFile);
    await writeFile(singleStatusFile, JSON.stringify(status, null, 2));
  }

  // Spawn monitor: detached, stdio ignored — parent exits immediately
  const monitor = spawn(
    process.execPath,
    [__filename, "--monitor", ...args],
    {
      cwd: ROOT,
      detached: true,
      stdio: "ignore",
      windowsHide: true,
      env: { ...process.env },
    }
  );
  monitor.unref();

  if (mode === "suite") {
    // Update lock with actual monitor PID
    await writeFile(LOCK_FILE, JSON.stringify({
      pid: monitor.pid,
      startedAt: startTime,
      command: `npx ${cmdArgs.join(" ")}`,
    }, null, 2));

    console.log(`✅ Suite launched (monitor PID: ${monitor.pid})`);
    console.log(`   Command: npx ${cmdArgs.join(" ")}`);
    console.log(`   Poll data/test-status.json for progress.`);
  } else {
    const specName = basename(specFile, ".spec.ts");
    console.log(`✅ Single test launched (monitor PID: ${monitor.pid})`);
    console.log(`   Spec: ${specFile}`);
    console.log(`   Poll data/test-single/${specName}.json for progress.`);
  }

  // Parent exits here — monitor runs independently
}

// ─── MONITOR ───────────────────────────────────────────────────────
// Spawns Playwright with pipes, tracks progress, writes status every 2s.
async function runMonitor(args) {
  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(SINGLE_DIR, { recursive: true });

  const { mode, specFile } = detectMode(args);
  const cmdArgs = buildPlaywrightArgs(args);
  const startTime = new Date().toISOString();

  let statusFile;
  if (mode === "suite") {
    statusFile = STATUS_FILE;
  } else {
    const specName = basename(specFile, ".spec.ts");
    statusFile = join(SINGLE_DIR, `${specName}.json`);
  }

  // Read existing status or create new
  let status;
  try {
    status = JSON.parse(await readFile(statusFile, "utf-8"));
  } catch (e) {
    status = makeStatus(startTime, cmdArgs, specFile);
  }

  // Spawn Playwright with pipes so we can read output
  const proc = spawn("npx", cmdArgs, {
    cwd: ROOT,
    shell: true,
    env: { ...process.env, FORCE_COLOR: "0" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  status.pid = proc.pid;

  // Update lock with Playwright PID for suite mode
  if (mode === "suite") {
    await writeFile(LOCK_FILE, JSON.stringify({
      pid: process.pid,
      playwrightPid: proc.pid,
      startedAt: status.startedAt,
      command: status.command,
    }, null, 2));
  }

  await writeFile(statusFile, JSON.stringify(status, null, 2));

  // Track output and individual results
  let stdout = "";
  let stderr = "";
  let dirty = false;
  const testResults = [];  // accumulated individual test results
  let lineBuffer = "";    // buffer for incomplete lines from stdout

  // Parse individual test result lines as they stream in
  //   ok 4 [compliance] › tests\compliance\foo.spec.ts:131:3 › Suite › test name (16ms)
  //   x  3 [compliance] › tests\compliance\foo.spec.ts:113:3 › Suite › test name (5.1s)
  //   -  5 [compliance] › tests\compliance\foo.spec.ts:20:3 › Suite › test name
  const TEST_LINE_RE = /^\s+(ok|x|-)\s+\d+\s+\[([\w-]+)\]\s+›\s+(.+?\.spec\.ts):\d+:\d+\s+›\s+(.+?)(?:\s+\(([\d.]+(?:ms|s))\))?$/;

  function parseTestLines(text) {
    lineBuffer += text;
    const lines = lineBuffer.split("\n");
    // Keep the last incomplete line in the buffer
    lineBuffer = lines.pop() || "";

    for (const line of lines) {
      const m = line.match(TEST_LINE_RE);
      if (m) {
        const [, statusChar, project, file, name, duration] = m;
        const testStatus = statusChar === "ok" ? "passed" : statusChar === "x" ? "failed" : "skipped";
        testResults.push({
          status: testStatus,
          project,
          file,
          name: name.trim(),
          duration: duration || null,
        });

        // Update live counts
        if (testStatus === "passed") status.passed++;
        else if (testStatus === "failed") status.failed++;
        else if (testStatus === "skipped") status.skipped++;
        status.total = status.passed + status.failed + status.skipped;
        status.currentFile = file;
        dirty = true;
      }
    }
  }

  const flushStatus = async () => {
    if (!dirty) return;
    dirty = false;
    status.updatedAt = new Date().toISOString();
    // Keep full stdout (up to 50KB) — no front-truncation
    status.output = stdout.length > 50000 ? stdout.slice(-50000) : stdout;
    status.errors = stderr.length > 10000 ? stderr.slice(-10000) : stderr;
    // Include the failures list for quick reference
    status.failures = testResults.filter(t => t.status === "failed").map(t => ({
      file: t.file,
      name: t.name,
    }));

    try {
      await writeFile(statusFile, JSON.stringify(status, null, 2));
    } catch (e) { /* ignore */ }

    // Also update test-results.json with live results array
    if (mode === "suite") {
      try {
        await writeFile(RESULTS_FILE, JSON.stringify({
          timestamp: status.updatedAt,
          duration: `${((new Date() - new Date(status.startedAt)) / 1000).toFixed(2)}s`,
          exitCode: null,
          passed: status.passed,
          failed: status.failed,
          skipped: status.skipped,
          total: status.total,
          results: testResults,
          failures: testResults.filter(t => t.status === "failed"),
        }, null, 2));
      } catch (e) { /* ignore */ }
    }
  };

  const updateTimer = setInterval(flushStatus, 2000);

  proc.stdout.on("data", (data) => {
    const chunk = data.toString();
    stdout += chunk;
    parseTestLines(chunk);
    dirty = true;
  });

  proc.stderr.on("data", (data) => {
    stderr += data.toString();
    dirty = true;
  });

  proc.on("close", async (exitCode) => {
    clearInterval(updateTimer);

    const endTime = new Date().toISOString();
    const durationMs = new Date(endTime) - new Date(status.startedAt);
    const duration = (durationMs / 1000).toFixed(2);

    status.state = exitCode === 0 ? "passed" : "failed";
    status.updatedAt = endTime;
    status.completedAt = endTime;
    status.duration = `${duration}s`;
    status.exitCode = exitCode;
    status.output = stdout.length > 50000 ? stdout.slice(-50000) : stdout;
    status.errors = stderr.length > 10000 ? stderr.slice(-10000) : stderr;

    // Final counts — prefer Playwright summary if available, else use our tracked counts
    const combined = stdout + stderr;
    const passMatch = combined.match(/(\d+) passed/);
    const failMatch = combined.match(/(\d+) failed/);
    const skipMatch = combined.match(/(\d+) skipped/);
    if (passMatch) status.passed = parseInt(passMatch[1]);
    if (failMatch) status.failed = parseInt(failMatch[1]);
    if (skipMatch) status.skipped = parseInt(skipMatch[1]);
    status.total = status.passed + status.failed + status.skipped;
    status.failures = testResults.filter(t => t.status === "failed").map(t => ({
      file: t.file,
      name: t.name,
    }));

    try {
      await writeFile(statusFile, JSON.stringify(status, null, 2));
    } catch (e) { /* ignore */ }

    // Write full results (suite mode only)
    if (mode === "suite") {
      try {
        await writeFile(RESULTS_FILE, JSON.stringify({
          timestamp: endTime,
          duration: `${duration}s`,
          exitCode,
          passed: status.passed,
          failed: status.failed,
          skipped: status.skipped,
          total: status.total,
          results: testResults,
          failures: testResults.filter(t => t.status === "failed"),
          stdout,
          stderr,
        }, null, 2));
      } catch (e) { /* ignore */ }

      await removeLock();
    }
  });

  proc.on("error", async (err) => {
    clearInterval(updateTimer);
    status.state = "error";
    status.updatedAt = new Date().toISOString();
    status.errors = err.message;
    try {
      await writeFile(statusFile, JSON.stringify(status, null, 2));
    } catch (e) { /* ignore */ }
    if (mode === "suite") await removeLock();
  });
}

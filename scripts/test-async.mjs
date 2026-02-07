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

// ─── ENTRY POINT ───────────────────────────────────────────────────
const allArgs = process.argv.slice(2);
const isMonitor = allArgs.includes("--monitor");
const passthroughArgs = allArgs.filter((a) => a !== "--monitor");

if (isMonitor) {
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

// ─── LAUNCHER ──────────────────────────────────────────────────────
// Writes initial status/lock, spawns monitor detached, exits immediately.
async function runLauncher(args) {
  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(SINGLE_DIR, { recursive: true });

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

  // Track output
  let stdout = "";
  let stderr = "";
  let dirty = false;

  const flushStatus = async () => {
    if (!dirty) return;
    dirty = false;
    status.updatedAt = new Date().toISOString();
    status.output = stdout.slice(-5000);
    status.errors = stderr.slice(-2000);

    const passMatches = stdout.match(/(\d+) passed/g);
    const failMatches = stdout.match(/(\d+) failed/g);
    const skipMatches = stdout.match(/(\d+) skipped/g);

    if (passMatches) {
      status.passed = parseInt(passMatches[passMatches.length - 1].match(/(\d+)/)[1]);
    }
    if (failMatches) {
      status.failed = parseInt(failMatches[failMatches.length - 1].match(/(\d+)/)[1]);
    }
    if (skipMatches) {
      status.skipped = parseInt(skipMatches[skipMatches.length - 1].match(/(\d+)/)[1]);
    }

    const fileMatches = stdout.match(/\[[\w-]+\] › (.+?\.spec\.ts)/g);
    if (fileMatches) {
      const lastFile = fileMatches[fileMatches.length - 1];
      const m = lastFile.match(/› (.+?\.spec\.ts)/);
      if (m) status.currentFile = m[1];
    }

    status.total = status.passed + status.failed + status.skipped;

    try {
      await writeFile(statusFile, JSON.stringify(status, null, 2));
    } catch (e) { /* ignore */ }
  };

  const updateTimer = setInterval(flushStatus, 2000);

  proc.stdout.on("data", (data) => {
    stdout += data.toString();
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
    status.output = stdout.slice(-5000);
    status.errors = stderr.slice(-2000);

    // Final parse
    const combined = stdout + stderr;
    const passMatch = combined.match(/(\d+) passed/);
    const failMatch = combined.match(/(\d+) failed/);
    const skipMatch = combined.match(/(\d+) skipped/);
    status.passed = passMatch ? parseInt(passMatch[1]) : 0;
    status.failed = failMatch ? parseInt(failMatch[1]) : 0;
    status.skipped = skipMatch ? parseInt(skipMatch[1]) : 0;
    status.total = status.passed + status.failed + status.skipped;

    try {
      await writeFile(statusFile, JSON.stringify(status, null, 2));
    } catch (e) { /* ignore */ }

    // Write full results (suite mode only)
    if (mode === "suite") {
      try {
        await writeFile(join(DATA_DIR, "test-results.json"), JSON.stringify({
          timestamp: endTime,
          duration: `${duration}s`,
          exitCode,
          passed: status.passed,
          failed: status.failed,
          skipped: status.skipped,
          total: status.total,
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

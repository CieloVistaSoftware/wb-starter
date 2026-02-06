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
 * All modes:
 *   - Spawn detached, return immediately
 *   - Write progress every 2 seconds
 *   - Caller polls status file
 */

import { spawn } from "child_process";
import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
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

/**
 * Detect mode from args.
 * If any arg ends with .spec.ts → SINGLE mode, return the filename.
 * Otherwise → SUITE mode.
 */
function detectMode(args) {
  const specFile = args.find((a) => a.endsWith(".spec.ts"));
  if (specFile) {
    return { mode: "single", specFile };
  }
  return { mode: "suite", specFile: null };
}

async function main() {
  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(SINGLE_DIR, { recursive: true });

  const passthroughArgs = process.argv.slice(2);
  const { mode, specFile } = detectMode(passthroughArgs);

  if (mode === "suite") {
    await launchSuite(passthroughArgs);
  } else {
    await launchSingle(passthroughArgs, specFile);
  }
}

/**
 * SUITE mode — locked, one at a time
 */
async function launchSuite(args) {
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

  const cmdArgs = buildPlaywrightArgs(args);
  const startTime = new Date().toISOString();

  const status = makeStatus(startTime, cmdArgs, null);
  const proc = spawnPlaywright(cmdArgs);

  status.pid = proc.pid;

  // Write lock
  await writeFile(LOCK_FILE, JSON.stringify({
    pid: proc.pid,
    startedAt: startTime,
    command: status.command,
  }, null, 2));

  await writeFile(STATUS_FILE, JSON.stringify(status, null, 2));

  monitorProcess(proc, status, STATUS_FILE, startTime, async () => {
    await removeLock();
  });

  proc.unref();
  console.log(`✅ Suite launched (PID: ${proc.pid})`);
  console.log(`   Command: ${status.command}`);
  console.log(`   Poll data/test-status.json for progress.`);
}

/**
 * SINGLE mode — no lock, parallel allowed
 */
async function launchSingle(args, specFile) {
  const specName = basename(specFile, ".spec.ts");
  const singleStatusFile = join(SINGLE_DIR, `${specName}.json`);

  const cmdArgs = buildPlaywrightArgs(args);
  const startTime = new Date().toISOString();

  const status = makeStatus(startTime, cmdArgs, specFile);
  const proc = spawnPlaywright(cmdArgs);

  status.pid = proc.pid;
  await writeFile(singleStatusFile, JSON.stringify(status, null, 2));

  monitorProcess(proc, status, singleStatusFile, startTime, null);

  proc.unref();
  console.log(`✅ Single test launched (PID: ${proc.pid})`);
  console.log(`   Spec: ${specFile}`);
  console.log(`   Command: ${status.command}`);
  console.log(`   Poll data/test-single/${specName}.json for progress.`);
}

/**
 * Build Playwright args with default workers
 */
function buildPlaywrightArgs(args) {
  const cmdArgs = ["playwright", "test"];
  const hasWorkers = args.some((a) => a.startsWith("--workers"));
  if (!hasWorkers) {
    cmdArgs.push("--workers=8");
  }
  cmdArgs.push(...args);
  return cmdArgs;
}

/**
 * Create initial status object
 */
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

/**
 * Spawn Playwright detached
 */
function spawnPlaywright(cmdArgs) {
  return spawn("npx", cmdArgs, {
    cwd: ROOT,
    shell: true,
    env: { ...process.env, FORCE_COLOR: "0" },
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

/**
 * Monitor a spawned process — update status file every 2s, write final results
 * @param {Function|null} onComplete - called after process ends (e.g., to remove lock)
 */
function monitorProcess(proc, status, statusFile, startTime, onComplete) {
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
    const durationMs = new Date(endTime) - new Date(startTime);
    const duration = (durationMs / 1000).toFixed(2);

    status.state = exitCode === 0 ? "passed" : "failed";
    status.updatedAt = endTime;
    status.completedAt = endTime;
    status.duration = `${duration}s`;
    status.exitCode = exitCode;
    status.output = stdout.slice(-5000);
    status.errors = stderr.slice(-2000);

    const passMatch = (stdout + stderr).match(/(\d+) passed/);
    const failMatch = (stdout + stderr).match(/(\d+) failed/);
    const skipMatch = (stdout + stderr).match(/(\d+) skipped/);
    status.passed = passMatch ? parseInt(passMatch[1]) : 0;
    status.failed = failMatch ? parseInt(failMatch[1]) : 0;
    status.skipped = skipMatch ? parseInt(skipMatch[1]) : 0;
    status.total = status.passed + status.failed + status.skipped;

    try {
      await writeFile(statusFile, JSON.stringify(status, null, 2));
    } catch (e) { /* ignore */ }

    // Write full results (suite mode only)
    if (status.mode === "suite") {
      try {
        const resultsFile = join(dirname(statusFile), "test-results.json");
        await writeFile(resultsFile, JSON.stringify({
          timestamp: endTime,
          duration: `${duration}s`,
          exitCode,
          summary: parseTestOutput(stdout + stderr),
          passed: status.passed,
          failed: status.failed,
          skipped: status.skipped,
          total: status.total,
          stdout,
          stderr,
        }, null, 2));
      } catch (e) { /* ignore */ }
    }

    if (onComplete) await onComplete();
  });

  proc.on("error", async (err) => {
    clearInterval(updateTimer);
    status.state = "error";
    status.updatedAt = new Date().toISOString();
    status.errors = err.message;
    try {
      await writeFile(statusFile, JSON.stringify(status, null, 2));
    } catch (e) { /* ignore */ }
    if (onComplete) await onComplete();
  });
}

function parseTestOutput(output) {
  const passMatch = output.match(/(\d+) passed/);
  const failMatch = output.match(/(\d+) failed/);
  const skipMatch = output.match(/(\d+) skipped/);

  const passed = passMatch ? parseInt(passMatch[1]) : 0;
  const failed = failMatch ? parseInt(failMatch[1]) : 0;
  const skipped = skipMatch ? parseInt(skipMatch[1]) : 0;

  if (passed || failed || skipped) {
    return `${passed} passed, ${failed} failed, ${skipped} skipped`;
  }

  return "Could not parse test summary";
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});

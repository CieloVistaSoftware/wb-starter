/**
 * test-lock.mjs — machine-wide concurrency guards for the async test runner.
 *
 * Why this lives outside the repo tree (#651):
 * the suite lock used to be written to <ROOT>/data/test.lock, where ROOT was
 * derived from the running script's own path. Every git worktree carries its own
 * copy of scripts/, so ROOT resolved to that worktree and each worktree got its
 * own private lock. N agents in N worktrees therefore each launched a full
 * Playwright suite believing they held the only lock — which on a 16 GB box
 * exhausts memory and takes the whole desktop down.
 *
 * Coordination state now lives in one directory shared by every worktree and
 * clone (~/.wb-starter by default, WB_TEST_LOCK_DIR to override). Per-run output
 * (test-status.json, test-results.json) deliberately stays per-worktree.
 *
 * Every claim is made with the "wx" open flag so create-if-absent is a single
 * atomic syscall. An existsSync check followed by a write is a race that two
 * launchers starting together can both win — which is precisely the failure
 * this module exists to prevent.
 */

import { writeFile, readFile, unlink, mkdir, readdir } from "fs/promises";
import { join } from "path";
import { homedir, freemem } from "os";

/** How long a launcher may hold the lock before recording its monitor PID. */
const CLAIM_GRACE_MS = 30000;

export function defaultGlobalDir() {
  return process.env.WB_TEST_LOCK_DIR || join(homedir(), ".wb-starter");
}

export function defaultMaxParallelSingle() {
  return Number(process.env.WB_MAX_PARALLEL_SINGLE) || 2;
}

/**
 * Last-ditch floor, deliberately low. The suite lock is the real protection
 * against the #651 pile-up; this only stops a launch into an already-dying
 * machine. Set it too high and it blocks ordinary work (this box idles around
 * 1.4 GB available with the editor open), so people disable it and lose the
 * guard entirely. Note os.freemem() reports AVAILABLE physical memory on
 * Windows, not just unused — reclaimable cache is already counted.
 */
export function defaultMinFreeMb() {
  const raw = process.env.WB_MIN_FREE_MB;
  return raw === undefined || raw === "" ? 800 : Number(raw);
}

export function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Builds the guard set for one worktree.
 *
 * @param {object} opts
 * @param {string} opts.root              This worktree's repo root (for messages).
 * @param {string} [opts.globalDir]       Shared coordination dir.
 * @param {number} [opts.maxParallelSingle]
 * @param {number} [opts.minFreeMb]       0 disables the memory floor.
 * @param {() => number} [opts.freeMemBytes] Injectable, so tests can simulate pressure.
 * @param {(pid: number) => boolean} [opts.isAlive] Injectable liveness check.
 */
export function createGuards(opts) {
  const root = opts.root;
  const globalDir = opts.globalDir || defaultGlobalDir();
  const maxParallelSingle =
    opts.maxParallelSingle === undefined ? defaultMaxParallelSingle() : opts.maxParallelSingle;
  const minFreeMb = opts.minFreeMb === undefined ? defaultMinFreeMb() : opts.minFreeMb;
  const freeMemBytes = opts.freeMemBytes || freemem;
  const isAlive = opts.isAlive || isProcessRunning;

  const lockFile = join(globalDir, "test.lock");
  const slotDir = join(globalDir, "single-slots");

  async function ensureDirs() {
    await mkdir(globalDir, { recursive: true });
    await mkdir(slotDir, { recursive: true });
  }

  async function removeLock() {
    try { await unlink(lockFile); } catch (e) { /* ignore */ }
  }

  async function readJson(path) {
    try {
      return JSON.parse(await readFile(path, "utf-8"));
    } catch (e) {
      return null;
    }
  }

  /** @returns {string|null} an error message when memory is too tight. */
  function checkMemory() {
    if (!(minFreeMb > 0)) return null;
    const free = Math.round(freeMemBytes() / (1024 * 1024));
    if (free >= minFreeMb) return null;
    return (
      `Only ${free} MB free physical memory (floor is ${minFreeMb} MB).\n` +
      `   Launching now risks exhausting the machine. Wait for other runs to ` +
      `finish, or override with WB_MIN_FREE_MB.`
    );
  }

  /**
   * Claims the machine-wide suite lock.
   * @returns {Promise<string|null>} null on success, else why it was refused.
   */
  async function acquireSuiteLock(startedAt, command) {
    await ensureDirs();
    const payload = JSON.stringify({ pid: null, root, startedAt, command }, null, 2);

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await writeFile(lockFile, payload, { flag: "wx" });
        return null;
      } catch (e) {
        if (e.code !== "EEXIST") throw e;
      }

      const held = await readJson(lockFile);
      if (!held) {
        console.log("⚠️  Corrupt lock file. Clearing.");
        await removeLock();
        continue;
      }

      if (held.pid && isAlive(held.pid)) {
        return (
          `Tests already running (PID: ${held.pid}, started: ${held.startedAt})\n` +
          `   Holder: ${held.root || "unknown worktree"}\n` +
          `   This lock is machine-wide — poll that worktree's data/test-status.json, ` +
          `or run "npm run test:async -- --stop".`
        );
      }

      // pid === null means a launcher claimed the lock and is still spawning its
      // monitor. Honour that only while it is fresh, so a launcher killed
      // mid-spawn cannot wedge the lock permanently.
      if (!held.pid) {
        const ageMs = Date.now() - new Date(held.startedAt).getTime();
        if (ageMs >= 0 && ageMs < CLAIM_GRACE_MS) {
          return (
            `Another launcher is starting a suite right now (claimed ` +
            `${Math.round(ageMs / 1000)}s ago from ${held.root || "unknown worktree"}).`
          );
        }
      }

      console.log(`⚠️  Stale lock (holder ${held.pid || "n/a"} dead). Clearing.`);
      await removeLock();
    }

    return "Could not acquire the suite lock after clearing a stale one.";
  }

  /** Records the real monitor PID once the launcher has spawned it. */
  async function bindSuiteLock(monitorPid, extra) {
    const held = (await readJson(lockFile)) || {};
    await writeFile(
      lockFile,
      JSON.stringify({ ...held, ...extra, pid: monitorPid, root }, null, 2)
    );
  }

  /**
   * Claims one of the machine-wide single-run slots.
   * @returns {Promise<string|null>} the slot path, or null when all are busy.
   */
  async function acquireSingleSlot(specFile) {
    await ensureDirs();
    const payload = () => JSON.stringify({
      pid: process.pid,
      root,
      specFile,
      startedAt: new Date().toISOString(),
    }, null, 2);

    for (let i = 0; i < maxParallelSingle; i++) {
      const slot = join(slotDir, `slot-${i}.json`);
      try {
        await writeFile(slot, payload(), { flag: "wx" });
        return slot;
      } catch (e) {
        if (e.code !== "EEXIST") throw e;
      }

      // Occupied — reap it if the holder is gone, then retry this slot once.
      const held = await readJson(slot);
      if (!held || !held.pid || !isAlive(held.pid)) {
        try { await unlink(slot); } catch (e) { /* lost the race, fine */ }
        try {
          await writeFile(slot, payload(), { flag: "wx" });
          return slot;
        } catch (e) {
          if (e.code !== "EEXIST") throw e;
        }
      }
    }

    return null;
  }

  /** Human-readable list of current slot holders, for the refusal message. */
  async function describeSingleSlots() {
    const lines = [];
    let entries = [];
    try {
      entries = await readdir(slotDir);
    } catch (e) {
      return lines;
    }
    for (const name of entries.sort()) {
      const held = await readJson(join(slotDir, name));
      if (held) {
        lines.push(`   ${name}: ${held.specFile || "?"} (PID ${held.pid}, ${held.root})`);
      }
    }
    return lines;
  }

  /** Re-keys a slot to the detached monitor, since the launcher is about to exit. */
  async function bindSlot(slotPath, monitorPid, specFile, startedAt) {
    await writeFile(
      slotPath,
      JSON.stringify({ pid: monitorPid, root, specFile, startedAt }, null, 2)
    );
  }

  /** Finds the slot keyed to this process, so a monitor can free its own. */
  async function findOwnSlot() {
    let entries = [];
    try {
      entries = await readdir(slotDir);
    } catch (e) {
      return null;
    }
    for (const name of entries) {
      const slot = join(slotDir, name);
      const held = await readJson(slot);
      if (held && held.pid === process.pid) return slot;
    }
    return null;
  }

  async function releaseSlot(slotPath) {
    if (!slotPath) return;
    try { await unlink(slotPath); } catch (e) { /* ignore */ }
  }

  return {
    lockFile,
    slotDir,
    maxParallelSingle,
    minFreeMb,
    checkMemory,
    acquireSuiteLock,
    bindSuiteLock,
    removeLock,
    acquireSingleSlot,
    describeSingleSlots,
    bindSlot,
    findOwnSlot,
    releaseSlot,
    readLock: () => readJson(lockFile),
  };
}

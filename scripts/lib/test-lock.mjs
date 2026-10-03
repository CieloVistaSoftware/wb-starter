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
import { watch, readFileSync } from "fs";
import { spawnSync } from "child_process";
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

// ─── PROCESS IDENTITY (#1040) ──────────────────────────────────────
//
// A PID is a number the OS reuses. isProcessRunning(pid) answers "is SOME
// process alive with this number", not "is the process that took this lock
// still alive" -- so when a holder died and Windows handed its PID to an
// unrelated process, the lock read as held forever and every run on the
// machine was refused. Every record that names a PID now also records that
// process's start time, read from the OS when the lock is taken. A recycled
// PID is a different process with a different start time, and cannot fake it.

/** Start times only change by death + recycle, so a short cache only ever errs toward "still held". */
const IDENTITY_TTL_MS = 10_000;
const identityCache = new Map();

/** The OS's start-time stamp for a process, or null when it cannot be read. */
function readProcessStart(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return null;
  if (process.platform === "linux") {
    try {
      // Field 22 (starttime, clock ticks since boot). The command name in
      // field 2 can contain spaces and parens, so split after the LAST ")".
      const stat = readFileSync(`/proc/${pid}/stat`, "utf-8");
      const fields = stat.slice(stat.lastIndexOf(")") + 2).split(" ");
      return fields[19] ? `linux:${fields[19]}` : null;
    } catch {
      return null;
    }
  }
  if (process.platform === "win32") {
    // A process this user cannot query (StartTime is null) yields no output:
    // "cannot tell", which keeps the PID-only answer rather than stealing.
    const r = spawnSync(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command",
        `$p = Get-Process -Id ${pid} -ErrorAction SilentlyContinue; ` +
        "if ($p -and $p.StartTime) { $p.StartTime.ToFileTimeUtc() }"],
      { encoding: "utf-8", windowsHide: true, timeout: 30_000 }
    );
    const out = (r.stdout || "").trim();
    return /^\d+$/.test(out) ? `win32:${out}` : null;
  }
  const r = spawnSync("ps", ["-o", "lstart=", "-p", String(pid)], { encoding: "utf-8", timeout: 30_000 });
  const out = (r.stdout || "").trim();
  return out ? `ps:${out}` : null;
}

/**
 * A stamp that identifies one process for its whole life: the PID plus when it
 * started. null when the OS will not say (the caller then falls back to PID only).
 */
export function processIdentity(pid) {
  const hit = identityCache.get(pid);
  // This process cannot be recycled while it is the one asking.
  if (hit && (pid === process.pid || Date.now() - hit.at < IDENTITY_TTL_MS)) return hit.value;
  const value = readProcessStart(pid);
  if (value !== null) identityCache.set(pid, { value, at: Date.now() });
  return value;
}

/**
 * Is the process that `recordedStart` was recorded for still alive as `pid`?
 * A record without a start (written before #1040, or where the OS would not
 * say) keeps the old PID-only meaning, so nothing live is ever robbed of a lock.
 *
 * @param {number} pid
 * @param {string|null|undefined} recordedStart
 * @param {(pid: number) => boolean} [isAlive]
 * @param {(pid: number) => string|null} [identityOf]
 */
export function isSameProcess(pid, recordedStart, isAlive = isProcessRunning, identityOf = processIdentity) {
  if (!pid || !isAlive(pid)) return false;
  if (!recordedStart) return true;
  const now = identityOf(pid);
  return now === null || now === recordedStart;
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
 * @param {(pid: number) => string|null} [opts.identityOf] Injectable process-identity read (#1040).
 */
export function createGuards(opts) {
  const root = opts.root;
  const globalDir = opts.globalDir || defaultGlobalDir();
  const maxParallelSingle =
    opts.maxParallelSingle === undefined ? defaultMaxParallelSingle() : opts.maxParallelSingle;
  const minFreeMb = opts.minFreeMb === undefined ? defaultMinFreeMb() : opts.minFreeMb;
  const freeMemBytes = opts.freeMemBytes || freemem;
  const isAlive = opts.isAlive || isProcessRunning;
  const identityOf = opts.identityOf || processIdentity;
  /** The record's holder is the SAME process that took it -- not a recycled PID (#1040). */
  const holderAlive = (held) => !!held && isSameProcess(held.pid, held.pidStart, isAlive, identityOf);
  // One re-check per hold, for a holder that died WITHOUT releasing: that
  // produces no filesystem event, so without this a subscriber would be
  // stranded. It is a single timer, not a poll -- nothing runs while it waits.
  const staleCheckMs = opts.staleCheckMs === undefined ? 2 * 60 * 1000 : opts.staleCheckMs;

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

  // ONE MACHINE, BOTH KINDS OF RUN (#1106).
  //
  // A suite and a single run were each checked only against their own kind:
  // acquireSuiteLock never looked at the slots, and acquireSingleSlot never
  // looked at the suite lock. So a single run launched during a commit gate
  // was admitted beside it, the two fought over the dev-server port, and the
  // gate hung for five hours. scripts/lock-permutations.schema.json is the
  // exhaustive matrix that found it; these two readers are the fix.

  /** A suite is live if its holder is alive, or it is a fresh unbound claim. */
  async function liveSuite() {
    const held = await readJson(lockFile);
    if (!held) return null;                       // absent or unreadable: not live
    if (held.pid) return holderAlive(held) ? held : null;
    const ageMs = Date.now() - new Date(held.startedAt).getTime();
    return ageMs >= 0 && ageMs < CLAIM_GRACE_MS ? held : null;
  }

  /** Slots whose holder is still alive. Dead holders do not count. */
  async function liveSingles() {
    let entries = [];
    try { entries = await readdir(slotDir); } catch { return []; }
    const live = [];
    for (const name of entries) {
      const held = await readJson(join(slotDir, name));
      if (held && held.pid && holderAlive(held)) live.push(held);
    }
    return live;
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

    const singles = await liveSingles();
    if (singles.length) {
      return (
        `${singles.length} single-spec run(s) already hold the machine:\n` +
        singles.map((h) => `   ${h.specFile || "?"} (PID ${h.pid}, ${h.root})`).join("\n")
      );
    }
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

      if (held.pid && holderAlive(held)) {
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

      console.log(`⚠️  Stale lock (holder ${held.pid || "n/a"} dead, or its PID now belongs to another process). Clearing.`);
      await removeLock();
    }

    return "Could not acquire the suite lock after clearing a stale one.";
  }

  /** Records the real monitor PID once the launcher has spawned it. */
  async function bindSuiteLock(monitorPid, extra) {
    const held = (await readJson(lockFile)) || {};
    await writeFile(
      lockFile,
      JSON.stringify({ ...held, ...extra, pid: monitorPid, pidStart: identityOf(monitorPid), root }, null, 2)
    );
  }

  /**
   * Claims one of the machine-wide single-run slots.
   * @returns {Promise<string|null>} the slot path, or null when all are busy.
   */
  async function acquireSingleSlot(specFile) {
    await ensureDirs();

    // A suite owns the whole machine. Returning null here is the same answer
    // as "every slot is busy" -- the caller is held, and is told why by
    // describeSingleSlots() / readLock().
    if (await liveSuite()) return null;
    const payload = () => JSON.stringify({
      pid: process.pid,
      pidStart: identityOf(process.pid),
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
      if (!held || !held.pid || !holderAlive(held)) {
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
      JSON.stringify({ pid: monitorPid, pidStart: identityOf(monitorPid), root, specFile, startedAt }, null, 2)
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

  /**
   * Subscribe to a release of the machine. Resolves on any change in the lock
   * directory or the slot directory -- a released lock or slot is a file
   * deleted there -- or, once, after staleCheckMs if the holder died silently.
   * Zero CPU while it is pending: fs.watch and one timer, no loop.
   */
  function subscribeToRelease() {
    let settle;
    const promise = new Promise((resolve) => { settle = resolve; });
    const watchers = [];
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      for (const w of watchers) { try { w.close(); } catch { /* already closed */ } }
      settle();
    };
    for (const dir of [globalDir, slotDir]) {
      try { watchers.push(watch(dir, finish)); } catch { /* dir not there yet */ }
    }
    const timer = setTimeout(finish, staleCheckMs);
    return { promise, cancel: finish };
  }

  /**
   * Try, and if refused, wait for a release notification and try again --
   * until `timeoutMs` has passed (#1128).
   *
   * The subscription is armed BEFORE the attempt, so a release that lands
   * between a refusal and the subscribe cannot be missed. John: "try -- if
   * locked -- wait for notification. Waiting for notification requires no CPU."
   *
   * THE WAIT HAS AN END. A holder that is alive but stuck never releases and
   * never goes stale, so without a deadline the waiter waited forever -- a
   * commit stalled behind someone else's hang. The deadline is one timer, not
   * a poll; one last attempt runs when it fires.
   *
   * @param {() => Promise<{got: any, why?: string}>} attempt
   * @param {(why: string) => void} [onHeld] told each time it is held, with the reason
   * @param {number} [timeoutMs] omitted = no deadline
   * @returns {Promise<{got: any, why: string|null}>} got is falsy when the deadline passed
   */
  async function waitForMachine(attempt, onHeld, timeoutMs) {
    await ensureDirs();
    const deadline = Number.isFinite(timeoutMs) ? Date.now() + Math.max(0, timeoutMs) : Infinity;
    for (;;) {
      const release = subscribeToRelease();
      const first = await attempt();
      if (first.got) { release.cancel(); return { got: first.got, why: null }; }
      const left = deadline - Date.now();
      if (left <= 0) { release.cancel(); return { got: null, why: first.why }; }
      if (onHeld) onHeld(first.why);
      if (deadline === Infinity) { await release.promise; continue; }

      let timer;
      const expired = new Promise((res) => { timer = setTimeout(() => res(true), left); });
      const timedOut = await Promise.race([release.promise.then(() => false), expired]);
      clearTimeout(timer);
      release.cancel();
      if (timedOut) {
        const last = await attempt();
        return last.got ? { got: last.got, why: null } : { got: null, why: last.why };
      }
    }
  }

  /**
   * Take the machine for a suite, or be notified when it is free and take it then.
   * @returns {Promise<string|null>} null once held; the last refusal if `timeoutMs` passed first
   */
  async function acquireSuiteLockOnRelease(startedAt, command, onHeld, { timeoutMs } = {}) {
    const r = await waitForMachine(async () => {
      const denied = await acquireSuiteLock(startedAt, command);
      return { got: denied === null, why: denied };
    }, onHeld, timeoutMs);
    return r.got ? null : r.why;
  }

  /** Why a single run is being held right now, naming the holder. */
  async function describeSingleRefusal() {
    const suite = await liveSuite();
    if (suite) {
      return `A suite holds the machine (PID ${suite.pid || "starting"}, ${suite.command || "suite"}, ` +
        `from ${suite.root || "unknown worktree"}). A single run cannot share it.`;
    }
    return `All ${maxParallelSingle} single-run slots are busy machine-wide:\n` +
      (await describeSingleSlots()).join("\n");
  }

  /**
   * Take a single-run slot, or be notified when one is free (#1128).
   * @returns {Promise<{slot: string|null, why: string|null}>} slot is null if `timeoutMs` passed first
   */
  async function acquireSingleSlotOnRelease(specFile, onHeld, { timeoutMs } = {}) {
    const r = await waitForMachine(async () => {
      const slot = await acquireSingleSlot(specFile);
      return slot ? { got: slot } : { got: null, why: await describeSingleRefusal() };
    }, onHeld, timeoutMs);
    return { slot: r.got || null, why: r.why };
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
    acquireSuiteLockOnRelease,
    acquireSingleSlotOnRelease,
  };
}

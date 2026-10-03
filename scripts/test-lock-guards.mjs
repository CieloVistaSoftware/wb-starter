/**
 * test-lock-guards.mjs — regression tests for the machine-wide test guards (#651).
 *
 * The bug: the suite lock lived at <ROOT>/data/test.lock, and ROOT was derived
 * from the running script's own path. Every git worktree has its own scripts/
 * copy, so every worktree got its own private lock — five agents each launched a
 * full Playwright suite believing they were alone, and the machine froze.
 *
 * These tests drive the guard module directly (no Playwright, no dev server), so
 * they run in milliseconds and can be part of `npm test`.
 *
 * Run: npm run test:lock-guards
 */

import { mkdtemp, rm, writeFile, readdir, readFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { performance } from "perf_hooks";
import { spawn } from "child_process";
import { createGuards } from "./lib/test-lock.mjs";

let passed = 0;
let failed = 0;

function check(name, condition, detail) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    console.log(`  ❌ ${name}`);
    if (detail) console.log(`     ${detail}`);
  }
}

/** A PID that is certainly not running, for simulating a dead holder. */
const DEAD_PID = 0x7ffffffe;

/**
 * A PID that is ALIVE and is not the holder: the OS handed the dead holder's
 * number to someone else (#1040). The hard half of that bug — a dead PID is
 * caught by process.kill(pid, 0), a recycled one never is.
 */
const RECYCLED_PID = 0x7ffffffd;

/** Alive, but the OS will not say when it started (StartTime unreadable). */
const UNVERIFIABLE_PID = 0x7ffffffc;

/** What a record claims its holder was, for the arranged identity states. */
const HOLDER_IDENTITY = "test:the-holder";

const HOUR_MS = 60 * 60 * 1000;

/** One identity source for the arranged states, as the real OS read is. */
function fakeIdentityOf(pid) {
  if (pid === RECYCLED_PID) return "test:a-stranger";   // not HOLDER_IDENTITY
  if (pid === UNVERIFIABLE_PID) return null;            // "cannot tell"
  return `test:pid-${pid}`;                             // every other PID is itself
}

/** Simulates two worktrees of the same repo sharing one coordination dir. */
function twoWorktrees(globalDir, overrides = {}) {
  const base = {
    globalDir,
    minFreeMb: 0, // memory floor tested separately
    isAlive: (pid) => pid !== DEAD_PID,
    identityOf: fakeIdentityOf,
    ...overrides,
  };
  return [
    createGuards({ ...base, root: "C:/repo/.claude/worktrees/agent-A" }),
    createGuards({ ...base, root: "C:/repo/.claude/worktrees/agent-B" }),
  ];
}

async function withTempDir(fn) {
  const dir = await mkdtemp(join(tmpdir(), "x-lock-test-"));
  try {
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

// ─── THE REGRESSION ────────────────────────────────────────────────
// This is the test that would have failed before the fix.
async function testSuiteLockIsMachineWide() {
  console.log("\nSuite lock is machine-wide, not per-worktree:");

  await withTempDir(async (dir) => {
    const [a, b] = twoWorktrees(dir);

    const aDenied = await a.acquireSuiteLock(new Date().toISOString(), "npx playwright test");
    check("worktree A acquires the lock", aDenied === null, aDenied);

    // A's launcher hands the lock to its monitor, as the real launcher does.
    await a.bindSuiteLock(process.pid, { command: "npx playwright test" });

    const bDenied = await b.acquireSuiteLock(new Date().toISOString(), "npx playwright test");
    check(
      "worktree B is REFUSED while A holds it",
      typeof bDenied === "string" && bDenied.includes("already running"),
      `got: ${JSON.stringify(bDenied)}`
    );
    check(
      "refusal names the holding worktree",
      typeof bDenied === "string" && bDenied.includes("agent-A"),
      `got: ${JSON.stringify(bDenied)}`
    );

    await a.removeLock();
    const bAfter = await b.acquireSuiteLock(new Date().toISOString(), "npx playwright test");
    check("worktree B acquires it once A releases", bAfter === null, bAfter);
  });
}

async function testBothWorktreesUseTheSameLockFile() {
  console.log("\nBoth worktrees resolve to one lock path:");

  await withTempDir(async (dir) => {
    const [a, b] = twoWorktrees(dir);
    check("lock paths are identical", a.lockFile === b.lockFile, `${a.lockFile} vs ${b.lockFile}`);
    check("lock lives outside any worktree", !a.lockFile.includes("worktrees"), a.lockFile);
  });
}

async function testStaleLockIsReclaimed() {
  console.log("\nA dead holder does not wedge the lock:");

  await withTempDir(async (dir) => {
    const [a, b] = twoWorktrees(dir);
    await a.acquireSuiteLock(new Date().toISOString(), "npx playwright test");
    await a.bindSuiteLock(DEAD_PID, { command: "npx playwright test" });

    const bDenied = await b.acquireSuiteLock(new Date().toISOString(), "npx playwright test");
    check("stale lock is cleared and re-acquired", bDenied === null, bDenied);

    const held = await b.readLock();
    check("lock now records the new holder", held && held.root.includes("agent-B"), JSON.stringify(held));
  });
}

async function testUnboundClaimIsHonouredThenExpires() {
  console.log("\nA launcher mid-spawn (pid null) is honoured, but not forever:");

  await withTempDir(async (dir) => {
    const [a, b] = twoWorktrees(dir);
    await a.acquireSuiteLock(new Date().toISOString(), "npx playwright test");

    const fresh = await b.acquireSuiteLock(new Date().toISOString(), "npx playwright test");
    check(
      "a fresh unbound claim blocks others",
      typeof fresh === "string" && fresh.includes("starting a suite right now"),
      `got: ${JSON.stringify(fresh)}`
    );

    // Same claim, but stamped long enough ago that the launcher must be dead.
    const ancient = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    await writeFile(
      a.lockFile,
      JSON.stringify({ pid: null, root: "C:/repo/.claude/worktrees/agent-A", startedAt: ancient }, null, 2)
    );
    const reclaimed = await b.acquireSuiteLock(new Date().toISOString(), "npx playwright test");
    check("an abandoned unbound claim expires", reclaimed === null, reclaimed);
  });
}

async function testCorruptLockIsCleared() {
  console.log("\nA corrupt lock file is cleared, not fatal:");

  await withTempDir(async (dir) => {
    const [a, b] = twoWorktrees(dir);
    await a.acquireSuiteLock(new Date().toISOString(), "npx playwright test");
    await writeFile(a.lockFile, "{ this is not json");

    const denied = await b.acquireSuiteLock(new Date().toISOString(), "npx playwright test");
    check("corrupt lock is replaced", denied === null, denied);
  });
}

// ─── SINGLE-RUN SEMAPHORE ──────────────────────────────────────────
async function testSingleRunsAreCapped() {
  console.log("\nSingle-spec runs are capped machine-wide:");

  await withTempDir(async (dir) => {
    const [a, b] = twoWorktrees(dir, { maxParallelSingle: 2 });

    const first = await a.acquireSingleSlot("tests/a.spec.ts");
    const second = await b.acquireSingleSlot("tests/b.spec.ts");
    check("first single run gets a slot", first !== null);
    check("second single run gets a slot", second !== null);
    check("the two slots are different", first !== second, `${first} vs ${second}`);

    const third = await a.acquireSingleSlot("tests/c.spec.ts");
    check("third single run is REFUSED at the cap", third === null, `got: ${third}`);

    const holders = await a.describeSingleSlots();
    check("refusal can name both holders", holders.length === 2, JSON.stringify(holders));

    await a.releaseSlot(first);
    const fourth = await a.acquireSingleSlot("tests/d.spec.ts");
    check("a freed slot is reusable", fourth !== null);
  });
}

async function testDeadSingleHolderIsReaped() {
  console.log("\nA dead single-run holder is reaped:");

  await withTempDir(async (dir) => {
    const [a] = twoWorktrees(dir, { maxParallelSingle: 1 });
    const slot = await a.acquireSingleSlot("tests/a.spec.ts");
    check("slot acquired", slot !== null);

    // Simulate the holder dying without releasing.
    await writeFile(
      slot,
      JSON.stringify({ pid: DEAD_PID, root: "C:/repo", specFile: "tests/a.spec.ts" }, null, 2)
    );

    const next = await a.acquireSingleSlot("tests/b.spec.ts");
    check("dead holder's slot is reclaimed", next !== null, `got: ${next}`);
  });
}

async function testSlotsLiveOutsideTheWorktree() {
  console.log("\nSlot directory is shared, not per-worktree:");

  await withTempDir(async (dir) => {
    const [a, b] = twoWorktrees(dir, { maxParallelSingle: 2 });
    check("slot dirs are identical", a.slotDir === b.slotDir, `${a.slotDir} vs ${b.slotDir}`);

    await a.acquireSingleSlot("tests/a.spec.ts");
    const seenFromB = await readdir(b.slotDir);
    check("worktree B sees worktree A's slot", seenFromB.length === 1, JSON.stringify(seenFromB));
  });
}

// ─── CROSS-KIND: the pair nobody put together (#1106) ──────────────
// Every test above holds ONE kind of run against its own kind: suite vs suite,
// single vs single. None puts a suite and a single run on the machine at the
// same time -- the exact mistake scripts/lib/pairwise.mjs's header describes
// ("ONE attribute at a time -- so no two attributes were ever set together").
// That missing pair is the collision that hung a commit gate for five hours on
// 2026-09-10: a single-spec run launched while the gate's suite was running,
// and nothing refused it, because acquireSingleSlot never reads the suite lock
// and acquireSuiteLock never reads the slots.
// Step 2 of the method: one simple case that must work before any permutation
// is worth generating. If this fails, every generated case below is noise.
async function testSimpleWorkingCase() {
  console.log("\nSimple working case -- an idle machine admits a suite:");

  await withTempDir(async (dir) => {
    const [a] = twoWorktrees(dir);
    const denied = await a.acquireSuiteLock(new Date().toISOString(), "suite");
    check("a suite acquires an idle machine", denied === null, denied);
    await a.removeLock();
    const again = await a.acquireSuiteLock(new Date().toISOString(), "suite");
    check("and can acquire it again once released", again === null, again);
  });
}

// Steps 3-4: every case comes from scripts/lock-permutations.schema.json. The
// cases are not chosen here -- the schema declares every value, including the
// min, max and edges, and this only sets each one up and asks the oracle.
const LOCK_SCHEMA = JSON.parse(
  await readFile(new URL("./lock-permutations.schema.json", import.meta.url), "utf8")
);

/** Put the machine into one declared `existing` state. */
async function arrange(state, holder) {
  const iso = (msAgo) => new Date(Date.now() - msAgo).toISOString();
  const lockFile = holder.lockFile;
  switch (state.id) {
    case "idle":
      return;
    case "suite-live":
      await holder.acquireSuiteLock(iso(0), "holder");
      await holder.bindSuiteLock(process.pid, {});
      return;
    case "suite-dead":
      await holder.acquireSuiteLock(iso(0), "holder");
      await holder.bindSuiteLock(DEAD_PID, {});
      return;
    case "suite-unbound-fresh":
      await writeFile(lockFile, JSON.stringify({ pid: null, root: "C:/other", startedAt: iso(0), command: "x" }));
      return;
    case "suite-unbound-expired":
      await writeFile(lockFile, JSON.stringify({ pid: null, root: "C:/other", startedAt: iso(10 * 60 * 1000), command: "x" }));
      return;
    case "lock-corrupt":
      await writeFile(lockFile, "{ this is not json");
      return;
    case "single-one":
      await holder.acquireSingleSlot("tests/held.spec.ts");
      return;
    case "single-cap":
      for (let i = 0; i < LOCK_SCHEMA.maxParallelSingle; i++) {
        await holder.acquireSingleSlot(`tests/held-${i}.spec.ts`);
      }
      return;
    case "single-dead": {
      const slot = await holder.acquireSingleSlot("tests/held.spec.ts");
      await holder.bindSlot(slot, DEAD_PID, "tests/held.spec.ts", iso(0));
      return;
    }
    case "suite-recycled-pid":
      // The PID is alive; the identity recorded with it is not that process's.
      await writeFile(lockFile, JSON.stringify({
        pid: RECYCLED_PID, pidStart: HOLDER_IDENTITY,
        root: "C:/other", startedAt: iso(HOUR_MS), command: "x",
      }));
      return;
    case "single-recycled-pid": {
      const slot = await holder.acquireSingleSlot("tests/held.spec.ts");
      await writeFile(slot, JSON.stringify({
        pid: RECYCLED_PID, pidStart: HOLDER_IDENTITY,
        root: "C:/other", specFile: "tests/held.spec.ts", startedAt: iso(HOUR_MS),
      }));
      return;
    }
    case "suite-unidentifiable-ancient":
      // Alive, unreadable start time: PID-only, so believed only to the ceiling.
      await writeFile(lockFile, JSON.stringify({
        pid: UNVERIFIABLE_PID, pidStart: HOLDER_IDENTITY,
        root: "C:/other", startedAt: iso(3 * HOUR_MS), command: "x",
      }));
      return;
    default:
      throw new Error(`schema declares an existing state with no arrangement: ${state.id}`);
  }
}

async function testEveryPermutationFromTheSchema() {
  const { existing, arriving } = LOCK_SCHEMA.parameters;
  const total = existing.values.length * arriving.values.length;
  console.log(`\nEvery permutation from lock-permutations.schema.json (${total} cases):`);

  for (const state of existing.values) {
    for (const who of arriving.values) {
      await withTempDir(async (dir) => {
        const [holder, arriver] = twoWorktrees(dir, {
          maxParallelSingle: LOCK_SCHEMA.maxParallelSingle,
        });
        await arrange(state, holder);

        const blocks = who.id === "suite" ? state.blocksSuite : state.blocksSingle;
        const expectProceed = !blocks;

        let proceeded;
        if (who.id === "suite") {
          proceeded = (await arriver.acquireSuiteLock(new Date().toISOString(), "arriving")) === null;
        } else {
          proceeded = (await arriver.acquireSingleSlot("tests/arriving.spec.ts")) !== null;
        }

        const edge = state.edge ? ` [${state.edge}]` : "";
        check(
          `${who.id} arriving on ${state.id}${edge} -> ${expectProceed ? "proceeds" : "notified on release"}`,
          proceeded === expectProceed,
          `expected ${expectProceed ? "to proceed" : "to be held for the release notification"}, but it ${proceeded ? "proceeded" : "was held"}`
        );
      });
    }
  }
}

async function testSubscriberIsNotifiedOnRelease() {
  console.log("\nA blocked run SUBSCRIBES to the release and is notified -- no polling:");

  await withTempDir(async (dir) => {
    const [holder, subscriber] = twoWorktrees(dir, { staleCheckMs: 60_000 });
    await holder.acquireSuiteLock(new Date().toISOString(), "holder");
    await holder.bindSuiteLock(process.pid, {});

    if (typeof subscriber.acquireSuiteLockOnRelease !== "function") {
      check("acquireSuiteLockOnRelease exists", false, "no release notification API -- a blocked run can only be refused");
      return;
    }

    let notified = false;
    const subscribed = subscriber
      .acquireSuiteLockOnRelease(new Date().toISOString(), "subscriber")
      .then(() => { notified = true; });

    await new Promise((r) => setTimeout(r, 300));
    check("subscriber is held while the holder runs", notified === false);

    // The backstop is 60s, so anything that wakes it inside 3s was the
    // filesystem notification of the release, not a timer.
    await holder.removeLock();
    const wasNotified = await Promise.race([
      subscribed.then(() => true),
      new Promise((r) => setTimeout(() => r(false), 3000)),
    ]);
    check("subscriber is notified by the release, not by a timer", wasNotified === true);
  });
}

async function testSubscriberIsNotStrandedByADeadHolder() {
  console.log("\nA subscriber behind a holder that died is not stranded:");

  await withTempDir(async (dir) => {
    const [dead, subscriber] = twoWorktrees(dir, { staleCheckMs: 200 });
    await dead.acquireSuiteLock(new Date().toISOString(), "dead");
    await dead.bindSuiteLock(DEAD_PID, {});

    if (typeof subscriber.acquireSuiteLockOnRelease !== "function") {
      check("acquireSuiteLockOnRelease exists", false, "no release notification API");
      return;
    }

    // A holder that dies without removing its lock produces no filesystem
    // event. The backstop re-check is what lets acquireSuiteLock's stale-lock
    // clearing run -- nothing dies silently, and nothing waits forever.
    const got = await Promise.race([
      subscriber.acquireSuiteLockOnRelease(new Date().toISOString(), "subscriber").then(() => true),
      new Promise((r) => setTimeout(() => r(false), 3000)),
    ]);
    check("subscriber acquires once the dead holder's lock is found stale", got === true);
  });
}

// ─── THE WAIT ENDS, AND SINGLES WAIT TOO (#1128) ───────────────────
// A holder that is alive but stuck never releases and never goes stale, so a
// subscriber without a deadline waited forever. And a single run could only be
// refused, never notified -- so the per-commit spec runs had nothing to wait on.
async function testSubscriberGivesUpAtItsDeadline() {
  console.log("\nA subscriber behind a live holder that never releases gives up at its deadline:");

  await withTempDir(async (dir) => {
    const [holder, subscriber] = twoWorktrees(dir, { staleCheckMs: 60_000 });
    await holder.acquireSuiteLock(new Date().toISOString(), "stuck holder");
    await holder.bindSuiteLock(process.pid, {});

    const began = performance.now();
    const outcome = await Promise.race([
      subscriber.acquireSuiteLockOnRelease(new Date().toISOString(), "subscriber", null, { timeoutMs: 300 }),
      new Promise((r) => setTimeout(() => r("never returned"), 3000)),
    ]);
    check("it returns a refusal naming the holder, not the lock",
      typeof outcome === "string" && outcome.includes("agent-A"), `got: ${JSON.stringify(outcome)}`);
    // A timer may fire a millisecond or so before the wall clock has advanced by its
    // full duration (the event loop schedules against a cached clock), so CI measured
    // 299ms against a 300ms deadline (#1296). This check exists to catch a subscriber
    // that gives up at once or far too soon, so it asks for the deadline minus a small
    // named slop, not for an exact lower bound the platform does not promise.
    const TIMER_SLOP_MS = 5;
    const waited = performance.now() - began;
    check("and returns at the deadline, not before", waited >= 300 - TIMER_SLOP_MS, `${waited.toFixed(1)}ms`);
    const held = await holder.readLock();
    check("the holder's lock is untouched", held && held.pid === process.pid, JSON.stringify(held));
  });
}

async function testSingleSubscriberIsNotifiedOnRelease() {
  console.log("\nA single run held by a suite SUBSCRIBES and is notified on release:");

  await withTempDir(async (dir) => {
    const [holder, subscriber] = twoWorktrees(dir, { staleCheckMs: 60_000 });
    await holder.acquireSuiteLock(new Date().toISOString(), "holder");
    await holder.bindSuiteLock(process.pid, {});

    if (typeof subscriber.acquireSingleSlotOnRelease !== "function") {
      check("acquireSingleSlotOnRelease exists", false, "a single run can only be refused, never notified");
      return;
    }
    let told = "";
    const pending = subscriber.acquireSingleSlotOnRelease("tests/x.spec.ts", (why) => { told = why; }, { timeoutMs: 10_000 });
    await new Promise((r) => setTimeout(r, 300));
    check("it is told why it is held, naming the suite", told.includes("A suite holds the machine"), `told: ${JSON.stringify(told)}`);

    await holder.removeLock();
    const got = await Promise.race([pending, new Promise((r) => setTimeout(() => r(null), 3000))]);
    check("the release notifies it and it gets a slot", !!got && typeof got.slot === "string", JSON.stringify(got));
  });
}

// ─── A RECYCLED PID IS NOT THE HOLDER (#1040) ──────────────────────
// Liveness used to be process.kill(pid, 0) alone: "is SOME process alive with
// this number". When a holder dies and the OS hands its PID to an unrelated
// process, that check calls the lock held forever and every run on the machine
// is refused. These tests use the REAL liveness check -- no injected isAlive --
// and real processes, all against a temp lock directory, never ~/.wb-starter.

/** Starts a real, unrelated, long-lived process. */
function startIdleProcess() {
  const child = spawn(process.execPath, ["-e", "setInterval(() => {}, 1 << 30)"], {
    stdio: "ignore",
    windowsHide: true,
  });
  return child;
}

async function stopProcess(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const exited = new Promise((r) => child.once("exit", r));
  child.kill();
  await exited;
}

/**
 * How long the simulated holder runs. A recycled PID can only go to a process
 * started AFTER the holder died, so the stranger must start later than the
 * holder by more than the coarsest start-time clock this runs on: Linux counts
 * /proc starttime in 10ms ticks, and `ps -o lstart` has 1s resolution. CI
 * caught the first version spawning both inside one tick.
 */
const HOLDER_LIFETIME_MS = 1100;

/**
 * Binds `bind` to a real holder process, lets that holder run and die, then
 * starts an unrelated process and gives the holder's record its PID -- exactly
 * what the file looks like after the OS recycles the dead holder's PID.
 * @returns the stranger, which the caller must stop.
 */
async function recycleOntoStranger(file, bind) {
  const holder = startIdleProcess();
  try {
    await bind(holder.pid);
    await new Promise((r) => setTimeout(r, HOLDER_LIFETIME_MS));
  } finally {
    await stopProcess(holder);
  }
  const stranger = startIdleProcess();
  const record = JSON.parse(await readFile(file, "utf-8"));
  record.pid = stranger.pid;
  await writeFile(file, JSON.stringify(record, null, 2));
  return stranger;
}

async function testRecycledPidDoesNotWedgeTheSuiteLock() {
  console.log("\nA suite lock whose PID now belongs to an unrelated live process is reclaimed:");

  let stranger = null;
  try {
    await withTempDir(async (dir) => {
      const opts = { globalDir: dir, minFreeMb: 0, maxParallelSingle: 1 };
      const a = createGuards({ ...opts, root: "C:/repo/.claude/worktrees/agent-A" });
      const b = createGuards({ ...opts, root: "C:/repo/.claude/worktrees/agent-B" });

      await a.acquireSuiteLock(new Date().toISOString(), "npx playwright test");
      stranger = await recycleOntoStranger(a.lockFile, (pid) => a.bindSuiteLock(pid, { command: "npx playwright test" }));

      const single = await b.acquireSingleSlot("tests/arriving.spec.ts");
      check("a single run is not held by the recycled PID", single !== null, `got: ${single}`);
      if (single) await b.releaseSlot(single);

      const denied = await b.acquireSuiteLock(new Date().toISOString(), "npx playwright test");
      check("a suite reclaims the lock from the recycled PID", denied === null, denied);
      const held = await b.readLock();
      check("the lock now records the new holder", held && held.root && held.root.includes("agent-B"), JSON.stringify(held));
    });
  } finally {
    if (stranger) await stopProcess(stranger);
  }
}

async function testRecycledPidDoesNotWedgeASingleSlot() {
  console.log("\nA single-run slot whose PID now belongs to an unrelated live process is reaped:");

  let stranger = null;
  try {
    await withTempDir(async (dir) => {
      const opts = { globalDir: dir, minFreeMb: 0, maxParallelSingle: 1 };
      const a = createGuards({ ...opts, root: "C:/repo/.claude/worktrees/agent-A" });
      const b = createGuards({ ...opts, root: "C:/repo/.claude/worktrees/agent-B" });

      const slot = await a.acquireSingleSlot("tests/held.spec.ts");
      stranger = await recycleOntoStranger(slot, (pid) => a.bindSlot(slot, pid, "tests/held.spec.ts", new Date().toISOString()));

      const denied = await b.acquireSuiteLock(new Date().toISOString(), "npx playwright test");
      check("a suite is not held by the recycled slot", denied === null, denied);
      await b.removeLock();

      const next = await b.acquireSingleSlot("tests/arriving.spec.ts");
      check("a single run reaps the recycled slot", next !== null, `got: ${next}`);
    });
  } finally {
    if (stranger) await stopProcess(stranger);
  }
}

async function testLiveHolderIsStillHonoured() {
  console.log("\nThe real holder, alive and unchanged, still holds the lock:");

  const holder = startIdleProcess();
  try {
    await withTempDir(async (dir) => {
      const opts = { globalDir: dir, minFreeMb: 0, maxParallelSingle: 1 };
      const a = createGuards({ ...opts, root: "C:/repo/.claude/worktrees/agent-A" });
      const b = createGuards({ ...opts, root: "C:/repo/.claude/worktrees/agent-B" });

      await a.acquireSuiteLock(new Date().toISOString(), "npx playwright test");
      await a.bindSuiteLock(holder.pid, { command: "npx playwright test" });
      const denied = await b.acquireSuiteLock(new Date().toISOString(), "npx playwright test");
      check("a suite is refused while the real holder runs",
        typeof denied === "string" && denied.includes("already running"), `got: ${JSON.stringify(denied)}`);
      check("a single run is held while the real holder runs",
        (await b.acquireSingleSlot("tests/arriving.spec.ts")) === null);

      // A lock written before the identity was recorded (no pidStart) keeps the
      // old PID-only meaning, so a run already holding the machine when this
      // change lands is not robbed of it.
      const legacy = await a.readLock();
      delete legacy.pidStart;
      await writeFile(a.lockFile, JSON.stringify(legacy, null, 2));
      const legacyDenied = await b.acquireSuiteLock(new Date().toISOString(), "npx playwright test");
      check("a legacy lock with a live PID is still honoured",
        typeof legacyDenied === "string" && legacyDenied.includes("already running"), `got: ${JSON.stringify(legacyDenied)}`);
    });
  } finally {
    await stopProcess(holder);
  }
}

// ─── AND WHEN IDENTITY CANNOT BE PROVEN AT ALL (#1040) ─────────────
// isSameProcess answers PID-only for a record with no pidStart, and for one
// naming a process the OS will not describe. That is the right answer during
// the transition -- it never robs a live run -- but PID-only is exactly what a
// recycled PID fakes, so believing it without end leaves the wedge in place:
// the machine refusing every run, naming a stranger, until a human clears the
// file. The ceiling is how long that answer is worth believing.
async function testUnidentifiableHolderIsBelievedButNotForever() {
  console.log("\nA holder the OS will not identify is believed, but not forever:");

  await withTempDir(async (dir) => {
    const [, b] = twoWorktrees(dir, { maxHoldMs: 2 * HOUR_MS });
    const lockOf = (ageMs, extra = {}) => JSON.stringify({
      pid: UNVERIFIABLE_PID, pidStart: HOLDER_IDENTITY,
      root: "C:/repo/.claude/worktrees/agent-A",
      startedAt: new Date(Date.now() - ageMs).toISOString(),
      command: "npx playwright test", ...extra,
    }, null, 2);

    await writeFile(b.lockFile, lockOf(10 * 60 * 1000));
    const fresh = await b.acquireSuiteLock(new Date().toISOString(), "arriving");
    check("a 10-minute-old unidentifiable holder still holds the machine",
      typeof fresh === "string" && fresh.includes("already running"), `got: ${JSON.stringify(fresh)}`);

    await writeFile(b.lockFile, lockOf(3 * HOUR_MS));
    const ancient = await b.acquireSuiteLock(new Date().toISOString(), "arriving");
    check("past the ceiling it is stale, so no human has to clear it", ancient === null, ancient);
  });
}

async function testLegacyLockIsHonouredThenCeilinged() {
  console.log("\nA lock written before identities existed: honoured, then ceilinged:");

  await withTempDir(async (dir) => {
    const [, b] = twoWorktrees(dir, { maxHoldMs: 2 * HOUR_MS });
    // No pidStart at all, and a live PID: PID-only, the pre-#1040 format.
    const legacy = (ageMs) => JSON.stringify({
      pid: process.pid,
      root: "C:/repo/.claude/worktrees/agent-A",
      startedAt: new Date(Date.now() - ageMs).toISOString(),
      command: "npx playwright test",
    }, null, 2);

    await writeFile(b.lockFile, legacy(5 * 60 * 1000));
    const fresh = await b.acquireSuiteLock(new Date().toISOString(), "arriving");
    check("a fresh legacy lock is not robbed of the machine",
      typeof fresh === "string" && fresh.includes("already running"), `got: ${JSON.stringify(fresh)}`);

    await writeFile(b.lockFile, legacy(3 * HOUR_MS));
    const ancient = await b.acquireSuiteLock(new Date().toISOString(), "arriving");
    check("a legacy lock older than the ceiling is cleared", ancient === null, ancient);
  });
}

async function testTheCeilingNeverRobsAProvenHolder() {
  console.log("\nThe ceiling never touches a holder whose identity is proven:");

  await withTempDir(async (dir) => {
    const [a, b] = twoWorktrees(dir, { maxHoldMs: 1 });   // ceiling already passed
    await a.acquireSuiteLock(new Date(Date.now() - 4 * HOUR_MS).toISOString(), "holder");
    await a.bindSuiteLock(process.pid, { command: "a very long suite" });

    const held = await a.readLock();
    check("the holder's identity is recorded", held && !!held.pidStart, JSON.stringify(held));

    const denied = await b.acquireSuiteLock(new Date().toISOString(), "arriving");
    check("a four-hour suite that is provably still running keeps the machine",
      typeof denied === "string" && denied.includes("already running"), `got: ${JSON.stringify(denied)}`);
  });
}

// ─── MEMORY FLOOR ──────────────────────────────────────────────────
async function testMemoryFloor() {
  console.log("\nMemory floor refuses to launch on a starved machine:");

  await withTempDir(async (dir) => {
    const starved = createGuards({
      root: "C:/repo",
      globalDir: dir,
      minFreeMb: 1500,
      freeMemBytes: () => 400 * 1024 * 1024,
    });
    const problem = starved.checkMemory();
    check(
      "refuses below the floor",
      typeof problem === "string" && problem.includes("400 MB free"),
      `got: ${JSON.stringify(problem)}`
    );

    const roomy = createGuards({
      root: "C:/repo",
      globalDir: dir,
      minFreeMb: 1500,
      freeMemBytes: () => 8000 * 1024 * 1024,
    });
    check("allows above the floor", roomy.checkMemory() === null);

    const disabled = createGuards({
      root: "C:/repo",
      globalDir: dir,
      minFreeMb: 0,
      freeMemBytes: () => 1 * 1024 * 1024,
    });
    check("WB_MIN_FREE_MB=0 disables the floor", disabled.checkMemory() === null);
  });
}

// ─── RUN ───────────────────────────────────────────────────────────
console.log("🔒 test-lock guards — regression tests for #651");

await testSuiteLockIsMachineWide();
await testBothWorktreesUseTheSameLockFile();
await testStaleLockIsReclaimed();
await testUnboundClaimIsHonouredThenExpires();
await testCorruptLockIsCleared();
await testSingleRunsAreCapped();
await testDeadSingleHolderIsReaped();
await testSlotsLiveOutsideTheWorktree();
await testSimpleWorkingCase();
await testEveryPermutationFromTheSchema();
await testSubscriberIsNotifiedOnRelease();
await testSubscriberIsNotStrandedByADeadHolder();
await testSubscriberGivesUpAtItsDeadline();
await testSingleSubscriberIsNotifiedOnRelease();
await testRecycledPidDoesNotWedgeTheSuiteLock();
await testRecycledPidDoesNotWedgeASingleSlot();
await testLiveHolderIsStillHonoured();
await testUnidentifiableHolderIsBelievedButNotForever();
await testLegacyLockIsHonouredThenCeilinged();
await testTheCeilingNeverRobsAProvenHolder();
await testMemoryFloor();

console.log(`\n${failed === 0 ? "✅" : "❌"} ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);

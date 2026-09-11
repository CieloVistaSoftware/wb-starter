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

/** Simulates two worktrees of the same repo sharing one coordination dir. */
function twoWorktrees(globalDir, overrides = {}) {
  const base = {
    globalDir,
    minFreeMb: 0, // memory floor tested separately
    isAlive: (pid) => pid !== DEAD_PID,
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
await testMemoryFloor();

console.log(`\n${failed === 0 ? "✅" : "❌"} ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);

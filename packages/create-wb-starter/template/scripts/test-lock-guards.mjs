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

import { mkdtemp, rm, writeFile, readdir } from "fs/promises";
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
await testMemoryFloor();

console.log(`\n${failed === 0 ? "✅" : "❌"} ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);

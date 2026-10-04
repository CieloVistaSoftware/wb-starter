/**
 * in-flight-tests.mjs — which tests are RUNNING right now (#1199).
 *
 * A stall report that names the last test to FINISH says the run stopped, not
 * what it stopped on: in the 2026-09-19 stall it named test 7863, which had
 * completed fine; the test that never reported, number 7864, was named nowhere.
 * The ratchet tails the child's output, and a list reporter prints
 * a line when a test ENDS, never when it begins, so nothing it can read says
 * "worker 2 has been inside this test for 188 seconds".
 *
 * The project's own reporter (scripts/tools/test-reporter.ts) is told when every
 * test begins and ends, so it writes this file and the ratchet reads it when it
 * declares a stall. One shape, one reader, shared by both sides:
 *
 *   data/test-results/in-flight.json
 *   { "runStartedAt": <ms>, "updatedAt": <ms>,
 *     "running": [ { "worker": 2, "project": "compliance",
 *                    "file": "x-timeline.spec.ts", "title": "...", "startedAt": <ms> } ] }
 *
 * A file left by an EARLIER run must never be reported as this run's stuck test,
 * so the reader refuses anything whose runStartedAt predates the run asking.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const IN_FLIGHT_FILE = join('data', 'test-results', 'in-flight.json');

/**
 * The tests in flight for the run that started at `runStartedAt`, longest-running
 * first, each with how long it has been running. Never throws: a stall report must
 * not fail because its evidence is missing; it says so instead.
 */
export function readInFlight(repo, runStartedAt, now = Date.now()) {
  let doc;
  try {
    doc = JSON.parse(readFileSync(join(repo, IN_FLIGHT_FILE), 'utf8'));
  } catch (err) {
    return { tests: [], note: err.code === 'ENOENT' ? 'the reporter wrote no in-flight file' : `in-flight file unreadable: ${err.message}` };
  }
  // The reporter's clock and the ratchet's are the same machine's, but the
  // reporter starts a moment AFTER the ratchet spawns it, so a current file is
  // never older than the run. An older one belongs to a previous run.
  if (!Number.isFinite(doc.runStartedAt) || doc.runStartedAt < runStartedAt) {
    return { tests: [], note: 'the in-flight file is from an earlier run' };
  }
  const tests = (Array.isArray(doc.running) ? doc.running : [])
    .map((t) => ({
      worker: t.worker,
      project: t.project,
      file: t.file,
      title: t.title,
      runningSeconds: Math.max(0, Math.round((now - Number(t.startedAt)) / 1000)),
    }))
    .sort((a, b) => b.runningSeconds - a.runningSeconds);
  return { tests, note: tests.length ? '' : 'no test was running when the file was last written' };
}

/** One printable line per running test. */
export function describeInFlight(t) {
  const where = t.project ? `[${t.project}] ` : '';
  return `${where}${t.file} > ${t.title}  (worker ${t.worker}, running ${t.runningSeconds}s)`;
}

/**
 * gate-exit.mjs — the one distinction a gate's exit code has to carry (#1181).
 *
 * A gate can end three ways, and only two of them are about the code:
 *
 *   0                 the batch is clean
 *   1                 the batch broke something — a real, measured failure
 *   NO_VERDICT_EXIT   nothing was measured, so nothing is known
 *
 * The third is not a softer version of the second. It is a different kind of
 * statement, and collapsing it into exit 1 makes the caller assert something it
 * never observed.
 *
 * That is exactly what happened on 2026-09-15. The ratchet stopped a run and
 * said, in its own words, "THE SUITE NEVER RAN — this is not a code failure.
 * Nothing was verified, so nothing is known." It exited 1. scripts/release.mjs
 * saw a non-zero exit and answered, about the same run:
 *
 *     ❌ RELEASE ABORTED — the ratchet found NEW failures
 *        … this batch broke them.
 *
 * Nobody had measured a failure. The distinction existed inside the ratchet's
 * output and died at the process boundary, and someone then went looking for a
 * regression that did not exist.
 *
 * WHY 3: exit 2 is already this repo's "you called me wrong" across a dozen
 * scripts (attr-audit, check-test-collection, commit-readiness, …), and reusing
 * it would merge no-verdict into usage-error — the same conflation one step
 * sideways. 3 is otherwise unused by these gates.
 *
 * Related: #1091 (an instrument must not report a verdict it never measured),
 * #1128 (the outer bound, which release.mjs already distinguishes), #1180 (the
 * stall that produced the 2026-09-15 no-verdict run in the first place).
 */

/** Exit code meaning: this run produced no verdict. Do not blame the batch. */
export const NO_VERDICT_EXIT = 3;

/** True when a child's exit status says "nothing was measured". */
export function isNoVerdict(status) {
  return status === NO_VERDICT_EXIT;
}

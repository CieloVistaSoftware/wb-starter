/**
 * pages-deploy-state.mjs -- is main's head deployed to GitHub Pages? (#1361)
 *
 * The legacy builds list (repos/:repo/pages/builds/latest) is the wrong source:
 * every merge to main pushes TWO commits (the merge, then the version stamp),
 * Pages starts a build for each and cancels the superseded one, and a cancelled
 * build is recorded there as `errored` -- "Page build failed." So the deployed
 * smoke gate reported a healthy site as broken.
 *
 * The Actions run that actually deploys ("pages build and deployment") for the
 * head commit is the answer. This is the decision, as a pure function, so every
 * combination of run states can be checked without touching GitHub.
 *
 * @param {Array<{headSha: string, status: string, conclusion: string|null}>} runs
 *        pages-build-and-deployment runs (any order)
 * @param {string} headSha main's current head commit
 * @returns {{state: 'built'|'building'|'errored'|'waiting', detail: string}}
 *   built     a run for the head commit succeeded
 *   building  a run for the head commit is queued or in progress
 *   errored   a run for the head commit FAILED (not cancelled)
 *   waiting   no run for the head commit yet, or only cancelled ones -- a
 *             cancelled run was superseded, which is not a broken deploy
 */
export function pagesDeployState(runs, headSha) {
  const forHead = (runs || []).filter((r) => r && r.headSha === headSha);
  if (forHead.some((r) => r.conclusion === 'success')) {
    return { state: 'built', detail: `deployed ${headSha.slice(0, 8)}` };
  }
  if (forHead.some((r) => r.status === 'queued' || r.status === 'in_progress' || r.status === 'waiting' || r.status === 'pending')) {
    return { state: 'building', detail: `deploying ${headSha.slice(0, 8)}` };
  }
  const failed = forHead.filter((r) => r.conclusion === 'failure' || r.conclusion === 'timed_out' || r.conclusion === 'startup_failure');
  if (failed.length) {
    return { state: 'errored', detail: `pages build and deployment ${failed[0].conclusion} for ${headSha.slice(0, 8)}` };
  }
  if (forHead.length) {
    return { state: 'waiting', detail: `only cancelled runs for ${headSha.slice(0, 8)} so far (superseded, not failed)` };
  }
  return { state: 'waiting', detail: `no deploy run for ${headSha.slice(0, 8)} yet` };
}

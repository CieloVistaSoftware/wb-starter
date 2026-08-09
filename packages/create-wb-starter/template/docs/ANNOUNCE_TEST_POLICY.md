Release announcement: Local test gating and PR policy

Summary
-------
We now enforce a fast local test gate: `npm test` runs Tier‑1 (compliance) by default and must pass **before** commits or opening PRs. PRs opened with failing Tier‑1 checks will be labeled `needs-tests` and closed by maintainers if they are not converted to Draft and fixed.

What changed
------------
- `npm test` runs Tier‑1 only (fast, local)
- `npm run test:ci` runs the full-suite (CI / explicit local)
- A fast **Tier‑1** GitHub Actions job has been added to run on PRs
- A PR labeler will mark PRs with failing Tier‑1 as `needs-tests` and comment remediation steps
- CONTRIBUTING.md and CommittingFixes.md updated with the new gate and exception workflow

Who this affects
-----------------
All contributors. After pulling these changes run:

```bash
npm install
npm run prepare   # installs git hooks
```

Short announcement (copy for Slack / Teams)
------------------------------------------
:information_source: Team — new test gating policy: please run `npm test` and ensure Tier‑1 passes **before** committing or opening PRs. If you need to iterate while debugging, open a **Draft** PR and document the failing test(s. )

If you'd like, I can post this to the repo's default channel and open a follow-up issue to track rollout and exemptions.

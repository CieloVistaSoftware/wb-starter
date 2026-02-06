Branch protection: require fast Tier‑1 check

Goal
----
Require the new Tier‑1 (compliance) check on protected branches so PRs cannot be merged until the fast local gate passes in CI.

Recommended protection (manual apply by repo admin)
--------------------------------------------------
- Require status checks to pass before merging
- Select: **Tier‑1 (compliance)** (exact name as shown in the PR checks)
- Require branches to be up to date before merging (optional)
- Enforce for administrators (optional)

Example GitHub CLI (admin) to require the check on `main`:

```bash
# replace OWNER/REPO and the check name as shown in the PR checks UI
gh api --method PATCH /repos/OWNER/REPO/branches/main/protection -f required_status_checks.strict=true \
  -f required_status_checks.contexts='["Tier-1 (compliance)"]' \
  -f enforce_admins=true
```

Proposal (repo file)
--------------------
A sample branch-protection config is included in `.github/branch_protection/require-tier1.yml`. Repository admins may apply it via the CLI or the GitHub UI. We do NOT apply branch protection automatically in this PR — admin approval is required.

Rollout
-------
1. Merge Tier‑1 workflows and docs PRs.
2. Apply the branch-protection rule to `main` (admin action).
3. Announce enforcement date and give a 48‑hour grace period for open PRs to be fixed.

Notes
-----
- Branch protection is an admin setting — this file is a proposal and documentation artifact.
- If you need an exemption for an emergency deploy, open an issue and request an exception with rationale.
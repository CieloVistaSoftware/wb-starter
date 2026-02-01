# Lock restore audit — 2026-02-01

Summary
- Restored missing advisory locks and created RESTORED placeholders for disk-only locks mentioned in the cleanup audit.

What I restored / recreated
- `Lock/LOCKED-builder-styles.md.RESTORED.md` — placeholder (no committed history; recreated from audit list)
- `Lock/LOCKED-test-intellisense.md.RESTORED.md` — placeholder (no committed history; recreated from audit list)

Recovered from git
- No additional committed lock files were missing from disk at the time of this run.

Why placeholders?
- Several advisory lock files were created but never committed; they were lost when removed from disk. To preserve auditability and to give owners a chance to re-declare intent, placeholders were created instead of attempting blind deletion.

Next steps
- Please review the placeholders and either:
  - Update them (add `owner:`, `reason:`, `expires:` or `related-pr:`) if the work is ongoing, or
  - Delete them if they are no longer needed (and/or mark `status: released`).

Related:
- `docs/LOCK-CLEANUP-2026-02-01.md` (audit)
- `docs/locks.md` (lock policy + tooling)

Performed by: GitHub Copilot — 2026-02-01T00:00:00Z
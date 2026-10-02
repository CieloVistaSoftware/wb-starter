# Release Process Standards

**Every version number this project shows anyone MUST be traceable to a written list of
what it contains.** A version number is a promise that a specific, testable thing shipped.
If you cannot answer "what is in 3.0.61?" by reading one page, the number is noise.

This exists because it was broken. Between 2026-08-19 and 2026-08-20 the version went
3.0.36 → 3.0.60 — 24 bumps, 16 of them in one day — with the last What's New entry dated
2026-08-19. The result could not be tested: given a version number there was no way to
learn what was in it, and given a build no way to know its number was unique.

---


## The number on the badge (since 2026-10-02)

John: "I want port 3000 to show 1.0.what the latest push is e.g. 1.0.41 simple."
The version badge shows the last release tag with its patch moved on by the
**pushes to main** since it: `v1.0.89` + 3 pushes reads **`v1.0.92`**. John,
2026-10-02: "count pushes not commits" -- counting commits made it jump by three
per push. A push is one first-parent commit on main; the stamp workflow's own
`chore(version): stamp` commit belongs to the push it stamps
(`scripts/lib/push-count.mjs`). The numbering switched at the `v1.0.89` tag, so
it never went backwards. It is counted by git from the tag
(`scripts/stamp-version.js`), so the same commit shows the same number on port
3000 and on the live site. Every version is listed on the Releases page with
what it contains (`scripts/release-versions.mjs`, run by the stamp workflow). The badge shows the number only, no marks;
local edits or being behind GitHub are said in its tooltip. A release (below) is still cut
deliberately with `npm run ship` and resets the count to its new tag.

## 1. One number per release, never per commit

A release number changes **once, on `main`, when something is being released**. It does not
change on every commit.

The failure mode this replaces: `.husky/pre-commit` ran `npm version patch` on every commit.
Because branch commits bump and squash-merges collapse them, the numbers that reached `main`
were both **ambiguous** and **phantom**:

| Symptom | Actual measurement |
|---|---|
| One number, several builds | `3.0.55` = two commits (#722, #733); `3.0.44` = three; `3.0.35` = ~40 |
| Numbers that never shipped | `3.0.56`, `3.0.58`, `3.0.59`, `3.0.60` — feature branches only |
| Working copy ahead of reality | local read `3.0.60` while `main` was `3.0.57` |

Neither is testable. Both are prevented by bumping once, on `main`.

## 2. Cache-busting is a different job — give it its own stamp

The `?v=` query strings in `index.html` genuinely must change on
every commit, or browsers serve stale assets. **That need is what drove the per-commit
bump, and it does not require the semver version.**

- `?v=` and any other cache-bust token use the **commit hash or a build counter**. Change
  freely, every commit, no ceremony.
- `package.json` `version` is the **release number**. Changes only under rule 1.

`scripts/stamp-version.js` already writes both; it must stop taking the cache-bust value
from the semver version.

## 3. A release is not done until the Releases page names it

`data/releases.json` is the changelog, and `pages/releases.html` renders it. It is what
the site says is live, so it is the only thing anyone can test against. (Until 1.0 this
was the hand-edited What's New page, now in the `archive/` folder; `?page=whats-new`
still forwards to `?page=releases`.)

A release commit MUST contain, together, in one commit:

1. the `version` bump in `package.json` and `package-lock.json`
2. the stamped `src/core/version.js`
3. a `data/releases.json` entry **whose `version` is that exact version number**, listing
   what it added, fixed and changed

Shipping any one of those without the others is the defect this document exists to prevent.
`npm run ship` does all three: `scripts/release-entry.mjs` writes the entry from the commits
since the last tag (`feat:` → added, `fix:` → fixed, anything else → changed), and
`scripts/release.mjs` gate 2 refuses a release the file does not name.

## 4. Releases are keyed by version, not by date

A date cannot be tested; a version can. Each entry is keyed by release number, with the date
as secondary:

```json
{
  "version": "1.0.0",
  "date": "2026-09-29",
  "summary": "",
  "items": [
    {
      "kind": "fixed",
      "html": "<strong>Releases replace What's New</strong> #1182 (as a link)",
      "issues": [1182]
    }
  ]
}
```

Work that is live but not yet in a numbered release may sit in an `unreleased` block; the
next release folds it in, so it can never be shown in place of a version (#1182). Work from
before numbered releases is under `history`, by date, never as a version.

If a number was consumed but never deployed, **say so explicitly** so nobody hunts for it.

## 5. Every issue reference is a link

Refs like `#727` are written as real anchors to
`https://github.com/CieloVistaSoftware/wb-starter/issues/727`, `target="_blank"`,
`rel="noopener"`. A bare `#727` in prose is not a reference, it is a string.

## 6. Never reuse a number that a branch has consumed

If a feature branch has already stamped `3.0.58`, the next release is **not** `3.0.58`.
Pick a number above every number that has ever existed. Two builds sharing a number is the
single worst outcome here — it makes a bug report unanswerable.

## 7. Bypassing the hook requires a stated reason

`--no-verify` is allowed only when running the hook would itself break a rule above (for
example: an auto-bump would ship `3.0.62` while the Releases entry says `3.0.61`). When
used, the commit message says so and why.

---

## Release checklist

- [ ] On `main`, up to date with `origin/main`
- [ ] Pick the next number — above every number any branch has consumed (rule 6)
- [ ] Bump `package.json` + `package-lock.json`
- [ ] Run `node scripts/stamp-version.js`
- [ ] Write the `data/releases.json` entry for that version (rules 3, 4) — `npm run ship` does this
- [ ] Every `#NNN` in it is a link (rule 5)
- [ ] Confirm every version surface agrees: `package.json`, `package-lock.json`,
      `src/core/version.js`, `index.html`, the `data/releases.json` entry
- [ ] One commit, all of it together
- [ ] Push; watch CI to green

## Enforcement

These are testable and MUST be enforced by the integration suite, not by memory:

- the version in `package.json` has a matching `data/releases.json` entry with items
- no two commits on `main` carry the same `version`
- no bare `#NNN` in `data/releases.json` (`scripts/release-entry.mjs` links every one)
- every version surface agrees with `package.json`

Tracking issue: [#743](https://github.com/CieloVistaSoftware/wb-starter/issues/743).

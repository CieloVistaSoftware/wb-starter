# Release Process Standards

**Every version number this project shows anyone MUST be traceable to a written list of
what it contains.** A version number is a promise that a specific, testable thing shipped.
If you cannot answer "what is in 3.0.61?" by reading one page, the number is noise.

This exists because it was broken. Between 2026-08-19 and 2026-08-20 the version went
3.0.36 → 3.0.60 — 24 bumps, 16 of them in one day — with the last What's New entry dated
2026-08-19. The result could not be tested: given a version number there was no way to
learn what was in it, and given a build no way to know its number was unique.

---

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

The `?v=` query strings in `index.html` and `project-index.html` genuinely must change on
every commit, or browsers serve stale assets. **That need is what drove the per-commit
bump, and it does not require the semver version.**

- `?v=` and any other cache-bust token use the **commit hash or a build counter**. Change
  freely, every commit, no ceremony.
- `package.json` `version` is the **release number**. Changes only under rule 1.

`scripts/stamp-version.js` already writes both; it must stop taking the cache-bust value
from the semver version.

## 3. A release is not done until What's New names it

`pages/whats-new.html` is the changelog. It is what the site says is live, so it is the
only thing anyone can test against.

A release commit MUST contain, together, in one commit:

1. the `version` bump in `package.json` and `package-lock.json`
2. the stamped `src/core/version.js`
3. a `pages/whats-new.html` section **headed by that exact version number**

Shipping any one of those without the others is the defect this document exists to prevent.

## 4. What's New entries are headed by version, not by date

A date cannot be tested; a version can. Entries are keyed by release number, with the date
as secondary:

```html
<section id="whats-new-3-0-61">
  <h2>3.0.61 — 2026-08-21</h2>
```

Where a release consolidates several intermediate builds, each item carries the build it
first shipped in, in brackets, so any change stays traceable:

```html
<li><strong>[3.0.54] Pages that exist are reachable by URL again.</strong> …</li>
```

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
example: an auto-bump would ship `3.0.62` while the What's New entry says `3.0.61`). When
used, the commit message says so and why.

---

## Release checklist

- [ ] On `main`, up to date with `origin/main`
- [ ] Pick the next number — above every number any branch has consumed (rule 6)
- [ ] Bump `package.json` + `package-lock.json`
- [ ] Run `node scripts/stamp-version.js`
- [ ] Write the `pages/whats-new.html` section headed by that version (rules 3, 4)
- [ ] Every `#NNN` in it is a link (rule 5)
- [ ] Confirm every version surface agrees: `package.json`, `package-lock.json`,
      `src/core/version.js`, `index.html`, `project-index.html`, What's New heading
- [ ] One commit, all of it together
- [ ] Push; watch CI to green

## Enforcement

These are testable and MUST be enforced by the integration suite, not by memory:

- the version in `package.json` has a matching `pages/whats-new.html` section heading
- no two commits on `main` carry the same `version`
- no bare `#NNN` in `pages/whats-new.html`
- every version surface agrees with `package.json`

Tracking issue: [#743](https://github.com/CieloVistaSoftware/wb-starter/issues/743).

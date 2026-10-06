# CURRENT HANDOFF — 2026-09-11

## 🅿️ PARKING LOT

**Parked 2026-10-05, 11:00 PM CDT.** main = v1.0.311.

**Task:** real paths for pages (#1001, John: "I want regular routing for navigation pull out the pages thing"), which also settles #957 (an unknown path is a 404, not home). PR #1601.

**Files touched:** `src/core/routes.js` (new), `src/core/site-engine.js`, `server.js`, `scripts/generate-404.mjs` (new), `404.html` (new, generated), `.github/workflows/stamp-version-on-main.yml`, `tests/helpers/page-path.ts` (new), `tests/regression/pages-have-real-paths.spec.ts` (new), and the specs that looked nav links up by `?page=`: `mobile/nav-scroll`, `views/feature-cards-clickable`, `pages/home-links`, `integration/repro-card-bug`, `behaviors/no-schema-not-found`, `regression/{navigation-latest-wins,non-nav-pages-reachable,issues-activity-survives-navigation,behaviors-live-selector,releases-page,scroll-survives-page-build}`, `compliance/repo-layout`.

**Last action:** fixed every spec CI and the local run showed red (all pass locally; the iPhone project needs WebKit, which this sandbox lacks, so nav-scroll was checked on Pixel). Added a redirect `/behaviors/` → `/behaviors` (the shell's relative assets broke under a trailing slash). Merged main and pushed; the PR is still DRAFT, waiting on CI.

**Next step:** CI green → mark ready, merge (merge commit), fill in the signatures for #1001 and #957. Then, optionally, change the 44 `?page=` content links to paths (they still work; they redirect).

**Open questions for John:** #827 wire up or delete the list modules (`<ul>/<ol>/<dl>` would change on every page); #969 the typed-card class refactor, do now or later.

**Done today (merged):** #1532 (release steps, video maker, 12 fixes), #1559 (Central time everywhere, x-clock default Central, x-glow), #1582 (`<nav>` picks up navbar, #958). Closed as already fixed: #864, #916, #1004, #1319; #1037 fixed by another session's #1584.

---

**Updated 2026-10-02.** Build process changed (John's decision).

- Commit hook = fast checks only (~30s), nothing CI also runs. No Playwright, no every-10th full run, no counter.
- PR CI (`ci-tests.yml`, one check per category + "Gate scripts self-test") is information.
- **"park"** at end of day: update this parking lot, merge the day's finished PRs, trigger `nightly.yml`. Backup schedule 08:00 UTC.
- Nightly: full suite on main vs the register. A new failure files one `priority:2` issue. It does not release.
- The live site serves `main`; a merge is live in minutes. The pre-push rule (#1076) is gone.
- **Version number** (John: "1.0.what the latest push is e.g. 1.0.41 simple"): the badge shows the last tag's patch plus the commits since it — `v1.0.41`. Numbers only, no marks; the tooltip says if the copy is behind or edited.

---

**Updated 2026-10-06.** x-codecontrol renamed to x-codetheme (#668).

**Files touched:** `src/wb-viewmodels/codetheme.js`, `src/wb-models/codetheme.schema.json`, `src/styles/behaviors/codetheme.css`, `docs/behaviors/codetheme.md` (all renamed from codecontrol), `src/core/attribute-aliases.js` (new `BEHAVIOR_ALIASES`), `src/core/tag-map.js`, `src/core/wb-lazy.js`, `src/core/style-loader.js`, `src/wb-viewmodels/index.js`, `src/styles/behavior-css-manifest.js`, `docs/manifest.json`, `docs/behavior-cross-reference.md`, `docs/behaviors-reference.md`, `docs/pce-candidates.md`, demos/pages that used the old name.

**Last action:** the behavior, module, schema, stylesheet and doc are codetheme; the schema says it picks a highlight.js theme (it said "code editor/viewer"). `x-codecontrol` still works: it is declared once, in `BEHAVIOR_ALIASES` (attribute-aliases.js), and wb-lazy.js, the wb.js registry and the CSS loader all read it from there. It is not in tag-map.js, so the inventories and docs list one behavior, not two.

**Next step:** retire the x-codecontrol alias once nothing outside the repo uses it.

---

**Updated 2026-10-06.** Behavior API verbs gate sees every member (#782).

**Files touched:** `tests/regression/behavior-api-verbs.spec.ts`, `src/wb-viewmodels/search.js`, `src/wb-viewmodels/notes.js`, `src/wb-models/notes.schema.json`, `tests/components/notes.spec.ts`, `tests/components/notes-updates.spec.ts`, `tests/regression/variants-render-differently.spec.ts`, `docs/behaviors/notes.md`, `docs/behaviors/searchfield.md`, `docs/NOTES-V3-GUIDE.md`.

**Last action:** the gate only read `name: (` / `name(` members, so `wbSearch.clear` and `wbNotes.open/close` passed it. It now reads every depth-1 member. Renamed: `wbSearch.clear` -> `reset`, `wbNotes.open/close` -> `show/hide`, `collapseToSide(side)` -> `hide(side)`. Domain verbs (fire, type, count, stick, save, copy, focus, blur, search...) are allowed per API only.

**Next step:** #668 (rename x-codecontrol to x-codetheme), #669 (schema properties never read).

---

**Updated 2026-10-05, 9:55 PM CDT.** Link-share preview shows the wb logo (#1585, PR #1586, merged).

**Task:** John, from a LinkedIn post of the site: change the preview icon (the white lightning bolt on purple) to `wb.png`.

**Files touched:** `assets/icons/og-image.jpg` (new), `index.html` (`og:image`, `twitter:image`, plus `og:image:width`/`height`/`alt`).

**Last action:** the 1.5 MB logo bitmap was deleted in #795, so it came back from history as a 512x512 JPEG of 25,875 bytes in `assets/icons/`, under the 100 KB ceiling of `header-logo-is-not-a-megabyte.spec.ts`. The PWA icons in `manifest.json` are unchanged. All 17 PR checks were green.

**Next step:** John re-runs linkedin.com/post-inspector on the site URL once, so posts already shared drop the cached bolt. Then work the open issues.

**Open questions:** should the PWA/app icons (`assets/icons/icon-*.png`, made by `scripts/generate-icons.js` from the bolt SVG) also become the wb logo? Not changed here; only the share card was asked for.

---

**Updated 2026-10-05, night.** `<nav>` picks up navbar (#958).

**Files touched:** `src/core/tag-map.js` (`nav: 'navbar'`), `src/core/replacement-guard.js`, `src/wb-viewmodels/navigation.js`, `src/styles/behaviors/navbar.css`, `demos/site/layout.html`, `data/behavior-examples.json`, `docs/behaviors/navbar.md`, `docs/behavior-cross-reference.md`, `docs/semantic-standard.md`, `docs/INTELLISENSE-TOOLTIPS.md`, `docs/audits/HOST-CHILD-DISPATCH-AUDIT.md`.

**Last action:** a plain `<nav>` gets the link look and keeps its layout; `brand|items|logo|sticky|variant` make it the header; a `<nav>` with its own behavior keeps only that. The attribute form on a nav is now redundant and was removed (16 places).

**Next step:** work the open issues.

---

**Updated 2026-10-05, evening.** Central time (#1553) and x-glow (#816).

**Files touched:** `src/core/central-time.js` (new), the displays that used `toLocale*String`, `scripts/lib/git-dates.mjs`, `scripts/lib/release-date.mjs`; `src/styles/behaviors/effects.css`, `src/wb-viewmodels/effects.js`, `src/wb-models/glow.schema.json`, `docs/behaviors/glow.md`; `src/wb-viewmodels/helpers.js` (x-clock), `src/wb-models/clock.schema.json`, `docs/behaviors/clock.md`.

**Last action:** every displayed date and time is US Central (CDT/CST). x-glow pulses (its keyframe never existed), `target="text"` glows the letters, and reduced motion stops the pulse.

**Then:** John: "x-clock should default to cst". It does, with a `timezone` option (IANA name or `local`).

**Next step:** work the open issues.

---

**Updated 2026-10-05 (later).** See it = steps to recreate (#1533).

**Task:** John, on 1.0.262 and 1.0.261: "still not good enough, tell the user what to do to manually recreate this", and "I don't do anything manually that's your job".

**Files touched:** `data/release-see-it.json` (new: steps for all 241 versions, written from each issue's body), `data/releases.json`, `scripts/lib/release-item.mjs` (`seeItProblems()` replaces `noVisibleChange()`), `scripts/release-versions.mjs`, `scripts/check-release-notes.mjs`, `docs/standards/RELEASE-PROCESS.md` (§3a), `.claude/CLAUDE.md`, `tests/regression/release-lines.spec.ts`.

**Last action:** every version's See it line says what to do, then `Before:` and `Now:`. A test-only change names the command and what it printed. The PR check refuses "No visible change", a line with no action or no Before/Now, and one that repeats the Summary.

**Next step:** a version stamped after this one takes its steps from its commit's `See it:` line; add a `data/release-see-it.json` entry to correct one.

---

**Updated 2026-10-05.** Releases page and session rules (#1533, #1534), and `npm run make-video` (#1535, PR #1532).

**Task:** John on the Releases page: "This page tells me nothing. one of these lines should be a summary of the issue, the other what to do to see the change", plus "change the text … to indicate that each commit is a new release" and "don't leave artifacts on my computer".

**Files touched:** `scripts/release-versions.mjs`, `scripts/lib/release-item.mjs`, `scripts/lib/issue-titles.mjs` (new), `scripts/check-release-notes.mjs` (new), `.github/workflows/pr-release-notes.yml` (new), `.github/workflows/stamp-version-on-main.yml`, `data/releases.json`, `data/issue-titles.json` (new), `pages/releases.html`, `src/styles/pages/releases.css`, `docs/standards/RELEASE-PROCESS.md` (§3a), `.claude/CLAUDE.md` (release lines, worktrees), `tests/regression/release-lines.spec.ts` (new).

**Last action:** each version now shows the issue (commit `Summary:` line, else the cited issue's title, else the commit body), then **See it:** (commit `See it:` line, else "No visible change" for tests/tooling), then what changed. A new PR check requires both lines. Worktrees are removed when their PR merges, junction first.

Also #1018 (page-only `class="time-display"` removed from the x-countdown/x-relativetime examples and `docs/behaviors/countdown.md`, `docs/behaviors/relativetime.md`) and #1019 (the search counter names its unit: "Showing N of 767 examples").

**Next step:** work the open issues.

---

**Updated 2026-10-03.** Merged as PR #1324 (merge commit `af651f5`).

**Task:** John: "why isn't figure and image able to set width height? we have no examples of this in behaviors."

**Files touched:** `src/wb-viewmodels/semantics/img.js`, `src/wb-viewmodels/semantics/figure.js`,
`src/wb-models/img.schema.json`, `src/wb-models/figure.schema.json`, `data/schema-index.json`,
`data/behavior-examples.json`, `docs/behaviors/img.md`, `docs/behaviors/figure.md`,
`tests/behaviors/img-figure-width-height.spec.ts` (new), `tests/regression/img-doc-size-examples.spec.ts`.

**Last action:** `<img width height>` together now set the image's shape (cropped, like `aspect-ratio`);
`height` alone was dead under `img { height: auto }`. `<figure width="">` is new (px or any CSS length,
capped at its container). Schemas, docs and behaviors-page examples list both.

**Next step:** none. Merged 2026-10-03 with all 14 checks green.

**Updated 2026-10-01 (late night).** On branch `claude/nifty-darwin-8mf277`, added to PR #1238.

**Task:** markdown link audit. John: "write a test that proves all links in all of our .md documents work, consider it an audit which 1) Identifies failures and the 2) Fixed them the tests are then rerun to prove things."

**Files touched:** `scripts/lib/md-links.mjs`, `scripts/audit-md-links.mjs`,
`tests/compliance/md-links-resolve.spec.ts`, `data/md-link-audit.json` (new); fixed links in
`docs/V3-GUIDE.md`, `docs/properties.md`, `docs/architecture/standards/ATTRIBUTE-NAMING-STANDARD.md`,
`docs/behavior-cross-reference.md`, `docs/behaviors/dropdown.md`, `docs/standards/V3-STANDARDS.md`.

**Last action:** audit before: 69 broken internal links (4 wrong anchors, 65 dead demo routes) and 1 broken
web link (`github.com/wb`). All fixed. Rerun: 293 files, 688 internal links, 0 broken; 53 web links, 53 ok.
The new gate fails on the old docs (69) and passes on the fixed ones.

**Next step:** John reviews PR #1238. Rerun `node scripts/audit-md-links.mjs --external` now and then; web links are not in the gate.

**Open questions:** none.

---

**Updated 2026-10-01 (night).** On branch `claude/nifty-darwin-8mf277`, after PR #1235 merged.

**Task:** #1236, `x-glass`: a new behavior that lets an element carry the background scene (John: "a button which carries the scene of the background"; name chosen by John).

**Files touched:** `src/wb-viewmodels/glass.js`, `src/wb-models/glass.schema.json`,
`src/styles/behaviors/glass.css`, `docs/behaviors/glass.md` (new); `src/wb-viewmodels/index.js`,
`src/core/tag-map.js`, `src/styles/behavior-css-manifest.js`, `src/styles/themes.css`,
`src/wb-viewmodels/card.js`, `src/styles/behaviors/hero.css`, `data/schema-index.json`,
`data/behavior-examples.json`, `docs/manifest.json`, `docs/behaviors-reference.md`,
`docs/behavior-cross-reference.md`; the old `.x-glass` card utility renamed `.x-glass-card`
in `site.css`, `x-signature.css`, `pages/links.html`, `pages/hero-variants.html`;
`tests/regression/x-glass-carries-the-scene.spec.ts` (new).

**Last action:** x-glass built and registered, with `amount` = most (default, 14% tint) / some (22%) / least (30%).
The card hero's "Read the Guide" button now uses it and renders as before (99.86% of pixels identical).

**Next step:** John reviews the PR. Follow-ups: move the hero pill and card/badge `glass`
variants onto x-glass (each changes its look slightly, so left out); `npm run audit:behavior-registry`
reports 61 pre-existing hard errors (same on main).

**Open questions:** none.

---

**Updated 2026-10-01 (evening).** On branch `claude/nifty-darwin-8mf277`.

**Task:** John wants Playwright CI split into categories, one check per category, run in parallel (his pick over one run that posts per-category results at the end).

**Files touched:** `.github/workflows/ci-tests.yml`, `.husky/test-ratchet.mjs`,
`tests/compliance/ci-and-local-gate-agree.spec.ts`.

**Last action:** ci-tests.yml became a matrix of six jobs (compliance, regression,
behaviors and schema-viewer gated through the ratchet with WB_GATE_PROJECTS;
integration and base reported, as before), plus a "Playwright Tests" summary
job that fails if any category fails. A narrowed ratchet now refuses `--update`
and does not report a repaired count it cannot measure.

**Next step:** watch the first CI run of the PR. If branch protection requires
the old "Playwright Tests" check, the summary job keeps that name.

**Open questions:** six Windows runners per push instead of one. Fine for John?

---

**Updated 2026-10-01 (later).** On branch `claude/nifty-darwin-8mf277`, restarted from main after PR #1230 merged.

**Task:** the issue priority bot. It posted its comment twice on #1231, and John asked why priority is not set automatically.

**Files touched:** `.github/workflows/issue-priority-check.yml`,
`scripts/triage-issue-priority.mjs`, `scripts/lib/priority-triage.mjs` (new),
`tests/compliance/issue-priority-check.spec.ts` (new).

**Last action:** a concurrency group per issue stops the double comment. The
comment now includes the triage rules' proposal and its evidence, but never
applies it. An audit of a new "enhancement label means priority 5" rule
against John's ratings agreed 1 time in 15, so that rule was dropped. John rates
feature requests by impact (1, 3 or 4), not as "no defect".

**Next step:** John rates #1231 and #1232 (both set to priority:5 for now, likely too low).

**Open questions:** none.

---

**Updated 2026-10-01.** On branch `claude/nifty-darwin-8mf277`.

**Task:** the Docs page opens newest first (owner request), and the default is easy to change.

**Files touched:** `scripts/update-docs-manifest.js`, `docs/manifest.json`,
`pages/docs.html`, `src/styles/pages/docs.css`,
`tests/integration/docs-page-sort-newest.spec.ts`.

**Last action:** every entry in `docs/manifest.json` now carries `modified`
(its last commit date). `npm start` keeps those dates current through
update-docs-manifest.js. In a shallow clone it leaves them as they are. The page
has a "Sort documents" control (Newest first / By category). The reader's pick
is remembered and kept in `?sort=`.

**To change the default:** in `pages/docs.html`, move `selected` to the other
`<option>` of `#docs-sort`.

**Next step:** John reviews the draft PR.

**Open questions:** none.

---

**Updated 2026-09-29.** On branch `claude/fervent-noether-ydmxea` (PR #1221).

**Task:** P1 issues, in order. Fixed on the branch: [#1185](https://github.com/CieloVistaSoftware/wb-starter/issues/1185), [#1184](https://github.com/CieloVistaSoftware/wb-starter/issues/1184), [#1183](https://github.com/CieloVistaSoftware/wb-starter/issues/1183),
[#1146](https://github.com/CieloVistaSoftware/wb-starter/issues/1146)/[#1147](https://github.com/CieloVistaSoftware/wb-starter/issues/1147)/[#1150](https://github.com/CieloVistaSoftware/wb-starter/issues/1150), and [#1182](https://github.com/CieloVistaSoftware/wb-starter/issues/1182) (What's New became Releases).

**Releases (1.0):** `data/releases.json` is the changelog, rendered by
`pages/releases.html`; `?page=whats-new` forwards there. `npm run ship` writes the
entry with `scripts/release-entry.mjs`, and release.mjs gate 2 requires it.
`npm run ship -- --as 1.0.0` cuts 1.0. The old page and script are in `archive/`.

**Next step:**
1. Ship 1.0.0 once PR #1221 CI is green. John pushes tag `v1.0.0` (and `v4.0.6` at 5203cd24).
2. After 1.0 ships, change today's closing comments to "Fixed in 1.0.0".
3. The gate-reliability P1s are next: #1158, #1163, #1162, #1201, #1203.

**Open questions:** #1122 (remote vs local images) and #998 (badge colour) need John.

---

**Updated 2026-09-24.** The release batch below shipped as **4.0.5** (482b940,
2026-09-14). Every issue it unblocked is closed: [#1070](https://github.com/CieloVistaSoftware/wb-starter/issues/1070), [#1075](https://github.com/CieloVistaSoftware/wb-starter/issues/1075), [#1078](https://github.com/CieloVistaSoftware/wb-starter/issues/1078), [#1102](https://github.com/CieloVistaSoftware/wb-starter/issues/1102),
[#1103](https://github.com/CieloVistaSoftware/wb-starter/issues/1103), [#1104](https://github.com/CieloVistaSoftware/wb-starter/issues/1104), [#1106](https://github.com/CieloVistaSoftware/wb-starter/issues/1106), [#792](https://github.com/CieloVistaSoftware/wb-starter/issues/792).

**Task:** [#1166](https://github.com/CieloVistaSoftware/wb-starter/issues/1166) (session start), then the article -> card merge. Both are on
[PR #1210](https://github.com/CieloVistaSoftware/wb-starter/pull/1210), one commit each.

**Article -> card (John chose "merge into card"):** `<article>` routes straight
to `card` in tag-map.js; `x-article`, index.js's `article: 'card'` redirect and
the unreachable `article()` are gone. card.schema.json gained author, date,
category, readingTime and featured, which card.js already rendered.
article.schema.json and docs/behaviors/article.md are deleted; card.md teaches
the byline. The inert `image`/`imageAlt` were dropped, not merged. The doc and
schema generators now name a native tag by its behavior (`<article>` -> x-card).
The #880 spec became tests/regression/article-is-a-card.spec.ts, seen to fail
on the old mapping.

**Verified in the cloud session, not by the full gate:** the 47 spec files that
touch article, card or the catalogue, before and after. No test that passed
before fails now; `x-card: all 14 declared attributes take effect` passes.

**Also on PR #1210 since:** the CI fixes the merge caused (e298bc67), the
custom-elements manifest removed (John: "we are not supporting custom elements
any longer", 176381aa), and x-progressbar removed so x-progress is the one name
(e6612759).

**Next step:**
1. Run the full commit gate on John's machine against PR #1210's head.
2. Merge PR #1210, then close [#1166](https://github.com/CieloVistaSoftware/wb-starter/issues/1166).
3. CI's `CI — Tests` stays red until [PR #1209](https://github.com/CieloVistaSoftware/wb-starter/pull/1209)
   merges: it adds the register gate ([#1163](https://github.com/CieloVistaSoftware/wb-starter/issues/1163)). Then merge main into this branch.
4. packages/create-wb-starter/template still has the old article, manifest and
   progressbar files. sync-template.mjs refreshes it before a publish.
5. Decided (John, 2026-09-24: "one open group on load is fine"): the group
   holding the auto-selected first row starts open; every other group is closed ([#771](https://github.com/CieloVistaSoftware/wb-starter/issues/771) vs [#995](https://github.com/CieloVistaSoftware/wb-starter/issues/995)).
6. Pre-existing and left alone: content-html-article-layout-demos (baselined),
   article.css `.x-articles--* > x-article` rules, html-validity (fails on main),
   and intermittent dropdown / header-controls / api-docs-panels specs.

**Open questions:** see the list at the end of this file.

## What this batch fixes

| issue | fix | proof |
|---|---|---|
| [#1102](https://github.com/CieloVistaSoftware/wb-starter/issues/1102) | an empty behavior fills from the curated example, not its field names; `data-` counts as authored | tests/behaviors/empty-behavior-teaches-by-example.spec.ts |
| [#1103](https://github.com/CieloVistaSoftware/wb-starter/issues/1103) | article.schema.json restored from 0 bytes; parse gate added | tests/compliance/every-schema-parses.spec.ts |
| [#1104](https://github.com/CieloVistaSoftware/wb-starter/issues/1104) | the hooksPath check asserts the guarantee, not a location | tests/regression/every-push-to-main-is-a-release.spec.ts |
| [#1106](https://github.com/CieloVistaSoftware/wb-starter/issues/1106) | the gate is bounded (75/80 min) and holds the machine lock; single runs are held while a suite runs; a blocked gate is notified on release, never polls | scripts/lock-permutations.schema.json via scripts/test-lock-guards.mjs, 47/0, run in pre-commit |
| [#792](https://github.com/CieloVistaSoftware/wb-starter/issues/792) | x-footer renders `links` and `social` | tests/behaviors/every-declared-attribute.spec.ts |
| — | cardstats compact/large/minimal never applied (keyed on classes a8a7362e stopped injecting) | card-typed-variants-no-op.spec.ts, now waits on animation `finished` |
| — | the workspace spec read the page mid-entrance (site.css fadeIn slides 10px) | behaviors-workspace-single-scroll.spec.ts, now waits on whenIdle + the page's own animations |

## Lessons written into this batch, so they are not relearned

- **A logged cause does not prevent a recurrence; only an enforced one does.**
  The five-hour gate hang was already recorded in Law 4, [#1072](https://github.com/CieloVistaSoftware/wb-starter/issues/1072) and the agent's
  own notes. It recurred because nothing refused the second run.
- **Permutations come from a schema, not from hand-picked cases** — params, one
  simple working case, a schema with min/max/edges and an oracle, tests
  generated from it, run red first. The lock gap survived because every
  hand-written case held one kind of run against its own kind.
- **Values read while an animation is moving are not facts.** Both of the last
  two gate failures were a measurement taken mid-transition. Wait on
  `animation.finished` — the browser's own notification.
- **Three diagnoses of the workspace failure were wrong** (a half-built page, the
  nav rail's max-height, header.css padding). A probe that reproduced the
  failing condition exactly — first, on a cold page — found it in one run.

## Open questions

- The page entrance animation briefly lets #siteBody scroll on every page load.
  Whether readers see a scrollbar flash depends on `.site__body` clipping.
  Recorded on [#1020](https://github.com/CieloVistaSoftware/wb-starter/issues/1020); a product fix is a design choice (opacity-only, or
  `overflow: clip`).
- The general form of the cardstats bug: card.css variant rules keyed on classes
  that a8a7362e stopped injecting. Fixed for cardstats only; the rest belongs
  to [#969](https://github.com/CieloVistaSoftware/wb-starter/issues/969) / [#914](https://github.com/CieloVistaSoftware/wb-starter/issues/914).
- `maxParallelSingle: 2` in lock-permutations.schema.json lets two single-spec
  runs share the machine, which [#1072](https://github.com/CieloVistaSoftware/wb-starter/issues/1072) says collide on the port. Policy call.

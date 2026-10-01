# CURRENT HANDOFF — 2026-09-11

## 🅿️ PARKING LOT

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

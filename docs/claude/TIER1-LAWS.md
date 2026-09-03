# TIER 1 — LAWS (Read Every Session, No Exceptions)

**These are the non-negotiable rules for the WB-Starter project.**  
**If you break these, you will undo John's work. Period.**

---

## 1. LIGHT DOM ONLY — No Shadow DOM, Ever

Shadow DOM causes silent failures. Behaviors render empty, tests still pass because the element exists but has no content. This has burned us multiple times.

- Never use `this.shadowRoot`, `attachShadow()`, or `ShadowRoot`
- Every `<wb-*>` behavior renders directly into Light DOM
- If you see Shadow DOM in existing code, it's a bug — don't copy it

## 2. Composition — WBServices Pattern, Never A Behavior Base Class

Architecture v3.0 is composition, not inheritance. Capability is **applied to** an
element by behavior functions; it is never **acquired by** subclassing.

- Never create or extend `WBBaseComponent` — there is no behavior base class
- A `<wb-*>` tag maps to a behavior function (`src/core/tag-map.js`), which decorates
  the element in place in Light DOM
- Behaviors are registered via `WBServices.register()`
- Behavior functions receive `(element, options)` — they don't use `this`
- The few tags that still keep an `extends HTMLElement` class are registration shims
  the Custom Elements API requires. They hold no shared behavior logic and are not a
  hierarchy to inherit from — most were removed in #279 in favor of behaviors
- Shared logic lives in exported helper functions and CSS/design tokens, not in a
  parent class

## 3. ES Modules Only — No CommonJS, Ever

- Never use `require()`, `module.exports`, or `.cjs` extensions
- Always use `import` / `export`
- This applies everywhere: src, scripts, tests, config files

## 4. Never Run Tests Synchronously

- AI agents use `npm_test_async` only (via MCP `npm_test_async` tool)
- Poll `data/test-status.json` once per minute
- If 3+ failures: STOP fixing, diagnose root cause, report to John
- Only John runs sync tests at the console

### The cap is machine-wide, and a refusal is an answer

Test concurrency is coordinated in `~/.wb-starter/`, **shared by every worktree
and clone** — not per-worktree (#651). Concretely:

- **One suite run at a time, machine-wide.** If another agent's suite is running,
  yours is refused and the error names the holding worktree.
- **At most `WB_MAX_PARALLEL_SINGLE` (default 2) single-spec runs**, machine-wide.
- **Launches are refused below `WB_MIN_FREE_MB` (default 800) of free memory.**

A refusal is not an error to route around. **Wait and retry.** Do not raise the
env overrides, do not call `npx playwright test` directly, and do not delete the
lock file to get past it.

Why this is a law: one 8-worker suite alone takes this box from ~1.4 GB free to
~120 MB. Before the fix each worktree had its own private lock, so five agents
each launched a full suite believing they were alone — and the whole machine
froze. Self-reported pass/fail numbers from those runs were also meaningless,
because the agents silently shared one dev server port (#643).

## 5. Verify The Test Before Fixing The Code

**This is the #1 source of regressions.** Old tests enforce old specs (v1/v2 patterns). When AI makes an old test pass, it reverts code to deprecated patterns and breaks current functionality.

Before fixing code to pass a test:
- Read the test — does it check v3 patterns (`<wb-*>`, `x-*`, Light DOM)?
- Or does it check v1/v2 patterns (`x-behavior`, Shadow DOM, `WBBaseComponent`)?
- If the test is wrong, **fix the test**, don't revert the code
- If unsure, ask John

## 6. One Fix At A Time — Then Test

Never batch fixes. The cascade pattern:
1. Fix A → tests pass
2. Fix B in same session → breaks A silently
3. Fix A again → breaks B
4. Repeat 5 times

Instead: one change → run tests → confirm → next change.

## 7. Don't Guess At Root Causes — Trace Them

If something fails, don't pattern-match to symptoms and apply patches. That's how we fix things 5 times.

- Read the actual error
- Trace it to the actual source
- Understand WHY before changing anything
- If you can't determine why, tell John instead of guessing

## 8. Session Start Protocol

Every session, before doing anything:
1. `list_allowed_directories` — confirm MCP access
2. Read this file (`docs/claude/TIER1-LAWS.md`)
3. Read `docs/_today/CURRENT-STATUS.md`
4. Use `recent_chats` to read last conversation — continue from where it left off
5. Never ask John to upload files or explain what he's working on

## 9. No One-Off Styles — Use Existing CSS or Extend It

**Never create inline styles, new CSS classes, or duplicate existing styles.** This is how `x-btn` ended up duplicating `<button>` across two files, and dark mode broke because styles didn't match.

Before writing ANY CSS or class name:
1. Search `src/styles/behaviors/` — does a style file already exist for this behavior?
2. Search `site.css` imports — is it already loaded?
3. If the class exists, USE IT. Don't invent a new name (`x-btn` vs `<button>`).
4. If new styles are genuinely needed, add them to the existing behavior CSS file.
5. Page-specific layout goes in `src/styles/pages/{pagename}.css` — but ONLY layout, never behavior styles.
6. Never put `<link rel="stylesheet">` in page fragments — the server injects `site.css`.
7. Never put `<style>` blocks or extensive inline styles in HTML files.

If you're not sure where a style belongs, ask John.

## 10. Pages Are Fragments — The Server Handles the Shell

Files in `pages/` are HTML fragments, not full documents.

- No `<!DOCTYPE>`, no manual `<link>` to `site.css` or `x-signature.css`
- The server wraps fragments with the site shell, which injects all global CSS and JS
- Page-specific CSS only: `<link rel="stylesheet" href="../src/styles/pages/{name}.css">`
- Never put `<script type="module">` with WB.init() — the server handles initialization

## 12. Product Name Is "WB-Starter"

The correct product name is **WB-Starter**. The following terms are **forbidden**:
- "WB" + "Framework" — wrong (split to avoid tripping the terminology scanner)
- "WB-Starter" — wrong
- "WB Behaviors" — wrong

Always use "WB-Starter" when referring to the project by name.

## 13. All Tests Must Be Known to Playwright Config

Every `.spec.ts` file must live in a directory that a Playwright project's `testDir` + `testMatch` covers. If you create a new test file or move one, verify it's picked up:

- `tests/compliance/` → auto-discovered by the `compliance` project (`**/*.spec.ts`)
- `tests/behaviors/` → covered by `behaviors` project
- `tests/cards/` → covered by `base` and `behaviors` projects
- `tests/behaviors/`, `tests/pages/`, `tests/semantics/` → covered by `behaviors` project
- `tests/regression/` → covered by `regression` project
- `tests/integration/` → covered by `integration` project
- `tests/views/` → covered by `views` project

If a test isn't in one of these directories, it won't run. Check `playwright.config.ts` before creating tests in new locations.

## 11. No data- Attributes on wb-* Behaviors

**Never use `data-` attributes on `<wb-*>` custom elements or `x-*` behavior elements.** Use plain attributes instead. This applies to HTML pages, tests, demos, and behavior JS code.

- Never use `message`, `type`, `value`, `items`, etc.
- Use plain attributes: `message`, `variant`, `value`, `items`, etc.
- Never use `this.dataset` or `element.dataset` in behavior code — use `element.getAttribute()`
- Never spread dataset properties
- See `docs/architecture/standards/ATTRIBUTE-NAMING-STANDARD.md` for the full naming spec

```html
<!-- ❌ WRONG -->
<div x-alert
  type="warning"
  message="Check input">
  <div
    x-stepper
    value="5"
    min="0"
    max="10">
    <button
      x-toast
      message="Saved!"
      type="success">
      <!-- ✅ CORRECT -->
      <div x-alert
        variant="warning"
        message="Check input">
        <div
          x-stepper
          value="5"
          min="0"
          max="10">
          <button
            x-toast
            message="Saved!"
            variant="success">
```

## 12. Script Output Goes to data/*.json

- Scripts that produce data write to `data/*.json` files
- Never console-only output — it's lost when the session ends
- Status tracking: ONE file only → `docs/_today/CURRENT-STATUS.md`
- Never create duplicate status files

## 14. Reusable Behaviors Never Hardcode `id` — Generate It, or Don't Use One

**A hardcoded `id` inside a behavior/behavior function collides the moment
that behavior appears twice in the same DOM.** Found live in `dialog.js`:
`title.id = 'x-dialog-title'` was set on every dialog instance, so two
dialogs open (or even just present) in the same DOM meant `aria-labelledby`
pointed screen readers at whichever title happened to be first — silently
wrong for every instance after the first.

- Never write `el.id = 'fixed-string'` inside a function that creates a
  per-instance element (a behavior's own title, body, generated content).
- If you need an `id` for `aria-*` linkage, generate a unique one per call:
  `` `x-dialog-title-${Math.random().toString(36).slice(2, 9)}` `` — this
  pattern is already established in `card.js`, `tooltip.js`, `overlay.js`,
  `enhancements.js`. Reuse it, don't reinvent it.
- If you don't need `id` for ARIA/anchor linking, don't add one — use a
  class or scope a `querySelector` to the behavior's own root element
  instead.
- **Exception:** a hardcoded id IS correct for genuine page-level
  singletons — e.g. `style.id = 'x-ripple-styles'` guards "only inject
  this stylesheet once," which is the intended behavior even if the
  behavior using it appears many times. The test: could this element
  legitimately exist more than once in the DOM at the same time? If yes,
  the id must be generated, not hardcoded.

---

## 17. A Push To `.io` Is Not Done Until The Deployed Site Boots

Pushing to `main` publishes live to
https://cielovistasoftware.github.io/wb-starter/. **The push is not the
deliverable. A booting site is.**

After every push to `main`:

```bash
npm run test:smoke:deployed
```

It waits for the Pages build to report `built` (running against a `building`
origin smokes the PREVIOUS deploy and returns a confident, meaningless pass),
then runs `site-smoke` against the live site. Green = done. Anything else = the
site is broken and you fix it before you say a word about anything else.

**The URL comes from the system environment**, per John's rule that all
environment variables are stored and used at the system level. `SMOKE_BASE_URL`
is set at the user level on this machine; the script reads it and never
invents one. If it is missing the script says so and stops rather than
guessing. `--url <address>` overrides for a one-off run against somewhere else.

### What does NOT count as verification

- **Grepping the served HTML.** This is what was actually done, and it passed
  while the site was dead.
- **A 200 on every asset.** Every file was served correctly during the outage.
- **The local suite.** It runs against localhost and cannot see a bad deploy.
- **CI being green.** CI does not load the deployed origin either.
- **"The file I pushed has the right content."** It did. The site was still
  down.

### Why this is a law

`4278fcf7` shipped one unresolved named import. That is a **module-level
`SyntaxError`**, so nothing evaluated, and every route on the live site showed
the literal text `Loading...` — for every visitor, indefinitely. The HTML was
correct. The CSS was correct. Every asset returned 200. The deploy was declared
good on that basis.

**John found it, on his phone.** Three layers of gate — pre-commit, CI, and my
own check — all passed a total outage, because not one of them ran the page.

The smoke test (`tests/compliance/site-smoke.spec.ts`, #990) exists precisely
for this. It listens on `pageerror` as well as `console`, because a
module-level `SyntaxError` never reaches `console`. It fails if the body is
still `Loading...`. It was proven by fault injection, not by passing.

### One more trap

A deployed fix can be **invisible for ten minutes**. JS is served
`Cache-Control: max-age=600` at URLs with no content hash (#989), so a browser
that loaded the broken build will keep it. If the smoke test fails right after
a push, re-fetch with `{cache:'reload'}` before concluding the fix did not
land — and never tell John it is live when you have only checked the origin.

---

## Known Broken Areas (Don't Touch Without John's Direction)

- **Schema viewer** — Schema dropdown doesn't populate. Known issue, not a priority.

---

## The Golden Rule

**If you're not sure, STOP and ask John.** A wrong fix costs more than a 30-second question. John has 30+ years of experience and knows this codebase better than any AI ever will. Your job is to be his power tool, not his replacement.

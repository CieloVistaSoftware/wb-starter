# TIER 1 — LAWS (Read Every Session, No Exceptions)

**These are the non-negotiable rules for the WB-Starter project.**  
**If you break these, you will undo John's work. Period.**

---

## 0. SEMANTIC ELEMENTS FIRST — That Is The Architecture

This project evolved to a **semantic-elements-first** architecture. Read that as the
starting point for every decision, not as a style preference.

The HTML element IS the thing. `<article>` is a card. `<figure>` is a figure.
`<nav>` is navigation. A behavior does not create a widget — it enhances an element
that already means something.

**WHY, in John's words: "users will know html5 by default."**

That is the whole design. An author already knows `<article>`, `<figure>`, `<nav>`,
`<table>`, `<details>`. They learned it once, from the platform, and it does not
change. Every custom tag, invented class name or bespoke wrapper this project ships
is vocabulary a user has to learn INSTEAD of what they already know — and forget
again when they move to the next project.

So the measure for any addition is: **does this make someone learn something new to
express something HTML already expresses?** If yes, it is the wrong shape. That single
question is behind every rule below — no custom elements (new tags to learn), no
injected classes (invented names for facts the DOM already states), attributes over
wrappers (no extra structure to memorise), `<figure>` over `<div x-demo>` (one is
already known, one has to be explained).

**What follows from it, and what people keep getting wrong:**

- **Reach for the closest semantic element, always.** `<div>` is the last resort,
  including in examples and demos. A `<div>` says nothing about what it holds.
- **The attribute is the behavior; the host tag is the author's choice.**
  `<div x-pagination>`, `<nav x-pagination>` and `<section x-pagination>` are all
  valid. Never pin a tag in a selector, a test, or a stylesheet
  (`nav[x-pagination]` left `<div x-pagination>` unstyled — #909).
- **Do not inject a class that restates the element.** The tag and the attribute
  are already in the DOM; a class repeating them is duplication, and CSS can select
  the attribute or the native pseudo-class directly (`:checked`, `[multiple]`).
  a8a7362e removed that from cards; #913 removed the requirement entirely.
- **Semantic injection runs first** — see §4b.

If a decision starts with "what wrapper do I need", the answer is usually "none —
which element already means this?"

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

## 4b. Auto-Injection Is ON, And Semantic Runs First — Always

Two facts. Neither is negotiable, neither needs re-deriving, and both have been
explained repeatedly:

1. **`autoInject` is ON by default.** `src/core/config.js` sets `autoInject: true`.
   A page opts OUT with `WB.init({ autoInject: false })`. Never assume it is off.

2. **Semantic injection happens first, every time.** A semantic tag IS its
   behavior (`<article>` is a card, `<figure>` is a figure). That injection runs,
   and THEN any explicit `x-*` attribute behavior runs on the already-injected
   element. `<figure x-demo>` is normal and correct: figure first, then demo.

**There is no race between them. Do not invent one.** If you find a comment
suggesting otherwise, the comment is stale — `src/core/wb.js` carried
"the main SPA (autoInject correctly off there)" long after the default flipped,
and it has misled more than one reader into the wrong diagnosis.

Corollary: if a behavior does not appear to run, the question is never "do these
two behaviors conflict?" It is "did auto-injection run on this page at all?" --
check a plain semantic tag with no attributes as your control.

**WHY it is on by default, in John's words: "autoinject on means they get all of
our extras for free."**

This is the payoff half of Law 0. Law 0 says the author only has to know HTML5;
auto-injection is what makes knowing HTML5 *sufficient*. Someone writes plain
`<article>`, `<figure>`, `<table>`, `<details>` -- markup they would have written
with no framework at all -- and the styling, keyboard handling, responsive
behavior and accessibility wiring arrive without a single line of opt-in. No
registration call, no import, no class to remember, no attribute to add.

Two consequences follow, and they bind harder than they look:

- **Opt-out, never opt-in.** Any proposal that makes an author *add* something to
  receive a default is backwards -- it converts a free extra into a thing to
  learn, which is exactly what Law 0 forbids. The extras are the floor, not an
  upgrade.
- **A bare semantic tag is a shipping surface.** Because every `<article>` on
  every page gets the card treatment whether or not its author asked, a
  regression in a semantic default is not a demo bug -- it reaches pages nobody
  edited. Weight them accordingly.

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

**And before writing ANY script, gate, reporter or analysis tool:
read [`docs/claude/TOOLING-INVENTORY.md`](TOOLING-INVENTORY.md) first.**

That file lists what already exists — the machine-readable test output, the
three ratchets and their baselines, the attribute readers. It exists because
each of those has been reinvented at least once by someone who did not know
it was there, and a second mechanism measuring the same thing drifts from the
first until the two disagree with nobody noticing.

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

## 16. No Inline Styles. No `!important`. Anywhere.

**John: "those are both signs of weakness."** They are not style preferences —
they are the two ways a stylesheet gets overruled, and each one makes the next
override necessary.

Current debt, measured: **831 inline declarations across 56 behaviors**, **140
`!important` in CSS**, **60 `!important` written from JS**. Every one is a
target; none is a precedent.

**Why they accumulate — the #965 lesson.** 67% of `card.css` was being discarded
by the browser (13 selectors carried a stray `)` from the `:is()` migration, and
an invalid selector makes the parser drop that rule *and* everything after it).
With the stylesheet silently dead, nothing written in CSS rendered, so the only
thing that worked was an inline style — and when two inline styles collided, the
escalation was `!important`. The weakness was never the cascade. It was a
stylesheet that could not parse, and nothing measuring whether it had.

So when reaching for either, the honest question is: *what is overriding me, and
why?* An inline style or an `!important` answers "make this win now" while
leaving "why was it losing?" permanently unanswered — and the answer is
sometimes that the rule you are fighting does not even exist.

**The rule**

- Styling belongs in CSS, selected by tag, attribute or class.
- The only inline style that survives review is a genuinely per-instance value
  the author supplies — a user's cover-photo URL, a computed drag offset. Not
  layout, not colour, not spacing.
- `!important` is not an escape hatch. If a rule is losing, fix its specificity
  or fix the rule that is beating it.
- A "migration" that COPIES styles into CSS without deleting the inline original
  has done nothing: inline still wins. card.css claims link-card styles were
  "moved here from cardlink()'s inline cssText" while `card.js` still writes
  them — so the CSS was dead weight and the comment was false.

## 15. Source Code Is Never Authored Through A Shell Heredoc Or A Python String

**Write and Edit put exact bytes on disk. A heredoc does not.** Text that
passes through Python → shell → a JS/TS string literal crosses three escaping
layers, and every one of them eats backslashes.

This is not hypothetical. In a single session it produced five defects:

- `\s` collapsed to `s` **three times**, giving `(?:^|s)` — a regex that
  matched nothing, in code whose whole job was matching.
- `\n` inside a generated JS string became a **real newline**, producing an
  unterminated string literal that would not parse.
- An `eslint-disable-next-line` landed one line above the code it was meant to
  cover, because the inserted comment was two lines long. Result: the
  suppression did nothing *and* added an "unused directive" warning.

The failure mode is what makes it dangerous: the corrupted code is still
**valid syntax**. A regex that matches nothing throws no error. It silently
reports "no problems found" forever — the same class of defect as #923's
dead guard and #946's unreachable fallback.

**The rule**

- Authoring or modifying **code** (`.js`, `.mjs`, `.ts`, `.css`, `.html`)
  → use **Write** or **Edit**. Never a heredoc, never `sed -i`, never a
  Python `str.replace` that emits code.
- Scripted edits are for **bulk data** — regenerating a `data/*.json`,
  rewriting 200 files mechanically. Not for hand-written logic.
- **Any patch containing a backslash is read back and verified before moving
  on** — `grep -n 'pattern' file | cat -v` shows you the real bytes. This is
  the tripwire; it catches every case above.

If a scripted edit is genuinely unavoidable, build the string with explicit
character codes (`chr(92)`, `String.fromCharCode(27)`) rather than trusting
escapes to survive the trip.

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

## 18. NO POLLING. Use A Notification.

**John: "NO POLLING ALLOWED us notifications instead."**

Never sleep, never poll a timer, never spin on `requestAnimationFrame` waiting
for something to become true. If code needs to know when something finished,
the thing that finishes must **say so**.

- Product code: dispatch an event (`wb:layout-settled`) and/or set `x-ready`
  when the work completes. Clear the flag when new work is queued, so nobody
  can read a stale signal.
- Tests: wait for that event or `x-ready`, never `waitForTimeout`. If the signal
  does not arrive, fail loudly and say the signal is missing.
- Waiting on a condition you cannot be notified about is a design gap in the
  thing you are waiting on. Fix that, do not paper over it with a delay.

### Why this is a law

The #992 test slept 120ms after each keypress and was flaky **2 runs in 5**. The
instinct was to lengthen the wait. That would have buried a real defect.

Replacing the sleep with a `wb:layout-settled` notification immediately produced:

```
Error: wb:layout-settled never fired — the page stopped announcing layout completion
```

The sizing sync **did not run on every selection** — arrowing sometimes changed
nothing the ResizeObserver watched. The flakiness was never the test being
impatient; it was the product having no signal to give. A longer timeout would
have hidden that indefinitely.

A poll can only ever tell you "not yet, as far as I know". It cannot tell the
difference between *slow* and *never*. A notification can, and that difference
is usually the bug.

### The one exception

Polling an **external** system that offers no callback — a remote HTTP endpoint,
a build service. Anything inside this codebase can be made to announce itself,
so make it.

---

## Known Broken Areas (Don't Touch Without John's Direction)

- **Schema viewer** — Schema dropdown doesn't populate. Known issue, not a priority.

---

## The Golden Rule

**If you're not sure, STOP and ask John.** A wrong fix costs more than a 30-second question. John has 30+ years of experience and knows this codebase better than any AI ever will. Your job is to be his power tool, not his replacement.

# TIER 1 — LAWS (Read Every Session, No Exceptions)

**These are the rules that have caused the most regressions when violated.**  
**If you break these, you will undo John's work. Period.**

---

## 1. LIGHT DOM ONLY — No Shadow DOM, Ever

Shadow DOM causes silent failures. Components render empty, tests still pass because the element exists but has no content. This has burned us multiple times.

- Never use `this.shadowRoot`, `attachShadow()`, or `ShadowRoot`
- Every `<wb-*>` component renders directly into Light DOM
- If you see Shadow DOM in existing code, it's a bug — don't copy it

## 2. WBServices Pattern — Not WBBaseComponent

Architecture v3.0 uses the WBServices pattern with proper HTMLElement inheritance.

- Never create or extend `WBBaseComponent`
- Components are registered via `WBServices.register()`
- Behavior functions receive `(element, options)` — they don't use `this`

## 3. ES Modules Only — No CommonJS, Ever

- Never use `require()`, `module.exports`, or `.cjs` extensions
- Always use `import` / `export`
- This applies everywhere: src, scripts, tests, config files

## 4. Never Run Tests Synchronously

- AI agents use `npm_test_async` only (via MCP `npm_test_async` tool)
- Poll `data/test-status.json` once per minute
- If 3+ failures: STOP fixing, diagnose root cause, report to John
- Only John runs sync tests at the console

## 5. Verify The Test Before Fixing The Code

**This is the #1 source of regressions.** Old tests enforce old specs (v1/v2 patterns). When AI makes an old test pass, it reverts code to deprecated patterns and breaks current functionality.

Before fixing code to pass a test:
- Read the test — does it check v3 patterns (`<wb-*>`, `x-*`, Light DOM)?
- Or does it check v1/v2 patterns (`data-wb`, Shadow DOM, `WBBaseComponent`)?
- If the test is wrong, **fix the test**, don't revert the code
- If unsure, ask John

## 6. Check The Lock Folder Before Editing Any File

- Read `/Lock` folder before touching any file
- If `LOCKED-{filename}.md` exists → do NOT edit that file
- Create a lock before editing, delete it when done
- This prevents multi-AI conflicts that have corrupted files

## 7. One Fix At A Time — Then Test

Never batch fixes. The cascade pattern:
1. Fix A → tests pass
2. Fix B in same session → breaks A silently
3. Fix A again → breaks B
4. Repeat 5 times

Instead: one change → run tests → confirm → next change.

## 8. Don't Guess At Root Causes — Trace Them

If something fails, don't pattern-match to symptoms and apply patches. That's how we fix things 5 times.

- Read the actual error
- Trace it to the actual source
- Understand WHY before changing anything
- If you can't determine why, tell John instead of guessing

## 9. Session Start Protocol

Every session, before doing anything:
1. `list_allowed_directories` — confirm MCP access
2. Read this file (`docs/claude/TIER1-LAWS.md`)
3. Read `docs/_today/CURRENT-STATUS.md`
4. Check `/Lock` folder
5. Use `recent_chats` to read last conversation — continue from where it left off
6. Never ask John to upload files or explain what he's working on

## 10. No One-Off Styles — Use Existing CSS or Extend It

**Never create inline styles, new CSS classes, or duplicate existing styles.** This is how `wb-btn` ended up duplicating `wb-button` across two files, and dark mode broke because styles didn't match.

Before writing ANY CSS or class name:
1. Search `src/styles/behaviors/` — does a style file already exist for this component?
2. Search `site.css` imports — is it already loaded?
3. If the class exists, USE IT. Don't invent a new name (`wb-btn` vs `wb-button`).
4. If new styles are genuinely needed, add them to the existing behavior CSS file.
5. Page-specific layout goes in `src/styles/pages/{pagename}.css` — but ONLY layout, never component styles.
6. Never put `<link rel="stylesheet">` in page fragments — the server injects `site.css`.
7. Never put `<style>` blocks or extensive inline styles in HTML files.

If you're not sure where a style belongs, ask John.

## 11. Pages Are Fragments — The Server Handles the Shell

Files in `pages/` are HTML fragments, not full documents.

- No `<!DOCTYPE>`, no manual `<link>` to `site.css` or `wb-signature.css`
- The server wraps fragments with the site shell, which injects all global CSS and JS
- Page-specific CSS only: `<link rel="stylesheet" href="../src/styles/pages/{name}.css">`
- Never put `<script type="module">` with WB.init() — the server handles initialization

## 12. Script Output Goes to data/*.json

- Scripts that produce data write to `data/*.json` files
- Never console-only output — it's lost when the session ends
- Status tracking: ONE file only → `docs/_today/CURRENT-STATUS.md`
- Never create duplicate status files

---

## Known Broken Areas (Don't Touch Without John's Direction)

- **Builder app** — AI regressed it. Builder tests are SKIPPED. Don't touch builder files unless John explicitly asks.
- **Schema viewer** — Schema dropdown doesn't populate. Known issue, not a priority.

---

## The Golden Rule

**If you're not sure, STOP and ask John.** A wrong fix costs more than a 30-second question. John has 30+ years of experience and knows this codebase better than any AI ever will. Your job is to be his power tool, not his replacement.

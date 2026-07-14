# Demos & Documentation Standards

**These rules apply to EVERY demo (`demos/**/*.html`, `pages/**/*.html`) and EVERY
Markdown document (`docs/**/*.md`, `*.md`) in wb-starter.** They are the single source
of truth for how we show components and code. When something here can be enforced by a
test, it is — run `npm test` (which now includes the `integration` project).

---

## 1. Live examples use `<wb-demo>`

Every component example is a `<wb-demo>` — it renders the **live control** AND shows its
**source** underneath. One tag gives both.

- In `.md` docs: embed a **raw** `<wb-demo>…</wb-demo>` directly in the Markdown. Do NOT
  use a ` ```demo ` fence (retired) — the doc-viewer renders embedded `<wb-*>` / `x-*`.
- In `.html` demos: use `<wb-demo>` the same way.

## 2. One code sample per rendered element (strict 1:1)

- **Never** show more than one code sample for a single rendered element.
- **Never** show one code sample for multiple rendered elements (e.g. one snippet under
  three pricing cards).
- Each rendered element gets **its own** `<wb-demo>`, with its source directly beneath it.

## 3. Demos are vertical — never side-by-side

- Do NOT place two rendered demos on the same row.
- Stack demos vertically; the code appears immediately **after** its rendered element.

## 4. Code examples are syntax-highlighted (in color)

- Code is **never** plain, uncolored monospace.
- Color hljs tokens with **theme variables** (`--primary`, `--success-color`,
  `--info-color`, `--warning-color`, `--danger-color`, `--text-muted`), scoped so they
  outrank any injected highlight theme — **not** a vendored/CDN palette.
- Every code block has a **Copy** button.

## 5. Code examples are vertically formatted

- One tag per line; each child element indented under its parent. Preserve the source
  line breaks (never collapse a multi-line block onto one line).
- A **multi-attribute element** renders **each attribute on its own line** — never a
  single long horizontal line. A `<wb-demo>` whose rendered source is one long line
  (forcing a horizontal scroll) violates this. (Tracked project-wide; see #254.)
- **Short-tag exception:** an element whose whole tag is short (roughly **under 25
  characters**, e.g. `<wb-badge label="New">`) stays on ONE line — one element per
  line. Don't split short tags pointlessly. There is **no "inline format" override**
  beyond this; vertical is the only format.

## 6. Code examples never show a horizontal scrollbar

- Long lines **wrap** (`white-space: pre-wrap`; `overflow-x: hidden`). There is **no**
  horizontal scrolling of code, at any viewport width.

## 7. A demo is only as wide as what it renders

- Card/component demos are sized to the element, **not** stretched to full screen.

## 8. Never render a `.md` without the theme

- Any surface that turns Markdown into a page must be **themed**. **`mdhtml` is the
  single Markdown formatter** — never hand it pre-rendered HTML (that double-parses and
  mangles code; see `docs/_today/ROOT-CAUSE-md-double-parse.md`).
- The dev server serves **raw Markdown** for `/docs/*.md` fetches, and **redirects**
  direct browser navigation to the themed doc-viewer.

## 9. Composition over inheritance

- Components compose via `<wb-*>` tags + `x-*` behaviors. There is **no** component
  base-class hierarchy. Do not write "is-a", "variants inherit from `cardBase`", or
  "Why Inheritance Matters" — reframe as composition.
- **HTML `extends` is purged.** The old design (customized built-ins:
  `class X extends HTMLButtonElement`, `customElements.define(…, { extends: 'button' })`,
  `is="…"`) is gone. Docs and demos must not show `extends`-based component code —
  **not even as a counter-example** (it still teaches the pattern). Describe other
  frameworks' class approaches in prose if a comparison is needed.
  Enforced by `tests/compliance/no-html-extends-docs.spec.ts`.

## 10. Mobile-first / responsive

- Menus and navs **stack** on mobile; no horizontal overflow at any width. Design for the
  narrowest screen first, then enhance up.

## 11. Zero hardcoded colors

- Theme CSS variables only. Only `themes.css` (and documented exceptions) may hold color
  literals.

## 12. Anatomy docs label every part

- When documenting a component's structure, name each element plainly
  ("this is the header / title / main — the body / footer").

## 13. Every example has proper margins & padding

- No cramped, zero-spacing layouts. Examples and their containers have visible
  breathing room: **≥ 1rem** vertical spacing between examples, and **≥ 1rem** padding
  inside example/demo containers. Spacing comes from theme/spacing variables, not ad-hoc
  values. (Tracked project-wide; see #239.)

## 14. Doc sections that reference a doc must link to it

- If a section mentions or points at another document, it must render a **clickable link**
  to that doc (via the doc-viewer's path-linking or an explicit Markdown link). A section
  that names a doc but gives no way to open it is a defect.

## 15. Overlays and popups stay within bounds

- A popover, tooltip, dropdown, menu, or any floating layer must **not overflow** its
  parent element or the viewport. It must reposition/flip or clamp to stay fully visible.
  A popup that spills outside its parent's bounds is a defect. (Tracked project-wide; see
  #252 — parent-overflow detection test.)

## 16. Every demo shows a working demo AND its code

- The `demos/` folder exists so users can **see how it's done in HTML**. Therefore
  **every file in `demos/`** must present BOTH a **working live demo** AND the **source
  code** that produced it — never one without the other. `<wb-demo>` is the ideal tool
  (it renders the live control and shows its source in one tag). A demo page with a live
  example but no code — or code with no live example — is a defect.
- **Every canonical demo includes a MIXED-BEHAVIORS example**: `x-*` attributes composed
  onto the element — including onto `<wb-*>` tags (wb-tags take x-attributes too). This
  shows developers how to add function to markup already in place. All of it inside
  `<wb-demo>`.

## 17. Grouped controls are ONE demo (exception to §2)

- Some controls belong to a **single logical group** — e.g. radio buttons that share a
  `name`, or a set of related checkboxes. For a group, the **whole group** is the unit:
  put the entire group in **one** `<wb-demo>` with one code sample. Do NOT split each
  individual `<input>`/control into its own demo. This is the intended exception to §2
  ("one code sample per rendered element") — for a group, the group IS the element.

## 18. Many controls go in a `<wb-container>`

- When a demo displays **many controls or items together** (a set of related controls,
  a list of examples), wrap them in a `<wb-container>` so they get consistent, contained
  layout instead of loose free-floating markup. Reach for `<wb-container>` whenever you'd
  otherwise show a large ungrouped block of controls.

## 19. Every declared attribute must be tested to actually WORK

- If markup declares a configuration attribute (`size`, `variant`, `elevated`,
  `clearable`, `autosize`, …), there must be a test that asserts the attribute produces
  its **real effect** — not merely that the element renders or a class was added.
- Tests are **effect-based**, not presence-based: e.g. `<button size="xs">` and
  `<button size="xl">` must have **different computed sizes**; `variant="primary"` vs
  `variant="danger"` must differ visibly. A demo that shows `size="xs"` while the button
  renders at default size is a defect the test must catch. Cover BOTH the custom element
  (`<wb-button>`) and the native element (`<button>`) paths.

## 21. Watch CI after every push — local-green is not done

- A push is **not done** until the GitHub Actions run for it is **green**. After every
  push, check the run (`gh run list` / `gh run watch`); a red CI is treated exactly like
  a red local gate — investigate immediately, file the issue, fix.
- Beware environment differences (Linux CI vs local Windows): fonts, scrollbar metrics,
  and paths make browser assertions behave differently — a test must pass on **both**.

## 20. Boolean `x-*` attributes are written BARE — never `=""`

- A valueless behavior attribute is written `x-ripple`, **never** `x-ripple=""`. The
  `=""` adds no value, lengthens the markup, and teaches users to type a useless string.
  Applies to all source HTML and all code samples (the `<wb-demo>` pretty-printer
  already emits bare names for empty values). Enforced by
  `tests/compliance/no-empty-x-attr-values.spec.ts`; fix with
  `node scripts/remove-empty-x-attr-values.mjs`.

## 22. A demo switch that represents a real capability must invoke it

- When a switch demo's label names an actual effect (e.g. "Notifications", "Dark Mode"),
  turning it ON must **actually demonstrate that effect** — not just flip visually with no
  observable result. A "Notifications" toggle that does nothing on activation doesn't show
  what it does. Use `<wb-switch notify-control>` to fire a real toast when switched ON
  (see `src/wb-viewmodels/semantics/switch.js`); `theme-control` is the existing precedent
  for the same idea applied to the "Dark Mode" switch.

## 23. Tables break correctly or reduce font size — never mid-word

- A table cell must never split a word/identifier mid-character (e.g. `wb:details:tog` /
  `gle` across two lines). Prose wraps at word boundaries; unbroken tokens (event names,
  `code` identifiers, class names) must either fit on one line or the table scrolls
  horizontally (`overflow-x: auto`, already standard — see `.wb-mdhtml table`) — they must
  never be force-broken via `overflow-wrap: anywhere`. If a table is cramped, the fix is a
  smaller font-size or a horizontal scroll, not a broken word. `.wb-mdhtml td code` /
  `.wb-mdhtml th code` are `white-space: nowrap` for exactly this reason
  (`src/styles/behaviors/mdhtml.css`).

---

## Enforcement & references

| Rule | Test / reference |
|------|------------------|
| 1, 2 (wb-demo, 1:1) | `tests/integration/doc-viewer-wb-demo.spec.ts` |
| 4 (highlighted + copy) | `tests/integration/frameworks-demo.spec.ts`, `demo-compare-code-blocks.spec.ts` (#241) |
| 3, 5 (vertical) | `tests/integration/demo-compare-code-blocks.spec.ts` |
| 5, 8 (no double-parse) | `tests/integration/doc-viewer-code-multiline.spec.ts`; `docs/_today/ROOT-CAUSE-md-double-parse.md` |
| 9 (composition) | `tests/compliance/no-legacy-component-inheritance-docs.spec.ts` |
| 11 (colors) | `tests/compliance/css-oop-compliance.spec.ts` |
| 22 (switch invokes effect) | `tests/behaviors/notify-control-switch.spec.ts` |

Open work to bring existing surfaces to this standard: #246 (behaviors-showcase selects),
#247 (behaviors-showcase mobile nav), #248 (no horizontal scrollbars), and the remaining
`pages/components.html` sections (Feedback/Overlays).

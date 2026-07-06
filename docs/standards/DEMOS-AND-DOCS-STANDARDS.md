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

Open work to bring existing surfaces to this standard: #246 (behaviors-showcase selects),
#247 (behaviors-showcase mobile nav), #248 (no horizontal scrollbars), and the remaining
`pages/components.html` sections (Feedback/Overlays).

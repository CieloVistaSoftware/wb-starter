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
- **Carve-out for `<wb-demo>`-generated code panels specifically (#390):** these use
  horizontal scroll instead of wrapping (`demo.js` omits the `wrap` attribute, so
  `pre.css`'s default editor-style scrolling applies). Explicit override from John. Every
  other `<pre x-behavior="pre">` on the site still follows the no-scrollbar rule above.
- **Carve-out for `demos/frameworks.html`'s 5 hand-written framework code samples
  (#241, #449):** same reasoning and same mechanism (these `<pre language="…">` blocks
  omit `wrap` too) — long import/JSX lines read worse wrapped mid-identifier than
  scrolled. Explicit override from John (confirmed again after #449 briefly wrapped them
  by mistake while fixing an unrelated padding bug). Test:
  `tests/regression/frameworks-code-block-no-wrap.spec.ts`.

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

## 24. Elements must never unintentionally overlap

- Two normal-flow content elements (text, images, buttons — anything the user reads or
  clicks) must never render on top of one another. A collision usually means a missing
  clearfix, a stray `position: absolute`, a z-index accident, or a bad negative margin.
- This does **not** apply to *intentional* overlap: fixed/sticky headers, popovers,
  tooltips, dropdown menus, badges pinned to a card corner, resize handles anchored to a
  boundary, or decorative absolutely-positioned layers (glass-card shimmer, backdrops).
  Those are opted out because they are taken out of normal flow (`position: absolute` /
  `fixed` / `sticky`) or carry a recognizable decorative role — not because the check
  special-cases them by name.
- Detection is bounding-box intersection (via `getClientRects()`, so wrapped multi-line
  inline elements aren't falsely flagged by one oversized box) scoped to elements that
  render their own visible content and sit in normal document flow. A geometry-only check
  on a *container* (e.g. a flex-grow page wrapper whose box extends into empty space above
  the footer) is not a real collision — scoping to leaf content elements avoids that class
  of false positive without pixel-diffing. See `tests/integration/overlap.spec.ts` (#274).

## 25. `<wb-demo>` exception: source that can't run without a build step

- §1/§16 require `<wb-demo>` because it renders the **exact same markup** it shows as
  "source" — the live control and the code below it are structurally guaranteed to
  match. That guarantee breaks for **framework-integration snippets** whose instructive
  source only produces DOM after a compile step — wrapping the post-mount HTML (or the
  mounting `<script>`) in `<wb-demo>` would show something other than what a developer
  using that framework would actually write, losing the pedagogical content `<wb-demo>`
  exists to preserve. This does NOT mean "no live render" — React, Vue, Svelte, and
  SolidJS all get a real live render on `demos/frameworks.html` (see below); they're
  just not wrapped in `<wb-demo>` specifically, because `<wb-demo>` additionally
  requires the rendered markup and the shown "source" to be 1:1 identical, which
  compiled framework output never is.
- **What counts as "requires a build step" narrowed (#460):** originally this section
  covered React, Vue, Svelte, Angular, and SolidJS as a group. Investigation (#460)
  found that's only true for **Angular**. React and Vue already ran live via CDN UMD
  builds + a plain `<script>` tag (no compiler needed at all). Svelte and SolidJS
  turned out to be genuinely compilable **client-side, at runtime, with no server build
  or bundler**:
  - **Svelte**: `svelte/compiler` is plain JS. Loaded from a CDN (e.g. esm.sh) in a
    `<script type="module">`, it compiles the exact `.svelte`-equivalent source shown
    in the page's code sample into a real Svelte component, which is then mounted
    (after rewriting the compiled output's bare `svelte/internal` import specifiers to
    resolvable URLs and loading it via a `Blob` + dynamic `import()`).
  - **SolidJS**: the actual JSX-to-DOM transform Solid ships is a Babel plugin,
    `babel-plugin-jsx-dom-expressions` (which `babel-preset-solid` merely wraps with
    Solid's default options) — plain JS, runnable via `@babel/standalone` in the
    browser (the same in-browser-Babel technique React historically supported via
    `<script type="text/babel">`). Running that real plugin, at runtime, on the exact
    source shown produces the same kind of output Solid's own build pipeline would.
  - Both are the framework's REAL compiler/transform output, generated in-browser
    instead of ahead of time — not a hand-written imitation of what the framework
    would produce.
  - **Angular remains the exception.** Unlike the frameworks above, Angular has not
    published a browser-ready UMD or JIT-compiler bundle for any version since the Ivy
    renderer became the default (~v9) — current `@angular/core` ships only deep
    `esm2022/**/*.mjs` internal modules meant to be resolved and tree-shaken by a
    bundler (Angular CLI/esbuild), not consumed directly via a CDN `<script>` tag or
    import map. Reviving Angular's old CLI-free SystemJS quickstart would mean pinning
    to a years-obsolete, pre-Ivy version using deprecated APIs (ViewEngine, NgModule
    bootstrap) not reflected in a modern code sample — a misleading, non-representative
    demo, not an honest one. Angular keeps the "no live render" treatment below.
- For whichever framework(s) genuinely can't run without a real build step (currently:
  Angular only) — keep the code sample as a syntax-highlighted, copyable `<pre>` block
  (§4 still applies in full) and label it explicitly as non-live, with a SPECIFIC
  reason (not just "requires a build step" — say what's actually missing, e.g. "has not
  published a browser-ready UMD or JIT bundle since ..."). A code sample with no live
  render is a defect (§16) **unless** it carries this explicit, specific label; a
  silently-missing live render is still a defect.
- This is NOT a blanket exception for anything merely inconvenient to wrap. If the
  snippet is plain, framework-agnostic HTML/attributes that already runs with no build
  step (e.g. an HTMX example — real HTML, `hx-*`/`x-*` attributes, no compiler), it
  MUST use `<wb-demo>` like any other component example — only genuinely non-executable
  source is exempt. See `demos/frameworks.html` for all cases side by side: the HTMX
  section uses `<wb-demo>`; React/Vue/Svelte/SolidJS render live but aren't wrapped in
  `<wb-demo>` (compiled/mounted output isn't 1:1 with the shown source); Angular is the
  sole remaining labeled "no live render" exception. Tracked: #324, #460.

## 26. `<wb-demo>` code panel is full width on mobile — no layout shift between demos

- **Mobile only (≤700px).** Below that width, the **code sample** portion of `<wb-demo>`
  (distinct from the rendered control governed by §7) must span the **full width** of its
  container, even when the rendered control above it is narrow.
- Goal: eliminate "window slop" — the page width, scrollbar, or demo container resizing/
  shifting as different `<wb-demo>` blocks (with shorter or longer code) scroll into view
  on a long mobile page.
- The rendered control still follows §7 (sized to what it renders); only the code panel
  underneath is stretched full width, so the page's horizontal footprint stays constant
  regardless of which demo is on screen.
- **Above 700px (desktop/tablet), §26 does NOT apply.** The whole demo — control and code
  panel together — hugs its content as one unit per §7, same as ever. Forcing the code
  panel full width on wide viewports orphans a small control in a large empty gap with a
  much wider code block directly below it, which reads worse than the problem §26 exists
  to fix. §26 is a narrow-viewport fix for a narrow-viewport problem.

## 27. A demo whose control fires a custom event should teach how to listen for it

- `<wb-demo>` shows a control's markup, but markup alone doesn't teach a reader how to
  react to what the control **does** afterward. When a demoed control fires one or more
  documented `wb:*`/`x:*` custom events (see `docs/behaviors-reference.md`'s Events
  table), add an `events` attribute listing them:
  `<wb-demo events="wb:switch:change">`.
- This adds two things, automatically, right below the existing source panel — no
  hand-written prose required:
  1. An example `addEventListener` code sample, syntax-highlighted and copyable like any
     other code panel (§4/§5).
  2. A **live** log that shows the event actually firing in real time as the reader
     interacts with the rendered control above it — proof, not just claims.
- Not every demo needs this — a control with no interesting event (e.g. a static
  `<wb-badge>`) doesn't gain anything from an empty events section, so the attribute is
  opt-in, not mandatory on every `<wb-demo>`. Add it where a reader would plausibly want
  to hook into the control's behavior in their own code (form controls, toggles, tabs,
  search, anything with a meaningful `detail` payload). Tracked: #385.

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
| 24 (no unintended overlap) | `tests/integration/overlap.spec.ts` (#274) |
| 1, 16, 25 (wb-demo / build-step exception) | `tests/integration/frameworks-demo.spec.ts` (#324) |

Open work to bring existing surfaces to this standard: #246 (behaviors-showcase selects),
#247 (behaviors-showcase mobile nav), #248 (no horizontal scrollbars), and the remaining
`pages/components.html` sections (Feedback/Overlays).

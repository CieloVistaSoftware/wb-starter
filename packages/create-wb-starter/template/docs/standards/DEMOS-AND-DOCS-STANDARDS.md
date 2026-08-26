# Demos & Documentation Standards

**These rules apply to EVERY demo (`demos/**/*.html`, `pages/**/*.html`) and EVERY
Markdown document (`docs/**/*.md`, `*.md`) in wb-starter.** They are the single source
of truth for how we show components and code. When something here can be enforced by a
test, it is — run `npm test` (which now includes the `integration` project).

---

## 1. Live examples use `<div x-demo>`

Every component example is a `<div x-demo>` — it renders the **live control** AND shows its
**source** underneath. One tag gives both.

- In `.md` docs: embed a **raw** `<div x-demo>…</div>` directly in the Markdown. Do NOT
  use a ` ```demo ` fence (retired) — the doc-viewer renders embedded `<wb-*>` / `x-*`.
- In `.html` demos: use `<div x-demo>` the same way.

## 2. One code sample per rendered element (strict 1:1)

- **Never** show more than one code sample for a single rendered element.
- **Never** show one code sample for multiple rendered elements (e.g. one snippet under
  three pricing cards).
- Each rendered element gets **its own** `<div x-demo>`, with its source directly beneath it.

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
  single long horizontal line. A `<div x-demo>` whose rendered source is one long line
  (forcing a horizontal scroll) violates this. (Tracked project-wide; see #254.)
- **Short-tag exception:** an element whose whole tag is short (roughly **under 25
  characters**, e.g. `<span x-badge label="New">`) stays on ONE line — one element per
  line. Don't split short tags pointlessly. There is **no "inline format" override**
  beyond this; vertical is the only format.
- **Array-valued attributes must start each row on its own indented line** — e.g.
  `rows='[...]'` on `<table>` renders as pretty-printed JSON with one array entry
  per line, never a single flattened line mixing headers and cell values together.
  Applies to any attribute whose value is a JSON array shown in a code panel.

## 6. Code text never wraps — ever

- **Superseded (#583/#589 session):** this rule used to require wrapping (`white-space:
  pre-wrap`) with a carve-out for `<div x-demo>` panels only. John's direct, repeated
  instruction — "CODE TEXT CANNOT WRAP EVER" — reverses that: **no code text wraps,
  anywhere, on any element that displays code** (`<pre x-behavior="pre">`, `<div x-demo>`
  panels, `<div x-mdhtml>`-rendered fenced code blocks, hand-written `<pre language="…">`
  samples). Long lines get horizontal scroll instead (`white-space: pre`; `overflow-x:
  auto`) — this is `pre.css`'s own editor-style default (`pre.js`, `defaultWrap=false`,
  #199); nothing needs to opt in anymore, since it's the universal baseline, not a
  per-page carve-out.
- A demo's own `wrap` attribute (if ever explicitly set) still overrides this baseline —
  the point is the *default* is now no-wrap everywhere, not that wrapping is banned as a
  deliberate, explicit per-element choice.
- Test: `tests/regression/frameworks-code-block-no-wrap.spec.ts` (originally scoped to
  `demos/frameworks.html`'s 5 framework samples under the old carve-out regime — still
  valid, just no longer the only place this applies).

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
  base-class hierarchy. Do not write "is-a relationship", "variants inherit from
  "card base class", or "Why Inheritance Matters" — reframe as composition.
- Say what actually happens: capability is **applied to** an element by a behavior
  function `(element, options)`; it is never **acquired by** subclassing. Shared
  structure comes from semantic HTML, exported helper functions, and design tokens.
  Never present inheritance as a virtue of this architecture.
- In component reference tables use **"Root CSS Class"** (or BEM "Block"), never
  "Base Class", and **"Composes"**, never "Inherits".
- Diagrams follow the same rule: no class/inheritance trees. A chain of `↓` arrows
  between component names reads as a hierarchy — draw composition as elements plus
  the behaviors applied to them, and label dispatch arrows ("calls", "decorates") so
  they can't be misread as "extends".
- **Two exceptions, both narrow and both out of scope for this rule.** They describe
  different mechanisms that happen to reuse the word:
  1. **CSS inheritance / the cascade** — a real browser mechanism (`docs/styles.md`,
     `docs/themes.md`). Correct terminology; leave it.
  2. **Schema-layer `$inherits` / `$extends` / IS-A / HAS-A** — JSON documents merged
     into one effective schema before render (`docs/claude/SCHEMAS-GUIDE.md`), and the
     IS-A/HAS-A naming convention in
     `docs/architecture/standards/ATTRIBUTE-NAMING-STANDARD.md`. This is a deliberate
     data-layer design tracked by **issue #465** — do not rewrite it under this rule.
  When either appears, say which mechanism you mean so it can't be read as a component
  class hierarchy.
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

## 15a. Normal-flow media fits its container

- An `<img>`, `<video>`, `<iframe>` or `<svg>` in a rendered example must never be wider
  than the container it renders in, and must never be **upscaled past its natural size**.
  A 480px image stretched across a 900px panel is blurry and misrepresents the component.
- `max-width: 100%` alone is not enough — it caps the width but still allows an upscale
  when a rule sets `width: 100%`. Both constraints are required.
- §15 covers floating layers (popovers, tooltips, menus). This rule covers ordinary
  content, which had no rule at all until an example rendered an image far larger than
  itself. (#775)

## 15. Overlays and popups stay within bounds

- A popover, tooltip, dropdown, menu, or any floating layer must **not overflow** its
  parent element or the viewport. It must reposition/flip or clamp to stay fully visible.
  A popup that spills outside its parent's bounds is a defect. (Tracked project-wide; see
  #252 — parent-overflow detection test.)

## 16. Every demo shows a working demo AND its code

- The `demos/` folder exists so users can **see how it's done in HTML**. Therefore
  **every file in `demos/`** must present BOTH a **working live demo** AND the **source
  code** that produced it — never one without the other. `<div x-demo>` is the ideal tool
  (it renders the live control and shows its source in one tag). A demo page with a live
  example but no code — or code with no live example — is a defect.
- **Every canonical demo includes a MIXED-BEHAVIORS example**: `x-*` attributes composed
  onto the element — including onto `<wb-*>` tags (x-tags take x-attributes too). This
  shows developers how to add function to markup already in place. All of it inside
  `<div x-demo>`.

## 17. Grouped controls are ONE demo (exception to §2)

- Some controls belong to a **single logical group** — e.g. radio buttons that share a
  `name`, or a set of related checkboxes. For a group, the **whole group** is the unit:
  put the entire group in **one** `<div x-demo>` with one code sample. Do NOT split each
  individual `<input>`/control into its own demo. This is the intended exception to §2
  ("one code sample per rendered element") — for a group, the group IS the element.

## 18. Many controls go in a `<div x-container>`

- When a demo displays **many controls or items together** (a set of related controls,
  a list of examples), wrap them in a `<div x-container>` so they get consistent, contained
  layout instead of loose free-floating markup. Reach for `<div x-container>` whenever you'd
  otherwise show a large ungrouped block of controls.

## 19. Every declared attribute must be tested to actually WORK

- If markup declares a configuration attribute (`size`, `variant`, `elevated`,
  `clearable`, `autosize`, …), there must be a test that asserts the attribute produces
  its **real effect** — not merely that the element renders or a class was added.
- Tests are **effect-based**, not presence-based: e.g. `<button size="xs">` and
  `<button size="xl">` must have **different computed sizes**; `variant="primary"` vs
  `variant="danger"` must differ visibly. A demo that shows `size="xs"` while the button
  renders at default size is a defect the test must catch. Cover BOTH the custom element
  (`<button>`) and the native element (`<button>`) paths.

## 21. Watch CI after every push — local-green is not done

- A push is **not done** until the GitHub Actions run for it is **green**. After every
  push, check the run (`gh run list` / `gh run watch`); a red CI is treated exactly like
  a red local gate — investigate immediately, file the issue, fix.
- Beware environment differences (Linux CI vs local Windows): fonts, scrollbar metrics,
  and paths make browser assertions behave differently — a test must pass on **both**.

## 20. Boolean `x-*` attributes are written BARE — never `=""`

- A valueless behavior attribute is written `x-ripple`, **never** `x-ripple=""`. The
  `=""` adds no value, lengthens the markup, and teaches users to type a useless string.
  Applies to all source HTML and all code samples (the `<div x-demo>` pretty-printer
  already emits bare names for empty values). Enforced by
  `tests/compliance/no-empty-x-attr-values.spec.ts`; fix with
  `node scripts/remove-empty-x-attr-values.mjs`.

## 22. A demo switch that represents a real capability must invoke it

- When a switch demo's label names an actual effect (e.g. "Notifications", "Dark Mode"),
  turning it ON must **actually demonstrate that effect** — not just flip visually with no
  observable result. A "Notifications" toggle that does nothing on activation doesn't show
  what it does. Use `<div x-switch notify-control>` to fire a real toast when switched ON
  (see `src/wb-viewmodels/semantics/switch.js`); `theme-control` is the existing precedent
  for the same idea applied to the "Dark Mode" switch.

## 23. Tables break correctly or reduce font size — never mid-word

- A table cell must never split a word/identifier mid-character (e.g. `wb:details:tog` /
  `gle` across two lines). Prose wraps at word boundaries; unbroken tokens (event names,
  `code` identifiers, class names) must either fit on one line or the table scrolls
  horizontally (`overflow-x: auto`, already standard — see `.x-mdhtml table`) — they must
  never be force-broken via `overflow-wrap: anywhere`. If a table is cramped, the fix is a
  smaller font-size or a horizontal scroll, not a broken word. `.x-mdhtml td code` /
  `.x-mdhtml th code` are `white-space: nowrap` for exactly this reason
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

## 25. `<div x-demo>` exception: source that can't run without a build step

- §1/§16 require `<div x-demo>` because it renders the **exact same markup** it shows as
  "source" — the live control and the code below it are structurally guaranteed to
  match. That guarantee breaks for **framework-integration snippets** whose instructive
  source only produces DOM after a compile step — wrapping the post-mount HTML (or the
  mounting `<script>`) in `<div x-demo>` would show something other than what a developer
  using that framework would actually write, losing the pedagogical content `<div x-demo>`
  exists to preserve. This does NOT mean "no live render" — React, Vue, Svelte, and
  SolidJS all get a real live render on `demos/frameworks.html` (see below); they're
  just not wrapped in `<div x-demo>` specifically, because `<div x-demo>` additionally
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
  MUST use `<div x-demo>` like any other component example — only genuinely non-executable
  source is exempt. See `demos/frameworks.html` for all cases side by side: the HTMX
  section uses `<div x-demo>`; React/Vue/Svelte/SolidJS render live but aren't wrapped in
  `<div x-demo>` (compiled/mounted output isn't 1:1 with the shown source); Angular is the
  sole remaining labeled "no live render" exception. Tracked: #324, #460.

## 26. `<div x-demo>` code panel is full width on mobile — no layout shift between demos

- **Mobile only (≤700px).** Below that width, the **code sample** portion of `<div x-demo>`
  (distinct from the rendered control governed by §7) must span the **full width** of its
  container, even when the rendered control above it is narrow.
- Goal: eliminate "window slop" — the page width, scrollbar, or demo container resizing/
  shifting as different `<div x-demo>` blocks (with shorter or longer code) scroll into view
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

- `<div x-demo>` shows a control's markup, but markup alone doesn't teach a reader how to
  react to what the control **does** afterward. When a demoed control fires one or more
  documented `wb:*`/`x:*` custom events (see `docs/behaviors-reference.md`'s Events
  table), add an `events` attribute listing them:
  `<div x-demo events="wb:switch:change">`.
- This adds two things, automatically, right below the existing source panel — no
  hand-written prose required:
  1. An example `addEventListener` code sample, syntax-highlighted and copyable like any
     other code panel (§4/§5).
  2. A **live** log that shows the event actually firing in real time as the reader
     interacts with the rendered control above it — proof, not just claims.
- Not every demo needs this — a control with no interesting event (e.g. a static
  `<span x-badge>`) doesn't gain anything from an empty events section, so the attribute is
  opt-in, not mandatory on every `<div x-demo>`. Add it where a reader would plausibly want
  to hook into the control's behavior in their own code (form controls, toggles, tabs,
  search, anything with a meaningful `detail` payload). Tracked: #385.

## 28. Code panel width is customizable per demo

- The `<div x-demo>` code panel (the `<pre>` source block below each rendered control)
  defaults to **full width of its `x-demo` container** at all viewport sizes. This
  ensures consistent horizontal layout and prevents code samples from appearing
  cramped or artificially narrow relative to the rendered component above.
- **Long lines flow naturally (no wrapping).** If a code line is longer than the
  container, the code panel provides a **horizontal scrollbar** — never forces a
  word-wrap that breaks identifiers mid-line (see §5 & §23). This applies to
  `<div x-demo>`-generated code panels specifically (see §6 carve-out).
- **Per-demo width control:** Use `data-code-width` attribute to constrain a specific
  demo's code panel. Presets:
  - `data-code-width="narrow"` — max 400px (tight code samples)
  - `data-code-width="normal"` — max 600px (readable line length)
  - `data-code-width="wide"` — max 800px (generous spacing)
  - `data-code-width="full"` — 100% (default, full container width)
  - Or use CSS: `style="--demo-code-max-width: 500px;"` for custom widths.
- **Example:** `<div x-demo data-code-width="narrow">...</div>`
- **CSS:** `.x-demo__code { width: 100%; max-width: var(--demo-code-max-width, 100%); overflow-x: auto; }`
  (enforced in `src/styles/behaviors/demo.css`).

---

## 29. No placeholder asset paths — ever

- Every `src`/`image`/`background` in a live-rendered example (a `<div x-demo>`, or raw markup a doc
  auto-promotes) must resolve to a real, working asset. `/images/feature.jpg`, `"Sample image"`,
  `"Sample background"`, `music.mp3` — anything that *reads* like a path but was never actually placed in
  the repo or a real remote URL — is not "illustrative," it's a broken control that ships (2026-08-15
  retrospective: this exact mistake caused 9+ separate issues in one week, #610/#605/#601/#551/#548/#529/
  #526/#519/#514).
- Use real remote assets: `https://picsum.photos/{width}/{height}?random={n}` for images (distinct `n` per
  example, ≥800px on the short edge so it doesn't look blurry when cropped into a card), a real hosted
  sample for audio/video (this codebase's established convention is soundhelix.com for audio).
- Never invent a local path unless the file is actually committed to the repo at that exact path — verify
  with a file-existence check, not by eye.
- Test: `tests/compliance/docs-live-media-assets-exist.spec.ts` (markdown docs),
  `tests/compliance/x-audio-has-resolvable-src.spec.ts` (audio specifically, all `.html`/`.md`).

## 30. Broken media must throw + log — never fail silently

- A `<audio>`/`<img>`/background-image that fails to load must produce a real, loud signal — an `Error`
  thrown so the global error handler (`src/core/error-logger.js`) catches and logs it — not a silent
  broken-image icon or an invisible CSS background that just never appears. This is `audio.js`'s original
  convention (#433); by 2026-08-15 the same fix had to be independently rediscovered and re-applied to
  `cardhero` (#534), `cardhorizontal` (#604), and `cardoverlay` (#605) — three components, same missing
  pattern, three separate issues.
- **When building a new card/media component, wire this up from the start**: a plain `<img>` gets this for
  free via its native `error` event (just add a listener that throws); a CSS `background-image` has no
  native failure signal at all and needs a preload `new Image()` probe (see `cardhero`'s implementation in
  `src/wb-viewmodels/card.js` for the reference pattern — preload, on error clear the broken background and
  fall back to a themed default, then throw).
- A working fallback (a themed gradient, a default image) must still render — the loud error is in addition
  to graceful degradation, not instead of it.

## 31. HTML attributes are kebab-case — never author a camelCase schema property name directly

- A schema's declared property name (e.g. `imagePosition`) is a JS/schema-internal name. The HTML attribute
  an author writes in markup is a *different, separate* thing and must be kebab-case: `image-position`, not
  `imagePosition`. The browser lowercases attribute names on parse with **no hyphen insertion** —
  `imagePosition="right"` in source becomes the DOM attribute `imageposition` (no hyphen), which matches
  neither the camelCase name NOR the kebab-case one a behavior's `getAttribute()` call expects. The value is
  silently dropped, the default applies, and nothing errors (2026-08-14/15: this exact mistake shipped in
  `cardhorizontal.md`'s own docs — #602 — and was then re-typed as `imageposition` again immediately after
  the fix — #603 — by two different authors in the same week).
- When writing a behavior function, prefer accepting **both** the kebab-case attribute and its no-hyphen
  fallback (`getAttribute('image-position') || getAttribute('imageposition')`) rather than assuming authors
  will always get the exact spelling right — the mistake is common enough that the code should be tolerant
  of it, not just the docs corrected once.
- When writing docs/demos: always kebab-case. Check any multi-word attribute against the actual behavior's
  `getAttribute()` calls in `src/wb-viewmodels/`, not against the schema's declared property name.

## 32. Favor semantic HTML with autoInject on — this is the actual selling point

- John (2026-08-15): "if we turn on autoinject which we will most of the time, then we don't need
  anything but semantic html to show the added features... autoinject should be true for all our demos...
  we should pull away from our wb tags favoring semantic html at all times."
- `autoInject` now **defaults to `true`** (`src/core/config.js`) — a page only sees it off if it explicitly
  calls `WB.init({ autoInject: false })`. This is a reversal of the previous default; the previous default
  (off) is why so many docs/demos accumulated explicit `x-*` attributes that are now redundant.
- **When writing a new example**: write plain semantic HTML first (`<table>`, `<article>`, `<button>`,
  `<audio>`, ...) with no `x-*` attribute at all, and confirm live that it gets enhanced automatically. Only
  reach for an explicit `<wb-*>` tag or `x-*` attribute when the semantic element genuinely doesn't exist
  for what you're building (there's no native `<div x-cardexpandable>` equivalent) or the page has deliberately
  opted out of autoInject.
- **When reviewing an existing example**: if it uses an explicit `x-*` attribute on a tag that has a native
  semantic equivalent (`x-table` on `<table>`, `x-card`/`x-cardXxx` on `<article>`, `x-audio` on `<audio>`),
  verify live whether it's now redundant post-flip, and remove it if so — matches the existing §
  "no-redundant-x-attribute" compliance pattern, just with a much larger surface now that the default
  changed.
- This does **not** mean deleting the `<wb-*>` custom-tag form from docs entirely — both forms are
  documented (see e.g. `table.md`'s "Custom Element" vs "Native Table" sections) since some authors prefer
  the explicit tag. It means the semantic-HTML form should be presented as the *primary*, not an
  afterthought, and should never need an `x-*` attribute to work.

## Enforcement & references

| Rule | Test / reference |
|------|------------------|
| 1, 2 (x-demo, 1:1) | `tests/integration/doc-viewer-wb-demo.spec.ts` |
| 4 (highlighted + copy) | `tests/integration/frameworks-demo.spec.ts`, `demo-compare-code-blocks.spec.ts` (#241) |
| 3, 5 (vertical) | `tests/integration/demo-compare-code-blocks.spec.ts` |
| 5, 8 (no double-parse) | `tests/integration/doc-viewer-code-multiline.spec.ts`; `docs/_today/ROOT-CAUSE-md-double-parse.md` |
| 9 (composition) | `tests/compliance/no-legacy-component-inheritance-docs.spec.ts` |
| 11 (colors) | `tests/compliance/css-oop-compliance.spec.ts` |
| 22 (switch invokes effect) | `tests/behaviors/notify-control-switch.spec.ts` |
| 24 (no unintended overlap) | `tests/integration/overlap.spec.ts` (#274) |
| 1, 16, 25 (x-demo / build-step exception) | `tests/integration/frameworks-demo.spec.ts` (#324) |
| 28 (code panel full width) | `src/styles/behaviors/demo.css` (`.x-demo__code` rule) |
| 29 (no placeholder assets) | `tests/compliance/docs-live-media-assets-exist.spec.ts`, `tests/compliance/x-audio-has-resolvable-src.spec.ts` |
| 30 (broken media throws) | `src/wb-viewmodels/card.js` (`cardhero`/`cardhorizontal`/`cardoverlay`/`cardimage` probe pattern), `src/wb-viewmodels/semantics/audio.js` |
| 31 (kebab-case attributes) | `tests/regression/cardhorizontal-attribute-casing-tolerance.spec.ts` (reference pattern for tolerant reading) |
| 32 (autoInject on, favor semantic HTML) | `src/core/config.js` (`autoInject: true` default), `tests/compliance/no-redundant-x-attribute-on-native-tag.spec.ts` |

Open work to bring existing surfaces to this standard: #246 (behaviors-showcase selects),
#247 (behaviors-showcase mobile nav), #248 (no horizontal scrollbars), and the remaining
`pages/components.html` sections (Feedback/Overlays).

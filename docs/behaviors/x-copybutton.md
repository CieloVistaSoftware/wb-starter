# x-copybutton

Overlays a small positioned copy button (default: top-right corner) on ANY element. The
button copies the host element's own `value`/`textContent` — or a target override — to the
clipboard, with visible "Copied ✓" feedback. See
[src/wb-viewmodels/copy.js](../../src/wb-viewmodels/copy.js) (`copyButton()`).

- **Type:** Attribute
- **Usage:** `[x-copybutton]`, or `x-copybutton="#targetId"` to copy another element's content

## Attribute API

| Attribute | Default | Description |
|---|---|---|
| `x-copybutton` | — | Bare to copy the host's own value/text. A selector value (`x-copybutton="#targetId"`) copies that element's `value`/`textContent` instead. |
| `copy-target` | — | Explicit form of the target override — same effect as `x-copybutton="#selector"`. |
| `label` | `"Copy"` | Button `aria-label` and `title`. |
| `position` | `"top-right"` | One of `top-right`, `top-left`, `bottom-right`, `bottom-left`. |
| `copy-feedback` | `"Copied ✓"` | Text shown on the button after a successful copy. |
| `copy-duration` | `2000` | Milliseconds before the button reverts to its idle icon. |

## Demo

<div x-demo title="Copy button on a textarea">
  <textarea x-copybutton rows="3" cols="40">npm install wb-starter</textarea>
</div>

<div x-demo title="Copy button on a pre/code block">
  <pre x-copybutton><code>const wb = require('wb-starter');
wb.init();</code></pre>
</div>

<div x-demo title="Copy button targeting another element">
  <div>
    <code id="x-copybutton-target-demo">npm install wb-starter --save</code>
    <button x-copybutton="#x-copybutton-target-demo" label="Copy install command" position="top-right">Install command ↑</button>
  </div>
</div>

## Events

- `wb:copy:success` — fired on the host element with `detail: { text }` after a successful copy.
- `wb:copy:error` — fired on the host element with `detail: { text }` if every copy path (Clipboard
  API + `document.execCommand('copy')` fallback) failed.

## A11y

- The injected control is a real `<button type="button">`, so it's keyboard-focusable and
  activatable without any extra wiring.
- `aria-label` (from `label`, default `"Copy"`) and a matching `title` are always set.
- Feedback is communicated visually (button text swaps to `copy-feedback`) and via the
  `wb:copy:success` event for anything listening; consumers that need it announced to a
  screen reader can wire an `aria-live` region off that event.

## Differences — x-copy vs x-copybutton vs the old pre.js button

| | **x-copy** (existing) | **x-copybutton** (this behavior) | pre.js copy button (legacy, now consolidated) |
|---|---|---|---|
| **What it is** | Makes the element ITSELF the click-to-copy trigger | Overlays a SEPARATE floating button on the element | Hand-rolled button injected only inside code blocks |
| **Markup** | `<button x-copy copy-text="npm i wb">Copy</button>` | `<textarea x-copybutton></textarea>` | (internal, not authorable) |
| **What gets copied** | a specified `copy-text` (or the element's text) | the host element's `value`/`textContent` (or `#target`'s) | the `<pre>`'s text |
| **The trigger** | the element you clicked | a distinct button in the corner (host stays interactive) | the injected button |
| **Best for** | "copy this snippet" chips, inline actions | textareas, code, cards, any block you want a copy affordance on | replaced by pre.js reusing `x-copybutton`'s clipboard core |

**Key line:** `x-copy` turns an element INTO a copy trigger; `x-copybutton` PUTS a copy trigger
ON an element without changing what the element does.

### Consolidation status (#291)

Both `copy()` (`x-copy`) and `copyButton()` (`x-copybutton`) — plus `semantics/pre.js`'s own
copy-button control and the Playground's copy actions (`demos/playground.html`) — now share one
`writeToClipboard()` core (`src/wb-viewmodels/copy.js`), so the clipboard-write +
`document.execCommand` fallback logic exists in exactly one place project-wide.

`pre.js`'s copy button intentionally keeps its own DOM structure (it's one of several controls —
copy button, language badge, hide/show toggle — sequenced right-to-left inside `pre.js`'s own
`.x-pre-wrapper`, using real measured widths). Building it via `x-copybutton`'s own
`.x-copybutton-wrapper` would nest a second relative/absolute positioning context inside that
wrapper and break the sequential-offset measurement the other header controls depend on — so it
reuses `x-copybutton`'s shared clipboard core without adopting its wrapper markup. The Playground's
`pg-copy` button is a toolbar action button (already positioned by the toolbar's own flex layout,
not an overlay), so it likewise reuses the shared clipboard core rather than being re-marked-up as
an `x-copybutton` overlay.

## Schema/Test

No dedicated schema file — like most `x-*` attribute behaviors (`x-copy`, `x-draggable`'s siblings,
etc.), this one is pure JS with no schema-driven rendering; schemas in this project are for
`wb-*` custom elements. Effect test:
[tests/behaviors/x-copybutton-effect.spec.ts](../../tests/behaviors/x-copybutton-effect.spec.ts).

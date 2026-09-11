# Prompt

Behavior applied with x-prompt.

## Type — new capability

`x-prompt` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<button variant="primary" x-prompt prompt-title="Enter Value" prompt-message="Please enter your name:">
  x-prompt · variant: primary · prompt-title: Enter Value · prompt-message: Please enter your name:
</button>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `heading` | `string` | `Input` | Dialog heading. Only used when `prompt-title` is absent. |
| `message` | `string` | `this is the message` | Body text. Only used when `prompt-message` is absent. |
| `placeholder` | `string` | `this is the placeholder` | Placeholder shown in the empty input. |
| `default-value` | `string` | `this is the default value` | Value the input starts with, already selected so typing replaces it. |
| `prompt-title` | `string` | `this is the prompt title` | Dialog heading. Read BEFORE `heading`; defaults to `Input`. |
| `prompt-message` | `string` | `this is the prompt message` | Body text above the field. Read BEFORE `message`. |

## Events

- `wb:prompt:cancel` — Fired by prompt().
- `wb:prompt:ok` — Fired by prompt().

## Live example

See `x-prompt` on the [Behaviors showcase](/?page=behaviors) — search for `x-prompt` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/prompt.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>

# Prompt

Behavior applied with x-prompt.

Apply `x-prompt` to any element.

## Usage

```html
<button variant="primary" x-prompt prompt-title="Enter Value" prompt-message="Please enter your name:">Prompt Dialog</button>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `heading` | `string` | `Input` | Read by prompt(). |
| `message` | `string` | — | Read by prompt(). |
| `placeholder` | `string` | — | Read by prompt(). |
| `default-value` | `string` | — | Read by prompt(). |
| `prompt-title` | `string` | — | Read by prompt(). |
| `prompt-message` | `string` | — | Read by prompt(). |

## Events

- `wb:prompt:cancel` — Fired by prompt().
- `wb:prompt:ok` — Fired by prompt().

## Live example

See `x-prompt` on the [Behaviors showcase](/?page=behaviors) — search for `x-prompt` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/prompt.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>

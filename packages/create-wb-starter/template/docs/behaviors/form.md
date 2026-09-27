# Form Behavior

A plain `<form>` gets validation on submit, and with `ajax` it sends its fields to `action` with `fetch` instead of reloading the page, firing `wb:form:submit`, then `wb:form:success` or `wb:form:error`.

## Usage

<div x-demo>
<form validate ajax action="/api/demo-form" successMessage="Sent — check the events panel below.">
  <label>Email <input type="email" name="email" required placeholder="you@example.com"></label>
  <label>Message <textarea name="message" rows="3" required></textarea></label>
  <button type="submit">
  type: submit
</button>
</form>
</div>

No attribute needed on `<form>`. Don't add `x-form` to it (#746).

`<form x-ignore>` opts out ([escape hatches](../escape-hatches.md)).

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `ajax` | `boolean` | `false` | Enable AJAX form submission |
| `validate` | `boolean` | `false` | Enable validation on submit |

<sub>Schema: [`form.schema.json`](../../src/wb-models/form.schema.json)</sub>

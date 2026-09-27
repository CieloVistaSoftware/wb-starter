# Truncate

`x-truncate` cuts text off after `lines` lines with an ellipsis; `expandable` adds a "Show more" control that reveals the rest.

## Usage

<div x-demo>
<p x-truncate lines="2" expandable style="max-width:360px">
  Composition replaced inheritance: a tag maps to a behavior function that decorates the element in place, in light DOM. There is no behavior base class any more, and no shadow boundary to reach through.
</p>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `lines` | `string` | `1` | Number of lines to clamp to before truncating. Defaults to `1`. |
| `data-expandable` | `boolean` | `false` | The `data-` spelling of `expandable`, read as a fallback when the plain form is absent (#752). Identical effect; prefer `expandable`. |
| `expandable` | `boolean` | `false` | Add a control that reveals the full text. Bare attribute — the plain spelling only began working in #752; before that `data-expandable` was the only form read. |

<sub>Schema: [`truncate.schema.json`](../../src/wb-models/truncate.schema.json)</sub>

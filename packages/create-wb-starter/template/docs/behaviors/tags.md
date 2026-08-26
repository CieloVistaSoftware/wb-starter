# x-tags Behavior

Lets a user type and press Enter to build a list of removable tags/chips next
to a text input. See [src/wb-viewmodels/tags.js](../../src/wb-viewmodels/tags.js).

- **Type:** Modifier
- **Root CSS class:** `x-tags`
- **Schema:** [tags.schema.json](../../src/wb-models/tags.schema.json)

## Usage

Apply `x-tags` directly to a real `<input>` — the behavior wraps it in a
`.x-tags` container and adds the tag list as a sibling (an `<input>` is a
void element and can't hold children, so nothing is ever appended inside it).

```html
<input type="text" x-tags placeholder="Type a skill and press Enter…">
```

<div x-demo>
<input type="text" x-tags placeholder="Type a skill and press Enter…">
</div>

Click any tag to remove it.

## Properties

None — `tags()` takes no configurable attributes; tags are entered
interactively (there's no attribute for pre-populating an initial tag list).

## CSS Classes

| Class | Applies to | When |
|---|---|---|
| `x-tags` | wrapper `<div>` | always |
| `x-tags__input` | the `<input>` | always |
| `x-tags__list` | the generated tag list `<div>` | always |
| `x-tags__tag` | each generated tag `<span>` | one per added tag |

## Events

| Event | Bubbles | `detail` | Fired when |
|---|---|---|---|
| `wb:tags:add` | yes | `{ tag }` | Enter is pressed with input text present |
| `wb:tags:remove` | yes | `{ tag }` | A tag is clicked to remove it |

- [Schema](../../src/wb-models/tags.schema.json)
- [Source](../../src/wb-viewmodels/tags.js)

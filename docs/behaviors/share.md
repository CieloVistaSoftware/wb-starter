# Share

`x-share` makes the element open the device's share sheet with `share-title`, `share-text` and `share-url`; where the Web Share API is missing it copies the URL to the clipboard instead. With no text of its own it shows "📤 Share".

## Usage

<div x-demo>
<button x-share share-title="wb-starter" share-url="https://example.com"></button>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `text` | `string` | — | Body text. Only used when `share-text` is absent. |
| `label` | `string` | `📤 Share` | Button label. Defaults to `📤 Share`. |
| `share-title` | `string` | — | Title passed to the share sheet. Read BEFORE `title`; falls back to `document.title`. |
| `share-text` | `string` | — | Body text passed to the share sheet. Read BEFORE `text`. |
| `share-url` | `string` | `#` | URL to share. Read BEFORE `url`; falls back to the current page address. |
| `url` | `string` | `#` | URL to share. Only used when `share-url` is absent. |

<sub>Schema: [`share.schema.json`](../../src/wb-models/share.schema.json)</sub>

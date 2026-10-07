# Share

`x-share` makes the element open the device's share sheet with `shareTitle`, `shareText` and `shareUrl`; where the Web Share API is missing it copies the URL to the clipboard instead. With no text of its own it shows "📤 Share".

## Usage

<div x-demo>
<button x-share shareTitle="wb-starter" shareUrl="https://example.com"></button>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `text` | text | — | Body text. Only used when `shareText` is absent. |
| `label` | text | `📤 Share` | Button label. Defaults to `📤 Share`. |
| `shareTitle` | text | — | Title passed to the share sheet. Read BEFORE `title`; falls back to `document.title`. |
| `shareText` | text | — | Body text passed to the share sheet. Read BEFORE `text`. |
| `shareUrl` | URL | `#` | URL to share. Read BEFORE `url`; falls back to the current page address. |
| `url` | URL | `#` | URL to share. Only used when `shareUrl` is absent. |

<sub>Schema: [`share.schema.json`](../../src/wb-models/share.schema.json)</sub>

# Footer

A plain `<footer>` gets a site footer built from its attributes: the `brand` name, a copyright line, a row of `links` and optional `social` icons. Add `sticky` to pin it to the bottom of the viewport.

## Usage

<div x-demo>
<footer brand="Cielo Vista Software" copyright="2026" links="Privacy,Terms,Status"></footer>
</div>

No attribute needed on `<footer>`. Don't add `x-footer` to it (#746).

On another element, write `x-footer`:

<div x-demo>
<div x-footer brand="Cielo Vista Software" copyright="2026" links="Privacy,Terms,Status"></div>
</div>

`<footer x-ignore>` opts out ([escape hatches](../escape-hatches.md)).

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `copyright` | text | — | Copyright text |
| `brand` | text | — | Brand name |
| `links` | JSON array of {label, href} | — | Navigation links as JSON [{label, href}] |
| `social` | JSON array of {platform, href} | — | Social links as JSON [{platform, href}] |
| `sticky` | `boolean` | `false` | Sticky at bottom |

## Methods

- `setCopyright()` — Updates copyright
- `setBrand()` — Updates brand

## Accessibility

- **role** — contentinfo

<sub>Schema: [`footer.schema.json`](../../src/wb-models/footer.schema.json)</sub>

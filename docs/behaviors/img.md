# Img

A plain `<img>` gets loading help: `placeholder` shows while the real image loads, `fallback` replaces it if it fails, `aspect-ratio` reserves its box so the page does not jump, and `zoomable` opens it full-size on click.

## Usage

<div x-demo>
<img src="../../images/placeholder.svg" alt="Prime lens on a wooden desk">
</div>

No attribute needed on `<img>`. Don't add `x-img` to it (#746).

`<img x-ignore>` opts out ([escape hatches](../escape-hatches.md)).

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `placeholder` | `string` | — | Image shown while the real `src` loads. Replaced the moment the real image decodes. |
| `fallback` | `string` | — | Image swapped in when `src` fails to load. Without one a broken image raises a loggable error and leaves the element empty. |
| `aspect-ratio` | `string` | — | A CSS aspect ratio (e.g. `16/9`) applied to the element, with `object-fit: cover`. Reserves the box before the image arrives, so the page does not jump as it loads. |
| `lazy` | `boolean` | `false` | Sets `loading="lazy"`, so the browser defers fetching until the image nears the viewport. Bare attribute. |
| `data-lazy` | `boolean` | `false` | The `data-` spelling of `lazy`, read as a fallback when the plain form is absent (#752). Identical effect; prefer `lazy`. |
| `zoomable` | `boolean` | `false` | Clicking the image opens it full-size in a lightbox. Bare attribute. |
| `data-zoomable` | `boolean` | `false` | The `data-` spelling of `zoomable`, read as a fallback when the plain form is absent (#752). Identical effect; prefer `zoomable`. |

<sub>Schema: [`img.schema.json`](../../src/wb-models/img.schema.json)</sub>

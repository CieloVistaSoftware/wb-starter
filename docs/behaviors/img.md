# Img

A plain `<img>` gets loading help: `placeholder` shows while the real image loads, `fallback` replaces it if it fails, `aspect-ratio` reserves its box so the page does not jump, and `zoomable` opens it full-size on click.

## Usage

<div x-demo>
<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Canon_New_F-1_and_Lenses.jpg/1280px-Canon_New_F-1_and_Lenses.jpg" alt="Prime lens on a wooden desk">
</div>

No attribute needed on `<img>`. Don't add `x-img` to it (#746).

`<img x-ignore>` opts out ([escape hatches](../escape-hatches.md)).

## Controlling size

An image has no `size` option. It is sized the way HTML already sizes images, which also stops the page jumping while it loads.

**Set `width` and `height` to the size you want.** They also tell the browser the image's shape before it arrives, so its space is reserved and nothing below it moves when it loads. This photo is not 16:9 (it is 1280 by 891), so `aspect-ratio="16/9"` holds it to the 240 by 135 asked for.

<div x-demo>
<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Dachshund_puppies_3307.jpg/1280px-Dachshund_puppies_3307.jpg" width="240" height="135" aspect-ratio="16/9" alt="Dachshund puppy, shown at 240 by 135 pixels">
</div>

**Let it fill its container.** Give it a size wider than its container (here 960 by 540, held to 16:9). The site never lets an image grow past its container (`max-width: 100%` with `height: auto`), so a narrower container shrinks it to fit and keeps its proportions.

<div x-demo>
<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Dachshund_puppies_3307.jpg/1280px-Dachshund_puppies_3307.jpg" width="960" height="540" aspect-ratio="16/9" alt="Dachshund puppy, shrunk to fit its container">
</div>

**Change its shape with `aspect-ratio`.** The image is cropped to that shape rather than stretched (`object-fit: cover`). Here a landscape photo is shown square.

<div x-demo>
<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Dachshund_puppies_3307.jpg/1280px-Dachshund_puppies_3307.jpg" width="200" aspect-ratio="1/1" alt="Dachshund puppy, cropped square">
</div>

Inside a card, let the card size the image: give the card a `size` and leave the image's `width` off.

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

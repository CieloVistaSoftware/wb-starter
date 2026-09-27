# Frame

`x-frame` holds its first child to an aspect ratio: it sets `--x-frame-ratio` from `ratio` (default `16/9`) and makes the child fill the frame. Use it around an image, video or iframe whose box must be reserved before the media loads.

## Usage

<div x-demo>
<div x-frame ratio="4/3" style="max-width:320px">
  <img src="../../images/placeholder.svg" alt="Coastline from the air">
</div>
</div>

## Classes applied

- `x-frame`

## Attributes read

- `ratio`

<sub>Schema: [`frame.schema.json`](../../src/wb-models/frame.schema.json)</sub>

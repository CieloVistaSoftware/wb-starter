# Repeater

`x-repeater` stamps out `count` copies of its `<template>`, replacing `{{index}}` with 1, 2, 3… and `{{i}}` with 0, 1, 2…. It is meant for prototyping repeated markup; the wrapper itself adds no box.

## Usage

<div x-demo>
<ul>
  <div x-repeater count="3">
    <template><li>Row {{index}}</li></template>
  </div>
</ul>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `count` | `string` | `0` | How many copies of the template content to render. |

<sub>Schema: [`repeater.schema.json`](../../src/wb-models/repeater.schema.json)</sub>

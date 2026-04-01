# Builder Properties

> Documents how component properties are presented in the Page Builder property panel.

## Overview

Every `<wb-*>` component has a `.schema.json` file in `src/wb-models/` that declares its properties. The builder reads these schemas to generate the property panel UI automatically.

## Property Types

| Type | UI Control |
|------|------------|
| `string` | Text input |
| `boolean` | Toggle switch |
| `number` | Number input |
| `enum` | Dropdown select |
| `color` | Color picker |
| `url` | URL input with validation |

## Schema Example

```json
{
  "name": "wb-alert",
  "properties": [
    { "name": "variant", "type": "enum", "values": ["info", "warning", "error", "success"] },
    { "name": "message", "type": "string" },
    { "name": "dismissible", "type": "boolean", "default": false }
  ]
}
```

> **Note:** Builder is currently not operational. See `docs/builder.todo.md`.

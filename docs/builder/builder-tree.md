# Builder Component Tree

> Documents the component tree panel in the Visual Page Builder.

## Overview

The component tree shows a hierarchical view of all components on the current page. It mirrors the DOM structure and allows selecting components that may be hard to click on the canvas.

## Tree Structure

```
Page
└── Section 1
    ├── wb-hero
    └── wb-grid
        ├── wb-card
        └── wb-card
└── Section 2
    └── wb-text
```

## Interactions

- Click a node to select the component on the canvas
- Drag nodes to reorder components
- Right-click a node for context menu (duplicate, delete, wrap)

> **Note:** Builder is currently not operational. See `docs/builder.todo.md`.

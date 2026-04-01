# Builder Section Focus

> Describes how the Page Builder manages section focus and selection state.

## Overview

The builder maintains a single "focused section" at a time. Clicking anywhere in a section sets focus to that section and updates the property panel to show section-level properties.

## Section Focus Rules

1. Only one section can be focused at a time
2. Clicking a component within a focused section selects the component
3. Clicking outside all sections clears focus
4. Focus state is stored in builder memory, not persisted to the page JSON

## Visual Indicators

- Focused section: outlined with a 2px blue border
- Selected component: outlined with a 2px accent border
- Hover state: subtle highlight to indicate interactability

> **Note:** Builder is currently not operational. See `docs/builder.todo.md`.

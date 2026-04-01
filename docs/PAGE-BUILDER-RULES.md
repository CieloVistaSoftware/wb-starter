# Page Builder Rules

> Content creation rules for the WB-Starter Page Builder.

## General Rules

1. **One component per row** minimum — don't collapse unrelated content into one component
2. **Use semantic components** — prefer `<wb-hero>`, `<wb-card>`, `<wb-text>` over raw HTML
3. **No inline styles** — use component attributes and theme variables only
4. **Plain attributes only** — never use `data-*` attributes on `<wb-*>` elements (per TIER1 Law #11)

## Section Rules

- Every page must have at least one section
- Sections should use `<wb-grid>` or `<wb-stack>` for layout
- Section background colors come from theme tokens only

## Content Rules

- Images must have `alt` text
- Links must have meaningful text (no "click here")
- Heading levels must be sequential (no skipping h1 → h3)

## Schema Compliance

All components placed in the builder must have a valid `.schema.json` in `src/wb-models/`. Non-schema components are blocked from the builder palette.

> **Note:** Builder is currently not operational. See `docs/builder.todo.md`.

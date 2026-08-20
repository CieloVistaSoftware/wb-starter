# wb-starter v3.0 - Effects

This folder contains documentation for the decorative effect behaviors.

`docs/components/README.md` and `docs/components/components.md` both link here as
`[Effects](./effects/)`. Every sibling folder resolves that form through its own
`README.md`; this one had none, so both links were dead.

## Quick Reference

| Component | Tag | Purpose |
|-----------|-----|---------|
| [confetti](./confetti.md) | `<wb-confetti>` | Burst of confetti on click |
| [fireworks](./fireworks.md) | `<wb-fireworks>` | Firework bursts |
| [snow](./snow.md) | `<wb-snow>` | Falling snow overlay |

## Authoring

Each of these works as a `<wb-*>` tag or as an `x-*` attribute on any element —
the two surfaces are equivalent:

```html
<wb-confetti>Celebrate</wb-confetti>
<button x-confetti>Celebrate</button>
```

Your own content between the tags is kept and rendered. These behaviors are on
the schema-exclusion list precisely so the schema builder cannot wipe it
(`SCHEMA_EXCLUDED_TAGS` in `src/core/mvvm/schema-builder.js`).

## Related

- [x-effects behavior reference](../../behaviors/x-effects.md)
- [effects.css](../../../src/styles/behaviors/effects.css)

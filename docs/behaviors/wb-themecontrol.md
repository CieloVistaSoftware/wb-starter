# wb-themecontrol

Dropdown that lets a user pick from the project's built-in themes — applies
immediately by setting `data-theme` on the target element, and persists the
choice across page loads (via `localStorage`) unless disabled.

- **Type:** Component (custom tag)
- **Usage:**
  <wb-demo>
  <wb-themecontrol></wb-themecontrol>
  </wb-demo>
- **Attributes:**
  - `target` — CSS selector (or `"html"`, the default) for the element `data-theme` is applied to.
  - `default` — theme to apply if none is persisted yet. Default: `"dark"`.
  - `show-label` — set `"false"` to hide the "Theme:" label, icon only.
  - `persist` — set `"false"` to skip saving the choice to `localStorage`.
- **Themes:** all 23 themes documented in [themes.md](../themes.md) are available in the dropdown — this component is the UI for that system, not a separate one. See themes.md for the full list, the underlying `data-theme`/CSS-variable architecture, and how to add a new theme.

- [Demo](../../demos/semantics-theme.html)
- [Schema](../../src/wb-models/themecontrol.schema.json)
- [Theme system](../themes.md)

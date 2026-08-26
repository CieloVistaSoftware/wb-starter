# x-help Behavior

Displays always-visible help text for form fields or UI elements.

Wrapped in `<div x-demo>`, so the live component renders below with its source shown underneath:

<div x-demo>
<span x-help>Enter your email address here.</span>
</div>

- **Type:** Modifier
- **Note:** x-help is functionally the same as a span except for styling and accessibility (adds role="note" and a help class). For hover-based help, use x-tooltip.

- [Demo](../../demos/site/forms.html#x-help-permanent-hint-text)
- [Schema](../../src/wb-models/help.schema.json)
- [Test](../../tests/behaviors/help.spec.ts)

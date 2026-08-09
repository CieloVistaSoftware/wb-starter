# X-Attribute Usage Audit

**Date:** 1/5/2026, 10:29:01 PM
**Scan Target:** `docs/**/*.md`
**Total Detections:** 112

| Status | File | Line | Usage | Context |
|--------|------|------|-------|---------|
| ✅ Valid | [docs/_today/CURRENT-STATUS.md](../_today/CURRENT-STATUS.md) | 32 | `x-ripple` | `\| `&lt;button x-ripple&gt;` \| `&lt;button x-ripple&gt;` \|` |
| ✅ Valid | [docs/_today/CURRENT-STATUS.md](../_today/CURRENT-STATUS.md) | 80 | `x-ripple` | `│  &lt;button x-ripple&gt;                                      │` |
| ✅ Valid | [docs/_today/CURRENT-STATUS.md](../_today/CURRENT-STATUS.md) | 81 | `x-tooltip` | `│  &lt;span x-tooltip="Tip text"&gt;                            │` |
| ✅ Valid | [docs/_today/CURRENT-STATUS.md](../_today/CURRENT-STATUS.md) | 82 | `x-animate` | `│  &lt;div x-animate="fadeIn"&gt;                               │` |
| ✅ Valid | [docs/_today/CURRENT-STATUS.md](../_today/CURRENT-STATUS.md) | 83 | `x-sticky` | `│  &lt;header x-sticky&gt;                                      │` |
| ✅ Valid | [docs/_today/CURRENT-STATUS.md](../_today/CURRENT-STATUS.md) | 139 | `x-ripple` | `\| `x-ripple` \| Add behaviors \| `&lt;button x-ripple&gt;` \| ✅ PRIMARY \|` |
| ✅ Valid | [docs/_today/CURRENT-STATUS.md](../_today/CURRENT-STATUS.md) | 139 | `x-ripple` | `\| `x-ripple` \| Add behaviors \| `&lt;button x-ripple&gt;` \| ✅ PRIMARY \|` |
| ✅ Valid | [docs/_today/TODO.md](../_today/TODO.md) | 134 | `x-behavior` | `- Custom element naming: `&lt;component-name&gt;`, `x-behavior`, `x-as-morph`` |
| ⚠️ Invalid Morph Target | [docs/_today/TODO.md](../_today/TODO.md) | 134 | `x-as-morph` | `- Custom element naming: `&lt;component-name&gt;`, `x-behavior`, `x-as-morph`` |
| ✅ Valid | [docs/_today/TODO.md](../_today/TODO.md) | 140 | `x-ripple` | `- Extensions (HAS-A): `x-ripple`, `x-tooltip="tip"`` |
| ✅ Valid | [docs/_today/TODO.md](../_today/TODO.md) | 140 | `x-tooltip` | `- Extensions (HAS-A): `x-ripple`, `x-tooltip="tip"`` |
| ✅ Valid | [docs/_today/TODO.md](../_today/TODO.md) | 141 | `x-as-card` | `- Morphing (BECOMES): `x-as-card`` |
| ✅ Valid | docs/architecture.md | 161 | `x-ripple` | `&lt;button x-ripple&gt;Click Me&lt;/button&gt;` |
| ✅ Valid | docs/architecture.md | 164 | `x-as-card` | `&lt;article x-as-card&gt;` |
| ✅ Valid | [docs/architecture/ATTRIBUTE-NAMING-STANDARD.md](../architecture/standards/ATTRIBUTE-NAMING-STANDARD.md) | 100 | `x-behavior` | `\| `x-behavior` \| **HAS-A** \| Extensions (adds capability) \| `x-ripple` \|` |
| ✅ Valid | [docs/architecture/ATTRIBUTE-NAMING-STANDARD.md](../architecture/standards/ATTRIBUTE-NAMING-STANDARD.md) | 100 | `x-ripple` | `\| `x-behavior` \| **HAS-A** \| Extensions (adds capability) \| `x-ripple` \|` |
| ⚠️ Invalid Morph Target | [docs/architecture/ATTRIBUTE-NAMING-STANDARD.md](../architecture/standards/ATTRIBUTE-NAMING-STANDARD.md) | 101 | `x-as-component` | `\| `x-as-component` \| **BECOMES** \| Morphing (transforms element) \| `x-as-card` \|` |
| ✅ Valid | [docs/architecture/ATTRIBUTE-NAMING-STANDARD.md](../architecture/standards/ATTRIBUTE-NAMING-STANDARD.md) | 101 | `x-as-card` | `\| `x-as-component` \| **BECOMES** \| Morphing (transforms element) \| `x-as-card` \|` |
| ✅ Valid | [docs/architecture/ATTRIBUTE-NAMING-STANDARD.md](../architecture/standards/ATTRIBUTE-NAMING-STANDARD.md) | 108 | `x-ripple` | `&lt;button x-ripple x-tooltip="Save changes"&gt;Save&lt;/button&gt;` |
| ✅ Valid | [docs/architecture/ATTRIBUTE-NAMING-STANDARD.md](../architecture/standards/ATTRIBUTE-NAMING-STANDARD.md) | 108 | `x-tooltip` | `&lt;button x-ripple x-tooltip="Save changes"&gt;Save&lt;/button&gt;` |
| ✅ Valid | [docs/architecture/ATTRIBUTE-NAMING-STANDARD.md](../architecture/standards/ATTRIBUTE-NAMING-STANDARD.md) | 111 | `x-as-card` | `&lt;article x-as-card&gt;Plain article becomes styled card&lt;/article&gt;` |
| ✅ Valid | [docs/architecture/ATTRIBUTE-NAMING-STANDARD.md](../architecture/standards/ATTRIBUTE-NAMING-STANDARD.md) | 357 | `x-ripple` | `&lt;button x-ripple&gt;Click me&lt;/button&gt;` |
| ✅ Valid | [docs/architecture/ATTRIBUTE-NAMING-STANDARD.md](../architecture/standards/ATTRIBUTE-NAMING-STANDARD.md) | 358 | `x-lazy` | `&lt;img x-lazy&gt;` |
| ✅ Valid | [docs/architecture/ATTRIBUTE-NAMING-STANDARD.md](../architecture/standards/ATTRIBUTE-NAMING-STANDARD.md) | 359 | `x-draggable` | `&lt;div x-draggable&gt;` |
| ✅ Valid | [docs/architecture/ATTRIBUTE-NAMING-STANDARD.md](../architecture/standards/ATTRIBUTE-NAMING-STANDARD.md) | 364 | `x-tooltip` | `&lt;button x-tooltip="Save changes"&gt;` |
| ✅ Valid | [docs/architecture/ATTRIBUTE-NAMING-STANDARD.md](../architecture/standards/ATTRIBUTE-NAMING-STANDARD.md) | 365 | `x-animate` | `&lt;div x-animate="bounce"&gt;` |
| 🔴 Invalid (Use Option) | [docs/architecture/ATTRIBUTE-NAMING-STANDARD.md](../architecture/standards/ATTRIBUTE-NAMING-STANDARD.md) | 366 | `x-delay` | `&lt;div x-delay="0.5"&gt;` |
| 🔴 Invalid (Use Option) | [docs/architecture/ATTRIBUTE-NAMING-STANDARD.md](../architecture/standards/ATTRIBUTE-NAMING-STANDARD.md) | 367 | `x-placeholder` | `&lt;img x-placeholder="blur"&gt;` |
| ❓ Unknown | [docs/architecture/ATTRIBUTE-NAMING-STANDARD.md](../architecture/standards/ATTRIBUTE-NAMING-STANDARD.md) | 370 | `x-as` | `### Morphing (x-as-)` |
| ✅ Valid | [docs/architecture/ATTRIBUTE-NAMING-STANDARD.md](../architecture/standards/ATTRIBUTE-NAMING-STANDARD.md) | 372 | `x-as-card` | `&lt;article x-as-card&gt;` |
| ⚠️ Invalid Morph Target | [docs/architecture/ATTRIBUTE-NAMING-STANDARD.md](../architecture/standards/ATTRIBUTE-NAMING-STANDARD.md) | 373 | `x-as-timeline` | `&lt;ul x-as-timeline&gt;` |
| ⚠️ Invalid Morph Target | [docs/architecture/ATTRIBUTE-NAMING-STANDARD.md](../architecture/standards/ATTRIBUTE-NAMING-STANDARD.md) | 374 | `x-as-testimonial` | `&lt;blockquote x-as-testimonial&gt;` |
| ✅ Valid | [docs/architecture/ATTRIBUTE-NAMING-STANDARD.md](../architecture/standards/ATTRIBUTE-NAMING-STANDARD.md) | 546 | `x-animate` | `&lt;div x-animate="fade" x-delay="0.3"&gt;  &lt;!-- 0.3 seconds --&gt;` |
| 🔴 Invalid (Use Option) | [docs/architecture/ATTRIBUTE-NAMING-STANDARD.md](../architecture/standards/ATTRIBUTE-NAMING-STANDARD.md) | 546 | `x-delay` | `&lt;div x-animate="fade" x-delay="0.3"&gt;  &lt;!-- 0.3 seconds --&gt;` |
| ✅ Valid | [docs/architecture/ATTRIBUTE-NAMING-STANDARD.md](../architecture/standards/ATTRIBUTE-NAMING-STANDARD.md) | 664 | `x-ripple` | `&lt;button x-ripple x-tooltip="Click me"&gt;` |
| ✅ Valid | [docs/architecture/ATTRIBUTE-NAMING-STANDARD.md](../architecture/standards/ATTRIBUTE-NAMING-STANDARD.md) | 664 | `x-tooltip` | `&lt;button x-ripple x-tooltip="Click me"&gt;` |
| ✅ Valid | [docs/architecture/ATTRIBUTE-NAMING-STANDARD.md](../architecture/standards/ATTRIBUTE-NAMING-STANDARD.md) | 678 | `x-ripple` | `\| `x-ripple` (modifier) \| `x-ripple` \|` |
| ✅ Valid | [docs/architecture/ATTRIBUTE-NAMING-STANDARD.md](../architecture/standards/ATTRIBUTE-NAMING-STANDARD.md) | 912 | `x-ripple` | `&lt;button x-ripple x-tooltip="Save your work"&gt;Save&lt;/button&gt;` |
| ✅ Valid | [docs/architecture/ATTRIBUTE-NAMING-STANDARD.md](../architecture/standards/ATTRIBUTE-NAMING-STANDARD.md) | 912 | `x-tooltip` | `&lt;button x-ripple x-tooltip="Save your work"&gt;Save&lt;/button&gt;` |
| ✅ Valid | [docs/architecture/ATTRIBUTE-NAMING-STANDARD.md](../architecture/standards/ATTRIBUTE-NAMING-STANDARD.md) | 915 | `x-animate` | `&lt;div x-animate="bounce" x-delay="0.5"&gt;Animated&lt;/div&gt;` |
| 🔴 Invalid (Use Option) | [docs/architecture/ATTRIBUTE-NAMING-STANDARD.md](../architecture/standards/ATTRIBUTE-NAMING-STANDARD.md) | 915 | `x-delay` | `&lt;div x-animate="bounce" x-delay="0.5"&gt;Animated&lt;/div&gt;` |
| ✅ Valid | [docs/architecture/ATTRIBUTE-NAMING-STANDARD.md](../architecture/standards/ATTRIBUTE-NAMING-STANDARD.md) | 918 | `x-lazy` | `&lt;img src="large.jpg" x-lazy x-placeholder="blur"&gt;` |
| 🔴 Invalid (Use Option) | [docs/architecture/ATTRIBUTE-NAMING-STANDARD.md](../architecture/standards/ATTRIBUTE-NAMING-STANDARD.md) | 918 | `x-placeholder` | `&lt;img src="large.jpg" x-lazy x-placeholder="blur"&gt;` |
| ✅ Valid | [docs/architecture/ATTRIBUTE-NAMING-STANDARD.md](../architecture/standards/ATTRIBUTE-NAMING-STANDARD.md) | 921 | `x-draggable` | `&lt;div x-draggable x-resizable&gt;Drag and resize me&lt;/div&gt;` |
| ✅ Valid | [docs/architecture/ATTRIBUTE-NAMING-STANDARD.md](../architecture/standards/ATTRIBUTE-NAMING-STANDARD.md) | 921 | `x-resizable` | `&lt;div x-draggable x-resizable&gt;Drag and resize me&lt;/div&gt;` |
| ✅ Valid | [docs/architecture/ATTRIBUTE-NAMING-STANDARD.md](../architecture/standards/ATTRIBUTE-NAMING-STANDARD.md) | 924 | `x-as-card` | `&lt;article x-as-card&gt;Becomes a card&lt;/article&gt;` |
| ⚠️ Invalid Morph Target | [docs/architecture/ATTRIBUTE-NAMING-STANDARD.md](../architecture/standards/ATTRIBUTE-NAMING-STANDARD.md) | 925 | `x-as-timeline` | `&lt;ul x-as-timeline&gt;Becomes a timeline&lt;/ul&gt;` |
| ✅ Valid | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 36 | `x-ripple` | `While **Behaviors** (`x-ripple`, `x-draggable`) allow you to add functionality to *existing* element` |
| ✅ Valid | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 36 | `x-draggable` | `While **Behaviors** (`x-ripple`, `x-draggable`) allow you to add functionality to *existing* element` |
| ✅ Valid | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 97 | `x-ripple` | `│   │  - Structure         │            │  - x-ripple                  │   │` |
| ✅ Valid | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 98 | `x-tooltip` | `│   │  - Styles            │            │  - x-tooltip                 │   │` |
| ✅ Valid | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 99 | `x-draggable` | `│   │  - Data Bindings     │            │  - x-draggable               │   │` |
| ✅ Valid | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 220 | `x-ripple` | `x-ripple` |
| ✅ Valid | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 221 | `x-tooltip` | `x-tooltip="{{tooltip \|\| label}}"&gt;` |
| ✅ Valid | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 295 | `x-ripple` | `&lt;div class="tile" draggable="true" x-ripple x-tooltip="{{tooltip \|\| label}}"&gt;` |
| ✅ Valid | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 295 | `x-tooltip` | `&lt;div class="tile" draggable="true" x-ripple x-tooltip="{{tooltip \|\| label}}"&gt;` |
| ✅ Valid | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 303 | `x-ripple` | `&lt;div class="tile" draggable="true" x-ripple x-tooltip="{{tooltip \|\| label}}"&gt;` |
| ✅ Valid | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 303 | `x-tooltip` | `&lt;div class="tile" draggable="true" x-ripple x-tooltip="{{tooltip \|\| label}}"&gt;` |
| ✅ Valid | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 324 | `x-ripple` | `&lt;div class="tile" draggable="true" x-ripple x-tooltip="{{tooltip \|\| label}}"&gt;` |
| ✅ Valid | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 324 | `x-tooltip` | `&lt;div class="tile" draggable="true" x-ripple x-tooltip="{{tooltip \|\| label}}"&gt;` |
| ✅ Valid | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 345 | `x-ripple` | `// Behaviors (x-ripple, x-tooltip) are auto-applied by WB.scan()` |
| ✅ Valid | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 345 | `x-tooltip` | `// Behaviors (x-ripple, x-tooltip) are auto-applied by WB.scan()` |
| ✅ Valid | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 356 | `x-tooltip` | `\| Add tooltip to all tiles \| Add `x-tooltip="{{label}}"` \| All tiles \|` |
| ✅ Valid | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 357 | `x-ripple` | `\| Add ripple effect \| Add `x-ripple` \| All tiles \|` |
| ✅ Valid | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 362 | `x-animate` | `\| Add animation \| Add `x-animate="fadeIn"` \| All tiles \|` |
| ✅ Valid | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 393 | `x-ripple` | `// Want to add x-ripple? Edit ALL THREE files!` |
| ✅ Valid | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 405 | `x-ripple` | `&lt;div class="tile" draggable="true" x-ripple x-tooltip="{{label}}"&gt;` |
| ✅ Valid | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 405 | `x-tooltip` | `&lt;div class="tile" draggable="true" x-ripple x-tooltip="{{label}}"&gt;` |
| ✅ Valid | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 417 | `x-ripple` | `**Want to add `x-ripple`?** Add it to the template. Done. All tiles have it.` |
| ✅ Valid | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 845 | `x-ripple` | `x-ripple` |
| ✅ Valid | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 846 | `x-tooltip` | `x-tooltip="{{tooltip}}"&gt;` |
| ❓ Unknown | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 858 | `x-as` | `### Using `x-as-*` Morphs` |
| ✅ Valid | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 862 | `x-as-card` | `&lt;section x-as-card elevated hoverable&gt;` |
| ✅ Valid | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 877 | `x-ripple` | `x-ripple` |
| ✅ Valid | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 878 | `x-draggable` | `x-draggable` |
| ✅ Valid | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 879 | `x-tooltip` | `x-tooltip="{{label}}"` |
| ✅ Valid | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 1087 | `x-as-card` | `&lt;article class="pricing-card" x-as-card elevated&gt;` |
| ✅ Valid | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 1229 | `x-ripple` | `&lt;div class="tile" draggable="true" x-ripple&gt;` |
| ❌ Invalid (AlpineJS?) | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 1496 | `x-data` | `&lt;!-- Define: Reusable via x-data --&gt;` |
| ❌ Invalid (AlpineJS?) | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 1498 | `x-data` | `&lt;div class="card" x-data="{ name: '', avatar: '', role: '', verified: false }"&gt;` |
| ❌ Invalid (AlpineJS?) | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 1500 | `x-text` | `&lt;h3 x-text="name"&gt;&lt;/h3&gt;` |
| ❌ Invalid (AlpineJS?) | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 1501 | `x-text` | `&lt;p x-text="role"&gt;&lt;/p&gt;` |
| ❌ Invalid (AlpineJS?) | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 1502 | `x-show` | `&lt;span class="badge" x-show="verified"&gt;✓ Verified&lt;/span&gt;` |
| ✅ Valid | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 1563 | `x-ripple` | `4. **Behavior integration** — `x-ripple`, `x-tooltip` work after render` |
| ✅ Valid | [docs/architecture/WBVIEWS.md](../architecture/WBVIEWS.md) | 1563 | `x-tooltip` | `4. **Behavior integration** — `x-ripple`, `x-tooltip` work after render` |
| ✅ Valid | [docs/Auto-Injection.md](../Auto-Injection.md) | 21 | `x-ripple` | `It applies the default behavior for the element type. You can add *additional* behaviors using expli` |
| ✅ Valid | [docs/Auto-Injection.md](../Auto-Injection.md) | 21 | `x-as-card` | `It applies the default behavior for the element type. You can add *additional* behaviors using expli` |
| ✅ Valid | [docs/Auto-Injection.md](../Auto-Injection.md) | 27 | `x-ripple` | `&lt;button x-ripple&gt;Click Me&lt;/button&gt;` |
| ✅ Valid | [docs/Auto-Injection.md](../Auto-Injection.md) | 31 | `x-as-hero` | `&lt;article x-as-hero&gt;...&lt;/article&gt;` |
| ✅ Valid | [docs/Auto-Injection.md](../Auto-Injection.md) | 83 | `x-as-card` | `&lt;article x-as-card&gt;` |
| ✅ Valid | [docs/Auto-Injection.md](../Auto-Injection.md) | 100 | `x-as-navbar` | `&lt;nav x-as-navbar&gt;` |
| ✅ Valid | [docs/Auto-Injection.md](../Auto-Injection.md) | 118 | `x-dialog` | `&lt;dialog x-dialog&gt;...&lt;/div&gt;` |
| ✅ Valid | [docs/Auto-Injection.md](../Auto-Injection.md) | 151 | `x-as-hero` | `&lt;article x-as-hero&gt;` |
| ✅ Valid | [docs/behaviors-reference.md](../behaviors-reference.md) | 29 | `x-ripple` | `&lt;button x-ripple&gt;Click Me&lt;/button&gt;` |
| ✅ Valid | [docs/behaviors-reference.md](../behaviors-reference.md) | 32 | `x-tooltip` | `&lt;div x-tooltip="Hello World"&gt;Hover Me&lt;/div&gt;` |
| ❓ Unknown | [docs/behaviors-reference.md](../behaviors-reference.md) | 43 | `x-as` | `### 2. Morphing (`x-as-{behavior}`)` |
| ✅ Valid | [docs/behaviors-reference.md](../behaviors-reference.md) | 48 | `x-as-card` | `&lt;article x-as-card&gt;` |
| ℹ️  False Positive (Text) | [docs/INTELLISENSE-TOOLTIPS.md](../INTELLISENSE-TOOLTIPS.md) | 707 | `x-axis` | `\| `xalign` \| Horizontal content alignment (x-axis) \|` |
| ℹ️  False Positive (Text) | [docs/INTELLISENSE-TOOLTIPS.md](../INTELLISENSE-TOOLTIPS.md) | 911 | `x-axis` | `\| `xalign` \| Horizontal text alignment (x-axis) \|` |
| ❓ Unknown | [docs/standards/V3-STANDARDS.md](../standards/V3-STANDARDS.md) | 23 | `x-behaviorname` | `### Behaviors: `x-behaviorname`` |
| ✅ Valid | [docs/standards/V3-STANDARDS.md](../standards/V3-STANDARDS.md) | 29 | `x-ripple` | `&lt;button x-ripple&gt;Click me&lt;/button&gt;` |
| ✅ Valid | [docs/standards/V3-STANDARDS.md](../standards/V3-STANDARDS.md) | 30 | `x-tooltip` | `&lt;span x-tooltip="Helpful tip"&gt;Hover me&lt;/span&gt;` |
| ✅ Valid | [docs/standards/V3-STANDARDS.md](../standards/V3-STANDARDS.md) | 31 | `x-animate` | `&lt;div x-animate="fadeIn"&gt;Animated&lt;/div&gt;` |
| ✅ Valid | [docs/standards/V3-STANDARDS.md](../standards/V3-STANDARDS.md) | 32 | `x-sticky` | `&lt;nav x-sticky&gt;Sticky nav&lt;/nav&gt;` |
| ✅ Valid | [docs/standards/V3-STANDARDS.md](../standards/V3-STANDARDS.md) | 282 | `x-ripple` | `&lt;button x-ripple&gt;Click me&lt;/button&gt;` |
| ✅ Valid | [docs/standards/V3-STANDARDS.md](../standards/V3-STANDARDS.md) | 309 | `x-ripple` | `│  &lt;button x-ripple&gt;                                      │` |
| ✅ Valid | [docs/standards/V3-STANDARDS.md](../standards/V3-STANDARDS.md) | 310 | `x-tooltip` | `│  &lt;span x-tooltip="Tip text"&gt;                            │` |
| ✅ Valid | [docs/standards/V3-STANDARDS.md](../standards/V3-STANDARDS.md) | 311 | `x-animate` | `│  &lt;div x-animate="fadeIn"&gt;                               │` |
| ✅ Valid | [docs/standards/V3-STANDARDS.md](../standards/V3-STANDARDS.md) | 312 | `x-sticky` | `│  &lt;header x-sticky&gt;                                      │` |
| ✅ Valid | [docs/standards/V3-STANDARDS.md](../standards/V3-STANDARDS.md) | 346 | `x-ripple` | `│         Examples: x-ripple, x-tooltip, x-sticky` |
| ✅ Valid | [docs/standards/V3-STANDARDS.md](../standards/V3-STANDARDS.md) | 346 | `x-tooltip` | `│         Examples: x-ripple, x-tooltip, x-sticky` |
| ✅ Valid | [docs/standards/V3-STANDARDS.md](../standards/V3-STANDARDS.md) | 346 | `x-sticky` | `│         Examples: x-ripple, x-tooltip, x-sticky` |


## Summary
- **✅ Valid:** 92
- **⚠️ Invalid Morph Target:** 5
- **ℹ️  False Positive (Text):** 2
- **🔴 Invalid (Use Option):** 4
- **❌ Invalid (AlpineJS?):** 5
- **❓ Unknown:** 4

# Form Components Documentation
[Edit this file](vscode://file/c:/Users/jwpmi/Downloads/AI/wb-starter/docs/components/forms/forms.readme.md)

## Overview
Web Behaviors (WB) provides accessible, styled form controls with validation support. All form components use semantic HTML and follow accessibility standards.

---

## Input Component

Text input field with various types and validation.

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string | "text" | Input type: text, email, password, etc. |
| `placeholder` | string | "" | Placeholder text |
| `label` | string | "" | Label text |
| `value` | string | "" | Initial value |
| `required` | boolean | false | Required field |
| `disabled` | boolean | false | Disabled state |
| `readonly` | boolean | false | Read-only state |
| `pattern` | string | "" | Validation pattern (regex) |
| `minlength` | number | - | Minimum length |
| `maxlength` | number | - | Maximum length |

### Usage Examples

```html
<!-- Basic text input -->
<wb-input label="Full Name" placeholder="Enter your name" required></wb-input>

<!-- Email input with validation -->
<wb-input
  type="email"
  label="Email Address"
  placeholder="you@example.com"
  required>
</wb-input>

<!-- Password input -->
<wb-input
  type="password"
  label="Password"
  placeholder="Enter password"
  minlength="8"
  required>
</wb-input>
```

---

## Textarea Component

Multi-line text input with auto-resize capability.

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `placeholder` | string | "" | Placeholder text |
| `label` | string | "" | Label text |
| `rows` | number | 4 | Number of visible rows |
| `resize` | string | "vertical" | Resize behavior: none, vertical, horizontal, both |
| `autosize` | boolean | false | Auto-grow height based on content |
| `maxlength` | number | - | Maximum character count |

### Usage Examples

```html
<!-- Basic textarea -->
<wb-textarea label="Message" placeholder="Enter your message" rows="6"></wb-textarea>

<!-- Auto-sizing textarea -->
<wb-textarea
  label="Comments"
  placeholder="Share your thoughts..."
  autosize
  maxlength="500">
</wb-textarea>
```

---

## Checkbox Component

Checkbox input with custom styling and indeterminate state support.

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `label` | string | "" | Label text |
| `checked` | boolean | false | Checked state |
| `disabled` | boolean | false | Disabled state |
| `indeterminate` | boolean | false | Indeterminate state |
| `required` | boolean | false | Required field |

### Usage Examples

```html
<!-- Basic checkbox -->
<wb-checkbox label="I agree to the terms" required></wb-checkbox>

<!-- Pre-checked checkbox -->
<wb-checkbox label="Subscribe to newsletter" checked></wb-checkbox>

<!-- Indeterminate checkbox -->
<wb-checkbox label="Select all" indeterminate></wb-checkbox>
```

---

## Switch Component

Toggle switch component (styled checkbox alternative).

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `label` | string | "" | Label text |
| `checked` | boolean | false | On/off state |
| `disabled` | boolean | false | Disabled state |
| `size` | string | "medium" | Size: small, medium, large |
| `color` | string | "primary" | Active color theme |

### Usage Examples

```html
<!-- Basic switch -->
<wb-switch label="Enable notifications"></wb-switch>

<!-- Large switch -->
<wb-switch label="Dark mode" size="large" checked></wb-switch>
```

---

## Select Component

Dropdown select with search and multi-select support.

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `label` | string | "" | Label text |
| `placeholder` | string | "" | Placeholder text |
| `multiple` | boolean | false | Allow multiple selections |
| `searchable` | boolean | false | Enable search/filtering |
| `disabled` | boolean | false | Disabled state |
| `required` | boolean | false | Required field |

### Usage Examples

```html
<!-- Basic select -->
<wb-select label="Country">
  <option value="us">United States</option>
  <option value="ca">Canada</option>
  <option value="uk">United Kingdom</option>
</wb-select>

<!-- Multi-select -->
<wb-select label="Skills" multiple searchable>
  <option value="js">JavaScript</option>
  <option value="py">Python</option>
  <option value="java">Java</option>
</wb-select>
```

---

## Rating Component

Star rating input component.

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `max` | number | 5 | Maximum rating value |
| `value` | number | 0 | Current rating value |
| `half` | boolean | false | Allow half-star ratings |
| `readonly` | boolean | false | Display-only mode |
| `size` | string | "medium" | Size: small, medium, large |

### Usage Examples

```html
<!-- Basic rating -->
<wb-rating label="Rate this product"></wb-rating>

<!-- Half-star rating -->
<wb-rating max="10" half value="7.5" readonly></wb-rating>
```

---

## Form Validation

All form components support HTML5 validation with custom error messages.

### Validation Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `required` | boolean | Field is required |
| `pattern` | string | Regex validation pattern |
| `minlength` | number | Minimum character length |
| `maxlength` | number | Maximum character length |
| `min` | number/string | Minimum value |
| `max` | number/string | Maximum value |

### Custom Error Messages

```html
<wb-input
  label="Email"
  type="email"
  required
  data-error-required="Email is required"
  data-error-type="Please enter a valid email address">
</wb-input>
```

### Validation States

```css
.wb-input--valid {
  border-color: var(--success-color);
}

.wb-input--invalid {
  border-color: var(--error-color);
}

.wb-input__error {
  color: var(--error-color);
  font-size: 0.875rem;
  margin-top: 0.25rem;
}
```

---

## Events

All form components emit standard events plus WB-specific events:

| Event | Description | Detail |
|-------|-------------|--------|
| `change` | Value changed | `{ value, element }` |
| `input` | Input event | `{ value, element }` |
| `focus` | Element focused | `{ element }` |
| `blur` | Element blurred | `{ element, valid }` |
| `wb:validate` | Validation run | `{ element, valid, errors }` |

### Form Submission

```html
<form>
  <wb-input label="Name" required></wb-input>
  <wb-input label="Email" type="email" required></wb-input>
  <button type="submit">Submit</button>
</form>
```

```javascript
document.querySelector('form').addEventListener('submit', (e) => {
  e.preventDefault();
  // Handle form submission
  console.log('Form submitted');
});
```

---

## Accessibility

All form components include:

- **Semantic HTML**: Proper `<label>`, `<input>`, `<textarea>` elements
- **ARIA Support**: `aria-label`, `aria-describedby`, `aria-invalid`
- **Keyboard Navigation**: Tab order, Enter/Space activation
- **Screen Reader**: Proper announcements and error descriptions
- **Focus Management**: Visible focus indicators and logical tab order

---

## Styling

Form components use CSS custom properties for consistent theming:

```css
:root {
  /* Form colors */
  --form-bg: var(--bg-secondary);
  --form-border: var(--border-color);
  --form-text: var(--text-primary);
  --form-placeholder: var(--text-muted);

  /* Validation colors */
  --form-valid: var(--success-color);
  --form-invalid: var(--error-color);

  /* Focus styles */
  --form-focus-border: var(--accent-color);
  --form-focus-shadow: 0 0 0 2px rgba(var(--accent-rgb), 0.2);
}
```

---

## Implementation
- **Components**: Located in `src/wb-viewmodels/` (input.js, textarea.js, etc.)
- **Styles**: [src/styles/components/forms.css](../../src/styles/components/forms.css)
- **Schemas**: Form component schemas in `src/wb-models/`
- **Tests**: Form tests in `tests/behaviors/ui/forms.spec.ts`
